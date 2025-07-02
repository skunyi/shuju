/**
 * 主应用模块 - 应用程序入口点，负责初始化和协调各个模块
 */

const App = {
    // 应用状态
    isInitialized: false,
    version: '2.0.0',
    currentPage: null,
    
    /**
     * 应用程序初始化
     */
    init: function() {
        console.log('=== 数据可视化图表系统启动 ===');
        console.log('版本:', this.version);
        console.log('启动时间:', new Date().toLocaleString());

        try {
            // 检测当前页面
            this.detectCurrentPage();

            // 检查浏览器兼容性
            this.checkBrowserCompatibility();

            // 初始化各个模块
            this.initializeModules();

            // 加载保存的数据
            this.loadApplicationData();

            // 绑定全局事件
            this.bindGlobalEvents();

            // 标记初始化完成
            this.isInitialized = true;

            console.log('=== 系统初始化完成 ===');
            
            // 显示欢迎消息（仅在首页）
            if (this.currentPage === 'index') {
                this.showWelcomeMessage();
            }

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    },

    /**
     * 检测当前页面
     */
    detectCurrentPage: function() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().split('.')[0];
        this.currentPage = filename || 'index';
        console.log('当前页面:', this.currentPage);
    },

    /**
     * 检查浏览器兼容性
     */
    checkBrowserCompatibility: function() {
        const requiredFeatures = [
            'localStorage',
            'JSON',
            'addEventListener',
            'querySelector',
            'Canvas'
        ];

        const missingFeatures = [];

        // 检查localStorage
        if (!window.localStorage) {
            missingFeatures.push('localStorage');
        }

        // 检查JSON
        if (!window.JSON) {
            missingFeatures.push('JSON');
        }

        // 检查Canvas
        const canvas = document.createElement('canvas');
        if (!canvas.getContext) {
            missingFeatures.push('Canvas');
        }

        if (missingFeatures.length > 0) {
            throw new Error(`浏览器不支持以下功能: ${missingFeatures.join(', ')}`);
        }

        console.log('浏览器兼容性检查通过');
    },    /**
     * 初始化各个模块
     */
    initializeModules: function() {
        console.log('初始化系统模块...');

        // 根据当前页面初始化相应模块
        switch (this.currentPage) {
            case 'index':
                // 首页不需要特殊初始化
                console.log('首页模块初始化完成');
                break;
                
            case 'data-manager':
                if (typeof DataManager !== 'undefined') {
                    DataManager.init();
                    console.log('数据管理模块初始化完成');
                }
                break;
                
            case 'chart-creator':
                if (typeof DataManager !== 'undefined') {
                    DataManager.init();
                }
                if (typeof ChartCreator !== 'undefined') {
                    ChartCreator.init();
                    console.log('图表创建模块初始化完成');
                }
                break;
                
            case 'dashboard':
                if (typeof DataManager !== 'undefined') {
                    DataManager.init();
                }
                if (typeof DashboardManager !== 'undefined') {
                    DashboardManager.init();
                    console.log('仪表盘模块初始化完成');
                }
                break;
                
            default:
                console.log('未知页面，使用默认初始化');
                break;
        }

        // 初始化事件处理器（如果存在）
        if (typeof EventHandler !== 'undefined') {
            EventHandler.init();
            console.log('事件处理器初始化完成');
        }
    },

    /**
     * 加载应用数据
     */
    loadApplicationData: function() {
        console.log('加载应用数据...');

        // 加载用户数据
        const dataCount = DataManager.dataCache.length;
        console.log(`已加载 ${dataCount} 条数据记录`);

        // 加载用户配置
        const savedConfigs = Utils.storage.get('chart_configs', {});
        const configCount = Object.keys(savedConfigs).length;
        console.log(`已加载 ${configCount} 个图表配置`);

        // 加载应用设置
        const appSettings = Utils.storage.get('app_settings', {});
        this.applySettings(appSettings);
        console.log('应用设置已加载');
    },

    /**
     * 恢复用户界面状态
     */
    restoreUIState: function() {
        console.log('恢复用户界面状态...');

        // 恢复上次活跃的标签页
        EventHandler.restoreLastActiveTab();

        // 恢复窗口大小监听
        this.setupResponsiveHandling();

        console.log('用户界面状态已恢复');
    },

    /**
     * 绑定全局事件
     */
    bindGlobalEvents: function() {
        console.log('绑定全局事件...');

        // 页面卸载时保存状态
        window.addEventListener('beforeunload', () => {
            this.saveApplicationState();
        });

        // 页面错误处理
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event);
        });

        // 未处理的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event);
        });

        // 在线状态监听
        window.addEventListener('online', () => {
            Utils.showMessage('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            Utils.showMessage('网络连接已断开', 'warning');
        });

        console.log('全局事件已绑定');
    },

    /**
     * 设置响应式处理
     */
    setupResponsiveHandling: function() {
        const handleResize = Utils.throttle(() => {
            // 调整图表大小
            if (ChartManager.isInitialized) {
                ChartManager.resizeCharts();
            }
            
            // 调整图表创建器预览
            if (ChartCreator.isInitialized) {
                ChartCreator.updatePreview();
            }
        }, 300);

        window.addEventListener('resize', handleResize);
    },

    /**
     * 应用设置
     * @param {Object} settings - 设置对象
     */
    applySettings: function(settings) {
        // 应用主题设置
        if (settings.theme) {
            this.setTheme(settings.theme);
        }

        // 应用语言设置
        if (settings.language) {
            this.setLanguage(settings.language);
        }

        // 应用其他设置
        if (settings.autoSave) {
            this.enableAutoSave(settings.autoSave);
        }
    },

    /**
     * 设置主题
     * @param {string} theme - 主题名称
     */
    setTheme: function(theme) {
        document.body.className = `theme-${theme}`;
        Utils.storage.set('app_theme', theme);
    },

    /**
     * 设置语言
     * @param {string} language - 语言代码
     */
    setLanguage: function(language) {
        document.documentElement.lang = language;
        Utils.storage.set('app_language', language);
    },

    /**
     * 启用自动保存
     * @param {boolean} enabled - 是否启用
     */
    enableAutoSave: function(enabled) {
        if (enabled) {
            this.autoSaveInterval = setInterval(() => {
                this.saveApplicationState();
            }, 30000); // 每30秒自动保存
        } else if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    },

    /**
     * 保存应用状态
     */
    saveApplicationState: function() {
        try {
            const state = {
                currentTab: EventHandler.currentTab,
                dataCount: DataManager.dataCache.length,
                lastSaveTime: new Date().toISOString()
            };
            
            Utils.storage.set('app_state', state);
            console.log('应用状态已保存');
        } catch (error) {
            console.error('保存应用状态失败:', error);
        }
    },

    /**
     * 显示加载消息
     */
    showLoadingMessage: function() {
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
            ">
                <div class="loading"></div>
                <p style="margin-top: 20px; color: #666;">正在加载数据可视化图表系统...</p>
            </div>
        `;
        document.body.appendChild(loader);
    },

    /**
     * 隐藏加载消息
     */
    hideLoadingMessage: function() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 500);
        }
    },

    /**
     * 显示欢迎消息
     */
    showWelcomeMessage: function() {
        const isFirstVisit = !Utils.storage.get('visited_before', false);
        
        if (isFirstVisit) {
            Utils.storage.set('visited_before', true);
            setTimeout(() => {
                Utils.showMessage('欢迎使用数据可视化图表系统！', 'success', 5000);
                setTimeout(() => {
                    Utils.showMessage('提示：您可以使用快捷键 Ctrl+N 快速添加数据', 'info', 5000);
                }, 2000);
            }, 1000);
        } else {
            Utils.showMessage('欢迎回来！', 'success', 2000);
        }
    },

    /**
     * 处理初始化错误
     * @param {Error} error - 错误对象
     */
    handleInitializationError: function(error) {
        console.error('初始化错误:', error);
        
        // 隐藏加载消息
        this.hideLoadingMessage();
        
        // 显示错误信息
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            border: 2px solid #e74c3c;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
        `;
        
        errorMessage.innerHTML = `
            <h3 style="color: #e74c3c; margin-bottom: 15px;">系统初始化失败</h3>
            <p style="margin-bottom: 20px; color: #666;">${error.message}</p>
            <button onclick="location.reload()" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
            ">重新加载</button>
        `;
        
        document.body.appendChild(errorMessage);
    },

    /**
     * 处理全局错误
     * @param {ErrorEvent} event - 错误事件
     */
    handleGlobalError: function(event) {
        console.error('全局错误:', event.error);
        Utils.showMessage('发生了一个错误，请查看控制台了解详情', 'error');
    },

    /**
     * 处理未处理的Promise错误
     * @param {PromiseRejectionEvent} event - Promise拒绝事件
     */
    handleUnhandledRejection: function(event) {
        console.error('未处理的Promise拒绝:', event.reason);
        Utils.showMessage('发生了一个异步错误，请查看控制台了解详情', 'error');
        event.preventDefault();
    },

    /**
     * 获取应用信息
     * @returns {Object} 应用信息
     */
    getAppInfo: function() {
        return {
            version: this.version,
            isInitialized: this.isInitialized,
            dataCount: DataManager.dataCache.length,
            currentTab: EventHandler.currentTab,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    },

    /**
     * 重置应用
     */
    resetApp: function() {
        if (!confirm('确定要重置应用吗？这将清除所有数据和设置！')) {
            return;
        }

        try {
            // 清除所有本地存储
            Utils.storage.clear();
            
            // 重新加载页面
            location.reload();
        } catch (error) {
            console.error('重置应用失败:', error);
            Utils.showMessage('重置失败，请手动清除浏览器缓存', 'error');
        }
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// 添加全局样式用于加载动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 创建全局引用
window.app = App;

// 开发模式下的调试功能
if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
    console.log('开发模式已启用');
    
    // 添加全局调试函数
    window.debug = {
        getAppInfo: () => App.getAppInfo(),
        resetApp: () => App.resetApp(),
        exportData: () => {
            const data = {
                version: App.version,
                data: DataManager.getAllData(),
                configs: Utils.storage.get('chart_configs', {}),
                settings: Utils.storage.get('app_settings', {}),
                exportTime: new Date().toISOString()
            };
            console.log('导出数据:', data);
            return data;
        }
    };
}
