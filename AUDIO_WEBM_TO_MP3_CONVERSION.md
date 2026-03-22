# 录音格式 WebM 转 MP3 实现方案

## 问题分析
- **当前问题**：录音模式显示的格式为 `webm;codecs=opus`
- **浏览器限制**：浏览器的 MediaRecorder API 默认录制为 WebM/Opus 格式
- **需求**：需要自动转换为 MP3 格式，提高兼容性

## 解决方案

### 方案选择
1. **前端转换（推荐）**：使用 `lamejs` 库在浏览器中进行 MP3 编码
   - ✅ 优点：减轻服务器压力，即时转换
   - ✅ 优点：用户体验好，无需等待上传后再转换
   - ⚠️ 缺点：增加前端打包体积（约 20KB gzipped）

2. **后端转换**：上传后由服务器转换
   - ❌ 缺点：增加服务器负载
   - ❌ 缺点：需要额外的后端依赖（如 ffmpeg）
   - ❌ 缺点：用户体验差，需要等待

### 实施步骤

#### 步骤 1：安装 lamejs 依赖
```bash
cd kids-game-frontend
npm install lamejs
```

#### 步骤 2：添加类型定义
创建 `src/types/lamejs.d.ts`：
```typescript
declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number)
    encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array
    flush(): Uint8Array
  }
  
  export function getWaveHeader(buffer: AudioBuffer): ArrayBuffer
}
```

#### 步骤 3：实现音频转换工具
创建 `src/utils/audio-converter.ts`：

```typescript
/**
 * 音频格式转换工具
 * 支持 WebM/WAV 转 MP3
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

  // 创建 MP3 编码器
  const mp3encoder = new Mp3Encoder(
    resampledBuffer.numberOfChannels,
    sampleRate,
    bitrate
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

  return new Blob([mp3Bytes], { type: 'audio/mpeg' })
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

  // 使用 AudioContext 进行重采样
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
```

#### 步骤 4：修改 AudioResourcePanel.vue

##### 4.1 导入转换工具
```typescript
import { convertBlobToMp3 } from '@/utils/audio-converter'
```

##### 4.2 修改 confirmUploadRecording 函数
在上传前检测格式，如果是 WebM 则自动转换为 MP3：

```typescript
// 确认上传录音
const confirmUploadRecording = async () => {
  if (!previewAudioBlob.value || !currentRecordCategory.value || !currentRecordKey.value) {
    ElMessage.warning('请先录音')
    return
  }

  const category = currentRecordCategory.value
  const key = currentRecordKey.value
  const uploadKey = `${category}.${key}`
  const oldAudio = props.modelValue.resources.audio[category][key]

  try {
    uploading.value[uploadKey] = true

    // 检查是否需要转换为 MP3
    let finalBlob = previewAudioBlob.value
    let audioFormat = 'mp3' // 默认转为 MP3
    
    const originalMimeType = previewAudioBlob.value.type
    console.log('原始音频格式:', originalMimeType)
    
    // 如果是 WebM/Opus 格式，自动转换为 MP3
    if (originalMimeType.includes('webm') || originalMimeType.includes('opus')) {
      ElMessage.info('正在将 WebM 格式转换为 MP3...')
      
      try {
        finalBlob = await convertBlobToMp3(previewAudioBlob.value, {
          bitrate: 128, // 128kbps
          sampleRate: 44100 // 44.1kHz
        })
        
        console.log('WebM 转 MP3 成功，新格式:', finalBlob.type)
        ElMessage.success('格式转换成功')
      } catch (error) {
        console.error('WebM 转 MP3 失败:', error)
        ElMessage.warning('格式转换失败，使用原始格式上传')
        // 转换失败，使用原始格式
        finalBlob = previewAudioBlob.value
        audioFormat = 'webm'
      }
    } else {
      // 非 WebM 格式，根据实际类型确定格式
      const blobType = finalBlob.type.split('/')[1] || 'mp3'
      const formatMap: Record<string, string> = {
        'webm': 'webm',
        'wav': 'wav',
        'mp3': 'mp3',
        'ogg': 'ogg',
        'mpeg': 'mp3',
        'x-matroska': 'webm'
      }
      audioFormat = formatMap[blobType] || blobType || 'mp3'
    }
    
    // 将 Blob 转换为 File，使用实际的格式
    const file = new File(
      [finalBlob],
      `recording_${Date.now()}.${audioFormat}`,
      { type: finalBlob.type }
    )

    // 上传到服务器
    const result = await unifiedUploadService.uploadAudio(file)

    // 如果有旧音频，尝试删除服务器端的旧文件
    if (oldAudio.src) {
      try {
        await unifiedUploadService.deleteResource(oldAudio.src)
        console.log('已删除旧音频文件:', oldAudio.src)
      } catch (error) {
        console.warn('删除旧音频文件失败:', error)
        // 不阻止上传，继续执行
      }
    }

    // 更新数据（替换旧资源）
    const audios = JSON.parse(JSON.stringify(props.modelValue.resources.audio))
    const categoryData = audios[category]

    categoryData[key] = {
      ...categoryData[key],
      src: result.url,
      type: audioFormat
    }

    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        audio: audios
      }
    })
    emit('update:isDirty', true)

    // 关闭录音对话框
    recordDialogVisible.value = false
    audioPreviewVisible.value = false
    previewAudioUrl.value = ''
    previewAudioBlob.value = null
    audioWaveform.value = []
    recordingDuration.value = 0
    isPlaying.value = false

    // 清理计时器
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }

    ElMessage.success(oldAudio.src ? '录音上传成功（已自动转为 MP3）' : '录音上传成功')
  } catch (error: any) {
    console.error('录音上传失败:', error)
    ElMessage.error(`上传失败：${error.message || '未知错误'}`)
  } finally {
    uploading.value[uploadKey] = false
  }
}
```

##### 4.3 修改 confirmTrim 函数
截取后也转换为 MP3：

```typescript
// 确认截取
const confirmTrim = async () => {
  if (!previewAudioBlob.value) return

  try {
    // 创建 AudioContext
    const ctx = new AudioContext()
    const arrayBuffer = await previewAudioBlob.value.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

    // 计算截取范围
    const startSample = Math.floor(trimStartTime.value * audioBuffer.sampleRate)
    const endSample = Math.floor(trimEndTime.value * audioBuffer.sampleRate)
    const length = endSample - startSample

    // 验证截取范围
    if (length <= 0) {
      ElMessage.warning('请先调整截取范围')
      ctx.close()
      return
    }

    // 创建新的 AudioBuffer
    const trimmedBuffer = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      length,
      audioBuffer.sampleRate
    )

    // 复制截取的数据
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel)
      const destData = trimmedBuffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        destData[i] = sourceData[startSample + i]
      }
    }

    // 转换为 MP3 Blob（替代原来的 WAV）
    ElMessage.info('正在转换为 MP3 格式...')
    const mp3Blob = await audioBufferToMp3(trimmedBuffer, {
      bitrate: 128,
      sampleRate: 44100
    })

    // 更新预览音频
    if (previewAudioUrl.value) {
      URL.revokeObjectURL(previewAudioUrl.value)
    }
    const newUrl = URL.createObjectURL(mp3Blob)
    previewAudioUrl.value = newUrl
    previewAudioUrlValue = newUrl
    previewAudioBlob.value = mp3Blob

    // 更新波形
    await analyzeWaveform(mp3Blob)

    // 更新时长
    totalAudioDuration.value = trimmedBuffer.duration
    recordingDuration.value = Math.round(trimmedBuffer.duration)

    // 更新音频元素
    if (audioPreviewRef.value) {
      audioPreviewRef.value.src = newUrl
      audioPreviewRef.value.load()
    }

    // 退出截取模式
    isTrimming.value = false

    ElMessage.success('音频截取并转换为 MP3 成功')
    ctx.close()
  } catch (error) {
    console.error('截取失败:', error)
    ElMessage.error('截取失败')
  }
}
```

同时需要导入 `audioBufferToMp3` 函数：
```typescript
import { audioBufferToMp3, convertBlobToMp3 } from '@/utils/audio-converter'
```

## 测试验证

### 测试场景
1. **录音功能测试**
   - 录制一段音频
   - 验证是否自动转换为 MP3
   - 检查显示的格式是否为 `mp3`

2. **录音截取测试**
   - 录制音频后进行截取
   - 验证截取后是否转换为 MP3
   - 检查格式显示

3. **兼容性测试**
   - Chrome 浏览器
   - Firefox 浏览器
   - Safari 浏览器
   - Edge 浏览器

4. **性能测试**
   - 转换速度（应该在几秒内完成）
   - 文件大小变化
   - 音质对比

## 注意事项

### 1. 依赖管理
- `lamejs` 是 LGPL 许可，商业使用需注意
- 可以考虑使用 `lamejs-binary` 避免许可问题

### 2. 性能优化
- 对于长音频，转换可能较慢，需显示进度提示
- 可以考虑使用 Web Worker 避免阻塞 UI

### 3. 备用方案
- 如果转换失败，保留原始 WebM 格式作为降级
- 提供手动选择格式的选项

### 4. 后端配合
- 确保后端接受 MP3 格式
- 更新后端的 MIME 类型白名单
- 数据库字段类型存储为 `mp3`

## 预期效果

### 修改前
- 录音格式：`webm;codecs=opus`
- 截取后格式：`wav`
- 显示：`webm;codecs=opus` ❌

### 修改后
- 录音格式：`mp3` (MIME: `audio/mpeg`)
- 截取后格式：`mp3` (MIME: `audio/mpeg`)
- 显示：`mp3` ✅

## 相关文件
- `kids-game-frontend/src/utils/audio-converter.ts` - 新增音频转换工具
- `kids-game-frontend/src/types/lamejs.d.ts` - 新增类型定义
- `kids-game-frontend/src/modules/creator-center/panels/AudioResourcePanel.vue` - 修改录音逻辑
- `kids-game-frontend/package.json` - 添加 lamejs 依赖
