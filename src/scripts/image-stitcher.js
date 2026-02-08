// 全局变量
let images = [];
let selectedImageIndex = -1;
let mergedImage = null;
let sortOrder = 'time'; // 'time' 按时间排序, 'name-asc' 按名称正序, 'name-desc' 按名称倒序

// DOM 元素
let fileInput;
let browseBtn;
let uploadArea;
let imageList;
let imageCount;
let mergeDirection;
let outputFormat;
let compressionLevel;
let editControls;
let rotateLeft;
let rotateRight;
let flipHorizontal;
let flipVertical;
let previewArea;
let stitchBtn;
let resetBtn;
let downloadBtn;
let openNewBtn;
let sortBtn;
let sortIcon;

// 初始化函数
function init() {
  // 初始化DOM元素
  fileInput = document.getElementById('fileInput');
  browseBtn = document.getElementById('browseBtn');
  uploadArea = document.querySelector('.upload-area');
  imageList = document.getElementById('imageList');
  imageCount = document.getElementById('imageCount');
  mergeDirection = document.getElementById('mergeDirection');
  outputFormat = document.getElementById('outputFormat');
  compressionLevel = document.getElementById('compressionLevel');
  editControls = document.getElementById('editControls');
  rotateLeft = document.getElementById('rotateLeft');
  rotateRight = document.getElementById('rotateRight');
  flipHorizontal = document.getElementById('flipHorizontal');
  flipVertical = document.getElementById('flipVertical');
  previewArea = document.getElementById('previewArea');
  stitchBtn = document.getElementById('stitchBtn');
  resetBtn = document.getElementById('resetBtn');
  downloadBtn = document.getElementById('downloadBtn');
  openNewBtn = document.getElementById('openNewBtn');
  sortBtn = document.getElementById('sortBtn');
  sortIcon = document.getElementById('sortIcon');
  
  // 初始化事件监听器
  initEventListeners();
}

// 显示非阻塞式临时提示
function showNotification(message) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notificationMessage');
  
  if (notification && notificationMessage) {
    // 设置提示信息
    notificationMessage.textContent = message;
    
    // 显示提示
    notification.classList.remove('translate-x-full', 'opacity-0');
    
    // 1秒后隐藏提示
    setTimeout(() => {
      notification.classList.add('translate-x-full', 'opacity-0');
    }, 1000);
  }
}

// 初始化事件监听器
function initEventListeners() {
  // 文件选择
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  
  // 上传区域全屏点击交互
  uploadArea.addEventListener('click', () => fileInput.click());
  // 阻止按钮点击事件冒泡，避免触发两次文件选择
  browseBtn.addEventListener('click', (e) => e.stopPropagation());
  
  // 拖放上传
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
      handleFiles(e.dataTransfer.files);
    }
  });

  // 编辑按钮
  rotateLeft.addEventListener('click', () => rotateImage(selectedImageIndex, -90));
  rotateRight.addEventListener('click', () => rotateImage(selectedImageIndex, 90));
  flipHorizontal.addEventListener('click', () => flipImage(selectedImageIndex, 'horizontal'));
  flipVertical.addEventListener('click', () => flipImage(selectedImageIndex, 'vertical'));

  // 操作按钮
  stitchBtn.addEventListener('click', stitchImages);
  resetBtn.addEventListener('click', reset);
  downloadBtn.addEventListener('click', downloadImage);
  openNewBtn.addEventListener('click', openImageInNewWindow);
  
  // 排序按钮
  sortBtn.addEventListener('click', toggleSort);

  // 方向和格式变更时更新预览
  mergeDirection.addEventListener('change', updatePreview);
  outputFormat.addEventListener('change', updatePreview);
  compressionLevel.addEventListener('change', updatePreview);
}

// 处理文件选择
function handleFileSelect(e) {
  handleFiles(e.target.files);
}

// 处理文件上传
function handleFiles(fileList) {
  // 先将所有文件添加到临时数组
  const tempFiles = Array.from(fileList);
  
  // 处理文件
  tempFiles.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          images.push({
            id: Date.now() + Math.random(),
            src: e.target.result,
            image: img,
            width: img.width,
            height: img.height,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            name: file.name,
            timestamp: Date.now()
          });
          updateImageList();
          updatePreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// 更新图片列表
function updateImageList() {
  if (images.length === 0) {
    imageList.innerHTML = `
      <div class="empty-state text-center py-12 text-theme-secondary">
        请上传图片以开始拼接
      </div>
    `;
    imageCount.textContent = '(0 张图片)';
    editControls.classList.add('opacity-50', 'pointer-events-none');
    selectedImageIndex = -1;
    return;
  }

  imageList.innerHTML = images.map((image, index) => `
    <div class="image-item ${selectedImageIndex === index ? 'border-blue-500' : 'border-theme-secondary'} border rounded-lg p-4 flex items-center gap-4" data-index="${index}">
      <div class="image-number bg-theme-primary text-div-theme rounded-full w-8 h-8 flex items-center justify-center font-bold">${index + 1}</div>
      <div class="image-preview w-20 h-20 bg-theme-secondary rounded flex items-center justify-center overflow-hidden">
        <img src="${image.src}" class="max-w-full max-h-full object-contain" style="transform: rotate(${image.rotation}deg) ${image.flipHorizontal ? 'scaleX(-1)' : ''} ${image.flipVertical ? 'scaleY(-1)' : ''}">
      </div>
      <div class="image-info flex-1">
        <div class="text-sm text-theme-secondary truncate">${image.name}</div>
        <div class="text-xs text-theme-secondary opacity-70">${image.width} x ${image.height}</div>
      </div>
      <div class="image-controls flex gap-2">
        <button class="move-up btn-theme px-3 py-1 rounded text-sm cursor-pointer" data-index="${index}">↑</button>
        <button class="move-down btn-theme px-3 py-1 rounded text-sm cursor-pointer" data-index="${index}">↓</button>
        <button class="remove-btn btn-theme px-3 py-1 rounded text-sm cursor-pointer" data-index="${index}">删除</button>
      </div>
    </div>
  `).join('');

  imageCount.textContent = `(${images.length} 张图片)`;

  // 添加事件监听器
  document.querySelectorAll('.image-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.image-controls')) {
        selectedImageIndex = parseInt(item.dataset.index);
        updateImageList();
        // 启用编辑控件
        editControls.classList.remove('opacity-50', 'pointer-events-none');
        // 启用编辑按钮
        const editButtons = editControls.querySelectorAll('button');
        editButtons.forEach(button => {
          button.classList.remove('opacity-50');
          button.classList.add('hover:bg-opacity-90');
        });
      }
    });
  });

  // 移动按钮
  document.querySelectorAll('.move-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      if (index > 0) {
        // 交换位置
        [images[index], images[index - 1]] = [images[index - 1], images[index]];
        updateImageList();
        updatePreview();
      }
    });
  });

  document.querySelectorAll('.move-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      if (index < images.length - 1) {
        // 交换位置
        [images[index], images[index + 1]] = [images[index + 1], images[index]];
        updateImageList();
        updatePreview();
      }
    });
  });

  // 删除按钮
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      images.splice(index, 1);
      if (selectedImageIndex >= images.length) {
        selectedImageIndex = images.length - 1;
      }
      updateImageList();
      updatePreview();
    });
  });

  // 实现拖拽排序
  let draggedItem = null;

  document.querySelectorAll('.image-item').forEach(item => {
    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      setTimeout(() => {
        item.style.opacity = '0.5';
      }, 0);
    });

    item.addEventListener('dragend', (e) => {
      draggedItem = null;
      item.style.opacity = '1';
      document.querySelectorAll('.image-item').forEach(i => {
        i.classList.remove('border-blue-500');
      });
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    item.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (item !== draggedItem) {
        item.classList.add('border-blue-500');
      }
    });

    item.addEventListener('dragleave', (e) => {
      if (item !== draggedItem) {
        item.classList.remove('border-blue-500');
      }
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('border-blue-500');
      
      if (draggedItem !== item) {
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const targetIndex = parseInt(item.dataset.index);
        
        const [draggedImage] = images.splice(draggedIndex, 1);
        images.splice(targetIndex, 0, draggedImage);
        
        updateImageList();
        updatePreview();
      }
    });
  });
}

// 旋转图片
function rotateImage(index, angle) {
  if (images[index]) {
    images[index].rotation += angle;
    if (images[index].rotation >= 360) {
      images[index].rotation -= 360;
    } else if (images[index].rotation < 0) {
      images[index].rotation += 360;
    }
    updateImageList();
    updatePreview();
  }
}

// 翻转图片
function flipImage(index, direction) {
  if (images[index]) {
    if (direction === 'horizontal') {
      images[index].flipHorizontal = !images[index].flipHorizontal;
    } else {
      images[index].flipVertical = !images[index].flipVertical;
    }
    updateImageList();
    updatePreview();
  }
}

// 拼接图片
function stitchImages() {
  if (images.length < 2) {
    alert('请至少上传两张图片进行拼接');
    return;
  }

  const direction = mergeDirection.value;
  const quality = parseFloat(compressionLevel.value);
  const format = outputFormat.value;

  // 计算拼接后的尺寸
  let totalWidth = 0;
  let totalHeight = 0;

  if (direction === 'vertical') {
    totalWidth = Math.max(...images.map(img => {
      // 考虑旋转后的尺寸
      if (img.rotation % 180 === 90) {
        return img.height;
      }
      return img.width;
    }));
    totalHeight = images.reduce((sum, img) => {
      if (img.rotation % 180 === 90) {
        return sum + img.width;
      }
      return sum + img.height;
    }, 0);
  } else {
    totalWidth = images.reduce((sum, img) => {
      if (img.rotation % 180 === 90) {
        return sum + img.height;
      }
      return sum + img.width;
    }, 0);
    totalHeight = Math.max(...images.map(img => {
      if (img.rotation % 180 === 90) {
        return img.width;
      }
      return img.height;
    }));
  }

  // 创建画布
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  // 填充背景为白色
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // 绘制图片
  let currentX = 0;
  let currentY = 0;

  images.forEach(img => {
    // 计算图片绘制尺寸和位置
    let drawWidth = img.width;
    let drawHeight = img.height;
    let offsetX = 0;
    let offsetY = 0;

    if (img.rotation % 180 === 90) {
      [drawWidth, drawHeight] = [drawHeight, drawWidth];
    }

    if (direction === 'vertical') {
      offsetX = (totalWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      offsetX = 0;
      offsetY = (totalHeight - drawHeight) / 2;
    }

    // 保存当前状态
    ctx.save();

    // 移动到绘制位置
    ctx.translate(currentX + offsetX + drawWidth / 2, currentY + offsetY + drawHeight / 2);

    // 应用旋转
    ctx.rotate((img.rotation * Math.PI) / 180);

    // 应用翻转
    if (img.flipHorizontal) ctx.scale(-1, 1);
    if (img.flipVertical) ctx.scale(1, -1);

    // 绘制图片
    ctx.drawImage(
      img.image,
      -img.width / 2,
      -img.height / 2,
      img.width,
      img.height
    );

    // 恢复状态
    ctx.restore();

    // 更新位置
    if (direction === 'vertical') {
      currentY += drawHeight;
    } else {
      currentX += drawWidth;
    }
  });

  // 转换为数据URL
  mergedImage = canvas.toDataURL(`image/${format}`, quality);
  updatePreview();

  // 启用下载和新窗口按钮
  downloadBtn.classList.remove('opacity-50', 'pointer-events-none');
  downloadBtn.classList.add('cursor-pointer', 'hover:bg-opacity-90', 'hover:shadow-md', 'hover:scale-105');
  openNewBtn.classList.remove('opacity-50', 'pointer-events-none');
  openNewBtn.classList.add('cursor-pointer', 'hover:bg-opacity-90', 'hover:shadow-md', 'hover:scale-105');

  // 显示非阻塞式临时提示
  showNotification('图片拼接成功！');
}

// 更新预览
function updatePreview() {
  if (mergedImage) {
    // 显示合并后的图片预览
    previewArea.innerHTML = `
      <div class="preview-image-container">
        <img src="${mergedImage}" class="preview-image">
      </div>
    `;
  } else if (images.length === 0) {
    previewArea.innerHTML = `
      <div class="empty-preview text-center py-12 text-theme-secondary">
        上传图片后将在此处显示预览
      </div>
    `;
  } else {
    // 显示上传图片的缩略预览
    previewArea.innerHTML = `
      <div class="uploaded-images-preview flex flex-wrap gap-2 justify-center">
        ${images.map((img, index) => `
          <div class="preview-thumbnail relative w-20 h-20 bg-theme-secondary rounded flex items-center justify-center overflow-hidden">
            <img src="${img.src}" class="max-w-full max-h-full object-contain" style="transform: rotate(${img.rotation}deg) ${img.flipHorizontal ? 'scaleX(-1)' : ''} ${img.flipVertical ? 'scaleY(-1)' : ''}">
            <div class="preview-number absolute top-1 right-1 bg-theme-primary text-div-theme rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">${index + 1}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// 重置
function reset() {
  // 清空图片数组
  images = [];
  // 重置选中索引
  selectedImageIndex = -1;
  // 清空合并后的图片
  mergedImage = null;
  // 重置文件输入框的值，确保可以重新选择相同的文件
  fileInput.value = '';
  // 更新图片列表和预览
  updateImageList();
  updatePreview();
  // 禁用下载和新窗口按钮
  downloadBtn.classList.add('opacity-50', 'pointer-events-none');
  downloadBtn.classList.remove('cursor-pointer', 'hover:bg-opacity-90', 'hover:shadow-md', 'hover:scale-105');
  openNewBtn.classList.add('opacity-50', 'pointer-events-none');
  openNewBtn.classList.remove('cursor-pointer', 'hover:bg-opacity-90', 'hover:shadow-md', 'hover:scale-105');
  // 禁用编辑控件和按钮
  editControls.classList.add('opacity-50', 'pointer-events-none');
  const editButtons = editControls.querySelectorAll('button');
  editButtons.forEach(button => {
    button.classList.add('opacity-50');
    button.classList.remove('hover:bg-opacity-90');
  });
}

// 下载图片
function downloadImage() {
  if (mergedImage) {
    const link = document.createElement('a');
    link.href = mergedImage;
    link.download = `stitched-image-${Date.now()}.${outputFormat.value}`;
    link.click();
  }
}

// 在新窗口打开图片
function openImageInNewWindow() {
  if (mergedImage) {
    // 打开标准的浏览器新窗口
    const newWindow = window.open('', '_blank', 'width=1000,height=800,menubar=yes,toolbar=yes,location=yes,scrollbars=yes,resizable=yes');
    
    // 创建包含缩放功能的HTML结构
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>拼接后的图片 - 查看器</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
          }
          .container {
            max-width: 100%;
            max-height: 100%;
            overflow: auto;
            text-align: center;
          }
          .image-container {
            position: relative;
            display: inline-block;
          }
          img {
            display: block;
            transition: transform 0.1s ease;
          }
          .controls {
            margin-top: 20px;
            text-align: center;
          }
          button {
            margin: 0 10px;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
          .instructions {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>拼接后的图片</h1>
          <div class="image-container">
            <img id="previewImage" src="${mergedImage}" alt="拼接后的图片">
          </div>
          <div class="instructions">
            提示：按住CTRL键并滚动鼠标滚轮可以放大/缩小图片
          </div>
          <div class="controls">
            <button onclick="window.print()">打印</button>
            <button onclick="window.close()">关闭</button>
          </div>
        </div>
        <script>
          const img = document.getElementById('previewImage');
          let scale = 1;
          
          // 实现鼠标滚轮缩放功能
          document.addEventListener('wheel', function(e) {
            // 检查是否按住了CTRL键
            if (e.ctrlKey) {
              e.preventDefault();
              // 计算缩放因子
              const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
              // 更新缩放比例
              scale *= scaleFactor;
              // 限制缩放范围
              scale = Math.max(0.1, Math.min(5, scale));
              // 应用缩放
              img.style.transform = 'scale(' + scale + ')';
            }
          });
        </script>
      </body>
      </html>
    `;
    
    // 写入并关闭文档
    newWindow.document.write(html);
    newWindow.document.close();
  }
}

// 切换排序方式
function toggleSort() {
  // 根据当前排序状态切换到下一种排序方式
  switch(sortOrder) {
    case 'time':
      sortOrder = 'name-asc';
      if (sortIcon) sortIcon.textContent = '↑';
      break;
    case 'name-asc':
      sortOrder = 'name-desc';
      if (sortIcon) sortIcon.textContent = '↓';
      break;
    case 'name-desc':
      sortOrder = 'time';
      if (sortIcon) sortIcon.textContent = '⌛';
      break;
  }
  // 执行排序
  sortImages();
}

// 排序图片
function sortImages() {
  switch(sortOrder) {
    case 'time':
      // 按时间排序（先上传的在前）
      images.sort((a, b) => a.timestamp - b.timestamp);
      break;
    case 'name-asc':
      // 按名称正序排序
      images.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      // 按名称倒序排序
      images.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }
  // 更新图片列表
  updateImageList();
}

// 当DOM加载完成时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
