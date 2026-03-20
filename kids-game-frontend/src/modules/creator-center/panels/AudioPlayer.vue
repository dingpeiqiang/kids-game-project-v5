<template>
  <div class="audio-player">
    <el-card shadow="hover" class="player-card">
      <!-- 播放器头部 -->
      <div class="player-header">
        <div class="audio-info">
          <div class="audio-name">{{ audio.alias }}</div>
          <div class="audio-meta">
            <span class="audio-key">{{ audio.key }}</span>
            <span class="audio-separator">|</span>
            <span class="audio-duration">{{ formatDuration(audio.duration) }}</span>
          </div>
        </div>

        <!-- 播放/暂停按钮 -->
        <el-button
          :type="isPlaying ? 'danger' : 'primary'"
          circle
          :icon="isPlaying ? VideoPause : VideoPlay"
          @click="togglePlay"
        />
      </div>

      <!-- 波形可视化 -->
      <div class="waveform-container">
        <canvas ref="canvasRef" class="waveform-canvas"></canvas>
      </div>

      <!-- 进度条 -->
      <div class="progress-container">
        <el-slider
          v-model="progress"
          :max="audio.duration || 100"
          :show-tooltip="false"
          @change="handleSeek"
        />
        <div class="time-display">
          <span>{{ formatDuration(currentTime) }}</span>
          <span class="separator">/</span>
          <span>{{ formatDuration(audio.duration) }}</span>
        </div>
      </div>

      <!-- 音量控制 -->
      <div class="volume-container">
        <el-icon><VideoPlay /></el-icon>
        <el-slider
          v-model="audio.volume"
          :min="0"
          :max="1"
          :step="0.1"
          :show-tooltip="false"
          @input="handleVolumeChange"
        />
        <span class="volume-value">{{ Math.round(audio.volume * 100) }}%</span>
      </div>

      <!-- 循环播放 -->
      <div class="loop-container">
        <el-checkbox v-model="isLooping">
          <el-icon><RefreshRight /></el-icon>
          循环播放
        </el-checkbox>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { VideoPlay, VideoPause, RefreshRight } from '@element-plus/icons-vue'

interface Props {
  audio: {
    key: string
    alias: string
    src: string
    volume: number
    duration: number
  }
  index: number
}

const props = defineProps<Props>()

// 音频元素
const audioElement = ref<HTMLAudioElement | null>(null)

// 播放状态
const isPlaying = ref(false)
const currentTime = ref(0)
const progress = ref(0)
const isLooping = ref(false)

// 波形画布
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 音频上下文（用于可视化）
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animationId: number | null = null

// ========== 方法 ==========

// 初始化音频
const initAudio = () => {
  audioElement.value = new Audio(props.audio.src)
  
  // 确保音量设置正确，如果 volume 为 0 则使用默认值 0.5
  const volume = props.audio.volume > 0 ? props.audio.volume : 0.5
  audioElement.value.volume = volume
  audioElement.value.muted = false
  
  console.log('初始化音频:', props.audio.key)
  console.log('音量设置:', audioElement.value.volume)
  
  audioElement.value.ontimeupdate = () => {
    if (audioElement.value) {
      currentTime.value = audioElement.value.currentTime
      progress.value = audioElement.value.currentTime
    }
  }

  audioElement.value.onended = () => {
    if (!isLooping.value) {
      isPlaying.value = false
    } else {
      audioElement.value?.play()
    }
  }

  audioElement.value.onerror = () => {
    console.error('音频播放失败:', props.audio.key)
    ElMessage.error(`音频播放失败：${props.audio.alias || props.audio.key}`)
    isPlaying.value = false
  }
}

// 播放/暂停
const togglePlay = () => {
  if (!audioElement.value) {
    initAudio()
  }

  if (isPlaying.value) {
    pauseAudio()
  } else {
    playAudio()
  }
}

// 播放
const playAudio = () => {
  if (audioElement.value) {
    console.log('开始播放音频:', props.audio.key)
    console.log('当前音量:', audioElement.value.volume)
    
    audioElement.value.play().catch(err => {
      console.error('播放失败:', err)
      ElMessage.error('播放失败，请检查音频文件')
      isPlaying.value = false
    })
    isPlaying.value = true

    // 初始化音频可视化
    initAudioVisualization()
  }
}

// 暂停
const pauseAudio = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    isPlaying.value = false

    // 停止可视化动画
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }
}

// 跳转
const handleSeek = (value: number) => {
  if (audioElement.value) {
    audioElement.value.currentTime = value
  }
}

// 音量变化
const handleVolumeChange = (value: number) => {
  if (audioElement.value) {
    audioElement.value.volume = value
  }
}

// 格式化时间
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 初始化音频可视化
const initAudioVisualization = () => {
  if (!audioElement.value || !canvasRef.value) return

  try {
    // 创建音频上下文
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // 创建媒体源
    const source = audioContext.createMediaElementSource(audioElement.value)

    // 创建分析器
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256

    // 连接节点
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    // 开始绘制波形
    drawWaveform()
  } catch (error) {
    console.error('音频可视化初始化失败：', error)
  }
}

// 绘制波形
const drawWaveform = () => {
  if (!canvasRef.value || !analyser) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  // 绘制函数
  const draw = () => {
    animationId = requestAnimationFrame(draw)

    // 获取频率数据
    analyser.getByteFrequencyData(dataArray)

    // 清空画布
    ctx.fillStyle = '#f5f7fa'
    ctx.fillRect(0, 0, width, height)

    // 绘制波形
    const barWidth = (width / bufferLength) * 2.5
    let barHeight
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * height

      // 渐变色
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
      gradient.addColorStop(0, '#409eff')
      gradient.addColorStop(1, '#67c23a')

      ctx.fillStyle = gradient
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }
  }

  draw()
}

// ========== 生命周期 ==========

onMounted(() => {
  // 初始化画布尺寸
  if (canvasRef.value) {
    canvasRef.value.width = canvasRef.value.offsetWidth
    canvasRef.value.height = 100
  }
})

onUnmounted(() => {
  // 清理音频资源
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }

  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (audioContext) {
    audioContext.close()
  }
})

// ========== 监听 ==========

// 监听音量变化
watch(
  () => props.audio.volume,
  (newValue) => {
    if (audioElement.value) {
      audioElement.value.volume = newValue
    }
  }
)
</script>

<style scoped lang="scss">
.audio-player {
  margin-bottom: 20px;
}

.player-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.audio-info {
  flex: 1;
  margin-right: 16px;

  .audio-name {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 4px;
  }

  .audio-meta {
    font-size: 12px;
    color: #909399;

    .audio-key {
      font-family: monospace;
    }

    .audio-separator {
      margin: 0 8px;
    }

    .audio-duration {
      color: #409eff;
    }
  }
}

.waveform-container {
  width: 100%;
  height: 100px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;

  .waveform-canvas {
    width: 100%;
    height: 100%;
  }
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .time-display {
    font-size: 12px;
    color: #606266;
    min-width: 100px;
    text-align: center;

    .separator {
      margin: 0 4px;
      color: #909399;
    }
  }
}

.volume-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .volume-value {
    min-width: 40px;
    font-size: 12px;
    color: #606266;
    text-align: center;
  }
}

.loop-container {
  :deep(.el-checkbox__label) {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
  }
}
</style>
