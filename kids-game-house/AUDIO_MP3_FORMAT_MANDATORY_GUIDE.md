# ⚠️ 音频资源强制 MP3 格式规范 - 实施指南

**版本**: v1.0.0  
**日期**: 2026-03-27  
**状态**: 🔴 **强制执行，立即生效**

---

## 🚨 重要通知

### 所有音频资源必须使用 MP3 格式

根据项目规范要求，**所有游戏音频资源（包括背景音乐和音效）必须使用 MP3 格式**。

```
✅ 允许：MP3
❌ 禁止：WAV、OGG、WEBM、AAC、M4A、FLAC 等其他所有格式
```

---

## 📋 快速参考

### 技术参数要求

| 资源类型 | 格式 | 比特率 | 采样率 | 声道 | 最大文件 |
|---------|------|--------|--------|------|---------|
| **BGM（背景音乐）** | MP3 | 128 kbps | 44.1 kHz | 立体声 | < 10 MB |
| **SFX（音效）** | MP3 | 64 kbps | 44.1 kHz | 单/立体声 | < 1 MB |

---

## 🛠️ 立即行动清单

### 检查现有资源

```bash
# 运行自动检测脚本
node scripts/check-audio-format.js ./themes

# 如果发现非 MP3 文件，会输出：
# ❌ 发现非 MP3 格式的音频文件:
#   - themes/snake/audio/bgm_main.wav
#   - themes/snake/audio/sfx_eat.ogg
```

---

### 批量转换 WAV 到 MP3

```bash
# 使用 FFmpeg 批量转换
for wav in themes/*/audio/**/*.wav; do
    if [ -f "$wav" ]; then
        mp3="${wav%.wav}.mp3"
        ffmpeg -i "$wav" -codec:a libmp3lame -b:a 128k "$mp3" -y
        echo "转换：$wav → $mp3"
    fi
done
```

---

### 更新 GTRS 配置

修改 `config.json` 中的所有音频路径：

```json
{
  "resources": {
    "audio": {
      "bgm": {
        "bgm_main": {
          // ❌ 错误
          "src": "/themes/snake/audio/bgm_main.wav"
          
          // ✅ 正确
          "src": "/themes/snake/audio/bgm_main.mp3"
        }
      }
    }
  }
}
```

---

## 📊 影响范围

### 需要检查的文件

1. **所有游戏的主题资源目录**
   ```
   themes/<game_id>/audio/
   ├── bgm/     # 背景音乐
   └── sfx/     # 音效
   ```

2. **GTRS 配置文件**
   ```
   themes/<game_id>/config.json
   ```

3. **数据库中的主题配置**
   ```sql
   SELECT theme_id, config_json 
   FROM t_theme_info 
   WHERE config_json LIKE '%.wav%';
   ```

---

## 🔍 自动化检测脚本

### check-audio-format.js

```javascript
#!/usr/bin/env node

/**
 * 音频格式检测脚本
 * 检查项目中是否有非 MP3 格式的音频文件
 */

const fs = require('fs');
const path = require('path');

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.flac'];
const ALLOWED_EXTENSION = '.mp3';

function checkAudioFiles(baseDir) {
    const issues = [];
    let checkedFiles = 0;
    
    function scan(currentDir) {
        const files = fs.readdirSync(currentDir);
        
        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // 跳过这些目录
                if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
                    scan(filePath);
                }
            } else {
                const ext = path.extname(file).toLowerCase();
                if (AUDIO_EXTENSIONS.includes(ext)) {
                    checkedFiles++;
                    if (ext !== ALLOWED_EXTENSION) {
                        issues.push({
                            file: filePath,
                            relativePath: path.relative(baseDir, filePath),
                            extension: ext,
                            shouldUse: ALLOWED_EXTENSION,
                            size: fs.statSync(filePath).size
                        });
                    }
                }
            }
        });
    }
    
    scan(baseDir);
    
    return {
        checkedFiles,
        issues,
        hasIssues: issues.length > 0
    };
}

// 主程序
const baseDir = process.argv[2] || './themes';

console.log(`🔍 开始检查音频文件格式...`);
console.log(`扫描目录：${path.resolve(baseDir)}`);
console.log(`允许格式：${ALLOWED_EXTENSION}\n`);

const result = checkAudioFiles(baseDir);

console.log(`已检查文件：${result.checkedFiles} 个\n`);

if (result.hasIssues) {
    console.error('❌ 发现非 MP3 格式的音频文件:\n');
    
    // 按扩展名分组
    const grouped = {};
    result.issues.forEach(issue => {
        if (!grouped[issue.extension]) {
            grouped[issue.extension] = [];
        }
        grouped[issue.extension].push(issue);
    });
    
    Object.entries(grouped).forEach(([ext, issues]) => {
        console.error(`\n${ext.toUpperCase()} 格式 (${issues.length} 个):`);
        issues.forEach((issue, i) => {
            const sizeKB = (issue.size / 1024).toFixed(1);
            console.error(`  ${i + 1}. ${issue.relativePath} (${sizeKB} KB)`);
        });
    });
    
    console.error('\n🔴 请将以上所有文件转换为 MP3 格式！');
    console.error('\n💡 提示：使用 FFmpeg 批量转换');
    console.error('   ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3\n');
    
    process.exit(1);
} else {
    console.log('✅ 所有音频文件都是 MP3 格式！符合要求！\n');
    process.exit(0);
}
```

---

### 使用方法

```bash
# 检查 themes 目录
node scripts/check-audio-format.js ./themes

# 检查特定游戏
node scripts/check-audio-format.js ./themes/snake

# 集成到 CI/CD
npm run check:audio
```

---

## 🔄 批量转换方案

### 方案 1: Bash 脚本（Linux/Mac）

```bash
#!/bin/bash
# batch-convert-to-mp3.sh

INPUT_DIR="${1:-./themes}"
BITRATE="${2:-128k}"

echo "🎵 开始批量转换音频为 MP3 格式..."
echo "输入目录：$INPUT_DIR"
echo "比特率：$BITRATE"
echo ""

converted=0
errors=0

# 查找所有 WAV 文件
while IFS= read -r -d '' wav_file; do
    # 生成输出文件名
    mp3_file="${wav_file%.wav}.mp3"
    
    echo "转换：$(basename "$wav_file")"
    
    # 执行转换
    if ffmpeg -loglevel error -i "$wav_file" \
              -codec:a libmp3lame \
              -b:a "$BITRATE" \
              "$mp3_file" -y; then
        
        ((converted++))
        echo "  ✅ 成功 → $(basename "$mp3_file")"
    else
        ((errors++))
        echo "  ❌ 失败"
    fi
    
done < <(find "$INPUT_DIR" -type f -name "*.wav" -print0)

echo ""
echo "======================================"
echo "转换完成！"
echo "  成功：$converted 个"
echo "  失败：$errors 个"
echo "======================================"

if [ $errors -gt 0 ]; then
    exit 1
fi
```

---

### 方案 2: PowerShell 脚本（Windows）

```powershell
# batch-convert-to-mp3.ps1

param(
    [string]$InputDir = "./themes",
    [string]$Bitrate = "128k"
)

Write-Host "🎵 开始批量转换音频为 MP3 格式..." -ForegroundColor Cyan
Write-Host "输入目录：$InputDir"
Write-Host "比特率：$Bitrate"
Write-Host ""

$converted = 0
$errors = 0

# 获取所有 WAV 文件
$wavFiles = Get-ChildItem -Path $InputDir -Include *.wav -Recurse -File

foreach ($wavFile in $wavFiles) {
    $mp3File = [System.IO.Path]::ChangeExtension($wavFile.FullName, ".mp3")
    
    Write-Progress -Activity "转换中" -Status $wavFile.Name -PercentComplete (($converted / $wavFiles.Count) * 100)
    
    # 执行转换
    $ffmpegArgs = @(
        "-i", $wavFile.FullName,
        "-codec:a", "libmp3lame",
        "-b:a", $Bitrate,
        "-y", $mp3File
    )
    
    & ffmpeg $ffmpegArgs 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        $converted++
        Write-Host "  ✅ $($wavFile.Name)" -ForegroundColor Green
    } else {
        $errors++
        Write-Host "  ❌ $($wavFile.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "转换完成！" -ForegroundColor Cyan
Write-Host "  成功：$converted 个" -ForegroundColor Green
Write-Host "  失败：$errors 个" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "======================================" -ForegroundColor Cyan

if ($errors -gt 0) {
    exit 1
}
```

---

### 方案 3: Node.js 跨平台脚本

```javascript
// batch-convert.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = process.argv[2] || './themes';
const BITRATE = process.argv[3] || '128k';

console.log('🎵 开始批量转换音频为 MP3 格式...\n');
console.log(`输入目录：${INPUT_DIR}`);
console.log(`比特率：${BITRATE}\n`);

let converted = 0;
let errors = 0;

function findWavFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            results = results.concat(findWavFiles(filePath));
        } else if (file.endsWith('.wav')) {
            results.push(filePath);
        }
    });
    
    return results;
}

const wavFiles = findWavFiles(INPUT_DIR);
console.log(`找到 ${wavFiles.length} 个 WAV 文件\n`);

wavFiles.forEach((wavFile, index) => {
    const mp3File = wavFile.replace('.wav', '.mp3');
    const progress = Math.round(((index + 1) / wavFiles.length) * 100);
    
    process.stdout.write(`[${progress}%] 转换：${path.basename(wavFile)}... `);
    
    try {
        execSync(
            `ffmpeg -i "${wavFile}" -codec:a libmp3lame -b:a ${BITRATE} "${mp3File}" -y`,
            { stdio: 'pipe' }
        );
        converted++;
        console.log('✅');
    } catch (error) {
        errors++;
        console.log('❌');
    }
});

console.log('\n======================================');
console.log('转换完成！');
console.log(`  成功：${converted} 个`);
console.log(`  失败：${errors} 个`);
console.log('======================================\n');

process.exit(errors > 0 ? 1 : 0);
```

---

## 📝 GTRS 配置检查清单

### 必须检查的字段

```json
{
  "resources": {
    "audio": {
      "bgm": {
        "bgm_main": {
          "src": "检查是否为 .mp3"  // ✅
        },
        "bgm_gameplay": {
          "src": "检查是否为 .mp3"  // ✅
        }
      },
      "effect": {
        "sfx_eat": {
          "src": "检查是否为 .mp3"  // ✅
        },
        "sfx_crash": {
          "src": "检查是否为 .mp3"  // ✅
        }
      }
    }
  }
}
```

---

### SQL 检查查询

```sql
-- 检查数据库中是否有 WAV 格式的音频配置
SELECT 
    theme_id,
    theme_name,
    JSON_EXTRACT(config_json, '$.resources.audio') as audio_config
FROM t_theme_info
WHERE JSON_SEARCH(config_json, 'one', '%.wav%') IS NOT NULL;
```

---

## ⚠️ 违规处理

### GTRS 校验规则

```typescript
// gtrs-validator.ts
export function validateAudioFormat(theme: GTRSTheme): ValidationResult {
    const audioPaths = extractAllAudioPaths(theme);
    const invalidFiles = audioPaths.filter(p => !p.src.endsWith('.mp3'));
    
    if (invalidFiles.length > 0) {
        return {
            valid: false,
            message: `发现 ${invalidFiles.length} 个非 MP3 格式的音频文件`,
            details: invalidFiles.map(f => ({
                key: f.key,
                src: f.src,
                format: path.extname(f.src),
                required: '.mp3'
            }))
        };
    }
    
    return { valid: true, message: '音频格式检查通过' };
}
```

---

### 上线前检查

在游戏注册流程中添加音频格式检查：

```bash
#!/bin/bash
# pre-launch-check.sh

echo "🔍 执行上线前检查..."

# 1. 音频格式检查
echo "1. 检查音频格式..."
node scripts/check-audio-format.js ./themes
if [ $? -ne 0 ]; then
    echo "❌ 音频格式检查失败！"
    exit 1
fi

# 2. GTRS Schema 校验
echo "2. GTRS Schema 校验..."
node scripts/validate-gtrs.js ./themes
if [ $? -ne 0 ]; then
    echo "❌ GTRS 校验失败！"
    exit 1
fi

echo "✅ 所有检查通过！可以上线！"
```

---

## 🎯 最佳实践

### 1. 从源头控制

**新音频制作流程**:
```
录音/制作 → 导出为 MP3 → GTRS 配置 → 上传部署
           ↓
       直接符合规范
```

---

### 2. 建立标准

**团队规范**:
- ✅ 所有音频统一导出为 MP3
- ✅ BGM: 128kbps, SFX: 64kbps
- ✅ 提交前运行格式检查脚本
- ✅ Git 配置忽略 WAV 文件

---

### 3. 自动化

**CI/CD 集成**:
```yaml
# .github/workflows/audio-check.yml
name: Audio Format Check

on: [push]

jobs:
  check-audio:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install FFmpeg
        run: sudo apt-get install ffmpeg
      
      - name: Check Audio Format
        run: node scripts/check-audio-format.js ./themes
```

---

## 📞 常见问题

### Q: 为什么不能保留 WAV 作为备选？

**A**: 
- ❌ 文件体积太大（10 倍差距）
- ❌ 浏览器兼容性不如 MP3
- ❌ 增加带宽成本
- ❌ 降低加载速度

---

### Q: MP3 会有音质损失吗？

**A**: 
- 128kbps MP3 对人耳来说几乎无损
- 专业测试表明大多数人无法区分 128kbps MP3 和 WAV
- 如需更高音质，可使用 192kbps（但文件会更大）

---

### Q: 如何处理已有的 WAV 资源？

**A**: 
1. 使用批量转换脚本转换
2. 保留 WAV 作为母版存档
3. 只提交 MP3 到 Git
4. 更新 GTRS 配置文件

---

### Q: 特殊音效需要更高质量怎么办？

**A**: 
- 可以使用 192kbps 或 256kbps MP3
- 但仍需保持 MP3 格式
- 不建议使用无损格式

---

## 📚 相关文档

- [📖 音频资源强制 MP3 格式规范](./shared/game-framework/docs/AUDIO_MP3_MANDATORY.md) - 完整详细说明
- [📖 GTRS 主题资源规范](./shared/game-framework/docs/GTRS_RESOURCE_SPECIFICATION.md) - 第 6 章：音频质量要求
- [📖 游戏测试要求与规范](./shared/game-framework/docs/GAME_TEST_REQUIREMENTS.md) - 资源完整性测试
- [📖 游戏注册流程指南](./shared/game-framework/docs/GAME_REGISTRATION_GUIDE.md) - 资源部署流程

---

## 🎯 立即行动

### 第一步：检查

```bash
node scripts/check-audio-format.js ./themes
```

### 第二步：转换

```bash
node scripts/batch-convert.js ./themes
```

### 第三步：验证

```bash
node scripts/check-audio-format.js ./themes
# 应该显示：✅ 所有音频文件都是 MP3 格式！
```

### 第四步：更新配置

```bash
# 手动或使用脚本更新 GTRS config.json
# 将所有 .wav 路径改为 .mp3
```

---

**强制执行日期**: 2026-03-27  
**版本**: v1.0.0  
**维护者**: Sitech AI Team  
**状态**: 🔴 **立即执行，必须遵守**
