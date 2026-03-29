# 🎨 Canvas 资源生成技术文档

**版本**: v2.0  
**技术栈**: @napi-rs/canvas + Sharp  
**最后更新**: 2026-03-27  

---

## 🚀 技术选型

### 为什么选择 @napi-rs/canvas？

| 特性 | @napi-rs/canvas | 传统 SVG | HTML5 Canvas |
|------|----------------|----------|--------------|
| **性能** | ⚡ Rust 实现，极快 | 🐌 XML 解析慢 | 🏃 浏览器依赖 |
| **功能** | 🎨 完整 Canvas API | ⚠️ 基础图形 | 🎨 完整 API |
| **环境** | ✅ 纯 Node.js | ✅ 纯 Node.js | ❌ 需要浏览器 |
| **质量** | 💎 专业级渲染 | ⚠️ 简陋几何 | 💎 专业级 |
| **学习曲线** | 📈 标准 Canvas API | 📉 简单 | 📈 标准 API |

---

## 📦 安装

```bash
npm install @napi-rs/canvas sharp
```

**依赖说明**:
- `@napi-rs/canvas` - Rust 实现的 Node.js Canvas (核心)
- `sharp` - 高性能图片处理库 (辅助)

---

## 🎯 核心功能

### 1. 玩家飞机生成

**Canvas 绘制效果**:
- ✅ 流线型机身（贝塞尔曲线）
- ✅ 渐变填充机翼
- ✅ 透明驾驶舱盖
- ✅ 引擎喷口火焰动画效果
- ✅ 高光和阴影细节

**代码示例**:
```javascript
import { createCanvas } from '@napi-rs/canvas';

const canvas = createCanvas(256, 256);
const ctx = canvas.getContext('2d');

// 绘制流线型机身
ctx.beginPath();
ctx.moveTo(128, 32);
ctx.bezierCurveTo(148, 92, 153, 152, 148, 212);
ctx.bezierCurveTo(143, 232, 113, 232, 108, 212);
ctx.bezierCurveTo(103, 152, 108, 92, 128, 32);
ctx.fill();

// 转换为 PNG
const buffer = canvas.toBuffer('image/png');
```

### 2. 敌机生成

**不同类型敌机**:
- **小型**: 椭圆身体 + 大眼睛 + 小翅膀
- **中型**: 多边形装甲 + 武器系统
- **大型**: 复杂结构 + 多个传感器 + 重武器

**绘制特点**:
```javascript
// 径向渐变（立体感）
const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
gradient.addColorStop(0, '#ef4444');
gradient.addColorStop(1, '#b91c1c');

// 复杂路径（装甲板）
ctx.moveTo(0, -70);
ctx.lineTo(40, -30);
ctx.lineTo(60, 20);
// ... 更多点
```

### 3. 子弹效果

**发光效果实现**:
```javascript
// 阴影发光
ctx.shadowBlur = 20;
ctx.shadowColor = '#3b82f6';

// 子弹主体（渐变）
const gradient = ctx.createLinearGradient(0, -60, 0, 60);
gradient.addColorStop(0, '#60a5fa');
gradient.addColorStop(0.5, '#93c5fd');
gradient.addColorStop(1, '#60a5fa');

ctx.fill();
```

### 4. 道具图标

**设计元素**:
- 径向渐变球体
- 粗边框
- 大写字母标识
- 高光反射效果

```javascript
// 外圆渐变
const gradient = ctx.createRadialGradient(0, 0, 30, 0, 0, 90);
gradient.addColorStop(0, '#60a5fa');
gradient.addColorStop(1, '#2563eb');

ctx.arc(0, 0, 90, 0, Math.PI * 2);
ctx.fill();

// 字母
ctx.font = 'bold 80px Arial';
ctx.fillText('S', 0, 5); // Speed
```

---

## 🔧 技术细节

### Canvas API 使用

#### 路径绘制
```javascript
// 贝塞尔曲线（流线型）
ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);

// 椭圆（机身/眼睛）
ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);

// 多边形（装甲板）
ctx.moveTo(x, y);
ctx.lineTo(x, y);
ctx.closePath();
```

#### 渐变效果
```javascript
// 线性渐变（机翼）
const linearGrad = ctx.createLinearGradient(x0, y0, x1, y1);
linearGrad.addColorStop(0, color1);
linearGrad.addColorStop(1, color2);

// 径向渐变（立体感）
const radialGrad = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
radialGrad.addColorStop(0, color1);
radialGrad.addColorStop(1, color2);
```

#### 变换操作
```javascript
// 平移（中心点）
ctx.translate(128, 128);

// 旋转（机翼角度）
ctx.rotate(Math.PI / 6);

// 保存/恢复状态
ctx.save();
// ... 绘制
ctx.restore();
```

### 性能优化

#### 1. 批量生成
```javascript
// 一次性生成所有资源
async generateAllResources(requirements) {
  const promises = requirements.images.map(req => 
    this.generateImage(req)
  );
  await Promise.all(promises);
}
```

#### 2. Canvas 复用
```javascript
// 创建单个 Canvas 实例复用
this.canvas = createCanvas(256, 256);
this.ctx = this.canvas.getContext('2d');

// 每次清空重绘
this.ctx.clearRect(0, 0, 256, 256);
```

#### 3. Buffer 缓存
```javascript
// 直接输出 Buffer，避免额外转换
const buffer = canvas.toBuffer('image/png');
await fs.writeFile(filepath, buffer);
```

---

## 📊 质量对比

### SVG vs Canvas

| 指标 | SVG (v1) | Canvas (v2) | 提升 |
|------|---------|------------|------|
| **文件大小** | ~2KB | ~15KB | ⬆️ 细节丰富 |
| **视觉质量** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⬆️ 专业级 |
| **绘制复杂度** | 简单几何 | 复杂图形 | ⬆️ 表现力强 |
| **渐变效果** | 线性 | 线性 + 径向 | ⬆️ 立体感 |
| **光影效果** | ❌ 无 | ✅ 支持 | ⬆️ 真实感 |
| **开发效率** | 快速 | 中等 | ➖ 值得 |

### 实际效果展示

**玩家飞机**:
```
SVG v1:                    Canvas v2:
   ▲                         ✈️
  / \                      流线型机身
 /___\                    渐变机翼
简单三角形                透明驾驶舱
                        引擎火焰
```

**敌机**:
```
SVG v1:                    Canvas v2:
  ●                         👾
红色圆形                  椭圆身体
                        大眼睛+眼神光
                        翅膀+细节
```

---

## 🎨 风格配置

### 卡通风格 (Cartoon)
```javascript
{
  player: {
    primary: '#4ade80',    // 亮绿
    secondary: '#22c55e',  // 深绿
    accent: '#86efac'      // 浅绿
  }
}
```

### 像素风格 (Pixel) - TODO
```javascript
// 待实现：像素化处理
ctx.imageSmoothingEnabled = false;
```

### 写实风格 (Realistic) - TODO
```javascript
// 待实现：更复杂的 shading
// - 金属质感
// - 磨损效果
// - 环境光遮蔽
```

---

## 🐛 已知问题

### 1. 颜色调整函数未实现

**现状**:
```javascript
shadeColor(color, percent) {
  return color; // TODO
}
```

**解决方案**:
```javascript
shadeColor(color, percent) {
  // 解析 hex 颜色
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // 调整亮度
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.round(r * factor));
  const newG = Math.min(255, Math.round(g * factor));
  const newB = Math.min(255, Math.round(b * factor));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
```

### 2. 随机火焰效果不稳定

**现状**:
```javascript
ctx.lineTo(-25, 110 + Math.random() * 10);
```

**改进**:
使用 Perlin 噪声或正弦波实现连续动画效果。

---

## 🚀 未来计划

### Phase 1: 完成基础功能 (Current)
- ✅ 玩家飞机
- ✅ 三种敌机
- ✅ 两种子弹
- ✅ 五种道具

### Phase 2: 增强效果 (Next)
- [ ] 实现完整的颜色调整
- [ ] 添加更多细节（铆钉、接缝）
- [ ] 实现像素风格
- [ ] 实现写实风格

### Phase 3: 高级功能
- [ ] 背景图层生成
- [ ] 爆炸动画序列
- [ ] 粒子效果
- [ ] UI 元素生成

---

## 📞 参考资料

### @napi-rs/canvas 官方文档
- GitHub: https://github.com/napi-rs/canvas
- API: 完整兼容 HTML5 Canvas

### Canvas 教程
- MDN Canvas Tutorial: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
- W3Schools Canvas: https://www.w3schools.com/html/html5_canvas.asp

### 游戏美术设计
- 《像素画绘制技法》
- 《游戏美术设计实战》

---

<div align="center">

## 🎯 总结

**Canvas 生成的优势**:

> **专业级质量 · 无降级方案 · 完全自动化**

**技术指标**:

- ✅ 256x256 分辨率
- ✅ PNG 格式（带透明）
- ✅ 渐变 + 阴影 + 高光
- ✅ 批量生成 < 1 秒/个
- ✅ 文件大小 10-30KB

**立即开始**:

```bash
npm install @napi-rs/canvas
npm run generate -- -g GDD.md -o output -t theme
```

</div>

---

**文档版本**: v2.0  
**最后更新**: 2026-03-27  
**维护者**: Kids Game Team  
**技术支持**: @napi-rs/canvas
