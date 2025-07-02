/**
 * 数据管理模块 - 负责数据的增删改查和持久化存储
 */

const DataManager = {
    // 存储键名
    STORAGE_KEY: 'chart_data',
    
    // 内存中的数据缓存
    dataCache: [],    /**
     * 初始化数据管理器
     */
    init: function() {
        this.loadDataFromStorage();
        this.updateLegacyData(); // 更新旧数据的颜色
        this.bindEventListeners();
        this.renderDataList();
        
        // 检查是否有需要高亮显示的数据
        this.checkHighlightData();
        
        console.log('数据管理器初始化完成');
    },

    /**
     * 检查并高亮显示特定数据项
     */
    checkHighlightData: function() {
        const highlightId = sessionStorage.getItem('highlightDataId');
        if (highlightId) {
            // 清除sessionStorage中的标记
            sessionStorage.removeItem('highlightDataId');
            
            // 延迟执行以确保页面完全加载
            setTimeout(() => {
                this.highlightDataItem(highlightId);
            }, 500);
        }
    },

    /**
     * 高亮显示特定的数据项
     * @param {string} dataId - 数据项ID
     */
    highlightDataItem: function(dataId) {
        const dataItem = document.querySelector(`[data-id="${dataId}"]`);
        if (dataItem) {
            // 滚动到该项
            dataItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // 添加高亮效果
            dataItem.classList.add('highlight-item');
            
            // 3秒后移除高亮效果
            setTimeout(() => {
                dataItem.classList.remove('highlight-item');
            }, 3000);
            
            Utils.showMessage('已定位到目标数据项', 'info');
        }
    },

    /**
     * 从本地存储加载数据
     */
    loadDataFromStorage: function() {
        const storedData = Utils.storage.get(this.STORAGE_KEY, []);
        this.dataCache = Array.isArray(storedData) ? storedData : [];
        console.log('从本地存储加载数据:', this.dataCache.length, '条记录');
    },

    /**
     * 保存数据到本地存储
     */
    saveDataToStorage: function() {
        const success = Utils.storage.set(this.STORAGE_KEY, this.dataCache);
        if (success) {
            console.log('数据已保存到本地存储');
        }
        return success;
    },    /**
     * 绑定事件监听器
     */
    bindEventListeners: function() {
        const dataForm = document.getElementById('dataForm');
        if (dataForm) {
            dataForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddData();
            });
        }

        // 绑定分类筛选器
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.renderDataList();
            });
        }
    },

    /**
     * 处理添加数据
     */
    handleAddData: function() {
        const labelInput = document.getElementById('dataLabel');
        const valueInput = document.getElementById('dataValue');
        const categorySelect = document.getElementById('dataCategory');

        // 获取输入值
        const label = labelInput.value.trim();
        const value = valueInput.value.trim();
        const category = categorySelect.value;

        // 验证输入
        const validation = this.validateInput(label, value);
        if (!validation.isValid) {
            Utils.showMessage(validation.message, 'error');
            return;
        }        // 创建数据对象
        const dataItem = {
            id: Utils.generateId(),
            label: label,
            value: parseFloat(value),
            category: category,
            color: this.getRandomColor(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 添加到数据缓存
        this.dataCache.push(dataItem);

        // 保存到本地存储
        this.saveDataToStorage();

        // 清空表单
        this.clearForm();

        // 重新渲染数据列表
        this.renderDataList();

        // 更新图表
        this.notifyDataChange();

        Utils.showMessage(`成功添加数据: ${label}`, 'success');
    },

    /**
     * 验证输入数据
     * @param {string} label - 标签
     * @param {string} value - 数值
     * @returns {Object} 验证结果
     */
    validateInput: function(label, value) {
        if (!label) {
            return { isValid: false, message: '标签名称不能为空' };
        }

        if (!value) {
            return { isValid: false, message: '数值不能为空' };
        }

        if (!Utils.isValidNumber(value)) {
            return { isValid: false, message: '请输入有效的数字' };
        }

        const numValue = parseFloat(value);
        if (numValue < 0) {
            return { isValid: false, message: '数值不能为负数' };
        }

        // 检查标签是否已存在
        const existingItem = this.dataCache.find(item => item.label === label);
        if (existingItem) {
            return { isValid: false, message: '该标签已存在，请使用不同的标签名称' };
        }

        return { isValid: true };
    },

    /**
     * 清空表单
     */
    clearForm: function() {
        const form = document.getElementById('dataForm');
        if (form) {
            form.reset();
        }
    },    /**
     * 渲染数据列表
     */
    renderDataList: function() {
        const dataListContainer = document.getElementById('dataList');
        if (!dataListContainer) return;

        if (this.dataCache.length === 0) {
            dataListContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">暂无数据，请添加一些数据</p>';
            return;
        }

        // 获取当前筛选的分类
        const categoryFilter = document.getElementById('categoryFilter');
        const selectedCategory = categoryFilter ? categoryFilter.value : '';

        // 筛选数据
        let filteredData = this.dataCache;
        if (selectedCategory) {
            filteredData = this.dataCache.filter(item => item.category === selectedCategory);
        }

        if (filteredData.length === 0) {
            dataListContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">该分类下暂无数据</p>';
            return;
        }

        // 按分类分组数据
        const groupedData = this.groupDataByCategory(filteredData);
        
        // 生成HTML
        const groupsHTML = Object.keys(groupedData).map(category => {
            const items = groupedData[category];
            const itemsHTML = items.map(item => `
                <div class="data-item animate-in" data-id="${item.id}">
                    <div class="data-info">
                        <div class="data-color-indicator" style="background-color: ${item.color || '#3498db'}"></div>
                        <div class="data-details">
                            <div class="data-label">${item.label}</div>
                            <div class="data-value">${Utils.formatNumber(item.value)}</div>
                        </div>
                    </div>                    <div class="data-actions">                        <button class="btn btn-info btn-small" onclick="DataManager.showEditModal('${item.id}')">
                            <span class="icon-edit"></span>
                            编辑
                        </button>
                        <button class="btn btn-danger btn-small" onclick="DataManager.deleteData('${item.id}')">
                            <span class="icon-delete"></span>
                            删除
                        </button>
                    </div>
                </div>
            `).join('');

            return `
                <div class="data-category-group animate-in">
                    <div class="data-category-header">
                        <span>${category}</span>
                        <span class="data-category-count">${items.length} 项</span>
                    </div>
                    <div class="data-category-items">
                        ${itemsHTML}
                    </div>
                </div>
            `;
        }).join('');

        dataListContainer.innerHTML = groupsHTML;
    },

    /**
     * 按分类分组数据
     * @param {Array} data - 数据数组
     * @returns {Object} 分组后的数据
     */
    groupDataByCategory: function(data) {
        return data.reduce((groups, item) => {
            const category = item.category || '其他';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
            return groups;
        }, {});
    },

    /**
     * 删除数据
     * @param {string} id - 数据ID
     */
    deleteData: function(id) {
        if (!confirm('确定要删除这条数据吗？')) {
            return;
        }

        const index = this.dataCache.findIndex(item => item.id === id);
        if (index !== -1) {
            const deletedItem = this.dataCache.splice(index, 1)[0];
            this.saveDataToStorage();
            this.renderDataList();
            this.notifyDataChange();
            Utils.showMessage(`已删除数据: ${deletedItem.label}`, 'success');
        }
    },    /**
     * 显示编辑数据弹出窗口
     * @param {string} id - 数据ID
     */
    showEditModal: function(id) {
        const item = this.dataCache.find(data => data.id === id);
        if (!item) return;

        // 存储当前编辑的数据ID
        this.currentEditId = id;

        // 填充表单数据
        document.getElementById('editDataLabel').value = item.label;
        document.getElementById('editDataValue').value = item.value;
        document.getElementById('editDataCategory').value = item.category;
        document.getElementById('editDataColor').value = item.color || '#3498db';

        // 显示弹出窗口
        const modal = document.getElementById('editModal');
        modal.classList.add('show');

        // 绑定表单提交事件
        this.bindEditFormEvents();

        // 绑定颜色预设事件
        this.bindColorPresetEvents();
    },

    /**
     * 关闭编辑弹出窗口
     */
    closeEditModal: function() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('show');
        this.currentEditId = null;
    },

    /**
     * 绑定编辑表单事件
     */
    bindEditFormEvents: function() {
        const editForm = document.getElementById('editDataForm');
        
        // 移除旧的事件监听器
        const newForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newForm, editForm);

        // 添加新的提交事件
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSubmit();
        });
    },

    /**
     * 绑定颜色预设事件
     */
    bindColorPresetEvents: function() {
        const colorPresets = document.querySelectorAll('.color-preset');
        const colorInput = document.getElementById('editDataColor');

        colorPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.getAttribute('data-color');
                colorInput.value = color;
                
                // 更新预设选中状态
                colorPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            });
        });

        // 初始化选中状态
        const currentColor = colorInput.value;
        colorPresets.forEach(preset => {
            if (preset.getAttribute('data-color') === currentColor) {
                preset.classList.add('active');
            }
        });
    },

    /**
     * 处理编辑表单提交
     */
    handleEditSubmit: function() {
        if (!this.currentEditId) return;

        const label = document.getElementById('editDataLabel').value.trim();
        const value = document.getElementById('editDataValue').value.trim();
        const category = document.getElementById('editDataCategory').value;
        const color = document.getElementById('editDataColor').value;

        // 验证输入
        const validation = this.validateEditInput(label, value, this.currentEditId);
        if (!validation.isValid) {
            Utils.showMessage(validation.message, 'error');
            return;
        }

        // 更新数据
        const item = this.dataCache.find(data => data.id === this.currentEditId);
        if (item) {
            item.label = label;
            item.value = parseFloat(value);
            item.category = category;
            item.color = color;
            item.updatedAt = new Date().toISOString();

            this.saveDataToStorage();
            this.renderDataList();
            this.notifyDataChange();
            this.closeEditModal();
            
            Utils.showMessage(`数据已更新: ${item.label}`, 'success');
        }
    },

    /**
     * 验证编辑输入数据
     * @param {string} label - 标签
     * @param {string} value - 数值
     * @param {string} excludeId - 排除的ID（当前编辑的项目）
     * @returns {Object} 验证结果
     */
    validateEditInput: function(label, value, excludeId) {
        if (!label) {
            return { isValid: false, message: '数据标题不能为空' };
        }

        if (!value) {
            return { isValid: false, message: '数据数值不能为空' };
        }

        if (!Utils.isValidNumber(value)) {
            return { isValid: false, message: '请输入有效的数字' };
        }

        const numValue = parseFloat(value);
        if (numValue < 0) {
            return { isValid: false, message: '数值不能为负数' };
        }

        // 检查标签是否与其他数据冲突（排除当前编辑的项目）
        const existingItem = this.dataCache.find(item => item.id !== excludeId && item.label === label);
        if (existingItem) {
            return { isValid: false, message: '该标签已存在，请使用不同的标签名称' };
        }

        return { isValid: true };
    },

    /**
     * 编辑数据（保留旧方法作为备用）
     * @param {string} id - 数据ID
     */
    editData: function(id) {
        // 使用新的弹出窗口编辑方式
        this.showEditModal(id);
    },

    /**
     * 清空所有数据
     */
    clearAllData: function() {
        if (!confirm('确定要清空所有数据吗？此操作不可撤销！')) {
            return;
        }

        this.dataCache = [];
        this.saveDataToStorage();
        this.renderDataList();
        this.notifyDataChange();
        Utils.showMessage('所有数据已清空', 'warning');
    },

    /**
     * 批量导入数据
     */
    importBulkData: function() {
        const bulkInput = document.getElementById('bulkDataInput');
        if (!bulkInput) return;

        const text = bulkInput.value.trim();
        if (!text) {
            Utils.showMessage('请输入要导入的数据', 'warning');
            return;
        }

        const lines = text.split('\n');
        const importedData = [];
        const errors = [];

        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const parts = line.split(',').map(part => part.trim());
            
            if (parts.length < 2) {
                errors.push(`第${lineNumber}行: 格式错误，至少需要标签和数值`);
                return;
            }

            const [label, value, category = '其他'] = parts;

            if (!label) {
                errors.push(`第${lineNumber}行: 标签不能为空`);
                return;
            }

            if (!Utils.isValidNumber(value)) {
                errors.push(`第${lineNumber}行: 数值无效`);
                return;
            }

            // 检查标签是否已存在
            const existsInCache = this.dataCache.find(item => item.label === label);
            const existsInImport = importedData.find(item => item.label === label);
            
            if (existsInCache || existsInImport) {
                errors.push(`第${lineNumber}行: 标签"${label}"已存在`);
                return;
            }            importedData.push({
                id: Utils.generateId(),
                label: label,
                value: parseFloat(value),
                category: category,
                color: this.getRandomColor(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });

        if (errors.length > 0) {
            Utils.showMessage(`导入失败，发现 ${errors.length} 个错误：\n${errors.join('\n')}`, 'error', 8000);
            return;
        }

        if (importedData.length === 0) {
            Utils.showMessage('没有有效的数据可导入', 'warning');
            return;
        }

        // 添加到数据缓存
        this.dataCache.push(...importedData);
        this.saveDataToStorage();
        this.renderDataList();
        this.notifyDataChange();

        // 清空输入框
        bulkInput.value = '';

        Utils.showMessage(`成功导入 ${importedData.length} 条数据`, 'success');
    },

    /**
     * 获取所有数据
     * @returns {Array} 数据数组
     */
    getAllData: function() {
        return Utils.deepClone(this.dataCache);
    },

    /**
     * 根据分类获取数据
     * @param {string} category - 分类名称
     * @returns {Array} 过滤后的数据数组
     */
    getDataByCategory: function(category) {
        return this.dataCache.filter(item => item.category === category);
    },

    /**
     * 获取数据统计信息
     * @returns {Object} 统计信息
     */
    getStatistics: function() {
        if (this.dataCache.length === 0) {
            return {
                totalCount: 0,
                totalValue: 0,
                averageValue: 0,
                maxValue: 0,
                minValue: 0,
                categories: {}
            };
        }

        const values = this.dataCache.map(item => item.value);
        const categories = {};

        this.dataCache.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = { count: 0, value: 0 };
            }
            categories[item.category].count++;
            categories[item.category].value += item.value;
        });

        return {
            totalCount: this.dataCache.length,
            totalValue: values.reduce((sum, val) => sum + val, 0),
            averageValue: values.reduce((sum, val) => sum + val, 0) / values.length,
            maxValue: Math.max(...values),
            minValue: Math.min(...values),
            categories: categories
        };
    },

    /**
     * 通知数据变化（给其他模块使用）
     */
    notifyDataChange: function() {
        // 触发自定义事件
        const event = new CustomEvent('dataChanged', {
            detail: {
                data: this.getAllData(),
                statistics: this.getStatistics()
            }
        });
        document.dispatchEvent(event);
    },

    /**
     * 生成随机颜色
     * @returns {string} 十六进制颜色值
     */
    getRandomColor: function() {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
            '#2980b9', '#27ae60', '#c0392b', '#d35400',
            '#8e44ad', '#16a085', '#2c3e50', '#d68910'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * 获取数据项的颜色
     * @param {Object} item - 数据项
     * @returns {string} 颜色值
     */
    getItemColor: function(item) {
        return item.color || this.getRandomColor();
    },

    /**
     * 更新现有数据的颜色（为兼容旧数据）
     */
    updateLegacyData: function() {
        let hasUpdates = false;
        this.dataCache.forEach(item => {
            if (!item.color) {
                item.color = this.getRandomColor();
                hasUpdates = true;
            }
        });
        
        if (hasUpdates) {
            this.saveDataToStorage();
        }
    }
};

// 创建全局引用
window.dataManager = DataManager;
