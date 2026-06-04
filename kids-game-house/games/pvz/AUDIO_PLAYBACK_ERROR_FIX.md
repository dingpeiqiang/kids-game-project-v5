# 音频播放错误排查指南

## 🐛 错误信息

```
加载音频失败: EncodingError: Unable to decode audio data
```

## 🔍 可能原因

### 1. WAV 文件格式问题 (最常见)
浏览器对WAV格式的编码要求很严格,某些WAV文件可能:
- 使用了不支持的采样率
- 使用了不支持的位深度
- 文件头损坏
- 编码格式不标准

### 2. 文件路径错误
- 音频文件不存在
- 路径大小写不匹配
- 相对路径/绝对路径问题

### 3. 跨域问题 (CORS)
- 从不同域名加载音频
- Vite开发服务器配置问题

### 4. 浏览器兼容性
- 某些浏览器不支持特定音频格式
- 浏览器版本过旧

## ✅ 解决方案

### 方案一:转换为 MP3 格式 (推荐)

MP3格式兼容性更好,文件体积更小。

#### 使用在线工具:
1. 访问 https://cloudconvert.com/wav-to-mp3
2. 上传WAV文件
3. 转换为MP3
4. 下载并替换

#### 使用 FFmpeg (命令行):
```bash
ffmpeg -i bgMusic.wav -codec:a libmp3lame -qscale:a 2 bgMusic.mp3
```

然后在资源管理器中重新应用到游戏,选择MP3格式。

### 方案二:重新导出 WAV 文件

使用音频编辑软件(如 Audacity)重新导出:
1. 打开 Audacity
2. 导入WAV文件
3. 文件 → 导出 → 导出为 WAV
4. 选择格式: **WAV (Microsoft) signed 16-bit PCM**
5. 采样率: **44100 Hz** 或 **48000 Hz**
6. 保存并替换

### 方案三:检查文件完整性

在PowerShell中检查文件:
```powershell
# 检查文件大小
Get-Item public\themes\pvz\assets\audio\bgMusic.wav | Select-Object Length

# 如果文件大小为0或异常小,说明文件损坏
# 正常应该在几百KB到几MB之间
```

### 方案四:使用浏览器开发者工具调试

1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 点击播放按钮
4. 查看详细的错误信息:
   ```
   [AudioPlayer] 尝试播放: { key: 'bgMusic', path: '/themes/pvz/assets/audio/bgMusic.wav' }
   [AudioPlayer] 加载失败: { errorCode: 3, errorMessage: '...' }
   ```

错误代码含义:
- **1**: 音频加载中止
- **2**: 网络错误
- **3**: 解码失败 (文件格式问题) ⭐ 最常见
- **4**: 格式不支持

## 🔧 在资源管理器中的改进

### 已添加的功能

1. **详细错误提示**
   - 显示具体的错误代码
   - 显示文件路径
   - 提供友好的错误消息

2. **WAV格式警告**
   - 替换为WAV时会给出警告
   - 建议转换为MP3格式

3. **控制台日志**
   - 记录播放尝试
   - 记录加载成功/失败
   - 方便调试

### 查看日志

打开浏览器控制台 (F12),会看到:
```javascript
[AudioPlayer] 尝试播放: { key: 'bgMusic', path: '/themes/pvz/assets/audio/bgMusic.wav' }
[AudioPlayer] 加载失败: {
  key: 'bgMusic',
  path: '/themes/pvz/assets/audio/bgMusic.wav',
  errorCode: 3,
  errorMessage: 'Unable to decode audio data'
}
```

## 💡 最佳实践

### 推荐的音频格式

| 用途 | 推荐格式 | 采样率 | 位深度 | 说明 |
|------|---------|--------|--------|------|
| BGM | MP3 | 44100Hz | - | 体积小,兼容性好 |
| 音效 | MP3 | 44100Hz | - | 延迟低,体积小 |
| 语音 | MP3 | 22050Hz | - | 人声清晰即可 |

### 音频参数建议

```
MP3 格式:
- 比特率: 128kbps (BGM) / 192kbps (高质量)
- 采样率: 44100 Hz
- 声道: Stereo (立体声)

WAV 格式 (如果必须使用):
- 编码: PCM (未压缩)
- 位深度: 16-bit
- 采样率: 44100 Hz 或 48000 Hz
- 声道: Mono 或 Stereo
```

## 🚀 快速修复步骤

如果你遇到 `EncodingError`:

1. **确认文件格式**
   ```powershell
   Get-Item public\themes\pvz\assets\audio\*.wav | Select-Object Name, Length
   ```

2. **转换为 MP3**
   - 使用在线工具或FFmpeg
   - 或者用Audacity重新导出

3. **重新上传**
   - 打开资源管理器
   - 编辑音频
   - 上传新的MP3文件
   - 应用到游戏

4. **验证**
   - 刷新页面
   - 点击播放按钮
   - 应该能正常播放

## 📝 技术细节

### HTML5 Audio 支持的格式

| 浏览器 | MP3 | WAV | OGG | AAC |
|--------|-----|-----|-----|-----|
| Chrome | ✅ | ✅* | ✅ | ✅ |
| Firefox | ✅ | ✅* | ✅ | ❌ |
| Safari | ✅ | ✅* | ❌ | ✅ |
| Edge | ✅ | ✅* | ✅ | ✅ |

\* WAV支持取决于编码格式,必须是PCM编码

### Phaser 音频系统

PVZ游戏使用Phaser 3,它有更强大的音频处理:
- 自动处理格式兼容性
- Web Audio API 降级到 HTML5 Audio
- 更好的错误处理

但资源管理器是独立的HTML页面,不使用Phaser,所以需要手动处理兼容性。

## ⚠️ 注意事项

1. **不要直接修改文件扩展名**
   - `.wav` 改名为 `.mp3` 不会转换格式
   - 必须使用工具真正转换

2. **备份原文件**
   - 转换前备份原始WAV文件
   - 以防需要回退

3. **测试多个浏览器**
   - Chrome
   - Firefox
   - Edge
   - 确保兼容性

## 🔗 相关资源

- [MDN: HTMLMediaElement.error](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/error)
- [Can I Use: Audio formats](https://caniuse.com/?search=audio%20format)
- [FFmpeg 下载](https://ffmpeg.org/download.html)
- [Audacity 下载](https://www.audacityteam.org/)

---

**最后更新**: 2026-04-16  
**影响文件**: `public/resource-manager.html`  
**需要重启**: ❌ 否 (只需刷新浏览器)
