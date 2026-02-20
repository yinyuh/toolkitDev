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
  
  // Settings
  const [targetFormat, setTargetFormat] = useState('mp4'); // mp4, webm, mkv, avi, mov
  const [mode, setMode] = useState('copy'); // copy (fast), encode (compatible)

  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setStatus('loading_ffmpeg');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message }) => {
      setLogs(prev => [...prev.slice(-20), message]);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
      setStatus('idle');
      setFfmpeg(ffmpeg);
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
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {!loaded && status !== 'error' ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
           {/* Upload Area */}
           {!videoFile ? (
              <div 
                className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-theme-primary hover:bg-theme-primary/5 transition-all cursor-pointer m-6 rounded-xl"
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
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    点击上传视频文件
                 </h3>
                 <p className="text-gray-500 dark:text-gray-400">
                    支持 MP4, MKV, AVI, MOV, WEBM, FLV 等
                 </p>
              </div>
           ) : (
              <div className="p-8">
                 <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center text-theme-primary">
                          <FileVideo size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]">
                             {videoFile.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                             目标格式
                          </label>
                          <div className="flex flex-wrap gap-2">
                             {['mp4', 'webm', 'mkv', 'avi', 'mov'].map(fmt => (
                                <button
                                   key={fmt}
                                   onClick={() => setTargetFormat(fmt)}
                                   className={`px-4 py-2 rounded-lg border text-sm font-bold uppercase transition-all ${
                                      targetFormat === fmt 
                                        ? 'border-theme-primary bg-theme-primary/10 text-theme-primary shadow-sm' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                   }`}
                                >
                                   {fmt}
                                </button>
                             ))}
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                             转换模式
                          </label>
                          <div className="space-y-3">
                             <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mode === 'copy' ? 'border-theme-primary bg-theme-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                <input 
                                  type="radio" 
                                  name="mode" 
                                  value="copy" 
                                  checked={mode === 'copy'} 
                                  onChange={(e) => setMode(e.target.value)}
                                  className="mt-1 w-4 h-4 text-theme-primary border-gray-300 focus:ring-theme-primary"
                                />
                                <div>
                                   <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">极速模式 (Copy Stream)</span>
                                   <span className="block text-xs text-gray-500 mt-1">仅更换容器，不重新编码，速度极快。若视频流不兼容可能会失败。</span>
                                </div>
                             </label>
                             <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mode === 'encode' ? 'border-theme-primary bg-theme-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                <input 
                                  type="radio" 
                                  name="mode" 
                                  value="encode" 
                                  checked={mode === 'encode'} 
                                  onChange={(e) => setMode(e.target.value)}
                                  className="mt-1 w-4 h-4 text-theme-primary border-gray-300 focus:ring-theme-primary"
                                />
                                <div>
                                   <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">兼容模式 (Re-encode)</span>
                                   <span className="block text-xs text-gray-500 mt-1">重新编码视频和音频，确保最大兼容性，速度较慢。</span>
                                </div>
                             </label>
                          </div>
                       </div>
                    </div>
                 )}

                 {status === 'ready' && (
                    <button 
                       onClick={convert}
                       className="w-full py-4 bg-theme-primary text-white rounded-xl font-bold text-lg hover:bg-theme-primary/90 shadow-lg shadow-theme-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                       开始转换
                       <ArrowRight size={20} />
                    </button>
                 )}

                 {status === 'converting' && (
                    <div className="space-y-6 py-8">
                       <div className="flex flex-col items-center">
                          <Loader2 size={40} className="animate-spin text-theme-primary mb-4" />
                          <div className="text-lg font-bold text-gray-800 dark:text-gray-200">正在处理视频...</div>
                          <div className="text-sm text-gray-500 mt-1">请勿关闭页面</div>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden relative">
                          <div 
                             className="bg-theme-primary h-full rounded-full transition-all duration-300"
                             style={{ width: `${Math.max(5, progress)}%` }}
                          ></div>
                       </div>
                       <div className="bg-black/80 rounded-lg p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto custom-scrollbar">
                          {logs.map((log, i) => <div key={i}>{log}</div>)}
                       </div>
                    </div>
                 )}

                 {status === 'done' && (
                    <div className="text-center space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4">
                       <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check size={40} />
                       </div>
                       <div>
                          <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                             转换完成!
                          </h3>
                          <p className="text-gray-500">您的新视频已准备好</p>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <a 
                             href={outputUrl}
                             download={`converted_${videoFile.name.split('.')[0]}.${targetFormat}`}
                             className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-theme-primary text-white rounded-xl font-bold hover:bg-theme-primary/90 transition-all shadow-lg shadow-theme-primary/20"
                          >
                             <Download size={20} />
                             下载视频
                          </a>
                          <button 
                             onClick={() => { setVideoFile(null); setStatus('idle'); setOutputUrl(''); }}
                             className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
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
      
      <style jsx>{`
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
