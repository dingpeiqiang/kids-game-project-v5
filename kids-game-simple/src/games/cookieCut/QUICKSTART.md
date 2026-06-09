# 切饼干游戏 - 快速开始指南

## 🚀 5分钟快速上手

### 1. 运行游戏

```bash
# 进入项目目录
cd kids-game-house/games/simple-game

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

在浏览器中访问游戏，选择"切饼干"游戏即可开始游玩。

### 2. 调整游戏难度

打开 `src/games/cookieCut/config.ts`，修改以下参数：

```typescript
export const GAME_CONFIG: GameConfig = {
  // 让游戏更简单（适合更小的小朋友）
  spawnInterval: 2000,              // 增加生成间隔到2秒
  baseVerticalSpeed: 2,             // 降低上升速度
  baseHorizontalSpeed: 1.0,         // 降低水平移动
  maxCookies: 2,                    // 减少同时存在的饼干数
  
  // 或者让游戏更有挑战性
  spawnInterval: 1000,              // 更快的生成
  baseVerticalSpeed: 5,             // 更快的上升
  maxCookies: 5,                    // 更多饼干
}
```

### 3. 添加新饼干类型

编辑 `src/games/cookieCut/config.ts`：

```typescript
export const COOKIES: CookieTemplate[] = [
  { shape: 'star', emoji: '⭐', color: '#FFD700' },
  { shape: 'heart', emoji: '❤️', color: '#FF6B6B' },
  { shape: 'circle', emoji: '🍪', color: '#D2691E' },
  { shape: 'moon', emoji: '🌙', color: '#F0E68C' },
  { shape: 'flower', emoji: '🌸', color: '#FF69B4' },
  
  // 添加新饼干
  { shape: 'diamond', emoji: '💎', color: '#00FFFF' },
  { shape: 'crown', emoji: '👑', color: '#FFD700' },
]
```

### 4. 修改背景颜色

编辑 `src/games/cookieCut/renderer.ts` 中的 `drawBackground` 函数：

```typescript
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  const W = GAME_CONFIG.canvasWidth
  const H = GAME_CONFIG.canvasHeight
  
  // 修改这里的颜色
  ctx.fillStyle = '#1a1a2e'  // 深蓝色背景
  ctx.fillRect(0, 0, W, H)
  
  // 修改渐变
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, 'rgba(25, 25, 60, 0.5)')
  grad.addColorStop(1, 'rgba(40, 40, 80, 0.7)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
}
```

## 📚 模块说明

### 核心模块

| 文件 | 作用 | 常用修改 |
|------|------|----------|
| `config.ts` | 游戏配置 | 调整难度、添加饼干类型 |
| `cookie.ts` | 饼干逻辑 | 修改碰撞检测、运动方式 |
| `renderer.ts` | 渲染逻辑 | 修改视觉效果、UI样式 |
| `gameState.ts` | 状态管理 | 添加新道具、修改道具效果 |

### 辅助模块

| 文件 | 作用 |
|------|------|
| `types.ts` | TypeScript 类型定义 |
| `particles.ts` | 粒子效果系统 |
| `input.ts` | 输入事件处理 |
| `index.ts` | 主入口和游戏循环 |

## 🔧 常见任务

### 任务1：让饼干飞得更慢

```typescript
// config.ts
export const GAME_CONFIG: GameConfig = {
  baseVerticalSpeed: 2,      // 原来是 3
  verticalSpeedRange: 1,     // 原来是 2
}
```

### 任务2：增加游戏时间

```typescript
// config.ts
export const GAME_CONFIG: GameConfig = {
  gameDuration: 90000,  // 90秒（原来是60秒）
}
```

### 任务3：修改分数计算

```typescript
// gameState.ts - handleCookieSlice 函数
export function handleCookieSlice(...) {
  state.combo++
  // 修改这里的分数计算
  engine.addScore(20 * state.combo, cookieX, cookieY)  // 原来是 15
  // ...
}
```

### 任务4：添加新道具

**步骤1**: 在 `config.ts` 添加图标
```typescript
export const POWERUP_ICONS: Record<string, string> = {
  'slow': '🐌',
  'score2x': '✨',
  'freeze': '❄️',
  'magnet': '🧲',
  'newpower': '🎯',  // 新道具
}
```

**步骤2**: 在 `gameState.ts` 添加逻辑
```typescript
export function usePowerup(type: string, inventory: string[]): boolean {
  // ... 现有代码
  
  switch (type) {
    // ... 现有道具
    
    case 'newpower':
      // 新道具逻辑
      ;(window as any).cookieNewPower = Date.now() + 5000
      audioService.win()
      console.log('[道具] 新道具生效')
      break
  }
  
  return true
}
```

## 🎨 视觉定制

### 修改切割轨迹颜色

```typescript
// renderer.ts - drawSlices 函数
ctx.strokeStyle = `rgba(255, 100, 100, ${s.life * 0.6})`  // 红色轨迹
```

### 修改粒子颜色

```typescript
// config.ts
export const PARTICLE_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']
```

### 修改UI字体大小

```typescript
// renderer.ts - drawUI 函数
ctx.font = 'bold 50px sans-serif'  // 更大的分数显示
```

## 🐛 调试技巧

### 查看游戏状态

在浏览器控制台输入：
```javascript
// 查看当前饼干数量
console.log('Cookies:', window.cookieCutState?.cookies?.length)

// 查看连击数
console.log('Combo:', window.cookieCutState?.combo)

// 手动触发道具
window.cookieSlow = Date.now() + 8000
```

### 测试不同难度

临时修改配置进行测试：
```typescript
// 在 index.ts 的 update 函数中添加调试信息
function update() {
  console.log('Active cookies:', state.cookies.length)
  console.log('Spawn timer:', Date.now() - state.lastSpawn)
  // ... 原有代码
}
```

## 📖 更多信息

- 完整文档：查看 [README.md](./README.md)
- 重构报告：查看 [REFACTOR_REPORT.md](./REFACTOR_REPORT.md)
- 类型定义：查看 [types.ts](./types.ts)

## 💡 小贴士

1. **保存前测试**：每次修改后在浏览器中测试效果
2. **小步修改**：一次只改一个参数，便于观察效果
3. **备份配置**：修改前先备份原始配置
4. **查看控制台**：浏览器控制台会显示道具使用和游戏状态信息

---

**祝开发愉快！** 🎮✨
