# 🔍 背景断层问题 - 诊断总结

## ❌ 问题确认

**是的，是背景图片尺寸的问题！**

---

## 🎯 根本原因

### 关键错误

```typescript
// ❌ 修复前：使用屏幕高度（错误！）
const screenH = 932  // 用户屏幕高度（动态变化）

bg2.y = -screenH     // ❌ 错误：-932
y: screenH           // ❌ 错误：滚动 932px
if (y >= screenH)    // ❌ 错误：932px 时交换

// 但图片高度是 1080px！
// 导致 bg2 没对齐，中间有 932px 的空隙 → 断层！
```

### 问题示意

```
❌ 错误的布局（使用 screenH=932）：
┌─────────┐ y=0
│  bg1    │ 高度 1080
│         │
├─────────┤ y=932 (screenH) ← 屏幕底部
│         │
│         │  ← 这里有空隙！
└─────────┘ y=1080 (图片底部)

┌─────────┐ y=-932 (bg2 顶部)
│  bg2    │ 高度 1080
└─────────┘ y=148 (bg2 底部)

❌ bg2 底部在 y=148，bg1 底部在 y=1080
❌ 相差 932px → 严重断层！
```

---

## ✅ 正确方案

### 使用图片实际高度

```typescript
// ✅ 修复后：使用图片高度（正确！）
const bgHeight = 1080  // 图片实际高度（固定值）

bg2.y = -bgHeight      // ✅ 正确：-1080
y: bgHeight            // ✅ 正确：滚动 1080px
if (y >= bgHeight)     // ✅ 正确：1080px 时交换

// 完美对齐！
```

### 正确的布局

```
✅ 正确的布局（使用 bgHeight=1080）：
┌─────────┐ y=0
│  bg1    │ 高度 1080
│         │
│         │
└─────────┘ y=1080 (图片底部)

┌─────────┐ y=-1080 (bg2 顶部)
│  bg2    │ 高度 1080
│         │
│         │
└─────────┘ y=0 (bg2 底部)

✅ bg2 底部刚好接上 bg1 顶部
✅ 完美无缝衔接！
```

---

## 📊 核心代码对比

### 修复前（❌ 错误）

```typescript
// 创建两张图
const bg1 = this.add.image(0, 0, 'bg_main')
const bg2 = this.add.image(0, -this.screenH, 'bg_main')  // ❌

// 滚动
this.tweens.add({
  targets: [bg1, bg2],
  y: this.screenH,              // ❌
  onUpdate: () => {
    if (bg1.y >= this.screenH)  // ❌
      bg1.y = -this.screenH     // ❌
  }
})
```

### 修复后（✅ 正确）

```typescript
// 获取图片实际高度
const bgTexture = this.textures.get('bg_main')
const bgHeight = bgTexture.getSourceImage().height  // ✅ 1080

// 创建两张图
const bg1 = this.add.image(0, 0, 'bg_main')
const bg2 = this.add.image(0, -bgHeight, 'bg_main')  // ✅

// 滚动
this.tweens.add({
  targets: [bg1, bg2],
  y: bgHeight,                    // ✅
  onUpdate: () => {
    if (bg1.y >= bgHeight)        // ✅
      bg1.y = -bgHeight           // ✅
  }
})
```

---

## 🎯 黄金法则

### 无缝滚动的关键

```
1. 间距 = 图片高度
2. 滚动距离 = 图片高度
3. 交换时机 = 图片高度

永远使用图片的实际尺寸，而不是屏幕尺寸！
```

---

## ✨ 验证方法

刷新浏览器，检查控制台：

**应该看到**：
```javascript
🎨 创建双背景无缝滚动：{
  screenH: 932,
  bgHeight: 1080,
  ratio: 1.159
}
```

**视觉上**：
- ✅ 平滑滚动
- ✅ 无断层
- ✅ 完美循环

---

## 📖 详细文档

查看 [BACKGROUND_DEBUG_ANALYSIS.md](./BACKGROUND_DEBUG_ANALYSIS.md) 了解完整分析。

---

**状态**：✅ 已修复，使用图片实际高度计算！✨
