import React, { useState, useEffect } from 'react';
import * as Diff from 'diff';

const TextDiffTool = () => {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [diffResult, setDiffResult] = useState([]);
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'inline'
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  useEffect(() => {
    compareText();
  }, [oldText, newText, ignoreWhitespace]);

  const compareText = () => {
    let result;
    if (ignoreWhitespace) {
        // 简化的忽略空白实现：先trim每行再比对（实际场景可能更复杂）
        // 这里暂时使用标准的 chars 比较，diff库的 ignoreWhitespace 选项通常针对 lines
        // 为了演示，我们使用 diffLines
        result = Diff.diffLines(oldText, newText, { ignoreWhitespace: true });
    } else {
        result = Diff.diffLines(oldText, newText);
    }
    setDiffResult(result);
  };

  const handleFileUpload = (e, setText) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setText(event.target.result);
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    setOldText('');
    setNewText('');
  };

  return (
    <div className="bg-div-theme rounded-xl shadow-lg border border-div-theme overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-div-theme flex justify-between items-center bg-theme-secondary">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-theme-primary">文本对比</h2>
          <div className="flex bg-theme-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'split'
                  ? 'bg-div-theme text-accent shadow-sm'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              分栏视图
            </button>
            <button
              onClick={() => setViewMode('inline')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'inline'
                  ? 'bg-div-theme text-accent shadow-sm'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              行内视图
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="rounded border-theme text-accent focus:ring-accent"
            />
            忽略空白
          </label>
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden ${viewMode === 'inline' ? 'hidden' : ''}`}>
        {/* Left / Old Text */}
        <div className="flex-1 flex flex-col border-r border-div-theme h-1/2 md:h-full">
          <div className="p-2 bg-theme-secondary border-b border-div-theme flex justify-between items-center">
            <span className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">原始文本 (Old)</span>
            <label className="text-xs text-accent cursor-pointer hover:underline">
              上传文件
              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, setOldText)} />
            </label>
          </div>
          <textarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            className="flex-1 w-full p-4 resize-none bg-div-theme text-theme-primary font-mono text-sm focus:outline-none"
            placeholder="在此粘贴原始文本..."
          />
        </div>

        {/* Right / New Text */}
        <div className="flex-1 flex flex-col h-1/2 md:h-full">
          <div className="p-2 bg-theme-secondary border-b border-div-theme flex justify-between items-center">
            <span className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">新文本 (New)</span>
            <label className="text-xs text-accent cursor-pointer hover:underline">
              上传文件
              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, setNewText)} />
            </label>
          </div>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 w-full p-4 resize-none bg-div-theme text-theme-primary font-mono text-sm focus:outline-none"
            placeholder="在此粘贴新文本..."
          />
        </div>
      </div>

      {/* Result Area */}
      <div className="flex-1 overflow-hidden bg-div-theme border-t border-div-theme flex flex-col">
        <div className="p-2 bg-theme-secondary border-b border-div-theme text-xs font-semibold text-theme-secondary uppercase tracking-wider flex justify-between">
            <span>对比结果</span>
            <span>
                {diffResult.filter(p => p.added).length} 处新增, {diffResult.filter(p => p.removed).length} 处删除
            </span>
        </div>
        
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            {viewMode === 'split' ? (
                <div className="flex min-h-full">
                    {/* Split View: Left (Old) & Right (New) */}
                    {/* This is a simplified split view. A true split view needs line alignment which is complex.
                        For MVP, we'll stick to Inline view or a simple side-by-side that might not align perfectly if many changes.
                        Let's try to align them by processing the diff parts. 
                    */}
                    <div className="w-1/2 border-r border-div-theme pr-2">
                        {diffResult.map((part, index) => {
                            if (part.added) return null; // Skip added parts in Old view
                            const color = part.removed ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'text-theme-secondary';
                            return (
                                <div key={index} className={`${color} whitespace-pre-wrap break-all`}>
                                    {part.value}
                                </div>
                            );
                        })}
                    </div>
                    <div className="w-1/2 pl-2">
                        {diffResult.map((part, index) => {
                            if (part.removed) return null; // Skip removed parts in New view
                            const color = part.added ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'text-theme-secondary';
                            return (
                                <div key={index} className={`${color} whitespace-pre-wrap break-all`}>
                                    {part.value}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Inline View */
                <div>
                    {diffResult.map((part, index) => {
                        const color = part.added ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                                      part.removed ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 decoration-through' :
                                      'text-theme-secondary';
                        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                        
                        return (
                            <span key={index} className={`${color} whitespace-pre-wrap break-all block`}>
                                {/* <span className="select-none opacity-50 w-6 inline-block text-right mr-2 border-r border-gray-300 dark:border-gray-600 pr-2">{prefix}</span> */}
                                {part.value}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TextDiffTool;