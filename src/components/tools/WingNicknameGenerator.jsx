import React, { useState } from 'react';
import { Copy, Check, Feather, Sparkles } from 'lucide-react';

const WingNicknameGenerator = () => {
  const [nickname, setNickname] = useState('王者');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const templates = [
    { left: '꧁', right: '꧂' },
    { left: '༺', right: '༻' },
    { left: '꧁༺', right: '༻꧂' },
    { left: '╰', right: '╯' },
    { left: '✧', right: '✧' },
    { left: '★', right: '★' },
    { left: '☆', right: '☆' },
    { left: '✦', right: '✦' },
    { left: '✿', right: '✿' },
    { left: '❃', right: '❃' },
    { left: '❀', right: '❀' },
    { left: '❁', right: '❁' },
    { left: '✾', right: '✾' },
    { left: '❆', right: '❆' },
    { left: '❇', right: '❇' },
    { left: '❈', right: '❈' },
    { left: '❉', right: '❉' },
    { left: '❊', right: '❊' },
    { left: '❋', right: '❋' },
    { left: '☾', right: '☽' },
    { left: '♛', right: '♛' },
    { left: '♚', right: '♚' },
    { left: '☮', right: '☮' },
    { left: '☯', right: '☯' },
    { left: '☣', right: '☣' },
    { left: '☤', right: '☤' },
    { left: '☥', right: '☥' },
    { left: '☦', right: '☦' },
    { left: '☧', right: '☧' },
    { left: '☨', right: '☨' },
    { left: '☩', right: '☩' },
    { left: '☪', right: '☪' },
    { left: '☫', right: '☫' },
    { left: '☬', right: '☫' },
    { left: '☭', right: '☭' },
    { left: '♃', right: '♃' },
    { left: '♄', right: '♄' },
    { left: '♅', right: '♅' },
    { left: '♆', right: '♆' },
    { left: '♇', right: '♇' },
    { left: '♈', right: '♈' },
    { left: '♉', right: '♉' },
    { left: '♊', right: '♊' },
    { left: '♋', right: '♋' },
    { left: '♌', right: '♌' },
    { left: '♍', right: '♍' },
    { left: '♎', right: '♎' },
    { left: '♏', right: '♏' },
    { left: '♐', right: '♐' },
    { left: '♑', right: '♑' },
    { left: '♒', right: '♒' },
    { left: '♓', right: '♓' },
    { left: 'ღ', right: 'ღ' },
    { left: '⁂', right: '⁂' },
    { left: '⁎', right: '⁎' },
    { left: '⁑', right: '⁑' },
    { left: '☸', right: '☸' },
    { left: '✢', right: '✢' },
    { left: '✣', right: '✣' },
    { left: '✤', right: '✤' },
    { left: '✥', right: '✥' },
    { left: '✱', right: '✱' },
    { left: '✲', right: '✲' },
    { left: '✳', right: '✳' },
    { left: '✴', right: '✴' },
    { left: '✵', right: '✵' },
    { left: '✶', right: '✶' },
    { left: '✷', right: '✷' },
    { left: '✸', right: '✸' },
    { left: '✹', right: '✹' },
    { left: '✺', right: '✺' },
    { left: '✻', right: '✻' },
    { left: '✼', right: '✼' },
    { left: '✽', right: '✽' },
    { left: '✾', right: '✾' },
    { left: '✿', right: '✿' },
    { left: '❀', right: '❀' },
    { left: '❁', right: '❁' },
    { left: '❂', right: '❂' },
    { left: '❃', right: '❃' },
    { left: '❄', right: '❄' },
    { left: '❅', right: '❅' },
    { left: '❆', right: '❆' },
    { left: '❇', right: '❇' },
    { left: '❈', right: '❈' },
    { left: '❉', right: '❉' },
    { left: '❊', right: '❊' },
    { left: '❋', right: '❋' },
    { left: '❌', right: '❌' },
    { left: '❍', right: '❍' },
    { left: '❎', right: '❎' },
    { left: '❏', right: '❏' },
    { left: '❐', right: '❐' },
    { left: '❑', right: '❑' },
    { left: '❒', right: '❒' },
    { left: '❓', right: '❓' },
    { left: '❔', right: '❔' },
    { left: '❕', right: '❕' },
    { left: '❖', right: '❖' },
    { left: '❗', right: '❗' },
    { left: '❘', right: '❘' },
    { left: '❙', right: '❙' },
    { left: '❚', right: '❚' },
    { left: '❛', right: '❜' },
    { left: '❝', right: '❞' },
    { left: '❟', right: '❟' },
    { left: '❠', right: '❠' },
    { left: '❡', right: '❡' },
    { left: '❢', right: '❢' },
    { left: '❣', right: '❣' },
    { left: '❤', right: '❤' },
    { left: '❥', right: '❥' },
    { left: '❦', right: '❦' },
    { left: '❧', right: '❧' },
    { left: '☙', right: '☙' },
    { left: '➳', right: '➳' },
    { left: '➴', right: '➴' },
    { left: '➵', right: '➶' },
    { left: '➻', right: '➻' },
    { left: '➼', right: '➼' },
    { left: '➽', right: '➽' },
    { left: '➾', right: '➾' },
    { left: '☊', right: '☋' },
    { left: '☌', right: '☍' },
    { left: '☍', right: '☌' },
    { left: '☋', right: '☊' },
  ];

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
       <div className="space-y-8">
          
          {/* Input */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
             <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center justify-center gap-2">
                <Feather size={24} className="text-theme-primary" />
                输入你的昵称
             </h3>
             <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full max-w-lg px-6 py-4 rounded-full border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-xl font-bold text-center focus:ring-4 focus:ring-theme-primary/20 focus:border-theme-primary outline-none transition-all"
                placeholder="例如：王者"
             />
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {templates.map((tpl, i) => {
                const result = `${tpl.left} ${nickname} ${tpl.right}`;
                const isCopied = copiedIndex === i;
                
                return (
                   <button
                      key={i}
                      onClick={() => handleCopy(result, i)}
                      className={`relative group p-6 rounded-xl border transition-all duration-200 text-center ${
                         isCopied 
                           ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                           : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-theme-primary dark:hover:border-theme-primary hover:shadow-lg hover:-translate-y-1'
                      }`}
                   >
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 truncate">
                         {result}
                      </div>
                      <div className={`text-xs flex items-center justify-center gap-1 transition-colors ${isCopied ? 'text-green-600' : 'text-gray-400 group-hover:text-theme-primary'}`}>
                         {isCopied ? <Check size={14} /> : <Copy size={14} />}
                         {isCopied ? '已复制' : '点击复制'}
                      </div>
                      
                      {/* Decorative background elements */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-10 transition-opacity">
                         <Sparkles size={24} className="text-theme-primary" />
                      </div>
                   </button>
                );
             })}
          </div>
       </div>
    </div>
  );
};

export default WingNicknameGenerator;
