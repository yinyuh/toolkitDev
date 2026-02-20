import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Upload, Download, FileVideo, Play, AlertCircle, Check, Loader2, ArrowRight, Settings, Image as ImageIcon } from 'lucide-react';

const VideoToGif = () => {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, loading_ffmpeg, ready, converting, done, error
  const [error, setError] = useState(null);
  
  // Settings
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);
  const [duration, setDuration] = useState(0); // Total video duration
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  useEffect(() => {
    load();
    return () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        if (outputUrl) URL.revokeObjectURL(outputUrl);
    }
  }, []);

  const load = async () => {
    setStatus('loading_ffmpeg');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
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
    
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoFile(file);
    setOutputUrl('');
    setProgress(0);
    setError(null);
    setStatus('ready');
    
    // Reset settings
    setStartTime(0);
    // End time will be set when video metadata loads
  };

  const onVideoLoadedMetadata = (e) => {
    const dur = e.target.duration;
    setDuration(dur);
    setEndTime(Math.min(dur, 5)); // Default to 5 seconds or full duration
  };

  const convert = async () => {
    if (!loaded || !videoFile) return;

    // Validate inputs
    if (startTime >= endTime) {
        setError("开始时间必须小于结束时间");
        return;
    }

    setStatus('converting');
    setProgress(0);
    setError(null);

    const ffmpeg = ffmpegRef.current;
    const inputExt = videoFile.name.split('.').pop();
    const inputFileName = `input.${inputExt}`;
    const outputFileName = `output.gif`;
    const cutDuration = endTime - startTime;

    try {
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      // Command: ffmpeg -ss [start] -t [duration] -i input -vf "fps=[fps],scale=[width]:-1:flags=lanczos" -f gif output.gif
      // Note: -ss before -i for faster seeking (input seeking), but for accurate frame cutting, sometimes output seeking is better.
      // However, input seeking is much faster. Let's use input seeking.
      
      const args = [
          '-ss', startTime.toString(),
          '-t', cutDuration.toString(),
          '-i', inputFileName,
          '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
          '-f', 'gif',
          outputFileName
      ];

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputFileName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
      
      setOutputUrl(url);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError("转换失败: " + err.message);
      setStatus('error');
    } finally {
       try {
          await ffmpeg.deleteFile(inputFileName);
          await ffmpeg.deleteFile(outputFileName);
       } catch(e) {}
    }
  };

  const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 10);
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
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
                    上传视频文件
                 </h3>
                 <p className="text-gray-500 dark:text-gray-400">
                    支持 MP4, MOV, AVI, WEBM 等
                 </p>
              </div>
           ) : (
              <div className="p-6 md:p-8">
                 <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-theme-primary/10 rounded-lg flex items-center justify-center text-theme-primary">
                          <FileVideo size={20} />
                       </div>
                       <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px] md:max-w-md">
                          {videoFile.name}
                       </h3>
                    </div>
                    <button 
                       onClick={() => { setVideoFile(null); setStatus('idle'); setOutputUrl(''); setVideoUrl(''); }}
                       className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                       重新上传
                    </button>
                 </div>

                 {/* Video Preview & Settings Grid */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Left: Video Preview */}
                    <div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Play size={18} /> 预览与裁剪
                        </h4>
                        <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
                            <video 
                                ref={videoRef}
                                src={videoUrl} 
                                controls 
                                className="max-w-full max-h-full"
                                onLoadedMetadata={onVideoLoadedMetadata}
                            />
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">开始时间 ({formatTime(startTime)})</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={duration} 
                                    step="0.1"
                                    value={startTime} 
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setStartTime(Math.min(val, endTime - 0.5));
                                        if(videoRef.current) videoRef.current.currentTime = val;
                                    }}
                                    className="w-full accent-theme-primary"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">结束时间 ({formatTime(endTime)})</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={duration} 
                                    step="0.1"
                                    value={endTime} 
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setEndTime(Math.max(val, startTime + 0.5));
                                        if(videoRef.current) videoRef.current.currentTime = val;
                                    }}
                                    className="w-full accent-theme-primary"
                                />
                            </div>
                        </div>
                        <div className="text-center mt-2 text-sm font-mono text-theme-primary">
                            GIF 时长: {formatTime(endTime - startTime)}
                        </div>
                    </div>

                    {/* Right: Settings */}
                    <div className="flex flex-col">
                         <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Settings size={18} /> 输出设置
                        </h4>
                        
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 space-y-5 flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    宽度 (px)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[320, 480, 640].map(w => (
                                        <button
                                            key={w}
                                            onClick={() => setWidth(w)}
                                            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                                                width === w
                                                ? 'border-theme-primary bg-theme-primary/10 text-theme-primary'
                                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                            }`}
                                        >
                                            {w}px
                                        </button>
                                    ))}
                                    <div className="relative flex-1 min-w-[80px]">
                                        <input 
                                            type="number" 
                                            value={width}
                                            onChange={(e) => setWidth(parseInt(e.target.value) || 320)}
                                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-theme-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    帧率 (FPS) - 越低体积越小
                                </label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="30" 
                                        step="1" 
                                        value={fps}
                                        onChange={(e) => setFps(parseInt(e.target.value))}
                                        className="flex-1 accent-theme-primary"
                                    />
                                    <span className="w-12 text-right font-mono text-gray-600 dark:text-gray-300">{fps}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4">
                                {status === 'ready' && (
                                    <button 
                                        onClick={convert}
                                        className="w-full py-3 bg-theme-primary text-white rounded-xl font-bold hover:bg-theme-primary/90 shadow-lg shadow-theme-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        开始生成 GIF
                                        <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Progress Area */}
                 {status === 'converting' && (
                    <div className="py-6 animate-in fade-in zoom-in duration-300">
                       <div className="flex flex-col items-center mb-4">
                          <Loader2 size={32} className="animate-spin text-theme-primary mb-2" />
                          <div className="font-bold text-gray-800 dark:text-gray-200">正在生成 GIF...</div>
                          <div className="text-xs text-gray-500">这可能需要几秒到几分钟</div>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                             className="bg-theme-primary h-full rounded-full transition-all duration-300"
                             style={{ width: `${Math.max(5, progress)}%` }}
                          ></div>
                       </div>
                    </div>
                 )}

                 {/* Result Area */}
                 {status === 'done' && outputUrl && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                       <div className="flex flex-col md:flex-row gap-6 items-center">
                          <div className="relative group">
                              <img src={outputUrl} alt="Generated GIF" className="max-h-[300px] rounded-lg shadow-md bg-white/50" />
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">GIF</div>
                          </div>
                          
                          <div className="flex-1 text-center md:text-left">
                             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center justify-center md:justify-start gap-2">
                                <Check size={24} className="text-green-500" />
                                生成成功!
                             </h3>
                             <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                                您的 GIF 已准备好下载。
                             </p>
                             
                             <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <a 
                                   href={outputUrl}
                                   download={`output_${Date.now()}.gif`}
                                   className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-theme-primary text-white rounded-lg font-bold hover:bg-theme-primary/90 transition-all shadow-md"
                                >
                                   <Download size={18} />
                                   下载 GIF
                                </a>
                                <button 
                                   onClick={() => { setStatus('ready'); setOutputUrl(''); }}
                                   className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                   继续调整
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
                 
                 {error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400 animate-in shake">
                       <AlertCircle size={20} />
                       <span>{error}</span>
                    </div>
                 )}
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default VideoToGif;
