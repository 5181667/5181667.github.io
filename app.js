// 星露谷物品代码生成器增强脚本 - Buff模式支持
(function() {
    // 全局变量
    let selectedBuffs = []; // 存储已选择的Buff
    
    // 等待页面完全加载
    document.addEventListener('DOMContentLoaded', function() {
        console.log('初始化Buff模式增强功能...');
        
        // 初始化Buff模式事件监听
        initBuffMode();
        
        // 扩展现有函数以支持Buff模式
        extendExistingFunctions();
    });
    
    // 初始化Buff模式
    function initBuffMode() {
        // 为Buff项添加点击事件
        document.querySelectorAll('.buff-item').forEach(item => {
            item.addEventListener('click', function() {
                const buffData = this.getAttribute('data-buff');
                addBuff(buffData);
            });
        });
        
        // 为模式卡片添加Buff模式支持
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', function() {
                const mode = this.getAttribute('data-mode');
                if (mode === 'buff') {
                    // 更新选择器
                    document.getElementById('modeSelect').value = 'buff';
                    
                    // 显示Buff区域
                    showBuffInputArea();
                    
                    // 设置激活状态
                    document.querySelectorAll('.mode-card').forEach(c => 
                        c.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
    }
    
    // 扩展现有函数以支持Buff模式
    function extendExistingFunctions() {
        // 保存原始toggleInputMode函数
        const originalToggleInputMode = window.toggleInputMode;
        
        // 扩展toggleInputMode函数
        window.toggleInputMode = function() {
            const mode = document.getElementById("modeSelect").value;
            
            // 如果是Buff模式，特殊处理
            if (mode === "buff") {
                showBuffInputArea();
                return;
            }
            
            // 对于其他模式，调用原始函数
            if (originalToggleInputMode) {
                originalToggleInputMode.call(this);
            }
        };
        
        // 保存原始replaceAndCopy函数
        const originalReplaceAndCopy = window.replaceAndCopy;
        
        // 扩展replaceAndCopy函数
        window.replaceAndCopy = function() {
            const mode = document.getElementById("modeSelect").value;
            
            // 如果是Buff模式，生成Buff代码
            if (mode === "buff") {
                generateBuffCode();
                return;
            }
            
            // 对于其他模式，调用原始函数
            if (originalReplaceAndCopy) {
                originalReplaceAndCopy.call(this);
            }
        };
    }
    
    // 显示Buff输入区域并隐藏其他区域
    function showBuffInputArea() {
        // 隐藏其他输入区域
        document.getElementById('multipleInputArea').style.display = 'none';
        document.getElementById('normalInputArea').style.display = 'none';
        
        // 显示Buff输入区域
        const buffInputArea = document.getElementById('buffInputArea');
        if (buffInputArea) {
            buffInputArea.style.display = 'block';
        } else {
            console.error('找不到buffInputArea元素');
        }
    }
    
    // 添加Buff到选择列表
    function addBuff(buffData) {
        if (!buffData) return;
        
        // 解析Buff数据
        const [name, command] = buffData.split('#');
        
        // 检查是否已经添加过
        const existingBuff = selectedBuffs.find(buff => buff.name === name);
        if (existingBuff) {
            showAlert("该Buff已添加！");
            return;
        }
        
        // 添加到已选择列表
        selectedBuffs.push({
            name: name,
            command: command
        });
        
        // 更新显示
        updateSelectedBuffsDisplay();
    }
    
    // 更新已选择的Buff显示
    function updateSelectedBuffsDisplay() {
        const container = document.getElementById('selectedBuffs');
        if (!container) {
            console.error("找不到selectedBuffs容器");
            return;
        }
        
        container.innerHTML = '';
        
        selectedBuffs.forEach((buff, index) => {
            const tag = document.createElement('div');
            tag.className = 'item-tag buff-tag';
            tag.innerHTML = `
                <span>${buff.name}</span>
                <button onclick="window.app.removeBuff(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(tag);
        });
    }
    
    // 移除已选择的Buff
    function removeBuff(index) {
        selectedBuffs.splice(index, 1);
        updateSelectedBuffsDisplay();
    }
    
    // 生成Buff代码
    function generateBuffCode() {
        if (selectedBuffs.length === 0) {
            alert("请至少选择一个Buff效果！");
            return;
        }
        
        // 生成Buff代码
        let result = "";
        
        selectedBuffs.forEach((buff, index) => {
            result += buff.command;
            
            // 添加换行符，最后一个除外
            if (index < selectedBuffs.length - 1) {
                result += " ${^^\n}$";
            }
        });
        
        // 显示结果
        const modifiedText = document.getElementById("modifiedText");
        modifiedText.textContent = result;
        
        // 复制到剪贴板
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(result).then(function() {
                showAlert("Buff代码已成功复制到剪贴板！");
            }).catch(function(err) {
                fallbackCopyTextToClipboard(result);
            });
        } else {
            fallbackCopyTextToClipboard(result);
        }
    }
    
    // 显示提示
    function showAlert(message) {
        const alertElement = document.getElementById("alert");
        if (!alertElement) return;
        
        alertElement.textContent = message;
        alertElement.style.display = "block";
        
        setTimeout(function() {
            alertElement.style.display = "none";
        }, 3000);
    }
    
    // 后备复制文本到剪贴板方法
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // 避免滚动到底部
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            const msg = successful ? '成功复制到剪贴板' : '复制失败';
            showAlert(msg);
        } catch (err) {
            showAlert('复制时出错: ' + err);
        }
        
        document.body.removeChild(textArea);
    }
    
    // 将removeBuff暴露给全局，以便onClick调用
    window.app = {
        removeBuff: removeBuff
    };
})(); 