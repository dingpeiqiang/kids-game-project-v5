# App 图标设计计划

## 一、项目现状分析

### 1.1 项目概述
- **项目名称**：儿童游戏乐园 (kids-game-simple)
- **平台**：Capacitor + Vue 3 + TypeScript
- **目标平台**：Android（已有）、iOS（待配置）

### 1.2 当前图标状态

| 平台 | 状态 | 图标文件位置 |
|------|------|-------------|
| Android | 已配置 | `android/app/src/main/res/mipmap-*/` |
| iOS | 未配置 | 暂无 |
| Web | 未配置 | 暂无 |

### 1.3 Android 现有图标结构

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png          (48x48)
│   ├── ic_launcher_foreground.png
│   └── ic_launcher_round.png
├── mipmap-hdpi/
│   ├── ic_launcher.png          (72x72)
│   ├── ic_launcher_foreground.png
│   └── ic_launcher_round.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png          (96x96)
│   ├── ic_launcher_foreground.png
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png          (144x144)
│   ├── ic_launcher_foreground.png
│   └── ic_launcher_round.png
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png          (192x192)
│   ├── ic_launcher_foreground.png
│   └── ic_launcher_round.png
└── mipmap-anydpi-v26/
    ├── ic_launcher.xml
    └── ic_launcher_round.xml
```

---

## 二、图标设计规范

### 2.1 设计风格要求

| 维度 | 要求 |
|------|------|
| **风格** | 卡通、活泼、童趣 |
| **色彩** | 明亮、鲜艳、温暖 |
| **主题** | 游戏、欢乐、儿童友好 |
| **图形** | 简洁、易于识别、无复杂细节 |

### 2.2 图标规格

#### Android 图标规格

| 密度 | 尺寸 (px) | 目录 |
|------|-----------|------|
| MDPI | 48 × 48 | mipmap-mdpi |
| HDPI | 72 × 72 | mipmap-hdpi |
| XHDPI | 96 × 96 | mipmap-xhdpi |
| XXHDPI | 144 × 144 | mipmap-xxhdpi |
| XXXHDPI | 192 × 192 | mipmap-xxxhdpi |

#### iOS 图标规格

| 图标类型 | 尺寸 (px) | 用途 |
|----------|-----------|------|
| App Icon 2x | 120 × 120 | iPhone/iPad 主屏幕 |
| App Icon 3x | 180 × 180 | iPhone 主屏幕 (Retina HD) |
| App Icon (iPad) | 76 × 76 | iPad 主屏幕 |
| App Icon (iPad Pro) | 167 × 167 | iPad Pro 主屏幕 |
| App Store | 1024 × 1024 | App Store 展示 |

#### Web 图标规格

| 类型 | 尺寸 (px) | 用途 |
|------|-----------|------|
| favicon.ico | 16 × 16, 32 × 32 | 浏览器标签 |
| touch-icon | 192 × 192 | Android 主屏幕 |
| apple-touch-icon | 180 × 180 | iOS 主屏幕 |

---

## 三、实施计划

### 3.1 任务分解

| 阶段 | 任务 | 负责人 | 状态 |
|------|------|--------|------|
| 设计 | 设计主图标 SVG 源文件 | 设计师 | 待开始 |
| 导出 | 导出各平台所需尺寸 | 设计师 | 待开始 |
| Android | 更新 Android 图标资源 | 开发 | 待开始 |
| iOS | 创建 iOS 图标资源 | 开发 | 待开始 |
| Web | 更新 Web 图标（favicon） | 开发 | 待开始 |
| 验证 | 验证各平台图标显示 | 测试 | 待开始 |

### 3.2 详细步骤

#### 步骤 1：设计主图标（SVG 源文件）
- 创建 1024 × 1024 px 的 SVG 源文件
- 遵循 Material Design 图标规范（安全区域 8%）
- 保持设计简洁，避免过于复杂的细节

#### 步骤 2：导出各尺寸图标
- 使用图标导出工具（如 Figma、Sketch、Icon Kitchen）
- 导出 Android 5 种密度的 PNG 图标
- 导出 iOS 多种尺寸的 PNG 图标
- 导出 Web 图标（favicon.ico, touch-icon.png）

#### 步骤 3：更新 Android 图标
```bash
# 替换现有图标文件
cp ic_launcher-mdpi.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp ic_launcher-hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp ic_launcher-xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp ic_launcher-xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp ic_launcher-xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

#### 步骤 4：创建 iOS 图标
- 创建 `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 目录
- 添加各尺寸图标文件
- 创建 `Contents.json` 配置文件

#### 步骤 5：更新 Web 图标
- 更新 `public/favicon.ico`
- 更新 `public/index.html` 中的图标引用

---

## 四、图标配置文件示例

### 4.1 Android ic_launcher.xml

```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground_custom"/>
</adaptive-icon>
```

### 4.2 iOS Contents.json

```json
{
  "images" : [
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-60@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-60@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "Icon-76@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "1024x1024",
      "idiom" : "ios-marketing",
      "filename" : "Icon-1024.png",
      "scale" : "1x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "capacitor"
  }
}
```

### 4.3 index.html 图标引用

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
```

---

## 五、注意事项

1. **安全区域**：Android 自适应图标需要保持中心区域 68% 的安全区域
2. **圆角**：Android 10+ 使用系统自动圆角，设计时无需添加圆角
3. **背景**：确保图标在不同背景色上都能清晰显示
4. **一致性**：保持各平台图标的视觉一致性
5. **测试**：在实际设备上验证图标显示效果

---

## 六、交付物清单

| 交付物 | 描述 | 状态 |
|--------|------|------|
| 主图标 SVG | 1024 × 1024 px 源文件 | 待交付 |
| Android 图标包 | 5 种密度的 PNG 文件 | 待交付 |
| iOS 图标包 | 多种尺寸的 PNG 文件 | 待交付 |
| Web 图标包 | favicon.ico 及相关 PNG | 待交付 |
| 更新后的项目文件 | 各平台配置更新 | 待完成 |