// 全局变量
let pdfDoc = null;
let totalPages = 0;
let currentPage = 1;
let zoom = 1;
let conversionMode = 'single'; // 'single', 'merge', 'range'
let rangeExportMode = 'single'; // 'single', 'merge'
let images = [];

// DOM 元素
let fileInput, browseBtn, uploadArea, pdfPreviewSection, conversionSection, progressSection, imagePreviewSection;
let pdfPreview, thumbnailsList, currentPageEl, totalPagesEl, prevPageBtn, nextPageBtn, zoomOutBtn, zoomInBtn, resetZoomBtn;
let tabSinglePage, tabMerge, tabRange, contentSinglePage, contentMerge, contentRange;
let imageFormat, jpegQuality, jpegQualityValue, jpegOptions, mergeImageFormat, mergeJpegQuality, mergeJpegQualityValue, mergeJpegOptions, mergeGap;
let startPage, endPage, pageRangeError, rangeExportModeEl, rangeImageFormat, rangeJpegQuality, rangeJpegQualityValue, rangeJpegOptions, rangeGapOption;
let convertBtn, clearBtn, progressFill, progressText, progressDetail, imagePreviewArea, downloadAllBtn, backToPDFBtn;

// 初始化事件监听器
function initEventListeners() {
  // 初始化DOM元素
  fileInput = document.getElementById('fileInput');
  browseBtn = document.getElementById('browseBtn');
  uploadArea = document.querySelector('.upload-area');
  pdfPreviewSection = document.getElementById('pdfPreviewSection');
  conversionSection = document.getElementById('conversionSection');
  progressSection = document.getElementById('progressSection');
  imagePreviewSection = document.getElementById('imagePreviewSection');
  pdfPreview = document.getElementById('pdfPreview');
  thumbnailsList = document.getElementById('thumbnailsList');
  currentPageEl = document.getElementById('currentPage');
  totalPagesEl = document.getElementById('totalPages');
  prevPageBtn = document.getElementById('prevPage');
  nextPageBtn = document.getElementById('nextPage');
  zoomOutBtn = document.getElementById('zoomOut');
  zoomInBtn = document.getElementById('zoomIn');
  resetZoomBtn = document.getElementById('resetZoom');
  tabSinglePage = document.getElementById('tabSinglePage');
  tabMerge = document.getElementById('tabMerge');
  tabRange = document.getElementById('tabRange');
  contentSinglePage = document.getElementById('contentSinglePage');
  contentMerge = document.getElementById('contentMerge');
  contentRange = document.getElementById('contentRange');
  imageFormat = document.getElementById('imageFormat');
  jpegQuality = document.getElementById('jpegQuality');
  jpegQualityValue = document.getElementById('jpegQualityValue');
  jpegOptions = document.getElementById('jpegOptions');
  mergeImageFormat = document.getElementById('mergeImageFormat');
  mergeJpegQuality = document.getElementById('mergeJpegQuality');
  mergeJpegQualityValue = document.getElementById('mergeJpegQualityValue');
  mergeJpegOptions = document.getElementById('mergeJpegOptions');
  mergeGap = document.getElementById('mergeGap');
  startPage = document.getElementById('startPage');
  endPage = document.getElementById('endPage');
  pageRangeError = document.getElementById('pageRangeError');
  rangeExportModeEl = document.getElementById('rangeExportMode');
  rangeImageFormat = document.getElementById('rangeImageFormat');
  rangeJpegQuality = document.getElementById('rangeJpegQuality');
  rangeJpegQualityValue = document.getElementById('rangeJpegQualityValue');
  rangeJpegOptions = document.getElementById('rangeJpegOptions');
  rangeGapOption = document.getElementById('rangeGapOption');
  convertBtn = document.getElementById('convertBtn');
  clearBtn = document.getElementById('clearBtn');
  progressFill = document.getElementById('progressFill');
  progressText = document.getElementById('progressText');
  progressDetail = document.getElementById('progressDetail');
  imagePreviewArea = document.getElementById('imagePreviewArea');
  downloadAllBtn = document.getElementById('downloadAllBtn');
  backToPDFBtn = document.getElementById('backToPDFBtn');

  // 文件选择
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  
  // 拖放上传
  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-blue-500');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-blue-500');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-blue-500');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
  });

  // 标签切换
  tabSinglePage.addEventListener('click', () => switchTab('single'));
  tabMerge.addEventListener('click', () => switchTab('merge'));
  tabRange.addEventListener('click', () => switchTab('range'));

  // 图片格式切换
  imageFormat.addEventListener('change', updateJpegOptions);
  mergeImageFormat.addEventListener('change', updateMergeJpegOptions);
  rangeImageFormat.addEventListener('change', updateRangeJpegOptions);

  // JPG质量滑块
  jpegQuality.addEventListener('input', (e) => {
    jpegQualityValue.textContent = `${e.target.value}%`;
  });
  mergeJpegQuality.addEventListener('input', (e) => {
    mergeJpegQualityValue.textContent = `${e.target.value}%`;
  });
  rangeJpegQuality.addEventListener('input', (e) => {
    rangeJpegQualityValue.textContent = `${e.target.value}%`;
  });

  // 范围导出模式切换
  rangeExportModeEl.addEventListener('change', (e) => {
    rangeExportMode = e.target.value;
    rangeGapOption.style.display = rangeExportMode === 'merge' ? 'flex' : 'none';
  });

  // 页码范围输入
  startPage.addEventListener('input', validatePageRange);
  endPage.addEventListener('input', validatePageRange);

  // PDF预览控制
  prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
  nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
  zoomOutBtn.addEventListener('click', () => changeZoom(zoom - 0.2));
  zoomInBtn.addEventListener('click', () => changeZoom(zoom + 0.2));
  resetZoomBtn.addEventListener('click', () => changeZoom(1));

  // 转换按钮
  convertBtn.addEventListener('click', startConversion);
  clearBtn.addEventListener('click', clearFile);

  // 图片预览控制
  backToPDFBtn.addEventListener('click', backToPDF);
  downloadAllBtn.addEventListener('click', downloadAllImages);
  document.getElementById('reselectConversionBtn').addEventListener('click', backToPDF);
  
  // 更新下载按钮文本
  downloadAllBtn.textContent = '下载图片';
  downloadAllBtn.innerHTML = '<svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> 下载图片';
}

// 处理文件选择
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    if (!file.type.includes('pdf')) {
      alert('请选择PDF格式文件');
      return;
    }
    if (file.size > 2048 * 1024 * 1024) {
      alert('当前文件过大（最大支持2048MB），请压缩后重新上传');
      return;
    }
    loadPDF(file);
  }
}

// 加载PDF
function loadPDF(file) {
  // 显示加载状态
  pdfPreview.innerHTML = '<div class="empty-preview text-center py-12 text-theme-secondary">正在加载PDF文件...</div>';
  
  // 隐藏其他部分
  pdfPreviewSection.classList.remove('hidden');
  conversionSection.classList.add('hidden');
  progressSection.classList.add('hidden');
  imagePreviewSection.classList.add('hidden');

  // 检查是否支持PDF.js
  if (typeof pdfjsLib === 'undefined') {
    alert('当前浏览器不支持PDF解析，请更换Chrome、Edge、Firefox或Safari最新版本浏览器');
    return;
  }

  // 配置PDF.js工作器
  if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // 加载PDF
  const fileReader = new FileReader();
  fileReader.onload = function() {
    const typedarray = new Uint8Array(this.result);
    pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
      pdfDoc = pdf;
      totalPages = pdf.numPages;
      totalPagesEl.textContent = totalPages;
      endPage.value = totalPages;
      
      // 渲染第一页
      renderPage(1);
      
      // 生成缩略图
      generateThumbnails();
      
      // 显示转换选项
      conversionSection.classList.remove('hidden');
    }).catch(function(error) {
      alert('PDF解析失败，请检查文件完整性后重新上传');
      console.error('PDF loading error:', error);
    });
  };
  fileReader.readAsArrayBuffer(file);
}

// 渲染PDF页面
function renderPage(pageNum) {
  if (pageNum < 1 || pageNum > totalPages) return;
  
  currentPage = pageNum;
  currentPageEl.textContent = currentPage;
  
  pdfDoc.getPage(pageNum).then(function(page) {
    // 获取预览容器的最大可用宽度
    const previewArea = document.querySelector('.preview-area');
    const maxWidth = previewArea.clientWidth - 32; // 减去内边距
    
    // 计算初始视口
    let viewport = page.getViewport({ scale: zoom });
    
    // 检查宽度是否超过最大限制
    if (viewport.width > maxWidth) {
      // 调整缩放比例以适应最大宽度
      const adjustedZoom = (maxWidth / viewport.width) * zoom;
      viewport = page.getViewport({ scale: adjustedZoom });
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    const renderTask = page.render(renderContext);
    renderTask.promise.then(function() {
      pdfPreview.innerHTML = '';
      pdfPreview.appendChild(canvas);
    });
  });
}

// 生成缩略图
function generateThumbnails() {
  thumbnailsList.innerHTML = '';
  
  for (let i = 1; i <= totalPages; i++) {
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item cursor-pointer p-2 rounded hover:bg-theme-primary transition-colors';
    thumbnailItem.dataset.page = i;
    
    const canvas = document.createElement('canvas');
    canvas.className = 'thumbnail-canvas border border-theme-secondary rounded';
    canvas.width = 100;
    
    thumbnailsList.appendChild(thumbnailItem);
    
    pdfDoc.getPage(i).then(function(page) {
      const viewport = page.getViewport({ scale: 0.2 });
      canvas.height = viewport.height * (100 / viewport.width);
      
      const ctx = canvas.getContext('2d');
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      renderTask.promise.then(function() {
        thumbnailItem.appendChild(canvas);
        thumbnailItem.addEventListener('click', () => renderPage(i));
      });
    });
  }
}

// 切换页面
function goToPage(pageNum) {
  if (pageNum >= 1 && pageNum <= totalPages) {
    renderPage(pageNum);
  }
}

// 改变缩放
function changeZoom(newZoom) {
  if (newZoom >= 0.5 && newZoom <= 2) {
    zoom = newZoom;
    renderPage(currentPage);
  }
}

// 切换标签
function switchTab(tab) {
  // 重置标签样式
  tabSinglePage.className = 'tab-btn flex-1 py-3 px-4 font-medium text-theme-secondary hover:text-theme-primary';
  tabMerge.className = 'tab-btn flex-1 py-3 px-4 font-medium text-theme-secondary hover:text-theme-primary';
  tabRange.className = 'tab-btn flex-1 py-3 px-4 font-medium text-theme-secondary hover:text-theme-primary';
  
  // 隐藏所有内容
  contentSinglePage.classList.add('hidden');
  contentMerge.classList.add('hidden');
  contentRange.classList.add('hidden');
  
  // 显示选中的标签和内容
  switch(tab) {
    case 'single':
      tabSinglePage.className = 'tab-btn flex-1 py-3 px-4 font-medium text-theme-primary border-b-2 border-accent';
      contentSinglePage.classList.remove('hidden');
      conversionMode = 'single';
      break;
    case 'merge':
      tabMerge.className = 'tab-btn flex-1 py-3 px-4 font-medium text-theme-primary border-b-2 border-accent';
      contentMerge.classList.remove('hidden');
      conversionMode = 'merge';
      break;
    case 'range':
      tabRange.className = 'tab-btn flex-1 py-3 px-4 font-medium text-theme-primary border-b-2 border-accent';
      contentRange.classList.remove('hidden');
      conversionMode = 'range';
      validatePageRange();
      break;
  }
}

// 更新JPG选项
function updateJpegOptions() {
  jpegOptions.style.display = imageFormat.value === 'jpeg' ? 'flex' : 'none';
}

function updateMergeJpegOptions() {
  mergeJpegOptions.style.display = mergeImageFormat.value === 'jpeg' ? 'flex' : 'none';
}

function updateRangeJpegOptions() {
  rangeJpegOptions.style.display = rangeImageFormat.value === 'jpeg' ? 'flex' : 'none';
}

// 验证页码范围
function validatePageRange() {
  const start = parseInt(startPage.value);
  const end = parseInt(endPage.value);
  
  if (start < 1 || end > totalPages || start > end) {
    pageRangeError.classList.remove('hidden');
    return false;
  } else {
    pageRangeError.classList.add('hidden');
    return true;
  }
}

// 开始转换
function startConversion() {
  // 验证参数
  if (conversionMode === 'range' && !validatePageRange()) {
    return;
  }
  
  // 显示进度条
  progressSection.classList.remove('hidden');
  conversionSection.classList.add('hidden');
  imagePreviewSection.classList.add('hidden');
  
  // 重置进度
  progressFill.style.width = '0%';
  progressText.textContent = '准备开始转换...';
  progressDetail.textContent = '';
  
  // 清空图片数组
  images = [];
  
  // 根据转换模式执行
  switch(conversionMode) {
    case 'single':
      convertSinglePages();
      break;
    case 'merge':
      convertMerge();
      break;
    case 'range':
      convertRange();
      break;
  }
}

// 转换单页
function convertSinglePages() {
  const format = imageFormat.value;
  const quality = parseFloat(jpegQuality.value) / 100;
  let processedPages = 0;
  
  for (let i = 1; i <= totalPages; i++) {
    pdfDoc.getPage(i).then(function(page) {
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      page.render(renderContext).promise.then(function() {
        if (format === 'jpeg') {
          canvas.toBlob(function(blob) {
            if (blob) {
              const url = URL.createObjectURL(blob);
              images.push({ url, page: i, format });
              
              processedPages++;
              const progress = Math.round((processedPages / totalPages) * 100);
              progressFill.style.width = `${progress}%`;
              progressText.textContent = `转换中 (${progress}%)`;
              progressDetail.textContent = `正在转换第 ${processedPages} 页/共 ${totalPages} 页`;
              
              if (processedPages === totalPages) {
                showImagePreview();
              }
            } else {
              console.error('Failed to create blob for JPEG');
              showError('转换失败，请尝试重新选择转换选项');
              backToPDF();
            }
          }, 'image/jpeg', quality);
        } else {
          canvas.toBlob(function(blob) {
            if (blob) {
              const url = URL.createObjectURL(blob);
              images.push({ url, page: i, format });
              
              processedPages++;
              const progress = Math.round((processedPages / totalPages) * 100);
              progressFill.style.width = `${progress}%`;
              progressText.textContent = `转换中 (${progress}%)`;
              progressDetail.textContent = `正在转换第 ${processedPages} 页/共 ${totalPages} 页`;
              
              if (processedPages === totalPages) {
                showImagePreview();
              }
            } else {
              console.error('Failed to create blob for PNG');
              showError('转换失败，请尝试重新选择转换选项');
              backToPDF();
            }
          }, 'image/png');
        }
      });
    });
  }
}

// 转换合并
function convertMerge() {
  const format = mergeImageFormat.value;
  const quality = parseFloat(mergeJpegQuality.value) / 100;
  const gap = parseInt(mergeGap.value);
  let pages = [];
  let processedPages = 0;
  
  // 先渲染所有页面
  for (let i = 1; i <= totalPages; i++) {
    pdfDoc.getPage(i).then(function(page) {
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      page.render(renderContext).promise.then(function() {
        pages.push({ canvas, width: viewport.width, height: viewport.height });
        
        processedPages++;
        const progress = Math.round((processedPages / totalPages) * 100);
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `转换中 (${progress}%)`;
        progressDetail.textContent = `正在处理第 ${processedPages} 页/共 ${totalPages} 页`;
        
        if (processedPages === totalPages) {
          // 合并图片
          mergeImages(pages, format, quality, gap);
        }
      });
    });
  }
}

// 合并图片
function mergeImages(pages, format, quality, gap) {
  // 计算总尺寸
  const maxWidth = Math.max(...pages.map(p => p.width));
  const totalHeight = pages.reduce((sum, p) => sum + p.height + gap, 0) - gap;
  
  // 检查画布尺寸是否超过浏览器限制
  const maxCanvasSize = 106384; // 大多数浏览器的画布尺寸限制
  if (maxWidth > maxCanvasSize || totalHeight > maxCanvasSize) {
    console.error('Canvas size exceeds browser limit');
    showError('转换失败，页面数量过多导致画布尺寸超过浏览器限制，请尝试减少页面数量或使用单页导出');
    backToPDF();
    return;
  }
  
  try {
    // 创建合并画布
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    // 填充白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, maxWidth, totalHeight);
    
    // 绘制所有页面
    let y = 0;
    pages.forEach(page => {
      const x = (maxWidth - page.width) / 2;
      ctx.drawImage(page.canvas, x, y);
      y += page.height + gap;
    });
    
    // 转换为图片
    if (format === 'jpeg') {
      canvas.toBlob(function(blob) {
        if (blob) {
          const url = URL.createObjectURL(blob);
          images.push({ url, format });
          
          // 更新进度
          progressFill.style.width = '100%';
          progressText.textContent = '转换完成';
          progressDetail.textContent = '正在生成预览...';
          
          // 显示预览
          setTimeout(showImagePreview, 500);
        } else {
          console.error('Failed to create blob for JPEG');
          showError('转换失败，请尝试重新选择转换选项');
          backToPDF();
        }
      }, 'image/jpeg', quality);
    } else {
      canvas.toBlob(function(blob) {
        if (blob) {
          const url = URL.createObjectURL(blob);
          images.push({ url, format });
          
          // 更新进度
          progressFill.style.width = '100%';
          progressText.textContent = '转换完成';
          progressDetail.textContent = '正在生成预览...';
          
          // 显示预览
          setTimeout(showImagePreview, 500);
        } else {
          console.error('Failed to create blob for PNG');
          showError('转换失败，可能是页面数量过多导致画布尺寸超过浏览器限制，请尝试减少页面数量或使用单页导出');
          backToPDF();
        }
      }, 'image/png');
    }
  } catch (error) {
    console.error('Error in mergeImages:', error);
    showError('转换失败，请尝试重新选择转换选项或减少页面数量');
    backToPDF();
  }
}

// 转换指定范围
function convertRange() {
  const start = parseInt(startPage.value);
  const end = parseInt(endPage.value);
  const format = rangeImageFormat.value;
  const quality = parseFloat(rangeJpegQuality.value) / 100;
  const gap = parseInt(document.getElementById('rangeMergeGap').value);
  let pages = [];
  let processedPages = 0;
  const total = end - start + 1;
  
  if (rangeExportMode === 'single') {
    // 单页拆分
    for (let i = start; i <= end; i++) {
      pdfDoc.getPage(i).then(function(page) {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        page.render(renderContext).promise.then(function() {
          if (format === 'jpeg') {
            canvas.toBlob(function(blob) {
              if (blob) {
                const url = URL.createObjectURL(blob);
                images.push({ url, page: i, format });
                
                processedPages++;
                const progress = Math.round((processedPages / total) * 100);
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `转换中 (${progress}%)`;
                progressDetail.textContent = `正在转换第 ${processedPages} 页/共 ${total} 页`;
                
                if (processedPages === total) {
                  showImagePreview();
                }
              } else {
                console.error('Failed to create blob for JPEG');
                showError('转换失败，请尝试重新选择转换选项');
                backToPDF();
              }
            }, 'image/jpeg', quality);
          } else {
            canvas.toBlob(function(blob) {
              if (blob) {
                const url = URL.createObjectURL(blob);
                images.push({ url, page: i, format });
                
                processedPages++;
                const progress = Math.round((processedPages / total) * 100);
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `转换中 (${progress}%)`;
                progressDetail.textContent = `正在转换第 ${processedPages} 页/共 ${total} 页`;
                
                if (processedPages === total) {
                  showImagePreview();
                }
              } else {
                console.error('Failed to create blob for PNG');
                showError('转换失败，请尝试重新选择转换选项');
                backToPDF();
              }
            }, 'image/png');
          }
        });
      });
    }
  } else {
    // 合并为长图
    for (let i = start; i <= end; i++) {
      pdfDoc.getPage(i).then(function(page) {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        page.render(renderContext).promise.then(function() {
          pages.push({ canvas, width: viewport.width, height: viewport.height });
          
          processedPages++;
          const progress = Math.round((processedPages / total) * 100);
          progressFill.style.width = `${progress}%`;
          progressText.textContent = `转换中 (${progress}%)`;
          progressDetail.textContent = `正在处理第 ${processedPages} 页/共 ${total} 页`;
          
          if (processedPages === total) {
            // 合并图片
            mergeImages(pages, format, quality, gap);
          }
        });
      });
    }
  }
}

// 显示图片预览
function showImagePreview() {
  // 隐藏进度条
  progressSection.classList.add('hidden');
  
  // 显示图片预览
  imagePreviewSection.classList.remove('hidden');
  
  // 生成图片预览
  imagePreviewArea.innerHTML = '';
  
  if (images.length === 1 && (conversionMode === 'merge' || (conversionMode === 'range' && rangeExportMode === 'merge'))) {
    // 显示合并后的长图
    const img = document.createElement('img');
    img.src = images[0].url;
    img.className = 'max-w-full h-auto rounded-lg';
    img.alt = '合并后的图片';
    imagePreviewArea.appendChild(img);
    
    // 添加下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-theme px-6 py-3 rounded transition-colors mt-4 cursor-pointer hover:bg-opacity-90';
    downloadBtn.innerHTML = '<svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> 下载合并图';
    downloadBtn.addEventListener('click', () => downloadImage(images[0], '合并图'));
    imagePreviewArea.appendChild(downloadBtn);
  } else {
    // 显示单页图片
    const imagesGrid = document.createElement('div');
    imagesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    
    images.forEach((img, index) => {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'bg-div-theme rounded-lg p-4 border border-theme-secondary relative';
      
      // 添加删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors';
      deleteBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
      deleteBtn.addEventListener('click', () => {
        // 从数组中删除图片
        images.splice(index, 1);
        // 重新显示预览
        showImagePreview();
      });
      imgContainer.appendChild(deleteBtn);
      
      const imgEl = document.createElement('img');
      imgEl.src = img.url;
      imgEl.className = 'max-w-full h-auto rounded';
      imgEl.alt = `第${img.page}页`;
      
      const imgInfo = document.createElement('div');
      imgInfo.className = 'mt-3 text-center';
      imgInfo.innerHTML = `
        <p class="text-theme-primary font-medium">第${img.page}页</p>
        <div class="flex justify-center gap-2 mt-2">
          <button class="btn-theme px-4 py-2 rounded text-sm transition-colors hover:bg-opacity-90 cursor-pointer">
            <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> 预览
          </button>
          <button class="btn-theme px-4 py-2 rounded text-sm transition-colors hover:bg-opacity-90 cursor-pointer">
            <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> 下载
          </button>
        </div>
      `;
      
      // 添加预览事件
      imgInfo.querySelectorAll('button')[0].addEventListener('click', () => previewImage(img));
      
      // 添加下载事件
      imgInfo.querySelectorAll('button')[1].addEventListener('click', () => downloadImage(img, `第${img.page}页`));
      
      imgContainer.appendChild(imgEl);
      imgContainer.appendChild(imgInfo);
      imagesGrid.appendChild(imgContainer);
    });
    
    imagePreviewArea.appendChild(imagesGrid);
  }
}

// 预览图片
function previewImage(img) {
  // 创建预览模态框
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
  
  // 初始化缩放值
  let scale = 1;
  
  // 创建模态框内容
  const modalContent = document.createElement('div');
  modalContent.className = 'relative max-w-4xl w-full';
  
  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.id = 'closePreviewBtn';
  closeBtn.className = 'absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors cursor-pointer z-10';
  closeBtn.innerHTML = '×';
  modalContent.appendChild(closeBtn);
  
  // 缩放控制
  const zoomControls = document.createElement('div');
  zoomControls.className = 'flex justify-center items-center mb-4';
  
  // 缩小按钮
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.id = 'zoomOutBtn';
  zoomOutBtn.className = 'bg-white/20 text-white px-3 py-1 rounded-l-lg hover:bg-white/30 transition-colors cursor-pointer';
  zoomOutBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>`;
  zoomControls.appendChild(zoomOutBtn);
  
  // 缩放级别显示
  const zoomLevel = document.createElement('div');
  zoomLevel.className = 'bg-white/10 text-white px-4 py-1';
  zoomLevel.textContent = '100%';
  zoomControls.appendChild(zoomLevel);
  
  // 放大按钮
  const zoomInBtn = document.createElement('button');
  zoomInBtn.id = 'zoomInBtn';
  zoomInBtn.className = 'bg-white/20 text-white px-3 py-1 rounded-r-lg hover:bg-white/30 transition-colors cursor-pointer';
  zoomInBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
  </svg>`;
  zoomControls.appendChild(zoomInBtn);
  modalContent.appendChild(zoomControls);
  
  // 图片容器
  const imgContainer = document.createElement('div');
  imgContainer.className = 'flex justify-center items-center min-h-[60vh] overflow-auto';
  
  // 图片包装器
  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'relative';
  
  // 图片元素
  const previewImg = document.createElement('img');
  previewImg.id = 'previewImg';
  previewImg.src = img.url;
  previewImg.className = 'max-w-full max-h-[80vh] object-contain rounded-lg transition-transform duration-300';
  previewImg.alt = '预览图片';
  imgWrapper.appendChild(previewImg);
  imgContainer.appendChild(imgWrapper);
  modalContent.appendChild(imgContainer);
  
  // 页码信息
  const pageInfo = document.createElement('div');
  pageInfo.className = 'mt-4 text-center';
  pageInfo.innerHTML = `<p class="text-white text-lg">第${img.page}页</p>`;
  modalContent.appendChild(pageInfo);
  
  // 将内容添加到模态框
  modal.appendChild(modalContent);
  
  // 添加到页面
  document.body.appendChild(modal);
  
  // 关闭事件
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // 点击模态框背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // 缩放功能 - 缩小
  zoomOutBtn.addEventListener('click', () => {
    if (scale > 0.5) {
      scale -= 0.1;
      updateZoom();
    }
  });
  
  // 缩放功能 - 放大
  zoomInBtn.addEventListener('click', () => {
    if (scale < 3) {
      scale += 0.1;
      updateZoom();
    }
  });
  
  // 鼠标滚轮缩放
  previewImg.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      // 向下滚动，缩小
      if (scale > 0.5) {
        scale -= 0.1;
        updateZoom();
      }
    } else {
      // 向上滚动，放大
      if (scale < 3) {
        scale += 0.1;
        updateZoom();
      }
    }
  });
  
  // 更新缩放
  function updateZoom() {
    previewImg.style.transform = `scale(${scale})`;
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
  }
}

// 下载图片
function downloadImage(img, name) {
  const link = document.createElement('a');
  link.href = img.url;
  link.download = `PDF转图片_${name}.${img.format}`;
  link.click();
}

// 批量下载图片
function downloadAllImages() {
  images.forEach((img, index) => {
    setTimeout(() => {
      downloadImage(img, img.page || `合并图`);
    }, index * 100);
  });
}

// 回到PDF预览
function backToPDF() {
  imagePreviewSection.classList.add('hidden');
  conversionSection.classList.remove('hidden');
}

// 显示错误信息
function showError(message) {
  console.log('showError called with message:', message);
  
  // 隐藏进度条
  if (progressSection) {
    progressSection.classList.add('hidden');
    console.log('Progress section hidden');
  }
  
  // 检查是否已存在错误信息框
  let errorBox = document.getElementById('errorBox');
  if (errorBox) {
    document.body.removeChild(errorBox);
    console.log('Removed existing error box');
  }
  
  // 创建错误信息框
  errorBox = document.createElement('div');
  errorBox.id = 'errorBox';
  errorBox.style.position = 'fixed';
  errorBox.style.top = '0';
  errorBox.style.left = '0';
  errorBox.style.right = '0';
  errorBox.style.bottom = '0';
  errorBox.style.display = 'flex';
  errorBox.style.alignItems = 'center';
  errorBox.style.justifyContent = 'center';
  errorBox.style.zIndex = '9999';
  
  // 创建错误信息内容
  const errorContent = document.createElement('div');
  errorContent.style.backgroundColor = '#ef4444';
  errorContent.style.color = 'white';
  errorContent.style.padding = '16px 32px';
  errorContent.style.borderRadius = '8px';
  errorContent.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  errorContent.style.textAlign = 'center';
  errorContent.style.maxWidth = '400px';
  errorContent.style.position = 'relative';
  
  // 创建关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '8px';
  closeBtn.style.right = '8px';
  closeBtn.style.color = 'white';
  closeBtn.style.fontSize = '1.5rem';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.padding = '0';
  closeBtn.style.lineHeight = '1';
  closeBtn.style.transition = 'color 0.2s ease';
  closeBtn.innerHTML = '×';
  
  // 添加悬停效果
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.color = '#f3f4f6';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.color = 'white';
  });
  
  // 创建消息内容
  const messageEl = document.createElement('div');
  messageEl.style.marginLeft = '16px';
  messageEl.textContent = message;
  
  // 组装错误信息内容
  errorContent.appendChild(closeBtn);
  errorContent.appendChild(messageEl);
  console.log('Error content elements created');
  
  // 将错误信息内容添加到错误信息框
  errorBox.appendChild(errorContent);
  console.log('Error content added to error box');
  
  // 添加到页面
  document.body.appendChild(errorBox);
  console.log('Error box added to body');
  console.log('Error box style:', errorBox.style);
  
  let timeoutId;
  
  // 设置定时器
  function startTimer() {
    timeoutId = setTimeout(() => {
      if (errorBox.parentNode) {
        errorBox.parentNode.removeChild(errorBox);
      }
    }, 3000);
  }
  
  // 开始定时器
  startTimer();
  
  // 关闭按钮点击事件
  closeBtn.addEventListener('click', () => {
    if (errorBox.parentNode) {
      errorBox.parentNode.removeChild(errorBox);
    }
    clearTimeout(timeoutId);
  });
  
  // 鼠标悬停时清除定时器
  errorContent.addEventListener('mouseenter', () => {
    clearTimeout(timeoutId);
  });
  
  // 鼠标离开时重新开始定时器
  errorContent.addEventListener('mouseleave', () => {
    startTimer();
  });
}

// 清除文件
function clearFile() {
  // 清空文件输入
  fileInput.value = '';
  
  // 重置变量
  pdfDoc = null;
  totalPages = 0;
  currentPage = 1;
  zoom = 1;
  images = [];
  
  // 隐藏所有部分
  pdfPreviewSection.classList.add('hidden');
  conversionSection.classList.add('hidden');
  progressSection.classList.add('hidden');
  imagePreviewSection.classList.add('hidden');
}

// 初始化
function init() {
  initEventListeners();
  updateJpegOptions();
  updateMergeJpegOptions();
  updateRangeJpegOptions();
}

// 当DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}