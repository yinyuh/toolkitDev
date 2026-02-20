import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const FaviconGenerator = () => {
  const [image, setImage] = useState(null);
  const [cropData, setCropData] = useState(null);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState({});
  const SIZES = [16, 32, 48, 64, 180, 512]; // Common favicon sizes

  const handleFileChange = (e) => {
    e.preventDefault();
    let files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const getCropData = () => {
    if (typeof cropperRef.current?.cropper !== 'undefined') {
      // Get cropped canvas
      const canvas = cropperRef.current.cropper.getCroppedCanvas({
        width: 512,
        height: 512,
      });
      
      setCropData(canvas.toDataURL());
      generatePreviews(canvas);
    }
  };

  const generatePreviews = (sourceCanvas) => {
    const newPreviews = {};
    SIZES.forEach(size => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sourceCanvas, 0, 0, size, size);
        newPreviews[size] = canvas.toDataURL('image/png');
    });
    setPreviews(newPreviews);
  };

  // Generate simple ICO file from 32x32 PNG (simplified)
  // For a robust ICO with multiple layers, we would need a binary writer.
  // For client-side simplicity without heavy libs, we can save PNGs or use a lightweight ICO encoder.
  // Here we will generate a ZIP with PNGs and a simple ICO (just header + 32x32 png data).
  // Note: Modern browsers support PNG favicons.
  
  const downloadPackage = async () => {
    if (!cropData) return;

    const zip = new JSZip();
    
    // Add PNGs
    for (const [size, dataUrl] of Object.entries(previews)) {
        const data = dataUrl.split(',')[1];
        zip.file(`favicon-${size}x${size}.png`, data, {base64: true});
        
        // Special names
        if (size == '180') zip.file('apple-touch-icon.png', data, {base64: true});
        if (size == '512') zip.file('android-chrome-512x512.png', data, {base64: true});
    }

    // Try to create a basic ICO (16, 32, 48)
    // Since implementing full ICO encoder is complex here, we will just offer PNGs
    // and maybe a single layer ICO if possible or just rely on modern PNG support.
    // However, users expect favicon.ico.
    // Let's use a simple approach: just rename 32x32 png to ico (works in many cases) 
    // OR better, create a zip.
    
    // Generate content
    const content = await zip.generateAsync({type: "blob"});
    saveAs(content, "favicon-package.zip");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      {/* Left: Upload & Crop */}
      <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">1. 上传与裁剪</h2>
        
        {!image ? (
          <div 
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => fileInputRef.current.click()}
            onDrop={handleFileChange}
            onDragOver={(e) => e.preventDefault()}
          >
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p className="text-gray-500 font-medium">点击或拖拽上传图片</p>
            <p className="text-gray-400 text-sm mt-1">建议 512x512 以上</p>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                <Cropper
                    src={image}
                    style={{ height: '100%', width: '100%' }}
                    initialAspectRatio={1}
                    aspectRatio={1}
                    guides={true}
                    ref={cropperRef}
                    viewMode={1}
                    dragMode="move"
                    background={false}
                    cropend={getCropData}
                    ready={getCropData}
                />
            </div>
            <div className="flex gap-2 mt-4">
                <button 
                    onClick={() => setImage(null)}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    重新上传
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Preview & Download */}
      <div className="w-full md:w-1/2 p-6 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">2. 预览与下载</h2>
        
        <div className="flex-1 overflow-y-auto">
            {!cropData ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>请先上传并裁剪图片</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Browser Preview Mockup */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase">浏览器标签页预览</h3>
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-2 rounded-t-lg border-b border-gray-200 dark:border-gray-700 w-64">
                            <img src={previews[16]} className="w-4 h-4 rounded-sm" />
                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">My Awesome Website</span>
                            <span className="ml-auto text-gray-400">×</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 h-12 w-full border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg"></div>
                    </div>

                    {/* Icon Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[16, 32, 48, 64].map(size => (
                            <div key={size} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-md">
                                    <img src={previews[size]} style={{ width: size > 48 ? 48 : size, height: size > 48 ? 48 : size }} />
                                </div>
                                <div>
                                    <p className="font-mono text-sm font-bold text-gray-700 dark:text-gray-200">{size}x{size}</p>
                                    <p className="text-xs text-gray-500">PNG</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Code Snippet */}
                    <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                        <code className="text-xs text-green-400 font-mono whitespace-pre">
{`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`}
                        </code>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
                onClick={downloadPackage}
                disabled={!cropData}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                下载图标包 (.zip)
            </button>
        </div>
      </div>
    </div>
  );
};

export default FaviconGenerator;