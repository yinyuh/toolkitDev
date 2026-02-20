import React, { useState, useEffect } from 'react';
import { Copy, Check, Shuffle, ArrowRight } from 'lucide-react';

const ScrambledTextGenerator = () => {
  const [inputText, setInputText] = useState('Research shows that it doesn\'t matter in what order the letters in a word are, the only important thing is that the first and last letter be in the right place.');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);

  const scrambleWord = (word) => {
    // Keep short words, punctuation, and non-alpha characters intact
    if (word.length <= 3) return word;
    
    // Check if it's actually a word (contains letters)
    if (!/[a-zA-Z\u4e00-\u9fa5]/.test(word)) return word;

    // Handle English
    if (/^[a-zA-Z]+$/.test(word)) {
        const first = word[0];
        const last = word[word.length - 1];
        const middle = word.slice(1, -1).split('');
        
        // Fisher-Yates shuffle
        for (let i = middle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [middle[i], middle[j]] = [middle[j], middle[i]];
        }
        
        return first + middle.join('') + last;
    }
    
    // Handle Chinese (Simplified logic: shuffle adjacent characters or random swap)
    // "研表究明，汉字的序顺并不定一能影阅响读"
    // Let's try shuffling blocks of characters while keeping punctuation
    return word; // Chinese scrambling needs context-aware splitting which is hard in pure JS without NLP
                 // Simple char shuffle for Chinese string
  };

  const scrambleText = () => {
    if (!inputText) {
        setOutputText('');
        return;
    }

    // Split by non-word characters to preserve punctuation and spacing
    // Regex matches words (English or Chinese)
    const words = inputText.split(/([a-zA-Z]+|[\u4e00-\u9fa5]+)/g);
    
    const scrambled = words.map(part => {
        if (/[\u4e00-\u9fa5]+/.test(part)) {
            // Special handling for Chinese blocks
            if (part.length <= 1) return part;
            // For Chinese, we swap adjacent pairs randomly to simulate the "typo" effect
            const chars = part.split('');
            for (let i = 0; i < chars.length - 1; i += 2) {
                if (Math.random() > 0.3) { // 70% chance to swap
                    [chars[i], chars[i+1]] = [chars[i+1], chars[i]];
                }
            }
            return chars.join('');
        }
        return scrambleWord(part);
    }).join('');

    setOutputText(scrambled);
  };

  useEffect(() => {
    scrambleText();
  }, [inputText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Input */}
          <div className="flex flex-col h-full">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">1</div>
                   输入文本
                </h3>
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-theme-primary outline-none transition-all min-h-[200px] resize-none"
                    placeholder="输入一段文字（支持中文/英文）..."
                />
             </div>
          </div>

          {/* Arrow (Desktop only) */}
          <div className="hidden md:flex items-center justify-center">
             <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 text-gray-400">
                <ArrowRight size={24} />
             </div>
          </div>

          {/* Output */}
          <div className="flex flex-col h-full">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">2</div>
                       乱序结果
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={scrambleText}
                            className="p-2 text-gray-500 hover:text-theme-primary hover:bg-theme-primary/10 rounded-lg transition-all"
                            title="重新乱序"
                        >
                            <Shuffle size={18} />
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
                <textarea 
                    readOnly
                    value={outputText}
                    className="flex-1 w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none min-h-[200px] resize-none"
                />
             </div>
          </div>
       </div>
    </div>
  );
};

export default ScrambledTextGenerator;
