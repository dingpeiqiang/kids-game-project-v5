# Loading 屏幕隐藏修复说明

## 🐛 问题描述

游戏启动成功后，HTML 中的 loading 元素未被关闭，导致加载动画一直显示在游戏画布上方。

## ✅ 解决方案

在 `src/main.ts` 中添加游戏 ready 事件监听器，当 Phaser 游戏初始化完成后自动隐藏 loading 元素。

### 修改内容

**文件**: `src/main.ts`

```typescript
// 当页面加载完成后启动游戏
window.addEventListener('load', () => {
  // 创建游戏实例
  const game = new Game();

  // 游戏创建完成后隐藏 loading
  game.events.once('ready', () => {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
      Logger.log('Loading screen hidden');
    }
  });

  // 仅在开发模式下暴露到全局以便调试
  const env = import.meta.env;
  if (env && env.DEV) {
    (window as any).__debugGame = game;
  }
});
```

## 🔍 工作原理

1. **Phaser Game Ready 事件**: Phaser 游戏实例创建完成后会触发 `ready` 事件
2. **查找 Loading 元素**: 通过 `document.getElementById('loading')` 获取 loading div
3. **隐藏元素**: 设置 `style.display = 'none'` 隐藏 loading
4. **日志记录**: 在开发模式下记录隐藏操作

## 🧪 测试步骤

1. 启动游戏（如果已经在运行，Vite HMR 会自动刷新）
   ```bash
   npm run dev
   ```

2. 观察浏览器：
   - ✅ 初始显示 loading 动画和"加载中..."文字
   - ✅ 资源加载过程中显示进度条和百分比
   - ✅ 游戏初始化完成后，loading 元素自动消失
   - ✅ 显示游戏主菜单

3. 检查控制台：
   - 应该看到 "Loading screen hidden" 日志（开发模式）

## 📊 预期效果

### 修复前
- ❌ Loading 元素始终显示
- ❌ 遮挡游戏画面
- ❌ 用户体验差

### 修复后
- ✅ Loading 元素在适当时机隐藏
- ✅ 游戏画面正常显示
- ✅ 流畅的用户体验

## 🎯 技术细节

### 为什么使用 `game.events.once('ready')`？

- `once` 确保事件只触发一次，避免重复执行
- `ready` 事件在 Phaser 游戏完全初始化后触发
- 这是 Phaser 3 推荐的游戏就绪检测方式

### 为什么不直接在 BootScene 中隐藏？

- BootScene 是游戏场景，此时 canvas 可能还未完全渲染
- 在 main.ts 中处理可以确保整个游戏实例就绪
- 更符合关注点分离原则

## 🔄 Vite HMR 支持

由于使用了 Vite 的热模块替换（HMR），修改 `main.ts` 后：
- ✅ 自动刷新页面
- ✅ 无需手动重启服务器
- ✅ 立即看到修复效果

## 📝 相关文件

- `index.html` - 包含 loading 元素的 HTML 结构
- `src/main.ts` - 游戏入口和 loading 隐藏逻辑
- `src/game/scenes/BootScene.ts` - 游戏内加载进度显示

---

**修复完成时间**: 2026-04-09  
**状态**: ✅ 已修复并测试
