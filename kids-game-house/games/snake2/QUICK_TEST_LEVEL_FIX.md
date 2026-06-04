# 🚀 Snake2 关卡问题 - 快速测试指南

**目标**: 3 分钟内验证修复效果

---

## ⚡ 超快测试流程（90 秒）

### 第 1 步：启动服务器（30 秒）

```bash
cd kids-game-house/games/snake2
npm run dev
```

看到：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3006/
➜  Network: use --host to expose
```

---

### 第 2 步：打开浏览器（10 秒）

访问：**http://localhost:3006/**

按 **F12** 打开控制台

---

### 第 3 步：开始游戏（30 秒）

1. 点击"开始游戏"按钮
2. 选择"简单"难度
3. 等待游戏加载

---

### 第 4 步：检查画面（20 秒）

**应该看到**:
- ✅ 绿色蛇在移动
- ✅ 红色食物
- ✅ 网格背景
- ✅ 分数显示

**控制台应该显示**:
```
📖 [LevelLoader] 正在加载关卡：snake_level_1
✅ [LevelLoader] 关卡加载成功：snake_level_1
   ├─ 名称：初出茅庐
   └─ 目标数：2
```

---

## ✅ 成功标准

### 必须满足的条件

- [ ] 游戏画布不是空白
- [ ] 能看到蛇（绿色方块）
- [ ] 能看到食物（红色圆点）
- [ ] 蛇可以控制方向
- [ ] 控制台无错误

---

## ❌ 如果还是看不到

### 快速诊断命令

在浏览器控制台运行：

```javascript
// 1. 检查 Phaser
console.log('Phaser:', typeof Phaser !== 'undefined' ? '✅' : '❌')

// 2. 检查 Canvas
const canvas = document.querySelector('canvas')
console.log('Canvas:', canvas ? `✅ ${canvas.width}x${canvas.height}` : '❌')

// 3. 尝试手动加载关卡
import('/src/utils/SnakeLevelLoader.ts').then(m => {
  return m.SnakeLevelLoader.loadFromJSON('snake_level_1')
}).then(config => {
  console.log('✅ 关卡加载成功:', config.info.name)
}).catch(err => {
  console.error('❌ 关卡加载失败:', err.message)
})
```

---

## 🎯 预期结果对比

### 修复前 ❌

```
[空白屏幕]
控制台：无任何输出
或者：Error: Cannot find module
```

---

### 修复后 ✅

```
[游戏画面正常显示]
🐍 蛇在移动
🍎 食物在闪烁
📊 分数在左上角

控制台:
📖 [LevelLoader] 正在加载关卡：snake_level_1
✅ [LevelLoader] 关卡加载成功：snake_level_1
   ├─ 名称：初出茅庐
   ├─ 难度：easy
   └─ 目标数：2
```

---

## 💡 一键测试脚本

创建 `test-level.html` 文件：

```html
<!DOCTYPE html>
<html>
<head>
  <title>关卡测试</title>
</head>
<body>
  <h1>Snake2 关卡加载测试</h1>
  <button onclick="testLoad()">测试加载</button>
  <pre id="output"></pre>
  
  <script type="module">
    window.testLoad = async function() {
      const output = document.getElementById('output')
      try {
        output.textContent = '正在加载...\n'
        const { SnakeLevelLoader } = await import('./src/utils/SnakeLevelLoader.ts')
        const config = await SnakeLevelLoader.loadFromJSON('snake_level_1')
        output.textContent = '✅ 成功!\n\n' + JSON.stringify(config.info, null, 2)
      } catch (err) {
        output.textContent = '❌ 失败:\n' + err.message
      }
    }
  </script>
</body>
</html>
```

---

## 📞 需要帮助？

如果以上步骤都无法解决问题，请提供：

1. 控制台完整输出
2. 截图或录屏
3. 浏览器版本
4. Node.js 版本 (`node -v`)

---

**准备好了吗？开始测试吧！** 🚀

```bash
cd snake2
npm run dev
# → http://localhost:3006/
```
