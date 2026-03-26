/**
 * 飞机大战音效管理器
 * 使用 Web Audio API 实现
 */

// 音效类型定义
export type SoundEffectType = 
  | 'effect_fire'      // 射击音效
  | 'effect_explosion' // 爆炸音效
  | 'effect_hit'       // 击中音效
  | 'effect_powerup'   // 道具拾取
  | 'effect_button_click' // 按钮点击

// 音效配置
const SOUND_CONFIG: Record<SoundEffectType, { volume?: number }> = {
  effect_fire: { volume: 0.3 },
  effect_explosion: { volume: 0.5 },
  effect_hit: { volume: 0.4 },
  effect_powerup: { volume: 0.4 },
  effect_button_click: { volume: 0.2 }
}

/**
 * 播放音效
 * @param soundKey 音效键名
 */
export function playSound(soundKey: SoundEffectType): void {
  try {
    const config = SOUND_CONFIG[soundKey] || {}
    console.log(`[Audio] 播放音效：${soundKey}`, config)
    
    // 使用 Web Audio API 播放
    playWebAudio(soundKey, config)
  } catch (error) {
    console.error(`[Audio] 播放音效失败：${soundKey}`, error)
  }
}

/**
 * 使用 Web Audio API 播放临时音效
 * @param soundKey 音效类型
 * @param config 音效配置
 */
function playWebAudio(soundKey: SoundEffectType, config: any): void {
  // 创建 AudioContext
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContextClass) return
  
  const ctx = new AudioContextClass()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  
  // 根据音效类型设置参数
  switch (soundKey) {
    case 'effect_fire':
      // 射击音效：短促的方波
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(400, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(config.volume || 0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
      break
      
    case 'effect_explosion':
      // 爆炸音效：噪声模拟 (简化版用锯齿波)
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(100, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
      gainNode.gain.setValueAtTime(config.volume || 0.5, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
      break
      
    case 'effect_hit':
      // 击中音效：高频脉冲
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
      gainNode.gain.setValueAtTime(config.volume || 0.4, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)
      break
      
    case 'effect_powerup':
      // 道具拾取：上升音调
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(600, ctx.currentTime)
      oscillator.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.2)
      gainNode.gain.setValueAtTime(config.volume || 0.4, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
      break
      
    case 'effect_button_click':
      // 按钮点击：简短正弦波
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      gainNode.gain.setValueAtTime(config.volume || 0.2, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.05)
      break
  }
}

/**
 * 播放背景音乐 (BGM)
 * @param bgmKey BGM 键名 (对应 GTRS 资源中的 audio.bgm.* 键)
 */
export function playBGM(bgmKey: string): void {
  console.log(`[Audio] 播放 BGM: ${bgmKey}`)
  // TODO: 实现 BGM 播放循环
}

/**
 * 停止背景音乐
 */
export function stopBGM(): void {
  console.log('[Audio] 停止 BGM')
  // TODO: 实现 BGM 停止
}
