import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Upload, Download, Music, Play, AlertCircle, Check, Loader2, Volume2 } from 'lucide-react';

const AudioConverter = () => {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [outputUrl, setOutputUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, loading_ffmpeg, ready, converting, done, error
  const [error, setError] = useState(null);
  
  // Settings
  const [format, setFormat] = useState('mp3'); // mp3, wav, aac, ogg
  const [bitrate, setBitrate] = useState('128k'); // 128k, 192k, 320k

  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    load();
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
      setError("无法加载转换引擎。请确保使用最新版 Chrome/Edge 浏览器。");
      setStatus('error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAudioFile(file);
    setOutputUrl('');
    setProgress(0);
    setError(null);
    setStatus('ready');
  };

  const convert = async () => {
    if (!loaded || !audioFile) return;

    setStatus('converting');
    setProgress(0);
    setError(null);

    const ffmpeg = ffmpegRef.current;
    const inputExt = audioFile.name.split('.').pop();
    const inputFileName = `input.${inputExt}`;
    const outputFileName = `output.${format}`;

    try {
      await ffmpeg.writeFile(inputFileName, await fetchFile(audioFile));

      let args = ['-i', inputFileName];

      // Codec settings based on format
      if (format === 'mp3') {
        args.push('-c:a', 'libmp3lame');
      } else if (format === 'aac') {
        args.push('-c:a', 'aac');
      } else if (format === 'ogg') {
        args.push('-c:a', 'libvorbis');
      } else if (format === 'wav') {
        // wav usually pcm_s16le default
      }

      // Bitrate (except for WAV which is usually lossless)
      if (format !== 'wav') {
        args.push('-b:a', bitrate);
      }

      args.push(outputFileName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputFileName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${format}` }));
      
      setOutputUrl(url);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError("转换失败: " + err.message);
      setStatus('error');
    } finally {
       // Cleanup
       try {
          await ffmpeg.deleteFile(inputFileName);
          await ffmpeg.deleteFile(outputFileName);
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
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      {!loaded && status !== 'error' ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
          <Loader2 size={48} className="animate-spin mb-4 text-theme-primary" />
          <p className="text-lg">正在加载音频引擎...</p>
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
           {!audioFile ? (
              <div 
                className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-theme-primary hover:bg-theme-primary/5 transition-all cursor-pointer m-6 rounded-xl"
                onClick={() => document.getElementById('audio-upload').click()}
              >
                 <input 
                    id="audio-upload"
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                 />
                 <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-theme-primary">
                    <Music size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    点击上传音频文件
                 </h3>
                 <p className="text-gray-500 dark:text-gray-400">
                    支持 MP3, WAV, M4A, AAC, FLAC 等
                 </p>
              </div>
           ) : (
              <div className="p-8">
                 <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center text-theme-primary">
                          <Volume2 size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]">
                             {audioFile.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                             {formatSize(audioFile.size)}
                          </p>
                       </div>
                    </div>
                    <button 
                       onClick={() => { setAudioFile(null); setStatus('idle'); setOutputUrl(''); }}
                       className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                       重新上传
                    </button>
                 </div>

                 {status === 'ready' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             目标格式
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                             {['mp3', 'wav', 'aac', 'ogg'].map(fmt => (
                                <button
                                   key={fmt}
                                   onClick={() => setFormat(fmt)}
                                   className={`p-3 rounded-lg border text-sm font-bold uppercase transition-all ${
                                      format === fmt 
                                        ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                   }`}
                                >
                                   {fmt}
                                </button>
                             ))}
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             比特率 (画质)
                          </label>
                          <select 
                             value={bitrate}
                             onChange={(e) => setBitrate(e.target.value)}
                             disabled={format === 'wav'}
                             className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-theme-primary focus:border-transparent outline-none disabled:opacity-50"
                          >
                             <option value="128k">128 kbps (标准)</option>
                             <option value="192k">192 kbps (高)</option>
                             <option value="320k">320 kbps (极高)</option>
                          </select>
                       </div>
                    </div>
                 )}

                 {status === 'ready' && (
                    <button 
                       onClick={convert}
                       className="w-full py-3 bg-theme-primary text-white rounded-xl font-bold text-lg hover:bg-theme-primary/90 shadow-lg shadow-theme-primary/20 transition-all transform active:scale-[0.98]"
                    >
                       开始转换
                    </button>
                 )}

                 {status === 'converting' && (
                    <div className="space-y-4 py-4">
                       <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                          <span>正在处理...</span>
                          {/* FFmpeg audio conversion often doesn't report accurate progress, show spinner */}
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden relative">
                          <div className="absolute inset-0 bg-theme-primary/20 animate-pulse"></div>
                          <div 
                             className="bg-theme-primary h-full rounded-full transition-all duration-300"
                             style={{ width: `${Math.max(5, progress)}%` }}
                          ></div>
                       </div>
                    </div>
                 )}

                 {status === 'done' && (
                    <div className="text-center space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
                       <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                          <Check size={32} />
                       </div>
                       <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                             转换完成!
                          </h3>
                          <audio controls src={outputUrl} className="w-full mt-4" />
                       </div>
                       <a 
                          href={outputUrl}
                          download={`converted_${audioFile.name.split('.')[0]}.${format}`}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-theme-primary text-white rounded-xl font-bold hover:bg-theme-primary/90 transition-all shadow-lg shadow-theme-primary/20"
                       >
                          <Download size={20} />
                          下载音频
                       </a>
                    </div>
                 )}
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AudioConverter;
