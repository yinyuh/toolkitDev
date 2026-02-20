import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/ort.mjs';

// Configuration
// transformers.js env is not needed anymore if we switch to onnxruntime-web directly
// but we might keep some state variables.

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone'); // Not used anymore directly, we use canvasContainer
const removeBgBtn = document.getElementById('removeBgBtn');
const modelStatus = document.getElementById('modelStatus');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const processingStatus = document.getElementById('processingStatus');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const canvasWrapper = document.getElementById('canvasWrapper');
const originalWrapper = document.getElementById('originalWrapper');
const mainCanvas = document.getElementById('mainCanvas');
const originalCanvas = document.getElementById('originalCanvas');
const originalEmptyState = document.getElementById('originalEmptyState');
const resultEmptyState = document.getElementById('resultEmptyState');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = null;
const redoBtn = null;

const imageInfo = document.getElementById('imageInfo');
const processTime = document.getElementById('processTime');

const fileInfoText = document.getElementById('fileInfoText');

// State
let session = null;
let originalImage = null; // Image object
let maskCanvas = null; // Offscreen canvas for the mask
let currentScale = 1;
let isProcessing = false;
let isModelLoading = false;
let history = [];
let historyIndex = -1;
let panX = 0;
let panY = 0;

// Constants
const MAX_HISTORY = 20;

// Initialize
init();

async function init() {
    setupEventListeners();
    setupCanvasInteractions();
    
    // Load model automatically on page load (lazy load)
    loadModel();
}

async function loadModel() {
    if (session || isModelLoading) return;
    
    isModelLoading = true;
    statusText.textContent = "检查模型缓存...";
    statusDot.className = "w-2 h-2 rounded-full bg-yellow-400 animate-pulse";
    
    try {
        // 配置 onnxruntime-web 的 wasm 路径
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/';
        
        // 禁用多线程以避免加载 threaded.wasm 和 .jsep.mjs
        ort.env.wasm.numThreads = 1; 
        ort.env.wasm.proxy = false; // 禁用 worker proxy

        // 模型路径
        const modelUrl = '/models/rmbg-1.4/onnx/model.onnx';
        let modelData = modelUrl;

        // 尝试使用 Cache API 缓存模型
        if ('caches' in window) {
            const cacheName = 'rmbg-model-cache-v1';
            try {
                const cache = await caches.open(cacheName);
                const cachedResponse = await cache.match(modelUrl);
                
                if (cachedResponse) {
                    statusText.textContent = "正在加载缓存模型...";
                    modelData = await cachedResponse.arrayBuffer();
                } else {
                    statusText.textContent = "下载模型中 (0%)...";
                    
                    // 带进度的下载
                    const response = await fetch(modelUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    const contentLength = response.headers.get('content-length');
                    const total = parseInt(contentLength, 10);
                    
                    let loaded = 0;
                    const chunks = [];
                    const reader = response.body.getReader();

                    while (true) {
                        const {done, value} = await reader.read();
                        if (done) break;
                        
                        chunks.push(value);
                        loaded += value.byteLength;
                        
                        if (total) {
                            const percent = Math.round((loaded / total) * 100);
                            statusText.textContent = `下载模型中 (${percent}%)...`;
                        }
                    }
                    
                    // 合并 chunks
                    const allChunks = new Uint8Array(loaded);
                    let position = 0;
                    for (let chunk of chunks) {
                        allChunks.set(chunk, position);
                        position += chunk.length;
                    }
                    
                    modelData = allChunks.buffer;
                    
                    // 存入缓存
                    const cacheResponse = new Response(modelData, {
                        headers: { 'Content-Type': 'application/octet-stream' }
                    });
                    await cache.put(modelUrl, cacheResponse);
                }
            } catch (cacheError) {
                // Fallback to URL loading if cache fails
                modelData = modelUrl;
            }
        }
        
        statusText.textContent = "正在初始化引擎...";

        // 创建推理会话
        session = await ort.InferenceSession.create(modelData, {
            executionProviders: ['wasm'], // 使用 WASM 后端
            graphOptimizationLevel: 'all',
        });
        
        statusText.textContent = "本地AI模型已就绪";
        statusDot.className = "w-2 h-2 rounded-full bg-green-500";
        if (originalImage) removeBgBtn.disabled = false;
    } catch (error) {
        console.error("Model load error:", error);
        statusText.textContent = "模型加载失败";
        statusDot.className = "w-2 h-2 rounded-full bg-red-500";
    } finally {
        isModelLoading = false;
    }
}

function setupEventListeners() {
    // Upload
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    // 我们将 dropZone 绑定到 canvasContainer 上，让整个区域支持拖拽
    const dropZoneArea = document.getElementById('canvasContainer');
    
    dropZoneArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZoneArea.classList.add('border-2', 'border-blue-500', 'border-dashed');
    });
    
    dropZoneArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZoneArea.classList.remove('border-2', 'border-blue-500', 'border-dashed');
    });
    
    dropZoneArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZoneArea.classList.remove('border-2', 'border-blue-500', 'border-dashed');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Remove BG Button
    removeBgBtn.addEventListener('click', runBackgroundRemoval);

    // Zoom - Disabled
    // document.getElementById('zoomInBtn').addEventListener('click', () => setZoom(currentScale * 1.2));
    // document.getElementById('zoomOutBtn').addEventListener('click', () => setZoom(currentScale / 1.2));
    // if (document.getElementById('fitScreenBtn')) {
    //     document.getElementById('fitScreenBtn').addEventListener('click', fitToScreen);
    // }

    // Download
    downloadBtn.addEventListener('click', downloadResult);
    
    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // 清空状态
            originalImage = null;
            maskCanvas = null;
            
            // 恢复 UI
            originalEmptyState.classList.remove('hidden');
            originalCanvas.classList.add('hidden');
            
            resultEmptyState.classList.remove('hidden');
            mainCanvas.classList.add('hidden');
            
            removeBgBtn.disabled = true;
            downloadBtn.disabled = true;
            resetBtn.disabled = true;
            
            fileInput.value = ''; // 清空文件选择
            if (fileInfoText) fileInfoText.textContent = '未选择任何文件';
            imageInfo.textContent = '';
            processTime.textContent = '';
            
            // 清空画布
            const ctxOrig = originalCanvas.getContext('2d');
            ctxOrig.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
            const ctxMain = mainCanvas.getContext('2d');
            ctxMain.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        });
    }

    // History (Not used anymore but keep for reference if needed)
    // if (undoBtn) undoBtn.addEventListener('click', undo);
    // if (redoBtn) redoBtn.addEventListener('click', redo);

    // Brush Size
    // brushSizeInput.addEventListener('input', (e) => {
    //    brushSizeVal.textContent = `${e.target.value}px`;
    // });
}

function handleFileSelect(e) {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
}

function handleFile(file) {
    if (!file.type.match('image.*')) {
        alert('请上传图片文件 (JPG/PNG/WebP)');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            if (img.width > 4096 || img.height > 4096) {
                alert('图片尺寸不能超过 4096x4096px');
                return;
            }
            
            originalImage = img;
            
            // Reset state
            panX = 0;
            panY = 0;
            history = [];
            historyIndex = -1;
            updateHistoryButtons();
            
            // Init Mask Canvas
            maskCanvas = document.createElement('canvas');
            maskCanvas.width = img.width;
            maskCanvas.height = img.height;
            const ctx = maskCanvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
            
            // Update Info
            if (fileInfoText) {
                fileInfoText.textContent = file.name;
            }
            imageInfo.textContent = `${img.width}x${img.height}px`; // Image size
            processTime.textContent = '';
            
            // Show canvas areas, hide empty states
            originalEmptyState.classList.add('hidden');
            originalCanvas.classList.remove('hidden');
            
            // 右侧重置为空状态，隐藏 mainCanvas
            resultEmptyState.classList.remove('hidden'); 
            mainCanvas.classList.add('hidden'); 
            
            // Enable buttons
            if (session) removeBgBtn.disabled = false;
            // downloadBtn.disabled = false; // 下载按钮只有在去背完成后才启用
            if (resetBtn) resetBtn.disabled = false; // 上传图片后即可重置
            
            // Fit and Draw
            fitToScreen();
            drawCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 图像预处理：调整大小 + 归一化 + 转 NCHW 格式
function preprocessImage(img, targetWidth = 1024, targetHeight = 1024) {
    // 创建一个临时 canvas 来调整图片大小
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // 1. 归一化 (0-255 -> 0-1) 并提取 RGB 通道
    // RMBG-1.4 期望的输入是 normalized float32
    // 均值和标准差通常是 [0.5, 0.5, 0.5] (基于 transformers 的 config)
    // 即: (x / 255.0 - 0.5) / 0.5 => x / 127.5 - 1.0
    
    const floatData = new Float32Array(3 * targetWidth * targetHeight);
    for (let i = 0; i < targetWidth * targetHeight; i++) {
        // R
        floatData[i] = (data[i * 4] / 255.0 - 0.5) / 0.5;
        // G
        floatData[i + targetWidth * targetHeight] = (data[i * 4 + 1] / 255.0 - 0.5) / 0.5;
        // B
        floatData[i + 2 * targetWidth * targetHeight] = (data[i * 4 + 2] / 255.0 - 0.5) / 0.5;
    }

    // 2. 构造 NCHW 格式输入 (batch=1, channels=3, height=1024, width=1024)
    const inputTensor = new ort.Tensor('float32', floatData, [1, 3, targetHeight, targetWidth]);
    return inputTensor;
}

async function runBackgroundRemoval() {
    if (!session || !originalImage || isProcessing) return;

    isProcessing = true;
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = "正在去除背景...";
    
    // Show processing status immediately
    processingStatus.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    // Give UI a chance to update before blocking the main thread
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to ensure render
    
    const startTime = performance.now();

    try {
        // 1. Preprocess
        // progressText.textContent = '正在处理中...'; // Already set in HTML
        progressBar.style.width = '10%';
        
        // Give UI a chance to update
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // RMBG-1.4 通常使用 1024x1024 作为输入
        const targetSize = 1024;
        const inputTensor = preprocessImage(originalImage, targetSize, targetSize);
        
        progressBar.style.width = '30%';
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // 2. Run Model
        // progressText.textContent = 'AI推理中...'; // 保持显示“正在处理中...”更简洁
        // 确保输入名正确。大多数 ONNX 模型使用 'input' 或 'pixel_values'
        // 我们可以尝试获取输入名
        const inputName = session.inputNames[0];
        const feeds = {};
        feeds[inputName] = inputTensor;
        
        // 模拟进度条动画，因为 session.run 是阻塞的（除非在 worker 中，但这里是在主线程 WASM）
        // 我们可以设置一个定时器稍微增加进度
        const progressInterval = setInterval(() => {
            const currentWidth = parseFloat(progressBar.style.width);
            if (currentWidth < 80) {
                progressBar.style.width = `${currentWidth + 1}%`;
            }
        }, 100);
        
        // Use setTimeout to allow UI to update before heavy computation
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const outputs = await session.run(feeds);
        
        clearInterval(progressInterval);
        progressBar.style.width = '90%';
        // progressText.textContent = '后处理...';
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // 3. Post-process
        // 尝试获取输出，有时 session.run 返回的结果键值可能不同
        // outputs 是一个对象，key 是输出名，value 是 tensor
        // 我们之前获取的 outputName = session.outputNames[0] 是正确的
        
        const outputTensor = outputs[session.outputNames[0]];
        
        if (!outputTensor) {
            throw new Error("No output tensor found");
        }
        
        // Output is usually [1, 1, 1024, 1024] probability map (after sigmoid? or logits?)
        // RMBG-1.4 output is likely logits, or already probability.
        // Let's assume we need to resize it back to original image size.
        
        const width = outputTensor.dims[outputTensor.dims.length - 1];
        const height = outputTensor.dims[outputTensor.dims.length - 2];
        const data = outputTensor.data;
        
        // Create a temporary canvas for the mask
        const maskCanvasTemp = document.createElement('canvas');
        maskCanvasTemp.width = width;
        maskCanvasTemp.height = height;
        const maskCtx = maskCanvasTemp.getContext('2d');
        const imgData = maskCtx.createImageData(width, height);
        
        // Fill mask data
        for (let i = 0; i < data.length; i++) {
            // RMBG-1.4 output is usually linear, range [0, 1] or similar
            // If it's logits, we need sigmoid. 
            // Let's check value range. If any value > 1 or < 0, it's likely logits.
            // But checking all is slow.
            // Bria RMBG 1.4 usually outputs probability map directly (0-1).
            // But let's try direct mapping first.
            
            // For safety, let's clamp.
            // const val = Math.max(0, Math.min(1, data[i]));
            
            // Actually, let's assume it's probability [0, 1]
            let val = data[i];
            
            // If it seems to be logits (e.g. range includes negative or > 1), apply sigmoid.
            // However, doing this check per pixel is expensive.
            // Let's just try to interpret it as probability.
            
            const alpha = Math.round(val * 255);
            
            // Draw a black/white mask? Or just alpha channel?
            // We want to use this as a mask for the original image.
            // Let's make it a black image with variable alpha?
            // Or better: white image with variable alpha, to be used with destination-in.
            
            imgData.data[i * 4] = 0; // R
            imgData.data[i * 4 + 1] = 0; // G
            imgData.data[i * 4 + 2] = 0; // B
            imgData.data[i * 4 + 3] = alpha; // Alpha
        }
        
        maskCtx.putImageData(imgData, 0, 0);
        
        // Resize mask to original image size
        maskCanvas = document.createElement('canvas');
        maskCanvas.width = originalImage.width;
        maskCanvas.height = originalImage.height;
        const mainMaskCtx = maskCanvas.getContext('2d');
        mainMaskCtx.drawImage(maskCanvasTemp, 0, 0, originalImage.width, originalImage.height);
        
        // Save state for undo
        saveHistory();
        
        // Show result canvas
        resultEmptyState.classList.add('hidden');
        mainCanvas.classList.remove('hidden');
        
        // Enable download button
        downloadBtn.disabled = false;
        
        const endTime = performance.now();
        processTime.textContent = `耗时: ${((endTime - startTime) / 1000).toFixed(2)}s`;
        
    } catch (error) {
        console.error("Segmentation failed:", error);
        alert("处理失败，请重试");
    } finally {
        isProcessing = false;
        loadingOverlay.classList.add('hidden');
        
        // Hide progress status
        progressBar.style.width = '100%';
        setTimeout(() => {
            processingStatus.classList.add('hidden');
        }, 500);
        
        drawCanvas();
    }
}

// Canvas Drawing & Interaction
function setupCanvasInteractions() {
    // 移除了鼠标拖拽和滚轮缩放功能
    // const container = document.getElementById('canvasContainer');
    
    // Wheel zoom - Disabled
    /*
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(currentScale * delta);
    }, { passive: false });
    */
}

// 移除了所有绘图和拖拽相关的函数
// function getPointerPos(e) { ... }
// function screenToImage(screenX, screenY) { ... }
// function startDraw(e) { ... }
// function draw(e) { ... }
// function stopDraw(e) { ... }
// function paint(screenX, screenY) { ... }
// function paintLine(x1, y1, x2, y2) { ... }

function drawCanvas() {
    if (!originalImage) return;
    
    // 我们不需要再根据容器调整 Canvas 的 width/height 属性
    // 因为这会改变分辨率。我们已经在 fitToScreen 中设置了正确的分辨率。
    
    // Draw Result Canvas
    const ctx = mainCanvas.getContext('2d');
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    // 直接绘制全图，不缩放不平移（由 CSS object-contain 处理显示）
    if (maskCanvas) {
         // Apply Mask
         // Draw Original
         ctx.drawImage(originalImage, 0, 0);
         // Punch out background
         ctx.globalCompositeOperation = 'destination-in';
         ctx.drawImage(maskCanvas, 0, 0);
         // Reset
         ctx.globalCompositeOperation = 'source-over';
    } else {
        // 如果没有 mask，不绘制，保持空白（由 CSS 隐藏）
    }
    
    // Draw Original Canvas (Left side)
    const ctxOrig = originalCanvas.getContext('2d');
    ctxOrig.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    ctxOrig.drawImage(originalImage, 0, 0);
}

function fitToScreen() {
    if (!originalImage) return;
    const rect = canvasWrapper.getBoundingClientRect();
    
    // 我们不再需要手动缩放 Canvas，而是让 Canvas 元素充满容器，并使用 object-fit (CSS) 或 drawImage 缩放 (Canvas)
    // 但为了保持分辨率，我们应该设置 Canvas 的 width/height 为图片实际尺寸
    // 然后通过 CSS 样式让它适应屏幕
    
    // 设置 Canvas 分辨率
    if (mainCanvas.width !== originalImage.width || mainCanvas.height !== originalImage.height) {
        mainCanvas.width = originalImage.width;
        mainCanvas.height = originalImage.height;
    }
    
    if (originalCanvas.width !== originalImage.width || originalCanvas.height !== originalImage.height) {
        originalCanvas.width = originalImage.width;
        originalCanvas.height = originalImage.height;
    }
    
    // 重置变换参数
    currentScale = 1;
    panX = 0;
    panY = 0;
    
    drawCanvas();
}

function setZoom(newScale) {
    if (!originalImage) return;
    // Limit zoom
    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 5) newScale = 5;
    
    // Zoom toward center of canvas (simplified)
    const rect = canvasWrapper.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate new pan to keep center fixed
    // (centerX - panX) / oldScale = imageX
    // newPanX = centerX - imageX * newScale
    
    const imageX = (centerX - panX) / currentScale;
    const imageY = (centerY - panY) / currentScale;
    
    currentScale = newScale;
    panX = centerX - imageX * currentScale;
    panY = centerY - imageY * currentScale;
    
    drawCanvas();
    updateZoomDisplay();
}

function updateZoomDisplay() {
    // document.getElementById('zoomLevel').textContent = `${Math.round(currentScale * 100)}%`;
}

// History System
function saveHistory() {
    if (!maskCanvas) return;
    
    // Remove future history if we are in the middle
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    
    // Save mask state
    const imageData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    history.push(imageData);
    
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }
    
    updateHistoryButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreHistory();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreHistory();
    }
}

function restoreHistory() {
    const imageData = history[historyIndex];
    if (imageData) {
        maskCanvas.getContext('2d').putImageData(imageData, 0, 0);
        drawCanvas();
        updateHistoryButtons();
    }
}

function updateHistoryButtons() {
    // if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    // if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
}

// Export
function downloadResult() {
    if (!originalImage || !maskCanvas) return;
    
    const format = document.getElementById('exportFormat').value;
    
    // Create temp canvas for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = originalImage.width;
    exportCanvas.height = originalImage.height;
    const ctx = exportCanvas.getContext('2d');
    
    if (format === 'jpg-white') {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    
    // Draw original
    ctx.drawImage(originalImage, 0, 0);
    
    // Apply Mask
    if (format !== 'jpg-original') {
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskCanvas, 0, 0);
    }
    
    // Download
    const link = document.createElement('a');
    link.download = `removed-bg-${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
    link.href = exportCanvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg');
    link.click();
}
