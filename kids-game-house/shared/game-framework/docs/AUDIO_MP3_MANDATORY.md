# ⚠️ 音频资源强制 MP3 格式规范

**版本**: v1.0.0  
**日期**: 2026-03-27  
**重要性**: 🔴 **强制执行，必须遵守**

---

## 🚨 核心要求

### 所有音频资源必须使用 MP3 格式

```
✅ 背景音乐 (BGM) → MP3, 128kbps, 44.1kHz, 立体声
✅ 音效 (SFX)     → MP3, 64kbps, 44.1kHz, 单声道/立体声
❌ WAV            → 禁止使用（仅可作为中间临时格式）
❌ OGG            → 禁止使用
❌ WEBM           → 禁止使用
❌ AAC/M4A        → 禁止使用
❌ FLAC           → 禁止使用
```

---

## 📋 技术规范

### BGM（背景音乐）参数

| 参数 | 要求 | 说明 |
|------|------|------|
| **格式** | MP3 | ⚠️ 强制 |
| **比特率** | 128 kbps | CBR 或 VBR |
| **采样率** | 44.1 kHz | CD 音质标准 |
| **位深** | 16-bit | 标准数字音频 |
| **声道** | 立体声 (2.0) | 提供沉浸式体验 |
| **最大文件** | < 10 MB | 推荐 3-5 MB |

---

### SFX（音效）参数

| 参数 | 要求 | 说明 |
|------|------|------|
| **格式** | MP3 | ⚠️ 强制 |
| **比特率** | 64 kbps | 短音效可降低到 48kbps |
| **采样率** | 44.1 kHz | 保持统一标准 |
| **位深** | 16-bit | 标准数字音频 |
| **声道** | 单声道/立体声 | 根据音效类型选择 |
| **最大文件** | < 1 MB | 推荐 50-300 KB |

---

## ❌ 为什么禁止其他格式？

### WAV 格式问题

| 问题 | 影响 | 数据对比 |
|------|------|---------|
| **文件体积大** | 加载慢，占用带宽 | WAV: 10MB vs MP3: 1MB (10 倍差距) |
| **无压缩** | 浪费存储空间 | 90% 的存储空间被浪费 |
| **浏览器兼容性** | 部分浏览器不支持 | Safari 对 WAV 支持有限 |

---

### OGG 格式问题

| 问题 | 影响 |
|------|------|
| **浏览器兼容性差** | Safari 完全不支持 OGG |
| **硬件支持少** | 移动设备解码性能差 |
| **专利授权** | 存在专利费用风险 |

---

### WEBM 格式问题

| 问题 | 影响 |
|------|------|
| **兼容性极差** | 仅 Chrome/Firefox 支持 |
| **iOS 不支持** | iPhone/iPad 无法播放 |
| **编码复杂** | 转换时间长 |

---

## ✅ 使用 MP3 的优势

### 1. 完美的浏览器兼容性

```
✅ Chrome      - 完全支持
✅ Firefox     - 完全支持
✅ Safari      - 完全支持（包括 iOS）
✅ Edge        - 完全支持
✅ IE          - 完全支持
```

---

### 2. 优秀的压缩比

```
原始 WAV 文件：10 MB
    ↓ MP3 压缩 (128kbps)
压缩后 MP3 文件：1 MB
    ↓
节省空间：90% ⬇️
```

---

### 3. 快速的加载速度

```
WAV (10MB):  加载时间 ~8-10 秒 (3G 网络)
MP3 (1MB):   加载时间 ~1-2 秒 (3G 网络)
    ↓
速度提升：5-8 倍 ⚡
```

---

### 4. 统一的规范要求

- ✅ 所有游戏使用相同格式
- ✅ 简化资源管理流程
- ✅ 降低兼容性测试成本
- ✅ 提高开发效率

---

## 🛠️ 如何转换音频为 MP3

### 方法 1: FFmpeg 命令行工具

#### 安装 FFmpeg

```bash
# Windows (使用 Chocolatey)
choco install ffmpeg

# macOS (使用 Homebrew)
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt-get install ffmpeg
```

---

#### 单个文件转换

```bash
# WAV 转 MP3 (BGM 质量)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3

# WAV 转 MP3 (SFX 质量)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 64k output.mp3

# 保留元数据
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k -id3v2_version 3 output.mp3
```

---

#### 批量转换脚本

```bash
#!/bin/bash
# convert-all-wav-to-mp3.sh

# 创建输出目录
mkdir -p mp3_output

# 遍历所有 WAV 文件
for wav in *.wav; do
    if [ -f "$wav" ]; then
        # 获取文件名（不含扩展名）
        filename="${wav%.wav}"
        
        # 转换为 MP3
        echo "转换：$wav → ${filename}.mp3"
        ffmpeg -i "$wav" -codec:a libmp3lame -b:a 128k "mp3_output/${filename}.mp3" -y
    fi
done

echo "✅ 批量转换完成！"
```

---

#### 高级参数示例

```bash
# 高质量 BGM (192kbps)
ffmpeg -i bgm.wav -codec:a libmp3lame -b:a 192k -ar 44100 -ac 2 bgm.mp3

# 低质量 SFX (48kbps, 单声道)
ffmpeg -i sfx.wav -codec:a libmp3lame -b:a 48k -ar 44100 -ac 1 sfx.mp3

# 标准化音量 (-1dB)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k -af 'loudnorm=I=-16:TP=-1.5:LRA=11' output.mp3
```

---

### 方法 2: 在线转换工具

#### 推荐工具

1. **Online Audio Converter**
   - URL: https://online-audio-converter.com/cn/
   - 支持批量转换
   - 可调节比特率

2. **Convertio**
   - URL: https://convertio.co/zh/wav-mp3/
   - 云端处理，不占本地资源
   - 支持 Dropbox/Google Drive

3. **FreeConvert**
   - URL: https://www.freeconvert.com/wav-to-mp3
   - 免费，无广告
   - 支持大文件

---

### 方法 3: 桌面软件

#### Audacity（推荐）

**步骤**:
1. 打开 Audacity
2. 导入 WAV 文件 (`File` → `Import` → `Audio`)
3. 导出为 MP3 (`File` → `Export` → `Export as MP3`)
4. 设置比特率：128 kbps (BGM) 或 64 kbps (SFX)
5. 点击保存

---

#### iTunes / Apple Music

**步骤**:
1. 打开 iTunes / Apple Music
2. 偏好设置 → 导入设置
3. 导入使用：MP3 编码器
4. 设置：128 kbps
5. 选中歌曲 → 文件 → 转换 → 创建 MP3 版本

---

### 方法 4: Node.js 批量转换脚本

```javascript
// convert-audio.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const INPUT_DIR = './audio/wav';
const OUTPUT_DIR = './audio/mp3';
const BITRATE = '128k'; // BGM 质量，SFX 可用 64k

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 读取所有 WAV 文件
fs.readdir(INPUT_DIR, (err, files) => {
    const wavFiles = files.filter(f => f.endsWith('.wav'));
    
    console.log(`找到 ${wavFiles.length} 个 WAV 文件，开始转换...`);
    
    let completed = 0;
    
    wavFiles.forEach((file, index) => {
        const inputPath = path.join(INPUT_DIR, file);
        const outputFile = file.replace('.wav', '.mp3');
        const outputPath = path.join(OUTPUT_DIR, outputFile);
        
        const command = `ffmpeg -i "${inputPath}" -codec:a libmp3lame -b:a ${BITRATE} "${outputPath}" -y`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ 转换失败：${file}`, error.message);
                return;
            }
            
            completed++;
            console.log(`✅ [${index + 1}/${wavFiles.length}] ${file} → ${outputFile}`);
            
            if (completed === wavFiles.length) {
                console.log(`\n🎉 全部转换完成！共 ${completed} 个文件`);
            }
        });
    });
});
```

**使用方法**:
```bash
node convert-audio.js
```

---

## 📊 质量检查清单

### 转换后必须检查

- [ ] **文件格式**: 确认为 .mp3 扩展名
- [ ] **比特率**: BGM 128kbps / SFX 64kbps
- [ ] **采样率**: 44.1kHz
- [ ] **声道**: BGM 立体声 / SFX 按需
- [ ] **文件大小**: 符合限制（BGM<10MB, SFX<1MB）
- [ ] **音质**: 无明显失真或底噪
- [ ] **循环点**: BGM 循环平滑（如适用）
- [ ] **音量**: 标准化到 -6dB 到 -3dB

---

### 使用 MediaInfo 检查

```bash
# 安装 MediaInfo
choco install mediainfo  # Windows
brew install mediainfo   # macOS

# 查看详细信息
mediainfo bgm.mp3
```

**预期输出**:
```
Format                                   : MPEG Audio
Format version                           : Version 1
Format settings                          : Joint stereo
Bit rate mode                            : Constant
Bit rate                                 : 128 kb/s
Channel(s)                               : 2 channels
Sampling rate                            : 44.1 kHz
Compression mode                         : Lossy
Stream size                              : 3.06 MiB
```

---

## 🔍 自动化检测脚本

### 检查项目中是否有非 MP3 音频

```javascript
// check-audio-format.js
const fs = require('fs');
const path = require('path');

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.flac'];
const ALLOWED_EXTENSION = '.mp3';

function checkAudioFiles(dir) {
    const issues = [];
    
    function scan(currentDir) {
        const files = fs.readdirSync(currentDir);
        
        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // 跳过 node_modules 和 .git
                if (!['node_modules', '.git'].includes(file)) {
                    scan(filePath);
                }
            } else {
                const ext = path.extname(file).toLowerCase();
                if (AUDIO_EXTENSIONS.includes(ext)) {
                    if (ext !== ALLOWED_EXTENSION) {
                        issues.push({
                            file: filePath,
                            extension: ext,
                            shouldUse: ALLOWED_EXTENSION
                        });
                    }
                }
            }
        });
    }
    
    scan(dir);
    return issues;
}

// 使用示例
const issues = checkAudioFiles('./themes');
if (issues.length > 0) {
    console.error('❌ 发现非 MP3 格式的音频文件:');
    issues.forEach(issue => {
        console.error(`  - ${issue.file} (${issue.extension}) → 应使用 ${issue.shouldUse}`);
    });
    process.exit(1);
} else {
    console.log('✅ 所有音频文件都是 MP3 格式！');
}
```

---

## 📝 GTRS 配置示例

### 正确的配置（MP3）

```json
{
  "resources": {
    "audio": {
      "bgm": {
        "bgm_main": {
          "src": "/themes/snake/audio/bgm_main.mp3",
          "volume": 0.6,
          "loop": true
        },
        "bgm_gameplay": {
          "src": "/themes/snake/audio/bgm_gameplay.mp3",
          "volume": 0.5,
          "loop": true
        }
      },
      "effect": {
        "sfx_eat": {
          "src": "/themes/snake/audio/sfx_eat.mp3",
          "volume": 0.8
        },
        "sfx_crash": {
          "src": "/themes/snake/audio/sfx_crash.mp3",
          "volume": 0.7
        }
      }
    }
  }
}
```

---

### 错误的配置（WAV/OGG 等）❌

```json
{
  "resources": {
    "audio": {
      "bgm": {
        "bgm_main": {
          "src": "/themes/snake/audio/bgm_main.wav",  // ❌ 错误
          "volume": 0.6
        }
      },
      "effect": {
        "sfx_eat": {
          "src": "/themes/snake/audio/sfx_eat.ogg",  // ❌ 错误
          "volume": 0.8
        }
      }
    }
  }
}
```

---

## ⚠️ 违规处理

### GTRS 校验时的处理

```typescript
// gtrs-validator.ts
export function validateAudioFormat(config: GTRSTheme): ValidationResult {
    const allowedExtension = '.mp3';
    const audioFiles = extractAllAudioPaths(config);
    
    const invalidFiles = audioFiles.filter(file => {
        const ext = path.extname(file.src).toLowerCase();
        return ext !== allowedExtension;
    });
    
    if (invalidFiles.length > 0) {
        return {
            valid: false,
            message: `发现 ${invalidFiles.length} 个非 MP3 格式的音频文件`,
            details: invalidFiles.map(f => ({
                path: f.src,
                currentFormat: path.extname(f.src),
                requiredFormat: allowedExtension
            }))
        };
    }
    
    return { valid: true, message: '所有音频文件格式正确' };
}
```

---

### 项目集成时的自动检查

```javascript
// pre-commit hook 或 CI/CD 流程
const { execSync } = require('child_process');

try {
    // 运行音频格式检查
    execSync('node scripts/check-audio-format.js', { stdio: 'inherit' });
    console.log('✅ 音频格式检查通过');
} catch (error) {
    console.error('❌ 音频格式检查失败！请转换为 MP3 格式');
    process.exit(1);
}
```

---

## 🎯 最佳实践

### 1. 从源头保证格式

**录音阶段**:
- ✅ 直接使用 MP3 格式录音（如录音设备支持）
- ✅ 或使用 WAV 录制，后期统一转换

---

### 2. 建立标准工作流程

```
音频制作 → WAV 母版 → MP3 导出 → GTRS 配置 → 上传部署
   ↓           ↓          ↓          ↓          ↓
原始文件    存档备份    最终使用   配置文件    生产环境
```

---

### 3. 文件命名规范

```
✅ 正确: bgm_main_theme.mp3
✅ 正确: sfx_bullet_fire.mp3
❌ 错误: bgm_main_theme.wav
❌ 错误: sfx_bullet_fire.ogg
```

---

### 4. 版本控制

```bash
# Git 配置：忽略 WAV 文件
# .gitignore
*.wav
!*.template.wav  # 模板文件除外

# 只提交 MP3 文件
git add themes/*/audio/**/*.mp3
```

---

## 📞 常见问题

### Q: 我有珍贵的 WAV 音源怎么办？

**A**: 
1. WAV 作为母版存档保存
2. 导出 MP3 用于项目
3. 两者都保留，但只提交 MP3 到 Git

---

### Q: MP3 会有音质损失吗？

**A**: 
- 128kbps MP3 对人耳来说几乎无损
- 64kbps 对于短音效足够
- 如需更高音质，可使用 192kbps（文件会更大）

---

### Q: 如何批量检查现有项目？

**A**: 
使用提供的 `check-audio-format.js` 脚本：
```bash
node scripts/check-audio-format.js ./themes
```

---

### Q: 转换后音量变小了怎么办？

**A**: 
使用 FFmpeg 的音量标准化：
```bash
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k \
  -af 'loudnorm=I=-16:TP=-1.5:LRA=11,volume=2dB' output.mp3
```

---

## 📚 相关文档

- [GTRS 主题资源规范](./GTRS_RESOURCE_SPECIFICATION.md) - 第 6 章：音频质量要求
- [游戏测试要求与规范](./GAME_TEST_REQUIREMENTS.md) - 资源完整性测试
- [游戏注册流程指南](./GAME_REGISTRATION_GUIDE.md) - 资源部署流程

---

## 🎯 总结

### 核心要点

🔴 **强制要求**: 所有音频必须使用 MP3 格式  
📊 **技术参数**: BGM 128kbps / SFX 64kbps  
✅ **优势**: 兼容性好、体积小、加载快  
🛠️ **工具**: FFmpeg、Audacity、在线转换  

---

### 立即行动

1. **检查现有音频**: 运行 `check-audio-format.js`
2. **转换非 MP3 文件**: 使用 FFmpeg 批量转换
3. **更新 GTRS 配置**: 修改所有音频路径为 `.mp3`
4. **建立规范**: 团队内同步此要求

---

**版本**: v1.0.0  
**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**状态**: 🔴 **强制执行**
