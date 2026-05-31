/**
 * GIF / 动图转换功能状态管理 Hook
 * @module useGifConvert
 *
 * 转换路径：
 *   toGif + 单文件(WebP/PNG/JPG等) → Canvas 帧提取 → Worker GIF 编码（主路径，零失败）
 *   toGif + 多文件 → Canvas 多帧提取 → Worker GIF 编码（合成动画）
 *   toGif + 单文件(APNG/AVIF/MOV/MP4) → FFmpeg WASM 转 GIF（保留完整动效）
 *                                      └ 失败回退为 Canvas 首帧 GIF
 *   fromGif + GIF → omggif 解码 → APNG 编码
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { validateImageFile, createPreviewUrl, revokePreviewUrl, formatSize, loadImageFromFile, drawImageToCanvas } from '../utils/imageProcessor.js';
import { filesToGifFrames, gifToApng } from '../utils/gifProcessor.js';

const MAX_SINGLE_SIZE = 50 * 1024 * 1024;

/**
 * 真正需要 FFmpeg 的多帧格式：浏览器 Canvas 无法逐帧解码这些格式。
 * 注意：image/webp 不在其中 —— 浏览器可以渲染 WebP（取其首帧），
 * 静态 WebP 走 Canvas 路径更稳定；动图 WebP 如需保留全部帧，
 * FFmpeg 引擎加载后会作为备选提升路径尝试。
 */
const FFMPEG_ONLY_FORMATS = {
  mime: ['image/webp', 'image/apng', 'image/avif', 'video/quicktime', 'video/mp4'],
  ext: ['webp', 'apng', 'avif', 'mov', 'mp4']
};

/**
 * 判断是否为必须用 FFmpeg 处理的多帧/视频格式
 * @param {File} file
 * @returns {boolean}
 */
function isFFmpegRequiredFormat(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return FFMPEG_ONLY_FORMATS.mime.includes(file.type) || FFMPEG_ONLY_FORMATS.ext.includes(ext);
}

/**
 * 获取文件扩展名（不含点）
 * @param {File} file
 * @returns {string}
 */
function getFileExt(file) {
  return (file.name.split('.').pop() || 'bin').toLowerCase();
}

export function useGifConvert() {
  const [files, setFiles] = useState(/** @type {import('./useGifConvert.js').GifFileItem[]} */ ([]));
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [options, setOptions] = useState({
    direction: 'toGif',
    fps: 10,
    colors: 256,
    scaleMode: 'original',
    customWidth: 480,
    customHeight: 360,
    outputBlob: null,
    outputName: null
  });
  const [toast, setToast] = useState(null);
  const [gifInfo, setGifInfo] = useState(null);
  const [workerReady, setWorkerReady] = useState(false);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const ffmpegRef = useRef(null);
  const ffmpegLogsRef = useRef([]);

  // ---- Worker 初始化 ----
  useEffect(() => {
    let cancelled = false;
    try {
      const worker = new Worker(
        new URL('../../../../workers/gif-encoder.worker.js', import.meta.url),
        { type: 'module' }
      );

      const pendingCalls = new Map();
      worker.onmessage = (e) => {
        const { id, type, data, error, progress: prog } = e.data;
        if (type === 'progress' && prog !== undefined) { setProgress(prog); return; }
        if (id === -1) return;
        if (pendingCalls.has(id)) {
          const { resolve, reject } = pendingCalls.get(id);
          pendingCalls.delete(id);
          if (type === 'error') reject(new Error(error));
          else resolve(data);
        }
      };
      worker.onerror = () => {
        pendingCalls.forEach(({ reject }) => reject(new Error('Worker 处理异常')));
        pendingCalls.clear();
      };

      if (!cancelled) {
        workerRef.current = { worker, pendingCalls, callId: 0 };
        setWorkerReady(true);
      } else { worker.terminate(); }
    } catch {
      if (!cancelled) setWorkerReady(false);
    }
    return () => { cancelled = true; };
  }, []);

  // ---- FFmpeg 初始化 ----
  useEffect(() => {
    let cancelled = false;
    const loadFfmpeg = async () => {
      setFfmpegLoading(true);
      const ffmpeg = new FFmpeg();

      ffmpeg.on('log', ({ message }) => {
        ffmpegLogsRef.current.push(message);
        if (ffmpegLogsRef.current.length > 200) ffmpegLogsRef.current.shift();
      });

      ffmpeg.on('progress', ({ progress: prog }) => {
        setProgress(Math.round(prog * 100));
      });

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
          wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
        });
        if (!cancelled) { ffmpegRef.current = ffmpeg; setFfmpegReady(true); }
      } catch (err) {
        console.error('FFmpeg load error:', err);
        if (!cancelled) setFfmpegReady(false);
      } finally {
        if (!cancelled) setFfmpegLoading(false);
      }
    };
    loadFfmpeg();
    return () => { cancelled = true; };
  }, []);

  const callWorker = useCallback((type, payload) => {
    return new Promise((resolve, reject) => {
      const ref = workerRef.current;
      if (!ref) { reject(new Error('Worker 未就绪')); return; }
      const id = ++ref.callId;
      ref.pendingCalls.set(id, { resolve, reject });
      ref.worker.postMessage({ id, type, payload });
    });
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const addFiles = useCallback((newFiles) => {
    const entries = [];
    for (const file of newFiles) {
      const validation = validateImageFile(file, MAX_SINGLE_SIZE);
      if (!validation.valid) { showToast(validation.error, 'error'); continue; }
      if (validation.warning) { showToast(validation.warning, 'info'); }
      entries.push({
        id: Math.random().toString(36).substr(2, 9),
        file, previewUrl: createPreviewUrl(file),
        status: 'pending', progress: 0, error: null
      });
    }
    if (entries.length > 0) setFiles(prev => [...prev, ...entries]);
  }, [showToast]);

  const handleFileChange = useCallback((e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  }, [addFiles]);

  const removeFile = useCallback((id) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) revokePreviewUrl(target.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setFiles(prev => { prev.forEach(f => revokePreviewUrl(f.previewUrl)); return []; });
    setOptions(prev => ({ ...prev, outputBlob: null, outputName: null }));
    setGifInfo(null);
  }, []);

  /**
   * 通过 Canvas + Worker 编码为 GIF（主路径，零 FFmpeg 依赖）
   * @param {File[]} sourceFiles
   * @param {{ fps: number, colors: number, maxWidth?: number, maxHeight?: number }} opts
   * @returns {Promise<Blob>}
   */
  const convertViaCanvas = useCallback(async (sourceFiles, opts = {}) => {
    const { fps = 10, colors = 256, maxWidth, maxHeight } = opts;

    setProgressText('正在提取图片帧...');
    setProgress(10);

    const frames = await filesToGifFrames(sourceFiles, {
      fps, colors, maxWidth, maxHeight
    });

    if (!workerRef.current) {
      throw new Error('处理引擎未就绪，请刷新页面后重试');
    }

    setProgressText('正在编码 GIF (后台线程处理中)...');
    setProgress(30);

    const gifBuffer = await callWorker('encode', {
      frames,
      options: { loop: 0, paletteSize: colors }
    });

    return new Blob([gifBuffer], { type: 'image/gif' });
  }, [callWorker]);

  /**
   * 通过 FFmpeg WASM 将文件转为 GIF（提升路径，用于多帧动画格式）
   * @param {File} file
   * @param {{ fps: number, maxWidth?: number, maxHeight?: number }} opts
   * @returns {Promise<Blob>}
   */
  const convertViaFFmpeg = useCallback(async (file, opts = {}) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) throw new Error('FFmpeg 引擎未加载');

    const { fps = 10, maxWidth, maxHeight } = opts;
    const inputExt = getFileExt(file);
    const inputName = `input_${Date.now()}.${inputExt}`;
    const outputName = `output_${Date.now()}.gif`;

    setProgressText('正在写入文件...');
    setProgress(5);
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    setProgressText('正在 FFmpeg 转码...');
    setProgress(10);

    const vfParts = [`fps=${fps}`];
    if (maxWidth || maxHeight) {
      const scaleW = maxWidth || -1;
      const scaleH = maxHeight || -1;
      vfParts.push(`scale=${scaleW}:${scaleH}:flags=lanczos`);
    }

    const args = ['-analyzeduration', '100000000', '-probesize', '100000000', '-f', 'webp', '-c:v', 'libwebp', '-i', inputName, '-vf', vfParts.join(','), '-f', 'gif', outputName];

    ffmpegLogsRef.current = [];
    const exitCode = await ffmpeg.exec(args);

    if (exitCode !== 0) {
      const lastLogs = ffmpegLogsRef.current.slice(-5).join(' | ');
      throw new Error(`FFmpeg 转码失败 (退出码 ${exitCode})${lastLogs ? ': ' + lastLogs : ''}`);
    }

    setProgressText('正在读取输出...');
    setProgress(85);
    const data = await ffmpeg.readFile(outputName);

    await ffmpeg.deleteFile(inputName);
    try { await ffmpeg.deleteFile(outputName); } catch (_) { /* ignore */ }

    if (!data || data.length === 0) {
      throw new Error('FFmpeg 输出文件为空，源格式可能不被该引擎支持');
    }

    return new Blob([data.buffer], { type: 'image/gif' });
  }, []);

  /**
   * 主转换入口
   */
  const convert = useCallback(async () => {
    if (files.length === 0) { showToast('请先上传文件', 'info'); return; }

    setIsConverting(true);
    setProgress(0);
    setOptions(prev => ({ ...prev, outputBlob: null, outputName: null }));

    try {
      if (options.direction === 'toGif') {
        const sourceFiles = files.map(f => f.file);
        const isSingleFile = sourceFiles.length === 1;
        const file = sourceFiles[0];
        const baseName = isSingleFile
          ? file.name.replace(/\.[^.]+$/, '')
          : `animated_${Date.now()}`;

        if (options.scaleMode === 'half') {
          const firstImg = await loadImageFromFile(file);
          updateOption('customWidth', Math.round(firstImg.width * 0.5));
          updateOption('customHeight', Math.round(firstImg.height * 0.5));
        }

        const maxW = options.scaleMode === 'custom' ? options.customWidth : undefined;
        const maxH = options.scaleMode === 'custom' ? options.customHeight : undefined;
        let gifBlob = null;
        let usedFFmpeg = false;

        // 对于必须 FFmpeg 的格式（APNG/AVIF/MOV/MP4），先尝试 FFmpeg
        if (isSingleFile && isFFmpegRequiredFormat(file)) {
          if (ffmpegReady) {
            try {
              setProgressText('检测到多帧格式，正在通过 FFmpeg 转码...');
              gifBlob = await convertViaFFmpeg(file, { fps: options.fps, maxWidth: maxW, maxHeight: maxH });
              usedFFmpeg = true;
            } catch (ffErr) {
              console.warn('FFmpeg path failed, falling back to Canvas:', ffErr.message);
              showToast(`FFmpeg 转码失败，已回退为静态首帧 GIF: ${ffErr.message}`, 'info');
            }
          } else if (ffmpegLoading) {
            showToast('FFmpeg 引擎正在加载中，先使用 Canvas 提取首帧...', 'info');
          } else {
            showToast('FFmpeg 引擎不可用，将提取首帧生成静态 GIF', 'info');
          }
        }

        // Canvas + Worker 主路径 / 回退路径
        if (!gifBlob) {
          gifBlob = await convertViaCanvas(sourceFiles, {
            fps: options.fps,
            colors: options.colors,
            maxWidth: maxW,
            maxHeight: maxH
          });
        }

        const ext = `${baseName}.gif`;
        setOptions(prev => ({ ...prev, outputBlob: gifBlob, outputName: ext }));

        if (usedFFmpeg) {
          showToast('动图转换完成（FFmpeg 完整帧序列）', 'success');
        }
      } else {
        // ---- GIF → APNG ----
        const gifFile = files[0].file;
        setProgressText('正在分析 GIF 文件...');
        setProgress(10);
        const gifBuf = await gifFile.arrayBuffer();
        setProgress(30);
        setProgressText('正在转换为 APNG...');
        const apngBlob = await gifToApng(gifBuf, {});
        setOptions(prev => ({
          ...prev,
          outputBlob: apngBlob,
          outputName: gifFile.name.replace(/\.[^.]+$/, '') + '.apng'
        }));
      }

      setProgress(100);
      setProgressText('转换完成！');
      if (options.direction === 'toGif') {
        showToast('转换完成，可点击下载', 'success');
      }
    } catch (err) {
      console.error('GIF conversion error:', err);
      showToast(`转换失败: ${err.message || '未知错误'}`, 'error');
      setProgress(0);
      setProgressText('');
    } finally {
      setIsConverting(false);
    }
  }, [files, options, showToast, updateOption, ffmpegReady, ffmpegLoading, convertViaCanvas, convertViaFFmpeg]);

  const loadGifInfo = useCallback(async (gifFile) => {
    try {
      const buffer = await gifFile.arrayBuffer();
      const info = await callWorker('getInfo', { gifBuffer: buffer });
      setGifInfo(info);
    } catch { setGifInfo(null); }
  }, [callWorker]);

  const download = useCallback(() => {
    if (!options.outputBlob) { showToast('没有可下载的文件', 'info'); return; }
    const url = URL.createObjectURL(options.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.outputName || 'output.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [options.outputBlob, options.outputName, showToast]);

  const fileCount = files.length;

  return {
    files, isConverting, progress, progressText,
    options, toast, gifInfo, workerReady,
    ffmpegReady, ffmpegLoading,
    fileInputRef, fileCount,
    addFiles, handleFileChange, removeFile, clearAll,
    updateOption, convert, download, loadGifInfo,
    setToast, setGifInfo
  };
}
