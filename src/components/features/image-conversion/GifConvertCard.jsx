import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  Upload, Download, X, Check, AlertCircle, Loader2,
  Settings2, Eye, FolderOpen, Info, Zap,
  Image as ImageIcon, Film, ArrowRightLeft
} from 'lucide-react';
import { useGifConvert } from './hooks/useGifConvert.js';
import { formatSize } from './utils/imageProcessor.js';

const COLORS_OPTIONS = [
  { value: 256, label: '256 色 (高画质)' },
  { value: 128, label: '128 色 (小体积)' }
];

const SCALE_OPTIONS = [
  { value: 'original', label: '原分辨率' },
  { value: 'half', label: '50% 缩小' },
  { value: 'custom', label: '自定义宽高' }
];

const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const GifConvertCard = () => {
  const {
    files, isConverting, progress, progressText,
    options, toast, gifInfo, workerReady,
    ffmpegReady, ffmpegLoading,
    fileInputRef, fileCount,
    addFiles, handleFileChange, removeFile, clearAll,
    updateOption, convert, download, loadGifInfo,
    setToast, setGifInfo
  } = useGifConvert();

  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  useEffect(() => {
    if (options.direction === 'fromGif' && files.length === 1 && files[0].file.type === 'image/gif') {
      loadGifInfo(files[0].file);
    } else {
      setGifInfo(null);
    }
  }, [files, options.direction, loadGifInfo]);

  const hasOutput = !!options.outputBlob;
  const canConvert = files.length > 0 &&
    (options.direction === 'toGif' || (options.direction === 'fromGif' && files[0]?.file.type === 'image/gif'));

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 w-full flex flex-col gap-6">
        {/* Upload Area */}
        <div
          ref={dropRef}
          className={`relative bg-theme-primary border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-sm ${
            dragOver
              ? 'border-accent bg-accent/5 scale-[1.02]'
              : 'border-border-theme hover:border-accent hover:bg-accent/5'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file" ref={fileInputRef}
            multiple={options.direction === 'toGif'}
            accept={options.direction === 'toGif'
              ? 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/apng,image/avif,video/quicktime,video/mp4,.webp,.apng,.avif,.mov,.mp4'
              : 'image/gif'}
            className="hidden" onChange={handleFileChange}
          />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
            dragOver ? 'bg-accent/30 text-accent' : 'bg-accent/20 text-accent'
          }`}>
            {dragOver ? <FolderOpen size={32} /> : <Film size={32} />}
          </div>
          <h3 className="text-xl font-bold text-text-theme mb-2">
            {dragOver ? '松开鼠标上传文件' :
             options.direction === 'toGif' ? '上传多张图片制作 GIF' : '上传 GIF 文件'}
          </h3>
          <p className="text-text-secondary text-sm text-center max-w-md">
            {options.direction === 'toGif'
              ? '支持静态图批量合成 GIF，或上传单个 APNG/AVIF/MOV 动图转为 GIF'
              : '支持标准 GIF 文件，将转换为 APNG 格式'}
          </p>
          <p className="text-text-secondary text-xs mt-2">单文件上限 50MB</p>
          {dragOver && (
            <div className="absolute inset-0 rounded-xl border-2 border-accent bg-accent/5 pointer-events-none animate-pulse"></div>
          )}
        </div>

        {/* Worker / FFmpeg status */}
        {(!workerReady || (!ffmpegReady)) && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            ffmpegLoading
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
          }`}>
            {ffmpegLoading ? <Loader2 size={20} className="animate-spin" /> : <AlertCircle size={20} />}
            <div>
              <p className="font-bold text-sm">
                {ffmpegLoading ? 'FFmpeg 引擎加载中...' : '处理引擎未就绪'}
              </p>
              <p className="text-xs">
                {ffmpegLoading
                  ? '正在加载动图转码引擎，加载完成后即可使用 WebP/APNG → GIF 转换功能'
                  : '请确保使用最新版 Chrome/Edge 浏览器，并刷新页面后重试'}
              </p>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme overflow-hidden">
            <div className="p-4 border-b border-border-theme bg-div-secondary flex justify-between items-center">
              <h3 className="font-bold text-text-theme">
                文件列表 ({fileCount})
                {gifInfo && (
                  <span className="ml-2 text-text-secondary text-sm font-normal">
                    {gifInfo.numFrames} 帧 · {gifInfo.width}x{gifInfo.height}
                  </span>
                )}
              </h3>
              <button onClick={clearAll} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1">
                清空全部
              </button>
            </div>
            <div className="divide-y divide-border-theme max-h-[400px] overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="p-3 flex items-center gap-3 hover:bg-div-secondary transition-colors">
                  <div className="w-12 h-12 bg-div-secondary rounded-lg overflow-hidden flex-shrink-0 border border-border-theme">
                    <img src={file.previewUrl} className="w-full h-full object-cover" alt="preview" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-theme text-sm truncate">{file.file.name}</p>
                    <p className="text-xs text-text-secondary">{formatSize(file.file.size)}</p>
                  </div>
                  <Tooltip content="移除">
                    <button onClick={() => removeFile(file.id)}
                      className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {isConverting && (
          <div className="bg-theme-primary border border-border-theme rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 size={20} className="animate-spin text-accent" />
              <span className="text-sm font-bold text-text-theme">{progressText || '正在转换...'}</span>
            </div>
            <div className="w-full bg-div-secondary rounded-full h-3 overflow-hidden">
              <div className="bg-accent h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-text-secondary mt-2 text-right">{progress}%</p>
            {isConverting && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => {
                    if (workerRef?.current?.worker) {
                      workerRef.current.worker.terminate();
                    }
                    clearAll();
                    window.location.reload();
                  }}
                  className="text-red-500 text-xs hover:underline"
                >
                  中断转换（将刷新页面）
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {canConvert && (
          <div className="flex gap-3">
            <button
              onClick={convert}
              disabled={isConverting || !workerReady}
              title={!ffmpegReady && !workerReady ? '引擎加载中...' : undefined}
              className="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <><Loader2 size={20} className="animate-spin" />转换中...</>
              ) : (
                <><Zap size={20} />开始转换</>
              )}
            </button>
            {hasOutput && (
              <button
                onClick={download}
                className="px-6 py-3 border-2 border-accent text-accent rounded-xl font-bold hover:bg-accent hover:text-white transition-all flex items-center gap-2"
              >
                <Download size={20} />下载
              </button>
            )}
          </div>
        )}

        {/* Format Info */}
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <h4 className="font-bold text-sm text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
            <Info size={14} /> 格式支持说明
          </h4>
          <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
            <li>• <strong>多图合成 GIF</strong>：上传多张静态图片，自动合成为动态/静态 GIF（Canvas + Worker）</li>
            <li>• <strong>WebP 动图转 GIF</strong>：WebP 动图通过 FFmpeg 逐帧解码，完整保留时序</li>
            <li>• <strong>动图/视频转 GIF</strong>：WebP/APNG/AVIF/MOV 多帧格式走 FFmpeg 路径，保留全部帧</li>
            <li>• <strong>GIF → APNG</strong>：完整保留帧序列、播放速度与循环参数</li>
          </ul>
        </div>
      </div>

      {/* Settings Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
        {/* Direction Toggle */}
        <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
          <h3 className="font-bold text-text-theme mb-3 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-accent" />
            转换方向
          </h3>
          <div className="flex bg-div-secondary rounded-lg p-1">
            <button
              onClick={() => { clearAll(); updateOption('direction', 'toGif'); }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                options.direction === 'toGif'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-theme'
              }`}
            >
              <ImageIcon size={14} className="inline mr-1" />多图 → GIF
            </button>
            <button
              onClick={() => { clearAll(); updateOption('direction', 'fromGif'); }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                options.direction === 'fromGif'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-theme'
              }`}
            >
              <Film size={14} className="inline mr-1" />GIF → APNG
            </button>
          </div>
        </div>

        {/* Forward Settings */}
        {options.direction === 'toGif' && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5 space-y-5">
            <h3 className="font-bold text-text-theme flex items-center gap-2">
              <Settings2 size={18} className="text-accent" />GIF 参数设置
            </h3>

            {/* FPS */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-sm font-medium text-text-secondary">
                  帧率: {options.fps} FPS
                </label>
                <Tooltip content="每秒播放帧数，越高越流畅但文件越大。推荐 5-15 fps 用于表情包，10-20 fps 用于演示">
                  <Info size={13} className="text-text-secondary cursor-help" />
                </Tooltip>
              </div>
              <input type="range" min="1" max="30" value={options.fps}
                onChange={(e) => updateOption('fps', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent" />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>1 fps</span><span>30 fps</span>
              </div>
            </div>

            {/* Color Depth */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">色彩深度</label>
              <div className="space-y-1.5">
                {COLORS_OPTIONS.map(c => (
                  <button key={c.value}
                    onClick={() => updateOption('colors', c.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                      options.colors === c.value
                        ? 'border-accent bg-accent/5 text-accent font-bold'
                        : 'border-border-theme bg-div-secondary text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">分辨率缩放</label>
              <div className="space-y-1.5">
                {SCALE_OPTIONS.map(s => (
                  <button key={s.value}
                    onClick={() => updateOption('scaleMode', s.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                      options.scaleMode === s.value
                        ? 'border-accent bg-accent/5 text-accent font-bold'
                        : 'border-border-theme bg-div-secondary text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions */}
            {options.scaleMode === 'custom' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">宽度</label>
                  <input type="number" value={options.customWidth}
                    onChange={(e) => updateOption('customWidth', parseInt(e.target.value) || 480)}
                    className="w-full rounded-lg border-2 border-border-theme bg-theme-primary text-text-primary text-sm py-2 px-3"
                    min="10" max="1920" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">高度</label>
                  <input type="number" value={options.customHeight}
                    onChange={(e) => updateOption('customHeight', parseInt(e.target.value) || 360)}
                    className="w-full rounded-lg border-2 border-border-theme bg-theme-primary text-text-primary text-sm py-2 px-3"
                    min="10" max="1920" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reverse Settings */}
        {options.direction === 'fromGif' && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
            <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
              <Settings2 size={18} className="text-accent" />输出设置
            </h3>
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs text-text-secondary">
              <Info size={14} className="inline mr-1 text-accent" />
              将 GIF 转换为 APNG 格式，保留所有帧序列、播放速度和循环参数。
            </div>
            {gifInfo && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">尺寸</span>
                  <span className="text-text-theme font-bold">{gifInfo.width}x{gifInfo.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">帧数</span>
                  <span className="text-text-theme font-bold">{gifInfo.numFrames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">时长</span>
                  <span className="text-text-theme font-bold">{gifInfo.duration.toFixed(1)}s</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
          <h3 className="font-bold text-text-theme mb-2 flex items-center gap-2 text-sm">
            <Info size={16} className="text-accent" />使用提示
          </h3>
          <ul className="text-xs text-text-secondary space-y-1.5">
            <li>• 多图→GIF：选择多张静态图片合成为动态（单张为静态 GIF）</li>
            <li>• 单图→GIF：WebP/JPG/PNG 等格式直接转为 GIF（Canvas 引擎）</li>
            <li>• 动图→GIF：APNG/AVIF/MOV 通过 FFmpeg 保留完整时序</li>
            <li>• GIF→APNG：输出为 PNG 协会标准动图格式，兼容最新浏览器</li>
            <li>• 帧率建议 5-15 fps，过高会导致文件体积显著增大</li>
          </ul>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl text-white font-bold text-sm animate-slide-up flex items-center gap-2 max-w-md ${
          toast.type === 'error' ? 'bg-red-500' :
          toast.type === 'success' ? 'bg-green-500' : 'bg-accent'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> :
           toast.type === 'success' ? <Check size={18} /> : <Info size={18} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default GifConvertCard;
