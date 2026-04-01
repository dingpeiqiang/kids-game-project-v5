#!/usr/bin/env node

/**
 * 生成简单的 WAV 音频文件
 * 用于替换占位符 README 文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 输出目录
const AUDIO_DIR = path.join(__dirname, 'public', 'themes', 'tank_default', 'assets', 'audio')

// 确保目录存在
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true })
}

/**
 * 生成简单的 WAV 音频
 * @param {number} frequency - 频率 (Hz)
 * @param {number} duration - 时长 (秒)
 * @param {string} type - 波形类型 ('square', 'sawtooth', 'sine')
 * @returns {Buffer} WAV 文件 Buffer
 */
function generateWav(frequency, duration, type = 'square') {
  const sampleRate = 44100
  const numSamples = Math.floor(sampleRate * duration)
  const buffer = Buffer.alloc(44 + numSamples * 2) // WAV header (44 bytes) + data
  
  // WAV header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + numSamples * 2, 4) // file size - 8
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // fmt chunk size
  buffer.writeUInt16LE(1, 20) // PCM format
  buffer.writeUInt16LE(1, 22) // mono channel
  buffer.writeUInt32LE(sampleRate, 24) // sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28) // byte rate
  buffer.writeUInt16LE(2, 32) // block align
  buffer.writeUInt16LE(16, 34) // bits per sample
  buffer.write('data', 36)
  buffer.writeUInt32LE(numSamples * 2, 40) // data chunk size
  
  // Audio data
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    let sample = 0
    
    switch (type) {
      case 'square':
        sample = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * 0.3
        break
      case 'sawtooth':
        sample = ((t * frequency) % 1) * 2 - 1
        sample *= 0.3
        break
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t) * 0.3
        break
    }
    
    const intSample = Math.max(-1, Math.min(1, sample)) * 32767
    buffer.writeInt16LE(intSample, 44 + i * 2)
  }
  
  return buffer
}

console.log('🎵 开始生成音频资源...\n')

// 生成音效
const sounds = [
  { name: 'sfx_shot.wav', freq: 800, duration: 0.3, type: 'square', desc: '射击音效' },
  { name: 'sfx_explosion.wav', freq: 100, duration: 0.5, type: 'sawtooth', desc: '爆炸音效' },
  { name: 'sfx_hit.wav', freq: 200, duration: 0.2, type: 'square', desc: '击中音效' },
  { name: 'sfx_start.wav', freq: 600, duration: 0.4, type: 'sine', desc: '开始音效' },
  { name: 'sfx_gameover.wav', freq: 150, duration: 0.8, type: 'sawtooth', desc: '游戏结束音效' },
  { name: 'sfx_prop.wav', freq: 1000, duration: 0.2, type: 'sine', desc: '道具音效' },
  // 修复：添加缺失的音效文件
  { name: 'sfx_bonus_appears.wav', freq: 880, duration: 0.3, type: 'sine', desc: '道具出现音效' },
  { name: 'sfx_bonus_captured.wav', freq: 1200, duration: 0.25, type: 'sine', desc: '道具拾取音效' },
]

sounds.forEach(sound => {
  const wavBuffer = generateWav(sound.freq, sound.duration, sound.type)
  const filePath = path.join(AUDIO_DIR, sound.name)
  fs.writeFileSync(filePath, wavBuffer)
  console.log(`✅ ${sound.name.padEnd(20)} - ${sound.desc}`)
})

// 生成背景音乐（简单的循环旋律）
console.log('\n🎶 生成背景音乐...')
const bgmDuration = 30 // 30 秒循环
const bgmBuffer = Buffer.alloc(44 + bgmDuration * 44100 * 2)

// WAV header
bgmBuffer.write('RIFF', 0)
bgmBuffer.writeUInt32LE(36 + bgmDuration * 44100 * 2, 4)
bgmBuffer.write('WAVE', 8)
bgmBuffer.write('fmt ', 12)
bgmBuffer.writeUInt32LE(16, 16)
bgmBuffer.writeUInt16LE(1, 20)
bgmBuffer.writeUInt16LE(1, 22)
bgmBuffer.writeUInt32LE(44100, 24)
bgmBuffer.writeUInt32LE(44100 * 2, 28)
bgmBuffer.writeUInt16LE(2, 32)
bgmBuffer.writeUInt16LE(16, 34)
bgmBuffer.write('data', 36)
bgmBuffer.writeUInt32LE(bgmDuration * 44100 * 2, 40)

// 简单的琶音背景音乐
const melody = [261.63, 329.63, 392.00, 523.25] // C major chord
const noteDuration = 0.5
for (let i = 0; i < bgmDuration * 44100; i++) {
  const t = i / 44100
  const noteIndex = Math.floor(t / noteDuration) % melody.length
  const freq = melody[noteIndex]
  const sample = Math.sin(2 * Math.PI * freq * t) * 0.15
  const intSample = Math.max(-1, Math.min(1, sample)) * 32767
  bgmBuffer.writeInt16LE(intSample, 44 + i * 2)
}

fs.writeFileSync(path.join(AUDIO_DIR, 'bgm_main.wav'), bgmBuffer)
console.log(`✅ bgm_main.wav       - 背景音乐 (30 秒循环)`)

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✨ 所有音频资源生成完成！')
console.log(`📁 输出目录：${AUDIO_DIR}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📋 下一步操作:')
console.log('1. 刷新浏览器 (Ctrl+Shift+R)')
console.log('2. 测试游戏音效')
console.log('3. 享受完整游戏体验！🎮\n')
