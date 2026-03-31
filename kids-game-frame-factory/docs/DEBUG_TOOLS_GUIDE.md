# 🐛 开发调试工具指南 v2.0

## 📋 概述

kids-game-frame-factory 提供了一套完整的开发调试工具套件，帮助开发者实时监控游戏性能、分析资源加载、跟踪事件日志，并提供可视化调试界面。

## 🚀 快速开始

### 1. 基本使用

```typescript
// 在游戏场景中导入调试工具
import { DevDebugger, DevToolsHelper, DebugPanel } from '../utils';

export default class MyGameScene extends Phaser.Scene {
  private debugger: DevDebugger;
  private debugPanel?: DebugPanel;

  constructor() {
    super('MyGameScene');
    this.debugger = DevDebugger.getInstance();
  }

  create() {
    // 自动启用开发工具（开发环境自动检测）
    DevToolsHelper.enableDevTools();
    
    // 创建调试面板（可选）
    if (process.env.NODE_ENV === 'development') {
      this.debugPanel = new DebugPanel(this);
      // 默认隐藏，按Ctrl+Shift+P显示
    }
    
    // 开始性能监控
    const hud = this.debugger.createPerformanceHUD(this);
    
    // 游戏逻辑...
  }

  update() {
    // 调试器会自动更新，无需额外代码
  }
}
```

### 2. 使用预配置场景模板

框架模板已内置调试支持。在创建新项目时，选择相应的游戏类型，调试工具会自动配置：

```bash
# 创建带完整调试配置的项目
node enhance-dev-tools.js create my-game 我的游戏 "游戏描述" casual
```

## 🎯 核心调试功能

### 1. 性能监控 HUD

**功能特点**：
- 实时显示 FPS、帧时间、内存占用
- 活动对象计数、预测渲染时间
- 性能级别提示（✅/⚠️/❌）

**使用方法**：
```typescript
// 创建性能HUD
const hud = debugger.createPerformanceHUD(this);

// 或使用简化版本
DevToolsHelper.createDevHUD(this);
```

**热键**：`Ctrl+Shift+D` 查看详细性能报告

### 2. 可视化调试面板

**功能特点**：
- 完整选项卡界面（性能、资源、事件、对象、工具）
- 实时图表和统计数据
- 场景对象浏览器
- 调试工具集合

**使用方法**：
```typescript
// 初始化调试面板
const debugPanel = new DebugPanel(this);

// 显示/隐藏面板
debugPanel.toggle();

// 或使用快捷函数
import { initDebugPanel } from '../utils/DebugPanel';
const panel = initDebugPanel(this);
```

**热键**：
- `Ctrl+Shift+P`: 切换调试面板
- `F12`: 游戏截图
- `F11`: 导出调试报告

### 3. 事件日志系统

**功能特点**：
- 自动记录游戏事件
- 资源加载跟踪
- 用户操作日志
- 错误追踪

**使用方法**：
```typescript
// 记录自定义事件
debugger.logEvent('GAME_START', { level: 1, player: 'kid123' });

// 记录资源加载
debugger.logResourceLoad('image', 'player_sprite', 150);

// 查看事件日志
const eventData = debugger.exportDebugData();
console.log('事件详情:', eventData.eventLog);
```

### 4. 资源管理监控

**功能特点**：
- 资源加载统计
- 缓存命中率监控
- 内存使用分析
- 加载时间跟踪

**使用方法**：
```typescript
// 获取资源报告
const resourceReport = debugger.getResourceReport();
console.log('资源统计:', resourceReport);

// 集成到Phaser加载器
this.load.on('load', (file: any) => {
  debugger.logResourceLoad(file.type, file.key, file.loadTime);
});
```

## 📊 调试数据输出

### 1. 性能报告

```typescript
// 获取详细性能报告
const perfReport = debugger.getPerformanceReport();

// 报告内容
{
  summary: {
    '平均FPS': '55.3',
    '平均帧时间(ms)': '18.1',
    '性能等级': '优秀',
    '数据点数': 120
  },
  recentMetrics: [...],
  recommendations: [
    'FPS可进一步优化',
    '检查动画渲染效率'
  ]
}
```

### 2. 资源报告

```typescript
{
  totalResources: 48,
  loadedResources: 48,
  loadingTime: 145.5, // 平均加载时间(ms)
  cacheHitRate: 0.82,  // 缓存命中率
  memoryUsage: 25      // 估算内存(MB)
}
```

### 3. 导出完整报告

```typescript
// 导出所有调试数据
const fullReport = debugger.exportDebugData();

// 这会生成包含时间戳、性能统计、事件日志的结构化数据
{
  timestamp: 1677686400000,
  performanceStats: [...60秒数据],
  eventLog: [...最近100个事件],
  resourceStats: [...],
  summary: {...}
}
```

## 🔧 高级配置

### 1. 环境检测和自动启用

调试工具会**自动检测环境**：
- 开发环境（NODE_ENV=development）：启用完整功能
- 生产环境：最小化或无调试功能

```typescript
// 手动控制
debugger.setEnabled(true);  // 启用调试
debugger.setEnabled(false); // 禁用调试

// 检查当前环境
const isDev = DevToolsHelper.isDevelopment();
```

### 2. 自定义调试面板

```typescript
const customPanel = new DebugPanel(this, {
  position: { x: 50, y: 50 },
  width: 450,
  height: 600,
  backgroundColor: '#1a1a2e',
  opacity: 0.9
});

// 添加自定义选项卡
// 扩展DebugPanel类来实现
```

### 3. 性能监控配置

```typescript
// 调整监控频率
debugger.startPerformanceMonitoring(this);
debugger.stopPerformanceMonitoring();

// 自定义监控间隔（默认16ms≈60Hz）
// 修改DevDebugger.ts中的监控间隔
```

## 🎮 集成到游戏开发工作流

### 1. 开发阶段

```typescript
// 在场景创建时初始化调试工具
class MyGameScene extends Phaser.Scene {
  preload() {
    // 资源加载监控
    this.load.on('load', this.onResourceLoad.bind(this));
  }

  create() {
    // 启用调试
    this.initDebugTools();
    
    // 记录游戏启动事件
    this.debugger.logEvent('SCENE_CREATE', { scene: this.scene.key });
  }

  initDebugTools() {
    this.debugger = DevDebugger.getInstance();
    
    if (DevToolsHelper.isDevelopment()) {
      this.debugPanel = new DebugPanel(this);
      DevToolsHelper.enableDevTools();
    }
  }

  onResourceLoad(file: any) {
    this.debugger.logResourceLoad(
      file.type,
      file.key,
      performance.now() - file.startTime
    );
  }
}
```

### 2. 测试阶段

```bash
# 性能测试流程
1. 启动游戏并启用调试面板
2. 执行典型用户操作
3. 导出性能报告
4. 分析FPS、内存使用、加载时间
5. 根据建议进行优化
```

### 3. 性能优化检查清单

✅ **性能指标健康检查**：
- FPS > 50 (优秀)
- 平均帧时间 < 20ms
- 内存增长稳定
- 资源加载时间合理

✅ **优化建议执行**：
- [ ] 图像压缩和格式优化
- [ ] 音频文件体积优化
- [ ] 对象池重用机制
- [ ] 渲染批次优化
- [ ] 内存泄漏检查

## 📝 调试场景示例

### 场景1：贪吃蛇游戏性能监控

```typescript
export default class SnakeGameScene extends Phaser.Scene {
  private debugger: DevDebugger;
  private gameObjects = 0;

  create() {
    // 初始化调试
    this.debugger = DevDebugger.getInstance();
    DevToolsHelper.createDevHUD(this);
    
    // 创建游戏对象
    this.createSnake();
    this.createFood();
    
    // 记录场景初始化
    this.debugger.logEvent('SNAKE_GAME_START', {
      objects: this.gameObjects,
      time: Date.now()
    });
  }

  update() {
    // 监控更新频率
    if (this.time.now % 1000 === 0) {
      const perf = this.debugger.getPerformanceReport();
      if (perf.summary.平均FPS < 45) {
        this.debugger.logEvent('PERFORMANCE_WARNING', {
          fps: perf.summary.平均FPS,
          time: Date.now()
        });
      }
    }
  }
}
```

### 场景2：资源加载性能优化

```typescript
// 对比优化前后的加载性能
class ResourceOptimizationDemo {
  async testLoadPerformance() {
    const debugger = DevDebugger.getInstance();
    
    // 原始加载方式
    debugger.logEvent('LOAD_TEST_START', { method: 'original' });
    await this.loadOriginal();
    const originalReport = debugger.getResourceReport();
    
    // 优化后加载方式
    debugger.clearAllData();
    debugger.logEvent('LOAD_TEST_START', { method: 'optimized' });
    await this.loadOptimized();
    const optimizedReport = debugger.getResourceReport();
    
    // 对比分析
    console.log('加载优化效果对比:');
    console.log(`平均加载时间减少: ${Math.round((originalReport.loadingTime - optimizedReport.loadingTime) / originalReport.loadingTime * 100)}%`);
  }
}
```

## 🐛 故障排除

### 常见问题

**问题1：调试面板不显示**
```typescript
// 检查环境变量
if (process.env.NODE_ENV === 'development') {
  const panel = new DebugPanel(this);
  panel.show(); // 手动显示
}
```

**问题2：性能数据不更新**
```typescript
// 确保性能监控已启动
debugger.startPerformanceMonitoring(this);

// 确认场景更新频率
// 如果游戏暂停，性能监控也会暂停
```

**问题3：内存使用显示不准确**
```typescript
// 内存估算是基于资源加载事件的
// 确保资源加载事件被正确记录
debugger.logResourceLoad('image', 'sprite.png', 200);
```

**问题4：热键不工作**
```typescript
// 检查浏览器快捷键冲突
// 确认DebugPanel的setHotkeys方法被调用
```

### 调试模式开关

```bash
# 开发环境变量设置
export NODE_ENV=development
export DEBUG=true

# 或在前端配置
VITE_DEBUG=true
```

## 📈 性能分析最佳实践

### 1. 基准测试

```typescript
// 性能基准测试函数
async function runPerformanceBenchmark(scene: Phaser.Scene) {
  const debugger = DevDebugger.getInstance();
  const results = [];
  
  // 测试场景1
  debugger.clearAllData();
  scene.events.emit('start_test', 'test_case_1');
  await wait(5000); // 运行5秒
  results.push(debugger.getPerformanceReport());
  
  // 测试场景2
  debugger.clearAllData();
  scene.events.emit('start_test', 'test_case_2');
  await wait(5000);
  results.push(debugger.getPerformanceReport());
  
  return results;
}
```

### 2. 内存泄漏检测

```typescript
// 定期检查内存趋势
setInterval(() => {
  const perfData = debugger.exportDebugData();
  const memoryTrend = calculateMemoryTrend(perfData.performanceStats);
  
  if (memoryTrend.isLeaking) {
    debugger.logEvent('MEMORY_LEAK_DETECTED', {
      trend: memoryTrend,
      timestamp: Date.now()
    });
    console.warn('⚠️ 检测到可能的内存泄漏');
  }
}, 30000); // 每30秒检查一次
```

### 3. 用户体验监控

```typescript
// 记录用户交互和体验质量
class UserExperienceMonitor {
  recordInteraction(type: string, data: any) {
    debugger.logEvent(`USER_${type.toUpperCase()}`, {
      ...data,
      timestamp: Date.now(),
      fps: getCurrentFPS(),
      memory: getCurrentMemory()
    });
  }
  
  analyzeExperience() {
    const logs = debugger.exportDebugData().eventLog;
    const interactionEvents = logs.filter(e => e.type.startsWith('USER_'));
    
    // 分析响应时间、成功率等
    return this.calculateUXMetrics(interactionEvents);
  }
}
```

## 🎯 总结

kids-game-frame-factory的调试工具套件提供了完整的游戏开发调试体验：

**核心优势**：
1. **开箱即用**：模板项目自动集成
2. **可视化界面**：实时图表和HUD显示
3. **全面监控**：性能、资源、事件全覆盖
4. **智能分析**：自动检测和建议优化
5. **开发友好**：热键控制和易用API

**推荐使用流程**：
1. 开发阶段持续开启调试面板
2. 性能测试阶段导出详细报告
3. 根据优化建议进行代码改进
4. 生产环境自动关闭调试功能
5. 定期使用基准测试验证优化效果

通过这些调试工具，开发者可以：

- **提前发现性能问题**，避免上线后的问题
- **量化优化效果**，数据驱动性能改进
- **提升开发效率**，快速定位和修复问题
- **保证游戏质量**，提供流畅的用户体验

---

📅 **文档版本**: 2.0  
🛠️ **最后更新**: 2026-03-31  
🔗 **关联工具**: `DevDebugger.ts`, `DebugPanel.ts`, `DevToolsHelper.ts`  
📦 **框架版本**: kids-game-frame-factory v3.2.0