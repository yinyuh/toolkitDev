/**
 * WebP/APNG → GIF 转换 Worker
 * 使用 image-in-browser 的纯 JS VP8/VP8L 解码器逐帧提取，
 * 再通过内置 GIF 编码器生成动图。完全脱离浏览器 Canvas API。
 */
import { decodeWebP, decodePng, encodeGif } from 'image-in-browser';

self.onmessage = async (e) => {
  const { id, payload } = e.data;
  try {
    self.postMessage({ id, type: 'progress', progress: 5, text: '正在解析图片格式...' });

    const data = new Uint8Array(payload.buffer);
    let image;

    if (payload.mimeType === 'image/webp') {
      image = decodeWebP({ data });
    } else if (
      payload.mimeType === 'image/apng' ||
      payload.mimeType === 'image/png'
    ) {
      image = decodePng({ data });
    } else {
      throw new Error(`不支持的格式: ${payload.mimeType}`);
    }

    if (!image || !image.hasAnimation) {
      throw new Error('该图片不是动图格式，请使用静态图转 GIF 功能');
    }

    const frameCount = image.numFrames;
    self.postMessage({
      id,
      type: 'progress',
      progress: 40,
      text: `解码完成，共 ${frameCount} 帧，正在编码 GIF...`,
    });

    // 帧率控制：抽帧
    if (payload.fps && payload.fps < 60 && image.frames.length > 1) {
      const targetInterval = Math.round(1000 / payload.fps);
      const validFrames = [];
      let accumulatedTime = 0;
      let lastFrame = null;

      for (let i = 0; i < image.frames.length; i++) {
        const frame = image.frames[i];
        const duration = frame.frameDuration || 100;
        accumulatedTime += duration;

        if (i === 0 || accumulatedTime >= targetInterval) {
          if (lastFrame) {
            lastFrame.frameDuration = accumulatedTime;
          }
          validFrames.push(frame);
          lastFrame = frame;
          accumulatedTime = 0;
        }
      }

      // replace frames (image-in-browser's frames array is mutable)
      validFrames.forEach((f, idx) => {
        image.frames[idx] = f;
      });
      image.frames.length = validFrames.length;

      self.postMessage({
        id,
        type: 'progress',
        progress: 50,
        text: `抽帧后保留 ${validFrames.length} 帧，正在编码 GIF...`,
      });
    }

    const samplingFactor = payload.colors
      ? Math.max(1, Math.round(payload.colors / 25.6))
      : 10;

    const gifBytes = encodeGif({
      image,
      singleFrame: false,
      repeat: 0,
      samplingFactor,
    });

    self.postMessage({ id, type: 'progress', progress: 95, text: 'GIF 编码完成' });
    self.postMessage({ id, type: 'result', data: gifBytes }, [gifBytes.buffer]);
  } catch (err) {
    self.postMessage({
      id,
      type: 'error',
      error: err.message || 'WebP → GIF 转换失败',
    });
  }
};
