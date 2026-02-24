import React, { useState, useEffect, useRef } from 'react';
import { Download, Type, PenTool } from 'lucide-react';
import '@fontsource/caveat';
import '@fontsource/patrick-hand';

const HandwritingGenerator = () => {
  const [text, setText] = useState('This is a handwritten note.\nYou can type anything here.\nHello World!');
  const [font, setFont] = useState('Caveat');
  const [fontSize, setFontSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [color, setColor] = useState('#2d3748'); // Dark gray ink
  const [paperType, setPaperType] = useState('lined'); // white, lined, grid
  const [variation, setVariation] = useState(true); // Add randomness

  const canvasRef = useRef(null);

  useEffect(() => {
    draw();
  }, [text, font, fontSize, lineHeight, color, paperType, variation]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 800;
    const height = canvas.height = 1000;

    // Draw Paper Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (paperType === 'lined') {
        ctx.beginPath();
        ctx.strokeStyle = '#e2e8f0'; // Light gray lines
        ctx.lineWidth = 2;
        const lineSpacing = fontSize * lineHeight;
        for (let y = 100; y < height; y += lineSpacing) {
            ctx.moveTo(40, y);
            ctx.lineTo(width - 40, y);
        }
        ctx.stroke();
        
        // Red margin line
        ctx.beginPath();
        ctx.strokeStyle = '#feb2b2';
        ctx.lineWidth = 1;
        ctx.moveTo(80, 0);
        ctx.lineTo(80, height);
        ctx.stroke();
    } else if (paperType === 'grid') {
        ctx.beginPath();
        ctx.strokeStyle = '#edf2f7';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    // Draw Text
    ctx.font = `${fontSize}px "${font}"`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'bottom'; // Align to line
    
    const lines = text.split('\n');
    let startY = 100; // Top padding
    const lineSpacing = fontSize * lineHeight;

    // Override startY if lined paper to align with lines
    if (paperType === 'lined') {
        startY = 100; // First line y position
    }

    lines.forEach((line, lineIndex) => {
        let x = 90; // Left padding (after margin)
        let y = startY + (lineIndex * lineSpacing);

        if (variation) {
            // Random line slant
            y += (Math.random() - 0.5) * 2;
        }

        // Character by character for more variation
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            let charX = x;
            let charY = y;
            let angle = 0;

            if (variation) {
                charX += (Math.random() - 0.5) * 2; // Horizontal jitter
                charY += (Math.random() - 0.5) * 3; // Vertical jitter
                angle = (Math.random() - 0.5) * 0.05; // Slight rotation
            }

            ctx.save();
            ctx.translate(charX, charY);
            ctx.rotate(angle);
            ctx.fillText(char, 0, 0);
            ctx.restore();

            x += ctx.measureText(char).width;
        }
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'handwritten-note.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6">
                <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
                   <PenTool size={20} />
                   书写设置
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">输入内容</label>
                        <textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border-theme bg-div-secondary focus:ring-2 focus:ring-accent outline-none min-h-[150px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">字体风格</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setFont('Caveat')}
                                className={`px-3 py-2 rounded-lg border text-lg ${font === 'Caveat' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                style={{ fontFamily: 'Caveat' }}
                            >
                                Caveat
                            </button>
                            <button 
                                onClick={() => setFont('Patrick Hand')}
                                className={`px-3 py-2 rounded-lg border text-lg ${font === 'Patrick Hand' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                style={{ fontFamily: 'Patrick Hand' }}
                            >
                                Patrick Hand
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">纸张背景</label>
                        <div className="flex gap-2">
                            {['lined', 'grid', 'white'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPaperType(p)}
                                    className={`flex-1 py-2 rounded-lg border text-sm capitalize ${
                                        paperType === p ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'
                                    }`}
                                >
                                    {p === 'lined' ? '横线' : p === 'grid' ? '方格' : '空白'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">字号 ({fontSize})</label>
                            <input type="range" min="16" max="64" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-accent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">墨水颜色</label>
                            <div className="flex gap-2">
                                {['#2d3748', '#1a365d', '#742a2a', '#22543d'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-accent scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                        <input 
                            type="checkbox" 
                            checked={variation} 
                            onChange={(e) => setVariation(e.target.checked)}
                            className="w-4 h-4 text-accent rounded focus:ring-accent"
                        />
                        <span className="text-sm font-medium text-text-secondary">添加手写扰动 (更真实)</span>
                    </label>
                </div>
             </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-8">
             <div className="bg-div-secondary rounded-xl p-4 md:p-8 flex flex-col items-center gap-6 min-h-[600px]">
                <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white max-w-full">
                    <canvas 
                        ref={canvasRef} 
                        className="max-w-full h-auto block"
                        style={{ maxHeight: '80vh' }}
                    />
                </div>
                
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
                >
                    <Download size={20} />
                    下载图片
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default HandwritingGenerator;
