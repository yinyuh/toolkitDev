/**
 * ImageToPdf 功能状态管理 Hook
 * @module useImageToPdf
 */

import { useState, useRef, useCallback } from 'react';
import { generateMergePdf, generateSplitPdfZip } from '../utils/pdfGenerator.js';
import { validateImageFile, createPreviewUrl, revokePreviewUrl, formatSize } from '../utils/imageProcessor.js';

const MAX_SINGLE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 200 * 1024 * 1024;

/**
 * @typedef {Object} PdfFileItem
 * @property {string} id
 * @property {File} file
 * @property {string} previewUrl
 * @property {string} status - 'pending' | 'converting' | 'done' | 'error'
 * @property {number} progress
 * @property {string} [error]
 */

/**
 * @typedef {Object} PdfOptions
 * @property {string} mode - 'merge' | 'split'
 * @property {string} pageSize - 'fit' | 'A4' | 'A3' | 'Letter' | 'Legal' | 'custom'
 * @property {number[]} [customSize] - [width, height] in mm
 * @property {string} align - 'center' | 'left' | 'fill'
 * @property {number} margin - margin in mm
 * @property {string} zipPrefix - ZIP filename prefix
 * @property {Blob|null} outputBlob
 * @property {string|null} outputName
 */

export function useImageToPdf() {
  const [files, setFiles] = useState(/** @type {PdfFileItem[]} */ ([]));
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [options, setOptions] = useState(/** @type {PdfOptions} */ ({
    mode: 'merge',
    pageSize: 'fit',
    customSize: [210, 297],
    align: 'center',
    margin: 10,
    zipPrefix: 'images-pdf',
    outputBlob: null,
    outputName: null
  }));
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * 添加文件到列表
   * @param {File[]} newFiles
   */
  const addFiles = useCallback((newFiles) => {
    const entries = [];
    let totalExisting = files.reduce((s, f) => s + f.file.size, 0);

    for (const file of newFiles) {
      const validation = validateImageFile(file, MAX_SINGLE_SIZE);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        continue;
      }
      if (validation.warning) {
        showToast(validation.warning, 'info');
      }
      if (totalExisting + file.size > MAX_TOTAL_SIZE) {
        showToast(`批量上传总大小超过 ${formatSize(MAX_TOTAL_SIZE)} 限制，已跳过 "${file.name}"`, 'error');
        continue;
      }
      totalExisting += file.size;
      entries.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: createPreviewUrl(file),
        status: 'pending',
        progress: 0,
        error: null
      });
    }

    if (entries.length > 0) {
      setFiles(prev => [...prev, ...entries]);
    }
  }, [files, showToast]);

  const handleFileChange = useCallback((e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  }, [addFiles]);

  /** 移除单个文件 */
  const removeFile = useCallback((id) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) revokePreviewUrl(target.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  /** 清空所有文件 */
  const clearAll = useCallback(() => {
    setFiles(prev => {
      prev.forEach(f => revokePreviewUrl(f.previewUrl));
      return [];
    });
    setOptions(prev => ({ ...prev, outputBlob: null, outputName: null }));
  }, []);

  /** 上移文件 */
  const moveFileUp = useCallback((id) => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }, []);

  /** 下移文件 */
  const moveFileDown = useCallback((id) => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }, []);

  /** 执行转换 */
  const convert = useCallback(async () => {
    if (files.length === 0) {
      showToast('请先上传图片文件', 'info');
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setOptions(prev => ({ ...prev, outputBlob: null, outputName: null }));

    try {
      if (options.mode === 'merge') {
        setProgressText('正在生成合并 PDF...');
        const pdfBlob = await generateMergePdf(
          files.map(f => f.file),
          {
            pageSize: options.pageSize,
            customSize: options.pageSize === 'custom' ? options.customSize : undefined,
            align: options.align,
            margin: options.margin,
            onProgress: (current, total) => {
              setProgress(Math.round((current / total) * 100));
              setProgressText(`正在处理第 ${current}/${total} 页...`);
            }
          }
        );
        const name = `merged_images_${Date.now()}.pdf`;
        setOptions(prev => ({ ...prev, outputBlob: pdfBlob, outputName: name }));
      } else {
        setProgressText('正在生成分页 PDF 并打包...');
        const { blob, name } = await generateSplitPdfZip(
          files.map(f => f.file),
          {
            prefix: options.zipPrefix,
            onProgress: (current, total) => {
              setProgress(Math.round((current / total) * 100));
              setProgressText(`正在处理第 ${current}/${total} 页...`);
            }
          }
        );
        setOptions(prev => ({ ...prev, outputBlob: blob, outputName: name }));
      }

      setProgress(100);
      setProgressText('转换完成！');
      showToast('PDF 生成完成，可点击下载', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast(`PDF 生成失败: ${err.message || '未知错误'}`, 'error');
      setProgress(0);
      setProgressText('');
    } finally {
      setIsConverting(false);
    }
  }, [files, options, showToast]);

  /** 下载输出文件 */
  const download = useCallback(() => {
    if (!options.outputBlob) {
      showToast('没有可下载的文件', 'info');
      return;
    }
    const url = URL.createObjectURL(options.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.outputName || 'output.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [options.outputBlob, options.outputName, showToast]);

  const fileCount = files.length;
  const totalSize = files.reduce((s, f) => s + f.file.size, 0);

  return {
    files, isConverting, progress, progressText,
    options, toast, fileInputRef,
    fileCount, totalSize,
    addFiles, handleFileChange, removeFile, clearAll,
    moveFileUp, moveFileDown,
    updateOption, convert, download,
    setToast
  };
}
