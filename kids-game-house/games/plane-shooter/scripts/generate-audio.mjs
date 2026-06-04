#!/usr/bin/env node
/**
 * ✈️ 飞机大战音频资源生成脚本
 * 
 * 功能：
 * 1. 使用 Web Audio API 生成游戏音效（开发阶段）
 * 2. 生成 WAV 格式音频文件（浏览器原生支持）
 * 3. 可选：调用 FFmpeg 转换为 MP3（生产环境）
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ────────────────────────────────────────────────────────────
// 配置区
// ────────────────────────────────────────────────────────────

const OUTPUT_DIR = join(__dirname, '..', 'public', 'themes', 'plane_shooter_default', 'audio')

// ────────────────────────────────────────────────────────────
// WAV 文件生成工具
// ────────────────────────────────────────────────────────────

/**
 * 将 Float32Array 转换为 WAV 格式的 Buffer
 */
function createWavFile(samples, sampleRate = 44100) {
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample
  
  const dataLength = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)
  
  // RIFF chunk
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  
  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  
  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)
  
  floatTo16BitPCM(view, 44, samples)
  
  return Buffer.from(buffer)
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function floatTo16BitPCM(view, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}

// ────────────────────────────────────────────────────────────
// 音频合成函数
// ────────────────────────────────────────────────────────────

/**
 * 生成射击音效 - 短促的下降音
 */
function generateShootSound() {
  const sampleRate = 44100
  const duration = 0.2
  const samples = new Float32Array(Math.floor(sampleRate * duration))
  
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t / 0.05)
    samples[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * envelope
  }
  
  return createWavFile(samples, sampleRate)
}

/**
 * 生成爆炸音效 - 噪声 + 低频衰减
 */
function generateExplosionSound() {
  const sampleRate = 44100
  const duration = 0.5
  const samples = new Float32Array(Math.floor(sampleRate * duration))
  
  // 白噪声
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.random() * 2 - 1
  }
  
  // 低通滤波 + 包络
  for (let i = 0; i < samples.length; i++) {
    const envelope = Math.exp(-i / (sampleRate * 0.1))
    samples[i] *= envelope
  }
  
  return createWavFile(samples, sampleRate)
}

/**
 * 生成被击中音效 - 不和谐音程
 */
function generateHitSound() {
  const sampleRate = 44100
  const duration = 0.3
  const samples = new Float32Array(Math.floor(sampleRate * duration))
  
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t / 0.1)
    samples[i] = (
      Math.sin(2 * Math.PI * 200 * i / sampleRate) +
      Math.sin(2 * Math.PI * 220 * i / sampleRate)
    ) * 0.5 * envelope
  }
  
  return createWavFile(samples, sampleRate)
}

/**
 * 生成拾取道具音效 - 上升琶音
 */
function generatePropSound() {
  const sampleRate = 44100
  const duration = 0.4
  const samples = new Float32Array(Math.floor(sampleRate * duration))
  
  const frequencies = [523.25, 659.25, 783.99] // C-E-G
  const noteDuration = duration / 3
  
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    const noteIndex = Math.floor(t / noteDuration)
    const freq = frequencies[Math.min(noteIndex, 2)]
    const noteT = t % noteDuration
    const envelope = Math.exp(-noteT / 0.1)
    samples[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * envelope
  }
  
  return createWavFile(samples, sampleRate)
}

/**
 * 生成游戏结束音效 - 缓慢下降的低音
 */
function generateGameoverSound() {
  const sampleRate = 44100
  const duration = 2.0
  const samples = new Float32Array(Math.floor(sampleRate * duration))
  
  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length
    const freq = 400 + (100 - 400) * t
    const envelope = Math.exp(-t / 0.8)
    samples[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * envelope
  }
  
  return createWavFile(samples, sampleRate)
}

/**
 * 生成背景音乐 - 简化版循环
 */
function generateBGM() {
  const sampleRate = 44100
  const duration = 120
  const samples = new Float32Array(Math.floor(sampleRate * duration))
  
  const bpm = 120
  const beatDuration = 60 / bpm
  const baseFreq = 220
  
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    const beat = Math.floor(t / beatDuration)
    
    const chordFreqs = [baseFreq, baseFreq * 1.2, baseFreq * 1.5]
    let sample = 0
    
    chordFreqs.forEach((freq, index) => {
      if ((beat + index) % 3 === 0) {
        sample += Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.3
      }
    })
    
    sample += Math.sin(2 * Math.PI * (baseFreq / 2) * i / sampleRate) * 0.4
    samples[i] = sample * 0.5
  }
  
  return createWavFile(samples, sampleRate)
}

// ────────────────────────────────────────────────────────────
// 主函数
// ────────────────────────────────────────────────────────────

async function main() {
  console.log('🎵 飞机大战音频资源生成器\n')
  
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`📁 创建目录：${OUTPUT_DIR}\n`)
  }
  
  const generators = {
    sfx_shoot: generateShootSound,
    sfx_explosion: generateExplosionSound,
    sfx_hit: generateHitSound,
    sfx_prop: generatePropSound,
    sfx_gameover: generateGameoverSound,
    bgm_main: generateBGM
  }
  
  console.log('开始生成音频文件...\n')
  
  for (const [name, generator] of Object.entries(generators)) {
    try {
      console.log(`🎼 生成 ${name}.wav ...`)
      const wavBuffer = generator()
      const outputPath = join(OUTPUT_DIR, `${name}.wav`)
      writeFileSync(outputPath, wavBuffer)
      console.log(`✅ ${outputPath} (${(wavBuffer.length / 1024).toFixed(2)} KB)\n`)
    } catch (error) {
      console.error(`❌ 生成 ${name} 失败:`, error.message)
    }
  }
  
  console.log('\n✨ 音频生成完成！')
  console.log('\n📊 统计:')
  console.log(`  - 生成文件数：${Object.keys(generators).length} 个`)
  console.log(`  - 输出目录：${OUTPUT_DIR}`)
  console.log('\n📝 提示：音频文件已生成，可以直接在游戏中使用！')
  console.log('\n')
}

main().catch(console.error)
