# 极速飞车移动端画布适配修复

## 问题描述
在移动端设备上，极速飞车（racingRun）游戏上下预留的空间太多，导致游戏画面高度不够，影响游戏体验。

## 问题原因
在 `App.ts` 文件中，画布适配逻辑对所有非spaceShooter游戏统一使用了 `window.innerHeight * 0.85` 来计算高度比例，这意味着只使用了屏幕高度的85%，留下了15%的上下空间。对于竖屏的极速飞车游戏来说，这会导致游戏画面高度不足。

## 解决方案
修改了 `kids-game-house/games/simple-game/src/App.ts` 文件中的画布适配逻辑：

1. 添加了针对极速飞车游戏的特殊判断：
   ```typescript
   const isRacingRun = this.currentGame.id === 'racingRun'  // 极速飞车需要更多垂直空间
   ```

2. 为极速飞车游戏使用更大的高度比例（95%），而其他游戏保持原来的85%：
   ```typescript
   // 极速飞车游戏使用95%高度，其他游戏使用85%高度
   const heightRatio = isRacingRun ? window.innerHeight * 0.95 / H : window.innerHeight * 0.85 / H
   ```

## 测试方法
1. 启动开发服务器：`cd kids-game-house/games/simple-game && npm run dev`
2. 在移动设备或浏览器开发者工具的移动模式下访问：http://localhost:5100/
3. 选择"极速赛车"游戏进行体验
4. 观察游戏画面是否充分利用了屏幕高度，上下空白区域是否明显减少

## 预期效果
- 极速飞车游戏在移动端将使用屏幕高度的95%，显著减少上下空白区域
- 游戏画面更加饱满，视觉体验更好
- 滑动杆控制仍然保持在合适的位置，不影响操作
- 其他游戏的显示效果不受影响

## 相关文件
- `kids-game-house/games/simple-game/src/App.ts` - 主要修改文件
- `kids-game-house/games/simple-game/src/games/racingRun/config.ts` - 游戏配置
- `kids-game-house/games/simple-game/src/games/racingRun/renderer.ts` - 渲染器（包含滑动杆位置设置）
