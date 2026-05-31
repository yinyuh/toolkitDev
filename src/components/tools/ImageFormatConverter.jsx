import React, { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Upload, Download, X, Check, AlertCircle, Loader2, Image as ImageIcon,
  Settings2, Zap, Eye, FolderOpen, FileImage, ChevronDown, Info, Package,
  RotateCcw, Wand2
} from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const OUTPUT_FORMATS = [
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg', desc: '通用兼容，适合照片与网页展示' },
  { value: 'image/png', label: 'PNG', ext: 'png', desc: '无损压缩，支持透明通道' },
  { value: 'image/webp', label: 'WebP', ext: 'webp', desc: '新一代格式，高压缩率与画质兼顾' },
  { value: 'image/bmp', label: 'BMP', ext: 'bmp', desc: '无压缩位图，适合特定系统需求' },
  { value: 'image/svg+xml', label: 'SVG', ext: 'svg', desc: '矢量嵌入（将栅格图封装为SVG）' },
];

const INPUT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/x-icon,image/heic,image/heif,.heic,.heif,.ico';

const PRESETS = [
  { name: '网页优化', target: 'image/webp', quality: 0.80, maxSize: 1920, desc: '平衡画质与加载速度，适合网站配图' },
  { name: '社交媒体', target: 'image/jpeg', quality: 0.85, maxSize: 2048, desc: '适配主流社交平台尺寸与格式要求' },
  { name: '高清存档', target: 'image/png', quality: 1.0, maxSize: 4096, desc: '保留最高画质，适合归档与印刷用途' },
  { name: '极致压缩', target: 'image/webp', quality: 0.50, maxSize: 1280, desc: '最小体积输出，适合缩略图与预览' },
];

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFormatLabel = (mime) => {
  const map = {
    'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP',
    'image/gif': 'GIF', 'image/bmp': 'BMP', 'image/svg+xml': 'SVG',
    'image/x-icon': 'ICO', 'image/heic': 'HEIC', 'image/heif': 'HEIF'
  };
  return map[mime] || mime?.split('/')[1]?.toUpperCase() || 'UNKNOWN';
};

const isRasterInput = (type) => {
  return type && (type.startsWith('image/jpeg') || type.startsWith('image/png') ||
    type.startsWith('image/webp') || type.startsWith('image/gif') ||
    type.startsWith('image/bmp') || type.startsWith('image/x-icon'));
};

const convertImage = (file, targetFormat, quality, maxWidthOrHeight) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let w = img.width;
        let h = img.height;
        const maxDim = Math.max(w, h);
        if (maxDim > maxWidthOrHeight) {
          const scale = maxWidthOrHeight / maxDim;
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        if (targetFormat === 'image/svg+xml') {
          const dataUrl = canvas.toDataURL('image/png');
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <image width="${w}" height="${h}" xlink:href="${dataUrl}"/>
</svg>`;
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          resolve({ blob, previewUrl: URL.createObjectURL(blob) });
        } else if (targetFormat === 'image/bmp') {
          const bmpData = canvasToBMP(canvas);
          const blob = new Blob([bmpData], { type: 'image/bmp' });
          resolve({ blob, previewUrl: URL.createObjectURL(blob) });
        } else {
          const q = targetFormat === 'image/png' ? undefined : quality;
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas 导出失败，请尝试其他格式'));
              return;
            }
            resolve({ blob, previewUrl: URL.createObjectURL(blob) });
          }, targetFormat, q);
        }
      } catch (err) {
        reject(new Error('图片处理异常: ' + (err.message || '未知错误')));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法解析该图片文件，文件可能已损坏或格式不受浏览器支持'));
    };

    img.src = url;
  });
};

const canvasToBMP = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const w = imageData.width;
  const h = imageData.height;
  const rowSize = Math.floor((w * 24 + 31) / 32) * 4;
  const fileSize = 54 + rowSize * h;
  const buffer = new ArrayBuffer(fileSize);
  const dv = new DataView(buffer);

  dv.setUint8(0, 0x42);
  dv.setUint8(1, 0x4D);
  dv.setUint32(2, fileSize, true);
  dv.setUint32(10, 54, true);
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, h, true);
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 24, true);

  const pixels = imageData.data;
  let filePos = 54;
  for (let y = h - 1; y >= 0; y--) {
    let rowPos = filePos;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      dv.setUint8(rowPos++, pixels[idx + 2]);
      dv.setUint8(rowPos++, pixels[idx + 1]);
      dv.setUint8(rowPos++, pixels[idx]);
    }
    filePos = rowPos;
    while (filePos % 4 !== 0) {
      dv.setUint8(filePos++, 0);
    }
  }
  return buffer;
};

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

const ImageFormatConverter = () => {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [mode, setMode] = useState('preset');
  const [settings, setSettings] = useState({
    targetFormat: 'image/webp',
    quality: 0.85,
    maxWidthOrHeight: 2048,
  });
  const [activePreset, setActivePreset] = useState('网页优化');
  const [compareItem, setCompareItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [showGuide, setShowGuide] = useState(true);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `文件 "${file.name}" 超过 50MB 限制（当前 ${formatSize(file.size)}），请压缩后再上传。` };
    }
    if (file.size === 0) {
      return { valid: false, error: `文件 "${file.name}" 大小为 0，无法处理空文件。` };
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/x-icon', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(heic|heif|ico)$/i)) {
      return { valid: false, error: `文件 "${file.name}" 不是支持的图片格式。` };
    }
    if (file.type === 'image/svg+xml' && !isRasterInput(file.type)) {
      return { valid: true, warning: `SVG 文件 "${file.name}" 将被转为栅格格式输出，矢量特性将丢失。` };
    }
    return { valid: true };
  };

  const addFiles = (newFiles) => {
    const entries = [];
    for (const file of newFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        continue;
      }
      if (validation.warning) {
        showToast(validation.warning, 'info');
      }
      entries.push({
        id: Math.random().toString(36).substr(2, 9),
        originalFile: file,
        convertedFile: null,
        status: 'pending',
        progress: 0,
        originalPreview: URL.createObjectURL(file),
        error: null,
      });
    }
    if (entries.length > 0) {
      setFiles(prev => [...prev, ...entries]);
    }
  };

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

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

  const applyPreset = (preset) => {
    setActivePreset(preset.name);
    setSettings({
      targetFormat: preset.target,
      quality: preset.quality,
      maxWidthOrHeight: preset.maxSize,
    });
  };

  const convertAll = async () => {
    const pending = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pending.length === 0) {
      showToast('没有待转换的文件', 'info');
      return;
    }

    setIsConverting(true);
    setShowGuide(false);

    for (const item of pending) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'converting', progress: 0 } : f));

      try {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: 30 } : f));

        const result = await convertImage(
          item.originalFile,
          settings.targetFormat,
          settings.quality,
          settings.maxWidthOrHeight
        );

        setFiles(prev => prev.map(f => f.id === item.id ? {
          ...f,
          status: 'done',
          progress: 100,
          convertedFile: result.blob,
          convertedPreview: result.previewUrl,
          error: null,
        } : f));
      } catch (err) {
        console.error('Conversion error:', err);
        setFiles(prev => prev.map(f => f.id === item.id ? {
          ...f,
          status: 'error',
          progress: 0,
          error: err.message || '转换失败',
        } : f));
      }
    }

    setIsConverting(false);

    const doneCount = files.filter(f => f.status === 'done').length + pending.filter(f => f.status !== 'error').length;
    const errorCount = pending.filter(f => f.status === 'error').length;
    if (errorCount > 0) {
      showToast(`转换完成：${doneCount} 成功 / ${errorCount} 失败`, 'error');
    } else {
      showToast(`全部 ${doneCount} 个文件转换完成！`, 'success');
    }
  };

  const reconvertAll = () => {
    setFiles(prev => prev.map(f => ({
      ...f,
      status: 'pending',
      convertedFile: null,
      convertedPreview: null,
      progress: 0,
      error: null,
    })));
  };

  const downloadAll = async () => {
    const completed = files.filter(f => f.status === 'done' && f.convertedFile);
    if (completed.length === 0) {
      showToast('没有可下载的文件', 'info');
      return;
    }
    if (completed.length === 1) {
      const f = completed[0];
      const ext = OUTPUT_FORMATS.find(fmt => fmt.value === settings.targetFormat)?.ext || 'png';
      saveAs(f.convertedFile, `${f.originalFile.name.replace(/\.[^.]+$/, '')}_converted.${ext}`);
      return;
    }
    const zip = new JSZip();
    const ext = OUTPUT_FORMATS.find(fmt => fmt.value === settings.targetFormat)?.ext || 'png';
    completed.forEach(f => {
      const baseName = f.originalFile.name.replace(/\.[^.]+$/, '');
      zip.file(`${baseName}_converted.${ext}`, f.convertedFile);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted_images.zip');
  };

  const removeFile = (id) => {
    const target = files.find(f => f.id === id);
    if (target?.originalPreview) URL.revokeObjectURL(target.originalPreview);
    if (target?.convertedPreview) URL.revokeObjectURL(target.convertedPreview);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    files.forEach(f => {
      if (f.originalPreview) URL.revokeObjectURL(f.originalPreview);
      if (f.convertedPreview) URL.revokeObjectURL(f.convertedPreview);
    });
    setFiles([]);
  };

  const isLossyFormat = settings.targetFormat === 'image/jpeg' || settings.targetFormat === 'image/webp';

  const completedCount = files.filter(f => f.status === 'done').length;
  const failedCount = files.filter(f => f.status === 'error').length;

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
            type="file"
            ref={fileInputRef}
            multiple
            accept={INPUT_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
            dragOver ? 'bg-accent/30 text-accent' : 'bg-accent/20 text-accent'
          }`}>
            {dragOver ? <FolderOpen size={32} /> : <Upload size={32} />}
          </div>
          <h3 className="text-xl font-bold text-text-theme mb-2">
            {dragOver ? '松开鼠标上传文件' : '批量上传图片'}
          </h3>
          <p className="text-text-secondary text-sm text-center max-w-md">
            支持拖拽或点击上传，JPG / PNG / WebP / GIF / BMP / SVG / HEIC / ICO
          </p>
          <p className="text-text-secondary text-xs mt-2">单文件最大 50MB，支持批量选择</p>
          {dragOver && (
            <div className="absolute inset-0 rounded-xl border-2 border-accent bg-accent/5 pointer-events-none animate-pulse"></div>
          )}
        </div>

        {/* Guide */}
        {showGuide && files.length === 0 && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 flex items-start gap-3">
            <Info size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-text-theme mb-1">使用提示</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• <strong>预设模式</strong>：选择场景一键完成转换，适合大多数用户</li>
                <li>• <strong>高级模式</strong>：自定义目标格式、画质与尺寸参数</li>
                <li>• 所有处理在浏览器本地完成，<strong>图片不会上传到服务器</strong></li>
                <li>• 转换后点击「一键打包下载」批量获取结果文件</li>
              </ul>
              <button
                onClick={() => setShowGuide(false)}
                className="text-accent text-xs mt-2 hover:underline"
              >
                我知道了
              </button>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme overflow-hidden">
            <div className="p-4 border-b border-border-theme bg-div-secondary flex justify-between items-center">
              <h3 className="font-bold text-text-theme">
                文件列表 ({files.length})
                {completedCount > 0 && (
                  <span className="ml-2 text-green-600 text-sm font-normal">已完成 {completedCount}</span>
                )}
                {failedCount > 0 && (
                  <span className="ml-2 text-red-500 text-sm font-normal">失败 {failedCount}</span>
                )}
              </h3>
              <button
                onClick={clearAll}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1"
              >
                清空全部
              </button>
            </div>
            <div className="divide-y divide-border-theme max-h-[500px] overflow-y-auto">
              {files.map(file => (
                <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-div-secondary transition-colors">
                  {/* Thumbnail */}
                  <div
                    className="w-16 h-16 bg-div-secondary rounded-lg overflow-hidden flex-shrink-0 border border-border-theme cursor-pointer relative group"
                    onClick={() => file.status === 'done' && setCompareItem(file)}
                  >
                    <img
                      src={file.convertedPreview || file.originalPreview}
                      className="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                    {file.status === 'done' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={20} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-text-theme truncate pr-2">{file.originalFile.name}</p>
                      {file.status === 'done' && (
                        <span className="text-green-600 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {getFormatLabel(settings.targetFormat)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
                      <span>{getFormatLabel(file.originalFile.type)}</span>
                      <span>{formatSize(file.originalFile.size)}</span>
                      {file.status === 'done' && (
                        <>
                          <span>→</span>
                          <span className="font-bold text-text-theme">{formatSize(file.convertedFile.size)}</span>
                        </>
                      )}
                    </div>
                    {/* Progress bar */}
                    {file.status === 'converting' && (
                      <div className="w-full bg-div-secondary rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className="bg-accent h-full rounded-full transition-all duration-300 animate-pulse"
                          style={{ width: `${file.progress}%` }}
                        ></div>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <span className="text-red-500 text-xs mt-1 block">{file.error}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {file.status === 'done' && (
                      <>
                        <Tooltip content="对比预览">
                          <button
                            onClick={() => setCompareItem(file)}
                            className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors hidden sm:block"
                          >
                            <Eye size={18} />
                          </button>
                        </Tooltip>
                        <Tooltip content="下载此文件">
                          <button
                            onClick={() => {
                              const ext = OUTPUT_FORMATS.find(fmt => fmt.value === settings.targetFormat)?.ext || 'png';
                              saveAs(file.convertedFile, `${file.originalFile.name.replace(/\.[^.]+$/, '')}_converted.${ext}`);
                            }}
                            className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          >
                            <Download size={18} />
                          </button>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip content="移除">
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={convertAll}
              disabled={isConverting || files.filter(f => f.status === 'pending' || f.status === 'error').length === 0}
              className="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  转换中...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  开始转换 ({files.filter(f => f.status === 'pending' || f.status === 'error').length})
                </>
              )}
            </button>
            {completedCount > 0 && (
              <button
                onClick={downloadAll}
                className="px-6 py-3 border-2 border-accent text-accent rounded-xl font-bold hover:bg-accent hover:text-white transition-all flex items-center gap-2"
              >
                <Package size={20} />
                打包下载 ({completedCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Settings Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
        {/* Mode Toggle */}
        <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
          <h3 className="font-bold text-text-theme mb-3 flex items-center gap-2">
            <Settings2 size={18} className="text-accent" />
            转换模式
          </h3>
          <div className="flex bg-div-secondary rounded-lg p-1">
            <button
              onClick={() => setMode('preset')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                mode === 'preset'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-theme'
              }`}
            >
              <Zap size={14} className="inline mr-1" />
              预设模式
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                mode === 'advanced'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-theme'
              }`}
            >
              <Settings2 size={14} className="inline mr-1" />
              高级模式
            </button>
          </div>
        </div>

        {/* Preset Mode */}
        {mode === 'preset' && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
            <h3 className="font-bold text-text-theme mb-3 flex items-center gap-2">
              <Zap size={18} className="text-accent" />
              一键预设
            </h3>
            <div className="space-y-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activePreset === preset.name
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-border-theme bg-div-secondary hover:border-accent/50'
                  }`}
                >
                  <div className="font-bold text-sm text-text-theme flex items-center gap-2">
                    {preset.name}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-normal">
                      {getFormatLabel(preset.target)}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1">{preset.desc}</div>
                  <div className="text-xs text-text-secondary mt-1">
                    画质 {Math.round(preset.quality * 100)}% · 最大 {preset.maxSize}px
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {mode === 'advanced' && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
            <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
              <Settings2 size={18} className="text-accent" />
              高级设置
            </h3>
            <div className="space-y-5">
              {/* Target Format */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="block text-sm font-medium text-text-secondary">目标格式</label>
                  <Tooltip content="选择导出文件的图片格式，不同格式适用于不同场景">
                    <Info size={13} className="text-text-secondary cursor-help" />
                  </Tooltip>
                </div>
                <div className="space-y-1.5">
                  {OUTPUT_FORMATS.map(fmt => (
                    <button
                      key={fmt.value}
                      onClick={() => setSettings({ ...settings, targetFormat: fmt.value })}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                        settings.targetFormat === fmt.value
                          ? 'border-accent bg-accent/5 text-accent font-bold'
                          : 'border-border-theme bg-div-secondary text-text-secondary hover:border-accent/50'
                      }`}
                    >
                      <span>{fmt.label}</span>
                      <span className="text-xs opacity-70">{fmt.ext}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              {isLossyFormat && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="block text-sm font-medium text-text-secondary">
                      导出画质: {Math.round(settings.quality * 100)}%
                    </label>
                    <Tooltip content="高画质文件体积更大，低画质文件更小。PNG/BMP 格式不受此参数影响">
                      <Info size={13} className="text-text-secondary cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.quality}
                    onChange={(e) => setSettings({ ...settings, quality: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>小体积</span>
                    <span>高画质</span>
                  </div>
                </div>
              )}

              {!isLossyFormat && (
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs text-text-secondary">
                  <Info size={14} className="inline mr-1 text-accent" />
                  {settings.targetFormat === 'image/png' ? 'PNG 为无损格式，画质参数不生效。' :
                   settings.targetFormat === 'image/bmp' ? 'BMP 为无压缩位图格式，文件可能较大。' :
                   settings.targetFormat === 'image/svg+xml' ? 'SVG 模式将栅格图嵌入为矢量容器文件。' : ''}
                </div>
              )}

              {/* Max Size */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    最大尺寸 (像素)
                  </label>
                  <Tooltip content="图片长边超过此值将等比缩放，设为较大值可保留原始分辨率">
                    <Info size={13} className="text-text-secondary cursor-help" />
                  </Tooltip>
                </div>
                <input
                  type="number"
                  value={settings.maxWidthOrHeight}
                  onChange={(e) => setSettings({ ...settings, maxWidthOrHeight: Math.max(1, parseInt(e.target.value) || 2048) })}
                  className="w-full rounded-lg border-2 border-border-theme bg-theme-primary text-text-primary text-sm py-2 px-3"
                  min="1"
                  max="8192"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>1px</span>
                  <span>8192px (8K)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {files.length > 0 && files.some(f => f.status === 'done') && (
          <button
            onClick={reconvertAll}
            className="w-full py-3 border-2 border-border-theme text-text-secondary rounded-xl font-bold hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            修改参数并重新转换
          </button>
        )}

        {/* Format Info */}
        <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
          <h3 className="font-bold text-text-theme mb-3 flex items-center gap-2">
            <FileImage size={18} className="text-accent" />
            格式速查
          </h3>
          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span className="font-bold text-text-theme">JPG</span>
              <span>有损压缩 · 兼容性最佳</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-text-theme">PNG</span>
              <span>无损 · 支持透明通道</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-text-theme">WebP</span>
              <span>新一代 · 体积小画质高</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-text-theme">BMP</span>
              <span>无压缩位图 · 体积大</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-text-theme">SVG</span>
              <span>矢量封装 · 嵌入栅格图</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      {compareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setCompareItem(null)}>
          <div className="bg-theme-primary rounded-2xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-theme truncate">预览对比: {compareItem.originalFile.name}</h3>
              <div className="flex items-center gap-4">
                <span className="text-xs text-text-secondary">
                  原图 {formatSize(compareItem.originalFile.size)} → 转换后 {compareItem.convertedFile ? formatSize(compareItem.convertedFile.size) : 'N/A'}
                </span>
                <button onClick={() => setCompareItem(null)} className="text-text-secondary hover:text-text-theme">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 relative bg-checkered p-4 flex items-center justify-center border-r border-border-theme">
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm z-10 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  原图
                </div>
                <img src={compareItem.originalPreview} className="max-w-full max-h-full object-contain rounded-lg" alt="original" />
              </div>
              <div className="flex-1 relative bg-checkered p-4 flex items-center justify-center">
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm z-10 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  转换后
                </div>
                {compareItem.convertedPreview ? (
                  <img src={compareItem.convertedPreview} className="max-w-full max-h-full object-contain rounded-lg" alt="converted" />
                ) : (
                  <div className="text-text-secondary">转换数据不可用</div>
                )}
              </div>
            </div>
            <div className="p-4 bg-div-secondary border-t border-border-theme flex justify-end gap-3">
              <button
                onClick={() => setCompareItem(null)}
                className="px-6 py-2 border border-border-theme text-text-secondary rounded-lg hover:bg-theme-secondary transition-colors"
              >
                关闭
              </button>
              {compareItem.convertedFile && (
                <button
                  onClick={() => {
                    const ext = OUTPUT_FORMATS.find(fmt => fmt.value === settings.targetFormat)?.ext || 'png';
                    saveAs(compareItem.convertedFile, `${compareItem.originalFile.name.replace(/\.[^.]+$/, '')}_converted.${ext}`);
                  }}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors"
                >
                  下载此图
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl text-white font-bold text-sm animate-slide-up flex items-center gap-2 max-w-md ${
          toast.type === 'error' ? 'bg-red-500' :
          toast.type === 'success' ? 'bg-green-500' :
          'bg-accent'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> :
           toast.type === 'success' ? <Check size={18} /> :
           <Info size={18} />}
          {toast.message}
        </div>
      )}

      <style>{`
        .bg-checkered {
          background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                            linear-gradient(-45deg, transparent 75%, #ccc 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          background-color: #fff;
        }
        [data-theme="dark"] .bg-checkered {
          background-image: linear-gradient(45deg, #333 25%, transparent 25%),
                            linear-gradient(-45deg, #333 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #333 75%),
                            linear-gradient(-45deg, transparent 75%, #333 75%);
          background-color: #1f2937;
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ImageFormatConverter;
