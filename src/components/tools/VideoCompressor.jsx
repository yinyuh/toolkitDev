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
  
  // Settings
  const [resolution, setResolution] = useState('original'); // original, 720p, 480p
  const [format, setFormat] = useState('mp4'); // mp4, webm
  const [quality, setQuality] = useState('medium'); // high (crf 18), medium (crf 23), low (crf 28)

  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setStatus('loading_ffmpeg');
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message }) => {
      setLogs(prev => [...prev.slice(-100), message]); // Keep last 100 logs
      if (messageRef.current) {
        messageRef.current.scrollTop = messageRef.current.scrollHeight;
      }
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      // 使用 @ffmpeg/ffmpeg 内置的加载方式，它会自动处理 COOP/COEP 问题
      await ffmpeg.load();
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
    setProgress(0);
    setLogs([]);
    setError(null);
    setStatus('ready');
  };

  const compress = async () => {
    if (!loaded || !videoFile) return;

    setStatus('compressing');
    setProgress(0);
    setLogs([]);
    setError(null);

    const ffmpeg = ffmpegRef.current;
    const inputFileName = 'input' + getExtension(videoFile.name);
    const outputFileName = 'output.' + format;

    try {
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      let args = ['-i', inputFileName];

      // Resolution
      if (resolution !== 'original') {
        const scale = resolution === '720p' ? '-1:720' : '-1:480';
        args.push('-vf', `scale=${scale}`);
      }

      // Quality (CRF)
      let crf = '23';
      if (quality === 'high') crf = '18';
      if (quality === 'low') crf = '28';
      
      args.push('-c:v', 'libx264');
      args.push('-crf', crf);
      args.push('-preset', 'fast'); // Balance speed/compression
      args.push('-c:a', 'aac');
      args.push('-b:a', '128k');

      args.push(outputFileName);

      console.log('FFmpeg 命令:', args.join(' '));
      console.log('输出文件名:', outputFileName);

      // 执行 FFmpeg 命令
      try {
        await ffmpeg.exec(args);
        console.log('FFmpeg 命令执行成功');
      } catch (execError) {
        console.error('FFmpeg 命令执行失败:', execError);
        setError(`压缩失败: FFmpeg 命令执行错误 - ${execError.message}。请检查 FFmpeg 日志获取详细信息。`);
        setStatus('error');
        return;
      }

      // 检查输出文件是否存在
      try {
        // 尝试列出目录内容，查看文件是否生成
        const files = await ffmpeg.listDir('.');
        console.log('FFmpeg 工作目录文件:', files);
        
        const data = await ffmpeg.readFile(outputFileName);
        console.log('读取文件成功，数据长度:', data ? data.buffer.byteLength : 0);
        
        // 确保数据存在且有内容
        if (!data || !data.buffer || data.buffer.byteLength === 0) {
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
        
        // 创建 blob 并生成 URL
        const blob = new Blob([data.buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        console.log('生成 blob URL 成功');
        
        setOutputVideoUrl(url);
        setStatus('done');
      } catch (readError) {
        console.error('读取输出文件时出错:', readError);
        // 尝试获取 FFmpeg 日志以获取更多信息
        setError(`压缩失败: ${readError.message}。请检查浏览器控制台和 FFmpeg 日志获取详细信息。`);
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
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
      ) : status === 'error' ? (
         <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">组件加载失败</h3>
            <p className="text-red-600 dark:text-red-300 max-w-lg mx-auto">{error}</p>
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
                         onClick={() => { setVideoFile(null); setStatus('idle'); setOutputVideoUrl(''); }}
                         className="text-red-500 hover:text-red-600 text-sm font-medium"
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
                         <div className="w-full bg-div-theme rounded-full h-4 overflow-hidden">
                            <div 
                               className="bg-theme-primary h-full rounded-full transition-all duration-300 progress-bar-striped"
                               style={{ width: `${progress}%` }}
                            ></div>
                         </div>
                         <p className="text-center text-xs text-gray-400">
                            请勿关闭页面，视频处理可能需要几分钟...
                         </p>
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
