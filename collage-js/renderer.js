/**
 * Canvas 渲染器模块
 * 负责将图片绘制到画布上并支持实时预览
 */
class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.imageManager = null;
        this.layoutEngine = null;
        this.editor = null;
        
        // 缩放和平移
        this.zoom = 1;
        this.minZoom = 0.25;
        this.maxZoom = 3;
        
        // 渲染状态
        this.isRendering = false;
        this.renderQueue = null;
        
        // 离屏画布用于滤镜处理
        this.offscreenCanvas = null;
        this.offscreenCtx = null;
    }

    /**
     * 初始化渲染器
     */
    init(imageManager, layoutEngine, editor) {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.imageManager = imageManager;
        this.layoutEngine = layoutEngine;
        this.editor = editor;
        
        // 创建离屏画布
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        this.bindZoomEvents();
        
        // 初始画布大小
        this.updateCanvasSize(800, 800);
    }

    /**
     * 绑定缩放事件
     */
    bindZoomEvents() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const zoomFit = document.getElementById('zoomFit');
        
        zoomIn?.addEventListener('click', () => {
            this.setZoom(this.zoom + 0.25);
        });
        
        zoomOut?.addEventListener('click', () => {
            this.setZoom(this.zoom - 0.25);
        });
        
        zoomFit?.addEventListener('click', () => {
            this.fitToView();
        });
        
        // 滚轮缩放
        const canvasContainer = document.getElementById('canvasContainer');
        canvasContainer?.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.setZoom(this.zoom + delta);
            }
        }, { passive: false });
    }

    /**
     * 设置缩放级别
     */
    setZoom(zoom) {
        this.zoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
        
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
        }
        
        // 将缩放应用于 canvas-wrapper（包含 canvas 和 overlay）
        const wrapper = this.canvas?.parentElement;
        if (wrapper && wrapper.classList.contains('canvas-wrapper')) {
            wrapper.style.transform = `scale(${this.zoom})`;
            wrapper.style.transformOrigin = 'center center';
        } else if (this.canvas) {
            this.canvas.style.transform = `scale(${this.zoom})`;
            this.canvas.style.transformOrigin = 'center center';
        }
    }

    /**
     * 适应视图
     */
    fitToView() {
        const container = document.getElementById('canvasContainer');
        if (!container || !this.canvas) return;
        
        const containerWidth = container.clientWidth - 48;
        const containerHeight = container.clientHeight - 48;
        
        const scaleX = containerWidth / this.canvas.width;
        const scaleY = containerHeight / this.canvas.height;
        
        this.setZoom(Math.min(scaleX, scaleY, 1));
    }

    /**
     * 更新画布尺寸
     */
    updateCanvasSize(width, height) {
        if (!this.canvas) return;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * 主渲染函数
     */
    render() {
        // 防止重复渲染
        if (this.isRendering) {
            this.renderQueue = true;
            return;
        }
        
        this.isRendering = true;
        
        requestAnimationFrame(() => {
            this.performRender();
            this.isRendering = false;
            
            // 处理排队的渲染请求
            if (this.renderQueue) {
                this.renderQueue = false;
                this.render();
            }
        });
    }

    /**
     * 执行渲染
     */
    performRender() {
        if (!this.canvas || !this.ctx) return;
        
        const images = this.imageManager?.getImages() || [];
        const settings = this.layoutEngine?.getSettings() || {};
        
        // 计算布局
        const layout = this.layoutEngine?.calculateLayout(images) || {
            width: 800,
            height: 800,
            positions: []
        };
        
        // 更新画布尺寸
        this.updateCanvasSize(layout.width, layout.height);
        
        // 清空画布
        this.ctx.fillStyle = settings.backgroundColor || '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制图片
        layout.positions.forEach((pos, index) => {
            if (!pos || !pos.visible) return;
            
            const image = images[index];
            if (!image || !image.element) return;
            
            try {
                this.drawImage(image, pos, settings);
            } catch (err) {
                console.error('绘制图片错误:', err);
            }
        });
        
        // 绘制水印
        this.drawWatermark();
        
        // 更新自由布局交互层（只在自由模式下）
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) {
            // 同步 overlay 尺寸与 canvas
            overlay.style.width = `${this.canvas.width}px`;
            overlay.style.height = `${this.canvas.height}px`;
            
            if (settings.mode === 'free' && images.length > 0) {
                this.layoutEngine?.initFreeLayoutInteraction(
                    this.canvas, 
                    images, 
                    this.imageManager
                );
            } else {
                // 清理自由布局事件和元素
                this.layoutEngine?.cleanupFreeLayoutEvents();
            }
        }
    }

    /**
     * 绘制单张图片
     */
    drawImage(image, position, settings) {
        if (!image || !position) return;
        
        const { x, y, width, height } = position;
        const borderRadius = settings.borderRadius || 0;
        
        // 验证参数
        if (width <= 0 || height <= 0) return;
        
        this.ctx.save();
        
        // 创建圆角裁剪路径
        if (borderRadius > 0) {
            this.ctx.beginPath();
            this.roundRect(x, y, width, height, borderRadius);
            this.ctx.clip();
        }
        
        // 处理变换
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        this.ctx.translate(centerX, centerY);
        
        // 旋转
        const rotation = image.rotation || 0;
        if (rotation !== 0) {
            this.ctx.rotate((rotation * Math.PI) / 180);
        }
        
        // 翻转
        const scaleX = image.flipH ? -1 : 1;
        const scaleY = image.flipV ? -1 : 1;
        this.ctx.scale(scaleX, scaleY);
        
        this.ctx.translate(-centerX, -centerY);
        
        // 应用滤镜到离屏画布
        const filteredImage = this.applyFilters(image);
        
        // 计算绘制尺寸
        const scale = (image.scale || 100) / 100;
        const drawWidth = width * scale;
        const drawHeight = height * scale;
        const drawX = x + (width - drawWidth) / 2;
        const drawY = y + (height - drawHeight) / 2;
        
        // 获取裁剪参数
        const cropX = image.cropX || 0;
        const cropY = image.cropY || 0;
        const cropWidth = image.cropWidth || image.width;
        const cropHeight = image.cropHeight || image.height;
        
        // 绘制图片
        try {
            this.ctx.drawImage(
                filteredImage,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );
        } catch (err) {
            console.error('drawImage 错误:', err);
        }
        
        this.ctx.restore();
    }

    /**
     * 应用滤镜
     */
    applyFilters(image) {
        if (!image || !image.element) return image?.element;
        
        const filter = image.filter || 'none';
        const brightness = image.brightness ?? 100;
        const contrast = image.contrast ?? 100;
        const saturation = image.saturation ?? 100;
        
        // 如果没有滤镜效果，直接返回原图
        if (filter === 'none' && 
            brightness === 100 && 
            contrast === 100 && 
            saturation === 100) {
            return image.element;
        }
        
        // 确保离屏画布存在
        if (!this.offscreenCanvas || !this.offscreenCtx) {
            return image.element;
        }
        
        // 设置离屏画布尺寸
        this.offscreenCanvas.width = image.width;
        this.offscreenCanvas.height = image.height;
        
        // 清空离屏画布
        this.offscreenCtx.clearRect(0, 0, image.width, image.height);
        
        // 应用 CSS 滤镜
        const filterCSS = this.editor?.getFilterCSS(image) || 'none';
        this.offscreenCtx.filter = filterCSS;
        
        // 绘制到离屏画布
        try {
            this.offscreenCtx.drawImage(image.element, 0, 0);
        } catch (err) {
            console.error('离屏绘制错误:', err);
            return image.element;
        }
        
        // 重置滤镜
        this.offscreenCtx.filter = 'none';
        
        return this.offscreenCanvas;
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(x, y, width, height, radius) {
        radius = Math.min(radius, width / 2, height / 2);
        
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * 绘制水印
     */
    drawWatermark() {
        if (!this.ctx || !this.canvas) return;
        
        const watermark = this.editor?.getWatermarkSettings();
        if (!watermark || !watermark.text || watermark.text.trim() === '') return;
        
        this.ctx.save();
        
        // 设置字体
        this.ctx.font = `${watermark.size}px "Noto Sans SC", sans-serif`;
        this.ctx.fillStyle = watermark.color;
        this.ctx.globalAlpha = watermark.opacity / 100;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 计算位置
        const { x, y } = this.getWatermarkPosition(watermark);
        
        // 绘制阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // 绘制文字
        this.ctx.fillText(watermark.text, x, y);
        
        this.ctx.restore();
    }

    /**
     * 计算水印位置
     */
    getWatermarkPosition(watermark) {
        const padding = 30;
        const width = this.canvas?.width || 800;
        const height = this.canvas?.height || 800;
        
        const positions = {
            'top-left': { x: padding + 50, y: padding },
            'top-center': { x: width / 2, y: padding },
            'top-right': { x: width - padding - 50, y: padding },
            'center-left': { x: padding + 50, y: height / 2 },
            'center': { x: width / 2, y: height / 2 },
            'center-right': { x: width - padding - 50, y: height / 2 },
            'bottom-left': { x: padding + 50, y: height - padding },
            'bottom-center': { x: width / 2, y: height - padding },
            'bottom-right': { x: width - padding - 50, y: height - padding }
        };
        
        return positions[watermark.position] || positions['center'];
    }

    /**
     * 导出图片
     */
    exportImage(format = 'png', quality = 0.9, width = null, height = null) {
        return new Promise((resolve, reject) => {
            if (!this.canvas) {
                reject(new Error('Canvas not initialized'));
                return;
            }
            
            try {
                // 创建导出画布
                const exportCanvas = document.createElement('canvas');
                const exportCtx = exportCanvas.getContext('2d');
                
                // 设置尺寸
                const targetWidth = width || this.canvas.width;
                const targetHeight = height || this.canvas.height;
                
                exportCanvas.width = targetWidth;
                exportCanvas.height = targetHeight;
                
                // 如果需要缩放
                if (width && height) {
                    exportCtx.drawImage(this.canvas, 0, 0, targetWidth, targetHeight);
                } else {
                    exportCtx.drawImage(this.canvas, 0, 0);
                }
                
                // 导出
                const mimeType = format === 'png' ? 'image/png' : 
                                format === 'jpeg' ? 'image/jpeg' : 'image/webp';
                
                const dataUrl = exportCanvas.toDataURL(mimeType, quality);
                resolve(dataUrl);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * 获取当前画布尺寸
     */
    getCanvasSize() {
        return {
            width: this.canvas?.width || 800,
            height: this.canvas?.height || 800
        };
    }

    /**
     * 预估文件大小
     */
    estimateFileSize(format, quality) {
        if (!this.canvas) return 0;
        
        try {
            const dataUrl = this.canvas.toDataURL(
                format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp',
                quality
            );
            
            // 计算 base64 编码后的实际大小
            const base64Length = dataUrl.split(',')[1]?.length || 0;
            const bytes = Math.round(base64Length * 0.75);
            
            return bytes;
        } catch (err) {
            console.error('估算文件大小错误:', err);
            return 0;
        }
    }
}

// 导出为全局变量
window.Renderer = Renderer;
