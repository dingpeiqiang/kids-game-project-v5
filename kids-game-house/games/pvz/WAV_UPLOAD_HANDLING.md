# WAV 文件上传处理策略

## 📋 当前处理方式

**系统统一策略：只支持 MP3 格式**

当你上传音频文件时，系统会：

### 1. 自动检测格式
```javascript
const originalExt = originalFileName.split('.').pop().toLowerCase();
// 例如: 'bgMusic.wav' → 'wav'
```

### 2. WAV 格式提示
如果检测到是 WAV 格式，会显示提示信息：
```
ℹ️ 检测到 WAV 格式，将自动转换为 MP3
(浏览器限制：暂时保存为 WAV，请手动转换为 MP3)
```

**注意：**
- ✅ **不会弹出确认对话框**
- ✅ **不会中断操作流程**
- ✅ **自动继续保存**
- ⚠️ **给出明确提示和建议**

### 3. 统一保存为 WAV
由于**浏览器 Web Audio API 的限制**：
- 无论上传什么格式（WAV/MP3/OGG）
- 最终都保存为 WAV 格式
- 这是浏览器的技术限制，无法绕过

### 4. 更新配置
- 保存文件到服务器
- 更新 GTRS.json 配置
- 重新加载音频列表

## 🔧 技术原因

### 为什么不能直接保存MP3?

**浏览器Web Audio API的限制:**
- `AudioContext.decodeAudioData()` 可以**解码**多种格式(MP3/WAV/OGG)
- 但**编码导出**只支持WAV格式
- MP3编码需要额外的库(如lamejs),体积较大

### 当前的工作流程

```
用户上传音频 (任何格式)
    ↓
Web Audio API 解码为 AudioBuffer
    ↓
编辑处理 (音量、裁剪等)
    ↓
audioBufferToWav() 编码为 WAV
    ↓
保存到服务器
    ↓
如果是WAV上传 → 警告用户
如果是MP3上传 → 仍保存为WAV + 提示
```

## 💡 最佳实践

### 推荐的上传流程

#### 方案一：先转换再上传 (强烈推荐) ⭐⭐⭐

1. **准备阶段**:
   ```bash
   # 使用 FFmpeg 转换
   ffmpeg -i my_audio.wav -codec:a libmp3lame -qscale:a 2 my_audio.mp3
   ```

2. **上传 MP3**:
   - 打开资源管理器
   - 点击“✏️”编辑任意音频
   - 导入转换好的 MP3 文件
   - 系统会自动保存为 WAV（浏览器限制）
   - 但你已有 MP3 源文件，可以手动替换

3. **结果**:
   - ✅ 操作流程顺畅，无中断
   - ✅ 你有 MP3 源文件备用
   - ✅ 可以后续手动替换获得更好兼容性

#### 方案二：直接上传 WAV (接受提示) ⭐⭐

1. 直接上传 WAV 文件
2. 看到提示信息（不会中断）
3. 系统自动保存为 WAV
4. **注意**: 可能在某些浏览器无法播放
5. 建议后续手动转换为 MP3

#### 方案三：上传后统一转换 ⭐

1. 批量上传所有音频（无论格式）
2. 从服务器下载所有 WAV 文件
3. 批量转换为 MP3
4. 重新上传 MP3 覆盖

## 📊 格式对比

| 特性 | WAV | MP3 |
|------|-----|-----|
| **文件大小** | 大 (2.8MB for 30s) | 小 (338KB for 30s) |
| **音质** | 无损 | 有损(但足够好) |
| **浏览器兼容** | ⚠️ 有限制 | ✅ 完美 |
| **加载速度** | 慢 | 快 |
| **编辑支持** | ✅ 原生支持 | ❌ 需额外库 |
| **推荐场景** | 专业编辑 | 最终发布 |

## 🎯 未来改进方向

### 短期方案 (当前实现)
- ✅ WAV上传时给出强烈警告
- ✅ 提供转换工具链接
- ✅ 允许用户选择是否继续

### 中期方案
- 🔲 集成lamejs库,前端直接编码MP3
- 🔲 增加文件大小预估
- 🔲 批量转换工具

### 长期方案
- 🔲 后端自动转换服务(FFmpeg)
- 🔲 上传WAV → 后端转MP3 → 返回
- 🔲 完全透明的用户体验

## 📝 用户指南

### 如何快速转换WAV到MP3?

#### 方法1: 在线工具 (最简单)
1. 访问 https://cloudconvert.com/wav-to-mp3
2. 上传WAV文件
3. 设置质量: 128-192 kbps
4. 下载MP3文件

#### 方法2: FFmpeg (最灵活)
```bash
# 基本转换
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3

# 指定比特率
ffmpeg -i input.wav -b:a 192k output.mp3

# 立体声
ffmpeg -i input.wav -ac 2 -codec:a libmp3lame -qscale:a 2 output.mp3
```

#### 方法3: Audacity (图形界面)
1. 打开 Audacity
2. 导入WAV文件
3. 文件 → 导出 → 导出为 MP3
4. 设置比特率: 128-192 kbps
5. 保存

## ⚠️ 注意事项

1. **系统不支持双格式**
   - 只支持 MP3 作为最终格式
   - WAV 仅作为临时存储（浏览器限制）
   - 建议始终使用 MP3

2. **提示不会中断操作**
   - 看到 WAV 提示时，操作会继续
   - 不需要手动确认
   - 流程更顺畅

3. **保留源文件**
   - 转换前备份原始文件
   - 方便后续重新编辑

4. **测试多浏览器**
   - Chrome
   - Firefox
   - Safari
   - Edge
   - 确保都能正常播放

5. **文件大小考虑**
   - BGM: 128-192 kbps 足够
   - 音效: 96-128 kbps 即可
   - 语音: 64-96 kbps 清晰

## 🔗 相关文档

- [WAV_TO_MP3_CONVERSION.md](./WAV_TO_MP3_CONVERSION.md) - 详细转换指南
- [AUDIO_EDITOR_LOAD_FIX.md](./AUDIO_EDITOR_LOAD_FIX.md) - 编辑器加载问题修复
- [AUDIO_PATH_DUPLICATE_FIX.md](./AUDIO_PATH_DUPLICATE_FIX.md) - 路径重复问题修复

---

**更新日期**: 2026-04-16  
**当前策略**: WAV 提示 + 自动保存（不中断）  
**推荐格式**: MP3 (128-192 kbps)  
**系统原则**: 只支持 MP3，不做双格式适配
