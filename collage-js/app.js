/**
 * 主应用模块
 * 整合所有模块并管理应用状态
 */
class App {
    constructor() {
        this.imageManager = null;
        this.layoutEngine = null;
        this.editor = null;
        this.renderer = null;
        
        // 导出设置
        this.exportSettings = {
            format: 'png',
            quality: 0.9,
            width: null,
            height: null,
            lockRatio: true
        };
    }

    /**
     * 初始化应用
     */
    init() {
        // 创建模块实例
        this.imageManager = new ImageManager();
        this.layoutEngine = new LayoutEngine();
        this.editor = new Editor();
        this.renderer = new Renderer();
        
        // 初始化各模块
        this.imageManager.init();
        this.layoutEngine.init();
        this.editor.init(this.imageManager);
        this.renderer.init(this.imageManager, this.layoutEngine, this.editor);
        
        // 绑定模块间通信（在 editor.init 之后，以保留 editor 的回调）
        this.bindModuleCommunication();
        
        // 绑定全局事件
        this.bindGlobalEvents();
        
        // 初始渲染
        setTimeout(() => {
            this.renderer.render();
            this.renderer.fitToView();
        }, 100);
        
        console.log('🎨 拼图工坊已启动');
    }

    /**
     * 绑定模块间通信
     */
    bindModuleCommunication() {
        // 保存 editor 设置的选择变化回调
        const editorSelectionCallback = this.imageManager.onSelectionChange;
        
        // 图片变化时重新渲染
        this.imageManager.onImagesChange = (images) => {
            this.renderer.render();
            this.updateGlobalInfo();
        };
        
        // 图片选择变化时，先调用 editor 的回调，再更新渲染
        this.imageManager.onSelectionChange = (image, index) => {
            // 调用 editor 的回调
            if (editorSelectionCallback) {
                editorSelectionCallback(image, index);
            }
            // 渲染器不需要在选择变化时重新渲染整个画布
        };
        
        // 布局变化时重新渲染
        this.layoutEngine.onLayoutChange = (settings) => {
            this.renderer.render();
            this.updateGlobalInfo();
        };
        
        // 编辑变化时重新渲染
        this.editor.onEditChange = () => {
            this.renderer.render();
        };
    }
    
    /**
     * 更新右侧面板的全局信息
     */
    updateGlobalInfo() {
        // 更新画布尺寸
        const canvasSizeInfo = document.getElementById('canvasSizeInfo');
        if (canvasSizeInfo && this.renderer) {
            const { width, height } = this.renderer.getCanvasSize();
            canvasSizeInfo.textContent = `${width} × ${height}`;
        }
        
        // 更新图片数量
        const imageCountInfo = document.getElementById('imageCountInfo');
        if (imageCountInfo && this.imageManager) {
            const count = this.imageManager.getCount();
            imageCountInfo.textContent = `${count} 张`;
        }
        
        // 更新布局模式
        const layoutModeInfo = document.getElementById('layoutModeInfo');
        if (layoutModeInfo && this.layoutEngine) {
            const modeNames = {
                'grid': '网格',
                'horizontal': '水平',
                'vertical': '垂直',
                'free': '自由'
            };
            layoutModeInfo.textContent = modeNames[this.layoutEngine.mode] || '网格';
        }
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 新建项目
        document.getElementById('btnNewProject')?.addEventListener('click', () => {
            this.newProject();
        });
        
        // 导出按钮
        document.getElementById('btnExport')?.addEventListener('click', () => {
            this.openExportModal();
        });
        
        // 导出模态框事件
        this.bindExportModalEvents();
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // 阻止页面拖拽默认行为
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });
        
        // 窗口大小变化时适应视图
        window.addEventListener('resize', () => {
            if (this.renderer) {
                this.renderer.fitToView();
            }
        });
    }

    /**
     * 绑定导出模态框事件
     */
    bindExportModalEvents() {
        const exportModal = document.getElementById('exportModal');
        const closeExportModal = document.getElementById('closeExportModal');
        const cancelExport = document.getElementById('cancelExport');
        const confirmExport = document.getElementById('confirmExport');
        
        // 关闭模态框
        const closeModal = () => {
            exportModal?.classList.remove('active');
        };
        
        closeExportModal?.addEventListener('click', closeModal);
        cancelExport?.addEventListener('click', closeModal);
        exportModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
        
        // 格式选择
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.exportSettings.format = btn.dataset.format;
                
                // PNG 不需要质量设置
                const qualityControl = document.getElementById('qualityControl');
                if (qualityControl) {
                    qualityControl.style.display = btn.dataset.format === 'png' ? 'none' : 'block';
                }
                
                this.updateExportInfo();
            });
        });
        
        // 质量滑块
        const qualitySlider = document.getElementById('exportQuality');
        const qualityValue = document.getElementById('exportQualityValue');
        
        qualitySlider?.addEventListener('input', (e) => {
            this.exportSettings.quality = parseInt(e.target.value) / 100;
            if (qualityValue) qualityValue.textContent = `${e.target.value}%`;
            this.updateExportInfo();
        });
        
        // 尺寸输入
        const widthInput = document.getElementById('exportWidth');
        const heightInput = document.getElementById('exportHeight');
        const lockRatioBtn = document.getElementById('lockRatio');
        
        widthInput?.addEventListener('input', (e) => {
            this.exportSettings.width = parseInt(e.target.value) || null;
            
            if (this.exportSettings.lockRatio && this.exportSettings.width && heightInput) {
                const { width, height } = this.renderer.getCanvasSize();
                const ratio = height / width;
                this.exportSettings.height = Math.round(this.exportSettings.width * ratio);
                heightInput.value = this.exportSettings.height;
            }
            
            this.updateExportInfo();
        });
        
        heightInput?.addEventListener('input', (e) => {
            this.exportSettings.height = parseInt(e.target.value) || null;
            
            if (this.exportSettings.lockRatio && this.exportSettings.height && widthInput) {
                const { width, height } = this.renderer.getCanvasSize();
                const ratio = width / height;
                this.exportSettings.width = Math.round(this.exportSettings.height * ratio);
                widthInput.value = this.exportSettings.width;
            }
            
            this.updateExportInfo();
        });
        
        lockRatioBtn?.addEventListener('click', () => {
            this.exportSettings.lockRatio = !this.exportSettings.lockRatio;
            lockRatioBtn.classList.toggle('active', this.exportSettings.lockRatio);
        });
        
        // 确认导出
        confirmExport?.addEventListener('click', () => {
            this.doExport();
            closeModal();
        });
    }

    /**
     * 新建项目
     */
    newProject() {
        if (this.imageManager?.hasImages()) {
            if (!confirm('确定要清空当前项目吗？所有未保存的更改将丢失。')) {
                return;
            }
        }
        
        // 清理自由布局事件
        this.layoutEngine?.cleanupFreeLayoutEvents();
        
        this.imageManager?.clearAll();
        this.renderer?.render();
        this.showToast('已创建新项目', 'success');
    }

    /**
     * 打开导出模态框
     */
    openExportModal() {
        if (!this.imageManager?.hasImages()) {
            this.showToast('请先添加图片', 'error');
            return;
        }
        
        const exportModal = document.getElementById('exportModal');
        const exportPreviewCanvas = document.getElementById('exportPreviewCanvas');
        const widthInput = document.getElementById('exportWidth');
        const heightInput = document.getElementById('exportHeight');
        
        // 更新预览
        if (exportPreviewCanvas && this.renderer?.canvas) {
            const { width, height } = this.renderer.getCanvasSize();
            
            // 计算预览尺寸
            const maxPreviewSize = 250;
            const scale = Math.min(maxPreviewSize / width, maxPreviewSize / height, 1);
            
            exportPreviewCanvas.width = Math.round(width * scale);
            exportPreviewCanvas.height = Math.round(height * scale);
            
            const ctx = exportPreviewCanvas.getContext('2d');
            ctx.drawImage(this.renderer.canvas, 0, 0, exportPreviewCanvas.width, exportPreviewCanvas.height);
            
            // 设置默认尺寸
            if (widthInput) widthInput.value = width;
            if (heightInput) heightInput.value = height;
            this.exportSettings.width = width;
            this.exportSettings.height = height;
        }
        
        this.updateExportInfo();
        exportModal?.classList.add('active');
    }

    /**
     * 更新导出信息
     */
    updateExportInfo() {
        const exportFileSize = document.getElementById('exportFileSize');
        if (!exportFileSize || !this.renderer) return;
        
        const size = this.renderer.estimateFileSize(
            this.exportSettings.format,
            this.exportSettings.quality
        );
        
        exportFileSize.textContent = `预估大小: ${this.formatFileSize(size)}`;
    }

    /**
     * 执行导出
     */
    async doExport() {
        try {
            this.showToast('正在导出...', 'success');
            
            const dataUrl = await this.renderer.exportImage(
                this.exportSettings.format,
                this.exportSettings.quality,
                this.exportSettings.width,
                this.exportSettings.height
            );
            
            // 创建下载链接
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const ext = this.exportSettings.format === 'jpeg' ? 'jpg' : this.exportSettings.format;
            link.download = `collage_${timestamp}.${ext}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('图片已导出', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('导出失败，请重试', 'error');
        }
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboard(e) {
        // 检查是否在模态框中
        const activeModal = document.querySelector('.modal.active');
        
        // Escape: 关闭模态框
        if (e.key === 'Escape' && activeModal) {
            activeModal.classList.remove('active');
            return;
        }
        
        // 如果正在输入，不处理快捷键
        if (e.target.matches('input, textarea')) {
            return;
        }
        
        // Ctrl/Cmd + N: 新建
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.newProject();
            return;
        }
        
        // Ctrl/Cmd + E: 导出
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.openExportModal();
            return;
        }
        
        // Delete/Backspace: 删除选中图片
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.editor?.deleteSelectedImage();
            return;
        }
        
        // Ctrl/Cmd + +/-: 缩放
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
            this.renderer?.setZoom((this.renderer?.zoom || 1) + 0.25);
            return;
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            e.preventDefault();
            this.renderer?.setZoom((this.renderer?.zoom || 1) - 0.25);
            return;
        }
        
        // Ctrl/Cmd + 0: 适应窗口
        if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            e.preventDefault();
            this.renderer?.fitToView();
            return;
        }
        
        // 左右箭头: 选择上一张/下一张图片
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const images = this.imageManager?.getImages() || [];
            if (images.length === 0) return;
            
            let newIndex = this.imageManager.selectedIndex;
            if (e.key === 'ArrowLeft') {
                newIndex = newIndex <= 0 ? images.length - 1 : newIndex - 1;
            } else {
                newIndex = newIndex >= images.length - 1 ? 0 : newIndex + 1;
            }
            this.imageManager.selectImage(newIndex);
            return;
        }
    }

    /**
     * 显示 Toast 提示
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        
        toast.innerHTML = `${icon}<span>${message}</span>`;
        container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (!bytes || bytes <= 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

// 全局应用实例
window.app = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
