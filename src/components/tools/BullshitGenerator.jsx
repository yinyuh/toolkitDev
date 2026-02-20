import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, FileText } from 'lucide-react';

const BullshitGenerator = () => {
  const [topic, setTopic] = useState('今天中午吃什么');
  const [length, setLength] = useState(500);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data corpus
  const data = {
    famous: [
      "爱迪生曾经说过，天才是百分之一的灵感加百分之九十九的汗水。这不禁令我深思。",
      "查尔斯·史考伯在不经意间这样说过，一个人几乎可以在任何他怀有无限热忱的事情上成功。这不禁令我深思。",
      "培根说过，深窥自己的心，而后发觉一切的奇迹在你自己。这不禁令我深思。",
      "歌德曾经说过，流水在碰到底处时才会释放活力。这不禁令我深思。",
      "莎士比亚说过，那脑袋里的智慧，就像打火石里的火花一样，不去打它是不肯出来的。这不禁令我深思。",
      "黑格尔在不经意间这样说过，只有永远躺在泥坑里的人，才不会再掉进坑里。这不禁令我深思。",
      "奥普拉·温弗瑞说过，你相信什么，你就成为什么样的人。这不禁令我深思。",
      "易卜生说过，伟大的事业，需要决心，能力，组织和责任感。这不禁令我深思。",
      "韩非子说过，内外相应，言行相称。这不禁令我深思。",
      "苏轼说过，古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。这不禁令我深思。",
      "王尔德说过，我们都生活在阴沟里，但仍有人仰望星空。这不禁令我深思。",
      "卡耐基说过，我们若已接受最坏的，就再没有什么损失。这不禁令我深思。",
      "卢梭说过，浪费时间是一桩大罪过。这不禁令我深思。",
      "叔本华说过，普通人只想到如何度过时间，有才能的人设法利用时间。这不禁令我深思。",
    ],
    before: [
      "既然如何，",
      "带着这些问题，我们来审视一下",
      "所谓",
      "我们不得不面对一个非常尴尬的事实，那就是，",
      "一般来说，",
      "总而言之，",
      "经过上述讨论，",
      "了解清楚KEY到底是一种怎么样的存在，是解决一切问题的关键。",
      "生活中，若KEY出现了，我们就不得不考虑它出现了的事实。",
      "KEY，发生了会如何，不发生又会如何。",
      "而这些并不是完全重要，更加重要的问题是，",
      "KEY的发生，到底需要如何做到，不KEY的发生，又会如何产生。",
      "每个人都不得不面对这些问题。 在面对这种问题时，",
      "那么，",
      "我认为，",
      "要想清楚，KEY，到底是一种怎么样的存在。",
      "KEY，到底应该如何实现。",
      "现在，解决KEY的问题，是非常非常重要的。 所以，",
      "我们一般认为，抓住了问题的关键，其他一切则会迎刃而解。",
      "问题的关键究竟为何？",
      "KEY因何而发生？",
      "就我个人来说，KEY对我的意义，不能不说非常重大。",
      "本人也是经过了深思熟虑，在每个日日夜夜思考这个问题。",
      "这种事实对本人来说意义重大，相信对这个世界也是有一定意义的。",
      "可是，即使是这样，KEY的出现仍然代表了一定的意义。",
      "从这个角度来看，",
      "这是不可避免的。",
      "既然如此，",
      "总结的来说，",
      "我们都知道，只要有意义，那么就必须慎重考虑。",
    ],
    after: [
      "这不禁令我深思。",
      "带着这句话，我们还要更加慎重的审视这个问题：",
      "这启发了我，",
      "我希望诸位也能好好地体会这句话。",
      "这句话语虽然很短，但令我浮想联翩。",
      "这似乎解答了我的疑惑。",
    ]
  };

  const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const randomPick = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const generate = () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate slight delay for effect
    setTimeout(() => {
        let currentLength = 0;
        let content = [];
        
        while (currentLength < length) {
            let sentence = "";
            const type = randomInt(0, 100);
            
            if (type < 20) {
                // Famous quote
                sentence = randomPick(data.famous);
                sentence = sentence.replace("这不禁令我深思", randomPick(data.after));
            } else {
                // Bullshit logic
                sentence = randomPick(data.before);
                sentence = sentence.replace(/KEY/g, topic);
                
                // Add some filler content if needed, but for now simple structure
                if (sentence.endsWith("，") || sentence.endsWith("：")) {
                    sentence += "这不禁令我深思。"; 
                }
            }
            
            content.push(sentence);
            currentLength += sentence.length;
        }
        
        // Add paragraph breaks randomly
        let formattedContent = "";
        let pLength = 0;
        for (let s of content) {
            formattedContent += s;
            pLength += s.length;
            if (pLength > randomInt(200, 500)) {
                formattedContent += "\n\n    ";
                pLength = 0;
            }
        }
        
        setResult("    " + formattedContent);
        setIsGenerating(false);
        setCopied(false);
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          
          {/* Controls */}
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      文章主题
                   </label>
                   <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-theme-primary outline-none transition-all text-lg font-bold"
                      placeholder="请输入主题，例如：今天中午吃什么"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      文章字数 (约 {length} 字)
                   </label>
                   <div className="flex items-center gap-4 h-[52px]">
                       <input 
                          type="range" 
                          min="100" 
                          max="5000" 
                          step="100"
                          value={length}
                          onChange={(e) => setLength(parseInt(e.target.value))}
                          className="flex-1 accent-theme-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                       />
                       <button 
                          onClick={generate}
                          disabled={isGenerating || !topic.trim()}
                          className={`px-6 py-2.5 bg-theme-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-theme-primary/20 flex items-center gap-2 ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-theme-primary/90 hover:-translate-y-0.5'}`}
                       >
                          {isGenerating ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                          生成
                       </button>
                   </div>
                </div>
             </div>
          </div>

          {/* Result Area */}
          <div className="p-6 md:p-8 min-h-[400px] relative bg-white dark:bg-gray-800">
             {result ? (
                <>
                    <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
                        <button 
                           onClick={handleCopy}
                           className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-sm"
                        >
                           {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                           {copied ? '已复制' : '复制全文'}
                        </button>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-loose text-lg whitespace-pre-wrap font-serif">
                        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white border-b pb-4 border-gray-100 dark:border-gray-700">
                            {topic}
                        </h2>
                        {result}
                    </div>
                </>
             ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 dark:text-gray-500">
                   <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                      <FileText size={40} />
                   </div>
                   <p className="text-xl font-medium">输入主题并点击生成按钮</p>
                   <p className="mt-2 text-sm opacity-70">生成的文章仅供娱乐，请勿用于正式场合</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default BullshitGenerator;
