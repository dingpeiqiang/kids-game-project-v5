# 🎨 专业版主题资源生成器（Node.js + Canvas）

## 📋 方案说明

### 为什么选择 Node.js + Canvas？

| 特性 | Python PIL | Node.js Canvas | 优势 |
|------|-----------|----------------|------|
| 图形质量 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Canvas 支持抗锯齿、渐变、阴影 |
| 绘制能力 | 基础几何 | 完整 2D API | 支持贝塞尔曲线、变换等 |
| 技术栈 | 跨语言 | 前端同源 | 易于维护和扩展 |
| 视觉效果 | 简单色块 | 精美图形 | 更专业的游戏素材 |
| DIY 扩展 | 较复杂 | 简单易用 | 方便创作者中心使用 |

---

## 🚀 快速开始

### 步骤 1：安装依赖

```bash
npm install canvas
```

**注意**：Canvas 需要系统级依赖：
- **Windows**: 已预装，无需额外操作
- **macOS**: 需要 Xcode Command Line Tools
- **Linux**: 需要安装 `libcairo2-dev libpango1.0-dev`

如果安装失败，请参考：https://github.com/Automattic/node-canvas#installation

---

### 步骤 2：生成资源

#### 方式 A：双击运行（推荐）
```bash
generate-theme-resources-pro.bat
```

#### 方式 B：命令行运行
```bash
node generate-theme-resources-pro.js
```

---

## 📊 生成的资源

### 贪吃蛇主题资源

每个主题包含以下精美资源：

| 资源 | 尺寸 | 效果描述 |
|------|------|----------|
| snakeHead.png | 64x64 | 带眼睛的圆形蛇头，有立体渐变和高光 |
| snakeBody.png | 48x48 | 圆角矩形蛇身，带边框和纹理 |
| snakeTail.png | 32x32 | 渐变蛇尾 |
| food.png | 32x32 | 苹果形状食物，带叶子和高光 |
| background.png | 1920x1080 | 专业渐变背景 |

**配色方案**：
- **清新绿**：🟢 绿色系 + 🔴 红色食物
- **经典复古**：💚 复古绿 + 💛 黄色食物（黑色背景）
- **活力橙**：🟠 橙色系 + 💠 青色食物

### PVZ 主题资源

| 资源 | 尺寸 | 效果描述 |
|------|------|----------|
| plant_peashooter.png | 64x64 | 豌豆射手，带炮管和眼睛 |
| plant_sunflower.png | 64x64 | 向日葵，12 片花瓣 + 花心 |
| plant_wallnut.png | 64x64 | 坚果墙，椭圆形带纹理 |
| zombie_normal.png | 64x64 | 普通僵尸，红眼睛 |
| zombie_conehead.png | 64x64 | 路障僵尸，戴橙色路障 |
| sun.png | 48x48 | 太阳，带光芒和渐变 |
| pea.png | 16x16 | 豌豆子弹，带高光 |
| gameBg.png | 800x600 | 草地渐变背景 |

**配色方案**：
- **阳光活力**：🟩 绿色植物 + ⬜ 灰色僵尸
- **月夜幽深**：💜 紫色植物 + 🌑 深色僵尸
- **卡通萌系**：🌸 粉色植物 + 👻 浅色僵尸

---

## 🎨 技术实现亮点

### 1. 蛇头设计
```javascript
// 径向渐变营造立体感
const gradient = ctx.createRadialGradient(center-5, center-5, 0, center, center, radius);
gradient.addColorStop(0, lightenColor(color, 20));  // 高光
gradient.addColorStop(1, color);                     // 主色

// 大眼睛 + 高光
ctx.arc(center - eyeOffset, center - eyeOffset/2, eyeRadius, ...);
ctx.fillStyle = 'rgba(255,255,255,0.6)';  // 眼睛高光
```

### 2. 向日葵设计
```javascript
// 12 片旋转花瓣
for (let i = 0; i < 12; i++) {
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate((i * 2 * Math.PI) / 12);  // 旋转
  ctx.ellipse(0, -petalLength/2, petalWidth, petalLength/2, ...);
  ctx.fill();
  ctx.restore();
}
```

### 3. 太阳光芒
```javascript
// 12 道光芒
const rays = 12;
for (let i = 0; i < rays; i++) {
  ctx.rotate((i * 2 * Math.PI) / rays);
  ctx.moveTo(0, -size/6);
  ctx.lineTo(3, -size/2);  // 三角形光芒
  ctx.lineTo(-3, -size/2);
  ctx.closePath();
}
```

---

## 💡 自定义扩展

### 添加新主题

在 `generate-theme-resources-pro.js` 的 `THEMES` 对象中添加：

```javascript
const THEMES = {
  snake: {
    yourTheme: {
      name: '你的主题名',
      colors: {
        snakeHead: '#颜色值',
        snakeBody: '#颜色值',
        // ... 其他颜色
      }
    }
  },
  pvz: {
    yourTheme: {
      name: '你的主题名',
      colors: {
        plant: '#颜色值',
        zombie: '#颜色值',
        // ... 其他颜色
      }
    }
  }
};
```

### 修改图形样式

例如，把蛇头改为方形：

```javascript
function createSnakeHead(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 改为绘制正方形
  ctx.fillStyle = color;
  ctx.fillRect(2, 2, size-4, size-4);
  
  // 添加表情...
  return canvas;
}
```

### 添加动画帧

```javascript
// 生成 4 帧旋转动画
for (let i = 0; i < 4; i++) {
  const frame = createFood(32, '#ff0000');
  const ctx = frame.getContext('2d');
  ctx.rotate(i * Math.PI / 2);  // 每帧旋转 90 度
  saveCanvas(frame, `food_frame_${i}.png`);
}
```

---

## 🔧 高级功能

### 1. 批量生成所有主题变体

```bash
# 修改脚本中的循环
Object.entries(THEMES.snake).forEach(([name, config]) => {
  generateSnakeTheme(name, config);
});
```

### 2. 导出为不同格式

```javascript
// 导出 JPEG（更小文件）
saveCanvas(canvas, 'output.jpg', 'image/jpeg', 0.9);

// 导出 WebP（最佳压缩）
saveCanvas(canvas, 'output.webp', 'image/webp', 0.8);
```

### 3. 添加水印

```javascript
function addWatermark(canvas, text) {
  const ctx = canvas.getContext('2d');
  ctx.font = '12px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText(text, 10, canvas.height - 10);
  return canvas;
}
```

---

## ⚠️ 注意事项

### 性能优化

1. **缓存 Canvas 对象**
   ```javascript
   const cachedCanvas = new Map();
   
   function getCachedImage(key, createFn) {
     if (!cachedCanvas.has(key)) {
       cachedCanvas.set(key, createFn());
     }
     return cachedCanvas.get(key);
   }
   ```

2. **批量保存**
   ```javascript
   // 一次性保存所有资源
   Promise.all(promises).then(() => {
     console.log('批量保存完成');
   });
   ```

### 兼容性

- Canvas 2D API 在所有现代浏览器中通用
- 生成的 PNG 支持透明通道
- 建议最小尺寸：16x16（太小会丢失细节）

---

## 📝 常见问题

### Q1: Canvas 安装失败？
**A:** 
```bash
# Windows: 确保安装了 Visual Studio Build Tools
# macOS: 安装 Xcode Command Line Tools
xcode-select --install

# Linux (Ubuntu):
sudo apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

### Q2: 如何替换为自己绘制的图片？
**A:** 保持文件名不变，替换 `kids-game-frontend/dist/games/...` 下的对应文件即可。

### Q3: 如何调整资源尺寸？
**A:** 修改 `createSnakeHead(64, color)` 中的 `64` 参数，同时更新 SQL 中的引用。

---

## ✅ 总结

这个方案的优势：

✅ **专业级视觉效果** - 渐变、阴影、高光  
✅ **完整的 2D 绘图 API** - 支持复杂图形  
✅ **前端技术栈** - 易于维护和扩展  
✅ **双目录输出** - dist（开发）+ assets（源文件）  
✅ **高度可定制** - 方便创作者 DIY  

现在可以生成真正可用的精美游戏资源了！🎉
