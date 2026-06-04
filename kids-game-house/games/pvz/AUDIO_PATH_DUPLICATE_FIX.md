# 音频路径重复问题修复

## 🐛 问题描述

点击音频编辑按钮时,控制台显示:
```
[AudioEditor] 加载音频: {
  key: 'bgMusic', 
  path: '/themes/pvz/themes/pvz/assets/audio/bgMusic.wav',  // ❌ 路径重复!
  fullUrl: 'http://localhost:3000/themes/pvz/themes/pvz/assets/audio/bgMusic.wav',
  filename: 'bgMusic.wav'
}
[AudioEditor] Content-Type: text/html  // ❌ 返回的是HTML,不是音频
[AudioEditor] 文件大小: 6924 bytes     // ❌ 文件太小
```

## 🔍 根本原因

### 路径重复拼接

**GTRS.json 中的配置:**
```json
{
  "audio": {
    "bgm": {
      "bgMusic": {
        "src": "/themes/pvz/assets/audio/bgMusic.mp3"  // ✅ 已经是完整路径
      }
    }
  }
}
```

**错误的代码逻辑:**
```javascript
const THEME_BASE = '/themes/pvz';

// ❌ 错误: 重复添加 THEME_BASE
path: `${THEME_BASE}${config.src}`
// 结果: '/themes/pvz' + '/themes/pvz/assets/audio/bgMusic.mp3'
//      = '/themes/pvz/themes/pvz/assets/audio/bgMusic.mp3'  // 重复!
```

### 为什么返回HTML?

当请求 `/themes/pvz/themes/pvz/assets/audio/bgMusic.mp3` 时:
1. Vite找不到这个文件(路径错误)
2. 返回SPA的 `index.html` (fallback)
3. Content-Type是 `text/html`
4. 文件大小约6-7KB (HTML页面大小)
5. 尝试解码HTML为音频 → **EncodingError**

## ✅ 解决方案

### 修改 loadAudioFromGTRS() 函数

**位置**: `public/resource-manager.html` 第2610-2645行

**修改前:**
```javascript
path: `${THEME_BASE}${config.src}`  // ❌ 重复拼接
```

**修改后:**
```javascript
path: config.src  // ✅ GTRS中已经是完整路径
```

### 完整的修复代码

```javascript
// 处理 BGM
if (audioConfig.bgm) {
  Object.entries(audioConfig.bgm).forEach(([key, config]) => {
    const filename = config.src.split('/').pop();
    audioList.push({
      key: key,
      alias: config.alias || key,
      file: filename,
      path: config.src  // ✅ 直接使用,不添加 THEME_BASE
    });
  });
}

// 处理音效
if (audioConfig.effect) {
  Object.entries(audioConfig.effect).forEach(([key, config]) => {
    const filename = config.src.split('/').pop();
    audioList.push({
      key: key,
      alias: config.alias || key,
      file: filename,
      path: config.src  // ✅ 直接使用
    });
  });
}

// 处理语音
if (audioConfig.voice) {
  Object.entries(audioConfig.voice).forEach(([key, config]) => {
    const filename = config.src.split('/').pop();
    audioList.push({
      key: key,
      alias: config.alias || key,
      file: filename,
      path: config.src  // ✅ 直接使用
    });
  });
}
```

## 🎯 验证步骤

### 1. 刷新页面
按 **Ctrl+F5** 硬刷新

### 2. 打开控制台
按 **F12**,切换到 Console 标签

### 3. 测试音频编辑
点击任意音频的 "✏️" 编辑按钮

**应该看到正确的日志:**
```
[AudioEditor] 加载音频: {
  key: 'bgMusic',
  path: '/themes/pvz/assets/audio/bgMusic.mp3',  // ✅ 正确路径
  fullUrl: 'http://localhost:3000/themes/pvz/assets/audio/bgMusic.mp3',
  filename: 'bgMusic.mp3'
}
[AudioEditor] 开始 fetch: http://localhost:3000/themes/pvz/assets/audio/bgMusic.mp3
[AudioEditor] 响应状态: 200 OK
[AudioEditor] Content-Type: audio/mpeg  // ✅ 正确的MIME类型
[AudioEditor] 文件大小: 346076 bytes    // ✅ 正常大小(338KB)
[AudioEditor] 解码成功: {
  duration: 30.0,
  sampleRate: 48000,
  channels: 1
}
```

### 4. 验证编辑器
音频编辑器应该正常打开:
- ✅ 波形图显示
- ✅ 时长正确
- ✅ 所有工具可用

## 📝 GTRS.json 路径规范

### 正确的路径格式

GTRS.json 中的所有资源路径都应该是**相对于网站根目录的绝对路径**:

```json
{
  "resources": {
    "images": {
      "scene": {
        "grass": {
          "src": "/themes/pvz/assets/scene/grass_tile.png"  // ✅ 以 / 开头
        }
      }
    },
    "audio": {
      "bgm": {
        "bgMusic": {
          "src": "/themes/pvz/assets/audio/bgMusic.mp3"  // ✅ 以 / 开头
        }
      }
    }
  }
}
```

### 错误的路径格式

```json
{
  "audio": {
    "bgm": {
      "bgMusic": {
        "src": "assets/audio/bgMusic.mp3",           // ❌ 相对路径
        "src": "./assets/audio/bgMusic.mp3",         // ❌ 相对路径
        "src": "themes/pvz/assets/audio/bgMusic.mp3" // ❌ 缺少开头的 /
      }
    }
  }
}
```

## 💡 设计原则

### 为什么 GTRS 使用完整路径?

1. **灵活性**: 可以在任何上下文中使用
2. **一致性**: 所有资源路径格式统一
3. **避免歧义**: 不需要知道当前的基础路径
4. **便于缓存**: 完整路径更容易被浏览器缓存

### THEME_BASE 的作用

`THEME_BASE` 主要用于:
- 构建资源管理器的UI路径
- 图片预览的URL拼接
- **不应该**用于GTRS.json中已包含完整路径的资源

## 🔧 相关修复

本次修复涉及的文件:
- ✅ `public/resource-manager.html` - 修复路径拼接逻辑
- ✅ `public/resource-manager.html` - 增强错误诊断日志

## ⚠️ 注意事项

1. **不要混用路径格式**
   - GTRS.json: 使用完整绝对路径 (`/themes/...`)
   - 其他配置: 根据具体情况决定

2. **检查所有资源类型**
   - 图片
   - 音频
   - JSON配置
   - 确保路径格式一致

3. **测试所有功能**
   - 音频播放
   - 音频编辑
   - 图片预览
   - 确保都能正常工作

## 📄 相关文档

- [AUDIO_EDITOR_LOAD_FIX.md](./AUDIO_EDITOR_LOAD_FIX.md) - 音频编辑器加载错误修复
- [WAV_TO_MP3_CONVERSION.md](./WAV_TO_MP3_CONVERSION.md) - WAV转MP3转换报告
- [AUDIO_REPLACE_GUIDE.md](./AUDIO_REPLACE_GUIDE.md) - 音频替换功能说明

---

**修复日期**: 2026-04-16  
**影响文件**: `public/resource-manager.html`  
**需要重启**: ❌ 否 (只需刷新浏览器)  
**状态**: ✅ 已完成
