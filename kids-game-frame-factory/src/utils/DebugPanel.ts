/**
 * 🎮 游戏开发调试面板 v2.0
 * 
 * 提供完整的开发调试界面，包含：
 * 1. 📊 实时性能监控面板
 * 2. 🔍 资源管理器
 * 3. 📝 事件日志查看器
 * 4. ⚙️ 调试工具集合
 * 5. 📈 性能图表
 * 6. 🎯 场景对象浏览器
 * 
 * 使用方式：
 * 1. 导入: import { DebugPanel } from './utils/DebugPanel'
 * 2. 初始化: const debugPanel = new DebugPanel(scene)
 * 3. 显示/隐藏: debugPanel.toggle()
 * 
 * 热键:
 * - Ctrl+Shift+P: 切换调试面板
 * - F12: 性能截图
 * - F11: 导出调试报告
 */

import { DevDebugger, PerformanceMetrics } from './DevDebugger';

export interface DebugPanelOptions {
  position?: { x: number, y: number };
  width?: number;
  height?: number;
  backgroundColor?: string;
  opacity?: number;
}

export class DebugPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private debugger: DevDebugger;
  private isVisible = false;
  private options: DebugPanelOptions;
  
  // 界面元素
  private tabButtons: Phaser.GameObjects.Rectangle[] = [];
  private currentTab = 'performance';
  private perfTexts: Phaser.GameObjects.Text[] = [];
  private eventLogText?: Phaser.GameObjects.Text;
  private resourceTexts: Phaser.GameObjects.Text[] = [];
  
  // 图表数据
  private performanceHistory: PerformanceMetrics[] = [];
  private fpsChartData: number[] = [];
  private memoryChartData: number[] = [];

  constructor(scene: Phaser.Scene, options: DebugPanelOptions = {}) {
    this.scene = scene;
    this.debugger = DevDebugger.getInstance();
    this.options = {
      position: { x: 10, y: 10 },
      width: 400,
      height: 500,
      backgroundColor: '#000000',
      opacity: 0.85,
      ...options
    };

    // 创建基础容器
    this.container = scene.add.container(
      this.options.position!.x,
      this.options.position!.y
    );

    this.setupPanel();
    this.setupTabs();
    this.setupHotkeys();
    this.hide(); // 默认隐藏
  }

  /**
   * 设置调试面板基础结构
   */
  private setupPanel(): void {
    // 背景面板
    const background = this.scene.add.rectangle(
      0, 0,
      this.options.width!,
      this.options.height!,
      0x000000,
      this.options.opacity
    );
    
    // 标题
    const title = this.scene.add.text(
      10, 10,
      '🔧 开发调试面板 v2.0',
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );

    // 关闭按钮
    const closeButton = this.scene.add.text(
      this.options.width! - 30, 10,
      '×',
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#ff000066',
        padding: { x: 6, y: 2 }
      }
    );
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => this.toggle());

    this.container.add([background, title, closeButton]);
  }

  /**
   * 设置选项卡
   */
  private setupTabs(): void {
    const tabs = [
      { id: 'performance', label: '📊 性能', icon: '⚡' },
      { id: 'resources', label: '🖼️ 资源', icon: '📦' },
      { id: 'events', label: '📝 事件', icon: '🔍' },
      { id: 'objects', label: '🎮 对象', icon: '🎯' },
      { id: 'tools', label: '🔧 工具', icon: '🛠️' }
    ];

    const tabHeight = 30;
    const tabWidth = this.options.width! / tabs.length;
    
    tabs.forEach((tab, index) => {
      const tabX = index * tabWidth;
      
      // 选项卡背景
      const bg = this.scene.add.rectangle(
        tabX, 40,
        tabWidth, tabHeight,
        tab.id === this.currentTab ? 0x2c3e50 : 0x34495e,
        0.9
      );
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.switchTab(tab.id));

      // 选项卡文本
      const text = this.scene.add.text(
        tabX + 10, 45,
        `${tab.icon} ${tab.label}`,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ffffff'
        }
      );

      this.tabButtons.push(bg);
      this.container.add([bg, text]);
    });

    // 创建内容区域
    this.createPerformanceTab();
    this.createResourcesTab();
    this.createEventsTab();
    this.createObjectsTab();
    this.createToolsTab();
  }

  /**
   * 创建性能监控选项卡
   */
  private createPerformanceTab(): void {
    const baseY = 80;
    
    // 性能概览
    const overviewTitle = this.scene.add.text(
      20, baseY,
      '📈 性能概览',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3498db',
        fontStyle: 'bold'
      }
    );

    // 性能指标
    const metrics = [
      { key: 'FPS', value: '--', unit: '', color: '#2ecc71' },
      { key: '帧时间', value: '--', unit: 'ms', color: '#e74c3c' },
      { key: '活动对象', value: '--', unit: '个', color: '#9b59b6' },
      { key: '内存占用', value: '--', unit: 'MB', color: '#f39c12' },
      { key: '渲染时间', value: '--', unit: 'ms', color: '#1abc9c' }
    ];

    let currentY = baseY + 30;
    metrics.forEach((metric, index) => {
      const metricText = this.scene.add.text(
        30, currentY,
        `${metric.key}:`,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ffffff'
        }
      );

      const valueText = this.scene.add.text(
        120, currentY,
        `${metric.value} ${metric.unit}`,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: metric.color,
          fontStyle: 'bold'
        }
      );

      this.perfTexts.push(valueText);
      this.container.add([metricText, valueText]);
      currentY += 25;
    });

    // 性能建议
    const adviceText = this.scene.add.text(
      20, currentY + 10,
      '💡 性能建议: --',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#f1c40f',
        wordWrap: { width: this.options.width! - 40 }
      }
    );
    this.container.add(adviceText);
    this.perfTexts.push(adviceText);

    // 图表区域标题
    const chartTitle = this.scene.add.text(
      20, currentY + 40,
      '📊 性能趋势',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3498db',
        fontStyle: 'bold'
      }
    );
    this.container.add(chartTitle);

    // 简易图表背景
    const chartBg = this.scene.add.rectangle(
      30, currentY + 70,
      this.options.width! - 60, 80,
      0x2c3e50, 0.5
    );
    this.container.add(chartBg);
  }

  /**
   * 创建资源管理选项卡
   */
  private createResourcesTab(): void {
    const baseY = 80;
    
    const title = this.scene.add.text(
      20, baseY,
      '🖼️ 资源状态',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e74c3c',
        fontStyle: 'bold'
      }
    );
    this.container.add(title);

    // 资源统计
    const resourceStats = [
      { key: '总资源数', value: '--', unit: '个' },
      { key: '已加载', value: '--', unit: '个' },
      { key: '平均加载时间', value: '--', unit: 'ms' },
      { key: '缓存命中率', value: '--', unit: '%' },
      { key: '内存占用', value: '--', unit: 'MB' }
    ];

    let currentY = baseY + 30;
    resourceStats.forEach((stat, index) => {
      const label = this.scene.add.text(
        30, currentY,
        `${stat.key}:`,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ffffff'
        }
      );

      const value = this.scene.add.text(
        140, currentY,
        `${stat.value} ${stat.unit}`,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: index === 4 ? '#f39c12' : '#2ecc71'
        }
      );

      this.resourceTexts.push(value);
      this.container.add([label, value]);
      currentY += 25;
    });

    // 最近加载的资源
    const recentTitle = this.scene.add.text(
      20, currentY + 10,
      '🔄 最近加载:',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#3498db'
      }
    );
    this.container.add(recentTitle);

    const recentList = this.scene.add.text(
      30, currentY + 30,
      '-- 暂无数据 --',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#95a5a6',
        wordWrap: { width: this.options.width! - 60 },
        lineSpacing: 4
      }
    );
    this.resourceTexts.push(recentList);
    this.container.add(recentList);
  }

  /**
   * 创建事件日志选项卡
   */
  private createEventsTab(): void {
    const baseY = 80;
    
    const title = this.scene.add.text(
      20, baseY,
      '📝 事件日志',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9b59b6',
        fontStyle: 'bold'
      }
    );
    this.container.add(title);

    // 事件日志显示区域
    const logBg = this.scene.add.rectangle(
      20, baseY + 30,
      this.options.width! - 40,
      this.options.height! - baseY - 50,
      0x2c3e50, 0.3
    );
    this.container.add(logBg);

    this.eventLogText = this.scene.add.text(
      25, baseY + 35,
      '🕐 事件日志区域\n按时间排序的最新100条事件将显示在这里',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ecf0f1',
        wordWrap: { width: this.options.width! - 50 },
        lineSpacing: 3
      }
    );
    this.container.add(this.eventLogText);

    // 日志控制按钮
    const clearButton = this.scene.add.text(
      25, this.options.height! - 35,
      '🗑️ 清空日志',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#e74c3c66',
        padding: { x: 8, y: 4 }
      }
    );
    clearButton.setInteractive({ useHandCursor: true });
    clearButton.on('pointerdown', () => {
      if (this.eventLogText) {
        this.eventLogText.setText('✅ 日志已清空\n');
      }
    });

    const exportButton = this.scene.add.text(
      120, this.options.height! - 35,
      '💾 导出日志',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#3498db66',
        padding: { x: 8, y: 4 }
      }
    );
    exportButton.setInteractive({ useHandCursor: true });
    exportButton.on('pointerdown', () => {
      console.log('📤 事件日志导出功能暂未实现');
    });

    this.container.add([clearButton, exportButton]);
  }

  /**
   * 创建场景对象选项卡
   */
  private createObjectsTab(): void {
    const baseY = 80;
    
    const title = this.scene.add.text(
      20, baseY,
      '🎮 场景对象',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f39c12',
        fontStyle: 'bold'
      }
    );
    this.container.add(title);

    const infoText = this.scene.add.text(
      30, baseY + 30,
      '🔄 正在分析场景对象...',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ecf0f1',
        wordWrap: { width: this.options.width! - 60 }
      }
    );
    this.container.add(infoText);

    // 对象类型统计
    const statsText = this.scene.add.text(
      30, baseY + 60,
      '📊 对象统计:\n- 总数: --\n- 类型分布: --',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#bdc3c7',
        wordWrap: { width: this.options.width! - 60 },
        lineSpacing: 4
      }
    );
    this.container.add(statsText);
  }

  /**
   * 创建调试工具选项卡
   */
  private createToolsTab(): void {
    const baseY = 80;
    
    const title = this.scene.add.text(
      20, baseY,
      '🔧 调试工具',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#1abc9c',
        fontStyle: 'bold'
      }
    );
    this.container.add(title);

    // 工具按钮列表
    const tools = [
      { id: 'screenshot', label: '📸 游戏截图', color: '#3498db' },
      { id: 'reset', label: '🔄 重置场景', color: '#e74c3c' },
      { id: 'reload', label: '🔄 重新加载', color: '#f39c12' },
      { id: 'wireframe', label: '📐 线框模式', color: '#9b59b6' },
      { id: 'slowmo', label: '⏱️ 慢动作', color: '#1abc9c' },
      { id: 'export', label: '📤 导出报告', color: '#34495e' }
    ];

    const buttonWidth = (this.options.width! - 60) / 2;
    let currentY = baseY + 30;

    for (let i = 0; i < tools.length; i += 2) {
      const tool1 = tools[i];
      const tool2 = tools[i + 1];

      // 工具按钮1
      const button1 = this.scene.add.text(
        30, currentY,
        tool1.label,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: tool1.color + '66',
          padding: { x: 12, y: 6 }
        }
      );
      button1.setInteractive({ useHandCursor: true });
      button1.on('pointerdown', () => this.executeTool(tool1.id));

      // 工具按钮2
      if (tool2) {
        const button2 = this.scene.add.text(
          30 + buttonWidth + 20, currentY,
          tool2.label,
          {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: tool2.color + '66',
            padding: { x: 12, y: 6 }
          }
        );
        button2.setInteractive({ useHandCursor: true });
        button2.on('pointerdown', () => this.executeTool(tool2.id));
        this.container.add(button2);
      }

      this.container.add(button1);
      currentY += 45;
    }

    // 快速命令提示
    const tips = this.scene.add.text(
      30, currentY + 10,
      '💡 提示: 可以在代码中调用 debugPanel.someTool()',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#95a5a6',
        wordWrap: { width: this.options.width! - 60 }
      }
    );
    this.container.add(tips);
  }

  /**
   * 执行调试工具
   */
  private executeTool(toolId: string): void {
    console.log(`🔧 执行调试工具: ${toolId}`);
    
    switch (toolId) {
      case 'screenshot':
        this.takeScreenshot();
        break;
      case 'reset':
        this.scene.scene.restart();
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'wireframe':
        console.log('📐 线框模式: 功能开发中');
        break;
      case 'slowmo':
        console.log('⏱️ 慢动作: 功能开发中');
        break;
      case 'export':
        this.exportDebugReport();
        break;
    }
  }

  /**
   * 切换选项卡
   */
  private switchTab(tabId: string): void {
    this.currentTab = tabId;
    
    // 更新选项卡按钮样式
    this.tabButtons.forEach((button, index) => {
      const tabWidth = this.options.width! / 5;
      const tabColors = [
        0x2c3e50, // 性能
        0x2c3e50, // 资源
        0x2c3e50, // 事件
        0x2c3e50, // 对象
        0x2c3e50  // 工具
      ];
      
      const tabIndex = ['performance', 'resources', 'events', 'objects', 'tools'].indexOf(tabId);
      button.fillColor = index === tabIndex ? 0x3498db : 0x34495e;
    });
    
    // 更新内容区域可见性
    const tabContents = this.container.getAll('text');
    console.log(`🔀 切换到选项卡: ${tabId}`);
  }

  /**
   * 设置热键
   */
  private setupHotkeys(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event) => {
        // Ctrl+Shift+P 切换调试面板
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
          event.preventDefault();
          this.toggle();
        }
        
        // F12 性能截图
        if (event.key === 'F12') {
          event.preventDefault();
          this.takeScreenshot();
        }
        
        // F11 导出报告
        if (event.key === 'F11') {
          event.preventDefault();
          this.exportDebugReport();
        }
      });
    }
  }

  /**
   * 显示调试面板
   */
  show(): void {
    this.container.setVisible(true);
    this.isVisible = true;
    this.startUpdates();
  }

  /**
   * 隐藏调试面板
   */
  hide(): void {
    this.container.setVisible(false);
    this.isVisible = false;
    this.stopUpdates();
  }

  /**
   * 切换显示/隐藏
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 开始更新数据
   */
  private startUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      this.updatePanelData();
    }, 1000); // 每秒更新一次
  }

  /**
   * 停止更新数据
   */
  private stopUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  private updateTimer: NodeJS.Timeout | null = null;

  /**
   * 更新面板数据
   */
  private updatePanelData(): void {
    // 更新性能数据
    const perfReport = this.debugger.getPerformanceReport();
    
    if (this.perfTexts[0]) {
      const recentStats = this.performanceHistory.slice(-10);
      const avgFPS = recentStats.length > 0 ? 
        Math.round(recentStats.reduce((sum, stat) => sum + stat.fps, 0) / recentStats.length) : 0;
      this.perfTexts[0].setText(`${avgFPS}`);
    }
    
    // 更新性能建议
    if (this.perfTexts.length > 5 && perfReport.recommendations.length > 0) {
      const adviceText = this.perfTexts[5];
      adviceText.setText(`💡 性能建议: ${perfReport.recommendations[0]}`);
    }
    
    // 更新事件日志
    if (this.eventLogText) {
      const eventData = this.debugger.exportDebugData();
      const recentEvents = eventData.eventLog.slice(-10).reverse();
      
      let logContent = '📋 最近事件:\n';
      recentEvents.forEach(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        logContent += `${time} - ${event.type}\n`;
      });
      
      this.eventLogText.setText(logContent);
    }
  }

  /**
   * 游戏截图
   */
  takeScreenshot(): void {
    console.log('📸 游戏截图功能开发中');
    // 实际实现会使用Phaser的RenderTexture
  }

  /**
   * 导出调试报告
   */
  exportDebugReport(): void {
    const report = this.debugger.exportDebugData();
    const reportStr = JSON.stringify(report, null, 2);
    
    console.log('📊 调试报告已导出到控制台');
    console.log('📄 详细报告:', report);
    
    // 尝试创建文件下载
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(reportStr);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `debug-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  /**
   * 销毁调试面板
   */
  destroy(): void {
    this.stopUpdates();
    this.container.destroy();
    
    if (typeof window !== 'undefined') {
      // 清理全局事件监听器
      // 注意：这里应该记录添加的事件监听器以便清理
    }
  }
}

/**
 * 📋 快速初始化调试面板的辅助函数
 */
export function initDebugPanel(scene: Phaser.Scene): DebugPanel {
  console.log('🎮 初始化开发调试面板...');
  
  const panel = new DebugPanel(scene);
  
  // 开发环境下默认显示快捷键提示
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 调试面板已初始化');
    console.log('  快捷方式: Ctrl+Shift+P 切换面板');
    console.log('            F12 截图, F11 导出报告');
  }
  
  return panel;
}

export default DebugPanel;