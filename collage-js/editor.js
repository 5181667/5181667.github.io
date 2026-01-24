/**
 * 图片编辑器模块
 * 负责图片的旋转、翻转、裁剪、滤镜和水印功能
 */
class Editor {
    constructor() {
        this.imageManager = null;
        this.onEditChange = null;
        
        // 水印设置
        this.watermark = {
            text: '',
            size: 24,
            color: '#ffffff',
            opacity: 50,
            position: 'center'
        };
        
        // 裁剪状态
        this.cropData = {
            active: false,
            imageIndex: -1,
            box: { x: 0, y: 0, width: 0, height: 0 },
            ratio: 'free',
            isDragging: false,
            isResizing: false,
            handleType: null,
            startX: 0,
            startY: 0,
            startBox: null,
            imageLeft: 0,
            imageTop: 0,
            imageWidth: 0,
            imageHeight: 0
        };
        
        // 绑定方法上下文
        this.handleCropMouseMove = this.handleCropMouseMove.bind(this);
        this.handleCropMouseUp = this.handleCropMouseUp.bind(this);
    }

    /**
     * 初始化编辑器
     */
    init(imageManager) {
        this.imageManager = imageManager;
        this.bindEditToolEvents();
        this.bindFilterEvents();
        this.bindAdjustmentEvents();
        this.bindWatermarkEvents();
        this.bindCropEvents();
        
        // 监听图片选择变化
        imageManager.onSelectionChange = (image, index) => {
            this.updateEditPanel(image, index);
        };
    }

    /**
     * 更新编辑面板
     */
    updateEditPanel(image, index) {
        const editPlaceholder = document.getElementById('editPlaceholder');
        const editPanel = document.getElementById('editPanel');
        const selectedPreview = document.getElementById('selectedPreview');
        const scaleSlider = document.getElementById('imageScale');
        const scaleValue = document.getElementById('scaleValue');
        const brightnessSlider = document.getElementById('brightness');
        const brightnessValue = document.getElementById('brightnessValue');
        const contrastSlider = document.getElementById('contrast');
        const contrastValue = document.getElementById('contrastValue');
        const saturationSlider = document.getElementById('saturation');
        const saturationValue = document.getElementById('saturationValue');
        
        if (image) {
            if (editPlaceholder) editPlaceholder.style.display = 'none';
            if (editPanel) editPanel.style.display = 'block';
            if (selectedPreview) selectedPreview.src = image.dataUrl;
            
            // 启用缩放滑块
            if (scaleSlider) {
                scaleSlider.disabled = false;
                scaleSlider.value = image.scale || 100;
            }
            if (scaleValue) {
                scaleValue.textContent = `${image.scale || 100}%`;
            }
            
            // 更新滤镜选中状态
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === (image.filter || 'none'));
            });
            
            // 更新滤镜预览图
            this.updateFilterPreviews(image);
            
            // 更新调整滑块
            if (brightnessSlider) brightnessSlider.value = image.brightness || 100;
            if (brightnessValue) brightnessValue.textContent = `${image.brightness || 100}%`;
            if (contrastSlider) contrastSlider.value = image.contrast || 100;
            if (contrastValue) contrastValue.textContent = `${image.contrast || 100}%`;
            if (saturationSlider) saturationSlider.value = image.saturation || 100;
            if (saturationValue) saturationValue.textContent = `${image.saturation || 100}%`;
        } else {
            if (editPlaceholder) editPlaceholder.style.display = 'block';
            if (editPanel) editPanel.style.display = 'none';
            
            if (scaleSlider) {
                scaleSlider.disabled = true;
                scaleSlider.value = 100;
            }
            if (scaleValue) {
                scaleValue.textContent = '100%';
            }
            
            // 重置滤镜选中状态
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === 'none');
            });
            
            // 重置滤镜预览为默认
            this.resetFilterPreviews();
            
            // 重置调整滑块
            if (brightnessSlider) brightnessSlider.value = 100;
            if (brightnessValue) brightnessValue.textContent = '100%';
            if (contrastSlider) contrastSlider.value = 100;
            if (contrastValue) contrastValue.textContent = '100%';
            if (saturationSlider) saturationSlider.value = 100;
            if (saturationValue) saturationValue.textContent = '100%';
        }
    }
    
    /**
     * 更新滤镜预览图为当前选中图片
     */
    updateFilterPreviews(image) {
        if (!image || !image.dataUrl) return;
        
        const filters = {
            'none': '',
            'grayscale': 'grayscale(100%)',
            'sepia': 'sepia(100%)',
            'vintage': 'sepia(50%) contrast(90%) brightness(90%)',
            'cold': 'saturate(80%) hue-rotate(180deg)',
            'warm': 'saturate(120%) sepia(20%)'
        };
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const filterType = btn.dataset.filter;
            const previewContainer = btn.querySelector('.filter-preview');
            
            if (previewContainer) {
                // 清空现有内容
                previewContainer.innerHTML = '';
                
                // 创建图片预览
                const img = document.createElement('img');
                img.src = image.dataUrl;
                img.style.filter = filters[filterType] || '';
                previewContainer.appendChild(img);
            }
        });
    }
    
    /**
     * 重置滤镜预览为默认占位
     */
    resetFilterPreviews() {
        const filters = {
            'none': '',
            'grayscale': 'grayscale',
            'sepia': 'sepia',
            'vintage': 'vintage',
            'cold': 'cold',
            'warm': 'warm'
        };
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const filterType = btn.dataset.filter;
            const previewContainer = btn.querySelector('.filter-preview');
            
            if (previewContainer) {
                previewContainer.innerHTML = '';
                const placeholder = document.createElement('span');
                placeholder.className = `filter-preview placeholder ${filters[filterType]}`;
                previewContainer.appendChild(placeholder);
            }
        });
    }

    /**
     * 绑定编辑工具事件
     */
    bindEditToolEvents() {
        const editBtns = document.querySelectorAll('.edit-btn');
        
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const image = this.imageManager?.getSelectedImage();
                
                if (!image && action !== 'delete') {
                    window.app?.showToast('请先选择一张图片', 'error');
                    return;
                }
                
                switch (action) {
                    case 'rotateLeft':
                        this.rotateImage(-90);
                        break;
                    case 'rotateRight':
                        this.rotateImage(90);
                        break;
                    case 'flipH':
                        this.flipImage('horizontal');
                        break;
                    case 'flipV':
                        this.flipImage('vertical');
                        break;
                    case 'crop':
                        this.openCropModal();
                        break;
                    case 'delete':
                        this.deleteSelectedImage();
                        break;
                }
            });
        });
    }

    /**
     * 旋转图片
     */
    rotateImage(angle) {
        const image = this.imageManager?.getSelectedImage();
        if (!image) return;
        
        let newRotation = (image.rotation || 0) + angle;
        // 标准化到 0-360
        newRotation = ((newRotation % 360) + 360) % 360;
        
        this.imageManager.updateSelectedImage({ rotation: newRotation });
        this.notifyChange();
        window.app?.showToast(`已旋转 ${angle > 0 ? '90°' : '-90°'}`, 'success');
    }

    /**
     * 翻转图片
     */
    flipImage(direction) {
        const image = this.imageManager?.getSelectedImage();
        if (!image) return;
        
        if (direction === 'horizontal') {
            this.imageManager.updateSelectedImage({ flipH: !image.flipH });
            window.app?.showToast('已水平翻转', 'success');
        } else {
            this.imageManager.updateSelectedImage({ flipV: !image.flipV });
            window.app?.showToast('已垂直翻转', 'success');
        }
        
        this.notifyChange();
    }

    /**
     * 删除选中图片
     */
    deleteSelectedImage() {
        if (this.imageManager?.selectedIndex >= 0) {
            this.imageManager.removeImage(this.imageManager.selectedIndex);
            window.app?.showToast('已删除图片', 'success');
        } else {
            window.app?.showToast('请先选择要删除的图片', 'error');
        }
    }

    /**
     * 绑定滤镜事件
     */
    bindFilterEvents() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                const image = this.imageManager?.getSelectedImage();
                
                if (!image) {
                    window.app?.showToast('请先选择一张图片', 'error');
                    return;
                }
                
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.imageManager.updateSelectedImage({ filter: filter || 'none' });
                this.notifyChange();
            });
        });
    }

    /**
     * 绑定调整滑块事件
     */
    bindAdjustmentEvents() {
        // 亮度
        const brightnessSlider = document.getElementById('brightness');
        const brightnessValue = document.getElementById('brightnessValue');
        
        brightnessSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (brightnessValue) brightnessValue.textContent = `${value}%`;
            
            if (!this.imageManager?.getSelectedImage()) return;
            this.imageManager.updateSelectedImage({ brightness: value });
            this.notifyChange();
        });
        
        // 对比度
        const contrastSlider = document.getElementById('contrast');
        const contrastValue = document.getElementById('contrastValue');
        
        contrastSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (contrastValue) contrastValue.textContent = `${value}%`;
            
            if (!this.imageManager?.getSelectedImage()) return;
            this.imageManager.updateSelectedImage({ contrast: value });
            this.notifyChange();
        });
        
        // 饱和度
        const saturationSlider = document.getElementById('saturation');
        const saturationValue = document.getElementById('saturationValue');
        
        saturationSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (saturationValue) saturationValue.textContent = `${value}%`;
            
            if (!this.imageManager?.getSelectedImage()) return;
            this.imageManager.updateSelectedImage({ saturation: value });
            this.notifyChange();
        });
        
        // 缩放
        const scaleSlider = document.getElementById('imageScale');
        const scaleValue = document.getElementById('scaleValue');
        
        scaleSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (scaleValue) scaleValue.textContent = `${value}%`;
            
            if (!this.imageManager?.getSelectedImage()) return;
            this.imageManager.updateSelectedImage({ scale: value });
            this.notifyChange();
        });
    }

    /**
     * 绑定水印事件
     */
    bindWatermarkEvents() {
        // 水印文字
        const watermarkText = document.getElementById('watermarkText');
        watermarkText?.addEventListener('input', (e) => {
            this.watermark.text = e.target.value;
            this.notifyChange();
        });
        
        // 字体大小
        const watermarkSize = document.getElementById('watermarkSize');
        const watermarkSizeValue = document.getElementById('watermarkSizeValue');
        
        watermarkSize?.addEventListener('input', (e) => {
            this.watermark.size = parseInt(e.target.value);
            if (watermarkSizeValue) watermarkSizeValue.textContent = `${this.watermark.size}px`;
            this.notifyChange();
        });
        
        // 颜色
        const watermarkColor = document.getElementById('watermarkColor');
        const watermarkColorValue = document.getElementById('watermarkColorValue');
        
        watermarkColor?.addEventListener('input', (e) => {
            this.watermark.color = e.target.value;
            if (watermarkColorValue) watermarkColorValue.textContent = e.target.value;
            this.notifyChange();
        });
        
        // 透明度
        const watermarkOpacity = document.getElementById('watermarkOpacity');
        const watermarkOpacityValue = document.getElementById('watermarkOpacityValue');
        
        watermarkOpacity?.addEventListener('input', (e) => {
            this.watermark.opacity = parseInt(e.target.value);
            if (watermarkOpacityValue) watermarkOpacityValue.textContent = `${this.watermark.opacity}%`;
            this.notifyChange();
        });
        
        // 位置
        const positionBtns = document.querySelectorAll('.pos-btn');
        
        positionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                positionBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.watermark.position = btn.dataset.pos;
                this.notifyChange();
            });
        });
    }

    /**
     * 绑定裁剪事件
     */
    bindCropEvents() {
        const cropModal = document.getElementById('cropModal');
        const closeCropModal = document.getElementById('closeCropModal');
        const cancelCrop = document.getElementById('cancelCrop');
        const confirmCrop = document.getElementById('confirmCrop');
        const cropPresetBtns = document.querySelectorAll('.crop-preset-btn');
        
        // 关闭裁剪模态框
        const closeModal = () => {
            cropModal?.classList.remove('active');
            this.cropData.active = false;
            this.cropData.isDragging = false;
            this.cropData.isResizing = false;
            
            // 移除全局事件监听
            document.removeEventListener('mousemove', this.handleCropMouseMove);
            document.removeEventListener('mouseup', this.handleCropMouseUp);
        };
        
        closeCropModal?.addEventListener('click', closeModal);
        cancelCrop?.addEventListener('click', closeModal);
        cropModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
        
        // 确认裁剪
        confirmCrop?.addEventListener('click', () => {
            this.applyCrop();
            closeModal();
        });
        
        // 裁剪比例预设
        cropPresetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                cropPresetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.cropData.ratio = btn.dataset.ratio;
                this.updateCropBox();
            });
        });
        
        // 裁剪框拖拽
        this.initCropBoxInteraction();
    }

    /**
     * 打开裁剪模态框
     */
    openCropModal() {
        const image = this.imageManager?.getSelectedImage();
        if (!image) {
            window.app?.showToast('请先选择一张图片', 'error');
            return;
        }
        
        const cropModal = document.getElementById('cropModal');
        const cropImage = document.getElementById('cropImage');
        const cropContainer = document.getElementById('cropContainer');
        
        if (!cropImage || !cropModal || !cropContainer) return;
        
        // 重置裁剪比例选择
        document.querySelectorAll('.crop-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === 'free');
        });
        this.cropData.ratio = 'free';
        
        // 先显示模态框
        cropModal.classList.add('active');
        
        // 创建新图片对象来确保正确加载
        const tempImg = new Image();
        tempImg.onload = () => {
            cropImage.src = image.dataUrl;
            
            // 使用 requestAnimationFrame 确保 DOM 更新完成
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.initializeCropBox(cropImage, cropContainer, image);
                });
            });
        };
        tempImg.src = image.dataUrl;
    }
    
    /**
     * 初始化裁剪框
     */
    initializeCropBox(cropImage, cropContainer, image) {
        const imgRect = cropImage.getBoundingClientRect();
        const containerRect = cropContainer.getBoundingClientRect();
        
        // 计算图片在容器中的位置
        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;
        
        // 初始化裁剪框 - 占据图片 80% 区域
        const margin = Math.min(imgWidth, imgHeight) * 0.1;
        
        this.cropData = {
            ...this.cropData,
            active: true,
            imageIndex: this.imageManager.selectedIndex,
            originalWidth: image.width,
            originalHeight: image.height,
            imageLeft: imgLeft,
            imageTop: imgTop,
            imageWidth: imgWidth,
            imageHeight: imgHeight,
            box: {
                x: imgLeft + margin,
                y: imgTop + margin,
                width: Math.max(50, imgWidth - margin * 2),
                height: Math.max(50, imgHeight - margin * 2)
            },
            startBox: null,
            startX: 0,
            startY: 0,
            isDragging: false,
            isResizing: false,
            handleType: null
        };
        
        this.renderCropBox();
        
        // 添加全局事件监听
        document.addEventListener('mousemove', this.handleCropMouseMove);
        document.addEventListener('mouseup', this.handleCropMouseUp);
    }

    /**
     * 渲染裁剪框
     */
    renderCropBox() {
        const cropBox = document.getElementById('cropBox');
        if (!cropBox) return;
        
        const { x, y, width, height } = this.cropData.box;
        
        cropBox.style.left = `${x}px`;
        cropBox.style.top = `${y}px`;
        cropBox.style.width = `${width}px`;
        cropBox.style.height = `${height}px`;
    }

    /**
     * 初始化裁剪框交互
     */
    initCropBoxInteraction() {
        const cropBox = document.getElementById('cropBox');
        if (!cropBox) return;
        
        // 裁剪框拖拽
        cropBox.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('crop-handle')) return;
            if (!this.cropData.active) return;
            
            this.cropData.isDragging = true;
            this.cropData.startX = e.clientX;
            this.cropData.startY = e.clientY;
            this.cropData.startBox = { ...this.cropData.box };
            
            e.preventDefault();
        });
        
        // 手柄缩放
        cropBox.querySelectorAll('.crop-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (!this.cropData.active) return;
                
                this.cropData.isResizing = true;
                this.cropData.handleType = handle.dataset.handle;
                this.cropData.startX = e.clientX;
                this.cropData.startY = e.clientY;
                this.cropData.startBox = { ...this.cropData.box };
                
                e.stopPropagation();
                e.preventDefault();
            });
        });
    }
    
    /**
     * 处理裁剪框鼠标移动
     */
    handleCropMouseMove(e) {
        if (!this.cropData.active) return;
        if (!this.cropData.startBox) return;
        
        const dx = e.clientX - this.cropData.startX;
        const dy = e.clientY - this.cropData.startY;
        
        if (this.cropData.isDragging) {
            this.cropData.box.x = this.clamp(
                this.cropData.startBox.x + dx,
                this.cropData.imageLeft,
                this.cropData.imageLeft + this.cropData.imageWidth - this.cropData.box.width
            );
            this.cropData.box.y = this.clamp(
                this.cropData.startBox.y + dy,
                this.cropData.imageTop,
                this.cropData.imageTop + this.cropData.imageHeight - this.cropData.box.height
            );
            
            this.renderCropBox();
        }
        
        if (this.cropData.isResizing) {
            this.resizeCropBox(dx, dy, this.cropData.startBox);
        }
    }
    
    /**
     * 处理裁剪框鼠标释放
     */
    handleCropMouseUp() {
        this.cropData.isDragging = false;
        this.cropData.isResizing = false;
        this.cropData.handleType = null;
    }

    /**
     * 缩放裁剪框
     */
    resizeCropBox(dx, dy, startBox) {
        const handle = this.cropData.handleType;
        if (!handle) return;
        
        const minSize = 50;
        let newBox = { ...startBox };
        
        // 根据手柄类型调整
        if (handle.includes('e')) {
            newBox.width = Math.max(minSize, startBox.width + dx);
        }
        if (handle.includes('w')) {
            const newWidth = Math.max(minSize, startBox.width - dx);
            newBox.x = startBox.x + startBox.width - newWidth;
            newBox.width = newWidth;
        }
        if (handle.includes('s')) {
            newBox.height = Math.max(minSize, startBox.height + dy);
        }
        if (handle.includes('n')) {
            const newHeight = Math.max(minSize, startBox.height - dy);
            newBox.y = startBox.y + startBox.height - newHeight;
            newBox.height = newHeight;
        }
        
        // 处理比例锁定
        if (this.cropData.ratio !== 'free') {
            const [ratioW, ratioH] = this.cropData.ratio.split(':').map(Number);
            const aspectRatio = ratioW / ratioH;
            
            if (handle.includes('e') || handle.includes('w')) {
                newBox.height = newBox.width / aspectRatio;
            } else {
                newBox.width = newBox.height * aspectRatio;
            }
        }
        
        // 边界检查
        newBox.x = this.clamp(newBox.x, this.cropData.imageLeft, this.cropData.imageLeft + this.cropData.imageWidth - minSize);
        newBox.y = this.clamp(newBox.y, this.cropData.imageTop, this.cropData.imageTop + this.cropData.imageHeight - minSize);
        newBox.width = Math.min(newBox.width, this.cropData.imageLeft + this.cropData.imageWidth - newBox.x);
        newBox.height = Math.min(newBox.height, this.cropData.imageTop + this.cropData.imageHeight - newBox.y);
        
        this.cropData.box = newBox;
        this.renderCropBox();
    }

    /**
     * 更新裁剪框比例
     */
    updateCropBox() {
        if (this.cropData.ratio === 'free') return;
        
        const [ratioW, ratioH] = this.cropData.ratio.split(':').map(Number);
        const aspectRatio = ratioW / ratioH;
        
        // 根据当前框大小计算新尺寸
        const currentRatio = this.cropData.box.width / this.cropData.box.height;
        
        if (currentRatio > aspectRatio) {
            this.cropData.box.width = this.cropData.box.height * aspectRatio;
        } else {
            this.cropData.box.height = this.cropData.box.width / aspectRatio;
        }
        
        // 确保在边界内
        this.cropData.box.width = Math.min(
            this.cropData.box.width,
            this.cropData.imageWidth - (this.cropData.box.x - this.cropData.imageLeft)
        );
        this.cropData.box.height = Math.min(
            this.cropData.box.height,
            this.cropData.imageHeight - (this.cropData.box.y - this.cropData.imageTop)
        );
        
        this.renderCropBox();
    }

    /**
     * 应用裁剪
     */
    applyCrop() {
        const image = this.imageManager?.images[this.cropData.imageIndex];
        if (!image) return;
        
        // 计算裁剪区域在原图中的位置
        const originalWidth = this.cropData.originalWidth || image.width;
        const originalHeight = this.cropData.originalHeight || image.height;
        
        const scaleX = originalWidth / this.cropData.imageWidth;
        const scaleY = originalHeight / this.cropData.imageHeight;
        
        // 计算相对于图片的位置
        const relativeX = this.cropData.box.x - this.cropData.imageLeft;
        const relativeY = this.cropData.box.y - this.cropData.imageTop;
        
        const cropX = relativeX * scaleX;
        const cropY = relativeY * scaleY;
        const cropWidth = this.cropData.box.width * scaleX;
        const cropHeight = this.cropData.box.height * scaleY;
        
        // 确保值在有效范围内
        const finalCropX = Math.max(0, Math.min(Math.round(cropX), originalWidth - 1));
        const finalCropY = Math.max(0, Math.min(Math.round(cropY), originalHeight - 1));
        const finalCropWidth = Math.max(1, Math.min(Math.round(cropWidth), originalWidth - finalCropX));
        const finalCropHeight = Math.max(1, Math.min(Math.round(cropHeight), originalHeight - finalCropY));
        
        this.imageManager.updateImage(this.cropData.imageIndex, {
            cropX: finalCropX,
            cropY: finalCropY,
            cropWidth: finalCropWidth,
            cropHeight: finalCropHeight
        });
        
        this.notifyChange();
        window.app?.showToast('裁剪已应用', 'success');
    }

    /**
     * 辅助函数：限制值在范围内
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * 获取滤镜 CSS
     */
    getFilterCSS(image) {
        if (!image) return 'none';
        
        const filters = [];
        const filter = image.filter || 'none';
        
        // 预设滤镜
        switch (filter) {
            case 'grayscale':
                filters.push('grayscale(100%)');
                break;
            case 'sepia':
                filters.push('sepia(100%)');
                break;
            case 'vintage':
                filters.push('sepia(50%)', 'contrast(90%)', 'brightness(90%)');
                break;
            case 'cold':
                filters.push('saturate(80%)', 'hue-rotate(180deg)');
                break;
            case 'warm':
                filters.push('saturate(120%)', 'sepia(20%)');
                break;
        }
        
        // 自定义调整
        const brightness = image.brightness ?? 100;
        const contrast = image.contrast ?? 100;
        const saturation = image.saturation ?? 100;
        
        if (brightness !== 100) {
            filters.push(`brightness(${brightness}%)`);
        }
        if (contrast !== 100) {
            filters.push(`contrast(${contrast}%)`);
        }
        if (saturation !== 100) {
            filters.push(`saturate(${saturation}%)`);
        }
        
        return filters.length > 0 ? filters.join(' ') : 'none';
    }

    /**
     * 获取水印设置
     */
    getWatermarkSettings() {
        return { ...this.watermark };
    }

    /**
     * 通知编辑变化
     */
    notifyChange() {
        if (this.onEditChange) {
            this.onEditChange();
        }
    }
}

// 导出为全局变量
window.Editor = Editor;
