/**
 * 仪表盘管理模块 - 负责管理图表的展示、编辑和删除
 */

const DashboardManager = {
    // 存储键名
    CHARTS_STORAGE_KEY: 'saved_charts',
    
    // 当前图表缓存
    chartsCache: [],
    
    // 当前编辑的图表ID
    currentChartId: null,
    
    // 当前编辑的数据项索引
    currentDataIndex: null,
      // 当前活动标签页
    activeTab: 'info',/**
     * 初始化仪表盘管理器
     */
    init: function() {
        this.bindEventListeners();
        this.bindChartTypeChange();
        this.initColorPicker();
        this.loadChartsFromStorage();
        this.renderChartsGrid();
        console.log('仪表盘管理器初始化完成');
    },/**
     * 绑定事件监听器
     */
    bindEventListeners: function() {
        // 监听窗口大小变化
        window.addEventListener('resize', Utils.debounce(() => {
            // 如果模态框是打开的，重新渲染图表
            const modal = document.getElementById('chartDetailModal');
            if (modal && modal.classList.contains('show') && this.currentChartId) {
                const chart = this.chartsCache.find(c => c.id === this.currentChartId);
                if (chart) {
                    console.log('窗口大小变化，重新渲染图表');
                    this.renderDetailChart(chart);
                }
            }
        }, 300));

        // 监听模态框显示事件
        const modal = document.getElementById('chartDetailModal');
        if (modal) {
            // 使用MutationObserver监听class变化
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isShowing = modal.classList.contains('show');
                        if (isShowing && this.currentChartId) {
                            // 模态框显示时，延迟渲染图表
                            setTimeout(() => {
                                const chart = this.chartsCache.find(c => c.id === this.currentChartId);
                                if (chart) {
                                    console.log('模态框显示，渲染图表');
                                    this.renderDetailChart(chart);
                                }
                            }, 200);
                        }
                    }
                });
            });
            
            observer.observe(modal, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    },/**
     * 从本地存储加载图表
     */
    loadChartsFromStorage: function() {
        const storedCharts = Utils.storage.get(this.CHARTS_STORAGE_KEY, []);
        this.chartsCache = Array.isArray(storedCharts) ? storedCharts : [];
        
        console.log('从本地存储加载图表:', this.chartsCache.length, '个图表');
    },

    /**
     * 保存图表到本地存储
     */
    saveChartsToStorage: function() {
        const success = Utils.storage.set(this.CHARTS_STORAGE_KEY, this.chartsCache);
        if (success) {
            console.log('图表已保存到本地存储');
        }
        return success;
    },    /**
     * 保存图表到缓存和存储
     * @param {Object} chartData - 图表数据
     * @returns {boolean} - 保存是否成功
     */
    saveChart: function(chartData) {
        try {
            this.chartsCache.push(chartData);
            const success = this.saveChartsToStorage();
            if (success) {
                this.renderChartsGrid();
            }
            return success;
        } catch (error) {
            console.error('保存图表失败:', error);
            return false;
        }
    },

    /**
     * 渲染图表网格
     */
    renderChartsGrid: function() {
        const chartsGrid = document.getElementById('chartsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!chartsGrid) return;        if (this.chartsCache.length === 0) {
            chartsGrid.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'flex';
                emptyState.style.flexDirection = 'column';
                emptyState.style.alignItems = 'center';
                emptyState.style.justifyContent = 'center';
            }
            return;
        }

        chartsGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        const chartsHTML = this.chartsCache.map(chart => this.createChartCard(chart)).join('');
        chartsGrid.innerHTML = chartsHTML;

        // 渲染每个图表的缩略图
        setTimeout(() => {
            this.chartsCache.forEach(chart => {
                this.renderChartThumbnail(chart);
            });
        }, 100);
    },

    /**
     * 创建图表卡片HTML
     * @param {Object} chart - 图表对象
     * @returns {string} HTML字符串
     */
    createChartCard: function(chart) {
        const typeText = this.getChartTypeText(chart.type);
        const dataCount = chart.data ? chart.data.length : 0;
        const updateTime = new Date(chart.updatedAt).toLocaleDateString();

        return `
            <div class="chart-card" data-chart-id="${chart.id}" ondblclick="dashboardManager.showChartDetail('${chart.id}')">
                <div class="chart-card-header">
                    <h3 class="chart-title" title="${chart.name}">${chart.name}</h3>                    <div class="chart-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); dashboardManager.showChartDetail('${chart.id}')" title="查看详情">
                            <span class="icon-eye"></span>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); dashboardManager.duplicateChart('${chart.id}')" title="复制图表">
                            <span class="icon-copy"></span>
                        </button>
                        <button class="btn-icon btn-danger" onclick="event.stopPropagation(); dashboardManager.confirmDeleteChart('${chart.id}')" title="删除图表">
                            <span class="icon-delete"></span>
                        </button>
                    </div>
                </div>
                
                <div class="chart-thumbnail">
                    <canvas id="thumb_${chart.id}" width="300" height="200"></canvas>
                </div>
                
                <div class="chart-card-footer">
                    <div class="chart-meta">
                        <span class="chart-type">${typeText}</span>
                        <span class="data-count">${dataCount} 项数据</span>
                    </div>
                    <div class="chart-update-time">
                        更新于 ${updateTime}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 获取图表类型文本
     * @param {string} type - 图表类型
     * @returns {string} 类型文本
     */
    getChartTypeText: function(type) {
        const typeMap = {
            'bar': '柱状图',
            'line': '折线图',
            'pie': '饼图'
        };
        return typeMap[type] || '未知类型';
    },

    /**
     * 渲染图表缩略图
     * @param {Object} chart - 图表对象
     */
    renderChartThumbnail: function(chart) {
        const canvas = document.getElementById(`thumb_${chart.id}`);
        if (!canvas || !chart.data || chart.data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 根据图表类型渲染缩略图
        switch (chart.type) {
            case 'bar':
                this.renderBarThumbnail(ctx, chart.data, width, height);
                break;
            case 'line':
                this.renderLineThumbnail(ctx, chart.data, width, height);
                break;
            case 'pie':
                this.renderPieThumbnail(ctx, chart.data, width, height);
                break;
        }
    },

    /**
     * 渲染柱状图缩略图
     */
    renderBarThumbnail: function(ctx, data, width, height) {
        const margin = 20;
        const chartWidth = width - 2 * margin;
        const chartHeight = height - 2 * margin;
        const barWidth = chartWidth / data.length * 0.8;
        const maxValue = Math.max(...data.map(d => d.value));

        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = margin + index * (chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
            const y = height - margin - barHeight;

            ctx.fillStyle = item.color || '#3498db';
            ctx.fillRect(x, y, barWidth, barHeight);
        });
    },

    /**
     * 渲染折线图缩略图
     */
    renderLineThumbnail: function(ctx, data, width, height) {
        const margin = 20;
        const chartWidth = width - 2 * margin;
        const chartHeight = height - 2 * margin;
        const maxValue = Math.max(...data.map(d => d.value));

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((item, index) => {
            const x = margin + (index / (data.length - 1)) * chartWidth;
            const y = height - margin - (item.value / maxValue) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // 绘制数据点
            ctx.fillStyle = item.color || '#3498db';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
        });

        ctx.stroke();
    },

    /**
     * 渲染饼图缩略图
     */
    renderPieThumbnail: function(ctx, data, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        const total = data.reduce((sum, item) => sum + item.value, 0);

        let currentAngle = -Math.PI / 2;

        data.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            ctx.fillStyle = item.color || '#3498db';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            currentAngle += sliceAngle;
        });
    },    /**
     * 显示图表详情
     * @param {string} chartId - 图表ID
     */
    showChartDetail: function(chartId) {
        const chart = this.chartsCache.find(c => c.id === chartId);
        if (!chart) return;

        this.currentChartId = chartId;
        this.activeTab = 'info';

        // 填充表单数据
        document.getElementById('chartDetailTitle').textContent = `图表详情 - ${chart.name}`;
        document.getElementById('detailChartName').value = chart.name;
        document.getElementById('detailChartType').value = chart.type;
        document.getElementById('detailCreateTime').textContent = new Date(chart.createdAt).toLocaleString();
        document.getElementById('detailUpdateTime').textContent = new Date(chart.updatedAt).toLocaleString();

        // 更新统计信息
        this.updateChartStats(chart);

        // 渲染图表数据列表
        this.renderChartDataList(chart.data || []);

        // 切换到图表信息标签页
        this.switchTab('info');

        // 显示弹出窗口
        const modal = document.getElementById('chartDetailModal');
        modal.classList.add('show');

        // 显示加载状态
        this.showChartLoading(true);

        // 延迟渲染详细图表，确保模态框动画完成
        setTimeout(() => {
            this.renderDetailChart(chart);
        }, 200);
    },

    /**
     * 显示图表加载状态
     * @param {boolean} show - 是否显示加载状态
     */
    showChartLoading: function(show) {
        const loading = document.getElementById('chartLoading');
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    },

    /**
     * 更新图表统计信息
     * @param {Object} chart - 图表对象
     */
    updateChartStats: function(chart) {
        const data = chart.data || [];
        const dataCount = data.length;
        const dataTotal = data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);

        document.getElementById('dataCount').textContent = dataCount;
        document.getElementById('dataTotal').textContent = Utils.formatNumber(dataTotal);
    },    /**
     * 切换标签页
     * @param {string} tabName - 标签页名称
     */
    switchTab: function(tabName) {
        this.activeTab = tabName;

        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 隐藏所有标签页内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 显示对应的标签页和激活对应按钮
        if (tabName === 'info') {
            document.querySelector('.tab-btn[data-tab="info"]').classList.add('active');
            document.getElementById('infoTab').classList.add('active');
        } else if (tabName === 'data') {
            document.querySelector('.tab-btn[data-tab="data"]').classList.add('active');
            document.getElementById('dataTab').classList.add('active');
        }
    },    /**
     * 渲染图表数据列表
     * @param {Array} data - 数据数组
     */
    renderChartDataList: function(data) {
        const dataList = document.getElementById('chartDataList');
        if (!dataList) return;

        if (data.length === 0) {
            dataList.innerHTML = `
                <div class="empty-data-message">
                    <div style="text-align: center; padding: var(--spacing-4); color: var(--text-muted);">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                        <p style="margin: 0; font-size: 0.875rem;">暂无数据</p>
                        <p style="margin: 4px 0 0; font-size: 0.75rem; opacity: 0.7;">点击"添加数据"按钮开始添加</p>
                    </div>
                </div>
            `;
            return;
        }

        const listHTML = data.map((item, index) => `
            <div class="data-item">
                <div class="data-color-indicator" style="background-color: ${item.color || '#3498db'}"></div>
                <div class="data-info">
                    <div class="data-label" title="${item.label || ''}">${item.label || '未命名'}</div>
                    <div class="data-value">值: ${Utils.formatNumber(item.value || 0)}</div>
                </div>
                <div class="data-actions-btn">
                    <button class="data-action-btn" onclick="dashboardManager.editChartData(${index})" title="编辑">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="data-action-btn delete" onclick="dashboardManager.deleteChartData(${index})" title="删除">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        dataList.innerHTML = listHTML;    },    /**
     * 渲染详细图表 - 改进版本
     * @param {Object} chart - 图表对象
     */
    renderDetailChart: function(chart) {
        const canvas = document.getElementById('chartDetailCanvas');
        if (!canvas || !chart.data || chart.data.length === 0) {
            this.showChartLoading(false);
            return;
        }

        // 获取容器的实际尺寸
        const container = canvas.parentElement;
        
        // 等待容器完全渲染
        setTimeout(() => {
            const containerRect = container.getBoundingClientRect();
            
            // 计算Canvas的尺寸 - 确保图表完全在容器内显示
            const containerWidth = Math.max(400, containerRect.width - 40);
            const containerHeight = Math.max(300, containerRect.height - 40);
            
            // 设置合适的图表尺寸，保持长宽比并确保完全显示
            const aspectRatio = 4 / 3; // 4:3 比例
            let displayWidth, displayHeight;
            
            if (containerWidth / containerHeight > aspectRatio) {
                // 容器较宽，以高度为准
                displayHeight = Math.min(containerHeight * 0.95, 450);
                displayWidth = displayHeight * aspectRatio;
            } else {
                // 容器较高，以宽度为准
                displayWidth = Math.min(containerWidth * 0.95, 600);
                displayHeight = displayWidth / aspectRatio;
            }
            
            // 设置Canvas尺寸
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            canvas.style.width = displayWidth + 'px';
            canvas.style.height = displayHeight + 'px';

            const ctx = canvas.getContext('2d');
            
            console.log(`渲染详细图表: ${displayWidth}x${displayHeight}, 容器: ${containerWidth}x${containerHeight}`);

            // 清空画布
            ctx.clearRect(0, 0, displayWidth, displayHeight);

            // 使用图表渲染器 - 根据图表类型调整配置，增加适当内边距
            const config = {
                type: chart.type,
                title: chart.name,
                data: chart.data,
                showValues: true,
                showGrid: chart.type !== 'pie',
                showLegend: chart.type === 'pie' && chart.data.length <= 8,
                padding: this.getChartPadding(chart.type, displayWidth, displayHeight)
            };

            try {
                ChartRenderer.renderChart(canvas, config);
                this.showChartLoading(false);
                console.log(`图表渲染完成: ${displayWidth}x${displayHeight}, 类型: ${chart.type}`);
            } catch (error) {
                console.error('图表渲染失败:', error);
                this.showChartLoading(false);
                // 显示错误信息
                ctx.fillStyle = '#e74c3c';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('图表加载失败', displayWidth / 2, displayHeight / 2);
                ctx.fillStyle = '#7f8c8d';
                ctx.font = '14px Arial';
                ctx.fillText('请检查数据格式', displayWidth / 2, displayHeight / 2 + 25);
            }
        }, 100);
    },/**
     * 根据图表类型获取合适的内边距
     * @param {string} type - 图表类型
     * @param {number} width - 图表宽度
     * @param {number} height - 图表高度
     * @returns {Object} 内边距配置
     */
    getChartPadding: function(type, width, height) {
        const basePadding = {
            top: Math.max(60, height * 0.15),
            right: Math.max(50, width * 0.12),
            bottom: Math.max(100, height * 0.22),
            left: Math.max(80, width * 0.15)
        };

        // 根据图表类型调整内边距
        switch (type) {
            case 'pie':
                return {
                    top: Math.max(40, height * 0.1),
                    right: Math.max(40, width * 0.1),
                    bottom: Math.max(40, height * 0.1),
                    left: Math.max(40, width * 0.1)
                };
            case 'line':
                return {
                    ...basePadding,
                    left: Math.max(100, width * 0.18) // 折线图需要更多左边距显示Y轴标签
                };
            case 'bar':
            default:
                return basePadding;
        }
    },

    /**
     * 保存图表修改
     */
    saveChartChanges: function() {
        if (!this.currentChartId) return;

        const chart = this.chartsCache.find(c => c.id === this.currentChartId);
        if (!chart) return;

        const newName = document.getElementById('detailChartName').value.trim();
        const newType = document.getElementById('detailChartType').value;

        if (!newName) {
            Utils.showMessage('图表名称不能为空', 'error');
            return;
        }

        // 检查图表类型是否改变
        const typeChanged = chart.type !== newType;

        // 更新图表信息
        chart.name = newName;
        chart.type = newType;
        chart.updatedAt = new Date().toISOString();

        // 如果类型改变，需要重新渲染图表
        if (typeChanged) {
            Utils.showMessage('图表类型已更改，正在重新渲染...', 'info');
        }

        // 保存到本地存储
        this.saveChartsToStorage();

        // 重新渲染
        this.renderChartsGrid();
        this.renderDetailChart(chart);
        this.updateChartStats(chart);

        // 更新模态框标题
        document.getElementById('chartDetailTitle').textContent = `图表详情 - ${chart.name}`;

        Utils.showMessage('图表修改已保存', 'success');
    },    /**
     * 关闭图表详情弹窗
     */
    closeChartDetailModal: function() {
        const modal = document.getElementById('chartDetailModal');
        modal.classList.remove('show');
        this.currentChartId = null;
        this.activeTab = 'info';
        this.showChartLoading(false);
    },

    /**
     * 删除图表数据
     * @param {number} index - 数据索引
     */
    deleteChartData: function(index) {
        if (!this.currentChartId) return;

        const chart = this.chartsCache.find(c => c.id === this.currentChartId);
        if (!chart || !chart.data || !chart.data[index]) return;

        const item = chart.data[index];
        
        if (!confirm(`确定要删除数据项 "${item.label}" 吗？`)) {
            return;
        }

        // 删除数据项
        const deletedItem = chart.data.splice(index, 1)[0];
        chart.updatedAt = new Date().toISOString();

        // 保存并刷新
        this.saveChartsToStorage();
        this.updateChartStats(chart);
        this.renderChartDataList(chart.data);
        this.renderDetailChart(chart);
        this.renderChartsGrid();

        Utils.showMessage(`数据项 "${deletedItem.label}" 已删除`, 'success');
    },

    /**
     * 导出图表
     */
    exportChart: function() {
        if (!this.currentChartId) return;

        const chart = this.chartsCache.find(c => c.id === this.currentChartId);
        if (!chart) return;

        const canvas = document.getElementById('chartDetailCanvas');
        if (!canvas) {
            Utils.showMessage('无法获取图表画布', 'error');
            return;
        }

        try {
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `${chart.name}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Utils.showMessage('图表已导出', 'success');
        } catch (error) {
            console.error('导出图表失败:', error);
            Utils.showMessage('导出图表失败', 'error');
        }
    },

    /**
     * 复制图表
     * @param {string} chartId - 图表ID
     */
    duplicateChart: function(chartId) {
        const chart = this.chartsCache.find(c => c.id === chartId);
        if (!chart) return;

        const newChart = {
            ...chart,
            id: Utils.generateId(),
            name: chart.name + ' (副本)',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.chartsCache.push(newChart);
        this.saveChartsToStorage();
        this.renderChartsGrid();
        Utils.showMessage(`图表 "${newChart.name}" 已创建`, 'success');
    },

    /**
     * 创建新图表
     */
    createNewChart: function() {
        // 切换到图表创建页面
        if (window.eventHandler) {
            eventHandler.switchTab('chart-creator');
        }
    },

    /**
     * 刷新仪表盘
     */
    refreshDashboard: function() {
        this.loadChartsFromStorage();
        this.renderChartsGrid();
        Utils.showMessage('仪表盘已刷新', 'info');
    },

    /**
     * 编辑图表数据
     * @param {number} index - 数据索引
     */
    editChartData: function(index) {
        if (!this.currentChartId) return;

        const chart = this.chartsCache.find(c => c.id === this.currentChartId);
        if (!chart || !chart.data || !chart.data[index]) return;

        this.currentDataIndex = index;
        const item = chart.data[index];

        // 填充编辑表单
        document.getElementById('dataEditTitle').textContent = '编辑数据项';
        document.getElementById('editDataLabel').value = item.label || '';
        document.getElementById('editDataValue').value = item.value || '';
        document.getElementById('editDataCategory').value = item.category || '';
        document.getElementById('editDataColor').value = item.color || '#3498db';
        
        // 更新颜色预览
        this.updateColorPreview(item.color || '#3498db');

        // 显示编辑弹窗
        const modal = document.getElementById('dataEditModal');
        modal.classList.add('show');
    },

    /**
     * 添加新数据项
     */
    addNewDataItem: function() {
        if (!this.currentChartId) return;

        this.currentDataIndex = -1; // -1 表示新建

        // 清空编辑表单
        document.getElementById('dataEditTitle').textContent = '添加数据项';
        document.getElementById('editDataLabel').value = '';
        document.getElementById('editDataValue').value = '';
        document.getElementById('editDataCategory').value = '';
        
        // 生成随机颜色
        const randomColor = this.generateRandomColorValue();
        document.getElementById('editDataColor').value = randomColor;
        this.updateColorPreview(randomColor);

        // 显示编辑弹窗
        const modal = document.getElementById('dataEditModal');
        modal.classList.add('show');
    },

    /**
     * 关闭数据编辑弹窗
     */
    closeDataEditModal: function() {
        const modal = document.getElementById('dataEditModal');
        modal.classList.remove('show');
        this.currentDataIndex = null;
    },

    /**
     * 保存数据编辑
     */
    saveDataEdit: function() {
        if (!this.currentChartId) return;

        const chart = this.chartsCache.find(c => c.id === this.currentChartId);
        if (!chart) return;

        // 获取表单数据
        const label = document.getElementById('editDataLabel').value.trim();
        const value = document.getElementById('editDataValue').value.trim();
        const category = document.getElementById('editDataCategory').value.trim();
        const color = document.getElementById('editDataColor').value;

        // 验证数据
        if (!label) {
            Utils.showMessage('标签名称不能为空', 'error');
            return;
        }

        if (!value || !Utils.isValidNumber(value)) {
            Utils.showMessage('请输入有效的数值', 'error');
            return;
        }

        const numericValue = parseFloat(value);

        // 创建数据项
        const dataItem = {
            label: label,
            value: numericValue,
            category: category || '默认',
            color: color
        };

        // 确保data数组存在
        if (!chart.data) {
            chart.data = [];
        }        // 更新或添加数据项
        if (this.currentDataIndex === -1) {
            // 添加新数据项
            chart.data.push(dataItem);
            Utils.showMessage('数据项已添加', 'success');
        } else {
            // 更新现有数据项
            chart.data[this.currentDataIndex] = dataItem;
            Utils.showMessage('数据项已更新', 'success');
        }

        // 更新时间戳
        chart.updatedAt = new Date().toISOString();

        // 保存并刷新
        this.saveChartsToStorage();
        this.updateChartStats(chart);
        this.renderChartDataList(chart.data);
        this.renderDetailChart(chart);
        this.renderChartsGrid();

        // 关闭弹窗
        this.closeDataEditModal();
    },

    /**
     * 生成随机颜色
     */
    generateRandomColor: function() {
        const color = this.generateRandomColorValue();
        document.getElementById('editDataColor').value = color;
        this.updateColorPreview(color);
    },

    /**
     * 生成随机颜色值
     * @returns {string} 十六进制颜色值
     */
    generateRandomColorValue: function() {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085',
            '#27ae60', '#2980b9', '#8e44ad', '#f1c40f', '#e91e63',
            '#ff9800', '#673ab7', '#009688', '#4caf50', '#ff5722'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * 更新颜色预览
     * @param {string} color - 颜色值
     */
    updateColorPreview: function(color) {
        const preview = document.getElementById('colorPreview');
        if (preview) {
            preview.style.backgroundColor = color;
        }
    },

    /**
     * 随机化所有颜色
     */
    randomizeColors: function() {
        if (!this.currentChartId) return;

        const chart = this.chartsCache.find(c => c.id === this.currentChartId);
        if (!chart || !chart.data) return;

        // 为每个数据项分配新的随机颜色
        chart.data.forEach(item => {
            item.color = this.generateRandomColorValue();
        });

        // 更新时间戳
        chart.updatedAt = new Date().toISOString();

        // 保存并刷新
        this.saveChartsToStorage();
        this.renderChartDataList(chart.data);
        this.renderDetailChart(chart);
        this.renderChartsGrid();

        Utils.showMessage('已随机分配颜色', 'success');    },

    /**
     * 监听图表类型变更
     */
    bindChartTypeChange: function() {
        const chartTypeSelect = document.getElementById('detailChartType');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', (e) => {
                if (this.currentChartId) {
                    const chart = this.chartsCache.find(c => c.id === this.currentChartId);
                    if (chart && chart.type !== e.target.value) {
                        // 预览类型变更
                        chart.type = e.target.value;
                        this.renderDetailChart(chart);
                        Utils.showMessage('图表类型已变更，记得保存修改', 'info');
                    }
                }
            });
        }
    },

    /**
     * 初始化颜色选择器事件
     */
    initColorPicker: function() {
        const colorInput = document.getElementById('editDataColor');
        if (colorInput) {
            colorInput.addEventListener('change', (e) => {
                this.updateColorPreview(e.target.value);
            });
        }
    },

    /**
     * 获取图表统计信息
     * @param {Object} chart - 图表对象
     * @returns {Object} 统计信息对象
     */
    getChartStatistics: function(chart) {
        const data = chart.data || [];
        const total = data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
        const average = data.length > 0 ? total / data.length : 0;
        const max = data.length > 0 ? Math.max(...data.map(item => parseFloat(item.value) || 0)) : 0;
        const min = data.length > 0 ? Math.min(...data.map(item => parseFloat(item.value) || 0)) : 0;

        return {
            count: data.length,
            total: total,
            average: average,
            max: max,
            min: min
        };
    },

    /**
     * 验证图表数据完整性
     * @param {Object} chart - 图表对象
     * @returns {Object} 验证结果
     */
    validateChartData: function(chart) {
        const issues = [];
        
        if (!chart.name || chart.name.trim() === '') {
            issues.push('图表名称不能为空');
        }
        
        if (!chart.data || chart.data.length === 0) {
            issues.push('图表必须包含至少一个数据项');
        }
        
        if (chart.data) {
            chart.data.forEach((item, index) => {
                if (!item.label || item.label.trim() === '') {
                    issues.push(`数据项 ${index + 1} 缺少标签`);
                }
                if (typeof item.value !== 'number' || isNaN(item.value)) {
                    issues.push(`数据项 ${index + 1} 的数值无效`);
                }
            });
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    },

    /**
     * 清理无效数据
     * @param {Object} chart - 图表对象
     */
    cleanInvalidData: function(chart) {
        if (!chart.data) return;
        
        chart.data = chart.data.filter(item => {
            return item.label && 
                   item.label.trim() !== '' && 
                   typeof item.value === 'number' && 
                   !isNaN(item.value);
        });
        
        chart.updatedAt = new Date().toISOString();
    },

    /**
     * 删除图表
     */
    deleteChart: function() {
        if (!this.currentChartId) return;

        const chart = this.chartsCache.find(c => c.id === this.currentChartId);
        if (!chart) return;

        if (!confirm(`确定要删除图表 "${chart.name}" 吗？此操作不可撤销！`)) {
            return;
        }

        const index = this.chartsCache.findIndex(c => c.id === this.currentChartId);
        if (index !== -1) {
            const deletedChart = this.chartsCache.splice(index, 1)[0];
            this.saveChartsToStorage();
            this.closeChartDetailModal();
            this.renderChartsGrid();
            Utils.showMessage(`图表 "${deletedChart.name}" 已删除`, 'success');
        }
    },

    /**
     * 确认删除图表
     * @param {string} chartId - 图表ID
     */
    confirmDeleteChart: function(chartId) {
        const chart = this.chartsCache.find(c => c.id === chartId);
        if (!chart) return;

        if (!confirm(`确定要删除图表 "${chart.name}" 吗？此操作不可撤销！`)) {
            return;
        }

        const index = this.chartsCache.findIndex(c => c.id === chartId);
        if (index !== -1) {
            this.chartsCache.splice(index, 1);
            this.saveChartsToStorage();
            this.renderChartsGrid();
            Utils.showMessage(`图表 "${chart.name}" 已删除`, 'success');
        }
    },
};


// 创建全局引用
window.dashboardManager = DashboardManager;
