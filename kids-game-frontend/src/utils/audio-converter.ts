/**
 * 音频格式转换工具
 * 支持 WebM/WAV 转 MP3
 * 
 * ⭐ 使用说明：
 * - 需要安装 lamejs: npm install lamejs --save
 * - 如果转换失败，会自动降级使用原始格式
 */

import { Mp3Encoder } from 'lamejs'

export interface AudioConvertOptions {
  /** 比特率 (kbps)，默认 128 */
  bitrate?: number
  /** 采样率，默认保持原采样率 */
  sampleRate?: number
}

/**
 * 将 AudioBuffer 转换为 MP3 Blob
 * @param audioBuffer AudioBuffer
 * @param options 转换选项
 * @returns MP3 Blob
 */
export async function audioBufferToMp3(
  audioBuffer: AudioBuffer,
  options: AudioConvertOptions = {}
): Promise<Blob> {
  const {
    bitrate = 128,
    sampleRate = audioBuffer.sampleRate
  } = options

  try {
    // 重采样到目标采样率（如果需要）
    const resampledBuffer = await resampleAudioBuffer(audioBuffer, sampleRate)
    
    // 获取左右声道数据
    const leftChannel = resampledBuffer.getChannelData(0)
    const rightChannel = resampledBuffer.numberOfChannels > 1 
      ? resampledBuffer.getChannelData(1) 
      : leftChannel

    // 将浮点数转换为 16 位整数
    const leftInt16 = floatTo16BitPCM(leftChannel)
    const rightInt16 = floatTo16BitPCM(rightChannel)

    // ⭐ 创建 MP3 编码器
    // 注意：lamejs 在某些环境下可能有兼容性问题
    const mp3encoder = new Mp3Encoder(
      resampledBuffer.numberOfChannels,  // 声道数 (1=单声道，2=立体声)
      sampleRate,                        // 采样率 (Hz)
      bitrate                            // 比特率 (kbps)
    )

    // 分块编码
    const mp3Data: Uint8Array[] = []
    const blockSize = 1152 // MP3 帧大小
    
    for (let i = 0; i < leftInt16.length; i += blockSize) {
      const leftBlock = leftInt16.subarray(i, i + blockSize)
      const rightBlock = rightInt16.subarray(i, i + blockSize)
      
      const mp3Block = mp3encoder.encodeBuffer(leftBlock, rightBlock)
      if (mp3Block.length > 0) {
        mp3Data.push(mp3Block)
      }
    }

    // 刷新编码器缓冲区
    const mp3Tail = mp3encoder.flush()
    if (mp3Tail.length > 0) {
      mp3Data.push(mp3Tail)
    }

    // 合并所有数据块
    const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0)
    const mp3Bytes = new Uint8Array(totalLength)
    let offset = 0
    for (const block of mp3Data) {
      mp3Bytes.set(block, offset)
      offset += block.length
    }

    console.log('✅ MP3 编码成功，大小:', mp3Bytes.length, 'bytes')
    return new Blob([mp3Bytes], { type: 'audio/mpeg' })
  } catch (error) {
    console.error('❌ MP3 编码失败:', error)
    throw error
  }
}

/**
 * 重采样 AudioBuffer
 */
async function resampleAudioBuffer(
  audioBuffer: AudioBuffer,
  targetSampleRate: number
): Promise<AudioBuffer> {
  const sourceRate = audioBuffer.sampleRate
  
  // 如果采样率相同，直接返回
  if (sourceRate === targetSampleRate) {
    return audioBuffer
  }

  // 使用 OfflineAudioContext 进行重采样
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length * (targetSampleRate / sourceRate),
    targetSampleRate
  )

  const source = offlineContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineContext.destination)
  source.start()

  return await offlineContext.startRendering()
}

/**
 * 将 Float32Array 转换为 16 位 PCM
 */
function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    // 限制范围在 [-1, 1]
    const clamped = Math.max(-1, Math.min(1, float32Array[i]))
    // 转换为 16 位整数
    int16Array[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
  }
  return int16Array
}

/**
 * 将 Blob 转换为 AudioBuffer
 */
export async function blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const audioContext = new AudioContext()
  const arrayBuffer = await blob.arrayBuffer()
  return await audioContext.decodeAudioData(arrayBuffer)
}

/**
 * 将 WebM/WAV Blob 转换为 MP3 Blob
 */
export async function convertBlobToMp3(
  blob: Blob,
  options: AudioConvertOptions = {}
): Promise<Blob> {
  const audioBuffer = await blobToAudioBuffer(blob)
  return await audioBufferToMp3(audioBuffer, options)
}
