import React, { useState, useEffect } from 'react';
import { Copy, Check, Upload, Download, AlertCircle, FileText, ArrowLeftRight } from 'lucide-react';

const Base64EncoderDecoder = () => {
  const [mode, setMode] = useState('encode'); // 'encode' or 'decode'
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState(null);

  // Real-time conversion
  useEffect(() => {
    if (mode === 'encode') {
      encodeText();
    } else {
      decodeText();
    }
  }, [inputText, mode, file]);

  const encodeText = () => {
    try {
      if (file) {
        // Handle file encoding
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          setOutputText(base64String.split(',')[1] || base64String);
          setError('');
        };
        reader.readAsDataURL(file);
      } else {
        // Handle text encoding
        const encoded = btoa(unescape(encodeURIComponent(inputText)));
        setOutputText(encoded);
        setError('');
      }
    } catch (err) {
      setError('编码失败：' + err.message);
      setOutputText('');
    }
  };

  const decodeText = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(inputText)));
      setOutputText(decoded);
      setError('');
    } catch (err) {
      setError('解码失败：无效的 Base64 编码');
      setOutputText('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setInputText(''); // Clear text input when file is selected
    }
  };

  const handleDownload = () => {
    if (outputText) {
      const blob = new Blob([outputText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mode === 'encode' ? 'encoded-base64.txt' : 'decoded-text.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setError('');
    setFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setMode('encode')}
            className={`px-6 py-3 text-sm font-medium ${mode === 'encode' 
              ? 'bg-accent text-white rounded-l-lg' 
              : 'bg-div-theme text-text-theme hover:bg-div-hover'}`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            编码 (Encode)
          </button>
          <button
            type="button"
            onClick={() => setMode('decode')}
            className={`px-6 py-3 text-sm font-medium ${mode === 'decode' 
              ? 'bg-accent text-white rounded-r-lg' 
              : 'bg-div-theme text-text-theme hover:bg-div-hover'}`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            解码 (Decode)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6 h-[700px] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-lg font-bold text-text-theme">
              {mode === 'encode' ? '输入文本或上传文件' : '输入 Base64 编码'}
            </h3>
            <button
              onClick={clearAll}
              className="text-text-secondary hover:text-accent text-sm"
            >
              清空
            </button>
          </div>

          {mode === 'encode' && (
            <div className="mb-4 flex-shrink-0">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                或上传文件
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-theme rounded-lg cursor-pointer bg-div-secondary hover:bg-div-hover transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-text-secondary" />
                    <p className="mt-2 text-sm text-text-secondary">
                      <span className="font-semibold">点击上传</span> 或拖拽文件
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      支持图片、文档等文件
                    </p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              {file && (
                <div className="mt-2 text-sm text-text-secondary">
                  已选择文件: {file.name}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-medium text-text-secondary mb-2 flex-shrink-0">
              {mode === 'encode' ? '输入文本' : '输入 Base64 编码'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64 编码...'}
              className="w-full flex-1 px-4 py-3 rounded-lg border border-border-theme bg-div-secondary text-text-theme focus:ring-2 focus:ring-accent outline-none resize-none min-h-0"
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6 h-[700px] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-lg font-bold text-text-theme">
              {mode === 'encode' ? 'Base64 编码结果' : '解码结果'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!outputText}
                className="p-2 text-text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                title="下载结果"
              >
                <Download size={18} />
              </button>
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="p-2 text-text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                title="复制结果"
              >
                {copied ? <Check size={18} className="text-accent" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-medium text-text-secondary mb-2 flex-shrink-0">
              结果
            </label>
            <textarea
              value={outputText}
              readOnly
              className="w-full flex-1 px-4 py-3 rounded-lg border border-border-theme bg-div-secondary text-text-theme focus:ring-2 focus:ring-accent outline-none resize-none min-h-0"
              placeholder={mode === 'encode' ? '编码结果将显示在这里...' : '解码结果将显示在这里...'}
            />
          </div>

          {outputText && (
            <div className="mt-4 text-sm text-text-secondary flex-shrink-0">
              {mode === 'encode' 
                ? `编码后长度: ${outputText.length} 字符` 
                : `解码后长度: ${outputText.length} 字符`}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">使用提示</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Base64 编码可用于在文本格式中传输二进制数据</li>
          <li>• 编码后的字符串会比原始数据大约大 33%</li>
          <li>• 解码时请确保输入的是有效的 Base64 编码</li>
          <li>• 大文件编码可能会占用较多内存，请谨慎使用</li>
        </ul>
      </div>
    </div>
  );
};

export default Base64EncoderDecoder;
