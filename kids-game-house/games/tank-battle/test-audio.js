/**
 * 测试音频文件是否可以被正确加载和解码
 * 在 Node.js 环境中使用 Web Audio API 模拟测试
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const AUDIO_DIR = path.join(__dirname, 'public', 'themes', 'tank_default', 'assets', 'audio')

console.log('🎵 音频文件测试工具\n')

// 检查所有音频文件
const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.wav'))

for (const file of files) {
  const filePath = path.join(AUDIO_DIR, file)
  const stats = fs.statSync(filePath)
  const buffer = fs.readFileSync(filePath)

  // 解析 WAV 头部
  const riff = buffer.slice(0, 4).toString()
  const wave = buffer.slice(8, 12).toString()
  const fmt = buffer.slice(12, 16).toString()
  const format = buffer.readUInt16LE(20)
  const channels = buffer.readUInt16LE(22)
  const sampleRate = buffer.readUInt32LE(24)
  const bits = buffer.readUInt16LE(34)
  const dataSize = buffer.readUInt32LE(40)

  // 计算期望的文件大小
  const expectedSize = 44 + dataSize
  const actualSize = buffer.length

  // 检查数据有效性
  let nonZeroSamples = 0
  let maxAmplitude = 0
  for (let i = 44; i < buffer.length - 1; i += 2) {
    const sample = buffer.readInt16LE(i)
    if (sample !== 0) nonZeroSamples++
    if (Math.abs(sample) > maxAmplitude) maxAmplitude = Math.abs(sample)
  }

  // 验证
  const checks = [
    { name: 'RIFF 标识', pass: riff === 'RIFF', value: riff },
    { name: 'WAVE 标识', pass: wave === 'WAVE', value: wave },
    { name: 'fmt  标识', pass: fmt === 'fmt ', value: fmt },
    { name: 'PCM 格式', pass: format === 1, value: format },
    { name: '单声道', pass: channels === 1, value: channels },
    { name: '44100Hz', pass: sampleRate === 44100, value: sampleRate },
    { name: '16位深度', pass: bits === 16, value: bits },
    { name: '文件大小', pass: actualSize === expectedSize, value: `${actualSize}/${expectedSize}` },
    { name: '有效样本', pass: nonZeroSamples > 0, value: nonZeroSamples },
    { name: '振幅正常', pass: maxAmplitude > 1000 && maxAmplitude < 30000, value: maxAmplitude }
  ]

  const allPass = checks.every(c => c.pass)

  console.log(`📄 ${file}`)
  console.log(`   大小: ${(stats.size / 1024).toFixed(2)} KB`)
  console.log(`   ${checks.map(c => `${c.pass ? '✅' : '❌'} ${c.name}: ${c.value}`).join('\n      ')}`)

  if (!allPass) {
    console.log(`   ⚠️  存在问题，建议重新生成`)
  }

  console.log()
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✨ 测试完成')
