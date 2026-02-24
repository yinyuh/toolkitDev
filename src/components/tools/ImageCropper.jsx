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
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [outputSize, setOutputSize] = useState({ width: 0, height: 0 });
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

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
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setImage(imageUrl);
        // 直接设置 croppedImage 为原始图片，确保预览窗口显示
        setCroppedImage(imageUrl);
        
        // 获取原始图片尺寸
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          setOriginalSize({ width, height });
          setOutputSize({ width, height });
          // 自动生成初始预览
          setTimeout(getCropData, 300);
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value) || 0;
    if (lockAspectRatio && outputSize.height > 0) {
      const aspectRatio = outputSize.height / outputSize.width;
      const newHeight = Math.round(newWidth * aspectRatio);
      setOutputSize({ width: newWidth, height: newHeight });
    } else {
      setOutputSize({ ...outputSize, width: newWidth });
    }
    // 自动更新预览
    setTimeout(getCropData, 300);
  };

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value) || 0;
    if (lockAspectRatio && outputSize.width > 0) {
      const aspectRatio = outputSize.width / outputSize.height;
      const newWidth = Math.round(newHeight * aspectRatio);
      setOutputSize({ width: newWidth, height: newHeight });
    } else {
      setOutputSize({ ...outputSize, height: newHeight });
    }
    // 自动更新预览
    setTimeout(getCropData, 300);
  };

  const getCropData = () => {
    console.log('getCropData called');
    console.log('cropperRef.current:', cropperRef.current);
    console.log('croppedImage current value:', croppedImage);
    
    if (cropperRef.current && cropperRef.current.cropper) {
      console.log('Cropper instance found, trying to generate preview');
      try {
        // 直接使用 canvas 生成预览，不区分格式
        const canvas = cropperRef.current.cropper.getCroppedCanvas({
          width: outputSize.width,
          height: outputSize.height
        });
        const dataUrl = canvas.toDataURL('image/png');
        console.log('Generated data URL:', dataUrl.substring(0, 50) + '...');
        setCroppedImage(dataUrl);
        console.log('setCroppedImage called, croppedImage should now be set');
      } catch (error) {
        console.error('Error in getCropData:', error);
        // 即使出错也设置一个默认值，确保预览窗口显示
        setCroppedImage(image);
      }
    } else {
      console.error('Cropper instance not found');
      // 如果没有 cropper 实例，直接使用原始图片
      setCroppedImage(image);
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
    <div className="bg-div-theme rounded-xl shadow-lg border border-border-theme overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
      {!image ? (
        <div 
          className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border-theme rounded-lg bg-div-secondary m-4 cursor-pointer hover:bg-div-hover dark:hover:bg-div-hover transition-colors"
          onClick={() => fileInputRef.current.click()}
          onDrop={handleFileChange}
          onDragOver={(e) => e.preventDefault()}
        >
          <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <p className="text-xl text-text-secondary font-medium">点击或拖拽图片到这里</p>
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
            <div className="bg-div-secondary border-b border-border-theme p-2 overflow-x-auto flex items-center gap-2">
                <button onClick={() => setImage(null)} className="bg-accent hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer mr-2">重新上传</button>
                
                <div className="h-6 w-px bg-border-theme mx-1"></div>
                
                <button onClick={() => setAspectRatio(NaN)} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="自由比例">Free</button>
                <button onClick={() => setAspectRatio(1)} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="1:1">1:1</button>
                <button onClick={() => setAspectRatio(16/9)} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="16:9">16:9</button>
                <button onClick={() => setAspectRatio(4/3)} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="4:3">4:3</button>
                
                <div className="h-6 w-px bg-border-theme mx-1"></div>

                <button onClick={() => rotate(-90)} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="向左旋转">↺</button>
                <button onClick={() => rotate(90)} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="向右旋转">↻</button>
                <button onClick={scaleX} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="水平翻转">↔</button>
                <button onClick={scaleY} className="bg-div-theme hover:bg-theme-secondary text-text-primary px-2 py-1 rounded-md text-sm transition-colors cursor-pointer" title="垂直翻转">↕</button>

                <div className="h-6 w-px bg-border-theme mx-1"></div>

                {/* 原始尺寸显示 */}
                <div className="text-sm text-text-secondary whitespace-nowrap">
                    原始尺寸: {originalSize.width} × {originalSize.height}
                </div>

                <div className="h-6 w-px bg-border-theme mx-1"></div>

                {/* 输出尺寸控制 */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">输出尺寸:</span>
                    <input
                        type="number"
                        value={outputSize.width}
                        onChange={handleWidthChange}
                        className="w-20 px-2 py-1 border border-border-theme rounded-md bg-div-theme text-sm"
                        min="1"
                    />
                    <span className="text-text-secondary">×</span>
                    <input
                        type="number"
                        value={outputSize.height}
                        onChange={handleHeightChange}
                        className="w-20 px-2 py-1 border border-border-theme rounded-md bg-div-theme text-sm"
                        min="1"
                    />
                    <button
                        onClick={() => setLockAspectRatio(!lockAspectRatio)}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                            lockAspectRatio 
                                ? 'bg-accent text-white' 
                                : 'bg-div-theme hover:bg-theme-secondary text-text-primary'
                        }`}
                        title={lockAspectRatio ? '解锁宽高比' : '锁定宽高比'}
                    >
                        🔒
                    </button>
                </div>

                <div className="flex-1"></div>
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
                        ready={() => {
                          // 当 Cropper 初始化完成时生成预览
                          setTimeout(getCropData, 100);
                        }}
                        cropend={() => {
                          // 当裁剪结束时自动更新预览
                          setTimeout(getCropData, 100);
                        }}
                    />
                </div>

                {/* Preview & Export Sidebar */}
                {croppedImage && (
                    <div className="w-80 bg-div-theme border-l border-border-theme flex flex-col p-4 overflow-y-auto z-10 shadow-xl absolute right-0 bottom-0 top-12 md:relative md:top-0">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-text-theme">导出预览</h3>
                            <button onClick={() => setCroppedImage(null)} className="text-text-secondary hover:text-text-theme md:hidden">✕</button>
                        </div>
                        
                        <div className="border border-border-theme rounded-lg overflow-hidden bg-div-secondary mb-4 flex items-center justify-center min-h-[200px]">
                            <img src={croppedImage} className="max-w-full max-h-60 object-contain" />
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">格式</label>
                                <select 
                                    value={format} 
                                    onChange={(e) => { setFormat(e.target.value); setTimeout(getCropData, 0); }}
                                    className="w-full rounded-md border-border-theme bg-div-secondary text-sm"
                                >
                                    <option value="image/png">PNG</option>
                                    <option value="image/jpeg">JPG</option>
                                    <option value="image/webp">WebP</option>
                                    <option value="image/svg+xml">SVG</option>
                                </select>
                            </div>
                            
                            {(format === 'image/jpeg' || format === 'image/webp') && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">质量: {Math.round(quality * 100)}%</label>
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
                            className="w-full bg-accent hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-auto cursor-pointer"
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