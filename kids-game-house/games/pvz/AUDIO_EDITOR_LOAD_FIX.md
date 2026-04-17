# 音频编辑器加载错误修复

## 🐛 问题描述

点击音频的"✏️ 编辑"按钮时出现错误:
```
加载音频失败: EncodingError: Unable to decode audio data
```

## 🔍 原因分析

### 1. GTRS.json 缓存问题
浏览器缓存了旧的GTRS.json,仍然指向WAV文件,但我们已经转换为MP3了。

### 2. 文件名硬编码
`loadAudioForEdit()` 函数中硬编码了 `.wav` 扩展名:
```javascript
AudioEditor.originalFileName = key + '.wav';  // ❌ 错误
```

即使GTRS.json指向MP3文件,这个函数仍然尝试以WAV格式处理。

### 3. 缺少详细错误信息
原来的错误处理不够详细,无法快速定位问题。

## ✅ 解决方案

### 1. 禁用 GTRS.json 缓存

在 `loadAudioFromGTRS()` 函数中添加时间戳:

```javascript
// 添加时间戳避免缓存
const gtrsPath = `${THEME_BASE}/GTRS.json?t=${Date.now()}`;
const response = await fetch(gtrsPath);
```

这样每次加载都会获取最新的GTRS.json配置。

### 2. 动态提取文件名

修改 `loadAudioForEdit()` 函数,从路径中动态提取实际的文件名:

```javascript
// 从路径中提取实际的文件名和扩展名
const actualFilename = path.split('/').pop();
AudioEditor.originalFileName = actualFilename;
```

现在无论是什么格式(MP3/WAV/OGG),都能正确处理。

### 3. 增强错误处理

添加了详细的日志和错误提示:

```javascript
console.log('[AudioEditor] 加载音频:', { key, path, fullUrl, filename: actualFilename });
console.log('[AudioEditor] 文件大小:', arrayBuffer.byteLength, 'bytes');

try {
  audioBuffer = await ac.decodeAudioData(arrayBuffer);
  console.log('[AudioEditor] 解码成功:', {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels
  });
} catch (decodeError) {
  console.error('[AudioEditor] 解码失败:', decodeError);
  throw new Error(`音频解码失败: ${decodeError.message}\n\n可能原因:\n1. 文件格式不支持\n2. 文件损坏\n3. 建议转换为 MP3 格式`);
}
```

## 📋 修改内容

### 文件: `public/resource-manager.html`

#### 1. loadAudioFromGTRS() - 第2627行
```diff
 async function loadAudioFromGTRS() {
   try {
+    // 添加时间戳避免缓存
+    const gtrsPath = `${THEME_BASE}/GTRS.json?t=${Date.now()}`;
+    const response = await fetch(gtrsPath);
-    const response = await fetch(`${THEME_BASE}/GTRS.json`);
```

#### 2. loadAudioForEdit() - 第5117行
```diff
 async function loadAudioForEdit(key, path) {
   try {
     AudioEditor.currentAudioKey = key;
-    AudioEditor.originalFileName = key + '.wav';
+    
+    // 从路径中提取实际的文件名和扩展名
+    const actualFilename = path.split('/').pop();
+    AudioEditor.originalFileName = actualFilename;

     const fullUrl = path.startsWith('http') ? path : baseUrl + path;
+    console.log('[AudioEditor] 加载音频:', { key, path, fullUrl, filename: actualFilename });

     const response = await fetch(fullUrl);
-    if (!response.ok) throw new Error('无法加载音频文件');
+    if (!response.ok) throw new Error(`无法加载音频文件: ${response.status} ${response.statusText}`);

     const arrayBuffer = await response.arrayBuffer();
+    console.log('[AudioEditor] 文件大小:', arrayBuffer.byteLength, 'bytes');

+    try {
       audioBuffer = await ac.decodeAudioData(arrayBuffer);
+      console.log('[AudioEditor] 解码成功:', { ... });
+    } catch (decodeError) {
+      console.error('[AudioEditor] 解码失败:', decodeError);
+      throw new Error(`音频解码失败: ...\n\n可能原因:...`);
+    }

-    document.getElementById('aeFileName').textContent = key + '.wav';
+    document.getElementById('aeFileName').textContent = actualFilename;
-    showToast('已加载: ' + key);
+    showToast('已加载: ' + actualFilename);
```

## 🚀 测试步骤

### 1. 硬刷新页面
按 **Ctrl+Shift+R** 或 **Ctrl+F5** 强制刷新,清除所有缓存。

### 2. 打开控制台
按 **F12** 打开开发者工具,切换到 Console 标签。

### 3. 测试音频编辑
1. 在资源管理器中找到 "bgMusic" (背景音乐)
2. 点击 "✏️" 编辑按钮
3. 查看控制台输出:

**成功的日志:**
```
[AudioEditor] 加载音频: {
  key: 'bgMusic',
  path: '/themes/pvz/assets/audio/bgMusic.mp3',
  fullUrl: 'http://localhost:3000/themes/pvz/assets/audio/bgMusic.mp3',
  filename: 'bgMusic.mp3'
}
[AudioEditor] 文件大小: 346076 bytes
[AudioEditor] 解码成功: {
  duration: 30.0,
  sampleRate: 48000,
  channels: 1
}
```

**如果仍然失败:**
```
[AudioEditor] 加载音频: { ... }
[AudioEditor] 文件大小: XXXX bytes
[AudioEditor] 解码失败: EncodingError: Unable to decode audio data
```

这说明文件本身有问题,需要重新转换。

### 4. 验证编辑器界面
应该看到:
- ✅ 文件名显示: `bgMusic.mp3`
- ✅ 波形图正常显示
- ✅ 时长正确 (30秒)
- ✅ 所有编辑工具可用

## 💡 调试技巧

### 检查 GTRS.json 是否更新

在浏览器控制台执行:
```javascript
fetch('/themes/pvz/GTRS.json?' + Date.now())
  .then(r => r.json())
  .then(d => console.log(d.resources.audio.bgm))
```

应该看到:
```json
{
  "bgMusic": {
    "alias": "bgMusic",
    "src": "/themes/pvz/assets/audio/bgMusic.mp3",
    "type": "mp3"
  }
}
```

### 检查文件是否存在

在浏览器地址栏访问:
```
http://localhost:3000/themes/pvz/assets/audio/bgMusic.mp3
```

应该能下载MP3文件。

### 手动测试解码

在控制台执行:
```javascript
fetch('/themes/pvz/assets/audio/bgMusic.mp3')
  .then(r => r.arrayBuffer())
  .then(buf => {
    const ac = new AudioContext();
    return ac.decodeAudioData(buf);
  })
  .then(buffer => console.log('解码成功:', buffer.duration, '秒'))
  .catch(err => console.error('解码失败:', err));
```

## ⚠️ 常见问题

### Q1: 仍然显示 WAV 相关错误?
**A**: 浏览器缓存了旧的JavaScript代码。
- 按 Ctrl+Shift+Delete 清除缓存
- 或使用无痕模式测试

### Q2: 文件加载成功但解码失败?
**A**: 文件可能损坏或格式不支持。
- 检查文件大小是否正常
- 重新用FFmpeg转换
- 尝试其他MP3文件测试

### Q3: 控制台显示 404 错误?
**A**: 文件路径不正确。
- 检查GTRS.json中的src路径
- 确认文件确实存在于该位置
- 检查Vite开发服务器是否正常运行

## 📝 相关文件

- [WAV_TO_MP3_CONVERSION.md](./WAV_TO_MP3_CONVERSION.md) - WAV转MP3详细说明
- [AUDIO_PLAYBACK_ERROR_FIX.md](./AUDIO_PLAYBACK_ERROR_FIX.md) - 音频播放错误排查
- [AUDIO_REPLACE_GUIDE.md](./AUDIO_REPLACE_GUIDE.md) - 音频替换功能说明

---

**修复日期**: 2026-04-16  
**影响文件**: `public/resource-manager.html`  
**需要重启**: ❌ 否 (只需刷新浏览器)  
**状态**: ✅ 已完成
