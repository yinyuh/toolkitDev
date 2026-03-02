import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Upload, Download, FileVideo, Play, AlertCircle, Check, Loader2, ArrowRight } from 'lucide-react';

const VideoConverter = () => {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [outputUrl, setOutputUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, loading_ffmpeg, ready, converting, done, error
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [outputSize, setOutputSize] = useState(0);
  
  // Settings
  const [targetFormat, setTargetFormat] = useState('mp4'); // mp4, webm, mkv, avi, mov
  const [mode, setMode] = useState('copy'); // copy (fast), encode (compatible)

  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setStatus('loading_ffmpeg');
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message }) => {
      setLogs(prev => [...prev.slice(-20), message]);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      const cdnSources = [
        { name: 'unpkg-umd', baseURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd', core: '/ffmpeg-core.js', wasm: '/ffmpeg-core.wasm' },
        { name: 'unpkg-esm', baseURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm', core: '/ffmpeg-core.js', wasm: '/ffmpeg-core.wasm' },
        { name: 'jsdelivr-umd', baseURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd', core: '/ffmpeg-core.js', wasm: '/ffmpeg-core.wasm' },
        { name: 'jsdelivr-esm', baseURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm', core: '/ffmpeg-core.js', wasm: '/ffmpeg-core.wasm' }
      ];
      
      let lastError = null;
      for (const source of cdnSources) {
        try {
          console.log(`尝试从 ${source.name} 加载 FFmpeg...`);
          const coreURL = await toBlobURL(`${source.baseURL}${source.core}`, 'text/javascript');
          const wasmURL = await toBlobURL(`${source.baseURL}${source.wasm}`, 'application/wasm');
          
          await ffmpeg.load({
            coreURL: coreURL,
            wasmURL: wasmURL,
          });
          console.log(`成功从 ${source.name} 加载 FFmpeg`);
          setLoaded(true);
          setStatus('idle');
          setFfmpeg(ffmpeg);
          return;
        } catch (err) {
          console.warn(`从 ${source.name} 加载失败:`, err);
          lastError = err;
        }
      }
      
      console.error('所有 CDN 源加载失败:', lastError);
      setError("无法加载转换引擎。请确保使用最新版 Chrome/Edge 浏览器，并支持 SharedArrayBuffer。");
      setStatus('error');
    } catch (err) {
      console.error(err);
      setError("无法加载转换引擎。请确保使用最新版 Chrome/Edge 浏览器，并支持 SharedArrayBuffer。");
      setStatus('error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Auto-detect recommended mode
    const ext = file.name.split('.').pop().toLowerCase();
    // If target is MP4 and source is MKV/MOV (often h264), try copy first. 
    // But for safety in this demo, default to 'encode' if not sure, or 'copy' if user knows.
    // Let's default to 'encode' for compatibility unless user switches.
    setMode('encode'); 

    setVideoFile(file);
    setOutputUrl('');
    setOutputSize(0);
    setProgress(0);
    setError(null);
    setStatus('ready');
  };

  const convert = async () => {
    if (!loaded || !videoFile) return;

    setStatus('converting');
    setProgress(0);
    setError(null);

    const ffmpeg = ffmpegRef.current;
    const inputExt = videoFile.name.split('.').pop();
    const inputFileName = `input.${inputExt}`;
    const outputFileName = `output.${targetFormat}`;

    try {
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      let args = ['-i', inputFileName];

      if (mode === 'copy') {
        // Fast mode: copy streams
        args.push('-c', 'copy');
      } else {
        // Compatible mode: re-encode
        if (targetFormat === 'mp4' || targetFormat === 'mkv' || targetFormat === 'mov') {
           args.push('-c:v', 'libx264');
           args.push('-preset', 'fast');
           args.push('-c:a', 'aac');
        } else if (targetFormat === 'webm') {
           args.push('-c:v', 'libvpx');
           args.push('-c:a', 'libvorbis');
        } else {
           // Default fallback
           args.push('-c:v', 'libx264');
           args.push('-c:a', 'aac');
        }
      }

      args.push(outputFileName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputFileName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: `video/${targetFormat}` }));
      
      // 计算输出文件大小
      setOutputSize(data.buffer.byteLength);
      
      setOutputUrl(url);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError("转换失败: " + err.message + " (尝试切换到'兼容模式'重试)");
      setStatus('error');
    } finally {
       try {
          await ffmpeg.deleteFile(inputFileName);
          // await ffmpeg.deleteFile(outputFileName);
       } catch(e) {}
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-theme-primary rounded-xl">
      {!loaded && status !== 'error' ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary animate-pulse">
          <Loader2 size={48} className="animate-spin mb-4 text-theme-primary" />
          <p className="text-lg">正在加载转换引擎...</p>
        </div>
      ) : status === 'error' ? (
         <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">组件加载失败</h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
         </div>
      ) : (
        <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme overflow-hidden">
           {/* Upload Area */}
           {!videoFile ? (
              <div 
                className="p-12 text-center border-2 border-dashed border-border-theme bg-div-theme hover:border-accent hover:bg-accent/5 transition-all cursor-pointer m-6 rounded-xl"
                onClick={() => document.getElementById('video-upload').click()}
              >
                 <input 
                    id="video-upload"
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                 />
                 <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                    <FileVideo size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-text-theme mb-2">
                    点击上传视频文件
                 </h3>
                 <p className="text-text-secondary">
                    支持 MP4, MKV, AVI, MOV, WEBM, FLV 等
                 </p>
              </div>
           ) : (
              <div className="p-8">
                 <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-theme">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                          <FileVideo size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-text-theme truncate max-w-[200px]">
                             {videoFile.name}
                          </h3>
                          <p className="text-sm text-text-secondary">
                             {formatSize(videoFile.size)}
                          </p>
                       </div>
                    </div>
                    <button 
                       onClick={() => { setVideoFile(null); setStatus('idle'); setOutputUrl(''); }}
                       className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                       重新上传
                    </button>
                 </div>

                 {status === 'ready' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                       <div>
                          <label className="block text-sm font-medium text-text-secondary mb-3">
                             目标格式
                          </label>
                          <div className="flex flex-wrap gap-2">
                             {['mp4', 'webm', 'mkv', 'avi', 'mov'].map(fmt => (
                                <button
                                   key={fmt}
                                   onClick={() => setTargetFormat(fmt)}
                                   className={`px-4 py-2 rounded-lg border text-sm font-bold uppercase transition-all ${
                                      targetFormat === fmt 
                                        ? 'border-accent bg-accent/10 text-accent shadow-sm' 
                                        : 'border-border-theme hover:border-accent bg-theme-secondary text-text-secondary'
                                   }`}
                                >
                                   {fmt}
                                </button>
                             ))}
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-text-secondary mb-3">
                             转换模式
                          </label>
                          <div className="space-y-3">
                             <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mode === 'copy' ? 'border-accent bg-accent/5' : 'border-border-theme bg-div-theme'}`}>
                                <input 
                                  type="radio" 
                                  name="mode" 
                                  value="copy" 
                                  checked={mode === 'copy' ? true : false} 
                                  onChange={(e) => setMode(e.target.value)}
                                  className="mt-1 w-4 h-4 text-accent border-border-theme focus:ring-accent"
                                />
                                <div>
                                   <span className="block text-sm font-bold text-text-theme">极速模式 (Copy Stream)</span>
                                   <span className="block text-xs text-text-secondary mt-1">仅更换容器，不重新编码，速度极快。若视频流不兼容可能会失败。</span>
                                </div>
                             </label>
                             <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mode === 'encode' ? 'border-accent bg-accent/5' : 'border-border-theme bg-div-theme'}`}>
                                <input 
                                  type="radio" 
                                  name="mode" 
                                  value="encode" 
                                  checked={mode === 'encode' ? true : false} 
                                  onChange={(e) => setMode(e.target.value)}
                                  className="mt-1 w-4 h-4 text-accent border-border-theme focus:ring-accent"
                                />
                                <div>
                                   <span className="block text-sm font-bold text-text-theme">兼容模式 (Re-encode)</span>
                                   <span className="block text-xs text-text-secondary mt-1">重新编码视频和音频，确保最大兼容性，速度较慢。</span>
                                </div>
                             </label>
                          </div>
                       </div>
                    </div>
                 )}

                 {status === 'ready' && (
                    <button 
                       onClick={convert}
                       className="w-full py-4 bg-accent text-white rounded-xl font-bold text-lg hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                       开始转换
                       <ArrowRight size={20} />
                    </button>
                 )}

                 {status === 'converting' && (
                    <div className="space-y-6 py-8">
                       <div className="flex flex-col items-center">
                          <Loader2 size={40} className="animate-spin text-accent mb-4" />
                          <div className="text-lg font-bold text-text-theme">正在处理视频...</div>
                          <div className="text-sm text-text-secondary mt-1">请勿关闭页面</div>
                       </div>
                       <div className="w-full bg-theme-secondary rounded-full h-4 overflow-hidden relative">
                          <div 
                             className="bg-accent h-full rounded-full transition-all duration-300"
                             style={{ width: `${Math.max(5, progress)}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-theme">
                             {progress}%
                          </div>
                       </div>
                       <div className="flex justify-center">
                          <button 
                             onClick={async () => {
                                try {
                                   const ffmpeg = ffmpegRef.current;
                                   // 中断 FFmpeg 执行
                                   if (ffmpeg && ffmpeg.terminate) {
                                      await ffmpeg.terminate();
                                   }
                                   // 重置状态
                                   setStatus('ready');
                                   setProgress(0);
                                   setError('转换已中断');
                                   // 重新初始化 FFmpeg 实例
                                   ffmpegRef.current = new FFmpeg();
                                   setFfmpeg(null);
                                   setLoaded(false);
                                   load();
                                } catch (err) {
                                   console.error('中断失败:', err);
                                   setError('中断失败: ' + err.message);
                                   setStatus('error');
                                }
                             }}
                             className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                          >
                             中断视频处理
                          </button>
                       </div>
                       <div className="bg-theme-secondary rounded-lg p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto custom-scrollbar">
                          {logs.map((log, i) => <div key={i}>{log}</div>)}
                       </div>
                    </div>
                 )}

                 {status === 'done' && (
                    <div className="space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4">
                       <div className="text-center">
                          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Check size={40} />
                          </div>
                          <div>
                             <h3 className="text-3xl font-bold text-text-theme mb-2">
                                转换完成!
                             </h3>
                             <p className="text-text-secondary">您的新视频已准备好</p>
                          </div>
                       </div>
                       
                       {/* 视频播放器 */}
                       <div className="bg-div-theme rounded-xl border border-border-theme p-4">
                          <h4 className="text-lg font-bold text-text-theme mb-4 text-center">预览视频</h4>
                          <video 
                             src={outputUrl} 
                             controls 
                             className="w-full h-auto rounded-lg"
                             poster={URL.createObjectURL(new Blob([], { type: 'image/jpeg' }))}
                          >
                             您的浏览器不支持视频播放。
                          </video>
                       </div>
                       
                       {/* 文件大小对比 */}
                       <div className="bg-div-theme rounded-xl border border-border-theme p-4">
                          <h4 className="text-lg font-bold text-text-theme mb-4 text-center">文件大小对比</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="text-center p-3 bg-theme-secondary rounded-lg">
                                <div className="text-sm text-text-secondary mb-1">转换前</div>
                                <div className="text-xl font-bold text-text-theme">{formatSize(videoFile.size)}</div>
                             </div>
                             <div className="text-center p-3 bg-theme-secondary rounded-lg">
                                <div className="text-sm text-text-secondary mb-1">转换后</div>
                                <div className="text-xl font-bold text-text-theme">{formatSize(outputSize)}</div>
                             </div>
                             <div className="text-center p-3 bg-theme-secondary rounded-lg">
                                <div className="text-sm text-text-secondary mb-1">比率</div>
                                <div className={`text-xl font-bold ${outputSize < videoFile.size ? 'text-green-500' : 'text-red-500'}`}>
                                   {outputSize > 0 ? ((outputSize / videoFile.size) * 100).toFixed(1) + '%' : '0%'}
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <a 
                             href={outputUrl}
                             download={`converted_${videoFile.name.split('.')[0]}.${targetFormat}`}
                             className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
                          >
                             <Download size={20} />
                             下载视频
                          </a>
                          <button 
                             onClick={() => { setVideoFile(null); setStatus('idle'); setOutputUrl(''); setOutputSize(0); }}
                             className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-theme-secondary text-text-theme rounded-xl font-bold hover:bg-theme-secondary hover:opacity-90 transition-all"
                          >
                             转换下一个
                          </button>
                       </div>
                    </div>
                 )}
                 
                 {error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
                       <AlertCircle size={20} />
                       <span>{error}</span>
                    </div>
                 )}
              </div>
           )}
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.2);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default VideoConverter;
