import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const ImageCropper = () => {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.9);

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
        setCroppedImage(null);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const getCropData = () => {
    if (typeof cropperRef.current?.cropper !== 'undefined') {
      setCroppedImage(cropperRef.current?.cropper.getCroppedCanvas().toDataURL(format, quality));
    }
  };

  const rotate = (deg) => {
    cropperRef.current?.cropper.rotate(deg);
  };

  const scaleX = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
        cropper.scaleX(cropper.getData().scaleX === -1 ? 1 : -1);
    }
  };
  
  const scaleY = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
        cropper.scaleY(cropper.getData().scaleY === -1 ? 1 : -1);
    }
  };

  const setAspectRatio = (ratio) => {
    cropperRef.current?.cropper.setAspectRatio(ratio);
  };

  const downloadImage = () => {
    if (!croppedImage) return;
    const link = document.createElement('a');
    link.download = `cropped-image.${format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png'}`;
    link.href = croppedImage;
    link.click();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
      {!image ? (
        <div 
          className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 m-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => fileInputRef.current.click()}
          onDrop={handleFileChange}
          onDragOver={(e) => e.preventDefault()}
        >
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <p className="text-xl text-gray-500 font-medium">点击或拖拽图片到这里</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="flex flex-col h-full">
            {/* Header / Toolbar */}
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-2 overflow-x-auto flex items-center gap-2">
                <button onClick={() => setImage(null)} className="btn-secondary text-sm px-3 py-1.5 mr-2">重新上传</button>
                
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                
                <button onClick={() => setAspectRatio(NaN)} className="btn-icon" title="自由比例">Free</button>
                <button onClick={() => setAspectRatio(1)} className="btn-icon" title="1:1">1:1</button>
                <button onClick={() => setAspectRatio(16/9)} className="btn-icon" title="16:9">16:9</button>
                <button onClick={() => setAspectRatio(4/3)} className="btn-icon" title="4:3">4:3</button>
                
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

                <button onClick={() => rotate(-90)} className="btn-icon" title="向左旋转">↺</button>
                <button onClick={() => rotate(90)} className="btn-icon" title="向右旋转">↻</button>
                <button onClick={scaleX} className="btn-icon" title="水平翻转">↔</button>
                <button onClick={scaleY} className="btn-icon" title="垂直翻转">↕</button>

                <div className="flex-1"></div>

                <button onClick={getCropData} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                    裁剪预览
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Editor */}
                <div className="flex-1 bg-black relative">
                    <Cropper
                        src={image}
                        style={{ height: '100%', width: '100%' }}
                        initialAspectRatio={NaN}
                        guides={true}
                        ref={cropperRef}
                        viewMode={1}
                        dragMode="move"
                        background={false}
                        autoCropArea={0.8}
                    />
                </div>

                {/* Preview & Export Sidebar */}
                {croppedImage && (
                    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col p-4 overflow-y-auto z-10 shadow-xl absolute right-0 bottom-0 top-12 md:relative md:top-0">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-white">导出预览</h3>
                            <button onClick={() => setCroppedImage(null)} className="text-gray-400 hover:text-gray-600 md:hidden">✕</button>
                        </div>
                        
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4 flex items-center justify-center min-h-[200px]">
                            <img src={croppedImage} className="max-w-full max-h-60 object-contain" />
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">格式</label>
                                <select 
                                    value={format} 
                                    onChange={(e) => { setFormat(e.target.value); setTimeout(getCropData, 0); }}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                                >
                                    <option value="image/png">PNG</option>
                                    <option value="image/jpeg">JPG</option>
                                    <option value="image/webp">WEBP</option>
                                </select>
                            </div>
                            
                            {(format === 'image/jpeg' || format === 'image/webp') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">质量: {Math.round(quality * 100)}%</label>
                                    <input 
                                        type="range" 
                                        min="0.1" 
                                        max="1" 
                                        step="0.1" 
                                        value={quality} 
                                        onChange={(e) => { setQuality(parseFloat(e.target.value)); setTimeout(getCropData, 0); }}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={downloadImage}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-auto"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            下载图片
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageCropper;