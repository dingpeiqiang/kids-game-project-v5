# 🎯 敌人坦克纹理问题 - 最终调试指南

## ✅ 已完成的修复

### 1. 生成 12 个方向的纹理图片 ✅
```
✅ enemy_light_up/down/left/right.png (轻型)
✅ enemy_medium_up/down/left/right.png (中型)
✅ enemy_heavy_up/down/left/right.png (重型)
```

### 2. 更新 GTRS.json 配置 ✅
所有纹理映射已指向正确的文件路径

### 3. 清理 Vite 缓存并重启服务器 ✅
```bash
Remove-Item node_modules/.vite -Recurse -Force
npm run dev
```

---

## 🔍 如何验证问题是否解决

### 步骤 1：强制刷新浏览器（必须！）

**按 `Ctrl + Shift + R`** 强制刷新，清除浏览器缓存。

或者在预览页面：
1. 按 `F12` 打开开发者工具
2. **右键点击刷新按钮**
3. 选择"**清空缓存并硬性重新加载**"

### 步骤 2：运行纹理诊断脚本

在游戏运行时，按 `F12` 打开控制台，**复制粘贴以下代码**执行：

```javascript
// 复制从这里开始 ↓
(function checkEnemyTextures() {
  const games = window.Phaser?.Game?.instances || [];
  if (!games.length) { console.error('❌ 未找到游戏'); return; }
  
  const scene = games[0].scene.scenes[0];
  const tex = scene.textures;
  
  const list = [
    'enemy_light_up', 'enemy_light_down', 'enemy_light_left', 'enemy_light_right',
    'enemy_medium_up', 'enemy_medium_down', 'enemy_medium_left', 'enemy_medium_right',
    'enemy_heavy_up', 'enemy_heavy_down', 'enemy_heavy_left', 'enemy_heavy_right'
  ];
  
  console.log('🎯 敌人纹理检查:\n');
  let ok = 0, fail = 0;
  
  list.forEach(name => {
    const exists = tex.exists(name);
    console.log(`${exists ? '✅' : '❌'} ${name}`);
    exists ? ok++ : fail++;
  });
  
  console.log(`\n结果：${ok}/${list.length} 成功`);
  if (fail > 0) {
    console.log('\n⚠️ 有纹理缺失！请:');
    console.log('1. 按 Ctrl+Shift+R 强制刷新');
    console.log('2. 关闭标签页，在新标签页重新打开');
  } else {
    console.log('\n✅ 所有纹理加载成功！');
  }
})();
// 复制到这里结束 ↑
```

**预期输出**：
```
🎯 敌人纹理检查:

✅ enemy_light_up
✅ enemy_light_down
✅ enemy_light_left
✅ enemy_light_right
... (全部 12 个都显示 ✅)

结果：12/12 成功
✅ 所有纹理加载成功！
```

### 步骤 3：观察敌人行为

如果纹理诊断脚本显示全部成功，现在观察游戏：

**应该看到的效果**：
1. ✅ 敌人生成时炮口朝下，向下移动
2. ✅ 遇到障碍物向左转时，炮口朝左
3. ✅ 向右转时，炮口朝右
4. ✅ 向上转时，炮口朝上

---

## 🐛 如果还是没变化

### 情况 A：纹理诊断显示 ❌

说明纹理没有正确加载。

**解决方案**：

1. **完全关闭浏览器**
   - 不只是关闭标签页，要完全退出浏览器程序

2. **删除整个 node_modules**（如果还不行）
   ```powershell
   Remove-Item node_modules -Recurse -Force
   npm install
   ```

3. **重新启动开发服务器**
   ```powershell
   npm run dev
   ```

4. **使用浏览器无痕模式打开**
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Edge: `Ctrl + Shift + N`

---

### 情况 B：纹理诊断显示 ✅，但看起来还是不对

说明纹理加载了，但代码中使用时可能有问题。

**实时监测敌人纹理使用**：

在游戏运行时，按 `F12` 打开控制台，执行：

```javascript
// 实时监控敌人使用的纹理
(function monitorEnemyTextures() {
  const scene = window.Phaser?.Game?.instances[0]?.scene?.scenes[0];
  if (!scene) return;
  
  console.log('🎮 开始监控敌人纹理使用...\n');
  
  setInterval(() => {
    const enemies = Array.from(scene.children.list).filter(
      c => c.texture?.key?.includes('enemy') && c.active
    );
    
    if (enemies.length) {
      console.clear();
      console.log('📊 实时敌人状态:\n');
      
      enemies.forEach((e, i) => {
        const vx = e.body?.velocity.x || 0;
        const vy = e.body?.velocity.y || 0;
        
        // 判断应该使用的纹理
        let expectedTex = 'unknown';
        if (vy < 0) expectedTex = 'up';
        else if (vy > 0) expectedTex = 'down';
        else if (vx < 0) expectedTex = 'left';
        else if (vx > 0) expectedTex = 'right';
        
        console.log(`敌人${i+1}:`);
        console.log(`  当前纹理：${e.texture.key}`);
        console.log(`  移动方向：X=${vx.toFixed(0)}, Y=${vy.toFixed(0)}`);
        console.log(`  应该使用：${expectedTex}`);
        console.log(`  角度：${e.angle}°`);
        console.log('');
      });
    }
  }, 1000);
  
  console.log('✅ 监控已启动，每秒更新一次\n');
})();
```

**正常输出应该是**：
```
📊 实时敌人状态:

敌人 1:
  当前纹理：enemy_light_down
  移动方向：X=0, Y=100
  应该使用：down
  角度：90°

敌人 2:
  当前纹理：enemy_light_left
  移动方向：X=-100, Y=0
  应该使用：left
  角度：180°
```

**如果"当前纹理"和"应该使用"不匹配**，说明代码逻辑有问题。

---

## 💡 常见问题分析

### 问题 1：所有敌人都用同一张图

**症状**：不管向哪个方向移动，敌人看起来都一样

**原因**：GTRS.json 配置还是指向旧文件

**检查**：
```javascript
// 在控制台执行
fetch('/themes/tank_default/GTRS.json')
  .then(r => r.json())
  .then(d => console.log('enemy_light_up:', d.resources.images.scene.enemy_light_up));
```

应该看到：
```json
{
  "src": "/themes/tank_default/assets/scene/enemy_light_up.png"
}
```

如果是 `/enemy_tank_1.png`，说明 GTRS.json 没有更新或浏览器缓存了旧的 JSON。

**解决**：强制刷新 `Ctrl + Shift + R`

---

### 问题 2：纹理名称不存在

**症状**：纹理诊断显示 ❌

**原因**：Phaser 没有加载这些纹理

**检查预加载日志**：
1. 按 `F12` 打开控制台
2. 刷新页面
3. 查找 `[GTRS 加载成功]` 相关日志
4. 看是否有 `注册图片：enemy_light_up -> ...` 的日志

**解决**：
- 确认 GTRS.json 存在且配置正确
- 确认图片文件实际存在于 `public/themes/tank_default/assets/scene/`
- 清除缓存重启服务器

---

### 问题 3：代码使用了错误的纹理名称

**症状**：纹理存在，但敌人用了错误的图

**检查 EnemyAIManager 中的 updateEnemyDirection 方法**：

```typescript
// 应该在第 165-197 行左右
private updateEnemyDirection(enemy: any, vx: number, vy: number): void {
  const enemyType = enemy.enemyType
  
  if (vy < 0) {      // 向上
    enemy.setAngle(-90)
    if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_up')  // ← 检查这里
    // ...
  }
}
```

**添加调试日志**：
```typescript
console.log('设置纹理:', 
  vy < 0 ? 'enemy_light_up' : 
  vy > 0 ? 'enemy_light_down' : 
  vx < 0 ? 'enemy_light_left' : 'enemy_light_right'
);
```

---

## 🎯 终极解决方案

如果以上都不行，尝试这个**终极方案**：

### 1. 完全重建项目

```powershell
# 停止所有 Node 进程
Stop-Process -Name node -Force

# 删除依赖
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# 重新安装
npm install

# 重新启动
npm run dev
```

### 2. 使用浏览器无痕模式

**一定要用无痕模式！** 这样可以避免所有缓存问题。

### 3. 手动验证每个文件

打开资源管理器，手动检查这些文件是否存在：

```
public/themes/tank_default/assets/scene/
├── enemy_light_up.png       ← 检查这个文件
├── enemy_light_down.png     ← 检查这个文件
├── enemy_light_left.png     ← 检查这个文件
├── enemy_light_right.png    ← 检查这个文件
... (其他 8 个文件)
```

双击每个图片，确认它们确实是不同的图片（不是同一张图）。

---

## 📞 请求帮助时的信息

如果以上方法都不行，请提供以下信息：

1. **纹理诊断脚本的输出**（截图或文字）
2. **浏览器控制台的完整日志**（从页面加载开始）
3. **Network 面板中 GTRS.json 的 Response**（截图）
4. **实际游戏截图**（显示敌人坦克的样子）
5. **执行以下命令的输出**：

```javascript
// 在控制台执行
const scene = window.Phaser.Game.instances[0].scene.scenes[0];
console.log('纹理列表:', Object.keys(scene.textures.textureManager).filter(k=>k.includes('enemy')));
console.log('enemy_light_up 存在吗？', scene.textures.exists('enemy_light_up'));
console.log('当前屏幕上的敌人数量:', 
  Array.from(scene.children.list).filter(c=>c.texture?.key?.includes('enemy')).length
);
```

---

**更新时间**：2026-04-03 00:35  
**状态**：等待用户验证  
**推荐操作**：按 `Ctrl + Shift + R` 强制刷新，然后用无痕模式测试
