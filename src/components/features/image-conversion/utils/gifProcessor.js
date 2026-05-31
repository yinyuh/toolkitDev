/**
 * GIF / 动图处理工具函数
 * @module gifProcessor
 *
 * 浏览器端支持的转换路径：
 *   Forward (→ GIF): 静态图→单帧GIF | 多图→动态GIF | MOV→GIF(FFmpeg) | GIF 重编码
 *   Reverse (GIF→): GIF→静态WebP | GIF→APNG
 *
 * 已知限制：
 *   - Canvas 无法编码动态 WebP/AVIF，反向转换中不提供这两种格式
 *   - 动图 WebP/APNG/AVIF 解码依赖浏览器原生支持，可能仅获取首帧
 */

import { loadImageFromFile, drawImageToCanvas, canvasToBlob } from './imageProcessor.js';

/** @constant {number} GIF 颜色表最大尺寸 */
const MAX_COLORS = 256;

/**
 * 从 Canvas 提取 RGBA 像素数据
 * @param {HTMLCanvasElement} canvas
 * @returns {{ pixels: Uint8ClampedArray, width: number, height: number }}
 */
export function getPixelData(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    pixels: imageData.data,
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * 颜色量化：将 RGBA 像素减少到指定颜色数
 * 使用中位切分算法简化版
 * @param {Uint8ClampedArray} pixels - RGBA 像素数组
 * @param {number} maxColors - 最大颜色数 (2-256)
 * @returns {{ palette: number[][], indices: Uint8Array }}
 */
export function quantizeColors(pixels, maxColors = 256) {
  const colorMap = new Map();
  const colors = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (a < 128) continue;

    const key = (r << 16) | (g << 8) | b;
    if (!colorMap.has(key)) {
      colorMap.set(key, { r, g, b, count: 0 });
    }
    colorMap.get(key).count++;
  }

  const palette = [];
  const indexMap = new Map();
  let idx = 0;

  const sorted = [...colorMap.values()].sort((a, b) => b.count - a.count);
  const limit = Math.min(maxColors, sorted.length);

  for (let i = 0; i < limit; i++) {
    const c = sorted[i];
    const key = (c.r << 16) | (c.g << 8) | c.b;
    palette.push([c.r, c.g, c.b]);
    indexMap.set(key, idx);
    idx++;
  }

  const indices = new Uint8Array(pixels.length / 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 128) {
      indices[i / 4] = 0;
      continue;
    }

    const key = (r << 16) | (g << 8) | b;
    if (indexMap.has(key)) {
      indices[i / 4] = indexMap.get(key);
    } else {
      let minDist = Infinity;
      let bestIdx = 0;
      for (let j = 0; j < palette.length; j++) {
        const [pr, pg, pb] = palette[j];
        const dr = r - pr, dg = g - pg, db = b - pb;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < minDist) {
          minDist = dist;
          bestIdx = j;
        }
      }
      indices[i / 4] = bestIdx;
    }
  }

  return { palette, indices };
}

/**
 * 从静态图片文件生成 GIF 帧数据
 * @param {File} file - 图片文件
 * @param {Object} options
 * @param {number} [options.maxWidth] - 输出最大宽度
 * @param {number} [options.maxHeight] - 输出最大高度
 * @param {number} [options.colors=256] - 颜色深度
 * @returns {Promise<{pixels: Uint8ClampedArray, width: number, height: number, delay: number}>}
 */
export async function fileToGifFrame(file, options = {}) {
  const { maxWidth, maxHeight, colors = 256 } = options;
  const img = await loadImageFromFile(file);
  const { canvas, width, height } = drawImageToCanvas(img, { maxWidth, maxHeight });
  return {
    pixels: getPixelData(canvas).pixels,
    width,
    height,
    delay: 10
  };
}

/**
 * 多张图片转为动态 GIF 帧列表
 * @param {File[]} files - 图片文件数组
 * @param {Object} options
 * @param {number} [options.fps=10] - 帧率
 * @param {number} [options.colors=256] - 颜色深度
 * @param {number} [options.maxWidth] - 最大宽度
 * @param {number} [options.maxHeight] - 最大高度
 * @returns {Promise<Array<{pixels: Uint8ClampedArray, width: number, height: number, delay: number}>>}
 */
export async function filesToGifFrames(files, options = {}) {
  const { fps = 10, maxWidth, maxHeight, colors = 256 } = options;
  const delay = Math.round(100 / fps);
  const frames = [];

  for (const file of files) {
    const frame = await fileToGifFrame(file, { maxWidth, maxHeight, colors });
    frame.delay = delay;
    frames.push(frame);
    await new Promise(r => setTimeout(r, 0));
  }

  return frames;
}

/**
 * 将 GIF 帧列表转为静态 WebP
 * 取第一帧渲染为 WebP 图片
 * @param {File} gifFile - GIF 文件
 * @param {Object} [options]
 * @param {number} [options.quality=0.8]
 * @returns {Promise<Blob>}
 */
export async function gifToStaticWebP(gifFile, options = {}) {
  const { quality = 0.8 } = options;
  const img = await loadImageFromFile(gifFile);
  const { canvas } = drawImageToCanvas(img);
  return canvasToBlob(canvas, 'image/webp', quality);
}

/**
 * GIF 转 APNG
 * 通过 Canvas 逐帧提取 GIF 帧并编码为 APNG
 *
 * 注意：Canvas 渲染 GIF 时仅获取首帧，完整逐帧提取需使用 omggif 解码。
 * 此处提供基于 omggif 的完整实现入口。
 *
 * @param {ArrayBuffer} gifBuffer - GIF 原始数据
 * @param {Object} [options]
 * @param {number} [options.maxWidth] - 最大宽度
 * @param {number} [options.maxHeight] - 最大高度
 * @returns {Promise<Blob>} APNG Blob
 */
export async function gifToApng(gifBuffer, options = {}) {
  const { GifReader } = await import('omggif');
  const { maxWidth, maxHeight } = options;

  const reader = new GifReader(new Uint8Array(gifBuffer));
  const numFrames = reader.numFrames();
  const gifWidth = reader.width;
  const gifHeight = reader.height;

  let outW = gifWidth;
  let outH = gifHeight;
  if (maxWidth || maxHeight) {
    const scaleX = maxWidth ? maxWidth / outW : 1;
    const scaleY = maxHeight ? maxHeight / outH : 1;
    const scale = Math.min(scaleX, scaleY);
    if (scale < 1) {
      outW = Math.round(outW * scale);
      outH = Math.round(outH * scale);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = gifWidth;
  canvas.height = gifHeight;
  const ctx = canvas.getContext('2d');

  const frameDataUrlList = [];
  const frameDelays = [];

  for (let i = 0; i < numFrames; i++) {
    reader.decodeAndBlitFrameRGBA(i, ctx.getImageData(0, 0, gifWidth, gifHeight).data);

    let frameCanvas = canvas;
    if (outW !== gifWidth || outH !== gifHeight) {
      frameCanvas = document.createElement('canvas');
      frameCanvas.width = outW;
      frameCanvas.height = outH;
      const fctx = frameCanvas.getContext('2d');
      fctx.drawImage(canvas, 0, 0, outW, outH);
    }

    const pngDataUrl = frameCanvas.toDataURL('image/png');
    frameDataUrlList.push(pngDataUrl);

    const frameInfo = reader.frameInfo(i);
    frameDelays.push(frameInfo.delay || 10);

    await new Promise(r => setTimeout(r, 0));
  }

  const apngBlob = await buildApng(frameDataUrlList, frameDelays, outW, outH);
  return apngBlob;
}

/**
 * 构建 APNG 文件
 * @param {string[]} frameDataUrls - 每帧的 PNG DataURL
 * @param {number[]} delays - 每帧延迟 (1/100秒)
 * @param {number} width
 * @param {number} height
 * @returns {Promise<Blob>}
 */
async function buildApng(frameDataUrls, delays, width, height) {
  const parts = [];
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  parts.push(sig);

  const numFrames = frameDataUrls.length;
  const numPlays = 0;

  const ihdr = createPngChunk('IHDR', buildIHDR(width, height));
  parts.push(ihdr);

  const actl = createPngChunk('acTL', buildAcTL(numFrames, numPlays));
  parts.push(actl);

  for (let i = 0; i < numFrames; i++) {
    const delayNum = delays[i];
    const delayDen = 100;

    const fctl = createPngChunk('fcTL', buildFcTL(i, width, height, 0, 0, delayNum, delayDen, 0, 0));
    parts.push(fctl);

    const pngData = await dataUrlToBytes(frameDataUrls[i]);
    const idatChunks = extractIdatChunks(pngData);

    if (i === 0) {
      for (const chunk of idatChunks) {
        parts.push(chunk);
      }
    } else {
      for (const chunk of idatChunks) {
        const fdAT = createPngChunk('fdAT', buildFdAT(i, chunk));
        parts.push(fdAT);
      }
    }
  }

  const iend = createPngChunk('IEND', new Uint8Array(0));
  parts.push(iend);

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }

  return new Blob([result], { type: 'image/apng' });
}

function buildIHDR(w, h) {
  const buf = new ArrayBuffer(13);
  const dv = new DataView(buf);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  dv.setUint8(8, 8);
  dv.setUint8(9, 6);
  dv.setUint8(10, 0);
  dv.setUint8(11, 0);
  dv.setUint8(12, 0);
  return new Uint8Array(buf);
}

function buildAcTL(numFrames, numPlays) {
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint32(0, numFrames);
  dv.setUint32(4, numPlays);
  return new Uint8Array(buf);
}

function buildFcTL(seq, w, h, x, y, delayNum, delayDen, disposeOp, blendOp) {
  const buf = new ArrayBuffer(26);
  const dv = new DataView(buf);
  dv.setUint32(0, seq);
  dv.setUint32(4, w);
  dv.setUint32(8, h);
  dv.setUint32(12, x);
  dv.setUint32(16, y);
  dv.setUint16(20, delayNum);
  dv.setUint16(22, delayDen);
  dv.setUint8(24, disposeOp);
  dv.setUint8(25, blendOp);
  return new Uint8Array(buf);
}

function buildFdAT(seq, idatChunk) {
  const rawIdatData = idatChunk.slice(8, idatChunk.length - 4);
  const seqBuf = new ArrayBuffer(4);
  new DataView(seqBuf).setUint32(0, seq);
  const combined = new Uint8Array(4 + rawIdatData.length);
  combined.set(new Uint8Array(seqBuf), 0);
  combined.set(rawIdatData, 4);
  return combined;
}

function createPngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const length = data.length;
  const chunk = new Uint8Array(12 + length);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  const crc = crc32(chunk.slice(4, 8 + length));
  dv.setUint32(8 + length, crc);
  return chunk;
}

function extractIdatChunks(pngBytes) {
  const chunks = [];
  let pos = 8;
  while (pos < pngBytes.length - 8) {
    const dv = new DataView(pngBytes.buffer, pngBytes.byteOffset + pos, 8);
    const len = dv.getUint32(0);
    const type = new TextDecoder().decode(pngBytes.slice(pos + 4, pos + 8));
    const total = 12 + len;
    if (type === 'IDAT') {
      chunks.push(pngBytes.slice(pos, pos + total));
    }
    if (type === 'IEND') break;
    pos += total;
  }
  return chunks;
}

async function dataUrlToBytes(dataUrl) {
  const resp = await fetch(dataUrl);
  const buf = await resp.arrayBuffer();
  return new Uint8Array(buf);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = getCrc32Table();
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let crcTable = null;
function getCrc32Table() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  return crcTable;
}

/**
 * 检查浏览器是否支持动图 WebP 解码
 * @returns {Promise<boolean>}
 */
export async function supportsAnimatedWebP() {
  try {
    const tinyWebP = 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAD8D+JaQAA3AA/u0AAA==';
    const blob = await fetch(`data:image/webp;base64,${tinyWebP}`).then(r => r.blob());
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject();
      i.src = URL.createObjectURL(blob);
    });
    URL.revokeObjectURL(img.src);
    return true;
  } catch {
    return false;
  }
}
