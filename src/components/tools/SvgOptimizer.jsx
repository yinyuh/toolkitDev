import React, { useState, useEffect, useRef } from 'react';
// import { optimize } from 'svgo/browser'; // Removed static import
import { Upload, Download, Copy, RefreshCw, Image as ImageIcon, Code, AlertCircle, Check } from 'lucide-react';
import { saveAs } from 'file-saver';

const SvgOptimizer = () => {
  const [inputSvg, setInputSvg] = useState('');
  const [outputSvg, setOutputSvg] = useState('');
  const [fileName, setFileName] = useState('image.svg');
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedSize, setOptimizedSize] = useState(0);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'code'
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Default plugins configuration
  const [plugins, setPlugins] = useState({
    removeDoctype: true,
    removeXMLProcInst: true,
    removeComments: true,
    removeMetadata: true,
    removeEditorsNSData: true,
    cleanupAttrs: true,
    mergeStyles: true,
    inlineStyles: true,
    minifyStyles: true,
    cleanupIds: true,
    removeUselessDefs: true,
    cleanupNumericValues: true,
    convertColors: true,
    removeUnknownsAndDefaults: true,
    removeNonInheritableGroupAttrs: true,
    removeUselessStrokeAndFill: true,
    removeViewBox: false, // Usually want to keep viewBox
    cleanupEnableBackground: true,
    removeHiddenElems: true,
    removeEmptyText: true,
    convertShapeToPath: true,
    convertEllipseToCircle: true,
    moveElemsAttrsToGroup: true,
    moveGroupAttrsToElems: true,
    collapseGroups: true,
    convertPathData: true,
    convertTransform: false, // Disabled to avoid console warning
    removeEmptyAttrs: true,
    removeEmptyContainers: true,
    mergePaths: true,
    removeUnusedNS: true,
    sortAttrs: true,
    sortDefsChildren: true,
    removeTitle: true,
    removeDesc: true,
  });

  // Precision settings
  const [numericPrecision, setNumericPrecision] = useState(2);
  const [transformPrecision, setTransformPrecision] = useState(2);

  const fileInputRef = useRef(null);

  // Format bytes helper
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Optimization logic
  useEffect(() => {
    if (!inputSvg) {
      setOutputSvg('');
      setOptimizedSize(0);
      return;
    }

    const runOptimization = async () => {
      setIsProcessing(true);
      setError(null);
      try {
        // Construct plugins array for svgo
        const enabledPlugins = Object.entries(plugins)
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name);

        // Dynamic import svgo
        const { optimize } = await import('svgo/browser');

        // Construct plugins with precision settings
        const pluginsConfig = enabledPlugins.map(pluginName => {
          if (pluginName === 'cleanupNumericValues') {
            return {
              name: pluginName,
              params: {
                floatPrecision: numericPrecision
              }
            };
          }
          if (pluginName === 'convertPathData') {
            return {
              name: pluginName,
              params: {
                floatPrecision: numericPrecision
              }
            };
          }
          if (pluginName === 'convertTransform') {
            return {
              name: pluginName,
              params: {
                floatPrecision: transformPrecision
              }
            };
          }
          return pluginName;
        });

        const result = optimize(inputSvg, {
          multipass: true,
          plugins: pluginsConfig,
          js2svg: {
            indent: 2,
            pretty: true, // Make it readable in code view
          }
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setOutputSvg(result.data);
        setOptimizedSize(new Blob([result.data]).size);
      } catch (err) {
        console.error("Optimization error:", err);
        setError("SVG 解析或优化失败: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    // Debounce optimization
    const timer = setTimeout(runOptimization, 300);
    return () => clearTimeout(timer);
  }, [inputSvg, plugins, numericPrecision, transformPrecision]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
      setError("请上传 SVG 文件");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setInputSvg(content);
      setOriginalSize(file.size);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
        setError("请上传 SVG 文件");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        setInputSvg(content);
        setOriginalSize(file.size);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = (e) => {
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    if (paste && paste.trim().startsWith('<svg')) {
      setInputSvg(paste);
      setOriginalSize(new Blob([paste]).size);
      setFileName('pasted.svg');
      setError(null);
    }
  };

  const handleDownload = () => {
    if (!outputSvg) return;
    const blob = new Blob([outputSvg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, `optimized-${fileName}`);
  };

  const handleCopy = () => {
    if (!outputSvg) return;
    navigator.clipboard.writeText(outputSvg);
    setToastMessage('已复制 SVG 代码');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const togglePlugin = (key) => {
    setPlugins(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to get savings percentage
  const getSavings = () => {
    if (!originalSize || !optimizedSize) return 0;
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  };

  // Plugin descriptions mapping (can be expanded)
  const pluginLabels = {
    removeDoctype: "移除 Doctype",
    removeXMLProcInst: "移除 XML 指令",
    removeComments: "移除注释",
    removeMetadata: "移除元数据",
    removeEditorsNSData: "移除编辑器数据",
    cleanupAttrs: "清理属性",
    mergeStyles: "合并样式",
    inlineStyles: "内联样式",
    minifyStyles: "压缩样式",
    cleanupIds: "清理 IDs",
    removeUselessDefs: "移除无用 Defs",
    cleanupNumericValues: "清理数值",
    convertColors: "转换颜色格式",
    removeUnknownsAndDefaults: "移除未知/默认属性",
    removeNonInheritableGroupAttrs: "移除不可继承组属性",
    removeUselessStrokeAndFill: "移除无用描边/填充",
    removeViewBox: "移除 ViewBox (慎用)",
    cleanupEnableBackground: "清理 enable-background",
    removeHiddenElems: "移除隐藏元素",
    removeEmptyText: "移除空文本",
    convertShapeToPath: "形状转路径",
    convertEllipseToCircle: "椭圆转圆",
    moveElemsAttrsToGroup: "移动属性到组",
    moveGroupAttrsToElems: "移动属性到元素",
    collapseGroups: "折叠组",
    convertPathData: "转换路径数据",
    convertTransform: "转换变换",
    removeEmptyAttrs: "移除空属性",
    removeEmptyContainers: "移除空容器",
    mergePaths: "合并路径",
    removeUnusedNS: "移除未使用命名空间",
    sortAttrs: "排序属性",
    sortDefsChildren: "排序 Defs 子元素",
    removeTitle: "移除 Title",
    removeDesc: "移除 Desc",
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6" onPaste={handlePaste}>
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-down">
          {toastMessage}
        </div>
      )}

      {/* Header Area */}
      <div className="mb-8">
        {/* Hidden file input (only one instance) */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".svg" 
          className="hidden" 
        />
        
        {!inputSvg ? (
          /* Centered upload area when no file is uploaded */
          <div className="flex justify-center">
            <div className="max-w-2xl w-full">
              <div 
                className="border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer border-theme-primary bg-theme-primary/5 hover:bg-theme-primary/10"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => { fileInputRef.current.value = ''; fileInputRef.current?.click(); }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-theme-primary/10 rounded-full text-theme-primary">
                    <Upload size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-theme mb-2">
                      点击上传或拖拽 SVG 文件
                    </h3>
                    <p className="text-text-secondary">
                      或者直接 Ctrl+V 粘贴 SVG 代码
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Side-by-side layout when file is uploaded */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Area */}
            <div>
              <div 
                className="border-2 border-dashed rounded-xl p-4 transition-colors cursor-pointer border-border-theme bg-theme-secondary h-full"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => { fileInputRef.current.value = ''; fileInputRef.current?.click(); }}
              >
                <div className="flex flex-col items-center gap-3 h-full justify-center">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check size={20} />
                    <span className="text-md font-medium">{fileName}</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current.value = ''; fileInputRef.current?.click(); }}
                      className="px-3 py-1 bg-div-secondary text-text-theme rounded-lg text-xs hover:bg-div-hover transition-colors cursor-pointer"
                    >
                      重新上传
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setInputSvg(''); setOutputSvg(''); setFileName('image.svg'); setOriginalSize(0); setOptimizedSize(0); }}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                    >
                      清除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Stats */}
            {outputSvg && (
              <div className="animate-fade-in">
                <div className="w-full px-4 py-4 bg-theme-primary rounded-lg shadow-sm border border-border-theme flex flex-col items-center gap-2 h-full">
                  <div className="text-center">
                    <div className="text-xs text-text-secondary">原始大小</div>
                    <div className="font-mono font-bold text-text-theme">{formatBytes(originalSize)}</div>
                  </div>
                  <div className="text-text-secondary">→</div>
                  <div className="text-center">
                    <div className="text-xs text-text-secondary">优化后</div>
                    <div className="font-mono font-bold text-theme-primary">{formatBytes(optimizedSize)}</div>
                  </div>
                  <div className="mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold text-sm">
                    -{getSavings()}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {inputSvg && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-theme-primary rounded-xl shadow-sm border border-border-theme p-4">
              <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
                <RefreshCw size={18} />
                优化选项
              </h3>
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button 
                  onClick={() => {
                    const newPlugins = Object.fromEntries(
                      Object.entries(plugins).map(([key]) => [key, true])
                    );
                    setPlugins(newPlugins);
                  }}
                  className="px-3 py-1 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  全选
                </button>
                <button 
                  onClick={() => {
                    const newPlugins = Object.fromEntries(
                      Object.entries(plugins).map(([key]) => [key, false])
                    );
                    setPlugins(newPlugins);
                  }}
                  className="px-3 py-1 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  全不选
                </button>
                <button 
                  onClick={() => {
                    const newPlugins = Object.fromEntries(
                      Object.entries(plugins).map(([key, value]) => [key, !value])
                    );
                    setPlugins(newPlugins);
                  }}
                  className="px-3 py-1 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  反选
                </button>
                <button 
                  onClick={() => setPlugins({
                    removeDoctype: true,
                    removeXMLProcInst: true,
                    removeComments: true,
                    removeMetadata: true,
                    removeEditorsNSData: true,
                    cleanupAttrs: true,
                    mergeStyles: true,
                    inlineStyles: true,
                    minifyStyles: true,
                    cleanupIds: true,
                    removeUselessDefs: true,
                    cleanupNumericValues: true,
                    convertColors: true,
                    removeUnknownsAndDefaults: true,
                    removeNonInheritableGroupAttrs: true,
                    removeUselessStrokeAndFill: true,
                    removeViewBox: false,
                    cleanupEnableBackground: true,
                    removeHiddenElems: true,
                    removeEmptyText: true,
                    convertShapeToPath: true,
                    convertEllipseToCircle: true,
                    moveElemsAttrsToGroup: true,
                    moveGroupAttrsToElems: true,
                    collapseGroups: true,
                    convertPathData: true,
                    convertTransform: false, // Disabled to avoid console warning
                    removeEmptyAttrs: true,
                    removeEmptyContainers: true,
                    mergePaths: true,
                    removeUnusedNS: true,
                    sortAttrs: true,
                    sortDefsChildren: true,
                    removeTitle: true,
                    removeDesc: true,
                  })}
                  className="px-3 py-1 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  重置
                </button>
              </div>
              
              {/* Precision Sliders */}
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    数值精度
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="6" 
                    step="1" 
                    value={numericPrecision}
                    onChange={(e) => setNumericPrecision(parseInt(e.target.value))}
                    className="w-full h-2 bg-div-theme rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>低</span>
                    <span>高</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    变换精度
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="6" 
                    step="1" 
                    value={transformPrecision}
                    onChange={(e) => setTransformPrecision(parseInt(e.target.value))}
                    className="w-full h-2 bg-div-theme rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>低</span>
                    <span>高</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(plugins).map(([key, enabled]) => (
                  <label key={key} className="flex items-center justify-between p-2 hover:bg-div-hover rounded cursor-pointer group">
                    <span className="text-sm text-text-secondary group-hover:text-text-theme">
                      {pluginLabels[key] || key}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={enabled} 
                      onChange={() => togglePlugin(key)}
                      className="w-4 h-4 text-theme-primary rounded border-border-theme focus:ring-theme-primary"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-theme-primary p-2 rounded-lg border border-border-theme shadow-sm">
              <div className="flex bg-div-secondary p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                    viewMode === 'preview' 
                      ? 'bg-theme-primary text-theme-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-theme'
                  }`}
                >
                  <ImageIcon size={16} />
                  图形预览
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                    viewMode === 'code' 
                      ? 'bg-theme-primary text-theme-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-theme'
                  }`}
                >
                  <Code size={16} />
                  代码对比
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-2 text-text-secondary hover:bg-div-hover rounded-lg tooltip-trigger cursor-pointer"
                  title="复制 SVG 代码"
                >
                  <Copy size={20} />
                </button>
                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download size={18} />
                  下载
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-theme-primary rounded-xl shadow-sm border border-border-theme overflow-hidden min-h-[500px]">
              {viewMode === 'preview' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-[500px] divide-y md:divide-y-0 md:divide-x divide-border-theme">
                   {/* Original */}
                   <div className="p-4 flex flex-col h-full">
                      <div className="mb-2 text-sm font-medium text-text-secondary text-center">原始</div>
                      <div className="flex-1 bg-[url('/transparent-bg.png')] bg-repeat rounded-lg overflow-hidden flex items-center justify-center p-4 border border-border-theme relative">
                        <div dangerouslySetInnerHTML={{ __html: inputSvg }} className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto" />
                      </div>
                   </div>
                   {/* Optimized */}
                   <div className="p-4 flex flex-col h-full">
                      <div className="mb-2 text-sm font-medium text-theme-primary text-center">优化后</div>
                      <div className="flex-1 bg-[url('/transparent-bg.png')] bg-repeat rounded-lg overflow-hidden flex items-center justify-center p-4 border border-border-theme relative">
                        {isProcessing ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-theme-primary/50 backdrop-blur-sm z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: outputSvg }} className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto" />
                        )}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-[500px] divide-y md:divide-y-0 md:divide-x divide-border-theme">
                   {/* Original Code */}
                   <div className="flex flex-col h-full">
                      <div className="p-2 bg-div-secondary border-b border-border-theme text-center text-xs text-text-secondary">
                        原始代码
                      </div>
                      <textarea 
                        className="flex-1 w-full p-4 font-mono text-xs resize-none bg-div-secondary text-text-secondary focus:outline-none"
                        value={inputSvg}
                        readOnly
                      />
                   </div>
                   {/* Optimized Code */}
                   <div className="flex flex-col h-full relative">
                      <div className="p-2 bg-div-secondary border-b border-border-theme text-center text-xs text-theme-primary">
                        优化后代码
                      </div>
                      <textarea 
                        className="flex-1 w-full p-4 font-mono text-xs resize-none bg-theme-primary text-text-theme focus:outline-none"
                        value={outputSvg}
                        readOnly
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-theme-primary/50 backdrop-blur-sm z-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default SvgOptimizer;
