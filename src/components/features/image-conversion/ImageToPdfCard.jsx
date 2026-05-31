import React, { useRef, useCallback, useState } from 'react';
import {
  Upload, Download, X, Check, AlertCircle, Loader2,
  Settings2, FileText, Eye, FolderOpen, Info, Package,
  ChevronUp, ChevronDown, Image as ImageIcon, GripVertical
} from 'lucide-react';
import { useImageToPdf } from './hooks/useImageToPdf.js';
import { formatSize } from './utils/imageProcessor.js';
import { PAGE_SIZES } from './utils/pdfGenerator.js';

const PAGE_ALIGN = [
  { value: 'center', label: '居中' },
  { value: 'left', label: '居左' },
  { value: 'fill', label: '自适应填充' }
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

const ImageToPdfCard = () => {
  const {
    files, isConverting, progress, progressText,
    options, toast, fileInputRef,
    fileCount, totalSize,
    handleFileChange, removeFile, clearAll,
    moveFileUp, moveFileDown,
    updateOption, convert, download
  } = useImageToPdf();

  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/') ||
      f.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg|heic|heif|ico)$/i));
    if (imageFiles.length > 0) {
      handleFileChange({ target: { files: imageFiles, value: '' } });
    }
  }, [handleFileChange]);

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

  const hasOutput = !!options.outputBlob;

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
            type="file" ref={fileInputRef} multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,.heic,.heif,.ico"
            className="hidden" onChange={handleFileChange}
          />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
            dragOver ? 'bg-accent/30 text-accent' : 'bg-accent/20 text-accent'
          }`}>
            {dragOver ? <FolderOpen size={32} /> : <ImageIcon size={32} />}
          </div>
          <h3 className="text-xl font-bold text-text-theme mb-2">
            {dragOver ? '松开鼠标上传文件' : '上传图片'}
          </h3>
          <p className="text-text-secondary text-sm text-center max-w-md">
            支持 JPG / PNG / WebP / BMP / GIF / SVG 等主流图片格式
          </p>
          <p className="text-text-secondary text-xs mt-2">
            单文件上限 20MB，批量总大小不超过 200MB
          </p>
          {dragOver && (
            <div className="absolute inset-0 rounded-xl border-2 border-accent bg-accent/5 pointer-events-none animate-pulse"></div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme overflow-hidden">
            <div className="p-4 border-b border-border-theme bg-div-secondary flex justify-between items-center">
              <h3 className="font-bold text-text-theme">
                文件列表 ({fileCount}) · 共 {formatSize(totalSize)}
              </h3>
              <button onClick={clearAll} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1">
                清空全部
              </button>
            </div>
            <div className="divide-y divide-border-theme max-h-[500px] overflow-y-auto">
              {files.map((file, idx) => (
                <div key={file.id} className="p-3 flex items-center gap-3 hover:bg-div-secondary transition-colors">
                  {/* Drag handle / order */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => moveFileUp(file.id)}
                      disabled={idx === 0}
                      className="p-0.5 text-text-secondary hover:text-accent disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <span className="text-xs text-text-secondary w-5 text-center">{idx + 1}</span>
                    <button
                      onClick={() => moveFileDown(file.id)}
                      disabled={idx === files.length - 1}
                      className="p-0.5 text-text-secondary hover:text-accent disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 bg-div-secondary rounded-lg overflow-hidden flex-shrink-0 border border-border-theme">
                    <img src={file.previewUrl} className="w-full h-full object-cover" alt="preview" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-theme text-sm truncate">{file.file.name}</p>
                    <p className="text-xs text-text-secondary">{formatSize(file.file.size)}</p>
                    {file.status === 'error' && (
                      <p className="text-red-500 text-xs mt-0.5">{file.error}</p>
                    )}
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
              <span className="text-sm font-bold text-text-theme">{progressText}</span>
            </div>
            <div className="w-full bg-div-secondary rounded-full h-3 overflow-hidden">
              <div className="bg-accent h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-text-secondary mt-2 text-right">{progress}%</p>
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={convert}
              disabled={isConverting}
              className="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <><Loader2 size={20} className="animate-spin" />处理中...</>
              ) : (
                <><FileText size={20} />生成 PDF</>
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
      </div>

      {/* Settings Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
        {/* Mode Selector */}
        <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
          <h3 className="font-bold text-text-theme mb-3 flex items-center gap-2">
            <Settings2 size={18} className="text-accent" />
            转换模式
          </h3>
          <div className="flex bg-div-secondary rounded-lg p-1 mb-3">
            <button
              onClick={() => updateOption('mode', 'merge')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                options.mode === 'merge'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-theme'
              }`}
            >
              <FileText size={14} className="inline mr-1" />合并模式
            </button>
            <button
              onClick={() => updateOption('mode', 'split')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                options.mode === 'split'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-theme'
              }`}
            >
              <Package size={14} className="inline mr-1" />分页模式
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            {options.mode === 'merge'
              ? '将所有图片按顺序合并为单个连续 PDF 文件'
              : '每张图片独立生成 PDF，最终以 ZIP 压缩包输出'}
          </p>
        </div>

        {/* Merge mode settings */}
        {options.mode === 'merge' && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5 space-y-5">
            <h3 className="font-bold text-text-theme flex items-center gap-2">
              <Settings2 size={18} className="text-accent" />PDF 页面设置
            </h3>

            {/* Page Size */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-sm font-medium text-text-secondary">页面尺寸</label>
                <Tooltip content="选择 PDF 页面的尺寸规格，'适配原图' 将按图片原始比例生成页面">
                  <Info size={13} className="text-text-secondary cursor-help" />
                </Tooltip>
              </div>
              <select
                value={options.pageSize}
                onChange={(e) => updateOption('pageSize', e.target.value)}
                className="w-full rounded-lg border-2 border-border-theme bg-theme-primary text-text-primary text-sm py-2 px-3"
              >
                <option value="fit">适配原图比例</option>
                {Object.entries(PAGE_SIZES).map(([key]) => (
                  key !== 'fit' && <option key={key} value={key}>{key}</option>
                ))}
                <option value="custom">自定义</option>
              </select>
            </div>

            {/* Custom Size */}
            {options.pageSize === 'custom' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">宽 (mm)</label>
                  <input type="number" value={options.customSize?.[0] || 210}
                    onChange={(e) => updateOption('customSize', [parseInt(e.target.value) || 210, options.customSize?.[1] || 297])}
                    className="w-full rounded-lg border-2 border-border-theme bg-theme-primary text-text-primary text-sm py-2 px-3" min="10" max="1000" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">高 (mm)</label>
                  <input type="number" value={options.customSize?.[1] || 297}
                    onChange={(e) => updateOption('customSize', [options.customSize?.[0] || 210, parseInt(e.target.value) || 297])}
                    className="w-full rounded-lg border-2 border-border-theme bg-theme-primary text-text-primary text-sm py-2 px-3" min="10" max="1000" />
                </div>
              </div>
            )}

            {/* Alignment */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">图片对齐方式</label>
              <div className="flex gap-2">
                {PAGE_ALIGN.map(a => (
                  <button key={a.value}
                    onClick={() => updateOption('align', a.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                      options.align === a.value
                        ? 'border-accent bg-accent/5 text-accent font-bold'
                        : 'border-border-theme bg-div-secondary text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-sm font-medium text-text-secondary">
                  页边距: {options.margin}mm
                </label>
                <Tooltip content="PDF 页面四边留白的宽度，0-50mm 可调">
                  <Info size={13} className="text-text-secondary cursor-help" />
                </Tooltip>
              </div>
              <input type="range" min="0" max="50" value={options.margin}
                onChange={(e) => updateOption('margin', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent" />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>0mm</span><span>50mm</span>
              </div>
            </div>
          </div>
        )}

        {/* Split mode settings */}
        {options.mode === 'split' && (
          <div className="bg-theme-primary rounded-xl shadow-lg border border-border-theme p-5">
            <h3 className="font-bold text-text-theme mb-3 flex items-center gap-2">
              <Settings2 size={18} className="text-accent" />ZIP 打包设置
            </h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">压缩包文件名前缀</label>
              <input type="text" value={options.zipPrefix}
                onChange={(e) => updateOption('zipPrefix', e.target.value || 'images-pdf')}
                className="w-full rounded-lg border-2 border-border-theme bg-theme-primary text-text-primary text-sm py-2 px-3"
                placeholder="images-pdf" />
              <p className="text-xs text-text-secondary mt-2">
                最终文件名为：{options.zipPrefix}_{'{时间戳}'}.zip
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
          <h3 className="font-bold text-text-theme mb-2 flex items-center gap-2 text-sm">
            <Info size={16} className="text-accent" />使用提示
          </h3>
          <ul className="text-xs text-text-secondary space-y-1.5">
            <li>• 通过上下箭头按钮调整合并模式下图片的排列顺序</li>
            <li>• 合并模式支持自定义 A4/A3/Letter 等标准纸张尺寸</li>
            <li>• 所有处理在浏览器本地完成，图片不会上传到服务器</li>
            <li>• 生成的 PDF 兼容 Adobe Acrobat、福昕阅读器等主流阅读器</li>
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

export default ImageToPdfCard;
