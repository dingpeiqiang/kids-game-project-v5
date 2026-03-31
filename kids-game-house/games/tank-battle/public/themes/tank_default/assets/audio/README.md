# 音频资源说明

当前目录包含以下音频资源的占位符：

- bgm_main.mp3
- sfx_shot.wav
- sfx_explosion.wav
- sfx_hit.wav
- sfx_start.wav
- sfx_gameover.wav
- sfx_prop.wav

## 开发阶段

使用 WebAudio API 实时合成音效，无需实际文件。

## 生产阶段

请替换为真实的音频文件：
- BGM: MP3 格式，128kbps，循环播放
- SFX: WAV 格式，短促音效

## WebAudio 实现示例

```javascript
// 射击音效
function playShootSound() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}
```
