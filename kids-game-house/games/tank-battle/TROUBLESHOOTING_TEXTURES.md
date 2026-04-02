# 🔍 敌人纹理问题排查指南

## 问题现状

用户反馈："还是没变化" - 敌人坦克炮口方向仍然不对

## ✅ 已完成的修复

### 1. 代码逻辑 ✅
- `EnemyAIManager.updateEnemyDirection()` 正确实现
- 炮口朝向与移动方向同步逻辑完整

### 2. 图片资源 ✅
生成了 12 个方向的纹理图片：
```
✅ enemy_light_up/down/left/right.png
✅ enemy_medium_up/down/left/right.png  
✅ enemy_heavy_up/down/left/right.png
```

### 3. GTRS.json 配置 ✅
所有纹理映射都已正确配置

---

## 🐛 可能的原因

### 原因 1：浏览器缓存 ⭐⭐⭐⭐⭐

**最可能的原因！** 浏览器缓存了旧的资源和配置。

**解决方案**：
1. **强制刷新页面**
   - Windows: `Ctrl + Shift + R` 或 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **清除浏览器缓存**
   - 打开开发者工具 (F12)
   - 右键点击刷新按钮 → "清空缓存并硬性重新加载"

3. **使用无痕模式**
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`

---

### 原因 2：Vite 资源缓存 ⭐⭐⭐

Vite 可能缓存了旧的 GTRS.json。

**解决方案**：
```bash
# 停止当前服务器
# 删除 Vite 缓存
rm -rf node_modules/.vite

# 重新启动
npm run dev
```

或者在 `vite.config.ts` 中添加：
```typescript
export default defineConfig({
  server: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  },
  // 强制优化依赖
  optimizeDeps: {
    force: true
  }
})
```

---

### 原因 3：GTRS.json 未重新加载 ⭐⭐⭐

游戏可能缓存了 GTRS.json 配置。

**验证方法**：
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 刷新页面
4. 查找 `GTRS.json`
5. 检查 Response 中的纹理路径是否正确

**手动验证**：
```javascript
// 在游戏运行时，在控制台执行：
fetch('/themes/tank_default/GTRS.json')
  .then(r => r.json())
  .then(d => console.log('enemy_light_up:', d.resources.images.scene.enemy_light_up))
```

应该看到：
```json
{
  "alias": "敌方轻型坦克 - 向上",
  "src": "/themes/tank_default/assets/scene/enemy_light_up.png"
}
```

---

### 原因 4：Phaser 纹理缓存 ⭐⭐

Phaser 在预加载阶段缓存了纹理，不会动态更新。

**解决方案**：需要完全重启游戏（不是热更新）。

1. 关闭浏览器标签页
2. 停止开发服务器
3. 清理 Vite 缓存：
   ```bash
   rm -rf node_modules/.vite
   ```
4. 重新启动服务器：
   ```bash
   npm run dev
   ```
5. 在新标签页中打开游戏

---

### 原因 5：纹理名称不匹配 ⭐

代码中使用的纹理名称与 GTRS.json 不一致。

**验证方法**：
```javascript
// 在 EnemyAIManager.updateEnemyDirection() 中添加调试
console.log('设置纹理:', textureName);
console.log('纹理是否存在:', this.scene.textures.exists(textureName));
```

如果显示 `false`，说明纹理未正确加载。

---

## 🔧 快速诊断脚本

创建一个测试页面来验证纹理：

```html
<!DOCTYPE html>
<html>
<head>
  <title>纹理测试</title>
</head>
<body>
  <h1>敌人纹理测试</h1>
  <div id="test"></div>
  
  <script>
    fetch('/themes/tank_default/GTRS.json')
      .then(r => r.json())
      .then(data => {
        const textures = data.resources.images.scene;
        const testDiv = document.getElementById('test');
        
        // 列出所有敌人纹理
        Object.keys(textures).forEach(key => {
          if (key.includes('enemy_')) {
            const tex = textures[key];
            const img = document.createElement('img');
            img.src = tex.src;
            img.style.width = '64px';
            img.style.height = '64px';
            img.title = key;
            testDiv.appendChild(img);
          }
        });
      });
  </script>
</body>
</html>
```

保存为 `public/test-textures.html`，然后访问 `http://localhost:5175/test-textures.html`

如果能看到 12 张不同的敌人坦克图片，说明资源没问题。

---

## 📋 检查清单

请按顺序检查以下项目：

- [ ] **文件存在性**
  ```bash
  dir public/themes/tank_default/assets/scene/enemy_*.png
  ```
  应该看到 15 个文件（3 个原始 + 12 个新生成的）

- [ ] **GTRS.json 配置**
  检查 `enemy_light_up` 等纹理的 `src` 字段是否指向正确的文件

- [ ] **网络请求**
  在浏览器 DevTools 的 Network 面板中查看 GTRS.json 是否成功加载（状态码 200）

- [ ] **Phaser 纹理**
  在游戏运行时，在控制台输入：
  ```javascript
  console.log(
    game.scene.scenes[0].textures.exists('enemy_light_up')
  )
  ```
  应该返回 `true`

- [ ] **强制刷新**
  按 `Ctrl + Shift + R` 强制刷新浏览器缓存

---

## 🎯 推荐的解决步骤

### 方案 A：最简单（90% 有效）

1. 关闭浏览器标签页
2. 按 `Ctrl + Shift + R` 强制刷新
3. 在新标签页中重新打开游戏

### 方案 B：清理缓存（95% 有效）

1. 停止开发服务器
2. 删除缓存：
   ```bash
   rm -rf node_modules/.vite
   ```
3. 重新启动：
   ```bash
   npm run dev -- --force
   ```
4. 在浏览器无痕模式中打开

### 方案 C：完全重建（100% 有效）

1. 停止开发服务器
2. 删除整个 `node_modules`：
   ```bash
   rm -rf node_modules
   ```
3. 重新安装依赖：
   ```bash
   npm install
   ```
4. 启动开发服务器：
   ```bash
   npm run dev
   ```
5. 在浏览器无痕模式中打开

---

## 💡 验证成功的标志

如果修复成功，你应该看到：

1. **敌人坦克生成时**
   - 炮口朝下 ✓
   - 使用 `enemy_light_down.png` ✓

2. **敌人向下移动**
   - 炮口保持朝下 ✓
   - 纹理正确显示 ✓

3. **敌人遇到障碍物转向**
   - 向左转：炮口朝左，使用 `enemy_light_left.png` ✓
   - 向右转：炮口朝右，使用 `enemy_light_right.png` ✓
   - 向上转：炮口朝上，使用 `enemy_light_up.png` ✓

4. **视觉流畅**
   - 转向动作自然 ✓
   - 炮口始终指向移动方向 ✓

---

## 📞 如果仍然无效

请提供以下信息以便进一步诊断：

1. **浏览器控制台截图** (F12 → Console)
2. **Network 面板截图** (F12 → Network → 筛选 GTRS.json)
3. **实际看到的敌人坦克截图**
4. **执行以下命令的输出**：
   ```javascript
   const scene = game.scene.scenes[0];
   console.log('纹理列表:', Object.keys(scene.textures.textureManager));
   console.log('enemy_light_up 存在吗？', scene.textures.exists('enemy_light_up'));
   ```

---

**更新时间**：2026-04-03 00:20  
**状态**：待用户验证
