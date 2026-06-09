# 切饼干游戏 (Cookie Cut)

## 📖 游戏简介

切饼干是一款适合小朋友的休闲游戏。玩家需要滑动鼠标或触摸屏幕来切割从底部上升的各种形状的饼干，获得分数和连击奖励。

### 🎯 游戏特点
- **简单易上手**：只需滑动即可切割饼干
- **适合儿童**：速度慢、难度低，小朋友也能轻松玩
- **视觉效果**：漂亮的粒子效果和切割轨迹
- **道具系统**：支持减速、双倍分数、冻结、磁铁等道具

## 📁 目录结构

```
cookieCut/
├── index.ts          # 主入口文件
├── types.ts          # TypeScript 类型定义
├── config.ts         # 游戏配置常量
├── cookie.ts         # 饼干生成和更新逻辑
├── particles.ts      # 粒子效果系统
├── renderer.ts       # Canvas 渲染逻辑
├── input.ts          # 输入事件处理
├── gameState.ts      # 游戏状态管理
└── README.md         # 本文档
```

## ⚙️ 配置说明

### 游戏难度配置（`config.ts`）

```typescript
export const GAME_CONFIG: GameConfig = {
  canvasWidth: 400,              // 画布宽度
  canvasHeight: 600,             // 画布高度
  gameDuration: 60000,           // 游戏时长：60秒
  spawnInterval: 1500,           // 饼干生成间隔：1.5秒
  maxCookies: 3,                 // 最大同时存在的饼干数
  cookieSizeMin: 50,             // 最小饼干尺寸
  cookieSizeMax: 70,             // 最大饼干尺寸
  baseVerticalSpeed: 3,          // 基础垂直速度（较慢）
  verticalSpeedRange: 2,         // 垂直速度随机范围
  baseHorizontalSpeed: 1.5,      // 基础水平速度（较慢）
  rotationSpeed: 0.08,           // 旋转速度（较缓）
}
```

### 调整难度

如果想让游戏更难或更简单，可以修改以下参数：

**更容易（更适合小朋友）**：
- 增加 `spawnInterval`（如 2000ms）
- 减小 `baseVerticalSpeed`（如 2）
- 减小 `maxCookies`（如 2）

**更有挑战性**：
- 减小 `spawnInterval`（如 1000ms）
- 增加 `baseVerticalSpeed`（如 5）
- 增加 `maxCookies`（如 5）

## 🎮 游戏玩法

1. **切割饼干**：按住鼠标或手指在屏幕上滑动，划过饼干即可切割
2. **获得分数**：每切割一个饼干获得基础分数，连击时有倍数奖励
3. **连击系统**：连续切割多个饼干可获得连击奖励（2连击、3连击...）
4. **道具收集**：连击达到3次以上可能触发随机道具
5. **时间限制**：游戏时长60秒，尽可能获得高分

## 🎨 饼干类型

游戏包含5种不同形状的饼干：
- ⭐ 星星饼干（金色）
- ❤️ 爱心饼干（红色）
- 🍪 圆形饼干（棕色）
- 🌙 月亮饼干（米色）
- 🌸 花朵饼干（粉色）

## 🔧 道具系统

### 可用道具
- 🐌 **减速**：饼干速度减半，持续8秒
- ✨ **双倍分数**：10秒内获得双倍分数
- ❄️ **冻结**：暂停所有饼干3秒
- 🧲 **磁铁**：自动吸引附近饼干，持续6秒

### 使用道具
道具会显示在游戏界面上方，点击即可使用。

## 🛠️ 开发指南

### 添加新饼干类型

在 `config.ts` 中的 `COOKIES` 数组添加新模板：

```typescript
export const COOKIES: CookieTemplate[] = [
  // ... 现有饼干
  { shape: 'diamond', emoji: '💎', color: '#00FFFF' }, // 新饼干
]
```

### 添加新道具

1. 在 `config.ts` 的 `POWERUP_ICONS` 中添加图标
2. 在 `gameState.ts` 的 `usePowerup` 函数中添加道具逻辑
3. 根据需要添加新的全局状态变量

### 修改视觉效果

- **背景颜色**：修改 `renderer.ts` 中的 `drawBackground` 函数
- **切割轨迹**：修改 `renderer.ts` 中的 `drawSlices` 函数
- **粒子效果**：修改 `particles.ts` 中的 `createCookieParticles` 函数

## 📝 技术架构

### 模块化设计

游戏采用模块化架构，每个模块职责清晰：

- **types.ts**：定义所有数据结构，便于类型检查
- **config.ts**：集中管理所有配置常量，易于调整
- **cookie.ts**：纯函数式饼干逻辑，无副作用
- **particles.ts**：独立的粒子系统
- **renderer.ts**：专注于 Canvas 绘制
- **input.ts**：统一处理鼠标和触摸事件
- **gameState.ts**：管理游戏状态和道具系统
- **index.ts**：协调各模块，组织游戏循环

### 性能优化

- 使用对象池思想管理粒子和切片
- 及时清理不可见对象（超出边界的饼干、消失的粒子）
- 使用 `requestAnimationFrame` 保证流畅动画

## 🐛 常见问题

### Q: 饼干移动太快怎么办？
A: 在 `config.ts` 中减小 `baseVerticalSpeed` 和 `baseHorizontalSpeed`

### Q: 如何延长游戏时间？
A: 修改 `config.ts` 中的 `gameDuration`（单位：毫秒）

### Q: 想增加更多饼干同时出现？
A: 增加 `config.ts` 中的 `maxCookies` 值

## 📄 许可证

本项目遵循项目的整体许可证。
