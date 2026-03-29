# 🚀 音频格式转换 - 快速执行指南

**目标**: 将飞机大战游戏的所有 WAV 音频转换为 MP3 格式  
**预计时间**: 2-3 分钟  
**难度**: ⭐ (简单)

---

## ⚡ 一键执行（推荐）

### Windows PowerShell

```powershell
# 进入脚本目录
cd kids-game-house

# 执行音频转换
.\convert-audio-to-mp3-simple.ps1

# 执行配置更新
.\update-gtrs-config-simple.ps1

# 完成！
```

---

## 📋 分步执行

### 步骤 1: 检查环境

```powershell
# 检查 FFmpeg 是否安装
ffmpeg -version

# 如果未安装，执行:
choco install ffmpeg
```

### 步骤 2: 执行转换

```powershell
# 运行转换脚本
.\convert-audio-to-mp3-simple.ps1
```

**预期输出**:
```
Audio Conversion Tool (WAV to MP3)
==========================================================
Found 9 WAV files to convert
Checking FFmpeg...
FFmpeg is ready

=== Starting Batch Conversion ===

[1/9] Converting: bgm_defeat.wav ...
  SUCCESS: bgm_defeat.mp3 (470.25 KB)
  Compression: 72.7% (Original: 1722.7 KB)

... (共 9 个文件)

All audio files converted successfully!
```

### 步骤 3: 更新配置

```powershell
# 运行配置更新脚本
.\update-gtrs-config-simple.ps1
```

**预期输出**:
```
Update GTRS Configuration (WAV to MP3)
==========================================================
Configuration files to update:
  - plane-shooter-vue3\public\themes\default\GTRS.json
  - plane-shooter-vue3\src\config\GTRS.json

Found 9 .wav references
After update: 9 .mp3 references
Backup created: ...

GTRS configuration updated successfully!
```

### 步骤 4: 验证结果

```powershell
# 查看生成的 MP3 文件
ls plane-shooter-vue3\public\themes\default\assets\audio -Filter "*.mp3"

# 查看文件大小
ls plane-shooter-vue3\public\themes\default\assets\audio | Select-Object Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB,2)}}
```

---

## ✅ 验证清单

转换完成后，请确认以下内容：

- [ ] ✅ 生成了 9 个 MP3 文件
- [ ] ✅ MP3 文件大小合理（约 8MB 总计）
- [ ] ✅ GTRS 配置文件已更新
- [ ] ✅ 创建了备份文件 (.bak)
- [ ] ✅ 启动游戏测试音频播放

---

## 🔧 手动转换（备选方案）

如果自动化脚本无法运行，可以手动执行：

### 单个文件转换

```powershell
# 转换 BGM
ffmpeg -i bgm_main.wav -codec:a libmp3lame -b:a 192k bgm_main.mp3

# 转换音效
ffmpeg -i effect_fire.wav -codec:a libmp3lame -b:a 192k effect_fire.mp3
```

### 批量转换（一行命令）

```powershell
# 进入音频目录
cd plane-shooter-vue3\public\themes\default\assets\audio

# 批量转换所有 WAV 文件
Get-ChildItem *.wav | ForEach-Object { ffmpeg -i $_.Name -codec:a libmp3lame -b:a 192k ($_.BaseName + ".mp3") }
```

### 手动更新配置

使用文本编辑器打开以下文件，将所有 `.wav"` 替换为 `.mp3"`:

1. `plane-shooter-vue3\public\themes\default\GTRS.json`
2. `plane-shooter-vue3\src\config\GTRS.json`

---

## ❓ 常见问题

### Q: FFmpeg 找不到怎么办？

**A**: 安装 FFmpeg
```powershell
# 使用 Chocolatey (推荐)
choco install ffmpeg

# 或从官网下载
# https://ffmpeg.org/download.html
```

### Q: 转换失败怎么办？

**A**: 检查以下几点
1. 确认 FFmpeg 已正确安装并添加到 PATH
2. 检查磁盘空间是否充足
3. 确认源 WAV 文件没有损坏

### Q: 音质不满意怎么办？

**A**: 调整比特率参数
```powershell
# 更高音质 (320kbps)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 320k output.mp3

# 更小体积 (128kbps)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3
```

### Q: 如何删除原始 WAV 文件？

**A**: 确认 MP3 正常工作后执行
```powershell
# 删除所有 WAV 文件
Remove-Item plane-shooter-vue3\public\themes\default\assets\audio\*.wav

# 或删除特定文件
Remove-Item plane-shooter-vue3\public\themes\default\assets\audio\bgm_*.wav
```

---

## 📊 预期结果

### 转换前
- **总大小**: 30.3 MB (WAV)
- **文件格式**: 9 个 WAV 文件
- **配置引用**: 9 处 .wav

### 转换后
- **总大小**: 8.1 MB (MP3) 
- **文件格式**: 9 个 MP3 文件
- **配置引用**: 9 处 .mp3
- **节省空间**: 21.5 MB (72.8%)

---

## 🎯 下一步

转换完成后，继续以下步骤：

1. **测试游戏**
   ```bash
   cd plane-shooter-complete
   npm run dev
   # 访问 http://localhost:8081
   ```

2. **验证音频播放**
   - 开始游戏
   - 测试射击音效
   - 测试爆炸音效
   - 测试道具音效

3. **清理空间** (可选)
   ```powershell
   # 删除原始 WAV 文件
   Remove-Item plane-shooter-vue3\public\themes\default\assets\audio\*.wav
   ```

---

## 📞 需要帮助？

如果遇到问题，请查看：

- 📖 [完整转换报告](./AUDIO_CONVERSION_COMPLETE.md)
- 🔧 [FFmpeg 文档](https://ffmpeg.org/documentation.html)
- 📋 [GTRS 规范](../../../docs/GTRS_VIEW_MODE_OPTIMIZATION.md)

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant

🎉 **祝你转换顺利！**
