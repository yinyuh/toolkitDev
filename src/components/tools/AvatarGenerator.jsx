import React, { useState, useEffect, useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
// Removed static import of collection to reduce bundle size
import { RefreshCw, Download, Copy, Check, Settings, User, Loader2 } from 'lucide-react';

const AvatarGenerator = () => {
  // Metadata for styles without the heavy style objects
  const styleOptions = useMemo(() => [
    { id: 'adventurer', name: 'Adventurer' },
    { id: 'avataaars', name: 'Avataaars' },
    { id: 'bigEars', name: 'Big Ears' },
    { id: 'bigSmile', name: 'Big Smile' },
    { id: 'bottts', name: 'Bottts' },
    { id: 'croodles', name: 'Croodles' },
    { id: 'funEmoji', name: 'Fun Emoji' },
    { id: 'identicon', name: 'Identicon' },
    { id: 'lorelei', name: 'Lorelei' },
    { id: 'micah', name: 'Micah' },
    { id: 'miniavs', name: 'Miniavs' },
    { id: 'notionists', name: 'Notionists' },
    { id: 'openPeeps', name: 'Open Peeps' },
    { id: 'personas', name: 'Personas' },
    { id: 'pixelArt', name: 'Pixel Art' },
    { id: 'rings', name: 'Rings' },
    { id: 'shapes', name: 'Shapes' },
    { id: 'thumbs', name: 'Thumbs' },
  ], []);

  const [currentStyleId, setCurrentStyleId] = useState('avataaars');
  const [seed, setSeed] = useState('');
  const [svgContent, setSvgContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collectionModule, setCollectionModule] = useState(null);
  const [options, setOptions] = useState({
      radius: 0,
      backgroundColor: [],
      backgroundType: 'solid',
  });

  // Load the heavy collection module asynchronously
  useEffect(() => {
    let mounted = true;
    const loadCollection = async () => {
        try {
            const module = await import('@dicebear/collection');
            if (mounted) {
                setCollectionModule(module);
            }
        } catch (error) {
            console.error("Failed to load avatar collection:", error);
        }
    };
    loadCollection();
    return () => { mounted = false; };
  }, []);

  // Generate random seed on mount
  useEffect(() => {
    setSeed(Math.random().toString(36).substring(7));
  }, []);

  // Update avatar when seed, style or options change
  useEffect(() => {
    if (!seed || !collectionModule) return;

    const style = collectionModule[currentStyleId];
    if (!style) return;

    setLoading(true);
    try {
        const avatar = createAvatar(style, {
            seed,
            radius: options.radius,
            backgroundColor: options.backgroundColor.length > 0 ? options.backgroundColor : undefined,
            // ... other options can be added here
        });

        const svg = avatar.toString();
        setSvgContent(svg);
        setLoading(false);

    } catch (e) {
        console.error("Avatar generation failed", e);
        setLoading(false);
    }
  }, [seed, currentStyleId, options, collectionModule]);

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  const handleDownload = (format) => {
    if (format === 'svg') {
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `avatar-${seed}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; // High resolution
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 1024, 1024);
            
            const pngUrl = canvas.toDataURL('image/png');
            
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `avatar-${seed}.png`;
            a.click();
            
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }
  };

  const copySvg = () => {
    navigator.clipboard.writeText(svgContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Controls */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                   <Settings size={20} />
                   配置头像
                </h3>
                
                {/* Style Selector */}
                <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      风格样式
                   </label>
                   <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                      {styleOptions.map(s => (
                         <button
                            key={s.id}
                            onClick={() => setCurrentStyleId(s.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                               currentStyleId === s.id
                                 ? 'bg-theme-primary text-white shadow-md'
                                 : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                            }`}
                         >
                            <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                            {s.name}
                         </button>
                      ))}
                   </div>
                </div>

                {/* Seed Input */}
                <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Seed (种子)
                   </label>
                   <div className="flex gap-2">
                      <input 
                         type="text" 
                         value={seed}
                         onChange={(e) => setSeed(e.target.value)}
                         className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-theme-primary outline-none transition-all"
                         placeholder="输入字符生成..."
                      />
                      <button 
                         onClick={handleRandomize}
                         className="p-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-all shadow-sm"
                         title="随机生成"
                      >
                         <RefreshCw size={20} />
                      </button>
                   </div>
                </div>

                {/* Background Color */}
                <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      背景颜色
                   </label>
                   <div className="flex flex-wrap gap-2">
                      <button 
                         onClick={() => setOptions({...options, backgroundColor: []})}
                         className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${options.backgroundColor.length === 0 ? 'ring-2 ring-offset-2 ring-theme-primary border-transparent' : 'border-gray-300'}`}
                         title="透明"
                      >
                         <div className="w-full h-px bg-red-500 rotate-45 transform scale-150"></div>
                      </button>
                      {['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'].map(color => (
                         <button
                            key={color}
                            onClick={() => setOptions({...options, backgroundColor: [color]})}
                            className={`w-8 h-8 rounded-full border transition-all ${
                               options.backgroundColor.includes(color) 
                               ? 'ring-2 ring-offset-2 ring-theme-primary border-transparent' 
                               : 'border-transparent'
                            }`}
                            style={{ backgroundColor: `#${color}` }}
                         />
                      ))}
                   </div>
                </div>

                {/* Radius */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      圆角 ({options.radius}%)
                   </label>
                   <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      step="1"
                      value={options.radius}
                      onChange={(e) => setOptions({...options, radius: parseInt(e.target.value)})}
                      className="w-full accent-theme-primary"
                   />
                </div>
             </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-8">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center justify-center min-h-[500px] relative">
                
                {/* Avatar Display */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                    {loading || !svgContent ? (
                        <Loader2 className="animate-spin text-theme-primary w-12 h-12" />
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 mt-12 justify-center">
                   <button 
                      onClick={() => handleDownload('png')}
                      disabled={loading || !svgContent}
                      className="flex items-center gap-2 px-6 py-3 bg-theme-primary text-white rounded-xl font-bold hover:bg-theme-primary/90 transition-all shadow-lg shadow-theme-primary/20 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <Download size={20} />
                      下载 PNG
                   </button>
                   <button 
                      onClick={() => handleDownload('svg')}
                      disabled={loading || !svgContent}
                      className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <Download size={20} />
                      下载 SVG
                   </button>
                   <button 
                      onClick={copySvg}
                      disabled={loading || !svgContent}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                      复制 SVG 代码
                   </button>
                </div>
                
                <div className="absolute top-4 right-4 text-xs text-gray-400">
                   Powered by DiceBear
                </div>
             </div>
          </div>
       </div>

       <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default AvatarGenerator;
