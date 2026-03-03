import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Copy, 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  ArrowDown, 
  ArrowUp, 
  Clipboard,
  Check,
  Image as ImageIcon,
  File,
  AlertCircle
} from 'lucide-react';

// Map for common file types to MIME types
const mimeMap = {
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'ppt': 'application/vnd.ms-powerpoint',
  'pdf': 'application/pdf',
  'zip': 'application/zip',
  'xmind': 'application/x-xmind', // Common for XMind
  'xind': 'application/x-xmind', // Handle user typo
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'txt': 'text/plain',
  'json': 'application/json',
  'xml': 'application/xml',
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'webm': 'video/webm',
  'webp': 'image/webp',
  'ico': 'image/x-icon',
  'csv': 'text/csv'
};

// Helper to get extension from MIME type
const getExtensionFromMime = (mime) => {
  if (!mime) return 'bin';
  // Exact match from map
  for (const [ext, m] of Object.entries(mimeMap)) {
    if (m === mime) return ext;
  }
  
  // Fallback heuristics
  const parts = mime.split('/');
  if (parts.length === 2) {
    if (parts[1].includes('spreadsheetml')) return 'xlsx';
    if (parts[1].includes('wordprocessingml')) return 'docx';
    if (parts[1].includes('presentationml')) return 'pptx';
    if (parts[1] === 'plain') return 'txt';
    // Remove potential +xml, +json suffixes and other noise
    return parts[1].split('+')[0].split('.')[0].split(';')[0];
  }
  return 'bin';
};

const Base64EncoderDecoder = () => {
  // State
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null); // { type: 'image' | 'file', src: string, mimeType: string }
  const [includeDataUri, setIncludeDataUri] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [lastEdited, setLastEdited] = useState(null); // 'input' or 'output'
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for debouncing
  const timeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Logic Helpers ---

  const processEncode = useCallback((text, currentFile, withUriScheme) => {
    setError(null);
    try {
      if (currentFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          let result = e.target.result;
          
          // Fix MIME type if needed based on file extension
          // This ensures uploaded files like .xlsx get the correct MIME type in the Data URI
          const fileName = currentFile.name || '';
          const lastDotIndex = fileName.lastIndexOf('.');
          if (lastDotIndex !== -1) {
             const ext = fileName.substring(lastDotIndex + 1).toLowerCase();
             const expectedMime = mimeMap[ext];
             if (expectedMime) {
                 // Check if result has a MIME type
                 // result format: data:[<mediatype>][;base64],<data>
                 const match = result.match(/^data:([^;]*)(;base64,.*)$/);
                 if (match) {
                     const currentMime = match[1];
                     // If current mime is different from expected, replace it
                     if (currentMime !== expectedMime) {
                         result = `data:${expectedMime}${match[2]}`;
                     }
                 }
             }
          }

          if (!withUriScheme) {
            result = result.split(',')[1] || result;
          }
          setOutputText(result);
        };
        reader.readAsDataURL(currentFile);
      } else {
        if (!text) {
          setOutputText('');
          return;
        }
        // Text encoding: handles UTF-8
        const encoded = btoa(unescape(encodeURIComponent(text)));
        setOutputText(encoded);
      }
    } catch (err) {
      console.error('Encoding error:', err);
      setError('编码失败：无法处理该输入');
    }
  }, []);

  const processDecode = useCallback((base64Str) => {
    setError(null);
    try {
      if (!base64Str) {
        setInputText('');
        setPreviewData(null);
        setFile(null);
        return;
      }

      // Check for Data URI scheme to detect files/images
      // Format: data:[<mediatype>][;base64],<data>
      const dataUriRegex = /^data:([^;]+);base64,(.+)$/s; // s flag for dotAll match
      const match = base64Str.match(dataUriRegex);

      if (match) {
        const mimeType = match[1];
        
        // If it's an image, show preview
        if (mimeType.startsWith('image/')) {
          setPreviewData({ type: 'image', src: base64Str, mimeType });
          setInputText('');
          setFile(null);
          return;
        }
        
        // If it's a non-text file (e.g. PDF, Zip), show file download card
        if (!mimeType.startsWith('text/')) {
          setPreviewData({ type: 'file', src: base64Str, mimeType });
          setInputText('');
          setFile(null);
          return;
        }
        
        // If it is text/*, fall through to text decoding (but strip header first if needed, though match[2] has data)
      }

      // Handle Data URI scheme removal if present for decoding text
      let cleanStr = base64Str;
      if (base64Str.includes(',')) {
        cleanStr = base64Str.split(',')[1];
      }
      
      // Text decoding: handles UTF-8
      const decoded = decodeURIComponent(escape(atob(cleanStr)));
      setInputText(decoded);
      setPreviewData(null);
      setFile(null);
    } catch (err) {
      console.error('Decoding error:', err);
      // Friendly error message for users
      setError('解码失败：输入的 Base64 字符串无效，包含非法字符或格式错误');
    }
  }, []);

  // --- Effects for Auto-trigger ---

  useEffect(() => {
    if (lastEdited === 'input') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        processEncode(inputText, file, includeDataUri);
      }, 300);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [inputText, file, includeDataUri, lastEdited, processEncode]);

  useEffect(() => {
    if (lastEdited === 'output') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        processDecode(outputText);
      }, 300);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [outputText, lastEdited, processDecode]);

  // --- Handlers ---

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    setLastEdited('input');
    setError(null);
    // If user types, we clear the file and preview
    if (file) setFile(null);
    if (previewData) setPreviewData(null);
  };

  const handleOutputChange = (e) => {
    setOutputText(e.target.value);
    setLastEdited('output');
    setError(null);
  };

  const handleManualEncode = () => {
    processEncode(inputText, file, includeDataUri);
    setLastEdited('input'); // Reset direction focus
  };

  const handleManualDecode = () => {
    processDecode(outputText);
    setLastEdited('output'); // Reset direction focus
  };

  const handleClear = () => {
    setInputText('');
    setFile(null);
    setPreviewData(null);
    setOutputText('');
    setLastEdited(null);
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setFile(null);
      setPreviewData(null);
      setLastEdited('input');
      setError(null);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      setError('无法读取剪贴板内容');
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setInputText(''); // Clear text input
      setPreviewData(null);
      setLastEdited('input');
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewData(null);
    setInputText('');
    setOutputText('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag & Drop
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setInputText('');
      setPreviewData(null);
      setLastEdited('input');
      setError(null);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64_output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDecodedFile = () => {
    if (!previewData || !previewData.src) return;
    const a = document.createElement('a');
    a.href = previewData.src;
    
    // Improved extension logic using mimeMap
    let ext = 'bin';
    if (previewData.mimeType) {
        ext = getExtensionFromMime(previewData.mimeType);
    }
    
    a.download = `decoded_file.${ext}`;
    a.click();
  };

  // Format bytes to human readable
  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span className="block sm:inline font-medium">{error}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setError(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[600px] gap-4 p-4">
        
        {/* Left Pane: Original Text / File */}
        <div 
          className={`flex-1 flex flex-col bg-div-theme rounded-xl shadow-sm border ${isDragging ? 'border-accent border-2' : 'border-border-theme'} overflow-hidden transition-colors`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-theme bg-div-secondary">
            <h3 className="font-semibold text-text-theme flex items-center gap-2">
              <FileText size={18} />
              原文本 / 文件
            </h3>
            <div className="flex gap-2">
              <button onClick={handleClear} className="p-1.5 text-text-secondary hover:text-red-500 rounded hover:bg-div-hover transition-colors cursor-pointer" title="清空">
                <Trash2 size={16} />
              </button>
              <button onClick={handlePaste} className="p-1.5 text-text-secondary hover:text-accent rounded hover:bg-div-hover transition-colors cursor-pointer" title="粘贴">
                <Clipboard size={16} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-text-secondary hover:text-accent rounded hover:bg-div-hover transition-colors cursor-pointer" title="上传文件">
                <Upload size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </div>
          </div>

          <div className="flex-1 relative p-0 overflow-auto">
            {file ? (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="bg-div-secondary border border-border-theme rounded-lg p-6 w-full max-w-sm shadow-sm relative">
                  <button 
                    onClick={removeFile}
                    className="absolute top-2 right-2 text-text-secondary hover:text-red-500 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 text-accent">
                      <FileText size={32} />
                    </div>
                    <h4 className="font-medium text-text-theme truncate w-full mb-1">{file.name}</h4>
                    <p className="text-sm text-text-secondary">{formatBytes(file.size)}</p>
                  </div>
                </div>
              </div>
            ) : previewData ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 overflow-auto">
                <div className="bg-div-secondary border border-border-theme rounded-lg p-4 w-full max-w-md shadow-sm relative flex flex-col items-center">
                  <button 
                      onClick={removeFile}
                      className="absolute top-2 right-2 text-text-secondary hover:text-red-500 z-10 bg-div-secondary rounded-full p-1 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                    
                  {previewData.type === 'image' ? (
                    <div className="flex flex-col items-center w-full">
                      <h4 className="font-medium text-text-theme mb-4 flex items-center gap-2">
                        <ImageIcon size={18} />
                        图片预览
                      </h4>
                      <img src={previewData.src} alt="Decoded Preview" className="max-w-full max-h-[300px] object-contain rounded border border-border-theme bg-div-theme" />
                      <div className="mt-4 text-xs text-text-secondary break-all">
                        {previewData.mimeType}
                      </div>
                      <button 
                          onClick={handleDownloadDecodedFile}
                          className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded text-sm hover:bg-accent/90 transition-colors cursor-pointer"
                      >
                          <Download size={14} />
                          下载图片
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center w-full">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 text-accent">
                          <File size={32} />
                        </div>
                        <h4 className="font-medium text-text-theme mb-1">解码文件</h4>
                        <p className="text-sm text-text-secondary mb-4">{previewData.mimeType}</p>
                        <button 
                          onClick={handleDownloadDecodedFile}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors cursor-pointer"
                        >
                          <Download size={16} />
                          下载文件
                        </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                className="w-full h-full p-4 bg-transparent border-none outline-none resize-none text-text-theme placeholder:text-text-secondary/50 font-mono text-sm"
                placeholder="在此输入内容，粘贴文本，或拖拽文件..."
                value={inputText}
                onChange={handleInputChange}
              />
            )}
            
            {isDragging && (
              <div className="absolute inset-0 bg-accent/10 flex items-center justify-center backdrop-blur-sm z-10">
                <div className="text-accent font-medium text-lg flex flex-col items-center">
                  <Upload size={48} className="mb-4" />
                  释放以上传文件
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Pane: Controls */}
        <div className="flex lg:flex-col justify-center items-center gap-4 py-2 lg:py-0 shrink-0">
          <button
            onClick={handleManualEncode}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 shadow-sm transition-colors font-medium text-sm cursor-pointer"
          >
            <span className="hidden lg:inline">编码</span>
            <span className="lg:hidden">编码</span>
            <ArrowRight className="hidden lg:block" size={16} />
            <ArrowDown className="lg:hidden" size={16} />
          </button>

          <button
            onClick={handleManualDecode}
            className="flex items-center gap-2 px-4 py-2 bg-div-secondary border border-border-theme text-text-theme rounded-lg hover:bg-div-hover shadow-sm transition-colors font-medium text-sm cursor-pointer"
          >
            <ArrowLeft className="hidden lg:block" size={16} />
            <ArrowUp className="lg:hidden" size={16} />
            <span className="hidden lg:inline">解码</span>
            <span className="lg:hidden">解码</span>
          </button>
        </div>

        {/* Right Pane: Base64 Output */}
        <div className="flex-1 flex flex-col bg-div-theme rounded-xl shadow-sm border border-border-theme overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-theme bg-div-secondary">
            <h3 className="font-semibold text-text-theme flex items-center gap-2">
              Base64 编码结果
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handleCopy} 
                className="p-1.5 text-text-secondary hover:text-accent rounded hover:bg-div-hover transition-colors cursor-pointer" 
                title="复制"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
              <button 
                onClick={handleDownload} 
                className="p-1.5 text-text-secondary hover:text-accent rounded hover:bg-div-hover transition-colors cursor-pointer" 
                title="下载"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              className="w-full h-full p-4 bg-transparent border-none outline-none resize-none text-text-theme placeholder:text-text-secondary/50 font-mono text-sm"
              placeholder="Base64 结果将显示在这里..."
              value={outputText}
              onChange={handleOutputChange}
            />
          </div>

          {/* Footer Option */}
          <div className="px-4 py-3 border-t border-border-theme bg-div-secondary/50">
            <label className="flex items-center gap-2 text-sm text-text-theme cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={includeDataUri}
                onChange={(e) => {
                  setIncludeDataUri(e.target.checked);
                  setLastEdited('input'); // Trigger re-encode
                }}
                className="rounded border-border-theme text-accent focus:ring-accent"
              />
              <span>包含 Data URI 头 (例如 data:image/png;base64,...)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Base64EncoderDecoder;
