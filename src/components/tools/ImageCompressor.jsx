import React, { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ImageCompressor = () => {
  const [files, setFiles] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [settings, setSettings] = useState({
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.75, // 0 to 1
    fileType: 'original' // original, image/jpeg, image/webp
  });
  const [compareItem, setCompareItem] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      compressedFile: null,
      status: 'pending', // pending, compressing, done, error
      progress: 0,
      originalPreview: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    // Reset input
    e.target.value = '';
  };

  // Auto start compression when files added or settings changed (debounce?)
  // For simplicity, let's auto-compress new pending files
  // Re-compressing all on setting change might be heavy, so maybe a "Apply" button or debounce.
  // Let's use a "Compress All" or auto-compress pending.
  // Here: Auto compress pending files.
  
  useEffect(() => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length > 0 && !isCompressing) {
      compressFiles(pendingFiles);
    }
  }, [files, isCompressing]);

  // Re-compress trigger
  const handleRecompress = () => {
    setFiles(prev => prev.map(f => ({ ...f, status: 'pending', compressedFile: null })));
  };

  const compressFiles = async (targetFiles) => {
    setIsCompressing(true);
    
    for (const fileItem of targetFiles) {
      // Update status to compressing
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'compressing', progress: 0 } : f));
      
      try {
        const options = {
          maxSizeMB: settings.maxSizeMB,
          maxWidthOrHeight: settings.maxWidthOrHeight,
          useWebWorker: settings.useWebWorker,
          initialQuality: settings.initialQuality,
          onProgress: (p) => {
             setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, progress: p } : f));
          }
        };

        if (settings.fileType !== 'original') {
            options.fileType = settings.fileType;
        }

        const compressedFile = await imageCompression(fileItem.originalFile, options);
        
        // Create a URL for preview
        const compressedPreview = URL.createObjectURL(compressedFile);

        setFiles(prev => prev.map(f => f.id === fileItem.id ? { 
            ...f, 
            status: 'done', 
            progress: 100, 
            compressedFile,
            compressedPreview
        } : f));

      } catch (error) {
        console.error("Compression error:", error);
        setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'error' } : f));
      }
    }
    
    setIsCompressing(false);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateReduction = (original, compressed) => {
    if (!original || !compressed) return 0;
    const reduction = ((original - compressed) / original) * 100;
    return reduction.toFixed(1);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const completedFiles = files.filter(f => f.status === 'done' && f.compressedFile);
    
    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
        saveAs(completedFiles[0].compressedFile, `min_${completedFiles[0].originalFile.name}`);
        return;
    }

    completedFiles.forEach(f => {
        zip.file(`min_${f.originalFile.name}`, f.compressedFile);
    });

    const content = await zip.generateAsync({type: "blob"});
    saveAs(content, "compressed_images.zip");
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col gap-6">
        
        {/* Upload Area */}
        <div 
            className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            onClick={() => fileInputRef.current.click()}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
                onChange={handleFileChange}
            />
            <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-text-theme mb-2">批量上传图片</h3>
            <p className="text-text-secondary text-sm">支持 JPG, PNG, WebP (单张最大 20MB)</p>
        </div>

        {/* List */}
        {files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-border-theme bg-div-secondary flex justify-between items-center">
                    <h3 className="font-bold text-text-theme">压缩列表 ({files.length})</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setFiles([])} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1">清空</button>
                    </div>
                </div>
                
                <div className="divide-y divide-border-theme">
                    {files.map(file => (
                        <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-div-hover dark:hover:bg-div-hover transition-colors">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 bg-div-secondary rounded-lg overflow-hidden flex-shrink-0 border border-border-theme cursor-pointer" onClick={() => file.status === 'done' && setCompareItem(file)}>
                                <img src={file.compressedPreview || file.originalPreview} className="w-full h-full object-cover" alt="thumbnail" />
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-medium text-text-theme truncate pr-2">{file.originalFile.name}</p>
                                    {file.status === 'done' && (
                                        <span className="text-green-600 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                            -{calculateReduction(file.originalFile.size, file.compressedFile.size)}%
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-text-secondary flex items-center gap-2">
                                    <span>{formatSize(file.originalFile.size)}</span>
                                    {file.status === 'done' && (
                                        <>
                                            <span>→</span>
                                            <span className="font-bold text-text-theme">{formatSize(file.compressedFile.size)}</span>
                                        </>
                                    )}
                                </div>
                                {/* Progress */}
                                {file.status === 'compressing' && (
                                    <div className="w-full bg-div-secondary rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className="bg-accent h-full rounded-full transition-all duration-300" style={{width: `${file.progress}%`}}></div>
                                    </div>
                                )}
                                {file.status === 'error' && <span className="text-red-500 text-xs">压缩失败</span>}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {file.status === 'done' && (
                                    <>
                                        <button 
                                            onClick={() => setCompareItem(file)}
                                            className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors hidden sm:block"
                                            title="对比预览"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                        <button 
                                            onClick={() => saveAs(file.compressedFile, `min_${file.originalFile.name}`)}
                                            className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                            title="下载"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={() => removeFile(file.id)}
                                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Settings Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                压缩设置
            </h3>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        压缩质量: {Math.round(settings.initialQuality * 100)}%
                    </label>
                    <input 
                            type="range" 
                            min="0.1" 
                            max="1" 
                            step="0.05" 
                            value={settings.initialQuality}
                            onChange={(e) => setSettings({...settings, initialQuality: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                        <span>低画质</span>
                        <span>高画质</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        输出格式
                    </label>
                    <select 
                        value={settings.fileType}
                        onChange={(e) => setSettings({...settings, fileType: e.target.value})}
                        className="w-full rounded-lg border-border-theme bg-white dark:bg-gray-800 text-sm py-2 px-3"
                    >
                        <option value="original">保持原格式</option>
                        <option value="image/jpeg">JPEG (更小)</option>
                        <option value="image/webp">WebP (推荐)</option>
                        <option value="image/png">PNG</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        最大尺寸 (宽/高)
                    </label>
                    <input 
                            type="number"
                            value={settings.maxWidthOrHeight}
                            onChange={(e) => setSettings({...settings, maxWidthOrHeight: parseInt(e.target.value)})}
                            className="w-full rounded-lg border-border-theme bg-white dark:bg-gray-800 text-sm py-2 px-3"
                        />
                </div>

                <button 
                    onClick={handleRecompress}
                    className="w-full py-2 bg-div-secondary text-text-theme font-medium rounded-lg hover:bg-div-hover dark:hover:bg-div-hover transition-colors"
                >
                    应用并重新压缩
                </button>
            </div>
        </div>

        {files.length > 0 && (
            <button 
                onClick={downloadAll}
                disabled={files.filter(f => f.status === 'done').length === 0}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                下载全部 ({files.filter(f => f.status === 'done').length})
            </button>
        )}
      </div>

      {/* Compare Modal */}
      {compareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setCompareItem(null)}>
            <div className="bg-div-theme rounded-2xl overflow-hidden w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-theme flex justify-between items-center">
                    <h3 className="font-bold text-lg text-text-theme">画质对比: {compareItem.originalFile.name}</h3>
                    <button onClick={() => setCompareItem(null)} className="text-text-secondary hover:text-text-theme">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
                    <div className="flex-1 relative bg-checkered p-4 flex items-center justify-center border-r border-border-theme">
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm z-10">
                            原图 ({formatSize(compareItem.originalFile.size)})
                        </div>
                        <img src={compareItem.originalPreview} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 relative bg-checkered p-4 flex items-center justify-center">
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm z-10">
                            压缩后 ({formatSize(compareItem.compressedFile.size)})
                        </div>
                        <img src={compareItem.compressedPreview} className="max-w-full max-h-full object-contain" />
                    </div>
                </div>
                <div className="p-4 bg-div-secondary border-t border-border-theme flex justify-end">
                    <button 
                        onClick={() => saveAs(compareItem.compressedFile, `min_${compareItem.originalFile.name}`)}
                        className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium"
                    >
                        下载此图
                    </button>
                </div>
            </div>
        </div>
      )}
      
      <style jsx>{`
        .bg-checkered {
            background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), 
                              linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #ccc 75%), 
                              linear-gradient(-45deg, transparent 75%, #ccc 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            background-color: #fff;
        }
        :global(.dark) .bg-checkered {
            background-image: linear-gradient(45deg, #333 25%, transparent 25%), 
                              linear-gradient(-45deg, #333 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #333 75%), 
                              linear-gradient(-45deg, transparent 75%, #333 75%);
            background-color: #1f2937;
        }
      `}</style>
    </div>
  );
};

export default ImageCompressor;