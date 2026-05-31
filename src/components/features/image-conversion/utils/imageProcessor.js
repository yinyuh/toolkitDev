/**
 * 图片处理通用工具函数
 * @module imageProcessor
 */

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/bmp', 'image/svg+xml', 'image/x-icon',
  'image/heic', 'image/heif',
  'image/apng', 'image/avif',
  'video/quicktime', 'video/mp4'
];

/**
 * 格式化文件大小为可读字符串
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小字符串
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 从File对象加载HTMLImageElement
 * @param {File} file - 图片文件
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`无法加载图片 "${file.name}"，文件可能已损坏或格式不受支持`));
    };
    img.src = url;
  });
}

/**
 * 将图片绘制到Canvas并返回Canvas和Context
 * @param {HTMLImageElement} img - 图片元素
 * @param {Object} options - 选项
 * @param {number} [options.maxWidth] - 最大宽度
 * @param {number} [options.maxHeight] - 最大高度
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number }}
 */
export function drawImageToCanvas(img, options = {}) {
  let { maxWidth, maxHeight } = options;
  let w = img.width;
  let h = img.height;

  if (maxWidth || maxHeight) {
    const scaleX = maxWidth ? maxWidth / w : 1;
    const scaleY = maxHeight ? maxHeight / h : 1;
    const scale = Math.min(scaleX, scaleY);
    if (scale < 1) {
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, width: w, height: h };
}

/**
 * 校验图片文件
 * @param {File} file - 待校验文件
 * @param {number} [maxSize=20*1024*1024] - 单文件最大字节数
 * @param {number} [totalSize=200*1024*1024] - 批量总大小上限
 * @returns {{ valid: boolean, error?: string, warning?: string }}
 */
export function validateImageFile(file, maxSize = 20 * 1024 * 1024) {
  if (file.size === 0) {
    return { valid: false, error: `文件 "${file.name}" 大小为 0，无法处理空文件` };
  }
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件 "${file.name}" 超过 ${formatSize(maxSize)} 限制（当前 ${formatSize(file.size)}），请压缩后再上传`
    };
  }
  const normalizedType = file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const typeAllowed = ACCEPTED_IMAGE_TYPES.includes(normalizedType) ||
    ['heic', 'heif', 'ico', 'mov', 'mp4'].includes(ext);
  if (!typeAllowed) {
    return {
      valid: false,
      error: `文件 "${file.name}" 不是支持的图片格式，请上传 JPG/PNG/WebP/GIF/BMP/SVG/HEIC 等格式`
    };
  }
  if (normalizedType === 'image/svg+xml') {
    return {
      valid: true,
      warning: `SVG 文件 "${file.name}" 将转为栅格格式处理，矢量特性将丢失`
    };
  }
  return { valid: true };
}

/**
 * 图片文件转 DataURL
 * @param {File} file - 图片文件
 * @returns {Promise<string>} DataURL 字符串
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(/** @type {string} */ (reader.result));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 创建文件预览 URL
 * @param {File} file
 * @returns {string} Object URL
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

/**
 * 释放预览 URL
 * @param {string} url
 */
export function revokePreviewUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Canvas 转为 Blob
 * @param {HTMLCanvasElement} canvas
 * @param {string} [type='image/png']
 * @param {number} [quality=0.92]
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas 导出失败'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}
