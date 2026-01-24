/**
 * 布局引擎模块
 * 负责计算图片在画布上的位置和大小
 */
class LayoutEngine {
    constructor() {
        this.mode = 'grid'; // grid, horizontal, vertical, free
        this.gridCols = 2;
        this.gridRows = 2;
        this.gap = 10;
        this.borderRadius = 8;
        this.backgroundColor = '#f8fafc';
        
        // 画布尺寸
        this.canvasWidth = 800;
        this.canvasHeight = 800;
        
        // 相纸尺寸预设 (毫米转像素，300DPI)
        this.paperSizes = {
            'custom': { name: '自定义', width: 800, height: 800 },
            '1inch': { name: '1寸 (25×35mm)', width: 295, height: 413 },
            '2inch': { name: '2寸 (35×49mm)', width: 413, height: 579 },
            '3inch': { name: '3寸 (55×84mm)', width: 649, height: 991 },
            '4inch': { name: '4寸 (76×102mm)', width: 898, height: 1205 },
            '5inch': { name: '5寸 (89×127mm)', width: 1051, height: 1500 },
            '6inch': { name: '6寸 (102×152mm)', width: 1205, height: 1795 },
            '7inch': { name: '7寸 (127×178mm)', width: 1500, height: 2102 },
            '8inch': { name: '8寸 (152×203mm)', width: 1795, height: 2398 },
            'a4': { name: 'A4 (210×297mm)', width: 2480, height: 3508 },
            'a5': { name: 'A5 (148×210mm)', width: 1748, height: 2480 },
            '4x6': { name: '4×6英寸', width: 1200, height: 1800 },
            '5x7': { name: '5×7英寸', width: 1500, height: 2100 },
            'square': { name: '正方形 (800×800)', width: 800, height: 800 },
            'instagram': { name: 'Instagram (1080×1080)', width: 1080, height: 1080 },
            'story': { name: 'Story (1080×1920)', width: 1080, height: 1920 }
        };
        this.currentPaper = 'custom';
        
        // 自由布局选中状态
        this.freeSelectedIndex = -1;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // 存储事件处理器引用，用于清理
        this.freeLayoutHandlers = new Map();
        
        this.onLayoutChange = null;
    }

    /**
     * 初始化布局引擎
     */
    init() {
        this.bindLayoutModeEvents();
        this.bindGridPresetEvents();
        this.bindCanvasSettingsEvents();
        this.bindCustomGridEvents();
        this.bindPaperSizeEvents();
    }

    /**
     * 绑定布局模式切换事件
     */
    bindLayoutModeEvents() {
        const layoutBtns = document.querySelectorAll('.layout-btn');
        
        layoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                layoutBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.mode = btn.dataset.layout;
                this.updateGridPresetsVisibility();
                this.notifyChange();
            });
        });
    }

    /**
     * 绑定网格预设事件
     */
    bindGridPresetEvents() {
        const presetBtns = document.querySelectorAll('.preset-btn');
        
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.gridCols = parseInt(btn.dataset.cols);
                this.gridRows = parseInt(btn.dataset.rows);
                
                // 同步更新自定义输入框
                const colsInput = document.getElementById('customCols');
                const rowsInput = document.getElementById('customRows');
                if (colsInput) colsInput.value = this.gridCols;
                if (rowsInput) rowsInput.value = this.gridRows;
                
                this.notifyChange();
            });
        });
    }
    
    /**
     * 绑定自定义网格输入事件
     */
    bindCustomGridEvents() {
        const colsInput = document.getElementById('customCols');
        const rowsInput = document.getElementById('customRows');
        
        const updateGrid = () => {
            const cols = parseInt(colsInput?.value) || 2;
            const rows = parseInt(rowsInput?.value) || 2;
            
            // 限制范围
            this.gridCols = Math.max(1, Math.min(10, cols));
            this.gridRows = Math.max(1, Math.min(10, rows));
            
            // 更新输入框显示
            if (colsInput) colsInput.value = this.gridCols;
            if (rowsInput) rowsInput.value = this.gridRows;
            
            // 取消预设按钮选中状态
            document.querySelectorAll('.preset-btn').forEach(btn => {
                const btnCols = parseInt(btn.dataset.cols);
                const btnRows = parseInt(btn.dataset.rows);
                btn.classList.toggle('active', btnCols === this.gridCols && btnRows === this.gridRows);
            });
            
            this.notifyChange();
        };
        
        colsInput?.addEventListener('change', updateGrid);
        rowsInput?.addEventListener('change', updateGrid);
        colsInput?.addEventListener('input', updateGrid);
        rowsInput?.addEventListener('input', updateGrid);
    }
    
    /**
     * 绑定相纸尺寸事件
     */
    bindPaperSizeEvents() {
        const paperSelect = document.getElementById('paperSize');
        const customWidthInput = document.getElementById('customWidth');
        const customHeightInput = document.getElementById('customHeight');
        const customSizeGroup = document.getElementById('customSizeGroup');
        
        paperSelect?.addEventListener('change', (e) => {
            const size = e.target.value;
            this.currentPaper = size;
            
            if (size === 'custom') {
                if (customSizeGroup) customSizeGroup.style.display = 'block';
                // 使用当前输入值
                this.canvasWidth = parseInt(customWidthInput?.value) || 800;
                this.canvasHeight = parseInt(customHeightInput?.value) || 800;
            } else {
                if (customSizeGroup) customSizeGroup.style.display = 'none';
                const paper = this.paperSizes[size];
                if (paper) {
                    this.canvasWidth = paper.width;
                    this.canvasHeight = paper.height;
                }
            }
            
            this.notifyChange();
        });
        
        // 自定义尺寸输入
        const updateCustomSize = () => {
            if (this.currentPaper === 'custom') {
                this.canvasWidth = Math.max(100, Math.min(5000, parseInt(customWidthInput?.value) || 800));
                this.canvasHeight = Math.max(100, Math.min(5000, parseInt(customHeightInput?.value) || 800));
                this.notifyChange();
            }
        };
        
        customWidthInput?.addEventListener('change', updateCustomSize);
        customHeightInput?.addEventListener('change', updateCustomSize);
    }

    /**
     * 绑定画布设置事件
     */
    bindCanvasSettingsEvents() {
        // 间距
        const gapSlider = document.getElementById('gapSize');
        const gapValue = document.getElementById('gapValue');
        
        gapSlider?.addEventListener('input', (e) => {
            this.gap = parseInt(e.target.value);
            if (gapValue) gapValue.textContent = `${this.gap}px`;
            this.notifyChange();
        });

        // 圆角
        const radiusSlider = document.getElementById('borderRadius');
        const radiusValue = document.getElementById('radiusValue');
        
        radiusSlider?.addEventListener('input', (e) => {
            this.borderRadius = parseInt(e.target.value);
            if (radiusValue) radiusValue.textContent = `${this.borderRadius}px`;
            this.notifyChange();
        });

        // 背景色
        const bgColorPicker = document.getElementById('bgColor');
        const bgColorValue = document.getElementById('bgColorValue');
        
        bgColorPicker?.addEventListener('input', (e) => {
            this.backgroundColor = e.target.value;
            if (bgColorValue) bgColorValue.textContent = e.target.value;
            this.notifyChange();
        });
    }

    /**
     * 更新网格预设区域显示状态
     */
    updateGridPresetsVisibility() {
        const gridSection = document.getElementById('gridSettingsSection');
        
        if (gridSection) {
            gridSection.style.display = this.mode === 'grid' ? 'block' : 'none';
        }
    }

    /**
     * 计算布局
     * @param {Array} images - 图片数据数组
     * @returns {Object} 布局信息
     */
    calculateLayout(images) {
        if (!images || images.length === 0) {
            return {
                width: this.canvasWidth,
                height: this.canvasHeight,
                positions: []
            };
        }

        switch (this.mode) {
            case 'grid':
                return this.calculateGridLayout(images);
            case 'horizontal':
                return this.calculateHorizontalLayout(images);
            case 'vertical':
                return this.calculateVerticalLayout(images);
            case 'free':
                return this.calculateFreeLayout(images);
            default:
                return this.calculateGridLayout(images);
        }
    }

    /**
     * 计算网格布局
     */
    calculateGridLayout(images) {
        const cellWidth = (this.canvasWidth - this.gap * (this.gridCols + 1)) / this.gridCols;
        const cellHeight = (this.canvasHeight - this.gap * (this.gridRows + 1)) / this.gridRows;
        
        const positions = images.map((img, index) => {
            const col = index % this.gridCols;
            const row = Math.floor(index / this.gridCols);
            
            // 如果超出网格，隐藏
            if (row >= this.gridRows) {
                return {
                    visible: false,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
            }
            
            const x = this.gap + col * (cellWidth + this.gap);
            const y = this.gap + row * (cellHeight + this.gap);
            
            // 获取裁剪后的尺寸
            const cropWidth = img.cropWidth || img.width;
            const cropHeight = img.cropHeight || img.height;
            
            // 计算图片适应单元格的尺寸（保持比例）
            const imgRatio = cropWidth / cropHeight;
            const cellRatio = cellWidth / cellHeight;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (imgRatio > cellRatio) {
                // 图片更宽，以宽度为准
                drawWidth = cellWidth;
                drawHeight = cellWidth / imgRatio;
                drawX = x;
                drawY = y + (cellHeight - drawHeight) / 2;
            } else {
                // 图片更高，以高度为准
                drawHeight = cellHeight;
                drawWidth = cellHeight * imgRatio;
                drawX = x + (cellWidth - drawWidth) / 2;
                drawY = y;
            }
            
            return {
                visible: true,
                x: drawX,
                y: drawY,
                width: drawWidth,
                height: drawHeight,
                cellX: x,
                cellY: y,
                cellWidth: cellWidth,
                cellHeight: cellHeight
            };
        });
        
        return {
            width: this.canvasWidth,
            height: this.canvasHeight,
            positions
        };
    }

    /**
     * 计算水平布局
     */
    calculateHorizontalLayout(images) {
        // 使用画布高度的一部分作为目标高度
        const targetHeight = Math.min(400, this.canvasHeight - this.gap * 2);
        let totalWidth = this.gap;
        
        const positions = images.map((img, index) => {
            const cropWidth = img.cropWidth || img.width;
            const cropHeight = img.cropHeight || img.height;
            const ratio = cropWidth / cropHeight;
            const width = targetHeight * ratio;
            
            const pos = {
                visible: true,
                x: totalWidth,
                y: this.gap,
                width: width,
                height: targetHeight
            };
            
            totalWidth += width + this.gap;
            return pos;
        });
        
        return {
            width: Math.max(totalWidth, this.canvasWidth),
            height: targetHeight + this.gap * 2,
            positions
        };
    }

    /**
     * 计算垂直布局
     */
    calculateVerticalLayout(images) {
        const targetWidth = Math.min(600, this.canvasWidth - this.gap * 2);
        let totalHeight = this.gap;
        
        const positions = images.map((img, index) => {
            const cropWidth = img.cropWidth || img.width;
            const cropHeight = img.cropHeight || img.height;
            const ratio = cropWidth / cropHeight;
            const height = targetWidth / ratio;
            
            const pos = {
                visible: true,
                x: this.gap,
                y: totalHeight,
                width: targetWidth,
                height: height
            };
            
            totalHeight += height + this.gap;
            return pos;
        });
        
        return {
            width: targetWidth + this.gap * 2,
            height: Math.max(totalHeight, this.canvasHeight),
            positions
        };
    }

    /**
     * 计算自由布局
     */
    calculateFreeLayout(images) {
        const positions = images.map((img, index) => {
            return {
                visible: true,
                x: img.x ?? (50 + index * 30),
                y: img.y ?? (50 + index * 30),
                width: img.displayWidth || 200,
                height: img.displayHeight || 200
            };
        });
        
        // 计算包围盒
        let maxX = 0, maxY = 0;
        positions.forEach(pos => {
            maxX = Math.max(maxX, pos.x + pos.width);
            maxY = Math.max(maxY, pos.y + pos.height);
        });
        
        return {
            width: Math.max(this.canvasWidth, maxX + this.gap),
            height: Math.max(this.canvasHeight, maxY + this.gap),
            positions
        };
    }

    /**
     * 设置布局模式
     */
    setMode(mode) {
        if (['grid', 'horizontal', 'vertical', 'free'].includes(mode)) {
            this.mode = mode;
            this.updateGridPresetsVisibility();
            this.notifyChange();
        }
    }

    /**
     * 设置网格尺寸
     */
    setGridSize(cols, rows) {
        this.gridCols = cols;
        this.gridRows = rows;
        this.notifyChange();
    }

    /**
     * 设置间距
     */
    setGap(gap) {
        this.gap = gap;
        this.notifyChange();
    }

    /**
     * 设置画布尺寸
     */
    setCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.notifyChange();
    }

    /**
     * 获取当前设置
     */
    getSettings() {
        return {
            mode: this.mode,
            gridCols: this.gridCols,
            gridRows: this.gridRows,
            gap: this.gap,
            borderRadius: this.borderRadius,
            backgroundColor: this.backgroundColor,
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight
        };
    }

    /**
     * 清理自由布局事件
     */
    cleanupFreeLayoutEvents() {
        // 清理所有已存储的事件处理器
        this.freeLayoutHandlers.forEach((handlers, wrapper) => {
            if (handlers.mouseMove) {
                document.removeEventListener('mousemove', handlers.mouseMove);
            }
            if (handlers.mouseUp) {
                document.removeEventListener('mouseup', handlers.mouseUp);
            }
        });
        this.freeLayoutHandlers.clear();
        
        // 清理 overlay
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) {
            overlay.innerHTML = '';
            overlay.classList.remove('active');
        }
    }

    /**
     * 初始化自由布局交互（只创建交互层，不显示图片）
     */
    initFreeLayoutInteraction(canvas, images, imageManager) {
        const overlay = document.getElementById('canvasOverlay');
        if (!overlay) return;
        
        // 清理之前的事件（但不清空overlay，因为会在下面重建）
        this.freeLayoutHandlers.forEach((handlers) => {
            if (handlers.mouseMove) {
                document.removeEventListener('mousemove', handlers.mouseMove);
            }
            if (handlers.mouseUp) {
                document.removeEventListener('mouseup', handlers.mouseUp);
            }
        });
        this.freeLayoutHandlers.clear();
        
        // 清理现有元素
        overlay.innerHTML = '';
        
        if (this.mode !== 'free' || !images || !images.length) {
            overlay.classList.remove('active');
            return;
        }
        
        overlay.classList.add('active');
        
        // 为每张图片创建可拖拽的交互框（不包含图片，只有边框和手柄）
        images.forEach((img, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'free-image-handle';
            wrapper.dataset.index = index;
            
            const imgX = img.x ?? (50 + index * 30);
            const imgY = img.y ?? (50 + index * 30);
            const imgW = img.displayWidth || 200;
            const imgH = img.displayHeight || 200;
            
            wrapper.style.cssText = `
                position: absolute;
                left: ${imgX}px;
                top: ${imgY}px;
                width: ${imgW}px;
                height: ${imgH}px;
                border: 2px solid transparent;
                border-radius: 8px;
                cursor: move;
                box-sizing: border-box;
                transition: border-color 0.15s, box-shadow 0.15s;
            `;
            
            // 缩放手柄
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle se';
            resizeHandle.style.cssText = `
                position: absolute;
                right: -8px;
                bottom: -8px;
                width: 16px;
                height: 16px;
                background: var(--accent-primary, #06b6d4);
                border: 3px solid white;
                border-radius: 4px;
                cursor: se-resize;
                opacity: 0;
                transition: opacity 0.15s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            wrapper.appendChild(resizeHandle);
            
            overlay.appendChild(wrapper);
            
            // 绑定拖拽事件
            this.bindFreeImageEvents(wrapper, index, imageManager);
        });
    }

    /**
     * 绑定自由布局图片事件
     */
    bindFreeImageEvents(wrapper, index, imageManager) {
        let startX, startY, startLeft, startTop, startWidth, startHeight;
        let isDragging = false;
        let isResizing = false;
        
        // 显示/隐藏手柄
        wrapper.addEventListener('mouseenter', () => {
            wrapper.style.borderColor = 'var(--accent-primary, #06b6d4)';
            wrapper.style.boxShadow = '0 0 0 4px rgba(6, 182, 212, 0.2)';
            const handle = wrapper.querySelector('.resize-handle');
            if (handle) handle.style.opacity = '1';
        });
        
        wrapper.addEventListener('mouseleave', () => {
            if (!wrapper.classList.contains('selected')) {
                wrapper.style.borderColor = 'transparent';
                wrapper.style.boxShadow = 'none';
                const handle = wrapper.querySelector('.resize-handle');
                if (handle) handle.style.opacity = '0';
            }
        });
        
        const onMouseMove = (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const newLeft = Math.max(0, startLeft + dx);
                const newTop = Math.max(0, startTop + dy);
                
                wrapper.style.left = `${newLeft}px`;
                wrapper.style.top = `${newTop}px`;
            }
            
            if (isResizing) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const newWidth = Math.max(50, startWidth + dx);
                const newHeight = Math.max(50, startHeight + dy);
                
                wrapper.style.width = `${newWidth}px`;
                wrapper.style.height = `${newHeight}px`;
            }
        };
        
        const onMouseUp = () => {
            if (isDragging || isResizing) {
                // 更新图片数据
                const newX = parseInt(wrapper.style.left) || 0;
                const newY = parseInt(wrapper.style.top) || 0;
                const newW = parseInt(wrapper.style.width) || 200;
                const newH = parseInt(wrapper.style.height) || 200;
                
                imageManager.updateImage(index, {
                    x: newX,
                    y: newY,
                    displayWidth: newW,
                    displayHeight: newH
                });
            }
            
            isDragging = false;
            isResizing = false;
        };
        
        // 点击选择
        wrapper.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) return;
            
            // 选择图片
            document.querySelectorAll('.free-image-handle').forEach(el => {
                el.classList.remove('selected');
                el.style.borderColor = 'transparent';
                el.style.boxShadow = 'none';
                const h = el.querySelector('.resize-handle');
                if (h) h.style.opacity = '0';
            });
            wrapper.classList.add('selected');
            wrapper.style.borderColor = 'var(--accent-primary, #06b6d4)';
            wrapper.style.boxShadow = '0 0 0 4px rgba(6, 182, 212, 0.2)';
            const handle = wrapper.querySelector('.resize-handle');
            if (handle) handle.style.opacity = '1';
            
            this.freeSelectedIndex = index;
            imageManager.selectImage(index);
            
            // 开始拖拽
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(wrapper.style.left) || 0;
            startTop = parseInt(wrapper.style.top) || 0;
            
            e.preventDefault();
        });
        
        // 缩放手柄
        const resizeHandle = wrapper.querySelector('.resize-handle');
        resizeHandle?.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(wrapper.style.width) || 200;
            startHeight = parseInt(wrapper.style.height) || 200;
            
            e.stopPropagation();
            e.preventDefault();
        });
        
        // 添加全局事件
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // 存储引用以便清理
        this.freeLayoutHandlers.set(wrapper, {
            mouseMove: onMouseMove,
            mouseUp: onMouseUp
        });
    }

    /**
     * 通知布局变化
     */
    notifyChange() {
        if (this.onLayoutChange) {
            this.onLayoutChange(this.getSettings());
        }
    }
}

// 导出为全局变量
window.LayoutEngine = LayoutEngine;
