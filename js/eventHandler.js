/**
 * 事件处理模块 - 统一管理页面交互事件
 */

const EventHandler = {
    // 当前活跃的标签页
    currentTab: 'dashboard',

    /**
     * 初始化事件处理器
     */
    init: function() {
        this.bindNavigationEvents();
        this.bindKeyboardEvents();
        this.bindFormValidation();
        this.bindTooltipEvents();
        console.log('事件处理器初始化完成');
    },

    /**
     * 绑定导航事件
     */
    bindNavigationEvents: function() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    },

    /**
     * 切换标签页
     * @param {string} tabName - 标签页名称
     */
    switchTab: function(tabName) {
        if (!tabName || tabName === this.currentTab) return;

        // 隐藏所有标签页内容
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // 移除所有导航按钮的激活状态
        const allNavButtons = document.querySelectorAll('.nav-btn');
        allNavButtons.forEach(button => {
            button.classList.remove('active');
        });

        // 显示目标标签页
        const targetTab = document.getElementById(tabName);
        const targetNavButton = document.querySelector(`[data-tab="${tabName}"]`);

        if (targetTab && targetNavButton) {
            targetTab.classList.add('active');
            targetNavButton.classList.add('active');
            this.currentTab = tabName;

            // 触发标签页切换事件
            this.onTabSwitch(tabName);
        }
    },

    /**
     * 标签页切换回调
     * @param {string} tabName - 标签页名称
     */
    onTabSwitch: function(tabName) {
        switch (tabName) {
            case 'dashboard':
                // 刷新图表显示
                setTimeout(() => {
                    chartManager.refreshAllCharts();
                }, 100);
                break;
            
            case 'data-manager':
                // 刷新数据列表
                DataManager.renderDataList();
                break;
            
            case 'chart-creator':
                // 更新图表创建器预览
                chartCreator.updatePreview();
                break;
        }

        // 记录用户访问偏好
        Utils.storage.set('last_active_tab', tabName);
    },

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents: function() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + S: 保存数据
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.handleSaveShortcut();
            }

            // Ctrl + E: 导出图表
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.handleExportShortcut();
            }

            // Ctrl + R: 刷新图表
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.handleRefreshShortcut();
            }

            // Ctrl + N: 添加新数据
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.handleNewDataShortcut();
            }

            // Tab键导航
            if (e.key === 'Tab' && e.altKey) {
                e.preventDefault();
                this.handleTabNavigation(e.shiftKey);
            }

            // Escape键: 取消当前操作
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    },

    /**
     * 处理保存快捷键
     */
    handleSaveShortcut: function() {
        if (this.currentTab === 'data-manager') {
            const form = document.getElementById('dataForm');
            if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
            }
        } else if (this.currentTab === 'chart-creator') {
            chartCreator.saveConfiguration();
        }
        Utils.showMessage('快捷键: Ctrl+S 保存', 'info', 1000);
    },

    /**
     * 处理导出快捷键
     */
    handleExportShortcut: function() {
        if (this.currentTab === 'dashboard') {
            // 导出当前所有图表
            ['bar', 'line', 'pie'].forEach(type => {
                chartManager.exportChart(type);
            });
        } else if (this.currentTab === 'chart-creator') {
            chartCreator.exportCustomChart();
        }
        Utils.showMessage('快捷键: Ctrl+E 导出', 'info', 1000);
    },

    /**
     * 处理刷新快捷键
     */
    handleRefreshShortcut: function() {
        if (this.currentTab === 'dashboard') {
            chartManager.refreshAllCharts();
        } else if (this.currentTab === 'chart-creator') {
            chartCreator.updatePreview();
        }
        Utils.showMessage('快捷键: Ctrl+R 刷新', 'info', 1000);
    },

    /**
     * 处理新建数据快捷键
     */
    handleNewDataShortcut: function() {
        this.switchTab('data-manager');
        setTimeout(() => {
            const labelInput = document.getElementById('dataLabel');
            if (labelInput) {
                labelInput.focus();
            }
        }, 100);
        Utils.showMessage('快捷键: Ctrl+N 新建数据', 'info', 1000);
    },

    /**
     * 处理Tab导航
     * @param {boolean} reverse - 是否反向导航
     */
    handleTabNavigation: function(reverse = false) {
        const tabs = ['dashboard', 'data-manager', 'chart-creator'];
        const currentIndex = tabs.indexOf(this.currentTab);
        let nextIndex;

        if (reverse) {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
            nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }

        this.switchTab(tabs[nextIndex]);
    },    /**
     * 处理Escape键
     */
    handleEscapeKey: function() {
        // 首先检查是否有打开的弹出窗口
        const editModal = document.getElementById('editModal');
        if (editModal && editModal.classList.contains('show')) {
            DataManager.closeEditModal();
            return;
        }

        // 清除所有活动的模态框或对话框
        const activeMessages = document.querySelectorAll('.message');
        activeMessages.forEach(message => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        });

        // 清除表单焦点
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName !== 'BODY') {
            activeElement.blur();
        }
    },

    /**
     * 绑定表单验证事件
     */
    bindFormValidation: function() {
        // 实时验证数据输入
        const dataLabelInput = document.getElementById('dataLabel');
        const dataValueInput = document.getElementById('dataValue');

        if (dataLabelInput) {
            dataLabelInput.addEventListener('input', Utils.debounce((e) => {
                this.validateLabelInput(e.target);
            }, 300));
        }

        if (dataValueInput) {
            dataValueInput.addEventListener('input', Utils.debounce((e) => {
                this.validateValueInput(e.target);
            }, 300));
        }

        // 表单提交验证
        const dataForm = document.getElementById('dataForm');
        if (dataForm) {
            dataForm.addEventListener('submit', (e) => {
                if (!this.validateForm(dataForm)) {
                    e.preventDefault();
                }
            });
        }
    },

    /**
     * 验证标签输入
     * @param {HTMLInputElement} input - 输入元素
     */
    validateLabelInput: function(input) {
        const value = input.value.trim();
        const isValid = value.length > 0 && value.length <= 50;

        this.setInputValidation(input, isValid, 
            isValid ? '' : '标签长度应在1-50个字符之间');
    },

    /**
     * 验证数值输入
     * @param {HTMLInputElement} input - 输入元素
     */
    validateValueInput: function(input) {
        const value = input.value.trim();
        const isValid = value && Utils.isValidNumber(value) && parseFloat(value) >= 0;

        this.setInputValidation(input, isValid, 
            isValid ? '' : '请输入有效的非负数');
    },

    /**
     * 设置输入验证状态
     * @param {HTMLInputElement} input - 输入元素
     * @param {boolean} isValid - 是否有效
     * @param {string} message - 错误消息
     */
    setInputValidation: function(input, isValid, message) {
        input.style.borderColor = isValid ? '#27ae60' : '#e74c3c';
        
        // 移除旧的验证消息
        const oldMessage = input.parentNode.querySelector('.validation-message');
        if (oldMessage) {
            oldMessage.remove();
        }

        // 添加新的验证消息
        if (!isValid && message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'validation-message';
            messageEl.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px;';
            messageEl.textContent = message;
            input.parentNode.appendChild(messageEl);
        }
    },

    /**
     * 验证整个表单
     * @param {HTMLFormElement} form - 表单元素
     * @returns {boolean} 表单是否有效
     */
    validateForm: function(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (input.type === 'text') {
                this.validateLabelInput(input);
                if (input.style.borderColor === 'rgb(231, 76, 60)') {
                    isValid = false;
                }
            } else if (input.type === 'number') {
                this.validateValueInput(input);
                if (input.style.borderColor === 'rgb(231, 76, 60)') {
                    isValid = false;
                }
            }
        });

        return isValid;
    },

    /**
     * 绑定工具提示事件
     */
    bindTooltipEvents: function() {
        // 为需要提示的元素添加悬停事件
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            });

            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip();
            });
        });
    },

    /**
     * 显示工具提示
     * @param {HTMLElement} element - 目标元素
     * @param {string} text - 提示文本
     */
    showTooltip: function(element, text) {
        if (!text) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
            pointer-events: none;
            max-width: 200px;
            word-wrap: break-word;
        `;

        document.body.appendChild(tooltip);

        // 定位提示框
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';

        // 保存引用以便后续移除
        this.activeTooltip = tooltip;
    },

    /**
     * 隐藏工具提示
     */
    hideTooltip: function() {
        if (this.activeTooltip) {
            document.body.removeChild(this.activeTooltip);
            this.activeTooltip = null;
        }
    },

    /**
     * 恢复上次的活跃标签页
     */
    restoreLastActiveTab: function() {
        const lastTab = Utils.storage.get('last_active_tab', 'dashboard');
        if (lastTab && lastTab !== this.currentTab) {
            this.switchTab(lastTab);
        }
    },

    /**
     * 绑定图表交互事件
     */
    bindChartInteractionEvents: function() {
        // 图表点击事件
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            canvas.addEventListener('click', (e) => {
                this.handleChartClick(canvas, e);
            });
        });
    },

    /**
     * 处理图表点击事件
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {MouseEvent} event - 鼠标事件
     */
    handleChartClick: function(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 简单的图表点击反馈
        Utils.showMessage(`图表点击位置: (${Math.round(x)}, ${Math.round(y)})`, 'info', 1500);
        
        // 这里可以扩展为更复杂的图表交互功能
        console.log(`Chart clicked at: (${x}, ${y}) on canvas: ${canvas.id}`);
    }
};

// 创建全局引用
window.eventHandler = EventHandler;
