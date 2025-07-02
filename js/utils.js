/**
 * 工具函数模块 - 提供通用的辅助功能
 */

const Utils = {
    /**
     * 生成随机颜色
     * @param {number} alpha - 透明度 (0-1)
     * @returns {string} RGBA颜色值
     */
    getRandomColor: function(alpha = 1) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    /**
     * 根据配色方案获取颜色数组
     * @param {string} scheme - 配色方案名称
     * @param {number} count - 需要的颜色数量
     * @returns {Array} 颜色数组
     */
    getColorScheme: function(scheme, count = 5) {
        const schemes = {
            default: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'],
            blue: ['#3498db', '#2980b9', '#5dade2', '#85c1e9', '#aed6f1'],
            green: ['#2ecc71', '#27ae60', '#58d68d', '#82e0aa', '#a9dfbf'],
            warm: ['#e74c3c', '#f39c12', '#e67e22', '#f1948a', '#f8c471']
        };
        
        const colors = schemes[scheme] || schemes.default;
        const result = [];
        
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        
        return result;
    },

    /**
     * 验证数字输入
     * @param {string} value - 输入值
     * @returns {boolean} 是否为有效数字
     */
    isValidNumber: function(value) {
        return !isNaN(value) && !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * 格式化数字显示
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的数字字符串
     */
    formatNumber: function(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    },

    /**
     * HTML转义，防止XSS攻击
     * @param {string} text - 需要转义的文本
     * @returns {string} 转义后的安全文本
     */
    escapeHtml: function(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId: function() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间(毫秒)
     * @returns {Function} 防抖后的函数
     */
    debounce: function(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} delay - 延迟时间(毫秒)
     * @returns {Function} 节流后的函数
     */
    throttle: function(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function(...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    },

    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, warning, info)
     * @param {number} duration - 显示时长(毫秒)
     */
    showMessage: function(message, type = 'info', duration = 3000) {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        container.appendChild(messageEl);

        // 自动移除消息
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    container.removeChild(messageEl);
                }, 300);
            }
        }, duration);
    },

    /**
     * 本地存储操作
     */
    storage: {
        /**
         * 设置本地存储
         * @param {string} key - 键名
         * @param {*} value - 值
         */
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('存储数据失败:', error);
                Utils.showMessage('存储数据失败', 'error');
                return false;
            }
        },

        /**
         * 获取本地存储
         * @param {string} key - 键名
         * @param {*} defaultValue - 默认值
         * @returns {*} 存储的值或默认值
         */
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('读取数据失败:', error);
                return defaultValue;
            }
        },

        /**
         * 删除本地存储
         * @param {string} key - 键名
         */
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('删除数据失败:', error);
                return false;
            }
        },

        /**
         * 清空所有本地存储
         */
        clear: function() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('清空数据失败:', error);
                return false;
            }
        }
    },

    /**
     * DOM操作辅助函数
     */
    dom: {
        /**
         * 根据选择器获取元素
         * @param {string} selector - CSS选择器
         * @returns {Element|null} DOM元素
         */
        get: function(selector) {
            return document.querySelector(selector);
        },

        /**
         * 根据选择器获取所有元素
         * @param {string} selector - CSS选择器
         * @returns {NodeList} DOM元素列表
         */
        getAll: function(selector) {
            return document.querySelectorAll(selector);
        },

        /**
         * 创建元素
         * @param {string} tag - 标签名
         * @param {Object} attributes - 属性对象
         * @param {string} content - 内容
         * @returns {Element} 创建的元素
         */
        create: function(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            for (let key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    element.setAttribute(key, attributes[key]);
                }
            }
            
            if (content) {
                element.textContent = content;
            }
            
            return element;
        },

        /**
         * 添加事件监听器
         * @param {Element} element - DOM元素
         * @param {string} event - 事件类型
         * @param {Function} handler - 事件处理函数
         */
        on: function(element, event, handler) {
            if (element && typeof handler === 'function') {
                element.addEventListener(event, handler);
            }
        },

        /**
         * 移除事件监听器
         * @param {Element} element - DOM元素
         * @param {string} event - 事件类型
         * @param {Function} handler - 事件处理函数
         */
        off: function(element, event, handler) {
            if (element && typeof handler === 'function') {
                element.removeEventListener(event, handler);
            }
        }
    }
};
