import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Upload, Download, FileVideo, Play, Settings, AlertCircle, Check, Loader2, Terminal } from 'lucide-react';
import { saveAs } from 'file-saver';

const VideoCompressor = () => {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [outputVideoUrl, setOutputVideoUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, loading_ffmpeg, ready, compressing, done, error
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [outputFileSize, setOutputFileSize] = useState(null); // 压缩后文件大小
  const abortControllerRef = useRef(null); // 用于中断压缩
  
  // Settings
  const [resolution, setResolution] = useState('original'); // original, 720p, 480p
  const [format, setFormat] = useState('mp4'); // mp4, webm
  const [quality, setQuality] = useState('medium'); // high (crf 18), medium (crf 23), low (crf 28)

  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef(null);
  const isAbortedRef = useRef(false); // 用于标记是否中断
  
  // 全局addLog函数
  const addLog = (message) => {
    setLogs(prev => [...prev.slice(-100), message]);
    console.log(message);
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setStatus('loading_ffmpeg');
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message, type }) => {
      // 添加日志类型前缀，方便区分
      const logMessage = type === 'stderr' ? `[stderr] ${message}` : `[stdout] ${message}`;
      setLogs(prev => [...prev.slice(-100), logMessage]);
      console.log(logMessage);
      if (messageRef.current) {
        messageRef.current.scrollTop = messageRef.current.scrollHeight;
      }
    });
    
    // 添加错误日志监听
    ffmpeg.on('error', (error) => {
      const errorMessage = `[error] ${error.message || error}`;
      setLogs(prev => [...prev.slice(-100), errorMessage]);
      console.error(errorMessage);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      // 使用 @ffmpeg/ffmpeg 内置的加载方式，它会自动处理 COOP/COEP 问题
      addLog('正在加载FFmpeg...');
      await ffmpeg.load();
      addLog('FFmpeg加载成功');
      setLoaded(true);
      setStatus('idle');
      setFfmpeg(ffmpeg);
    } catch (err) {
      console.error(err);
      setError("无法加载 FFmpeg 组件。请确保您使用的是最新版 Chrome/Edge/Firefox 浏览器，且当前环境支持 SharedArrayBuffer (需要 COOP/COEP 响应头)。");
      setStatus('error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (500MB limit recommendation)
    if (file.size > 500 * 1024 * 1024) {
      setError("文件过大 (超过 500MB)，浏览器可能无法处理。建议使用较小的视频文件。");
      return;
    }

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setOutputVideoUrl('');
    setOutputFileSize(null);
    setProgress(0);
    setLogs([]);
    setError(null);
    setStatus('ready');
  };

  // 中断压缩
  const abortCompression = async () => {
    addLog('用户请求中断压缩...');
    isAbortedRef.current = true;
    
    const ffmpeg = ffmpegRef.current;
    
    try {
      // 终止 FFmpeg 进程
      ffmpeg.terminate();
      addLog('FFmpeg 进程已终止');
      
      // 重新初始化 FFmpeg 实例
      ffmpegRef.current = new FFmpeg();
      
      // 重新加载 FFmpeg 以便下次使用
      setLoaded(false);
      setTimeout(async () => {
        await load();
      }, 500);
      
    } catch (e) {
      addLog('终止 FFmpeg 时出错: ' + e.message);
    }
    
    setStatus('ready');
    setProgress(0);
    setOutputVideoUrl('');
  };

  const compress = async () => {
    if (!loaded || !videoFile) return;

    // 重置中断标记
    isAbortedRef.current = false;

    setStatus('compressing');
    setProgress(0);
    setOutputFileSize(null);
    setLogs([]);
    setError(null);
    setShowLogs(true); // 自动显示日志

    const ffmpeg = ffmpegRef.current;
    const inputFileName = 'input' + getExtension(videoFile.name);
    const outputFileName = 'output.' + format;

    try {
      addLog('开始压缩，输入文件: ' + inputFileName + '，输出文件: ' + outputFileName);
      addLog('视频文件大小: ' + videoFile.size + ' bytes');
      
      // 写入输入文件
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
      addLog('输入文件写入成功');
      
      // 验证输入文件是否写入成功
      const inputFiles = await ffmpeg.listDir('.');
      addLog('写入后的文件列表: ' + JSON.stringify(inputFiles, null, 2));
      const inputFileExists = inputFiles.some(file => file.name === inputFileName && !file.isDir);
      addLog('输入文件是否存在: ' + inputFileExists);

      let args = ['-i', inputFileName];

      // Resolution
      // 使用trunc函数确保宽度和高度都是偶数（libx264要求）
      if (resolution !== 'original') {
        const scaleFilter = resolution === '720p' 
          ? 'scale=trunc(oh*a/2)*2:720'  // 高度720，宽度自适应并确保为偶数
          : 'scale=trunc(oh*a/2)*2:480'; // 高度480，宽度自适应并确保为偶数
        args.push('-vf', scaleFilter);
      }

      // Quality (CRF)
      let crf = '23';
      if (quality === 'high') crf = '18';
      if (quality === 'low') crf = '28';
      
      // 使用更简单的FFmpeg命令
      // 对于MP4格式，使用更基本的编码参数
      if (format === 'mp4') {
        args.push('-c:v', 'libx264');
        args.push('-crf', crf);
        args.push('-preset', 'ultrafast');
        args.push('-c:a', 'copy');
        args.push('-movflags', '+faststart'); // 优化网络播放
      } else if (format === 'webm') {
        // 使用VP8代替VP9，VP8更轻量且内存占用更少
        args.push('-c:v', 'libvpx');
        args.push('-crf', crf);
        args.push('-b:v', '1M'); // 限制视频比特率
        args.push('-deadline', 'realtime'); // 实时模式，更快但质量稍低
        args.push('-cpu-used', '5'); // 使用更快的编码速度
        // WebM不支持AAC音频，需要转换为Vorbis（比Opus更轻量）
        args.push('-c:a', 'libvorbis');
        args.push('-q:a', '4'); // Vorbis质量设置
      }
      
      // 添加-y参数强制覆盖输出文件
      args.unshift('-y');

      args.push(outputFileName);

      addLog('FFmpeg 命令: ' + args.join(' '));

      // 执行 FFmpeg 命令
      try {
        addLog('开始执行FFmpeg命令...');
        const exitCode = await ffmpeg.exec(args);
        
        // 检查是否已中断
        if (isAbortedRef.current) {
          addLog('压缩已被用户中断，忽略结果');
          return;
        }
        
        addLog('FFmpeg 命令执行完成，退出码: ' + exitCode);
        
        // 检查退出码
        if (exitCode !== 0) {
          throw new Error(`FFmpeg 命令执行失败，退出码: ${exitCode}`);
        }
        
        addLog('FFmpeg 命令执行成功');
      } catch (execError) {
        // 检查是否已中断
        if (isAbortedRef.current) {
          addLog('压缩已被用户中断');
          return;
        }
        
        addLog('FFmpeg 命令执行失败: ' + execError.message);
        addLog('FFmpeg 命令执行失败详情: ' + JSON.stringify(execError, null, 2));
        setError(`压缩失败: FFmpeg 命令执行错误 - ${execError.message}。请检查 FFmpeg 日志获取详细信息。`);
        setStatus('error');
        return;
      }

      // 检查输出文件是否存在
      try {
        // 尝试列出目录内容，查看文件是否生成
        const files = await ffmpeg.listDir('.');
        addLog('FFmpeg 工作目录文件: ' + JSON.stringify(files, null, 2));
        
        // 检查输出文件是否在目录列表中
        const outputFileExists = files.some(file => file.name === outputFileName && !file.isDir);
        addLog('输出文件是否存在: ' + outputFileExists);
        
        if (!outputFileExists) {
          throw new Error('输出文件未生成');
        }
        
        // 尝试读取文件
        let data;
        try {
          // 尝试多次读取，可能需要等待文件写入完成
          let retries = 5;
          let readSuccess = false;
          
          while (retries > 0 && !readSuccess) {
              try {
                addLog(`尝试读取文件，剩余重试次数: ${retries}`);
                
                // 读取文件 - ffmpeg.readFile 返回 Uint8Array
                const uint8Data = await ffmpeg.readFile(outputFileName);
                
                addLog('读取文件成功，数据类型: ' + (uint8Data ? uint8Data.constructor.name : 'null'));
                addLog('读取文件成功，数据长度: ' + (uint8Data ? uint8Data.length : 0));
                addLog('读取文件成功，数据byteLength: ' + (uint8Data && uint8Data.buffer ? uint8Data.buffer.byteLength : 0));
                
                // 检查数据是否有效
                if (uint8Data && uint8Data.length > 0) {
                  data = uint8Data;
                  readSuccess = true;
                  addLog('读取文件成功，数据有效，大小: ' + uint8Data.length + ' bytes');
                } else {
                  addLog('读取文件成功但数据为空，重试...');
                  retries--;
                  // 等待一段时间后重试
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              } catch (readFileError) {
                addLog('读取文件时出错: ' + readFileError.message);
                addLog('读取文件错误详情: ' + JSON.stringify(readFileError, null, 2));
                retries--;
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          
          if (!readSuccess) {
            throw new Error('多次尝试后仍无法读取有效的文件数据');
          }
        } catch (readFileError) {
          console.error('读取文件时出错:', readFileError);
          throw new Error(`读取文件时出错: ${readFileError.message}`);
        }
        
        // 确保数据存在且有内容
        if (!data) {
          throw new Error('读取文件返回的数据为null或undefined');
        }
        if (data.length === 0) {
          throw new Error('压缩后的视频数据为空');
        }
        
        // 创建正确的 MIME 类型
        let mimeType;
        if (format === 'mp4') {
          mimeType = 'video/mp4';
        } else if (format === 'webm') {
          mimeType = 'video/webm';
        } else {
          mimeType = 'video/mp4'; // 默认使用 mp4
        }
        
        // 检查是否已中断
        if (isAbortedRef.current) {
          addLog('压缩已被用户中断，不生成输出文件');
          return;
        }
        
        // 创建 blob 并生成 URL
        // data 是 Uint8Array，直接使用它创建 Blob
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        addLog('生成 blob URL 成功');
        
        // 保存压缩后文件大小
        setOutputFileSize(data.length);
        addLog('压缩后文件大小: ' + data.length + ' bytes');
        
        setOutputVideoUrl(url);
        setStatus('done');
      } catch (readError) {
        addLog('读取输出文件时出错: ' + readError.message);
        addLog('读取输出文件错误详情: ' + JSON.stringify(readError, null, 2));
        // 尝试获取 FFmpeg 日志以获取更多信息
        setError(`压缩失败: ${readError.message}。请检查浏览器控制台和 FFmpeg 日志获取详细信息。`);
        setStatus('error');
      }
    } catch (err) {
      addLog('压缩过程中发生错误: ' + err.message);
      addLog('错误详情: ' + JSON.stringify(err, null, 2));
      setError("压缩过程中发生错误: " + err.message);
      setStatus('error');
    } finally {
        // Cleanup file system if needed, though refreshing page clears it
        try {
            await ffmpeg.deleteFile(inputFileName);
            // await ffmpeg.deleteFile(outputFileName); // Keep it for download? No, we have blob URL.
        } catch(e) {}
    }
  };

  const getExtension = (filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {!loaded && status !== 'error' ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
          <Loader2 size={48} className="animate-spin mb-4 text-theme-primary" />
          <p className="text-lg">正在加载视频转码引擎 (FFmpeg WASM)...</p>
          <p className="text-sm mt-2">首次加载可能需要几秒钟</p>
        </div>
      ) : status === 'error' && !videoFile ? (
         <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">组件加载失败</h3>
            <p className="text-red-600 dark:text-red-300 max-w-lg mx-auto">{error}</p>
            <button 
               onClick={() => window.location.reload()}
               className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
               刷新页面重试
            </button>
         </div>
      ) : (
        <div className="space-y-8">
          {/* Upload Area */}
          <div className="bg-div-theme rounded-xl shadow-sm border border-div-theme overflow-hidden">
             {!videoFile ? (
                <div 
                  className="p-12 text-center border-2 border-dashed border-div-theme hover:border-theme-primary hover:bg-theme-primary/5 transition-all cursor-pointer m-4 rounded-xl"
                  onClick={() => document.getElementById('video-upload').click()}
                >
                   <input 
                      id="video-upload"
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      onChange={handleFileUpload}
                   />
                   <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-theme-primary">
                      <FileVideo size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-theme-primary mb-2">
                      点击上传或拖拽视频文件
                   </h3>
                   <p className="text-theme-secondary">
                      支持 MP4, MOV, WebM 等格式 (建议 &lt; 500MB)
                   </p>
                </div>
             ) : (
                <div className="p-6">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center text-theme-primary">
                            <FileVideo size={24} />
                         </div>
                         <div>
                            <h3 className="font-bold text-theme-primary truncate max-w-[200px] md:max-w-md">
                               {videoFile.name}
                            </h3>
                            <p className="text-sm text-theme-secondary">
                               {formatSize(videoFile.size)}
                            </p>
                         </div>
                      </div>
                      <button 
                         onClick={() => { setVideoFile(null); setStatus('idle'); setOutputVideoUrl(''); setOutputFileSize(null); }}
                         className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                         重新上传
                      </button>
                   </div>

                   {status === 'ready' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                         <div>
                            <label className="block text-sm font-medium text-theme-primary mb-2">
                               目标分辨率
                            </label>
                            <select 
                               value={resolution}
                               onChange={(e) => setResolution(e.target.value)}
                               className="w-full p-2 rounded-lg border border-div-theme bg-div-theme text-theme-primary focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            >
                               <option value="original">保持原样 (Original)</option>
                               <option value="720p">720p (HD)</option>
                               <option value="480p">480p (SD)</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-theme-primary mb-2">
                               压缩质量 (CRF)
                            </label>
                            <select 
                               value={quality}
                               onChange={(e) => setQuality(e.target.value)}
                               className="w-full p-2 rounded-lg border border-div-theme bg-div-theme text-theme-primary focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            >
                               <option value="high">高质量 (大文件)</option>
                               <option value="medium">平衡 (推荐)</option>
                               <option value="low">低质量 (小文件)</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-theme-primary mb-2">
                               输出格式
                            </label>
                            <select 
                               value={format}
                               onChange={(e) => setFormat(e.target.value)}
                               className="w-full p-2 rounded-lg border border-div-theme bg-div-theme text-theme-primary focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            >
                               <option value="mp4">MP4 (通用)</option>
                               <option value="webm">WebM (Web 优化)</option>
                            </select>
                         </div>
                      </div>
                   )}

                   {status === 'ready' && (
                      <button 
                         onClick={compress}
                         className="w-full py-3 bg-accent text-white rounded-xl font-bold text-lg hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all transform active:scale-[0.98]"
                      >
                         开始压缩
                      </button>
                   )}

                   {status === 'compressing' && (
                      <div className="space-y-4">
                         <div className="flex justify-between text-sm font-medium text-theme-secondary">
                            <span>正在处理...</span>
                            <span>{progress}%</span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div 
                               className="h-full rounded-full transition-all duration-300 progress-bar-striped"
                               style={{ 
                                 width: `${progress}%`,
                                 background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%)',
                                 backgroundSize: '200% 100%',
                                 animation: 'progress-stripes 1s linear infinite'
                               }}
                            ></div>
                         </div>
                         <div className="flex gap-3">
                            <button 
                               onClick={abortCompression}
                               className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all transform active:scale-[0.98] shadow-lg shadow-red-500/20"
                            >
                               中断压缩
                            </button>
                         </div>
                         <p className="text-center text-xs text-gray-400">
                            请勿关闭页面，视频处理可能需要几分钟...
                         </p>
                      </div>
                   )}

                   {status === 'error' && videoFile && (
                      <div className="text-center space-y-6 animate-fade-in">
                         <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle size={32} />
                         </div>
                         <div>
                            <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
                               压缩失败
                            </h3>
                            <p className="text-red-600 dark:text-red-300 max-w-md mx-auto">
                               {error || "视频压缩过程中出现错误，请重试"}
                            </p>
                         </div>
                         <div className="flex gap-3 justify-center">
                            <button 
                               onClick={() => { setVideoFile(null); setStatus('idle'); setOutputVideoUrl(''); setOutputFileSize(null); setError(null); }}
                               className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-red-500/20 cursor-pointer"
                            >
                               重新上传
                            </button>
                            <button 
                               onClick={() => { setStatus('ready'); setError(null); }}
                               className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-accent/20 cursor-pointer"
                            >
                               重试压缩
                            </button>
                         </div>
                      </div>
                   )}

                   {status === 'done' && (
                      <div className="text-center space-y-6 animate-fade-in">
                         <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                            <Check size={32} />
                         </div>
                         <div>
                            <h3 className="text-2xl font-bold text-theme-primary mb-2">
                               压缩完成!
                            </h3>
                            <p className="text-theme-secondary">
                               您的视频已准备好下载
                            </p>
                            {outputFileSize && (
                               <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg inline-block border border-green-200 dark:border-green-800">
                                  <p className="text-sm text-green-900 dark:text-green-100">
                                     <span className="font-bold">原始大小:</span> {formatSize(videoFile.size)}
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100">
                                     <span className="font-bold">压缩后大小:</span> {formatSize(outputFileSize)}
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100">
                                     <span className="font-bold">压缩率:</span> {((1 - outputFileSize / videoFile.size) * 100).toFixed(1)}%
                                  </p>
                               </div>
                            )}
                         </div>
                         <a 
                            href={outputVideoUrl}
                            download={`compressed_${videoFile.name.split('.')[0]}.${format}`}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                         >
                            <Download size={20} />
                            下载视频
                         </a>
                         <div className="mt-4">
                            <video 
                               src={outputVideoUrl} 
                               controls 
                               className="w-full max-h-[300px] rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                         </div>
                      </div>
                   )}
                </div>
             )}
          </div>

          {/* Logs */}
          <div className="bg-div-theme rounded-xl overflow-hidden shadow-sm border border-div-theme">
             <div 
                className="px-4 py-2 bg-div-theme/80 flex items-center justify-between cursor-pointer"
                onClick={() => setShowLogs(!showLogs)}
             >
                <div className="flex items-center gap-2 text-theme-secondary text-sm font-mono">
                   <Terminal size={14} />
                   <span>FFmpeg Logs</span>
                </div>
                <div className="text-xs text-theme-secondary">
                   {showLogs ? '隐藏' : '显示'}
                </div>
             </div>
             {showLogs && (
                <div 
                   ref={messageRef}
                   className="p-4 h-48 overflow-y-auto font-mono text-xs text-green-400 bg-div-theme/90 custom-scrollbar"
                >
                   {logs.length === 0 ? (
                      <span className="text-theme-secondary">Waiting for logs...</span>
                   ) : (
                      logs.map((log, i) => <div key={i}>{log}</div>)
                   )}
                </div>
             )}
          </div>
        </div>
      )}

      {/* 样式已移至外部 CSS 或使用内联样式 */}
    </div>
  );
};

export default VideoCompressor;
