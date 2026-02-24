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
          <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-8 text-center">
             <h3 className="font-bold text-text-theme mb-6 flex items-center justify-center gap-2">
                <Feather size={24} className="text-accent" />
                输入你的昵称
             </h3>
             <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full max-w-lg px-6 py-4 rounded-full border-2 border-border-theme bg-div-secondary text-text-theme text-xl font-bold text-center focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none transition-all"
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
                           : 'bg-div-theme border-border-theme hover:border-accent hover:shadow-lg hover:-translate-y-1'
                      }`}
                   >
                      <div className="text-lg font-bold text-text-theme mb-2 truncate">
                         {result}
                      </div>
                      <div className={`text-xs flex items-center justify-center gap-1 transition-colors ${isCopied ? 'text-green-600' : 'text-text-secondary group-hover:text-accent'}`}>
                         {isCopied ? <Check size={14} /> : <Copy size={14} />}
                         {isCopied ? '已复制' : '点击复制'}
                      </div>
                      
                      {/* Decorative background elements */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-10 transition-opacity">
                         <Sparkles size={24} className="text-accent" />
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
