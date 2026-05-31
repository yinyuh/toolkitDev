/**
 * PDF 生成工具函数
 * @module pdfGenerator
 * 使用 jsPDF 库在浏览器端生成 PDF 文件
 */

import { jsPDF } from 'jspdf';
import { loadImageFromFile, drawImageToCanvas, canvasToBlob } from './imageProcessor.js';

/** @constant {Object<string, [number, number]>} 预设页面尺寸 (宽x高 mm) */
export const PAGE_SIZES = {
  'A4': [210, 297],
  'A3': [297, 420],
  'Letter': [215.9, 279.4],
  'Legal': [215.9, 355.6],
  'fit': null
};

/**
 * 将图片文件列表合并为单个 PDF
 * @param {File[]} files - 待合并的图片文件数组（按用户排序后的顺序）
 * @param {Object} options - 合并选项
 * @param {string} [options.pageSize='fit'] - 页面尺寸 key 或 'fit'(适配原图比例)
 * @param {number[]} [options.customSize] - 自定义 [width, height] (mm)
 * @param {string} [options.align='center'] - 对齐方式 'center' | 'left' | 'fill'
 * @param {number} [options.margin=10] - 页边距 (mm)
 * @param {Function} [options.onProgress] - 进度回调 (current, total) => void
 * @returns {Promise<Blob>} PDF Blob
 */
export async function generateMergePdf(files, options = {}) {
  const {
    pageSize = 'fit',
    customSize,
    align = 'center',
    margin = 10,
    onProgress = null
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageSize === 'fit' ? 'a4' : pageSize
  });

  const total = files.length;
  const mmPerPoint = 25.4 / 72;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const img = await loadImageFromFile(file);
    const dataUrl = await fileToDataUrlSafe(file);

    const imgW_mm = img.width * mmPerPoint;
    const imgH_mm = img.height * mmPerPoint;

    let pageW, pageH;

    if (pageSize === 'fit' && customSize) {
      [pageW, pageH] = customSize;
    } else if (pageSize === 'fit') {
      pageW = imgW_mm + margin * 2;
      pageH = imgH_mm + margin * 2;
    } else {
      const size = PAGE_SIZES[pageSize];
      if (!size && !customSize) {
        pageW = imgW_mm + margin * 2;
        pageH = imgH_mm + margin * 2;
      } else {
        [pageW, pageH] = customSize || size;
      }
    }

    if (i > 0) {
      doc.addPage([pageW, pageH]);
    } else {
      doc.deletePage(1);
      doc.addPage([pageW, pageH], align === 'fill' ? 'landscape' : 'portrait');
    }

    const drawW = pageW - margin * 2;
    const drawH = pageH - margin * 2;
    let drawX = margin;
    let drawY = margin;
    let finalW = drawW;
    let finalH = drawH;

    if (align !== 'fill') {
      const imgRatio = imgW_mm / imgH_mm;
      const areaRatio = drawW / drawH;

      if (imgRatio > areaRatio) {
        finalW = drawW;
        finalH = drawW / imgRatio;
      } else {
        finalH = drawH;
        finalW = drawH * imgRatio;
      }

      if (align === 'center') {
        drawX = margin + (drawW - finalW) / 2;
        drawY = margin + (drawH - finalH) / 2;
      }
    }

    doc.addImage(dataUrl, 'JPEG', drawX, drawY, finalW, finalH);

    if (onProgress) {
      onProgress(i + 1, total);
    }

    await sleep(0);
  }

  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * 将每张图片独立生成为 PDF 并打包为 ZIP
 * @param {File[]} files - 图片文件列表
 * @param {Object} options
 * @param {string} [options.prefix='converted'] - ZIP 文件名前缀
 * @param {Function} [options.onProgress]
 * @returns {Promise<Blob>} ZIP Blob
 */
export async function generateSplitPdfZip(files, options = {}) {
  const { prefix = 'converted', onProgress = null } = options;

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const img = await loadImageFromFile(file);
    const dataUrl = await fileToDataUrlSafe(file);
    const mmPerPoint = 25.4 / 72;

    const pageW = img.width * mmPerPoint;
    const pageH = img.height * mmPerPoint;

    const doc = new jsPDF({
      orientation: pageW > pageH ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pageW, pageH]
    });
    doc.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH);
    const pdfData = doc.output('arraybuffer');

    const baseName = file.name.replace(/\.[^.]+$/, '');
    zip.file(`${baseName}.pdf`, pdfData, { binary: true });

    if (onProgress) {
      onProgress(i + 1, total);
    }
    await sleep(0);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { blob: zipBlob, name: `${prefix}_${timestamp}.zip` };
}

/**
 * 获取图片PDF的预期页数 / 大小信息
 * @param {File[]} files
 * @returns {{ count: number, totalSize: string }}
 */
export function getPdfPreviewInfo(files) {
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  return {
    count: files.length,
    totalSize: totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(totalBytes / 1024).toFixed(0)} KB`
  };
}

/** @param {File} file @returns {Promise<string>} */
async function fileToDataUrlSafe(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(/** @type {string} */ (reader.result));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
