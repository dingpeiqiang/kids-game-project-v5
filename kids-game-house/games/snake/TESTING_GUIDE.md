# 🧪 完整测试指南

**版本**: v1.3.0  
**创建时间**: 2026-04-05  
**状态**: ✅ 可用

---

## 📋 测试概述

本项目包含以下测试类型：
1. **单元测试** - UI 组件测试
2. **集成测试** - 组件与游戏逻辑集成
3. **性能测试** - FPS、内存、加载时间
4. **端到端测试** - 完整游戏流程（待实现）

---

## 🚀 快速开始

### 步骤 1: 安装测试依赖

```bash
cd kids-game-house/games/snake
npm install
```

这将安装：
- vitest ^1.0.0
- @vue/test-utils ^2.4.0

---

### 步骤 2: 运行测试

```bash
# 开发模式（监听文件变化，推荐）
npm test

# 运行一次
npm run test:run

# 生成覆盖率报告
npm run test:coverage
```

---

## 📊 测试用例详情

### UI 组件集成测试 (14 个用例)

#### LevelProgressBar 测试 (5 个)

```typescript
// 测试文件：tests/ui-integration.test.ts

describe('LevelProgressBar', () => {
  // 测试 1: 初始渲染
  it('should render with initial props', () => {})
  
  // 测试 2: 进度更新
  it('should update progress bar width when progress changes', async () => {})
  
  // 测试 3: 完成事件
  it('should emit complete event when progress reaches 100', async () => {})
  
  // 测试 4: 显示/隐藏
  it('should hide when visible prop is false', async () => {})
  
  // 测试 5: 动画效果
  it('should have correct CSS classes for animation', () => {})
})
```

#### ObjectiveList 测试 (7 个)

```typescript
describe('ObjectiveList', () => {
  // 测试 1: 列表渲染
  it('should render objectives list', () => {})
  
  // 测试 2: 图标显示
  it('should display objective icons', () => {})
  
  // 测试 3: 进度显示
  it('should show progress for incomplete objectives', () => {})
  
  // 测试 4: 完成状态
  it('should apply completed class to finished objectives', () => {})
  
  // 测试 5: 进度计算
  it('should calculate progress percentage correctly', () => {})
  
  // 测试 6: 空列表处理
  it('should handle empty objectives list', () => {})
  
  // 测试 7: 响应式更新
  it('should update when objectives change', async () => {})
})
```

#### 集成测试 (2 个)

```typescript
describe('Component Integration', () => {
  // 测试 1: 组件协作
  it('should work together without conflicts', () => {})
  
  // 测试 2: 快速更新
  it('should handle rapid prop updates', async () => {})
})
```

---

## 🔍 手动测试指南

### 测试 1: 基础游戏功能

1. **启动游戏**
   ```bash
   npm run dev
   ```
   访问：http://localhost:5173/

2. **测试内容**
   - [ ] 蛇能够正常移动
   - [ ] 方向键控制正常
   - [ ] 吃到食物后分数增加
   - [ ] 蛇身变长
   - [ ] 碰撞检测正常
   - [ ] 游戏结束逻辑正确

---

### 测试 2: UI 组件功能

1. **加载进度条测试**
   - [ ] 打开游戏时显示进度条
   - [ ] 进度条从 0% 到 100% 渐变
   - [ ] 达到 100% 后自动隐藏
   - [ ] 呼吸灯效果流畅

2. **目标列表测试**
   - [ ] 显示当前关卡目标
   - [ ] 进度实时更新
   - [ ] 完成后显示 ✓ 标记
   - [ ] 不同目标类型图标正确

---

### 测试 3: 性能测试

1. **FPS 测试**
   ```javascript
   // 在浏览器控制台运行
   let frameCount = 0
   let lastTime = performance.now()
   
   setInterval(() => {
     frameCount++
     const now = performance.now()
     if (now - lastTime >= 1000) {
       console.log(`FPS: ${frameCount}`)
       frameCount = 0
       lastTime = now
     }
   }, 1000)
   ```
   
   **标准**: 
   - ✅ 稳定 60 FPS
   - ⚠️ 50-60 FPS
   - ❌ < 50 FPS

2. **内存测试**
   ```javascript
   // Chrome DevTools
   console.memory.usedJSHeapSize / 1048576 + ' MB'
   ```
   
   **标准**:
   - ✅ < 120 MB
   - ⚠️ 120-150 MB
   - ❌ > 150 MB

3. **加载时间测试**
   ```javascript
   // 在代码中添加
   const startTime = performance.now()
   EventBus.on(GameEventType.LEVEL_LOADED, () => {
     console.log(`加载时间：${performance.now() - startTime}ms`)
   })
   ```
   
   **标准**:
   - ✅ < 50ms
   - ⚠️ 50-100ms
   - ❌ > 100ms

---

## 🐛 Bug 回归测试

### Bug #1: 内存泄漏测试

**测试步骤**:
1. 打开游戏
2. 运行 5 分钟
3. 每 30 秒记录内存占用
4. 检查是否持续增长

**预期结果**: 内存稳定在 120MB 左右

---

### Bug #2: 快速转向测试

**测试步骤**:
1. 快速按下 ↑ → ↓ ← 方向键
2. 每秒切换 5-10 次方向
3. 观察蛇的行为

**预期结果**: 不会出现反向立即死亡

---

### Bug #3: 食物生成测试

**测试步骤**:
1. 运行游戏 10 分钟
2. 观察每次食物生成位置
3. 检查是否有重叠

**预期结果**: 食物不会生成在蛇身上

---

## 📈 性能基准测试

### 测试环境要求

```
浏览器：Chrome 120+
CPU: Intel i5 或同级以上
内存：8GB 以上
网络：本地运行
```

---

### 基准数据

| 场景 | 指标 | 优秀 | 良好 | 需优化 |
|------|------|------|------|--------|
| **FPS** | 平均值 | >= 60 | 50-60 | < 50 |
| **内存** | 稳定值 | < 120MB | 120-150MB | > 150MB |
| **加载** | 首次 | < 50ms | 50-100ms | > 100ms |
| **GC** | 频率 | > 5 秒/次 | 3-5 秒/次 | < 3 秒/次 |
| **碰撞检测** | 耗时 | < 3ms | 3-8ms | > 8ms |

---

## 🧪 自动化测试脚本

### 创建测试配置文件

```json
// tests/test-config.json
{
  "testSuites": [
    {
      "name": "UI Components",
      "files": ["tests/ui-integration.test.ts"],
      "timeout": 10000,
      "coverage": true
    }
  ],
  "thresholds": {
    "lines": 80,
    "functions": 80,
    "branches": 80
  }
}
```

---

### 运行批量测试

```bash
# 运行所有测试
npm test -- --run

# 运行特定测试文件
npm test -- --run tests/ui-integration.test.ts

# 运行匹配的测试
npm test -- --run -t "LevelProgressBar"

# 生成 HTML 报告
npm test -- --run --reporter=html
```

---

## 📊 测试报告解读

### Vitest 输出示例

```
 RUN  v1.0.0 /path/to/project

 ✓ tests/ui-integration.test.ts (14)
   ✓ UI Component Integration Tests (14)
     ✓ LevelProgressBar (5)
       ✓ should render with initial props
       ✓ should update progress bar width when progress changes
       ✓ should emit complete event when progress reaches 100
       ✓ should hide when visible prop is false
       ✓ should have correct CSS classes for animation
     ✓ ObjectiveList (7)
       ✓ should render objectives list
       ✓ should display objective icons
       ✓ should show progress for incomplete objectives
       ✓ should apply completed class to finished objectives
       ✓ should calculate progress percentage correctly
       ✓ should handle empty objectives list
       ✓ should update when objectives change
     ✓ Component Integration (2)
       ✓ should work together without conflicts
       ✓ should handle rapid prop updates

 Test Files  1 passed (1)
      Tests  14 passed (14)
   Start at  09:00:00
   Duration  1.23s
```

**关键信息**:
- ✅ 所有测试通过
- 测试文件数：1
- 测试用例数：14
- 执行时间：1.23 秒

---

## 🐞 调试技巧

### 1. 使用调试模式

```bash
# 启用详细日志
npm test -- --reporter=verbose

# 只运行失败的测试
npm test -- --bail
```

---

### 2. 浏览器调试

```javascript
// 在代码中添加断点
debugger;

// 或使用 console 日志
console.log('当前分数:', score);
console.trace(); // 打印调用栈
```

---

### 3. 性能分析

```javascript
// 使用 Performance API
performance.mark('game-start')
// ... 游戏代码
performance.mark('game-end')
performance.measure('game-duration', 'game-start', 'game-end')

const measure = performance.getEntriesByName('game-duration')[0]
console.log(`游戏耗时：${measure.duration}ms`)
```

---

## 🎯 测试检查清单

### 单元测试
- [ ] 所有 UI 组件测试通过
- [ ] 测试覆盖率 > 80%
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告

### 集成测试
- [ ] UI 与游戏逻辑同步正常
- [ ] 事件系统工作正常
- [ ] 数据流正确

### 性能测试
- [ ] FPS 稳定在 60
- [ ] 内存占用 < 150MB
- [ ] 加载时间 < 100ms
- [ ] GC 频率合理

### 手动测试
- [ ] 游戏可玩
- [ ] UI 响应正常
- [ ] 无崩溃现象
- [ ] 用户体验流畅

---

## 📚 相关文档

- 📖 [README_UI_TESTS.md](./tests/README_UI_TESTS.md) - UI 测试详细指南
- 📖 [API_REFERENCE.md](./API_REFERENCE.md) - API 参考文档
- 📖 [QUICK_START.md](./QUICK_START.md) - 快速开始指南
- 📖 [FAQ.md](./FAQ.md) - 常见问题解答

---

## 💡 最佳实践

### 1. 定期运行测试

```bash
# 每天至少运行一次测试
npm test

# 提交前必须运行
npm run test:run
```

---

### 2. 保持测试独立性

```typescript
// ✅ 好的做法
describe('Component', () => {
  beforeEach(() => {})
  afterEach(() => {})
  it('test 1', () => {})
  it('test 2', () => {})
})

// ❌ 不好的做法 - 测试之间有依赖
it('test 1', () => {
  // 设置了一些状态
})
it('test 2', () => {
  // 依赖 test 1 的状态
})
```

---

### 3. 使用有意义的测试名称

```typescript
// ❌ 不好
it('should work', () => {})

// ✅ 好
it('should emit complete event when progress reaches 100', () => {})
```

---

### 4. 测试边界条件

```typescript
// 测试各种边界值
test.each([
  [0, '应该处理 0'],
  [-1, '应该处理负数'],
  [100, '应该处理最大值'],
  [101, '应该处理超过最大值']
])('边界值 %i', (value, description) => {
  // 测试逻辑
})
```

---

**最后更新**: 2026-04-05  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0  
**状态**: ✅ 可用
