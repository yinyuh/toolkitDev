import React, { useState, useRef, useEffect } from 'react';

const PixelArtConverter = () => {
  const [image, setImage] = useState(null);
  const [pixelSize, setPixelSize] = useState(8);
  const [palette, setPalette] = useState('original'); // original, gameboy, grayscale, pico8
  const [dithering, setDithering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const originalImageRef = useRef(null);

  // Palettes
  const PALETTES = {
    gameboy: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]], // Darkest to Lightest
    grayscale: [[0,0,0], [85,85,85], [170,170,170], [255,255,255]],
    // Pico-8 (Partial popular colors)
    pico8: [
        [0,0,0], [29,43,83], [126,37,83], [0,135,81], 
        [171,82,54], [95,87,79], [194,195,194], [255,241,232],
        [255,0,77], [255,163,0], [255,236,39], [0,228,54],
        [41,173,255], [131,118,156], [255,119,168], [255,204,170]
    ]
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (image && canvasRef.current) {
      processImage();
    }
  }, [image, pixelSize, palette, dithering]);

  const processImage = () => {
    setIsProcessing(true);
    // Use setTimeout to allow UI update
    setTimeout(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = originalImageRef.current;
        
        // Calculate new dimensions
        const w = img.width;
        const h = img.height;
        
        // 1. Downscale
        const scaledW = Math.max(1, Math.floor(w / pixelSize));
        const scaledH = Math.max(1, Math.floor(h / pixelSize));
        
        // Draw small to offscreen canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = scaledW;
        offCanvas.height = scaledH;
        const offCtx = offCanvas.getContext('2d');
        
        // Draw image scaled down
        offCtx.drawImage(img, 0, 0, scaledW, scaledH);
        
        // Get pixel data
        let imageData = offCtx.getImageData(0, 0, scaledW, scaledH);
        let data = imageData.data;
        
        // 2. Apply Palette & Dithering (Simplified)
        if (palette !== 'original') {
            const colors = PALETTES[palette];
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                
                // Find closest color
                let minDist = Infinity;
                let closest = colors[0];
                
                for (const col of colors) {
                    // Euclidean distance (simple)
                    const dist = Math.sqrt(
                        Math.pow(r - col[0], 2) + 
                        Math.pow(g - col[1], 2) + 
                        Math.pow(b - col[2], 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        closest = col;
                    }
                }
                
                data[i] = closest[0];
                data[i+1] = closest[1];
                data[i+2] = closest[2];
                // Alpha remains same
            }
            offCtx.putImageData(imageData, 0, 0);
        }

        // 3. Upscale back to canvas (Nearest Neighbor)
        canvas.width = w;
        canvas.height = h;
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offCanvas, 0, 0, scaledW, scaledH, 0, 0, w, h);
        
        setIsProcessing(false);
    }, 10);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-div-theme rounded-xl shadow-lg border border-border-theme overflow-hidden flex flex-col lg:flex-row min-h-[600px] h-[calc(100vh-200px)]">
      {/* Left: Canvas Preview */}
      <div className="flex-1 bg-div-secondary relative overflow-hidden flex items-center justify-center p-4">
        {!image ? (
            <div 
                className="flex flex-col items-center justify-center cursor-pointer p-8 border-2 border-dashed border-border-theme rounded-lg hover:bg-div-hover dark:hover:bg-div-hover transition-colors"
                onClick={() => fileInputRef.current.click()}
            >
                <svg className="w-12 h-12 text-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className="text-text-secondary font-medium">点击上传图片</p>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                />
            </div>
        ) : (
            <div className="relative w-full h-full flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-xl" />
                {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
                        <div className="loading-spinner"></div>
                    </div>
                )}
                <button 
                    onClick={() => setImage(null)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="w-full lg:w-80 bg-div-theme border-t lg:border-t-0 lg:border-l border-border-theme p-6 flex flex-col gap-6 z-10 overflow-y-auto">
        <div>
            <h3 className="font-bold text-text-theme mb-4">参数设置</h3>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        像素大小 (Pixel Size): {pixelSize}px
                    </label>
                    <input 
                        type="range" 
                        min="2" 
                        max="64" 
                        step="1" 
                        value={pixelSize}
                        onChange={(e) => setPixelSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-div-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        调色板 (Palette)
                    </label>
                    <select 
                        value={palette}
                        onChange={(e) => setPalette(e.target.value)}
                        className="w-full rounded-lg border-border-theme bg-div-secondary text-sm py-2"
                    >
                        <option value="original">原色 (Original)</option>
                        <option value="gameboy">GameBoy (绿调)</option>
                        <option value="grayscale">黑白 (Grayscale)</option>
                        <option value="pico8">Pico-8 (16色)</option>
                    </select>
                </div>

                {/* Dithering toggle could be added here if implemented */}
            </div>
        </div>

        <div className="mt-auto">
            <button 
                onClick={downloadImage}
                disabled={!image}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                下载像素画
            </button>
        </div>
      </div>
      
      <style jsx>{`
        .loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-left-color: #ffffff;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* 滑动条样式 */
        input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }
        
        /* Firefox 兼容 */
        input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
        }
        
        input[type="range"]::-moz-range-track {
            width: 100%;
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            outline: none;
        }
      `}</style>
    </div>
  );
};

export default PixelArtConverter;