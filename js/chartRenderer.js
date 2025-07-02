/**
 * 图表渲染模块 - 负责在Canvas上绘制各种类型的图表
 */

const ChartRenderer = {
    /**
     * 通用图表渲染方法
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {Object} config - 图表配置
     */
    renderChart: function(canvas, config) {
        if (!canvas || !config || !config.data || config.data.length === 0) {
            console.warn('渲染图表失败：缺少必要参数');
            return;
        }

        const { type = 'bar', data, title = '图表', ...options } = config;

        try {
            switch (type) {
                case 'bar':
                    this.renderBarChart(canvas, data, { title, ...options });
                    break;
                case 'line':
                    this.renderLineChart(canvas, data, { title, ...options });
                    break;
                case 'pie':
                    this.renderPieChart(canvas, data, { title, ...options });
                    break;
                default:
                    console.warn(`不支持的图表类型: ${type}`);
                    this.renderBarChart(canvas, data, { title, ...options });
            }
        } catch (error) {
            console.error('图表渲染失败:', error);
            // 清空画布并显示错误信息
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff0000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('图表渲染失败', canvas.width / 2, canvas.height / 2);
        }
    },

    /**
     * 绘制柱状图
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {Array} data - 数据数组
     * @param {Object} options - 配置选项
     */
    renderBarChart: function(canvas, data, options = {}) {
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        
        // 默认配置
        const config = {
            title: options.title || '柱状图',
            colors: options.colors || this.getDataColors(data),
            padding: options.padding || { top: 60, right: 40, bottom: 80, left: 60 },
            showValues: options.showValues !== false,
            showGrid: options.showGrid !== false,
            ...options
        };

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 计算绘图区域
        const chartWidth = width - config.padding.left - config.padding.right;
        const chartHeight = height - config.padding.top - config.padding.bottom;
        const chartLeft = config.padding.left;
        const chartTop = config.padding.top;

        // 计算数据范围
        const maxValue = Math.max(...data.map(item => item.value));
        const minValue = Math.min(...data.map(item => item.value), 0);
        const valueRange = maxValue - minValue;

        // 绘制背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 绘制标题
        this.drawTitle(ctx, config.title, width / 2, 30);

        // 绘制网格
        if (config.showGrid) {
            this.drawGrid(ctx, chartLeft, chartTop, chartWidth, chartHeight, maxValue, minValue);
        }

        // 绘制柱子
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        data.forEach((item, index) => {
            const barHeight = (item.value - minValue) / valueRange * chartHeight;
            const x = chartLeft + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = chartTop + chartHeight - barHeight;

            // 绘制柱子
            ctx.fillStyle = config.colors[index % config.colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            // 绘制边框
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // 绘制数值标签
            if (config.showValues) {
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.formatNumber(item.value), x + barWidth / 2, y - 5);
            }

            // 绘制X轴标签
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, chartTop + chartHeight + 20);
        });

        // 绘制Y轴标签
        this.drawYAxisLabels(ctx, chartLeft - 10, chartTop, chartHeight, maxValue, minValue);
    },

    /**
     * 绘制折线图
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {Array} data - 数据数组
     * @param {Object} options - 配置选项
     */
    renderLineChart: function(canvas, data, options = {}) {
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        
        // 默认配置
        const config = {
            title: options.title || '折线图',
            lineColor: options.lineColor || '#3498db',
            pointColor: options.pointColor || '#2980b9',
            padding: options.padding || { top: 60, right: 40, bottom: 80, left: 60 },
            showPoints: options.showPoints !== false,
            showValues: options.showValues !== false,
            showGrid: options.showGrid !== false,
            lineWidth: options.lineWidth || 3,
            pointRadius: options.pointRadius || 4,
            ...options
        };

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 计算绘图区域
        const chartWidth = width - config.padding.left - config.padding.right;
        const chartHeight = height - config.padding.top - config.padding.bottom;
        const chartLeft = config.padding.left;
        const chartTop = config.padding.top;

        // 计算数据范围
        const maxValue = Math.max(...data.map(item => item.value));
        const minValue = Math.min(...data.map(item => item.value), 0);
        const valueRange = maxValue - minValue;

        // 绘制背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 绘制标题
        this.drawTitle(ctx, config.title, width / 2, 30);

        // 绘制网格
        if (config.showGrid) {
            this.drawGrid(ctx, chartLeft, chartTop, chartWidth, chartHeight, maxValue, minValue);
        }

        // 计算点的位置
        const points = data.map((item, index) => {
            const x = chartLeft + (index / (data.length - 1)) * chartWidth;
            const y = chartTop + chartHeight - ((item.value - minValue) / valueRange * chartHeight);
            return { x, y, value: item.value, label: item.label };
        });

        // 绘制折线
        ctx.beginPath();
        ctx.strokeStyle = config.lineColor;
        ctx.lineWidth = config.lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();

        // 绘制数据点
        if (config.showPoints) {
            points.forEach((point, index) => {
                ctx.beginPath();
                ctx.fillStyle = config.pointColor;
                ctx.arc(point.x, point.y, config.pointRadius, 0, Math.PI * 2);
                ctx.fill();

                // 绘制点的边框
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 绘制数值标签
                if (config.showValues) {
                    ctx.fillStyle = '#333';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.formatNumber(point.value), point.x, point.y - 15);
                }

                // 绘制X轴标签
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(point.label, point.x, chartTop + chartHeight + 20);
            });
        }

        // 绘制Y轴标签
        this.drawYAxisLabels(ctx, chartLeft - 10, chartTop, chartHeight, maxValue, minValue);
    },

    /**
     * 绘制饼图
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {Array} data - 数据数组
     * @param {Object} options - 配置选项
     */
    renderPieChart: function(canvas, data, options = {}) {
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        
        // 默认配置
        const config = {
            title: options.title || '饼图',
            colors: options.colors || this.getDataColors(data),
            showLabels: options.showLabels !== false,
            showPercentages: options.showPercentages !== false,
            showLegend: options.showLegend !== false,
            ...options
        };

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 绘制标题
        this.drawTitle(ctx, config.title, width / 2, 30);

        // 计算饼图区域
        const centerX = width / 2;
        const centerY = height / 2 + 20;
        const radius = Math.min(width, height) / 3;

        // 计算总值
        const totalValue = data.reduce((sum, item) => sum + item.value, 0);

        // 绘制饼图扇形
        let currentAngle = -Math.PI / 2; // 从顶部开始

        data.forEach((item, index) => {
            const angle = (item.value / totalValue) * Math.PI * 2;
            const color = config.colors[index % config.colors.length];

            // 绘制扇形
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fill();

            // 绘制边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制标签
            if (config.showLabels || config.showPercentages) {
                const labelAngle = currentAngle + angle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';

                if (config.showLabels && config.showPercentages) {
                    const percentage = ((item.value / totalValue) * 100).toFixed(1);
                    ctx.fillText(item.label, labelX, labelY - 6);
                    ctx.fillText(`${percentage}%`, labelX, labelY + 8);
                } else if (config.showLabels) {
                    ctx.fillText(item.label, labelX, labelY);
                } else if (config.showPercentages) {
                    const percentage = ((item.value / totalValue) * 100).toFixed(1);
                    ctx.fillText(`${percentage}%`, labelX, labelY);
                }
            }

            currentAngle += angle;
        });

        // 绘制图例
        if (config.showLegend) {
            this.drawLegend(ctx, data, config.colors, width - 150, 80);
        }
    },

    /**
     * 绘制标题
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {string} title - 标题文本
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    drawTitle: function(ctx, title, x, y) {
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, x, y);
    },

    /**
     * 绘制网格
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} x - 左边界
     * @param {number} y - 上边界
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} maxValue - 最大值
     * @param {number} minValue - 最小值
     */
    drawGrid: function(ctx, x, y, width, height, maxValue, minValue) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;

        // 绘制水平网格线
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const lineY = y + (height / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(x, lineY);
            ctx.lineTo(x + width, lineY);
            ctx.stroke();
        }

        // 绘制边框
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    },

    /**
     * 绘制Y轴标签
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} height - 高度
     * @param {number} maxValue - 最大值
     * @param {number} minValue - 最小值
     */
    drawYAxisLabels: function(ctx, x, y, height, maxValue, minValue) {
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';

        const gridLines = 5;
        const valueRange = maxValue - minValue;

        for (let i = 0; i <= gridLines; i++) {
            const value = maxValue - (valueRange / gridLines) * i;
            const labelY = y + (height / gridLines) * i + 4; // +4 for vertical centering
            ctx.fillText(this.formatNumber(value), x, labelY);
        }
    },

    /**
     * 绘制图例
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {Array} data - 数据数组
     * @param {Array} colors - 颜色数组
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    drawLegend: function(ctx, data, colors, x, y) {
        ctx.font = '12px Arial';
        
        data.forEach((item, index) => {
            const legendY = y + index * 25;
            
            // 绘制颜色方块
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, legendY - 8, 12, 12);
            
            // 绘制边框
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, legendY - 8, 12, 12);
            
            // 绘制标签
            ctx.fillStyle = '#333';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + 20, legendY + 2);
        });
    },

    /**
     * 获取数据项的颜色数组
     * @param {Array} data - 数据数组
     * @returns {Array} 颜色数组
     */
    getDataColors: function(data) {
        const defaultColors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ];
        
        return data.map((item, index) => {
            return item.color || defaultColors[index % defaultColors.length];
        });
    },

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的数字
     */
    formatNumber: function(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    }
};

// 创建全局引用
window.chartRenderer = ChartRenderer;
