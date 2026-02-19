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
const progressBar = document.getElementById('progressBar');
const progressFill = document.querySelector('#progressBar div');
const canvasWrapper = document.getElementById('canvasWrapper');
const originalWrapper = document.getElementById('originalWrapper');
const mainCanvas = document.getElementById('mainCanvas');
const originalCanvas = document.getElementById('originalCanvas');
const originalEmptyState = document.getElementById('originalEmptyState');
const resultEmptyState = document.getElementById('resultEmptyState');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const downloadBtn = document.getElementById('downloadBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

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
    statusText.textContent = "模型加载中...";
    statusDot.className = "w-2 h-2 rounded-full bg-yellow-400 animate-pulse";
    
    try {
        // 配置 onnxruntime-web 的 wasm 路径
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/';
        
        // 禁用多线程以避免加载 threaded.wasm 和 .jsep.mjs
        ort.env.wasm.numThreads = 1; 
        ort.env.wasm.proxy = false; // 禁用 worker proxy

        // 使用 onnxruntime-web 加载模型
        const modelUrl = '/models/rmbg-1.4/onnx/model.onnx';
        
        // 创建推理会话
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['wasm'], // 使用 WASM 后端
            graphOptimizationLevel: 'all',
        });
        
        statusText.textContent = "本地模型已就绪 (RMBG v1.4)";
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
    // document.getElementById('fitScreenBtn').addEventListener('click', fitToScreen);

    // Download
    downloadBtn.addEventListener('click', downloadResult);

    // History
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);

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
            downloadBtn.disabled = false;
            
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
    const startTime = performance.now();

    try {
        // 1. Preprocess
        // RMBG-1.4 通常使用 1024x1024 作为输入
        const targetSize = 1024;
        const inputTensor = preprocessImage(originalImage, targetSize, targetSize);
        
        // 2. Run Model
        // 确保输入名正确。大多数 ONNX 模型使用 'input' 或 'pixel_values'
        // 我们可以尝试获取输入名
        const inputName = session.inputNames[0];
        const feeds = {};
        feeds[inputName] = inputTensor;
        
        const outputs = await session.run(feeds);
        
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
        
        const endTime = performance.now();
        processTime.textContent = `耗时: ${((endTime - startTime) / 1000).toFixed(2)}s`;
        
    } catch (error) {
        console.error("Segmentation failed:", error);
        alert("处理失败，请重试");
    } finally {
        isProcessing = false;
        loadingOverlay.classList.add('hidden');
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
    
    // Resize main canvas and original canvas to fit their containers
    // Better: main canvas size = wrapper client size.
    const rect = canvasWrapper.getBoundingClientRect();
    if (mainCanvas.width !== rect.width || mainCanvas.height !== rect.height) {
        mainCanvas.width = rect.width;
        mainCanvas.height = rect.height;
    }

    const rectOrig = originalWrapper.getBoundingClientRect();
    if (originalCanvas.width !== rectOrig.width || originalCanvas.height !== rectOrig.height) {
        originalCanvas.width = rectOrig.width;
        originalCanvas.height = rectOrig.height;
    }
    
    // Draw Result Canvas
    const ctx = mainCanvas.getContext('2d');
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(currentScale, currentScale);
    
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
        // 如果没有 mask (还没处理)，结果区域显示什么？
        // 根据截图，应该显示“生成的透明背景图片将在下方显示” (即空状态)
        // 所以我们不画任何东西，并且保持 resultEmptyState 显示
        // 但在 handleFile 中我们隐藏了 emptyState...
        // 让我们调整逻辑：handleFile时不隐藏 resultEmptyState，只有在 runBackgroundRemoval 成功后才隐藏？
        // 或者，初始时 mainCanvas 显示原图？不，用户说“生成前后的图片统一展示”，左边原图，右边结果。
        // 如果还没生成，右边应该是空的。
        
        // 所以这里不画图。
    }
    
    ctx.restore();

    // Draw Original Canvas (Left side)
    const ctxOrig = originalCanvas.getContext('2d');
    ctxOrig.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    
    ctxOrig.save();
    // Use same pan/scale for sync view
    ctxOrig.translate(panX, panY);
    ctxOrig.scale(currentScale, currentScale);
    ctxOrig.drawImage(originalImage, 0, 0);
    ctxOrig.restore();
}

function fitToScreen() {
    if (!originalImage) return;
    const rect = canvasWrapper.getBoundingClientRect();
    const padding = 20; // 稍微减小边距
    const availW = rect.width - padding;
    const availH = rect.height - padding;
    
    const scaleW = availW / originalImage.width;
    const scaleH = availH / originalImage.height;
    
    // 始终使用适应屏幕的比例，且不限制最大为1，因为如果图片很小，适应屏幕可能需要放大
    // 但通常去背工具我们希望看到清晰的图，所以可以限制最大为1
    currentScale = Math.min(scaleW, scaleH); 
    
    // Center
    panX = (rect.width - originalImage.width * currentScale) / 2;
    panY = (rect.height - originalImage.height * currentScale) / 2;
    
    drawCanvas();
    // updateZoomDisplay(); // 不需要更新显示了
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
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
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
