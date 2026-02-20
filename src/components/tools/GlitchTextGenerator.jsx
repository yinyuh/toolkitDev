import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, Zap } from 'lucide-react';
import '@fontsource/courier-prime';

const GlitchTextGenerator = () => {
  const [text, setText] = useState('GLITCH TEXT');
  const [chaos, setChaos] = useState(30);
  const [directions, setDirections] = useState({ top: true, middle: true, bottom: true });
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  // Zalgo characters
  const ZALGO_UP = [
    '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', 
    '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343', 
    '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', 
    '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', 
    '\u0309', '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', 
    '\u036a', '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u033e', '\u035b', 
    '\u0346', '\u031a'
  ];
  const ZALGO_DOWN = [
    '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', 
    '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c', 
    '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', 
    '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', 
    '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'
  ];
  const ZALGO_MID = [
    '\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327', 
    '\u0328', '\u0334', '\u0335', '\u0336', '\u0337', '\u0338', '\u0360', '\u0361', 
    '\u0362'
  ];

  const generateGlitch = () => {
    if (!text) {
        setResult('');
        return;
    }

    let newText = '';
    
    for (let i = 0; i < text.length; i++) {
        newText += text[i];
        
        // Skip zalgo for spaces if desired, but let's include it for chaos
        // if (text[i] === ' ') continue;

        const numUp = directions.top ? Math.floor(Math.random() * (chaos / 5)) : 0;
        const numMid = directions.middle ? Math.floor(Math.random() * (chaos / 10)) : 0;
        const numDown = directions.bottom ? Math.floor(Math.random() * (chaos / 5)) : 0;

        for (let j = 0; j < numUp; j++) newText += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
        for (let j = 0; j < numMid; j++) newText += ZALGO_MID[Math.floor(Math.random() * ZALGO_MID.length)];
        for (let j = 0; j < numDown; j++) newText += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
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
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                   <Zap size={20} />
                   参数设置
                </h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        输入文本
                    </label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-theme-primary outline-none transition-all min-h-[100px]"
                        placeholder="输入要故障化的文字..."
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        混乱度 ({chaos}%)
                    </label>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={chaos}
                        onChange={(e) => setChaos(parseInt(e.target.value))}
                        className="w-full accent-theme-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        干扰方向
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={directions.top}
                                onChange={(e) => setDirections({...directions, top: e.target.checked})}
                                className="w-4 h-4 text-theme-primary rounded focus:ring-theme-primary border-gray-300"
                            />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">上方</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={directions.middle}
                                onChange={(e) => setDirections({...directions, middle: e.target.checked})}
                                className="w-4 h-4 text-theme-primary rounded focus:ring-theme-primary border-gray-300"
                            />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">中间</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={directions.bottom}
                                onChange={(e) => setDirections({...directions, bottom: e.target.checked})}
                                className="w-4 h-4 text-theme-primary rounded focus:ring-theme-primary border-gray-300"
                            />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">下方</span>
                        </label>
                    </div>
                </div>
             </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">效果预览</h3>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setText('')}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="清空"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary text-white rounded-lg text-sm font-medium hover:bg-theme-primary/90 transition-all shadow-sm"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? '已复制' : '复制'}
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto border border-gray-200 dark:border-gray-700">
                    <p 
                        className="text-2xl md:text-3xl break-all text-center leading-loose text-gray-800 dark:text-gray-100" 
                        style={{ fontFamily: '"Courier Prime", monospace' }}
                    >
                        {result || <span className="text-gray-400 text-base italic">预览将显示在这里...</span>}
                    </p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default GlitchTextGenerator;
