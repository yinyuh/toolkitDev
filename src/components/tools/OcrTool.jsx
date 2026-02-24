import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const OcrTool = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, loading, recognizing, success, error
  const [language, setLanguage] = useState('eng+chi_sim'); // Default: English + Simplified Chinese
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setText('');
      setStatus('idle');
      setProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        processFile(file);
        break;
      }
    }
  };

  const startOcr = async () => {
    if (!image) return;

    setStatus('loading');
    setProgress(0);

    try {
      setStatus('recognizing');
      const { data: { text } } = await Tesseract.recognize(
        image,
        language,
        {
          logger: m => {
            // 过滤掉参数警告信息
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
          // 禁用不必要的参数警告
          tessedit_params: {
            'tessedit_enable_dict_correction': '0',
            'tessedit_enable_auto_learning': '0'
          }
        }
      );
      
      setText(text);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "ocr_result.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <div className="bg-div-theme rounded-xl shadow-lg border border-div-theme overflow-hidden flex flex-col min-h-[600px] h-[calc(100vh-200px)]" onPaste={handlePaste}>
      {/* Header */}
      <div className="p-4 border-b border-div-theme bg-theme-secondary flex justify-between items-center">
        <h2 className="font-bold text-theme-primary">AI 文字识别 (OCR)</h2>
        <div className="flex gap-2">
            <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm border-theme rounded-md shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 bg-div-theme text-theme-primary"
            >
                <option value="eng+chi_sim">中英文混合</option>
                <option value="eng">English</option>
                <option value="chi_sim">简体中文</option>
                <option value="jpn">日本語</option>
                <option value="kor">한국어</option>
            </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Image Upload & Preview */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-div-theme bg-theme-secondary relative">
          {!image ? (
            <div 
                className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-div-theme transition-colors border-2 border-dashed border-div-theme m-4 rounded-lg"
                onClick={() => fileInputRef.current.click()}
            >
              <svg className="w-12 h-12 text-theme-secondary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <p className="text-theme-secondary font-medium">点击上传或拖拽图片到这里</p>
              <p className="text-theme-secondary text-sm mt-1">支持 Ctrl+V 粘贴截图</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
              <img src={image} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
              <button 
                onClick={() => { setImage(null); setText(''); setStatus('idle'); }}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                title="重新上传"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              {/* Action Button Overlay */}
              {status === 'idle' && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                      <button 
                        onClick={startOcr}
                        className="bg-accent hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transform transition hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                        开始识别
                      </button>
                  </div>
              )}
            </div>
          )}
          
          {/* Progress Overlay */}
          {(status === 'loading' || status === 'recognizing') && (
            <div className="absolute inset-0 bg-div-theme/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <div className="w-64 bg-theme-secondary rounded-full h-2.5 dark:bg-gray-700 mb-4">
                    <div className="bg-accent h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-accent font-medium animate-pulse">
                    {status === 'loading' ? '正在加载模型...' : `识别中... ${progress}%`}
                </p>
            </div>
          )}
        </div>

        {/* Right: Text Result */}
        <div className="w-full md:w-1/2 flex flex-col bg-div-theme">
          <div className="p-3 border-b border-div-theme flex justify-between items-center bg-theme-secondary">
            <span className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">识别结果</span>
            <div className="flex gap-2">
                <button 
                    onClick={copyToClipboard}
                    disabled={!text}
                    className="p-1.5 text-theme-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="复制到剪贴板"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m2 4v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </button>
                <button 
                    onClick={downloadText}
                    disabled={!text}
                    className="p-1.5 text-theme-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="下载TXT"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full p-4 resize-none bg-transparent text-theme-primary focus:outline-none font-sans leading-relaxed"
            placeholder="识别结果将显示在这里..."
          />
          {status === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">
                  识别失败，请检查网络连接或尝试更清晰的图片。
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OcrTool;