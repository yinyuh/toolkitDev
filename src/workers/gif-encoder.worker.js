/**
 * GIF 编码 Web Worker
 * 在独立线程中执行 GIF 编码/解码，避免阻塞主线程
 */

import { GifWriter, GifReader } from 'omggif';

/**
 * @typedef {Object} FrameData
 * @property {Uint8ClampedArray} pixels - RGBA 像素数组
 * @property {number} width - 帧宽度
 * @property {number} height - 帧高度
 * @property {number} delay - 帧延迟 (1/100 秒)
 */

/**
 * @typedef {Object} EncodeOptions
 * @property {number} [loop=0] - 循环次数，0=无限
 * @property {number} [paletteSize=256] - 颜色表大小
 */

/**
 * 处理主线程消息
 */
self.onmessage = function (e) {
  const { id, type, payload } = e.data;

  try {
    switch (type) {
      case 'encode': {
        const gifData = handleEncode(payload.frames, payload.options);
        self.postMessage({ id, type: 'result', data: gifData }, [gifData]);
        break;
      }
      case 'decode': {
        const frames = handleDecode(payload.gifBuffer);
        self.postMessage({ id, type: 'result', data: frames });
        break;
      }
      case 'getInfo': {
        const info = handleGetInfo(payload.gifBuffer);
        self.postMessage({ id, type: 'result', data: info });
        break;
      }
      default:
        self.postMessage({ id, type: 'error', error: `Unknown message type: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', error: err.message || 'Worker processing error' });
  }
};

/**
 * 编码帧列表为 GIF
 * @param {FrameData[]} frames
 * @param {EncodeOptions} options
 * @returns {ArrayBuffer}
 */
function handleEncode(frames, options = {}) {
  const { loop = 0, paletteSize = 256 } = options;

  if (!frames || frames.length === 0) {
    throw new Error('没有可编码的帧数据');
  }

  const width = frames[0].width;
  const height = frames[0].height;

  const buf = new Uint8Array(estimateGifSize(frames));
  const writer = new GifWriter(buf, width, height, { loop });

  const transparent = paletteSize < 256 ? 0 : null;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const { palette, indices } = quantizeFrame(frame.pixels, frame.width, frame.height, paletteSize);

    const delay = Math.max(1, Math.round(frame.delay || 10));

    let disposal = 2;
    if (i === 0) disposal = 1;

    writer.addFrame(0, 0, frame.width, frame.height, indices, {
      palette: new Uint32Array(palette.map(c => (c[0] << 16) | (c[1] << 8) | c[2])),
      delay,
      disposal,
      transparent
    });

    const progress = Math.round(((i + 1) / frames.length) * 90);
    self.postMessage({ id: -1, type: 'progress', progress });
  }

  const end = writer.end();
  self.postMessage({ id: -1, type: 'progress', progress: 100 });
  return buf.buffer.slice(0, end);
}

/**
 * 解码 GIF 为帧列表
 * @param {ArrayBuffer} gifBuffer
 * @returns {Object} { frames: FrameData[], width, height, loop }
 */
function handleDecode(gifBuffer) {
  const data = new Uint8Array(gifBuffer);
  const reader = new GifReader(data);
  const numFrames = reader.numFrames();
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    const framePixels = new Uint8ClampedArray(reader.width * reader.height * 4);
    reader.decodeAndBlitFrameRGBA(i, framePixels);

    const frameInfo = reader.frameInfo(i);
    frames.push({
      pixels: framePixels,
      width: reader.width,
      height: reader.height,
      delay: (frameInfo.delay || 10)
    });

    if (i % 5 === 0) {
      const progress = Math.round(((i + 1) / numFrames) * 100);
      self.postMessage({ id: -1, type: 'progress', progress });
    }
  }

  return { frames, width: reader.width, height: reader.height };
}

/**
 * 获取 GIF 基本信息
 * @param {ArrayBuffer} gifBuffer
 */
function handleGetInfo(gifBuffer) {
  const reader = new GifReader(new Uint8Array(gifBuffer));
  const numFrames = reader.numFrames();
  let totalDelay = 0;
  const frameDims = [];

  for (let i = 0; i < numFrames; i++) {
    const info = reader.frameInfo(i);
    totalDelay += info.delay || 10;
    frameDims.push({ w: info.width, h: info.height, x: info.x, y: info.y });
  }

  return {
    width: reader.width,
    height: reader.height,
    numFrames,
    duration: totalDelay / 100,
    frameDims
  };
}

/**
 * 颜色量化
 * @param {Uint8ClampedArray} pixels
 * @param {number} w
 * @param {number} h
 * @param {number} maxColors
 */
function quantizeFrame(pixels, w, h, maxColors) {
  const colorCount = new Map();
  const colors = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (a < 128) {
        const key = 'transparent';
        colorCount.set(key, (colorCount.get(key) || 0) + 1);
        continue;
      }

      const qr = Math.round(r / 51) * 51;
      const qg = Math.round(g / 51) * 51;
      const qb = Math.round(b / 51) * 51;
      const key = `${qr},${qg},${qb}`;
      colorCount.set(key, (colorCount.get(key) || 0) + 1);

      const origKey = `${r},${g},${b}`;
      if (!colors.find(c => c.key === origKey)) {
        colors.push({ r, g, b, key: origKey });
      }
    }
  }

  let palette;
  if (colors.length <= maxColors) {
    palette = colors.slice(0, maxColors).map(c => [c.r, c.g, c.b]);
  } else {
    const sorted = colors.sort((a, b) => {
      const ac = colorCount.get(`${Math.round(a.r / 51) * 51},${Math.round(a.g / 51) * 51},${Math.round(a.b / 51) * 51}`) || 0;
      const bc = colorCount.get(`${Math.round(b.r / 51) * 51},${Math.round(b.g / 51) * 51},${Math.round(b.b / 51) * 51}`) || 0;
      return bc - ac;
    });
    palette = sorted.slice(0, maxColors).map(c => [c.r, c.g, c.b]);
  }

  while (palette.length < Math.min(maxColors, 256)) {
    palette.push([0, 0, 0]);
  }

  const indices = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = pixels[idx + 3];
      if (a < 128) {
        indices[y * w + x] = 0;
        continue;
      }
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      let minDist = Infinity;
      let bestI = 0;
      for (let i = 0; i < palette.length; i++) {
        const [pr, pg, pb] = palette[i];
        const dr = r - pr, dg = g - pg, db = b - pb;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < minDist) {
          minDist = dist;
          bestI = i;
        }
      }
      indices[y * w + x] = bestI;
    }
  }

  return { palette, indices };
}

function estimateGifSize(frames) {
  let size = 1024;
  for (const f of frames) {
    size += f.width * f.height * 1.5 + 512;
  }
  return size;
}

export {};
