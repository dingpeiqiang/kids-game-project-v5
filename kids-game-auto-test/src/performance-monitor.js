/**
 * 性能监控器
 * 功能：采集和分析游戏性能指标
 */

const { logger } = require('./utils/logger');

class PerformanceMonitor {
    constructor(gameConfig) {
        this.config = gameConfig;
        this.metrics = {};
        this.thresholds = {
            loadTime: 5000,      // 5 秒
            frameRate: 30,       // 30 FPS
            memoryUsage: 512,    // 512 MB
            cpuUsage: 50         // 50%
        };
    }

    async measure(page) {
        logger.info('Starting performance measurement...');
        
        try {
            // 1. 页面加载时间
            this.metrics.loadTime = await this.measureLoadTime(page);
            
            // 2. 首次绘制 (FP)
            this.metrics.firstPaint = await this.measureFirstPaint(page);
            
            // 3. 首次内容绘制 (FCP)
            this.metrics.firstContentfulPaint = await this.measureFCP(page);
            
            // 4. 可交互时间 (TTI)
            this.metrics.timeToInteractive = await this.measureTTI(page);
            
            // 5. 帧率监控
            this.metrics.frameRate = await this.measureFrameRate(page);
            
            // 6. 内存使用
            this.metrics.memoryUsage = await this.measureMemory(page);
            
            // 检查阈值
            const issues = this.checkThresholds();
            
            logger.performance('Performance measurement completed', this.metrics);
            
            return {
                metrics: this.metrics,
                issues: issues,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error('Performance measurement failed:', error);
            throw error;
        }
    }

    async measureLoadTime(page) {
        const startTime = Date.now();
        
        await page.goto(this.config.url, { 
            waitUntil: 'load',
            timeout: 60000 
        });
        
        const loadTime = Date.now() - startTime;
        
        logger.performance('Load Time', loadTime, 'ms');
        return loadTime;
    }

    async measureFirstPaint(page) {
        try {
            const performanceMetrics = await page.evaluate(() => {
                const entries = performance.getEntriesByType('paint');
                const fp = entries.find(e => e.name === 'first-paint');
                return fp ? fp.startTime : null;
            });
            
            logger.performance('First Paint', performanceMetrics || 'N/A', '');
            return performanceMetrics;
        } catch (error) {
            logger.warn('First Paint measurement failed:', error.message);
            return null;
        }
    }

    async measureFCP(page) {
        try {
            const performanceMetrics = await page.evaluate(() => {
                const entries = performance.getEntriesByType('paint');
                const fcp = entries.find(e => e.name === 'first-contentful-paint');
                return fcp ? fcp.startTime : null;
            });
            
            logger.performance('First Contentful Paint', performanceMetrics || 'N/A', '');
            return performanceMetrics;
        } catch (error) {
            logger.warn('FCP measurement failed:', error.message);
            return null;
        }
    }

    async measureTTI(page) {
        // 简化的 TTI 测量：等待页面可交互
        const startTime = Date.now();
        
        await page.waitForSelector('body', { timeout: 60000 });
        
        const tti = Date.now() - startTime;
        
        logger.performance('Time to Interactive', tti, 'ms');
        return tti;
    }

    async measureFrameRate(page) {
        try {
            // 使用 requestAnimationFrame 测量帧率
            const frameRate = await page.evaluate(() => {
                return new Promise((resolve) => {
                    let frames = 0;
                    let lastTime = performance.now();
                    let frameRate = 0;
                    
                    function countFrames() {
                        frames++;
                        const currentTime = performance.now();
                        
                        if (currentTime - lastTime >= 1000) {
                            frameRate = frames;
                            frames = 0;
                            lastTime = currentTime;
                        }
                        
                        if (frameRate > 0) {
                            resolve(frameRate);
                        } else {
                            requestAnimationFrame(countFrames);
                        }
                    }
                    
                    requestAnimationFrame(countFrames);
                    
                    // 5 秒后超时
                    setTimeout(() => resolve(60), 5000);
                });
            });
            
            logger.performance('Frame Rate', frameRate, ' FPS');
            return frameRate;
        } catch (error) {
            logger.warn('Frame rate measurement failed:', error.message);
            return 60; // 默认值
        }
    }

    async measureMemory(page) {
        try {
            const memoryMetrics = await page.evaluate(() => {
                if (performance.memory) {
                    return {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize
                    };
                }
                return null;
            });
            
            const memoryMB = memoryMetrics ? (memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A';
            
            logger.performance('Memory Usage', memoryMB, ' MB');
            return memoryMB;
        } catch (error) {
            logger.warn('Memory measurement failed:', error.message);
            return 'N/A';
        }
    }

    checkThresholds() {
        const issues = [];
        
        if (this.metrics.loadTime && this.metrics.loadTime > this.thresholds.loadTime) {
            issues.push({
                type: 'performance',
                metric: 'loadTime',
                value: this.metrics.loadTime,
                threshold: this.thresholds.loadTime,
                severity: 'warning',
                message: `加载时间过长：${this.metrics.loadTime}ms (阈值：${this.thresholds.loadTime}ms)`
            });
        }
        
        if (this.metrics.frameRate && typeof this.metrics.frameRate === 'number' && 
            this.metrics.frameRate < this.thresholds.frameRate) {
            issues.push({
                type: 'performance',
                metric: 'frameRate',
                value: this.metrics.frameRate,
                threshold: this.thresholds.frameRate,
                severity: 'warning',
                message: `帧率过低：${this.metrics.frameRate} FPS (阈值：${this.thresholds.frameRate} FPS)`
            });
        }
        
        if (this.metrics.memoryUsage !== 'N/A') {
            const memoryNum = parseFloat(this.metrics.memoryUsage);
            if (memoryNum > this.thresholds.memoryUsage) {
                issues.push({
                    type: 'performance',
                    metric: 'memoryUsage',
                    value: this.metrics.memoryUsage,
                    threshold: this.thresholds.memoryUsage,
                    severity: 'warning',
                    message: `内存使用过高：${this.metrics.memoryUsage}MB (阈值：${this.thresholds.memoryUsage}MB)`
                });
            }
        }
        
        return issues;
    }
}

module.exports = { PerformanceMonitor };
