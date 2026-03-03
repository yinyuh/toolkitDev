import React, { useState, useEffect, useRef } from 'react';
import { Download, Type, PenTool } from 'lucide-react';
import '@fontsource/caveat';
import '@fontsource/patrick-hand';
import '@fontsource/indie-flower';
import '@fontsource/allura';
import '@fontsource/kalam';
import '@fontsource/nunito';

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
    ctx.fillStyle = color;
    ctx.textBaseline = 'bottom'; // Align to line
    
    const lines = text.split('\n');
    let currentY = 100; // Top padding
    const lineSpacing = fontSize * lineHeight;
    const maxWidth = width - 180; // Maximum width for text (left and right margins)

    // Override startY if lined paper to align with lines
    if (paperType === 'lined') {
        currentY = 100; // First line y position
    }

    lines.forEach((line, lineIndex) => {
        let x = 90; // Left padding (after margin)
        let y = currentY;

        if (variation) {
            // Random line slant
            y += (Math.random() - 0.5) * 2;
        }

        // 自动换行处理
        let currentLine = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            // 为中文和英文使用不同的字体策略
            const isChinese = /[\u4e00-\u9fa5]/.test(char);
            let currentFont = font;
            
            // 检查是否选择了中文字体
            const chineseFonts = ['Ma Shan Zheng', 'STXingkai', 'KaiTi', 'STCaiyun', 'STZhongsong', 'STFangsong', 'ZCOOL QingKe HuangYou', 'ZCOOL XiaoWei', 'ZCOOL KuaiLe', 'ZCOOL QingFeng'];
            const isChineseFont = chineseFonts.includes(font);
            
            // 设置字体以测量宽度
            if (isChinese || isChineseFont) {
                switch (font) {
                    case 'Ma Shan Zheng':
                        ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;
                        break;
                    case 'STXingkai':
                        ctx.font = `${fontSize}px "STXingkai", cursive`;
                        break;
                    case 'KaiTi':
                        ctx.font = `${fontSize}px "KaiTi", "STKaiti", serif`;
                        break;
                    case 'STCaiyun':
                        ctx.font = `${fontSize}px "STCaiyun", cursive`;
                        break;
                    case 'STZhongsong':
                        ctx.font = `${fontSize}px "STZhongsong", serif`;
                        break;
                    case 'STFangsong':
                        ctx.font = `${fontSize}px "STFangsong", serif`;
                        break;
                    case 'ZCOOL QingKe HuangYou':
                        ctx.font = `${fontSize}px "ZCOOL QingKe HuangYou", sans-serif`;
                        break;
                    case 'ZCOOL XiaoWei':
                        ctx.font = `${fontSize}px "ZCOOL XiaoWei", serif`;
                        break;
                    case 'ZCOOL KuaiLe':
                        ctx.font = `${fontSize}px "ZCOOL KuaiLe", sans-serif`;
                        break;
                    case 'ZCOOL QingFeng':
                        ctx.font = `${fontSize}px "ZCOOL QingFeng", serif`;
                        break;
                    default:
                        ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
                }
            } else {
                ctx.font = `${fontSize}px "${font}"`;
            }
            
            // 测量当前行加上新字符的宽度
            const testLine = currentLine + char;
            const testWidth = ctx.measureText(testLine).width;
            
            // 如果超出最大宽度，换行
            if (testWidth > maxWidth) {
                // 绘制当前行
                drawLine(currentLine, 90, y);
                
                // 重置当前行，换到下一行
                currentLine = char;
                y += lineSpacing;
                if (variation) {
                    y += (Math.random() - 0.5) * 2;
                }
            } else {
                currentLine += char;
            }
        }
        
        // 绘制最后一行
        if (currentLine) {
            drawLine(currentLine, 90, y);
            // 更新当前Y坐标，为下一行做准备
            currentY = y + lineSpacing;
        } else {
            // 如果是空行，也需要增加行间距
            currentY += lineSpacing;
        }
    });
    
    // 绘制单行文字的函数
    function drawLine(line, startX, startY) {
        let x = startX;
        let y = startY;
        
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
            
            // 为中文和英文使用不同的字体策略
            const isChinese = /[\u4e00-\u9fa5]/.test(char);
            
            // 检查是否选择了中文字体
            const chineseFonts = ['Ma Shan Zheng', 'STXingkai', 'KaiTi', 'STCaiyun', 'STZhongsong', 'STFangsong', 'ZCOOL QingKe HuangYou', 'ZCOOL XiaoWei', 'ZCOOL KuaiLe', 'ZCOOL QingFeng'];
            const isChineseFont = chineseFonts.includes(font);
            
            if (isChinese || isChineseFont) {
                // 为中文或选择了中文字体时使用对应的字体
                switch (font) {
                    case 'Ma Shan Zheng':
                        ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;
                        break;
                    case 'STXingkai':
                        ctx.font = `${fontSize}px "STXingkai", cursive`;
                        break;
                    case 'KaiTi':
                        ctx.font = `${fontSize}px "KaiTi", "STKaiti", serif`;
                        break;
                    case 'STCaiyun':
                        ctx.font = `${fontSize}px "STCaiyun", cursive`;
                        break;
                    case 'STZhongsong':
                        ctx.font = `${fontSize}px "STZhongsong", serif`;
                        break;
                    case 'STFangsong':
                        ctx.font = `${fontSize}px "STFangsong", serif`;
                        break;
                    case 'ZCOOL QingKe HuangYou':
                        ctx.font = `${fontSize}px "ZCOOL QingKe HuangYou", sans-serif`;
                        break;
                    case 'ZCOOL XiaoWei':
                        ctx.font = `${fontSize}px "ZCOOL XiaoWei", serif`;
                        break;
                    case 'ZCOOL KuaiLe':
                        ctx.font = `${fontSize}px "ZCOOL KuaiLe", sans-serif`;
                        break;
                    case 'ZCOOL QingFeng':
                        ctx.font = `${fontSize}px "ZCOOL QingFeng", serif`;
                        break;
                    case 'Caveat':
                    case 'Indie Flower':
                        ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;
                        break;
                    case 'Patrick Hand':
                    case 'Kalam':
                        ctx.font = `${fontSize}px "ZCOOL QingKe HuangYou", sans-serif`;
                        break;
                    case 'Allura':
                        ctx.font = `${fontSize}px "ZCOOL XiaoWei", serif`;
                        break;
                    case 'Nunito':
                        ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
                        break;
                    default:
                        ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
                }
            } else {
                // 为英文使用选择的字体
                ctx.font = `${fontSize}px "${font}"`;
            }
            
            ctx.fillText(char, 0, 0);
            ctx.restore();

            // 重新设置字体以正确测量宽度
            if (isChinese || isChineseFont) {
                // 为中文或选择了中文字体时使用对应的字体测量宽度
                switch (font) {
                    case 'Ma Shan Zheng':
                        ctx.font = `${fontSize}px "Ma Shan Zheng", cursive`;
                        break;
                    case 'STXingkai':
                        ctx.font = `${fontSize}px "STXingkai", cursive`;
                        break;
                    case 'KaiTi':
                        ctx.font = `${fontSize}px "KaiTi", "STKaiti", serif`;
                        break;
                    case 'STCaiyun':
                        ctx.font = `${fontSize}px "STCaiyun", cursive`;
                        break;
                    case 'STZhongsong':
                        ctx.font = `${fontSize}px "STZhongsong", serif`;
                        break;
                    case 'STFangsong':
                        ctx.font = `${fontSize}px "STFangsong", serif`;
                        break;
                    case 'ZCOOL QingKe HuangYou':
                        ctx.font = `${fontSize}px "ZCOOL QingKe HuangYou", sans-serif`;
                        break;
                    case 'ZCOOL XiaoWei':
                        ctx.font = `${fontSize}px "ZCOOL XiaoWei", serif`;
                        break;
                    case 'ZCOOL KuaiLe':
                        ctx.font = `${fontSize}px "ZCOOL KuaiLe", sans-serif`;
                        break;
                    case 'ZCOOL QingFeng':
                        ctx.font = `${fontSize}px "ZCOOL QingFeng", serif`;
                        break;
                    default:
                        ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
                }
            } else {
                ctx.font = `${fontSize}px "${font}"`;
            }
            x += ctx.measureText(char).width;
        }
    }
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
       {/* 加载中文字体 */}
       <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
         <div style={{ fontFamily: 'Ma Shan Zheng, cursive' }}>中文字体</div>
         <div style={{ fontFamily: 'ZCOOL QingKe HuangYou, sans-serif' }}>中文字体</div>
         <div style={{ fontFamily: 'ZCOOL XiaoWei, serif' }}>中文字体</div>
         <div style={{ fontFamily: 'ZCOOL KuaiLe, sans-serif' }}>中文字体</div>
         <div style={{ fontFamily: 'ZCOOL QingFeng, serif' }}>中文字体</div>
         <div style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>中文字体</div>
         <div style={{ fontFamily: 'KaiTi, STKaiti, serif' }}>中文字体</div>
         <div style={{ fontFamily: 'STCaiyun, cursive' }}>中文字体</div>
         <div style={{ fontFamily: 'STXingkai, cursive' }}>中文字体</div>
         <div style={{ fontFamily: 'STZhongsong, serif' }}>中文字体</div>
         <div style={{ fontFamily: 'STFangsong, serif' }}>中文字体</div>
       </div>
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
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-text-secondary mb-2">英文手写体</h4>
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
                                    <button 
                                        onClick={() => setFont('Indie Flower')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'Indie Flower' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'Indie Flower' }}
                                    >
                                        Indie Flower
                                    </button>
                                    <button 
                                        onClick={() => setFont('Allura')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'Allura' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'Allura' }}
                                    >
                                        Allura
                                    </button>
                                    <button 
                                        onClick={() => setFont('Kalam')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'Kalam' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'Kalam' }}
                                    >
                                        Kalam
                                    </button>
                                    <button 
                                        onClick={() => setFont('Nunito')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'Nunito' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'Nunito' }}
                                    >
                                        Nunito
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-text-secondary mb-2">中文手写体</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setFont('Ma Shan Zheng')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'Ma Shan Zheng' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'Ma Shan Zheng, cursive' }}
                                    >
                                        马善政 (草书)
                                    </button>
                                    <button 
                                        onClick={() => setFont('STXingkai')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'STXingkai' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'STXingkai, cursive' }}
                                    >
                                        行楷
                                    </button>
                                    <button 
                                        onClick={() => setFont('KaiTi')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'KaiTi' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'KaiTi, STKaiti, serif' }}
                                    >
                                        楷体
                                    </button>
                                    <button 
                                        onClick={() => setFont('STCaiyun')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'STCaiyun' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'STCaiyun, cursive' }}
                                    >
                                        彩云体
                                    </button>
                                    <button 
                                        onClick={() => setFont('STZhongsong')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'STZhongsong' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'STZhongsong, serif' }}
                                    >
                                        宋体
                                    </button>
                                    <button 
                                        onClick={() => setFont('STFangsong')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'STFangsong' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'STFangsong, serif' }}
                                    >
                                        仿宋
                                    </button>
                                    <button 
                                        onClick={() => setFont('ZCOOL QingKe HuangYou')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'ZCOOL QingKe HuangYou' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'ZCOOL QingKe HuangYou, sans-serif' }}
                                    >
                                        黄悠体 (行书)
                                    </button>
                                    <button 
                                        onClick={() => setFont('ZCOOL XiaoWei')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'ZCOOL XiaoWei' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'ZCOOL XiaoWei, serif' }}
                                    >
                                        小薇体 (楷书)
                                    </button>
                                    <button 
                                        onClick={() => setFont('ZCOOL KuaiLe')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'ZCOOL KuaiLe' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'ZCOOL KuaiLe, sans-serif' }}
                                    >
                                        快乐体
                                    </button>
                                    <button 
                                        onClick={() => setFont('ZCOOL QingFeng')}
                                        className={`px-3 py-2 rounded-lg border text-lg ${font === 'ZCOOL QingFeng' ? 'border-accent bg-accent/10 text-accent' : 'border-border-theme'}`}
                                        style={{ fontFamily: 'ZCOOL QingFeng, serif' }}
                                    >
                                        清风体
                                    </button>
                                </div>
                            </div>
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
