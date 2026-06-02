/**
 * GIF / 动图转换功能状态管理 Hook
 * @module useGifConvert
 *
 * 转换路径（按优先级）：
 *   单文件 WebP/APNG 动图：
 *     ① image-in-browser Worker（纯 JS VP8/VP8L 逐帧解码 → GIF 编码）
 *
 *   单文件视频 (MP4/MOV)：
 *     ② FFmpeg WASM 转码
 *
 *   多文件 / 单静态图：
 *     ③ Canvas 帧提取 → omggif Worker GIF 编码
 *
 *   GIF → APNG：
 *     omggif 字节级解码 → fcTL+fdAT 二进制编码
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { validateImageFile, createPreviewUrl, revokePreviewUrl, loadImageFromFile } from '../utils/imageProcessor.js';
import { filesToGifFrames, gifToApng } from '../utils/gifProcessor.js';

const MAX_SINGLE_SIZE = 50 * 1024 * 1024;

/** 多帧图片格式（走 image-in-browser Worker 逐帧解码） */
const ANIMATED_IMAGE_FORMATS = new Set([
  'image/webp', 'image/apng'
]);

/** 视频格式：走 FFmpeg */
const VIDEO_FORMATS = new Set([
  'video/quicktime', 'video/mp4'
]);

const EXT_ANIMATED = new Set(['webp', 'apng']);
const EXT_VIDEO = new Set(['mov', 'mp4']);

function getFileExt(file) {
  return (file.name.split('.').pop() || 'bin').toLowerCase();
}

function isAnimatedImage(file) {
  return ANIMATED_IMAGE_FORMATS.has(file.type) || EXT_ANIMATED.has(getFileExt(file));
}

function isVideo(file) {
  return VIDEO_FORMATS.has(file.type) || EXT_VIDEO.has(getFileExt(file));
}

export function useGifConvert() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [options, setOptions] = useState({
    direction: 'toGif', fps: 10, colors: 256,
    scaleMode: 'original', customWidth: 480, customHeight: 360,
    outputBlob: null, outputName: null
  });
  const [toast, setToast] = useState(null);
  const [gifInfo, setGifInfo] = useState(null);
  const [workerReady, setWorkerReady] = useState(false);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const webpWorkerRef = useRef(null);
  const ffmpegRef = useRef(null);
  const ffmpegLogsRef = useRef([]);

  // ---- omggif Worker (静态图/多图 GIF 编码 + GIF→APNG) ----
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
          type === 'error' ? reject(new Error(error)) : resolve(data);
        }
      };
      worker.onerror = () => {
        pendingCalls.forEach(({ reject }) => reject(new Error('Worker 处理异常')));
        pendingCalls.clear();
      };
      if (!cancelled) { workerRef.current = { worker, pendingCalls, callId: 0 }; setWorkerReady(true); }
      else worker.terminate();
    } catch { if (!cancelled) setWorkerReady(false); }
    return () => { cancelled = true; };
  }, []);

  // ---- image-in-browser Worker (WebP/APNG → GIF 逐帧转换) ----
  useEffect(() => {
    let cancelled = false;
    try {
      const worker = new Worker(
        new URL('../../../../workers/webp-to-gif.worker.js', import.meta.url),
        { type: 'module' }
      );
      const pendingCalls = new Map();
      worker.onmessage = (e) => {
        const { id, type, data, error, progress, text } = e.data;
        if (type === 'progress' && progress !== undefined) {
          setProgress(progress);
          if (text) setProgressText(text);
          return;
        }
        if (pendingCalls.has(id)) {
          const { resolve, reject } = pendingCalls.get(id);
          pendingCalls.delete(id);
          type === 'error' ? reject(new Error(error)) : resolve(data);
        }
      };
      worker.onerror = () => {
        pendingCalls.forEach(({ reject }) => reject(new Error('Worker 处理异常')));
        pendingCalls.clear();
      };
      if (!cancelled) webpWorkerRef.current = { worker, pendingCalls, callId: 0 };
      else worker.terminate();
    } catch (err) {
      console.warn('webp-to-gif Worker init failed:', err);
    }
    return () => { cancelled = true; };
  }, []);

  // ---- FFmpeg (仅视频回退用) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFfmpegLoading(true);
      const ffmpeg = new FFmpeg();
      ffmpeg.on('log', ({ message }) => {
        ffmpegLogsRef.current.push(message);
        if (ffmpegLogsRef.current.length > 200) ffmpegLogsRef.current.shift();
      });
      ffmpeg.on('progress', ({ progress: prog }) => setProgress(Math.round(prog * 100)));
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
          wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
        });
        if (!cancelled) { ffmpegRef.current = ffmpeg; setFfmpegReady(true); }
      } catch (err) {
        console.error('FFmpeg load error:', err);
        if (!cancelled) setFfmpegReady(false);
      } finally { if (!cancelled) setFfmpegLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const callWorker = useCallback((type, payload) =>
    new Promise((resolve, reject) => {
      const ref = workerRef.current;
      if (!ref) { reject(new Error('Worker 未就绪')); return; }
      const id = ++ref.callId;
      ref.pendingCalls.set(id, { resolve, reject });
      ref.worker.postMessage({ id, type, payload });
    })
  , []);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);
  const updateOption = useCallback((k, v) => setOptions(prev => ({ ...prev, [k]: v })), []);

  const addFiles = useCallback((newFiles) => {
    const entries = [];
    for (const f of newFiles) {
      const v = validateImageFile(f, MAX_SINGLE_SIZE);
      if (!v.valid) { showToast(v.error, 'error'); continue; }
      if (v.warning) showToast(v.warning, 'info');
      entries.push({ id: Math.random().toString(36).substr(2, 9), file: f, previewUrl: createPreviewUrl(f), status: 'pending', progress: 0, error: null });
    }
    if (entries.length) setFiles(prev => [...prev, ...entries]);
  }, [showToast]);

  const handleFileChange = useCallback((e) => { addFiles(Array.from(e.target.files)); e.target.value = ''; }, [addFiles]);
  const removeFile = useCallback((id) => setFiles(prev => { const t = prev.find(f => f.id === id); if (t) revokePreviewUrl(t.previewUrl); return prev.filter(f => f.id !== id); }), []);
  const clearAll = useCallback(() => {
    setFiles(prev => { prev.forEach(f => revokePreviewUrl(f.previewUrl)); return []; });
    setOptions(prev => ({ ...prev, outputBlob: null, outputName: null }));
    setGifInfo(null);
  }, []);

  // ---- ① image-in-browser Worker (WebP/APNG → GIF 逐帧转换) ----
  const convertViaImageInBrowser = useCallback(async (file, opts = {}) => {
    const ref = webpWorkerRef.current;
    if (!ref) throw new Error('WebP 转换引擎未就绪，请刷新页面重试');

    const { fps = 10, colors = 256 } = opts;
    const buffer = await file.arrayBuffer();

    return new Promise((resolve, reject) => {
      const id = ++ref.callId;
      ref.pendingCalls.set(id, { resolve, reject });
      ref.worker.postMessage(
        {
          id,
          payload: {
            buffer,
            mimeType: file.type || 'image/webp',
            fps,
            colors,
          },
        },
        [buffer]
      );
    }).then((data) => new Blob([data], { type: 'image/gif' }));
  }, []);

  // ---- ② Canvas + Worker 编码（静态图/多图） ----
  const convertViaCanvas = useCallback(async (sourceFiles, opts = {}) => {
    const { fps = 10, colors = 256, maxWidth, maxHeight } = opts;
    setProgressText('正在提取图片帧...');
    setProgress(10);
    const frames = await filesToGifFrames(sourceFiles, { fps, colors, maxWidth, maxHeight });
    if (!workerRef.current) throw new Error('处理引擎未就绪');
    setProgressText('正在编码 GIF...');
    setProgress(30);
    const gifBuffer = await callWorker('encode', { frames, options: { loop: 0, paletteSize: colors } });
    return new Blob([gifBuffer], { type: 'image/gif' });
  }, [callWorker]);

  // ---- ③ FFmpeg 回退（仅视频格式） ----
  const convertViaFFmpeg = useCallback(async (file, opts = {}) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) throw new Error('FFmpeg 引擎未加载');
    const { fps = 10, maxWidth, maxHeight } = opts;
    const ext = getFileExt(file);
    const inName = `in_${Date.now()}.${ext}`;
    const outName = `out_${Date.now()}.gif`;

    setProgressText('正在写入文件...');
    setProgress(5);
    await ffmpeg.writeFile(inName, await fetchFile(file));
    setProgressText('正在 FFmpeg 转码...');
    setProgress(10);

    const vf = [`fps=${fps}`];
    if (maxWidth || maxHeight) vf.push(`scale=${maxWidth || -1}:${maxHeight || -1}:flags=lanczos`);

    ffmpegLogsRef.current = [];
    const exitCode = await ffmpeg.exec(['-i', inName, '-vf', vf.join(','), '-f', 'gif', outName]);
    if (exitCode !== 0) {
      const lastLogs = ffmpegLogsRef.current.slice(-5).join(' | ');
      throw new Error(`FFmpeg 转码失败 (退出码 ${exitCode})${lastLogs ? ': ' + lastLogs : ''}`);
    }

    setProgressText('正在读取输出...');
    setProgress(85);
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(inName);
    try { await ffmpeg.deleteFile(outName); } catch (_) {}
    if (!data || data.length === 0) throw new Error('FFmpeg 输出文件为空');
    return new Blob([data.buffer], { type: 'image/gif' });
  }, []);

  // ---- 主转换入口 ----
  const convert = useCallback(async () => {
    if (files.length === 0) { showToast('请先上传文件', 'info'); return; }
    setIsConverting(true);
    setProgress(0);
    setOptions(prev => ({ ...prev, outputBlob: null, outputName: null }));

    try {
      if (options.direction === 'toGif') {
        const sourceFiles = files.map(f => f.file);
        const file = sourceFiles[0];
        const isSingle = sourceFiles.length === 1;
        const baseName = isSingle ? file.name.replace(/\.[^.]+$/, '') : `animated_${Date.now()}`;

        if (options.scaleMode === 'half' && isSingle) {
          const img = await loadImageFromFile(file);
          updateOption('customWidth', Math.round(img.width * 0.5));
          updateOption('customHeight', Math.round(img.height * 0.5));
        }
        const maxW = options.scaleMode === 'custom' ? options.customWidth : undefined;
        const maxH = options.scaleMode === 'custom' ? options.customHeight : undefined;

        let gifBlob = null;

        // 单文件 + WebP/APNG 动图 → ① image-in-browser Worker
        if (isSingle && isAnimatedImage(file)) {
          try {
            gifBlob = await convertViaImageInBrowser(file, { fps: options.fps, colors: options.colors });
            showToast('动图转换完成（完整帧序列）', 'success');
          } catch (decErr) {
            console.warn('image-in-browser decode failed:', decErr.message);
            showToast(`动图解码失败: ${decErr.message}，已回退为首帧静态 GIF`, 'warning');
          }
        }

        // 单文件 + 视频格式 → ② FFmpeg
        if (!gifBlob && isSingle && isVideo(file)) {
          if (ffmpegReady) {
            try {
              gifBlob = await convertViaFFmpeg(file, { fps: options.fps, maxWidth: maxW, maxHeight: maxH });
              showToast('视频转 GIF 完成', 'success');
            } catch (ffErr) {
              console.warn('FFmpeg video failed:', ffErr.message);
              showToast(`视频转码失败: ${ffErr.message}，回退为首帧`, 'warning');
            }
          } else {
            showToast(ffmpegLoading ? 'FFmpeg 加载中，请稍后重试...' : 'FFmpeg 引擎不可用', 'warning');
          }
        }

        // ③ Canvas 保底 / 静态图主路径
        if (!gifBlob) {
          gifBlob = await convertViaCanvas(sourceFiles, { fps: options.fps, colors: options.colors, maxWidth: maxW, maxHeight: maxH });
        }

        setOptions(prev => ({ ...prev, outputBlob: gifBlob, outputName: `${baseName}.gif` }));
      } else {
        // GIF → APNG
        const gifFile = files[0].file;
        setProgressText('正在分析 GIF...');
        setProgress(10);
        const buf = await gifFile.arrayBuffer();
        setProgress(30);
        setProgressText('正在转换为 APNG...');
        const apngBlob = await gifToApng(buf, {});
        setOptions(prev => ({ ...prev, outputBlob: apngBlob, outputName: gifFile.name.replace(/\.[^.]+$/, '') + '.apng' }));
      }

      setProgress(100);
      setProgressText('转换完成！');
    } catch (err) {
      console.error('GIF conversion error:', err);
      showToast(`转换失败: ${err.message || '未知错误'}`, 'error');
      setProgress(0); setProgressText('');
    } finally { setIsConverting(false); }
  }, [files, options, showToast, updateOption, ffmpegReady, ffmpegLoading, convertViaImageInBrowser, convertViaCanvas, convertViaFFmpeg]);

  const loadGifInfo = useCallback(async (gifFile) => {
    try { setGifInfo(await callWorker('getInfo', { gifBuffer: await gifFile.arrayBuffer() })); } catch { setGifInfo(null); }
  }, [callWorker]);

  const download = useCallback(() => {
    if (!options.outputBlob) { showToast('没有可下载的文件', 'info'); return; }
    const url = URL.createObjectURL(options.outputBlob);
    const a = document.createElement('a'); a.href = url; a.download = options.outputName || 'output.gif';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [options.outputBlob, options.outputName, showToast]);

  return {
    files, isConverting, progress, progressText,
    options, toast, gifInfo, workerReady, ffmpegReady, ffmpegLoading,
    fileInputRef, fileCount: files.length,
    addFiles, handleFileChange, removeFile, clearAll,
    updateOption, convert, download, loadGifInfo,
    setToast, setGifInfo
  };
}
