import React, { useState, useEffect } from 'react';
import { Copy, Check, Palette, Code, RefreshCw } from 'lucide-react';

// Add global styles for range input
const style = document.createElement('style');
style.textContent = `
  input[type="range"] {
    accent-color: red;
    background: white;
    border: 1px solid #ddd;
    height: 20px;
    padding: 0;
    margin: 0;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: red;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    margin-top: -6px;
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: red;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  input[type="range"]::-webkit-slider-runnable-track {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    height: 4px;
  }
  input[type="range"]::-moz-range-track {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    height: 4px;
  }
`;
document.head.appendChild(style);

const RainbowTextGenerator = () => {
  const [text, setText] = useState('Rainbow Text Generator');
  const [format, setFormat] = useState('html'); // html, bbcode, markdown
  const [colors, setColors] = useState(['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee']);
  const [span, setSpan] = useState(1); // 1 = 1 cycle
  const [result, setResult] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [copied, setCopied] = useState(false);

  // Helper to interpolate colors
  const interpolateColor = (color1, color2, factor) => {
    if (arguments.length < 3) { 
        factor = 0.5; 
    }
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const generateRainbow = () => {
    if (!text) {
        setResult('');
        setPreviewHtml('');
        return;
    }

    let output = '';
    let preview = '';
    const len = text.length;
    // Calculate how many steps per color transition
    // We want the full spectrum to repeat 'span' times over 'len' characters
    
    // Simple approach: Map each character index to a hue in HSL or interpolate RGB
    // Let's use HSL for smoother rainbows
    
    for (let i = 0; i < len; i++) {
        const char = text[i];
        if (char === ' ' || char === '\n') {
            output += char;
            preview += char === '\n' ? '<br/>' : char;
            continue;
        }

        // Calculate hue: 0 to 360 * span
        const hue = Math.floor((i / len) * 360 * span) % 360;
        const color = `hsl(${hue}, 100%, 50%)`;
        
        // Convert HSL to Hex for BBCode/standard output
        // For simplicity in this demo, we'll let the browser handle HSL in preview
        // But for code output, we might want Hex. 
        // Let's stick to HSL for HTML, but maybe Hex is better for compatibility.
        // Let's use a small helper for HSL to Hex if needed, or just output HSL for HTML.
        // BBCode usually needs Hex.
        
        // HSL to RGB conversion
        const s = 100 / 100;
        const l = 50 / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= hue && hue < 60) { r = c; g = x; b = 0; }
        else if (60 <= hue && hue < 120) { r = x; g = c; b = 0; }
        else if (120 <= hue && hue < 180) { r = 0; g = c; b = x; }
        else if (180 <= hue && hue < 240) { r = 0; g = x; b = c; }
        else if (240 <= hue && hue < 300) { r = x; g = 0; b = c; }
        else if (300 <= hue && hue < 360) { r = c; g = 0; b = x; }

        const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
        const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
        const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
        const hexColor = `#${rHex}${gHex}${bHex}`;

        if (format === 'html') {
            output += `<span style="color:${hexColor}">${char}</span>`;
        } else if (format === 'bbcode') {
            output += `[color=${hexColor}]${char}[/color]`;
        } else if (format === 'markdown') {
            // Markdown doesn't support color natively, but some renderers support HTML
            output += `<span style="color:${hexColor}">${char}</span>`;
        }

        preview += `<span style="color:${hexColor}">${char}</span>`;
    }

    setResult(output);
    setPreviewHtml(preview);
  };

  useEffect(() => {
    generateRainbow();
  }, [text, format, span]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
       <div className="space-y-8">
          
          {/* Controls */}
          <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        输入文本
                    </label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border-theme bg-div-secondary text-text-theme focus:ring-2 focus:ring-accent outline-none transition-all"
                        rows="3"
                        placeholder="输入要生成彩虹色的文字..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        颜色跨度 (Spectrum Span)
                    </label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="0.1" 
                            max="5" 
                            step="0.1"
                            value={span}
                            onChange={(e) => setSpan(parseFloat(e.target.value))}
                            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-12 text-right font-mono text-text-secondary">{span}x</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        输出格式
                    </label>
                    <div className="flex bg-div-secondary rounded-lg p-1">
                        {['html', 'bbcode', 'markdown'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFormat(f)}
                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all uppercase ${
                                    format === f 
                                    ? 'bg-div-theme shadow-sm text-accent' 
                                    : 'text-text-secondary hover:text-text-theme'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
             </div>
          </div>

          {/* Preview & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Preview Area */}
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6 flex flex-col">
                <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
                   <Palette size={20} />
                   实时预览
                </h3>
                <div className="flex-1 bg-div-secondary rounded-lg p-6 border border-border-theme flex items-center justify-center min-h-[200px]">
                    <div 
                        className="text-2xl md:text-3xl font-bold text-center break-words"
                        dangerouslySetInnerHTML={{ __html: previewHtml || '<span class="text-text-secondary italic">预览区域</span>' }}
                    />
                </div>
             </div>

             {/* Code Area */}
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-text-theme flex items-center gap-2">
                       <Code size={20} />
                       代码输出
                    </h3>
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-all shadow-sm"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? '已复制' : '一键复制'}
                    </button>
                </div>
                <div className="flex-1 relative">
                    <textarea 
                        readOnly
                        value={result}
                        className="w-full h-full min-h-[200px] p-4 rounded-lg border border-border-theme bg-div-secondary text-xs font-mono text-text-secondary focus:outline-none resize-none"
                    />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default RainbowTextGenerator;