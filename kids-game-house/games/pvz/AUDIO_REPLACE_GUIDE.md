# PVZ 音频替换功能说明

## 📋 功能概述

PVZ资源管理器现已支持**完整的音频替换流程**:
1. 编辑音频文件
2. 替换到游戏目录
3. **自动更新GTRS.json配置** ✅

## 🎯 使用步骤

### 方法一:从游戏资源列表编辑(推荐)

1. **打开资源管理器**
   - 访问: `http://localhost:5173/resource-manager.html`

2. **选择音频资源**
   - 在"🔊 音频资源"标签页找到要编辑的音频
   - 点击"✏️"编辑按钮

3. **编辑音频**
   - 调整音量、速度、裁剪等
   - 预览效果

4. **应用到游戏**
   - 点击"✅ 应用到游戏"按钮
   - 系统会**自动识别**要替换的音频
   - 确认后即可替换

5. **完成**
   - ✅ 音频文件已替换到 `public/themes/pvz/assets/audio/`
   - ✅ GTRS.json 配置已自动更新
   - 🔄 刷新游戏即可看到效果

### 方法二:上传新音频并替换

1. **打开音频编辑器**
   - 点击顶部导航栏的"🎵 音频编辑器"

2. **导入音频**
   - 拖拽音频文件到编辑区
   - 或点击"选择文件"按钮

3. **编辑音频**
   - 使用各种工具编辑

4. **选择要替换的目标**
   - 点击"✅ 应用到游戏"
   - 从下拉列表选择要替换的游戏音频:
     - 🔫 豌豆射击音效 (pea_shoot.mp3)
     - 💥 溅血音效 (splat.mp3)
     - 🧟 僵尸来了音效 (zombies_are_coming.mp3)
     - 🎵 背景音乐 (bgMusic.wav / bg_music.wav)

5. **确认替换**
   - 点击"✅ 确认应用"
   - 系统会自动:
     - 保存音频文件到正确位置
     - 更新GTRS.json配置

## ✨ 核心功能

### 1. 音频编辑工具
- 🎚️ 音量调整 (50%-200%)
- 🌅 淡入淡出 (1s/2s)
- ⏱️ 播放速度 (0.5x-2.0x)
- ✂️ 裁剪工具 (精确到秒)
- 🔄 反转音频
- 📊 标准化
- 🔇 结尾静音

### 2. 波形可视化
- Canvas绘制实时波形
- 播放进度指示器
- 时间显示

### 3. 智能替换
- **自动检测音频类型** (BGM/音效)
- **自动保存到正确目录**
  - BGM: `/themes/pvz/assets/audio/`
  - 音效: `/themes/pvz/assets/audio/effects/`
- **自动更新GTRS.json**
  - 更新audio.bgm或audio.effect配置
  - 保持原有alias不变
  - 更新src路径和type格式

### 4. 降级方案
如果API不可用,系统会:
- 下载编辑后的音频文件
- 提示手动放置到正确位置
- 提示手动更新GTRS.json

## 📁 文件结构

```
kids-game-house/games/pvz/public/themes/pvz/
├── GTRS.json                    ← 自动更新此文件
└── assets/
    └── audio/
        ├── bg_music.wav         ← BGM存放位置
        └── effects/
            ├── pea_shoot.mp3    ← 音效存放位置
            ├── splat.mp3
            └── zombies_are_coming.mp3
```

## 🔧 GTRS.json 配置示例

替换前:
```json
{
  "audio": {
    "effect": {
      "peaShoot": {
        "alias": "Pea Shoot Sound",
        "src": "/themes/pvz/assets/audio/effects/pea_shoot.mp3",
        "type": "mp3"
      }
    }
  }
}
```

替换后(自动更新):
```json
{
  "audio": {
    "effect": {
      "peaShoot": {
        "alias": "Pea Shoot Sound",
        "src": "/themes/pvz/assets/audio/effects/pea_shoot_edited.wav",
        "type": "wav"
      }
    }
  }
}
```

## 💡 注意事项

1. **文件格式**
   - 目前导出为WAV格式(音质最好)
   - MP3编码需要额外库支持
   - 文件名扩展名会自动匹配

2. **备份建议**
   - 替换前建议备份原音频文件
   - GTRS.json会自动更新,但建议版本控制

3. **立即生效**
   - 替换完成后刷新游戏页面
   - 浏览器可能需要清除缓存(Ctrl+F5)

4. **路径规则**
   - BGM: 直接放在 `audio/` 目录
   - 音效: 放在 `audio/effects/` 子目录
   - 系统会自动处理路径

## 🐛 常见问题

### Q: 替换后游戏没有变化?
A: 
1. 检查GTRS.json是否已更新
2. 清除浏览器缓存(Ctrl+Shift+Delete)
3. 硬刷新页面(Ctrl+F5)
4. 检查音频文件是否存在于正确位置

### Q: GTRS配置更新失败?
A:
- 检查后端API `/api/local-write` 是否可用
- 查看浏览器控制台错误信息
- 手动更新GTRS.json配置文件

### Q: 如何恢复原始音频?
A:
1. 从Git恢复原始文件
2. 或使用资源管理器的"重新生成"功能
3. 手动还原GTRS.json配置

## 🚀 技术实现

### 关键函数
- `confirmApplyToGame()` - 确认应用到游戏
- `updateGTRSConfig()` - 更新GTRS配置
- `loadGameAudioList()` - 加载可替换的音频列表

### API调用
```javascript
// 1. 写入音频文件
POST /api/local-write
Body: FormData { file, path }

// 2. 更新GTRS配置
POST /api/local-write  
Body: FormData { file: Blob(GTRS.json), path: 'themes/pvz/GTRS.json' }
```

### 自动检测逻辑
```javascript
// 判断是否为BGM
if (audioKey.includes('bg') || audioKey.includes('music')) {
  category = 'bgm';
  audioType = 'bgm';
} else {
  category = 'effect';
  audioType = 'effect';
}
```

---

**最后更新**: 2026-04-16  
**版本**: v2.0.0 (新增GTRS自动更新)
