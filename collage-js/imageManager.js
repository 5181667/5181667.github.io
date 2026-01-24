/**
 * 图片管理器模块
 * 负责图片的上传、存储、排序和管理
 */
class ImageManager {
    constructor() {
        this.images = [];
        this.selectedIndex = -1;
        this.draggedIndex = -1;
        this.onImagesChange = null;
        this.onSelectionChange = null;
        
        this.maxImages = 20;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    }

    /**
     * 初始化图片管理器
     */
    init() {
        this.bindUploadEvents();
        this.bindListEvents();
    }

    /**
     * 绑定上传相关事件
     */
    bindUploadEvents() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const btnUploadMain = document.getElementById('btnUploadMain');
        const canvasContainer = document.getElementById('canvasContainer');

        // 点击上传区域
        uploadZone?.addEventListener('click', () => fileInput?.click());
        btnUploadMain?.addEventListener('click', () => fileInput?.click());

        // 文件选择
        fileInput?.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            fileInput.value = ''; // 重置以便重复选择同一文件
        });

        // 拖拽上传 - 上传区域
        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
        });

        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // 拖拽上传 - 画布区域
        canvasContainer?.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvasContainer.classList.add('drag-over');
        });

        canvasContainer?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            canvasContainer.classList.remove('drag-over');
        });

        canvasContainer?.addEventListener('drop', (e) => {
            e.preventDefault();
            canvasContainer.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    /**
     * 绑定图片列表事件
     */
    bindListEvents() {
        const imageList = document.getElementById('imageList');
        
        imageList?.addEventListener('click', (e) => {
            const item = e.target.closest('.image-item');
            const deleteBtn = e.target.closest('.image-item-delete');
            
            if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                this.removeImage(index);
                return;
            }
            
            if (item) {
                const index = parseInt(item.dataset.index);
                this.selectImage(index);
            }
        });

        // 拖拽排序
        imageList?.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.image-item');
            if (item) {
                this.draggedIndex = parseInt(item.dataset.index);
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        imageList?.addEventListener('dragend', (e) => {
            const item = e.target.closest('.image-item');
            if (item) {
                item.classList.remove('dragging');
                this.draggedIndex = -1;
            }
        });

        imageList?.addEventListener('dragover', (e) => {
            e.preventDefault();
            const item = e.target.closest('.image-item');
            if (item && this.draggedIndex !== -1) {
                const targetIndex = parseInt(item.dataset.index);
                if (targetIndex !== this.draggedIndex) {
                    this.moveImage(this.draggedIndex, targetIndex);
                    this.draggedIndex = targetIndex;
                }
            }
        });
    }

    /**
     * 处理上传的文件
     */
    async handleFiles(files) {
        const validFiles = [];
        
        for (const file of files) {
            // 检查文件类型
            if (!this.allowedTypes.includes(file.type)) {
                window.app?.showToast(`不支持的文件格式: ${file.name}`, 'error');
                continue;
            }
            
            // 检查文件大小
            if (file.size > this.maxFileSize) {
                window.app?.showToast(`文件过大: ${file.name} (最大 10MB)`, 'error');
                continue;
            }
            
            // 检查数量限制
            if (this.images.length + validFiles.length >= this.maxImages) {
                window.app?.showToast(`最多上传 ${this.maxImages} 张图片`, 'error');
                break;
            }
            
            validFiles.push(file);
        }
        
        // 加载有效文件
        for (const file of validFiles) {
            await this.loadImage(file);
        }
        
        if (validFiles.length > 0) {
            window.app?.showToast(`已添加 ${validFiles.length} 张图片`, 'success');
        }
    }

    /**
     * 加载单张图片
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const imageData = {
                        id: this.generateId(),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        width: img.width,
                        height: img.height,
                        dataUrl: e.target.result,
                        element: img,
                        // 编辑属性
                        rotation: 0,
                        flipH: false,
                        flipV: false,
                        scale: 100,
                        filter: 'none',
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        // 裁剪属性
                        cropX: 0,
                        cropY: 0,
                        cropWidth: img.width,
                        cropHeight: img.height,
                        // 自由布局属性
                        x: 0,
                        y: 0,
                        displayWidth: 200,
                        displayHeight: 200 * (img.height / img.width)
                    };
                    
                    this.images.push(imageData);
                    this.renderList();
                    this.notifyChange();
                    resolve(imageData);
                };
                
                img.onerror = () => {
                    window.app?.showToast(`图片加载失败: ${file.name}`, 'error');
                    reject(new Error('Failed to load image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                window.app?.showToast(`文件读取失败: ${file.name}`, 'error');
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * 渲染图片列表
     */
    renderList() {
        const imageList = document.getElementById('imageList');
        if (!imageList) return;
        
        if (this.images.length === 0) {
            imageList.innerHTML = '';
            return;
        }
        
        imageList.innerHTML = this.images.map((img, index) => `
            <div class="image-item ${index === this.selectedIndex ? 'selected' : ''}" 
                 data-index="${index}" 
                 draggable="true">
                <img class="image-item-thumb" src="${img.dataUrl}" alt="${img.name}">
                <div class="image-item-info">
                    <div class="image-item-name" title="${img.name}">${img.name}</div>
                    <div class="image-item-size">${img.width}×${img.height} · ${this.formatFileSize(img.size)}</div>
                </div>
                <button class="image-item-delete" data-index="${index}" title="删除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `).join('');
        
        // 更新空状态
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.classList.toggle('hidden', this.images.length > 0);
        }
    }

    /**
     * 选择图片
     */
    selectImage(index) {
        if (index < -1 || index >= this.images.length) return;
        
        this.selectedIndex = index;
        this.renderList();
        
        if (this.onSelectionChange) {
            this.onSelectionChange(this.getSelectedImage(), index);
        }
    }

    /**
     * 获取选中的图片
     */
    getSelectedImage() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.images.length) {
            return this.images[this.selectedIndex];
        }
        return null;
    }

    /**
     * 移除图片
     */
    removeImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.images.splice(index, 1);
        
        // 调整选中索引
        if (this.selectedIndex === index) {
            this.selectedIndex = -1;
            if (this.onSelectionChange) {
                this.onSelectionChange(null, -1);
            }
        } else if (this.selectedIndex > index) {
            this.selectedIndex--;
        }
        
        this.renderList();
        this.notifyChange();
    }

    /**
     * 移动图片位置
     */
    moveImage(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.images.length) return;
        if (toIndex < 0 || toIndex >= this.images.length) return;
        if (fromIndex === toIndex) return;
        
        const [removed] = this.images.splice(fromIndex, 1);
        this.images.splice(toIndex, 0, removed);
        
        // 更新选中索引
        if (this.selectedIndex === fromIndex) {
            this.selectedIndex = toIndex;
        } else if (fromIndex < this.selectedIndex && toIndex >= this.selectedIndex) {
            this.selectedIndex--;
        } else if (fromIndex > this.selectedIndex && toIndex <= this.selectedIndex) {
            this.selectedIndex++;
        }
        
        this.renderList();
        this.notifyChange();
    }

    /**
     * 更新图片属性
     */
    updateImage(index, props) {
        if (index < 0 || index >= this.images.length) return;
        
        Object.assign(this.images[index], props);
        this.notifyChange();
    }

    /**
     * 更新选中图片属性
     */
    updateSelectedImage(props) {
        if (this.selectedIndex >= 0) {
            this.updateImage(this.selectedIndex, props);
        }
    }

    /**
     * 通知图片变化
     */
    notifyChange() {
        if (this.onImagesChange) {
            this.onImagesChange(this.images);
        }
    }

    /**
     * 清空所有图片
     */
    clearAll() {
        this.images = [];
        this.selectedIndex = -1;
        this.renderList();
        this.notifyChange();
        
        if (this.onSelectionChange) {
            this.onSelectionChange(null, -1);
        }
    }

    /**
     * 获取所有图片
     */
    getImages() {
        return this.images;
    }

    /**
     * 获取图片数量
     */
    getCount() {
        return this.images.length;
    }

    /**
     * 检查是否有图片
     */
    hasImages() {
        return this.images.length > 0;
    }
}

// 导出为全局变量
window.ImageManager = ImageManager;
