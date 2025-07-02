/**
 * 首页交互脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    // 为快速开始步骤添加点击动画
    const quickStartSteps = document.querySelectorAll('.quick-start-steps li');
    
    quickStartSteps.forEach(step => {
        step.addEventListener('click', function(e) {
            // 创建涟漪效果
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            // 移除涟漪效果
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // 添加点击动画
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // 为功能卡片添加悬停效果
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 添加页面加载动画
    const homeContent = document.querySelector('.home-content');
    if (homeContent) {
        homeContent.style.opacity = '0';
        homeContent.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            homeContent.style.transition = 'all 0.6s ease';
            homeContent.style.opacity = '1';
            homeContent.style.transform = 'translateY(0)';
        }, 100);
    }
});
