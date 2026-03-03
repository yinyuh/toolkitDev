import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, Zap } from 'lucide-react';
import '@fontsource/courier-prime';

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

const GlitchTextGenerator = () => {
  const [text, setText] = useState('GLITCH TEXT GENERATOR');
  const [chaos, setChaos] = useState(50);
  const [directions, setDirections] = useState({ top: true, middle: true, bottom: true });
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  // Zalgo characters - 上方
  const ZALGO_UP = [
    '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', 
    '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343', 
    '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', 
    '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', 
    '\u0309', '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', 
    '\u036a', '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u033e', '\u035b', 
    '\u0346', '\u031a'
  ];
  // Zalgo characters - 下方
  const ZALGO_DOWN = [
    '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', 
    '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c', 
    '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', 
    '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', 
    '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'
  ];
  // Zalgo characters - 中间
  const ZALGO_MID = [
    '\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327', 
    '\u0328', '\u0334', '\u0335', '\u0336', '\u0337', '\u0338', '\u0360', '\u0361', 
    '\u0362'
  ];

  // 增强的故障字符集合
  const GLITCH_CHARS = [
    // 主要故障字符
    '̷', '̸', '̡', '̢', '̧', '̨', '̴', '̵', '̶', '̷', '̸', '̹', '̺', '̻', '̼', '̽', '̾', '̿',
    '̀', '́', '͂', '̓', '̈́', 'ͅ', '͆', '͇', '͈', '͉', '͊', '͋', '͌', '͍', '͎', '͐', '͑', '͒',
    '͓', '͔', '͕', '͖', '͗', '͘', '͙', '͚', '͛', '͜', '͝', '͞', '͟', '͠', '͡', '҉',
    '̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̣', '̤', '̥', '̦', '̩', '̪', '̫',
    '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹',
    // 额外的故障效果字符
    '̓', '̔', '̕', '̖', '̗', '̘', '̙', '̚', '̛', '̜', '̝', '̞', '̟', '̠', '̡', '̢', '̣',
    '̤', '̥', '̦', '̧', '̨', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̴',
    '̵', '̶', '̷', '̸', '̹', '̺', '̻', '̼', '̽', '̾', '̿', '̀', '́', '̂', '̃', '̄', '̅',
    '̆', '̇', '̈', '̉', '̊', '̋', '̌', '̍', '̎', '̏', '̐', '̑', '̒', '̓', '̔', '̕', '̖',
    '̗', '̘', '̙', '̚', '̛', '̜', '̝', '̞', '̟', '̠', '̡', '̢', '̣', '̤', '̥', '̦', '̧',
    '̨', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̴', '̵', '̶', '̷', '̸',
    '̹', '̺', '̻', '̼', '̽', '̾', '̿', 'Җ', 'җ', 'Ҙ', 'ҙ', 'Қ', 'ҙ', 'Қ', 'қ', 'Ҝ', 'ҝ',
    'Ҟ', 'ҟ', 'ҡ', 'ҡ', 'Ң', 'ң', 'Ҥ', 'ҥ', 'Ҧ', 'ҧ', 'Ҩ', 'ҩ', 'Ҫ', 'ҫ', 'Ҭ', 'ҭ', 'Ү',
    'ұ', 'Ұ', 'Ҳ', 'ҳ', 'Ҵ', 'ҵ', 'Ҷ', 'ҷ', 'Ҹ', 'ҹ', 'Һ', 'һ', 'Ҽ', 'ҽ', 'Ҿ', 'ҿ'
  ];

  // 特殊效果字符
  const SPECIAL_EFFECTS = {
    strike: ['̶', '̷', '̸', '̵'],
    overline: ['̅', '̿', '̄', '̾'],
    underline: ['̲', '̳', '̱', '̵'],
    tilde: ['̃', '̴', '̵'],
    dots: ['̇', '̈', '̊', '̋']
  };

  // 判断字符是否为汉字
  const isChineseChar = (char) => {
    return /[\u4e00-\u9fa5]/.test(char);
  };

  // 为汉字生成增强的故障效果
  const generateChineseGlitch = (char, chaosLevel) => {
    let result = char;
    const intensity = Math.floor(chaosLevel / 10);
    
    // 1. 添加特殊效果（删除线、上划线、下划线等）
    if (directions.middle && Math.random() < chaosLevel / 80) {
      const strikeEffect = SPECIAL_EFFECTS.strike[Math.floor(Math.random() * SPECIAL_EFFECTS.strike.length)];
      result = result + strikeEffect;
    }
    
    if (directions.top && Math.random() < chaosLevel / 120) {
      const overlineEffect = SPECIAL_EFFECTS.overline[Math.floor(Math.random() * SPECIAL_EFFECTS.overline.length)];
      result = overlineEffect + result;
    }
    
    if (directions.bottom && Math.random() < chaosLevel / 120) {
      const underlineEffect = SPECIAL_EFFECTS.underline[Math.floor(Math.random() * SPECIAL_EFFECTS.underline.length)];
      result = result + underlineEffect;
    }
    
    // 2. 添加随机故障字符
    const numGlitches = Math.floor(Math.random() * (intensity + 2)) + 1;
    for (let i = 0; i < numGlitches; i++) {
      const glitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      const position = Math.random();
      
      if (position < 0.33 && directions.top) {
        result = glitchChar + result;
      } else if (position < 0.66 && directions.middle) {
        result = result + glitchChar;
      } else if (directions.bottom) {
        result = result + glitchChar;
      }
    }
    
    // 3. 为每个汉字添加多个叠加效果
    if (chaosLevel > 50) {
      const extraEffects = Math.floor((chaosLevel - 50) / 20);
      for (let i = 0; i < extraEffects; i++) {
        const effectType = Object.keys(SPECIAL_EFFECTS)[Math.floor(Math.random() * Object.keys(SPECIAL_EFFECTS).length)];
        const effectChars = SPECIAL_EFFECTS[effectType];
        const effectChar = effectChars[Math.floor(Math.random() * effectChars.length)];
        
        const pos = Math.random();
        if (pos < 0.5) {
          result = effectChar + result;
        } else {
          result = result + effectChar;
        }
      }
    }
    
    return result;
  };

  // 为英文字母生成增强的 Zalgo 效果
  const generateZalgoGlitch = (char, chaosLevel) => {
    let result = char;
    
    const numUp = directions.top ? Math.floor(Math.random() * (chaosLevel / 4)) : 0;
    const numMid = directions.middle ? Math.floor(Math.random() * (chaosLevel / 8)) : 0;
    const numDown = directions.bottom ? Math.floor(Math.random() * (chaosLevel / 4)) : 0;

    for (let j = 0; j < numUp; j++) result += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
    for (let j = 0; j < numMid; j++) result += ZALGO_MID[Math.floor(Math.random() * ZALGO_MID.length)];
    for (let j = 0; j < numDown; j++) result += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
    
    return result;
  };

  const generateGlitch = () => {
    if (!text) {
        setResult('');
        return;
    }

    let newText = '';
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // 空格和换行保持原样
        if (char === ' ' || char === '\n') {
            newText += char;
            continue;
        }

        // 汉字使用特殊的故障效果
        if (isChineseChar(char)) {
            newText += generateChineseGlitch(char, chaos);
        } else {
            // 英文字母和其他字符使用增强的 Zalgo 效果
            newText += generateZalgoGlitch(char, chaos);
        }
    }
    
    setResult(newText);
  };

  useEffect(() => {
    generateGlitch();
  }, [text, chaos, directions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Controls */}
          <div className="space-y-6">
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6">
                <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
                   <Zap size={20} />
                   参数设置
                </h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        输入文本
                    </label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border-theme bg-div-secondary text-text-theme focus:ring-2 focus:ring-accent outline-none transition-all min-h-[100px]"
                        placeholder="输入要故障化的文字..."
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        混乱度 ({chaos}%)
                    </label>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={chaos}
                        onChange={(e) => setChaos(parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        干扰方向
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={directions.top}
                                onChange={(e) => setDirections({...directions, top: e.target.checked})}
                                className="w-4 h-4 text-accent rounded focus:ring-accent border-border-theme"
                            />
                            <span className="text-text-secondary text-sm">上方</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={directions.middle}
                                onChange={(e) => setDirections({...directions, middle: e.target.checked})}
                                className="w-4 h-4 text-accent rounded focus:ring-accent border-border-theme"
                            />
                            <span className="text-text-secondary text-sm">中间</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={directions.bottom}
                                onChange={(e) => setDirections({...directions, bottom: e.target.checked})}
                                className="w-4 h-4 text-accent rounded focus:ring-accent border-border-theme"
                            />
                            <span className="text-text-secondary text-sm">下方</span>
                        </label>
                    </div>
                </div>
             </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-text-theme">效果预览</h3>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setText('')}
                            className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="清空"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-all shadow-sm"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? '已复制' : '复制'}
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 bg-div-secondary rounded-lg p-4 overflow-auto border border-border-theme">
                    <p 
                        className="text-2xl md:text-3xl break-all text-center leading-loose text-text-theme" 
                        style={{ fontFamily: '"Courier Prime", monospace' }}
                    >
                        {result || <span className="text-text-secondary text-base italic">预览将显示在这里...</span>}
                    </p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default GlitchTextGenerator;