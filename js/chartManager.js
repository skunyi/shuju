/**
 * 图表管理模块 - 管理图表的显示和更新
 */

const ChartManager = {
    // 图表实例缓存
    charts: {},

    /**
     * 初始化图表管理器
     */
    init: function() {
        this.bindEventListeners();
        this.initializeCharts();
        this.updateStatistics();
        console.log('图表管理器初始化完成');
    },

    /**
     * 绑定事件监听器
     */
    bindEventListeners: function() {
        // 监听数据变化事件
        document.addEventListener('dataChanged', (e) => {
            this.handleDataChange(e.detail);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', Utils.debounce(() => {
            this.resizeCharts();
        }, 300));
    },

    /**
     * 初始化所有图表
     */
    initializeCharts: function() {
        this.renderBarChart();
        this.renderLineChart();
        this.renderPieChart();
    },

    /**
     * 处理数据变化
     * @param {Object} eventDetail - 事件详情
     */
    handleDataChange: function(eventDetail) {
        const { data, statistics } = eventDetail;
        
        // 更新所有图表
        this.renderBarChart();
        this.renderLineChart();
        this.renderPieChart();
        
        // 更新统计信息
        this.updateStatistics(statistics);
        
        console.log('图表已更新，数据条数:', data.length);
    },    /**
     * 渲染柱状图
     */
    renderBarChart: function() {
        const canvas = document.getElementById('barChart');
        if (!canvas) return;

        const data = DataManager.getAllData();
        
        if (data.length === 0) {
            this.showNoDataMessage(canvas, '暂无数据');
            return;
        }

        const options = {
            title: '数据柱状图',
            colorScheme: 'default',
            showValues: true,
            showGrid: true
        };

        try {
            ChartRenderer.renderBarChart(canvas, data, options);
            this.charts.barChart = { canvas, data, options };
        } catch (error) {
            console.error('渲染柱状图失败:', error);
            this.showErrorMessage(canvas, '渲染图表失败');
        }
    },

    /**
     * 渲染折线图
     */    renderLineChart: function() {
        const canvas = document.getElementById('lineChart');
        if (!canvas) return;

        const data = DataManager.getAllData();
        
        if (data.length === 0) {
            this.showNoDataMessage(canvas, '暂无数据');
            return;
        }

        // 按值排序以获得更好的折线效果
        const sortedData = [...data].sort((a, b) => a.value - b.value);

        const options = {
            title: '数据趋势图',
            lineColor: '#3498db',
            pointColor: '#2980b9',
            showPoints: true,
            showValues: true,
            showGrid: true,
            lineWidth: 3,
            pointRadius: 5
        };

        try {
            ChartRenderer.renderLineChart(canvas, sortedData, options);
            this.charts.lineChart = { canvas, data: sortedData, options };
        } catch (error) {
            console.error('渲染折线图失败:', error);
            this.showErrorMessage(canvas, '渲染图表失败');
        }
    },

    /**
     * 渲染饼图
     */
    renderPieChart: function() {
        const canvas = document.getElementById('pieChart');
        if (!canvas) return;        const data = DataManager.getAllData();
        
        if (data.length === 0) {
            this.showNoDataMessage(canvas, '暂无数据');
            return;
        }

        const options = {
            title: '数据分布图',
            colorScheme: 'warm',
            showLabels: true,
            showPercentages: true,
            showLegend: data.length <= 8 // 只有数据较少时显示图例
        };

        try {
            ChartRenderer.renderPieChart(canvas, data, options);
            this.charts.pieChart = { canvas, data, options };
        } catch (error) {
            console.error('渲染饼图失败:', error);
            this.showErrorMessage(canvas, '渲染图表失败');
        }
    },

    /**
     * 显示无数据消息
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {string} message - 消息文本
     */
    showNoDataMessage: function(canvas, message = '暂无数据') {
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制背景
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);

        // 绘制边框
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);

        // 绘制消息
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, width / 2, height / 2);

        // 绘制提示图标
        ctx.beginPath();
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 3;
        ctx.arc(width / 2, height / 2 - 40, 20, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制感叹号
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(width / 2 - 2, height / 2 - 50, 4, 12);
        ctx.fillRect(width / 2 - 2, height / 2 - 35, 4, 4);
    },

    /**
     * 显示错误消息
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {string} message - 错误消息
     */
    showErrorMessage: function(canvas, message = '发生错误') {
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制背景
        ctx.fillStyle = '#fdf2f2';
        ctx.fillRect(0, 0, width, height);

        // 绘制边框
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);

        // 绘制错误消息
        ctx.fillStyle = '#dc2626';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, width / 2, height / 2);
    },

    /**
     * 更新统计信息
     * @param {Object} statistics - 统计数据
     */    updateStatistics: function(statistics = null) {
        const statsContainer = document.getElementById('statsInfo');
        if (!statsContainer) return;

        const stats = statistics || DataManager.getStatistics();

        if (stats.totalCount === 0) {
            statsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无统计数据</p>';
            return;
        }

        const statsHTML = `
            <div class="stat-item">
                <div class="stat-label">总条数</div>
                <div class="stat-value">${stats.totalCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">总数值</div>
                <div class="stat-value">${Utils.formatNumber(stats.totalValue)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">平均值</div>
                <div class="stat-value">${Utils.formatNumber(stats.averageValue)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">最大值</div>
                <div class="stat-value">${Utils.formatNumber(stats.maxValue)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">最小值</div>
                <div class="stat-value">${Utils.formatNumber(stats.minValue)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">分类数</div>
                <div class="stat-value">${Object.keys(stats.categories).length}</div>
            </div>
        `;

        statsContainer.innerHTML = statsHTML;
    },

    /**
     * 调整图表大小
     */
    resizeCharts: function() {
        // 重新渲染所有图表以适应新的尺寸
        setTimeout(() => {
            this.renderBarChart();
            this.renderLineChart();
            this.renderPieChart();
        }, 100);
    },

    /**
     * 导出图表为图片
     * @param {string} chartType - 图表类型
     * @returns {string} 图片数据URL
     */
    exportChart: function(chartType) {
        const canvas = document.getElementById(chartType + 'Chart');
        if (!canvas) {
            Utils.showMessage('未找到指定的图表', 'error');
            return null;
        }

        try {
            const dataURL = canvas.toDataURL('image/png');
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `${chartType}_chart_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataURL;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Utils.showMessage('图表导出成功', 'success');
            return dataURL;
        } catch (error) {
            console.error('导出图表失败:', error);
            Utils.showMessage('导出图表失败', 'error');
            return null;
        }
    },

    /**
     * 获取图表实例
     * @param {string} chartType - 图表类型
     * @returns {Object} 图表实例
     */
    getChart: function(chartType) {
        return this.charts[chartType + 'Chart'] || null;
    },

    /**
     * 清空所有图表
     */
    clearAllCharts: function() {
        Object.keys(this.charts).forEach(chartKey => {
            const chart = this.charts[chartKey];
            if (chart && chart.canvas) {
                this.showNoDataMessage(chart.canvas, '暂无数据');
            }
        });
        
        this.updateStatistics();
    },

    /**
     * 刷新所有图表
     */
    refreshAllCharts: function() {
        this.renderBarChart();
        this.renderLineChart();
        this.renderPieChart();
        this.updateStatistics();
        Utils.showMessage('图表已刷新', 'success');
    }
};

// 创建全局引用
window.chartManager = ChartManager;
