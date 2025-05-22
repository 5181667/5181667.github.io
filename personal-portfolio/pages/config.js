// 安全配置文件
// 使用更安全的方式存储和获取API密钥

// 使用一个自调用函数来创建闭包，防止直接访问变量
(function() {
    // 对密钥进行分段存储和混淆
    const keyFragments = {
        part1: 'sk-6nqV9b',
        part2: 'fMgI9JtOWv',
        part3: '934a7cB4Cf',
        part4: '35434f99C6',
        part5: '88Ba17Df2e87'
    };
    
    // API配置
    const apiConfig = {
        url: 'https://ai.modelapi.site/v1/chat/completions',
        model: 'gpt-4.1-nano'
    };

    // 暴露获取密钥的方法
    window.ConfigManager = {
        // 获取API密钥的函数
        getApiKey: function() {
            // 组合密钥
            return `${keyFragments.part1}${keyFragments.part2}${keyFragments.part3}${keyFragments.part4}${keyFragments.part5}`;
        },
        
        // 获取API URL
        getApiUrl: function() {
            return apiConfig.url;
        },
        
        // 获取模型名称
        getModelName: function() {
            return apiConfig.model;
        },
        
        // 记录使用情况，在实际应用中可以用来统计和限制API使用量
        logApiUsage: function() {
            // 在本地存储中记录使用次数
            const usageKey = 'aigc_api_usage';
            const currentUsage = localStorage.getItem(usageKey) || 0;
            localStorage.setItem(usageKey, parseInt(currentUsage) + 1);
            
            // 如果需要可以添加使用限制逻辑
            return parseInt(currentUsage) + 1;
        },
        
        // 检查API使用限制，返回是否允许使用
        checkApiLimit: function() {
            const usageKey = 'aigc_api_usage';
            const currentUsage = localStorage.getItem(usageKey) || 0;
            const dailyLimit = 10; // 设置每日限制次数
            
            // 检查上次重置时间
            const lastResetKey = 'aigc_last_reset';
            const lastReset = localStorage.getItem(lastResetKey) || 0;
            const now = new Date().setHours(0, 0, 0, 0); // 今天的开始时间
            
            // 如果是新的一天，重置计数器
            if (lastReset < now) {
                localStorage.setItem(usageKey, 0);
                localStorage.setItem(lastResetKey, now);
                return {
                    allowed: true,
                    remaining: dailyLimit
                };
            }
            
            // 检查是否超过限制
            return {
                allowed: parseInt(currentUsage) < dailyLimit,
                remaining: dailyLimit - parseInt(currentUsage),
                total: dailyLimit
            };
        }
    };
})(); 