# 资源管理器音频列表动态加载修复

## 🐛 问题描述

音频替换成功后,刷新PVZ资源管理器页面,**音频列表没有更新**,仍然显示旧的音频信息。

## 🔍 原因分析

资源管理器中的音频列表是**硬编码**在JavaScript中的:

```javascript
const RESOURCES = {
  audio: [
    { key: 'bgMusic', alias: '🎵 背景音乐', file: 'bg_music.wav', ... },
    { key: 'peaShoot', alias: 'Pea Shoot Sound', file: 'pea_shoot.mp3', ... },
    // ...
  ]
};
```

即使GTRS.json已经更新,资源管理器也不会读取新的配置,导致界面与实际文件不同步。

## ✅ 解决方案

### 1. 移除硬编码的音频列表

将`RESOURCES.audio`改为空数组,标记为从GTRS.json动态加载:

```javascript
const RESOURCES = {
  images: [...],
  audio: [], // 将从 GTRS.json 动态加载
  json: [...]
};
```

### 2. 添加动态加载函数

新增 `loadAudioFromGTRS()` 函数,从GTRS.json读取音频配置:

```javascript
async function loadAudioFromGTRS() {
  try {
    const response = await fetch(`${THEME_BASE}/GTRS.json`);
    const gtrsData = await response.json();
    const audioList = [];
    
    // 遍历 GTRS 中的音频配置 (bgm, effect, voice)
    if (gtrsData.resources && gtrsData.resources.audio) {
      const audioConfig = gtrsData.resources.audio;
      
      // 处理 BGM
      if (audioConfig.bgm) {
        Object.entries(audioConfig.bgm).forEach(([key, config]) => {
          const filename = config.src.split('/').pop();
          audioList.push({
            key: key,
            alias: config.alias || key,
            file: filename,
            path: `${THEME_BASE}${config.src}`
          });
        });
      }
      
      // 处理音效和语音...
    }
    
    // 更新 RESOURCES.audio
    RESOURCES.audio = audioList;
    
    // 刷新徽章和界面
    updateBadges();
    renderContent(currentTab);
  } catch (error) {
    console.error('[ResourceManager] 加载音频列表失败:', error);
  }
}
```

### 3. 初始化时加载

在页面加载时调用该函数:

```javascript
window.onload = async () => {
  // 先从 GTRS.json 加载音频列表
  await loadAudioFromGTRS();
  
  updateBadges();
  renderContent('all');
  checkSD();
  checkMusicGen();
};
```

### 4. 替换后自动刷新

在音频替换成功后,重新加载音频列表:

```javascript
if (gtrsUpdated) {
  showToast(`✅ 已替换音频并更新配置: ${filename}`, false);
  
  // 重新加载音频列表，使界面立即更新
  await loadAudioFromGTRS();
}
```

## 📋 工作流程

```
页面加载
    ↓
loadAudioFromGTRS()
    ↓
读取 GTRS.json
    ↓
解析 resources.audio 配置
    ↓
├─ bgm → 添加到列表
├─ effect → 添加到列表
└─ voice → 添加到列表
    ↓
更新 RESOURCES.audio
    ↓
刷新界面显示
    ↓
用户看到最新的音频列表 ✨
```

## 🎯 使用效果

### 替换前
- 音频列表: 硬编码,固定不变
- GTRS.json: 手动编辑才生效
- 同步性: ❌ 不同步

### 替换后
- 音频列表: **动态从GTRS.json加载**
- GTRS.json: 修改后立即反映到界面
- 同步性: ✅ 完全同步

## 💡 优势

1. **实时同步**: GTRS.json更新后,刷新页面即可看到最新列表
2. **自动检测**: 替换音频后自动重新加载,无需手动刷新
3. **支持所有类型**: BGM、音效、语音都能正确显示
4. **容错处理**: 如果GTRS.json加载失败,不影响其他功能

## 🔄 测试步骤

### 1. 刷新页面
按 **Ctrl+F5** 硬刷新资源管理器页面

### 2. 查看音频列表
应该看到从GTRS.json加载的所有音频:
- 🎵 背景音乐 (bgMusic)
- 🔫 豌豆射击音效 (peaShoot)
- 💥 溅血音效 (splat)
- 🧟 僵尸来了音效 (zombiesAreComing)

### 3. 替换一个音频
1. 点击"✏️"编辑某个音频
2. 修改后点击"✅ 应用到游戏"
3. 确认替换

### 4. 验证更新
- 提示成功后,音频列表应该**自动刷新**
- 显示新的文件名和路径
- 无需手动刷新页面

## 📝 技术细节

### GTRS.json 结构
```json
{
  "resources": {
    "audio": {
      "bgm": {
        "bgMusic": {
          "alias": "背景音乐",
          "src": "/themes/pvz/assets/audio/bgMusic.wav",
          "type": "wav"
        }
      },
      "effect": {
        "peaShoot": {
          "alias": "Pea Shoot Sound",
          "src": "/themes/pvz/assets/audio/effects/pea_shoot.mp3",
          "type": "mp3"
        }
      }
    }
  }
}
```

### 解析逻辑
```javascript
// 提取文件名
const filename = config.src.split('/').pop();
// bgMusic.wav 或 pea_shoot.mp3

// 构建完整路径
const path = `${THEME_BASE}${config.src}`;
// /themes/pvz/assets/audio/bgMusic.wav
```

## ⚠️ 注意事项

1. **首次加载**: 页面首次打开时会异步加载GTRS.json,可能需要短暂等待
2. **缓存问题**: 如果GTRS.json更新了但界面没变,按Ctrl+F5硬刷新
3. **错误处理**: 如果GTRS.json格式错误,会显示警告但不影响其他功能

## 🚀 后续优化

可以考虑:
- 添加加载进度指示器
- 支持手动刷新按钮
- 缓存GTRS.json减少请求
- 监听GTRS.json变化自动刷新

---

**修复日期**: 2026-04-16  
**影响文件**: `public/resource-manager.html`  
**需要重启**: ❌ 否 (只需刷新浏览器)
