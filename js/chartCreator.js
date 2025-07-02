/**
 * 图表创建器模块 - 允许用户手动选择数据创建图表
 */

const ChartCreator = {
    // 选中的数据ID数组
    selectedDataIds: [],
      /**
     * 初始化图表创建器
     */
    init: function() {
        try {
            console.log('开始初始化图表创建器...');
            
            // 检查依赖项
            if (typeof DataManager === 'undefined') {
                console.error('DataManager 未定义');
                return;
            }
            if (typeof ChartRenderer === 'undefined') {
                console.error('ChartRenderer 未定义');
                return;
            }
            if (typeof Utils === 'undefined') {
                console.error('Utils 未定义');
                return;
            }
            
            this.bindEventListeners();
            this.loadAvailableData();
            this.updatePreview();
            this.updateSelectedDataDisplay();
            console.log('图表创建器初始化完成');
        } catch (error) {
            console.error('图表创建器初始化失败:', error);
        }
    },

    /**
     * 绑定事件监听器
     */
    bindEventListeners: function() {
        // 监听配置变化
        const configElements = ['chartType', 'chartTitle', 'colorScheme'];
        configElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.updatePreview();
                });
            }
        });        // 监听数据变化
        document.addEventListener('dataChanged', () => {
            this.loadAvailableData();
        });        // 绑定分类选择控件
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this.filterDataByCategory();
            });
        }

        const selectCategoryBtn = document.getElementById('selectCategoryBtn');
        if (selectCategoryBtn) {
            selectCategoryBtn.addEventListener('click', () => {
                this.selectByCategory();
            });
        }

        const clearSelectionBtn = document.getElementById('clearSelectionBtn');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        }
    },    /**
     * 加载可用数据列表
     */
    loadAvailableData: function() {
        try {
            console.log('加载可用数据列表...');
            
            const allData = DataManager.getAllData();
            const dataList = document.getElementById('availableDataList');
            const noDataMessage = document.getElementById('noDataMessage');

            if (!dataList) {
                console.warn('找不到 availableDataList 元素');
                return;
            }

            console.log('获取到数据:', allData.length, '条');

            if (allData.length === 0) {
                if (dataList) dataList.style.display = 'none';
                if (noDataMessage) noDataMessage.style.display = 'block';
                this.selectedDataIds = [];
                this.updateSelectedDataDisplay();
                this.updatePreview();
                return;
            }

            if (noDataMessage) noDataMessage.style.display = 'none';
            if (dataList) dataList.style.display = 'block';

            // 根据分类筛选数据
            const filteredData = this.getFilteredData(allData);
            this.renderDataList(filteredData);
            console.log('数据列表渲染完成');
        } catch (error) {
            console.error('加载数据列表失败:', error);
        }
    },    /**
     * 根据分类筛选数据
     * @param {Array} data - 原始数据
     * @returns {Array} 筛选后的数据
     */
    getFilteredData: function(data) {
        const categorySelect = document.getElementById('categorySelect');
        const selectedCategory = categorySelect ? categorySelect.value : '';
        
        if (!selectedCategory) {
            return data; // 没有选择分类，返回所有数据
        }
        
        const filteredData = data.filter(item => item.category === selectedCategory);
        
        // 如果筛选后没有数据，显示提示信息
        if (filteredData.length === 0) {
            const dataList = document.getElementById('availableDataList');
            if (dataList) {
                dataList.innerHTML = `
                    <div class="no-data-message" style="padding: 20px; text-align: center; color: #7f8c8d;">
                        <p>分类 "${selectedCategory}" 下暂无数据</p>
                        <a href="data-manager.html" class="btn btn-primary">去添加数据</a>
                    </div>
                `;
            }
        }
        
        return filteredData;
    },    /**
     * 渲染数据列表
     * @param {Array} data - 要渲染的数据
     */
    renderDataList: function(data) {
        const dataList = document.getElementById('availableDataList');
        if (!dataList) return;

        if (data.length === 0) {
            // 如果没有数据，不在这里处理，让getFilteredData处理
            return;
        }

        const listHTML = data.map(item => {
            const isSelected = this.selectedDataIds.includes(item.id);
            return `
                <div class="available-data-item data-checkbox-item selection-ripple ${isSelected ? 'selected' : ''}" 
                     data-id="${item.id}"
                     onclick="ChartCreator.toggleDataSelection('${item.id}')">
                    <input type="checkbox" class="data-checkbox" 
                           ${isSelected ? 'checked' : ''}
                           onclick="event.stopPropagation();"
                           onchange="ChartCreator.toggleDataSelection('${item.id}')">
                    <div class="data-item-preview">
                        <div class="data-item-color-preview" style="background-color: ${item.color || '#3498db'}"></div>
                        <div class="data-item-info-preview">
                            <div class="data-item-label-preview">${item.label}</div>
                            <div class="data-item-value-preview">值: ${Utils.formatNumber(item.value)} | 分类: ${item.category}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        dataList.innerHTML = listHTML;
        this.updateSelectedDataDisplay();
    },    /**
     * 根据分类筛选数据（事件处理函数）
     */
    filterDataByCategory: function() {
        const categorySelect = document.getElementById('categorySelect');
        const selectedCategory = categorySelect ? categorySelect.value : '';
        
        // 当选择了分类时，显示提示信息
        if (selectedCategory) {
            Utils.showMessage(`正在显示分类 "${selectedCategory}" 下的数据`, 'info', 2000);
        } else {
            Utils.showMessage('正在显示所有数据', 'info', 2000);
        }
        
        this.loadAvailableData();
    },/**
     * 切换数据选择状态
     */
    toggleDataSelection: function(dataId) {
        const index = this.selectedDataIds.indexOf(dataId);
        const item = document.querySelector(`[data-id="${dataId}"]`);
        
        // 添加涟漪动画效果
        if (item) {
            item.classList.add('animate');
            setTimeout(() => {
                item.classList.remove('animate');
            }, 300);
        }
        
        if (index > -1) {
            this.selectedDataIds.splice(index, 1);
        } else {
            this.selectedDataIds.push(dataId);
        }

        // 更新UI
        this.updateDataSelectionUI(dataId);
        this.updateSelectedDataDisplay();
        this.updatePreview();
    },

    /**
     * 更新数据选择UI状态
     */
    updateDataSelectionUI: function(dataId) {
        const item = document.querySelector(`[data-id="${dataId}"]`);
        const checkbox = item?.querySelector('.data-checkbox');
        
        if (item && checkbox) {
            if (this.selectedDataIds.includes(dataId)) {
                item.classList.add('selected');
                checkbox.checked = true;
            } else {
                item.classList.remove('selected');
                checkbox.checked = false;
            }
        }
    },

    /**
     * 更新已选择数据的显示
     */
    updateSelectedDataDisplay: function() {
        const selectedList = document.getElementById('selectedDataList');
        const noSelectedMessage = document.getElementById('noSelectedMessage');
        
        if (!selectedList) return;

        if (this.selectedDataIds.length === 0) {
            selectedList.style.display = 'none';
            if (noSelectedMessage) noSelectedMessage.style.display = 'block';
            return;
        }        if (noSelectedMessage) noSelectedMessage.style.display = 'none';
        selectedList.style.display = 'block';

        const allData = DataManager.getAllData();
        const selectedData = allData.filter(item => this.selectedDataIds.includes(item.id));

        const listHTML = selectedData.map(item => `
            <div class="selected-data-item">
                <div class="selected-data-info">
                    <div class="selected-data-color" style="background-color: ${item.color || '#3498db'}"></div>
                    <div class="selected-data-details">
                        <div class="selected-data-label">${item.label}</div>
                        <div class="selected-data-value">值: ${Utils.formatNumber(item.value)}</div>
                    </div>
                </div>                <button class="selected-data-remove" onclick="ChartCreator.removeDataSelection('${item.id}')" title="移除">
                    ×
                </button>
            </div>
        `).join('');

        selectedList.innerHTML = listHTML;
    },

    /**
     * 移除数据选择
     */
    removeDataSelection: function(dataId) {
        const index = this.selectedDataIds.indexOf(dataId);
        if (index > -1) {
            this.selectedDataIds.splice(index, 1);
            this.updateDataSelectionUI(dataId);
            this.updateSelectedDataDisplay();
            this.updatePreview();
        }
    },    /**
     * 清空所有选择
     */
    clearSelection: function() {
        // 先清空选择的ID数组
        this.selectedDataIds = [];
        
        // 重新加载数据以更新UI状态
        this.loadAvailableData();
        this.updateSelectedDataDisplay();
        this.updatePreview();
    },    /**
     * 更新图表预览
     */
    updatePreview: function() {
        try {
            console.log('更新图表预览...');
            
            const canvas = document.getElementById('customChart');
            const placeholder = document.getElementById('previewPlaceholder');
            
            if (!canvas) {
                console.warn('找不到 customChart 画布元素');
                return;
            }

            if (this.selectedDataIds.length === 0) {
                console.log('没有选择数据，显示占位符');
                // 显示占位符，隐藏画布
                if (placeholder) placeholder.style.display = 'block';
                canvas.style.display = 'none';
                return;
            }

            // 隐藏占位符，显示画布
            if (placeholder) placeholder.style.display = 'none';
            canvas.style.display = 'block';

            const allData = DataManager.getAllData();
            const selectedData = allData.filter(item => this.selectedDataIds.includes(item.id));

            if (selectedData.length === 0) {
                console.warn('选择的数据为空');
                return;
            }

            const chartType = document.getElementById('chartType')?.value || 'bar';
            const chartTitle = document.getElementById('chartTitle')?.value || '自定义图表';
            const colorScheme = document.getElementById('colorScheme')?.value || 'default';

            console.log('图表配置:', { chartType, chartTitle, colorScheme, dataCount: selectedData.length });

            // 应用配色方案
            this.applyColorScheme(selectedData, colorScheme);

            const config = {
                type: chartType,
                title: chartTitle,
                data: selectedData
            };

            ChartRenderer.renderChart(canvas, config);
            console.log('图表预览更新完成');
        } catch (error) {
            console.error('更新图表预览失败:', error);
        }
    },

    /**
     * 应用配色方案
     */
    applyColorScheme: function(data, scheme) {
        const colorSchemes = {
            default: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'],
            blue: ['#3498db', '#2980b9', '#5dade2', '#85c1e9', '#aed6f1', '#d6eaf8', '#ebf5fb', '#1f4e79'],
            green: ['#2ecc71', '#27ae60', '#58d68d', '#82e0aa', '#a9dfbf', '#d5f4e6', '#eafaf1', '#196f3d'],
            warm: ['#e74c3c', '#f39c12', '#e67e22', '#d35400', '#f1948a', '#f8c471', '#fdeaa7', '#a04000']
        };

        const colors = colorSchemes[scheme] || colorSchemes.default;
        
        data.forEach((item, index) => {
            item.color = colors[index % colors.length];
        });
    },

    /**
     * 保存图表
     */
    saveChart: function() {
        if (this.selectedDataIds.length === 0) {
            Utils.showMessage('请先选择要包含在图表中的数据', 'warning');
            return;
        }

        const chartType = document.getElementById('chartType')?.value || 'bar';
        const chartTitle = document.getElementById('chartTitle')?.value || '自定义图表';
        
        if (!chartTitle.trim()) {
            Utils.showMessage('请输入图表标题', 'warning');            return;
        }

        const allData = DataManager.getAllData();
        const selectedData = allData.filter(item => this.selectedDataIds.includes(item.id));
        const colorScheme = document.getElementById('colorScheme')?.value || 'default';

        // 应用配色方案
        this.applyColorScheme(selectedData, colorScheme);        const chartData = {
            id: Utils.generateId(),
            name: chartTitle,
            type: chartType,
            data: selectedData.map(item => ({
                id: item.id,
                label: item.label,
                value: item.value,
                category: item.category,
                color: item.color || '#3498db'
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };        // 保存图表
        const success = DashboardManager.saveChart(chartData);
        
        if (success) {
            // 显示创建动画
            this.showChartCreationAnimation();
            
            // 清空表单
            this.clearSelection();
            document.getElementById('chartTitle').value = '';
            document.getElementById('chartType').value = 'bar';
            document.getElementById('colorScheme').value = 'default';
            this.updatePreview();
            
            // 1.5秒后跳转到仪表盘
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);        } else {
            Utils.showMessage('图表保存失败，请重试', 'error');
        }
    },    /**
     * 按分类选择数据
     */
    selectByCategory: function() {
        const categorySelect = document.getElementById('categorySelect');
        if (!categorySelect || !categorySelect.value) {
            Utils.showMessage('请先选择一个分类', 'warning');
            return;
        }

        const selectedCategory = categorySelect.value;
        const allData = DataManager.getAllData();
        const categoryData = allData.filter(item => item.category === selectedCategory);

        if (categoryData.length === 0) {
            Utils.showMessage(`分类 "${selectedCategory}" 下没有数据`, 'info');
            return;
        }

        // 计算新选择的数据数量
        let newSelectionCount = 0;
        categoryData.forEach(item => {
            if (!this.selectedDataIds.includes(item.id)) {
                this.selectedDataIds.push(item.id);
                newSelectionCount++;
            }
        });

        if (newSelectionCount === 0) {
            Utils.showMessage(`分类 "${selectedCategory}" 下的所有数据都已选择`, 'info');
        } else {
            // 刷新显示
            this.loadAvailableData();
            this.updateSelectedDataDisplay();
            this.updatePreview();
            
            Utils.showMessage(`已选择分类 "${selectedCategory}" 下的 ${newSelectionCount} 项新数据`, 'success');
        }
    },

    /**
     * 显示图表创建动画
     */
    showChartCreationAnimation: function() {
        // 创建动画容器
        const animationHTML = `
            <div class="chart-creation-animation" id="chartCreationAnimation">
                <div class="animation-content">
                    <div class="animation-icon">📊</div>
                    <div class="animation-title">正在创建图表...</div>
                    <div class="animation-message">请稍等片刻</div>
                    <div class="animation-progress">
                        <div class="animation-progress-bar" id="animationProgressBar"></div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', animationHTML);
        const animation = document.getElementById('chartCreationAnimation');
        const progressBar = document.getElementById('animationProgressBar');

        // 显示动画
        setTimeout(() => {
            animation.classList.add('show');
        }, 100);

        // 进度条动画
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                
                // 显示成功状态
                setTimeout(() => {
                    const animationContent = animation.querySelector('.animation-content');
                    animationContent.innerHTML = `
                        <div class="animation-icon">✅</div>
                        <div class="animation-title">图表创建成功!</div>
                        <div class="animation-message">即将跳转到仪表盘...</div>
                    `;
                    
                    // 2秒后移除动画
                    setTimeout(() => {
                        animation.remove();
                    }, 1500);
                }, 500);
            }
            progressBar.style.width = progress + '%';
        }, 150);
    }
};

// 将chartCreator添加到全局作用域
window.chartCreator = ChartCreator;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    if (typeof DataManager !== 'undefined') {
        DataManager.init();
    }
    
    ChartCreator.init();
});
