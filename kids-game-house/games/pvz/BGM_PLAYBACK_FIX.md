# 背景音乐(BGM)播放修复

## 🐛 问题描述

### 问题1: 背景音乐没有播放
游戏启动后，背景音乐完全没有声音。

### 问题2: 背景音乐重复播放
修复后发现BGM被播放了两次，声音重叠。

### 问题3: BGM听起来混乱
BGM和其他音效(zombiesAreComing)同时播放,声音混杂,听不清纯背景音乐。

## 🔍 原因分析

### 1. BootScene未加载BGM

**原代码**:
```javascript
// 只加载了音效(effects)
if (resources.audio && resources.audio.effect) {
  Object.entries(resources.audio.effect).forEach(([key, item]) => {
    this.load.audio(key, [item.src]);
  });
}
```

**问题**: 
- ❌ 没有加载 `resources.audio.bgm`
- ❌ 没有加载 `resources.audio.voice`

### 2. PlayScene未播放BGM

**原代码**:
```javascript
endCountdown() {
  this.gameStarted = true
  
  // 只初始化了音效,没有播放BGM
  this.sounds = {}
  if (this.cache.audio.exists('peaShoot')) {
    this.sounds.peaShoot = this.sound.add('peaShoot')
  }
  // ...
}
```

**问题**:
- ❌ 没有检查bgMusic是否存在
- ❌ 没有创建和播放BGM

### 3. 场景重启时BGM重复播放

**问题场景**:
```javascript
// 游戏结束画面中的“重试”按钮
restartBtn.on('pointerdown', () => this.scene.restart())
```

`scene.restart()` 会重新调用 `create()` 方法，导致：
1. 再次执行BGM播放逻辑
2. 创建新的BGM实例
3. 旧的BGM仍在播放
4. **结果**: 两个BGM同时播放，声音重叠

**根本原因**:
- ❌ `create()` 开始时没有清理旧BGM
- ❌ 没有检查是否已存在BGM实例

### 4. 缺少BGM管理

**问题**:
- ❌ 游戏结束时没有停止BGM
- ❌ 场景切换时没有清理BGM
- ❌ **暂停时没有暂停BGM**
- ❌ 可能导致内存泄漏

## ✅ 解决方案

### 1. 修复BootScene - 加载所有音频类型

**文件**: `src/scenes/BootScene.js`

```javascript
// 加载音效
if (resources.audio) {
  // 加载 BGM
  if (resources.audio.bgm) {
    Object.entries(resources.audio.bgm).forEach(([key, item]) => {
      console.log(`[BootScene] 加载 BGM: ${key}`);
      this.load.audio(key, [item.src]);
    });
  }
  
  // 加载音效
  if (resources.audio.effect) {
    Object.entries(resources.audio.effect).forEach(([key, item]) => {
      console.log(`[BootScene] 加载音效: ${key}`);
      this.load.audio(key, [item.src]);
    });
  }
  
  // 加载语音
  if (resources.audio.voice) {
    Object.entries(resources.audio.voice).forEach(([key, item]) => {
      console.log(`[BootScene] 加载语音: ${key}`);
      this.load.audio(key, [item.src]);
    });
  }
}
```

**改进**:
- ✅ 支持BGM、音效、语音三种类型
- ✅ 完整的日志输出
- ✅ 符合GTRS.json的完整结构

### 2. 修复PlayScene - 播放BGM

**文件**: `src/scenes/PlayScene.js`

#### 2.1 在 create() 开始时清理旧 BGM

```javascript
create() {
  // 停止之前可能存在的 BGM（防止重复播放）
  if (this.bgMusic) {
    this.bgMusic.stop()
    this.bgMusic.destroy()
    this.bgMusic = null
  }
  
  // 其他初始化代码...
}
```

**作用**:
- ✅ 防止 `scene.restart()` 时重复播放
- ✅ 确保只有一个BGM实例
- ✅ 释放旧资源，避免内存泄漏

#### 2.2 在 endCountdown() 中播放BGM

在 `endCountdown()` 方法中添加:

```javascript
this.gameStarted = true

// 播放背景音乐
if (this.cache.audio.exists('bgMusic')) {
  this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.4 })
  this.bgMusic.play()
  console.log('[PlayScene] BGM 开始播放')
} else {
  console.warn('[PlayScene] bgMusic 音频资源未找到')
}
```

**配置说明**:
- `loop: true` - 循环播放
- `volume: 0.4` - 音量40%(作为背景音,不宜过大)

#### 2.3 优化其他音效的播放时机

为了避免BGM和其他音效混杂,调整`zombiesAreComing`音效:

```javascript
if (this.cache.audio.exists('zombiesAreComing')) {
  this.sounds.zombiesAreComing = this.sound.add('zombiesAreComing', { volume: 0.5 })
  // 延迟 2 秒播放，让 BGM 先建立氛围
  this.time.delayedCall(2000, () => {
    if (this.sounds.zombiesAreComing && !this.gameOver && !this.levelComplete) {
      this.sounds.zombiesAreComing.play()
    }
  })
}
```

**改进**:
- ✅ 降低音量至50%
- ✅ 延迟2秒播放,让BGM先建立氛围
- ✅ 检查游戏状态,避免在不必要时播放

**配置**:
- `loop: true` - 循环播放
- `volume: 0.4` - 音量40%(不会盖过音效)

### 3. 游戏结束时停止BGM

#### 3.1 游戏失败时

在 `showGameOverScreen()` 方法开始处添加:

```javascript
showGameOverScreen() {
  // 停止背景音乐
  if (this.bgMusic) {
    this.bgMusic.stop()
    console.log('[PlayScene] BGM 已停止')
  }
  
  // 其他代码...
}
```

#### 3.2 游戏胜利时

在 `showVictoryScreen()` 方法开始处添加:

```javascript
showVictoryScreen() {
  // 停止背景音乐
  if (this.bgMusic) {
    this.bgMusic.stop()
    console.log('[PlayScene] BGM 已停止')
  }
  
  // 其他代码...
}
```

### 4. 场景关闭时清理BGM

在 PlayScene 类末尾添加 `shutdown()` 方法:

```javascript
// 场景关闭时清理资源
shutdown() {
  // 停止背景音乐
  if (this.bgMusic) {
    this.bgMusic.stop()
    this.bgMusic.destroy()
    this.bgMusic = null
    console.log('[PlayScene] BGM 已清理')
  }
}
```

**作用**:
- ✅ 防止内存泄漏
- ✅ 确保场景切换时BGM正确停止
- ✅ 释放音频资源

### 5. 暂停/恢复时控制BGM

在 `togglePause()` 方法中添加:

```javascript
togglePause() {
  if (this.gameOver || this.levelComplete) return
  this.isPaused = !this.isPaused
  if (this.isPaused) {
    this.physics.world.pause()
    // 暂停 BGM
    if (this.bgMusic) {
      this.bgMusic.pause()
    }
    this.showPauseMenu()
  } else {
    this.physics.world.resume()
    // 恢复 BGM
    if (this.bgMusic) {
      this.bgMusic.resume()
    }
    this.hidePauseMenu()
  }
}
```

**作用**:
- ✅ 暂停游戏时BGM也暂停
- ✅ 恢复游戏时BGM继续播放
- ✅ 提升用户体验

## 🎯 GTRS.json 配置

确保 `public/themes/pvz/GTRS.json` 中有正确的BGM配置:

```json
{
  "audio": {
    "bgm": {
      "bgMusic": {
        "alias": "bgMusic",
        "src": "/themes/pvz/assets/audio/bgMusic.mp3",
        "type": "mp3"
      }
    },
    "effect": {
      // 音效配置...
    },
    "voice": {
      // 语音配置...
    }
  }
}
```

## 📊 音频类型对比

| 类型 | 用途 | 特点 | 示例 |
|------|------|------|------|
| **BGM** | 背景音乐 | 循环播放,音量较低 | bgMusic |
| **Effect** | 游戏音效 | 短促,触发式播放 | peaShoot, splat |
| **Voice** | 语音提示 | 中等长度,关键事件 | zombiesAreComing |

## 🚀 测试步骤

### 1. 刷新页面
按 **Ctrl+F5** 硬刷新

### 2. 查看控制台
按 **F12** 打开开发者工具

### 3. 启动游戏
应该看到以下日志:

**加载阶段**:
```
[BootScene] 加载 BGM: bgMusic
[BootScene] ✓ bgMusic
```

**游戏开始**:
```
[PlayScene] BGM 开始播放
```

### 4. 验证播放
- ✅ 听到背景音乐
- ✅ 音乐循环播放
- ✅ 音量适中(不盖过音效)

### 5. 测试停止
- 游戏失败 → BGM停止
- 游戏胜利 → BGM停止
- 返回标题 → BGM停止

### 6. 检查清理
切换到其他场景后,控制台应显示:
```
[PlayScene] BGM 已清理
```

## 💡 最佳实践

### 1. BGM参数设置

```javascript
this.bgMusic = this.sound.add('bgMusic', {
  loop: true,      // 循环播放
  volume: 0.6,     // 音量60%
  seek: 0          // 从头开始
})
```

**推荐音量**:
- BGM: 0.3-0.5 (背景音,柔和不抢戏)
- 音效: 0.8-1.0 (突出反馈)
- 语音: 0.6-0.8 (清晰可听但不刺耳)

### 2. 生命周期管理

```
场景创建 → 播放BGM
    ↓
游戏进行中 → BGM循环
    ↓
游戏结束 → 停止BGM
    ↓
场景销毁 → 清理BGM
```

### 3. 错误处理

```javascript
if (this.cache.audio.exists('bgMusic')) {
  // 播放
} else {
  console.warn('[PlayScene] bgMusic 音频资源未找到')
  // 游戏仍可正常运行,只是没有BGM
}
```

## ⚠️ 注意事项

1. **文件格式**
   - 推荐使用MP3格式
   - WAV可能存在兼容性问题
   - 确保文件存在且路径正确

2. **音量平衡**
   - BGM不应盖过音效
   - 提供音量调节功能(未来)
   - 考虑用户偏好

3. **性能考虑**
   - 及时清理不用的音频
   - 避免同时播放多个BGM
   - 使用对象池管理音效

4. **用户体验**
   - 首次进入可能有延迟(加载)
   - 提供静音选项(未来)
   - 尊重浏览器自动播放策略

## 🔧 相关修改

### 修改的文件

1. ✅ `src/scenes/BootScene.js`
   - 添加BGM加载逻辑
   - 添加语音加载逻辑

2. ✅ `src/scenes/PlayScene.js`
   - 添加BGM播放逻辑
   - 添加BGM停止逻辑(游戏结束/胜利)
   - 添加shutdown清理方法

### 不需要修改的文件

- ❌ `public/themes/pvz/GTRS.json` (已有正确配置)
- ❌ `public/resource-manager.html` (不影响)

## 📄 相关文档

- [WAV_UPLOAD_HANDLING.md](./WAV_UPLOAD_HANDLING.md) - WAV文件上传处理
- [AUDIO_PATH_DUPLICATE_FIX.md](./AUDIO_PATH_DUPLICATE_FIX.md) - 音频路径修复
- [AUDIO_EDITOR_LOAD_FIX.md](./AUDIO_EDITOR_LOAD_FIX.md) - 音频编辑器修复

---

**修复日期**: 2026-04-16  
**影响文件**: 
- `src/scenes/BootScene.js`
- `src/scenes/PlayScene.js`  
**需要重启**: ❌ 否 (Vite HMR会自动更新)  
**状态**: ✅ 已完成
