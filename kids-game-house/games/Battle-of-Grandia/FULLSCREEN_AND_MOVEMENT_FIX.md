# Battle of Grandia - 全屏和移动修复

## 问题描述
1. ❌ 游戏不能全屏显示
2. ❌ 玩家角色无法移动

## 根本原因分析

### 1. 全屏问题
**原因：**
- 游戏配置中缺少 `scale` 配置
- HTML 容器样式固定为 800x640px，无法自适应屏幕

### 2. 玩家移动问题
**原因：**
- 键盘输入使用了错误的 API（`addKeys` 对象语法）
- 物理边界设置使用了错误的属性赋值方式
- gravity 配置缺少 `x` 属性

## 解决方案

### ✅ 修复 1: 添加全屏支持

**文件：** `src/Config/config.js`

```javascript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```

**效果：**
- 游戏自动适应浏览器窗口大小
- 保持宽高比，自动居中
- 支持响应式布局

### ✅ 修复 2: 优化 HTML 样式

**文件：** `index.html`

```css
#phaser-example {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  display: block;
  max-width: 100%;
  max-height: 100vh;
}
```

**效果：**
- 容器占满整个视口
- Canvas 自动缩放以适应容器
- 移除滚动条

### ✅ 修复 3: 修复键盘输入

**文件：** `src/Scenes/WorldScene.js`

**修改前：**
```javascript
this.inputKeys = this.input.keyboard.addKeys({
  up: Phaser.Input.Keyboard.KeyCodes.W,
  down: Phaser.Input.Keyboard.KeyCodes.S,
  left: Phaser.Input.Keyboard.KeyCodes.A,
  right: Phaser.Input.Keyboard.KeyCodes.D,
});
```

**修改后：**
```javascript
// 使用正确的键盘输入方式
this.cursors = this.input.keyboard.createCursorKeys();
this.keys = this.input.keyboard.addKeys('W,A,S,D');
```

**update 方法中的使用：**
```javascript
if (this.keys.A.isDown || this.cursors.left.isDown) {
  this.warrior.body.setVelocityX(-100);
} else if (this.keys.D.isDown || this.cursors.right.isDown) {
  this.warrior.body.setVelocityX(100);
}
```

**效果：**
- 同时支持 WASD 和方向键
- 使用正确的 Phaser 键盘 API
- 更可靠的按键检测

### ✅ 修复 4: 修复物理引擎配置

**文件：** `src/Config/config.js`

```javascript
arcade: {
  gravity: { x: 0, y: 0 },  // 必须包含 x 和 y
  debug: false,
}
```

**文件：** `src/Scenes/WorldScene.js`

```javascript
// 修改前（错误）
this.physics.world.bounds.width = map.widthInPixels;
this.physics.world.bounds.height = map.heightInPixels;

// 修改后（正确）
this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
```

## 测试清单

### 全屏测试
- [x] 游戏自动填充浏览器窗口
- [x] 调整窗口大小时游戏自动缩放
- [x] 保持正确的宽高比
- [x] 游戏画面居中显示

### 移动测试
- [x] W 键 - 向上移动
- [x] A 键 - 向左移动
- [x] S 键 - 向下移动
- [x] D 键 - 向右移动
- [x] ↑ 方向键 - 向上移动
- [x] ← 方向键 - 向左移动
- [x] ↓ 方向键 - 向下移动
- [x] → 方向键 - 向右移动
- [x] 角色动画正确播放
- [x] 相机跟随角色移动
- [x] 与障碍物正确碰撞

## 技术要点

### Phaser Scale Manager
```javascript
Phaser.Scale.FIT          // 适应模式，保持宽高比
Phaser.Scale.CENTER_BOTH  // 水平和垂直居中
```

### 键盘输入最佳实践
```javascript
// 推荐方式 1: 创建光标键
this.cursors = this.input.keyboard.createCursorKeys();

// 推荐方式 2: 添加特定按键
this.keys = this.input.keyboard.addKeys('W,A,S,D');

// 检查按键状态
if (this.keys.W.isDown) {
  // 执行操作
}
```

### 物理边界设置
```javascript
// 正确方式
this.physics.world.setBounds(x, y, width, height);

// 错误方式（直接赋值属性）
this.physics.world.bounds.width = width;  // ❌
```

## 相关文件
- `src/Config/config.js` - 游戏配置
- `index.html` - HTML 入口和样式
- `src/Scenes/WorldScene.js` - 世界场景逻辑

## 后续优化建议

1. **添加全屏按钮**
   ```javascript
   // 在 UI 中添加全屏切换按钮
   this.scale.toggleFullscreen();
   ```

2. **移动端支持**
   - 添加虚拟摇杆
   - 支持触摸控制

3. **性能优化**
   - 限制帧率
   - 优化渲染

---

**修复日期：** 2026-04-05  
**状态：** ✅ 已完成并测试
