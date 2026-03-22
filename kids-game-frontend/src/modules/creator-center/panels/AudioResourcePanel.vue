<template>
  <div class="audio-resource-panel">
    <!-- 面板局部 JSON 模式 -->
    <template v-if="props.panelJsonMode">
      <el-card shadow="hover" class="resource-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">🔊 音频资源</span>
            <el-button size="small" type="primary" plain @click="emit('toggleJsonMode')">
              <el-icon><Edit /></el-icon>
              切换表单
            </el-button>
          </div>
        </template>
        <div class="card-toolbar">
          <el-button size="small" @click="formatJson" :disabled="!!jsonError">
            <el-icon><Document /></el-icon>
            格式化
          </el-button>
          <el-tag v-if="jsonError" type="danger" size="small">{{ jsonError }}</el-tag>
          <el-tag v-else type="success" size="small">格式正确</el-tag>
        </div>
        <el-input
          v-model="jsonContent"
          type="textarea"
          :rows="25"
          placeholder="请输入音频资源 JSON"
          class="json-textarea"
          @input="handleJsonInput"
        />
      </el-card>
    </template>

    <!-- 表单模式 -->
    <template v-else>
      <el-card shadow="hover" class="resource-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">🔊 音频资源</span>
            <el-button size="small" type="info" plain @click="emit('toggleJsonMode')">
              <el-icon><Document /></el-icon>
              JSON
            </el-button>
          </div>
        </template>

        <!-- 严格显示：只显示 configJson 中实际存在的音频分类 -->
        <el-tabs v-if="availableCategories.length > 0" v-model="activeCategory" type="border-card">
          <el-tab-pane
            v-for="category in availableCategories"
            :key="category.key"
            :label="`${category.label} (${category.count})`"
            :name="category.key"
          >
            <!-- 音频列表 -->
            <div v-if="Object.keys(category.items).length > 0" class="audio-list">
              <div v-for="(item, key) in category.items" :key="key" class="audio-item">
                <div class="audio-preview">
                  <button
                    v-if="item.src"
                    class="play-btn"
                    @click="togglePlay(item, `${category.key}.${key}`)"
                  >
                    {{ playingKey === `${category.key}.${key}` ? '⏸️ 暂停' : '▶️ 播放' }}
                  </button>
                  <span v-else class="no-audio">待上传</span>
                </div>
                <div class="audio-info">
                  <div class="info-row">
                    <span class="info-label">Key:</span>
                    <span class="info-value key-value">{{ key }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">别名:</span>
                    <el-input
                      v-model="category.items[key].alias"
                      placeholder="请输入别名"
                      size="small"
                      style="flex: 1"
                      @change="handleItemUpdate(category.key, key, category.items[key])"
                    />
                  </div>
                  <div class="info-row">
                    <span class="info-label">格式:</span>
                    <span class="info-value">{{ item.type || getFormatFromSrc(item.src) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">音量:</span>
                    <el-slider
                      v-model="category.items[key].volume"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      style="flex: 1"
                      :disabled="!item.src"
                      @change="handleVolumeChange(category.key, key, category.items[key].volume)"
                    />
                    <span class="volume-text">{{ Math.round((item.volume || 0) * 100) }}%</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">地址:</span>
                    <span class="info-value src-value" :class="{ empty: !item.src }">
                      {{ item.src ? '已设置' : '待上传' }}
                    </span>
                  </div>
                </div>
                <div class="audio-actions">
                  <!-- 上传音频按钮 -->
                  <el-button
                    size="small"
                    type="primary"
                    :loading="uploading[`${category.key}.${key}`]"
                    @click="selectAudio(category.key, key)"
                  >
                    {{ uploading[`${category.key}.${key}`] ? '上传中...' : '上传音频' }}
                  </el-button>

                  <!-- 录音按钮：打开录音面板 -->
                  <el-button
                    size="small"
                    type="success"
                    plain
                    :disabled="recordingKey === `${category.key}.${key}`"
                    @click="startRecording(category.key, key)"
                  >
                    <el-icon><Microphone /></el-icon>
                    {{ recordingKey === `${category.key}.${key}` ? '录音中...' : (item.src ? '🔄 重新录音' : '🎤 录音') }}
                  </el-button>

                  <!-- 删除功能已禁用 -->
                  <!-- <el-button
                    v-if="item.src"
                    size="small"
                    type="danger"
                    plain
                    @click="deleteAudio(category.key, key)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button> -->
                </div>
              </div>
            </div>

            <!-- 无音频 -->
            <el-empty v-else description="该分类下无音频资源" />
          </el-tab-pane>
        </el-tabs>

        <!-- 无音频资源 -->
        <el-empty v-else description="该主题无音频资源" />

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInputRef"
          type="file"
          accept="audio/*"
          style="display: none"
          @change="handleFileSelect"
        />
      </el-card>

      <!-- 录音编辑对话框 -->
      <el-dialog
        v-model="recordDialogVisible"
        title="🎤 音频录制"
        width="600px"
        :close-on-click-modal="false"
        :append-to-body="true"
      >
        <div class="record-dialog-content">
          <!-- 录音信息 -->
          <div class="record-info">
            <el-tag type="info" size="large">{{ currentRecordItemName }}</el-tag>
          </div>

          <!-- 录音状态 -->
          <div class="record-status">
            <div v-if="recordingKey" class="recording-active">
              <span class="recording-indicator">🔴</span>
              <span class="recording-text">录音中...</span>
              <span class="recording-time">{{ formatRecordingTime(recordingDuration) }}</span>
            </div>
            <div v-else-if="previewAudioUrl" class="recording-ready">
              <span class="recording-indicator">✅</span>
              <span class="recording-text">录音完成</span>
              <span class="recording-time">{{ formatRecordingTime(recordingDuration) }}</span>
            </div>
            <div v-else class="recording-idle">
              <span class="recording-text">准备录音</span>
            </div>
          </div>

          <!-- 音频波形可视化 -->
          <div class="waveform-container">
            <div class="waveform-label">
              {{ recordingKey ? '🔴 录音中 - 实时音量' : (audioWaveform.length > 0 ? '📊 音频波形' : '📊 波形将在这里显示') }}
            </div>
            <div class="waveform-wrapper" style="position: relative;">
              <div class="waveform"
                @mousedown="onWaveformMouseDown"
                @mousemove="onWaveformMouseMove"
                @mouseup="onWaveformMouseUp"
                @mouseleave="onWaveformMouseUp"
              >
                <div
                  v-for="(value, index) in (audioWaveform.length > 0 ? audioWaveform : Array(50).fill(0.05))"
                  :key="index"
                  class="waveform-bar"
                  :class="{ 'recording-active': recordingKey }"
                  :style="{ height: `${Math.max(5, value * 100)}%` }"
                ></div>
              </div>
              <!-- 截取选择覆盖层 -->
              <div v-if="isTrimming && totalAudioDuration > 0" class="trim-overlay">
                <div
                  class="trim-handle trim-handle-left"
                  :style="{ left: `${(trimStartTime / totalAudioDuration) * 100}%` }"
                  @mousedown.stop="startDragging('left', $event)"
                >
                  <div class="trim-handle-bar"></div>
                  <span class="trim-time">{{ formatTime(trimStartTime) }}</span>
                </div>
                <div
                  class="trim-selection"
                  :style="{
                    left: `${(trimStartTime / totalAudioDuration) * 100}%`,
                    width: `${((trimEndTime - trimStartTime) / totalAudioDuration) * 100}%`
                  }"
                >
                  <span class="trim-duration">{{ formatTime(trimEndTime - trimStartTime) }}</span>
                </div>
                <div
                  class="trim-handle trim-handle-right"
                  :style="{ left: `${(trimEndTime / totalAudioDuration) * 100}%` }"
                  @mousedown.stop="startDragging('right', $event)"
                >
                  <div class="trim-handle-bar"></div>
                  <span class="trim-time">{{ formatTime(trimEndTime) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 音频播放器 -->
          <div v-if="previewAudioUrl" class="audio-player-section">
            <audio
              ref="audioPreviewRef"
              :src="previewAudioUrl"
              controls
              preload="auto"
              @loadedmetadata="onAudioLoadedMetadata"
              @loadeddata="onAudioLoadedData"
              @canplay="onAudioCanPlay"
              @canplaythrough="onAudioCanPlayThrough"
              @ended="onAudioEnded"
              @play="onAudioPlay"
              @pause="onAudioPause"
              @error="onAudioError"
              @waiting="onAudioWaiting"
              @playing="onAudioPlaying"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="record-actions">
            <!-- 录音阶段 -->
            <template v-if="!previewAudioUrl">
              <el-button
                v-if="!recordingKey"
                type="danger"
                size="large"
                @click="startRecordingInDialog"
              >
                <el-icon><Microphone /></el-icon>
                开始录音
              </el-button>
              <el-button
                v-else
                type="warning"
                size="large"
                @click="stopRecordingInDialog"
              >
                <el-icon><VideoPause /></el-icon>
                停止录音
              </el-button>
            </template>

            <!-- 编辑阶段 -->
            <template v-else>
              <el-button
                type="primary"
                @click="playPreviewAudio"
              >
                <el-icon>
                  <component :is="isPlaying ? VideoPause : 'VideoPlay'" />
                </el-icon>
                {{ isPlaying ? '暂停' : '播放' }}
              </el-button>

              <el-button
                type="warning"
                @click="rerecord"
              >
                <el-icon><Microphone /></el-icon>
                重新录音
              </el-button>

              <el-button
                v-if="!isTrimming"
                type="info"
                @click="enterTrimMode"
              >
                <el-icon><Edit /></el-icon>
                截取音频
              </el-button>

              <!-- 截取模式按钮 -->
              <template v-if="isTrimming">
                <el-button
                  type="primary"
                  @click="previewTrimmedAudio"
                >
                  <el-icon><VideoPlay /></el-icon>
                  预览截取
                </el-button>
                <el-button
                  type="success"
                  @click="confirmTrim"
                >
                  <el-icon><Check /></el-icon>
                  确认截取
                </el-button>
                <el-button
                  type="danger"
                  plain
                  @click="exitTrimMode"
                >
                  <el-icon><Close /></el-icon>
                  取消截取
                </el-button>
              </template>

              <el-button
                type="success"
                @click="confirmUploadRecording"
                :loading="uploading[`${currentRecordCategory.value}.${currentRecordKey.value}`]"
              >
                <el-icon><Check /></el-icon>
                确认上传
              </el-button>
            </template>

            <el-button
              type="info"
              plain
              @click="cancelRecordingPreview"
            >
              <el-icon><Close /></el-icon>
              取消
            </el-button>
          </div>
        </div>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Edit, Delete, Microphone, VideoPause, VideoPlay, Check, Close } from '@element-plus/icons-vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'
import { unifiedUploadService } from '@/services/unified-upload.service'
import AudioDebug from '@/utils/audio-debug'
// ⭐ 后端已支持自动转码，无需前端转换

interface Props {
  modelValue: GTRSTheme
  isDirty: boolean
  panelJsonMode: boolean  // 面板局部 JSON 模式
}

interface Emits {
  (e: 'update:modelValue', value: GTRSTheme): void
  (e: 'update:isDirty', value: boolean): void
  (e: 'toggleJsonMode'): void  // 切换面板 JSON 模式
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// JSON 模式相关 - 使用 ref 保存用户输入，初始值从 modelValue 派生
const jsonContent = ref('')
const jsonError = ref<string | null>(null)

// 初始化 jsonContent
const initJsonContent = () => {
  jsonContent.value = JSON.stringify(props.modelValue.resources?.audio || {}, null, 2)
}

// 监听 panelJsonMode 变化
watch(
  () => props.panelJsonMode,
  (isJsonMode) => {
    if (!isJsonMode) {
      // 退出 JSON 模式时，重新从 modelValue 初始化
      initJsonContent()
    }
  }
)

// 组件挂载时初始化
initJsonContent()

// 运行音频系统诊断
AudioDebug.runFullDiagnostic()

// 分类标签映射
const CATEGORY_LABELS: Record<string, string> = {
  bgm: '背景音乐',
  effect: '音效',
  voice: '语音'
}

// 当前分类
const activeCategory = ref('')

// 播放状态
const playingKey = ref<string | null>(null)
const currentAudio = ref<HTMLAudioElement | null>(null)

// 文件选择目标
const currentSelectKey = ref<string | null>(null)
const currentSelectCategory = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 上传状态
const uploading = ref<Record<string, boolean>>({})

// 录音相关
const recordingKey = ref<string | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
let recordedChunks: Blob[] = []  // 非响应式，避免 Vue 代理问题
let previewAudioUrlValue: string = ''  // 非响应式，用于直接操作 DOM
const previewAudioBlob = ref<Blob | null>(null)
const previewAudioUrl = ref<string>('')
const audioPreviewVisible = ref(false)
const currentPreviewAudio = ref<HTMLAudioElement | null>(null)
const audioPreviewRef = ref<HTMLAudioElement | null>(null)
const recordingDuration = ref<number>(0)
const recordingTimer = ref<number | null>(null)
const audioWaveform = ref<number[]>([])
const isPlaying = ref(false)

// 音频截取相关
const isTrimming = ref(false)  // 是否在截取模式
const trimStartTime = ref(0)  // 截取起始时间（秒）
const trimEndTime = ref(0)  // 截取结束时间（秒）
const totalAudioDuration = ref(0)  // 音频总时长
const isDraggingHandle = ref<'left' | 'right' | null>(null)  // 当前拖动的手柄

// 分类标签映射
const getCategoryLabel = (key: string) => CATEGORY_LABELS[key] || key

// 格式化录音时间
const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化时间为 MM:SS.ms 格式
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`
}

// 计算属性：只显示实际存在的分类
const availableCategories = computed(() => {
  const audios = props.modelValue?.resources?.audio || {}
  const result: Array<{
    key: string
    label: string
    count: number
    items: Record<string, any>
  }> = []

  for (const [categoryKey, categoryValue] of Object.entries(audios)) {
    if (categoryValue && typeof categoryValue === 'object') {
      const items: Record<string, any> = {}
      for (const [itemKey, itemValue] of Object.entries(categoryValue)) {
        if (itemValue && typeof itemValue === 'object') {
          items[itemKey] = itemValue
        }
      }

      if (Object.keys(items).length > 0) {
        result.push({
          key: categoryKey,
          label: getCategoryLabel(categoryKey),
          count: Object.keys(items).length,
          items
        })
      }
    }
  }

  return result
})

// 获取音频的完整 URL
const getAudioUrl = (path: string): string => {
  if (!path) return ''

  // Base64 直接返回
  if (path.startsWith('data:')) {
    return path
  }

  // 已经是完整 URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // 相对路径转换为完整 URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return path.startsWith('/resources/') ? `${baseUrl}${path}` : `${window.location.origin}${path}`
}

// 从 src URL 提取格式（扩展名）
const getFormatFromSrc = (src: string): string => {
  if (!src) return '未知'
  
  // 处理查询参数，先去掉
  const cleanSrc = src.split('?')[0]
  const extension = cleanSrc.split('.').pop()?.toLowerCase()
  
  // 常见的音频格式映射
  const formatMap: Record<string, string> = {
    'mp3': 'mp3',
    'wav': 'wav',
    'ogg': 'ogg',
    'webm': 'webm',
    'm4a': 'm4a',
    'flac': 'flac',
    'aac': 'aac'
  }
  
  return formatMap[extension || ''] || extension || '未知'
}

// ========== 录音功能 ==========

// 录音对话框相关状态
const recordDialogVisible = ref(false)
const currentRecordCategory = ref<string>('')
const currentRecordKey = ref<string>('')
const currentRecordItemName = ref<string>('')

// 开始录音
const startRecording = async (category: string, key: string) => {
  const item = props.modelValue.resources.audio[category][key]

  // 保存当前录音的目标信息
  currentRecordCategory.value = category
  currentRecordKey.value = key
  currentRecordItemName.value = `${getCategoryLabel(category)} - ${key}${item.alias ? ` (${item.alias})` : ''}`

  // 打开录音对话框
  recordDialogVisible.value = true

  // 如果已有音频，提示用户
  if (item.src) {
    ElMessage.warning('重新录音将替换原音频')
  }
}

// 在录音对话框中开始录音
const startRecordingInDialog = async () => {
  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 检测支持的 MIME 类型
    const mimeType = getSupportedMimeType()

    // 重置数据块
    recordedChunks = []
    recordingDuration.value = 0
    audioWaveform.value = []

    console.log('使用 MIME 类型:', mimeType)

    // 实时音量监控
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(stream)
    microphone.connect(analyser)
    analyser.fftSize = 256
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let volumeAnimationId: number | null = null

    // 实时显示音量
    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      // 更新波形显示
      audioWaveform.value.push(average / 255)
      if (audioWaveform.value.length > 50) {
        audioWaveform.value.shift()
      }
      volumeAnimationId = requestAnimationFrame(updateVolume)
    }

    // 创建 MediaRecorder
    mediaRecorder.value = new MediaRecorder(stream, {
      mimeType: mimeType || undefined
    })

    // 收集数据块
    mediaRecorder.value.ondataavailable = (event) => {
      console.log('收到数据块，大小:', event.data.size)
      if (event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    // 录音结束
    mediaRecorder.value.onstop = async () => {
      // 停止音量监控
      if (volumeAnimationId) {
        cancelAnimationFrame(volumeAnimationId)
      }

      console.log('录音结束，数据块数量:', recordedChunks.length)
      console.log('数据块大小:', recordedChunks.map(c => c.size))

      // 使用实际录制时的 MIME 类型
      const actualMimeType = mediaRecorder.value?.mimeType || 'audio/webm'
      const blob = new Blob(recordedChunks, { type: actualMimeType })

      previewAudioBlob.value = blob

      console.log('Blob 大小:', blob.size, '类型:', actualMimeType)

      // 诊断 Blob
      AudioDebug.diagnoseBlob(blob)

      // 如果 blob 大小太小，说明可能没有录到声音
      if (blob.size < 1000) {
        console.warn('⚠️ Blob 大小过小，可能没有录到声音')
        ElMessage.warning('录音数据过小，请确保麦克风已连接并对着麦克风说话')
      }

      // 测试音频解码
      const testResult = await AudioDebug.testAudioPlayback(blob)
      if (!testResult.success) {
        ElMessage.error(`音频解码失败: ${testResult.error}`)
        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop())
        audioContext.close()
        return
      }

      // 分析波形
      await analyzeWaveform(blob)

      // 停止所有音频轨道
      stream.getTracks().forEach(track => track.stop())
      audioContext.close()

      // 停止计时器
      if (recordingTimer.value) {
        clearInterval(recordingTimer.value)
        recordingTimer.value = null
      }

      // 创建 blob URL
      const blobUrl = URL.createObjectURL(blob)
      previewAudioUrl.value = blobUrl
      previewAudioUrlValue = blobUrl

      console.log('Blob URL:', blobUrl)

      // 等待 DOM 更新
      await nextTick()

      // 直接设置 audio 元素的 src
      if (audioPreviewRef.value) {
        audioPreviewRef.value.src = blobUrl
        audioPreviewRef.value.load()
        console.log('Audio 元素 src 已设置')
      } else {
        console.warn('Audio ref 为空，延迟设置')
        setTimeout(() => {
          if (audioPreviewRef.value) {
            audioPreviewRef.value.src = blobUrl
            audioPreviewRef.value.load()
          }
        }, 200)
      }

      ElMessage.success('录音完成，可以试听或重新录音')
    }

    // 开始录音 - 不使用 timeslice，让它一次性收集
    mediaRecorder.value.start()
    recordingKey.value = `${currentRecordCategory.value}.${currentRecordKey.value}`

    // 开始音量监控
    updateVolume()

    // 开始计时
    recordingTimer.value = window.setInterval(() => {
      recordingDuration.value++
    }, 1000)

    ElMessage.info('开始录音...请对着麦克风说话')

    // 5秒后检查是否真的在录音
    setTimeout(() => {
      if (recordedChunks.length === 0 && mediaRecorder.value?.state === 'recording') {
        ElMessage.warning('尚未收到录音数据，请检查麦克风是否正常工作')
      }
    }, 5000)
  } catch (error: any) {
    console.error('录音失败:', error)
    ElMessage.error(`无法访问麦克风：${error.message}`)
  }
}

// 获取支持的 MIME 类型
const getSupportedMimeType = (): string | null => {
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/mp4;codecs=aac',
    'audio/ogg',
    'audio/ogg;codecs=opus',
    'audio/wav',
    'audio/mpeg'
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('支持的 MIME 类型:', type)
      return type
    }
  }

  console.warn('没有找到支持的 MIME 类型')
  return null
}

// 分析音频波形
const analyzeWaveform = async (blob: Blob) => {
  try {
    const audioContext = new AudioContext()

    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // 获取音频数据
      const channelData = audioBuffer.getChannelData(0)
      const sampleSize = 100 // 采样点数
      const blockSize = Math.floor(channelData.length / sampleSize)

      const waveform: number[] = []
      for (let i = 0; i < sampleSize; i++) {
        let sum = 0
        const start = i * blockSize
        const end = start + blockSize

        for (let j = start; j < end && j < channelData.length; j++) {
          sum += Math.abs(channelData[j])
        }

        waveform.push(sum / blockSize)
      }

      // 归一化
      const max = Math.max(...waveform)
      audioWaveform.value = waveform.map(v => (max > 0 ? v / max : 0))

      console.log('波形分析完成，采样点数:', audioBuffer.length, '采样率:', audioBuffer.sampleRate)
    } finally {
      // 确保 AudioContext 被关闭
      await audioContext.close()
    }
  } catch (error: any) {
    console.error('波形分析失败:', error)
    ElMessage.warning(`波形分析失败：${error.message}`)

    // 使用随机波形作为 fallback
    audioWaveform.value = Array(100).fill(0).map(() => Math.random() * 0.5)
  }
}

// 停止录音
const stopRecordingInDialog = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    console.log('停止录音，已收集数据块数:', recordedChunks.length)
    mediaRecorder.value.stop()
    recordingKey.value = null
  }
}

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

    // ⭐ 简化：直接上传 WebM，后端会自动转换为 MP3
    const file = new File(
      [previewAudioBlob.value],
      `recording_${Date.now()}.webm`,
      { type: previewAudioBlob.value.type }
    )

    console.log('🎵 上传音频到后端服务器，文件名:', file.name, '类型:', file.type)

    // 上传到服务器（后端会自动转 MP3）
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

    // ⭐ 后端已转换 MP3，type 直接设为 mp3
    categoryData[key] = {
      ...categoryData[key],
      src: result.url,
      type: 'mp3'
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

    ElMessage.success(oldAudio.src ? '录音上传成功（后端已自动转为 MP3）' : '录音上传成功')
  } catch (error: any) {
    console.error('录音上传失败:', error)
    ElMessage.error(`上传失败：${error.message || '未知错误'}`)
  } finally {
    uploading.value[uploadKey] = false
  }
}

// 取消录音预览
const cancelRecordingPreview = () => {
  audioPreviewVisible.value = false
  recordDialogVisible.value = false

  // 停止 AudioContext 播放
  stopAudioContextPlayback()

  // 清理 blob URL
  if (previewAudioUrl.value) {
    URL.revokeObjectURL(previewAudioUrl.value)
  }

  previewAudioUrl.value = ''
  previewAudioBlob.value = null
  audioWaveform.value = []
  recordingDuration.value = 0
  isPlaying.value = false

  // 停止并清理 audio 元素
  if (audioPreviewRef.value) {
    audioPreviewRef.value.pause()
    audioPreviewRef.value.src = ''
  }

  // 清理计时器
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }

  // 清理录音器
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }
}

// ==================== 音频截取功能 ====================

// 波形点击 - 进入/退出截取模式
const onWaveformMouseDown = (e: MouseEvent) => {
  if (isTrimming.value || !previewAudioBlob.value) return
  // 如果点击的是手柄，不处理
  if ((e.target as HTMLElement).closest('.trim-handle')) return
}

// 开始拖动手柄
const startDragging = (handle: 'left' | 'right', e: MouseEvent) => {
  isDraggingHandle.value = handle
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', stopDragging)
  e.preventDefault()
}

// 拖动中
const onDragging = (e: MouseEvent) => {
  if (!isDraggingHandle.value || !totalAudioDuration.value) return

  const waveformEl = document.querySelector('.waveform') as HTMLElement
  if (!waveformEl) return

  const rect = waveformEl.getBoundingClientRect()
  const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const time = percentage * totalAudioDuration.value

  if (isDraggingHandle.value === 'left') {
    trimStartTime.value = Math.min(time, trimEndTime.value - 0.1)
    trimStartTime.value = Math.max(0, trimStartTime.value)
  } else {
    trimEndTime.value = Math.max(time, trimStartTime.value + 0.1)
    trimEndTime.value = Math.min(totalAudioDuration.value, trimEndTime.value)
  }
}

// 停止拖动
const onWaveformMouseUp = () => {
  if (isDraggingHandle.value) {
    stopDragging()
  }
}

const stopDragging = () => {
  isDraggingHandle.value = null
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', stopDragging)
}

const onWaveformMouseMove = (e: MouseEvent) => {
  // 可以在这里添加悬停效果
}

// 进入截取模式
const enterTrimMode = async () => {
  if (!previewAudioBlob.value) {
    ElMessage.warning('请先录音')
    return
  }

  try {
    // 解码音频获取实际时长
    const ctx = new AudioContext()
    const arrayBuffer = await previewAudioBlob.value.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    const actualDuration = audioBuffer.duration
    ctx.close()

    if (actualDuration <= 0 || !isFinite(actualDuration)) {
      ElMessage.warning('无法获取音频时长')
      return
    }

    // 重置截取范围为全部
    totalAudioDuration.value = actualDuration
    trimStartTime.value = 0
    trimEndTime.value = actualDuration
    isTrimming.value = true
    console.log('进入截取模式，时长:', actualDuration)
  } catch (error) {
    console.error('获取音频时长失败:', error)
    ElMessage.error('无法解析音频文件')
  }
}

// 退出截取模式
const exitTrimMode = () => {
  isTrimming.value = false
}

// 预览截取后的音频
const previewTrimmedAudio = async () => {
  if (!previewAudioBlob.value) return

  try {
    // 停止当前播放
    if (isPlaying.value) {
      stopAudioContextPlayback()
      isPlaying.value = false
    }

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

    // 播放截取后的音频
    const source = ctx.createBufferSource()
    source.buffer = trimmedBuffer
    source.connect(ctx.destination)
    source.start(0)
    isPlaying.value = true

    source.onended = () => {
      isPlaying.value = false
      ctx.close()
    }
  } catch (error) {
    console.error('预览截取失败:', error)
    ElMessage.error('预览截取失败')
  }
}

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

    // 转换为 WAV Blob（使用已有的 audioBufferToWav 函数）
    const wavBlob = audioBufferToWav(trimmedBuffer)

    // 更新预览音频
    if (previewAudioUrl.value) {
      URL.revokeObjectURL(previewAudioUrl.value)
    }
    const newUrl = URL.createObjectURL(wavBlob)
    previewAudioUrl.value = newUrl
    previewAudioUrlValue = newUrl
    previewAudioBlob.value = wavBlob

    // 更新波形
    await analyzeWaveform(wavBlob)

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

    ElMessage.success('音频截取成功')
    ctx.close()
  } catch (error) {
    console.error('截取失败:', error)
    ElMessage.error('截取失败')
  }
}

// 将 AudioBuffer 转换为 WAV Blob
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const dataLength = buffer.length * blockAlign
  const bufferLength = 44 + dataLength

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, bufferLength - 8, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Write samples
  const channels: Float32Array[] = []
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]))
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

const writeString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

// 试听预览 - 使用 AudioContext 播放，更可靠
let audioContext: AudioContext | null = null
let audioSource: AudioBufferSourceNode | null = null

const playPreviewAudio = async () => {
  // 检查是否有录音数据
  if (!previewAudioBlob.value) {
    ElMessage.warning('请先录音')
    return
  }

  // 如果正在播放，则暂停
  if (isPlaying.value) {
    stopAudioContextPlayback()
    isPlaying.value = false
    return
  }

  try {
    console.log('开始 AudioContext 播放...')

    // 关闭之前的 AudioContext
    if (audioContext) {
      await audioContext.close()
    }

    // 创建新的 AudioContext
    audioContext = new AudioContext()
    console.log('AudioContext 创建成功，当前状态:', audioContext.state)

    // 解码音频数据
    console.log('开始解码音频数据...')
    const arrayBuffer = await previewAudioBlob.value.arrayBuffer()
    console.log('ArrayBuffer 大小:', arrayBuffer.byteLength)

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    console.log('音频解码成功!')
    console.log('  - 时长:', audioBuffer.duration, '秒')
    console.log('  - 采样率:', audioBuffer.sampleRate)
    console.log('  - 声道数:', audioBuffer.numberOfChannels)

    // 创建音频源
    audioSource = audioContext.createBufferSource()
    audioSource.buffer = audioBuffer

    // 连接节点：source -> destination
    audioSource.connect(audioContext.destination)
    console.log('音频节点连接成功')

    // 播放结束回调
    audioSource.onended = () => {
      console.log('音频播放结束')
      isPlaying.value = false
    }

    // 开始播放
    console.log('开始播放...')
    audioSource.start(0)
    isPlaying.value = true
    console.log('✅ 音频播放成功')

  } catch (error: any) {
    console.error('❌ 播放失败:', error)
    console.error('错误消息:', error.message)

    if (audioContext) {
      await audioContext.close()
      audioContext = null
    }

    // 如果 AudioContext 失败，回退到 HTMLAudioElement
    console.log('回退到 HTMLAudioElement 方案...')
    await fallbackToAudioElement()
  }
}

// 停止 AudioContext 播放
const stopAudioContextPlayback = () => {
  if (audioSource) {
    try {
      audioSource.stop()
    } catch (e) {
      // 忽略已停止的错误
    }
    audioSource.disconnect()
    audioSource = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
}

// 回退方案：使用 HTMLAudioElement
const fallbackToAudioElement = async () => {
  try {
    console.log('使用 HTMLAudioElement 回退方案...')

    // 如果音频元素没有 src，设置它
    if (audioPreviewRef.value && previewAudioUrl.value) {
      audioPreviewRef.value.src = previewAudioUrl.value
      audioPreviewRef.value.volume = 1.0
      audioPreviewRef.value.muted = false

      // 等待元数据加载
      await new Promise<void>((resolve, reject) => {
        const audio = audioPreviewRef.value!
        const onLoadedMetadata = () => {
          audio.removeEventListener('loadedmetadata', onLoadedMetadata)
          console.log('HTMLAudioElement 元数据加载完成，时长:', audio.duration)
          resolve()
        }
        const onError = () => {
          audio.removeEventListener('error', onError)
          reject(new Error('音频加载失败'))
        }
        audio.addEventListener('loadedmetadata', onLoadedMetadata)
        audio.addEventListener('error', onError)
        setTimeout(() => {
          audio.removeEventListener('loadedmetadata', onLoadedMetadata)
          audio.removeEventListener('error', onError)
          resolve()
        }, 2000)
      })

      await audioPreviewRef.value.play()
      isPlaying.value = true
      console.log('✅ HTMLAudioElement 播放成功')
    } else {
      ElMessage.error('无法播放音频')
    }
  } catch (error: any) {
    console.error('回退方案也失败:', error)
    ElMessage.error('音频播放失败')
    isPlaying.value = false
  }
}

// 音频播放事件
const onAudioEnded = () => {
  console.log('音频播放结束')
  isPlaying.value = false
}

const onAudioPlay = () => {
  console.log('音频开始播放')
  isPlaying.value = true
}

const onAudioPause = () => {
  console.log('音频暂停')
  isPlaying.value = false
}

const onAudioLoadedMetadata = () => {
  console.log('音频元数据已加载')
  if (audioPreviewRef.value) {
    // 确保音量设置为最大
    audioPreviewRef.value.volume = 1.0
    audioPreviewRef.value.muted = false
    // 设置音频总时长和初始截取范围
    // 注意：WebM/Opus 格式可能返回 Infinity，使用实际的 audioBuffer 时长
    let duration = audioPreviewRef.value.duration
    if (!isFinite(duration) || duration <= 0) {
      // 如果时长无效，在解码后更新
      console.warn('音频元素时长无效，将在使用 AudioContext 解码后更新')
    } else {
      totalAudioDuration.value = duration
      trimStartTime.value = 0
      trimEndTime.value = duration
    }
    console.log('元数据 - 时长:', audioPreviewRef.value.duration, '音量:', audioPreviewRef.value.volume)
  }
}

const onAudioLoadedData = () => {
  console.log('音频数据已加载')
  if (audioPreviewRef.value) {
    console.log('数据加载完成 - readyState:', audioPreviewRef.value.readyState)
  }
}

const onAudioCanPlay = () => {
  console.log('音频可以播放')
  if (audioPreviewRef.value) {
    console.log('canplay - readyState:', audioPreviewRef.value.readyState)
  }
}

const onAudioCanPlayThrough = () => {
  console.log('音频可以连续播放')
  if (audioPreviewRef.value) {
    console.log('canplaythrough - readyState:', audioPreviewRef.value.readyState)
  }
}

const onAudioWaiting = () => {
  console.log('音频等待更多数据')
}

const onAudioPlaying = () => {
  console.log('音频正在播放')
}

const onAudioError = (event: Event) => {
  const audio = event.target as HTMLAudioElement
  const error = audio.error
  console.error('音频播放错误:')
  console.error('  - error code:', error?.code)
  console.error('  - error message:', error?.message)

  let errorMessage = '音频播放错误'
  switch (error?.code) {
    case 1:
      errorMessage = '音频加载被中止'
      break
    case 2:
      errorMessage = '音频加载失败，请检查网络'
      break
    case 3:
      errorMessage = '音频解码失败，可能格式不支持'
      break
    case 4:
      errorMessage = '音频资源不支持或不存在'
      break
    default:
      errorMessage = `音频播放错误：${error?.message || '未知错误'}`
  }

  ElMessage.error(errorMessage)
  isPlaying.value = false
}

// 重新录音
const rerecord = async () => {
  // 停止 AudioContext 播放
  stopAudioContextPlayback()

  // 清理旧的 blob URL
  if (previewAudioUrl.value) {
    URL.revokeObjectURL(previewAudioUrl.value)
  }

  // 清理旧的录音
  previewAudioUrl.value = ''
  previewAudioBlob.value = null
  audioWaveform.value = []
  recordingDuration.value = 0
  isPlaying.value = false

  // 停止并清理 audio 元素
  if (audioPreviewRef.value) {
    audioPreviewRef.value.pause()
    audioPreviewRef.value.src = ''
  }

  ElMessage.info('请点击"开始录音"按钮重新录音')
}

// 删除音频
const deleteAudio = async (category: string, key: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这段音频吗？', '确认删除', {
      type: 'warning'
    })

    const item = props.modelValue.resources.audio[category][key]
    if (item.src) {
      // 从服务器删除
      try {
        await unifiedUploadService.deleteResource(item.src)
      } catch (error) {
        console.error('删除服务器资源失败:', error)
      }
    }

    // 清除数据
    const audios = JSON.parse(JSON.stringify(props.modelValue.resources.audio))
    audios[category][key] = {
      ...audios[category][key],
      src: ''
    }

    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        audio: audios
      }
    })
    emit('update:isDirty', true)

    ElMessage.success('音频已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除音频失败:', error)
      ElMessage.error(`删除失败：${error.message || '未知错误'}`)
    }
  }
}

// ========== JSON 模式方法 ==========

// 处理 JSON 输入
const handleJsonInput = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        audio: parsed
      }
    })
    emit('update:isDirty', true)
    jsonError.value = null
  } catch (e: any) {
    jsonError.value = `JSON 解析错误: ${e.message}`
  }
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    const formatted = JSON.stringify(parsed, null, 2)
    jsonContent.value = formatted
    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        audio: parsed
      }
    })
    jsonError.value = null
    ElMessage.success('JSON 格式化成功')
  } catch (e: any) {
    jsonError.value = `格式化失败: ${e.message}`
  }
}

// ========== 表单模式方法 ==========

// 监听数据变化
watch(
  () => props.modelValue?.resources?.audio,
  () => {
    if (!activeCategory.value && availableCategories.value.length > 0) {
      activeCategory.value = availableCategories.value[0].key
    }
  },
  { immediate: true }
)

// 播放/暂停音频
const togglePlay = (item: any, key: string) => {
  if (playingKey.value === key && currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
    playingKey.value = null
    return
  }

  if (currentAudio.value) {
    currentAudio.value.pause()
  }

  if (item.src) {
    const audioUrl = getAudioUrl(item.src)
    currentAudio.value = new Audio(audioUrl)
    
    // 确保音量设置正确，默认使用配置的音量或 0.5
    const volume = item.volume || 0.5
    currentAudio.value.volume = volume > 0 ? volume : 0.5
    currentAudio.value.muted = false
    
    console.log('播放音频:', key)
    console.log('音频 URL:', audioUrl)
    console.log('音量设置:', currentAudio.value.volume)
    
    // 添加错误处理
    currentAudio.value.addEventListener('error', (e) => {
      console.error('音频播放错误:', e)
      ElMessage.error(`音频播放失败：${item.alias || key}`)
      playingKey.value = null
      currentAudio.value = null
    })
    
    currentAudio.value.play().catch(err => {
      console.error('播放失败:', err)
      ElMessage.error('播放失败，请检查音频文件')
      playingKey.value = null
      currentAudio.value = null
    })
    
    playingKey.value = key

    currentAudio.value.onended = () => {
      playingKey.value = null
      currentAudio.value = null
    }
  }
}

// 选择音频
const selectAudio = (category: string, key: string) => {
  currentSelectCategory.value = category
  currentSelectKey.value = key
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !currentSelectCategory.value || !currentSelectKey.value) return

  const category = currentSelectCategory.value
  const key = currentSelectKey.value
  const uploadKey = `${category}.${key}`

  try {
    uploading.value[uploadKey] = true

    // 上传到服务器
    const result = await unifiedUploadService.uploadAudio(file)

    // 更新数据
    const audios = JSON.parse(JSON.stringify(props.modelValue.resources.audio))
    const categoryData = audios[category]

    // 根据文件扩展名判断类型（更可靠），而不是依赖浏览器的 MIME type
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3'
    const audioType = ['mp3', 'wav', 'ogg', 'webm'].includes(extension) ? extension : 'mp3'

    categoryData[key] = {
      ...categoryData[key],
      src: result.url,
      type: audioType
    }

    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        audio: audios
      }
    })
    emit('update:isDirty', true)

    ElMessage.success(`音频上传成功：${file.name}`)
  } catch (error: any) {
    console.error('音频上传失败:', error)
    ElMessage.error(`音频上传失败：${error.message || '未知错误'}`)
  } finally {
    uploading.value[uploadKey] = false
    target.value = ''
  }
}

// 处理别名更新
const handleItemUpdate = (category: string, key: string, item: any) => {
  const audios = JSON.parse(JSON.stringify(props.modelValue.resources.audio))
  const categoryData = audios[category]

  categoryData[key] = {
    ...categoryData[key],
    alias: item.alias
  }

  emit('update:modelValue', {
    ...props.modelValue,
    resources: {
      ...props.modelValue.resources,
      audio: audios
    }
  })
  emit('update:isDirty', true)
}

// 处理音量变化
const handleVolumeChange = (category: string, key: string, volume: number) => {
  const audios = JSON.parse(JSON.stringify(props.modelValue.resources.audio))
  const categoryData = audios[category]

  categoryData[key] = {
    ...categoryData[key],
    volume
  }

  if (currentAudio.value && playingKey.value === `${category}.${key}`) {
    currentAudio.value.volume = volume
  }

  emit('update:modelValue', {
    ...props.modelValue,
    resources: {
      ...props.modelValue.resources,
      audio: audios
    }
  })
  emit('update:isDirty', true)
}

// 清理
onUnmounted(() => {
  // 停止 AudioContext 播放
  stopAudioContextPlayback()

  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
  }

  if (currentPreviewAudio.value) {
    currentPreviewAudio.value.pause()
    currentPreviewAudio.value = null
  }

  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }

  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }

  if (previewAudioUrl.value) {
    URL.revokeObjectURL(previewAudioUrl.value)
  }
})
</script>

<style scoped lang="scss">
.audio-resource-panel {
  max-width: 1200px;
  margin: 0 auto;
}

.resource-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-weight: bold;
      font-size: 16px;
    }
  }
}

.card-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.json-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    background: #1e1e1e;
    color: #d4d4d4;
    border: none;
    border-radius: 8px;
    padding: 16px;
  }
}

.audio-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audio-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  .audio-preview {
    width: 80px;

    .play-btn {
      width: 100%;
      padding: 8px;
      background: #409eff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .no-audio {
      display: block;
      text-align: center;
      color: #c0c4cc;
      font-size: 12px;
      padding: 8px;
    }
  }

  .audio-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .info-label {
        width: 50px;
        color: #909399;
      }

      .info-value {
        color: #303133;

        &.key-value {
          font-family: monospace;
          background: #e4e7ed;
          padding: 2px 6px;
          border-radius: 4px;
        }

        &.src-value {
          &.empty {
            color: #e6a23c;
          }
        }
      }

      .volume-text {
        width: 40px;
        text-align: right;
        color: #909399;
        font-size: 12px;
      }
    }
  }

  .audio-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.audio-preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding: 20px 0;

  .preview-audio-player {
    width: 100%;
    display: flex;
    justify-content: center;

    audio {
      width: 100%;
      max-width: 400px;
    }

    .no-audio {
      color: #c0c4cc;
      padding: 20px;
    }
  }

  .preview-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}

.record-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 10px 0;

  .record-info {
    display: flex;
    justify-content: center;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;
  }

  .record-status {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background: #1e1e1e;
    border-radius: 12px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;

    .recording-indicator {
      font-size: 24px;
      margin-right: 12px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .recording-text {
      margin-right: 16px;
    }

    .recording-time {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 24px;
      color: #67c23a;
    }

    &.recording-active {
      .recording-indicator {
        color: #f56c6c;
      }
    }

    &.recording-ready {
      .recording-indicator {
        color: #67c23a;
        animation: none;
      }
    }

    &.recording-idle {
      .recording-indicator {
        display: none;
      }
    }
  }

  .waveform-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .waveform-label {
      font-size: 14px;
      font-weight: bold;
      color: #606266;
    }

    .waveform {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 80px;
      gap: 2px;
      cursor: pointer;

      .waveform-bar {
        flex: 1;
        background: linear-gradient(to top, #409eff, #67c23a);
        border-radius: 2px;
        min-height: 4px;
        transition: height 0.05s;

        &.recording-active {
          background: linear-gradient(to top, #f56c6c, #e6a23c);
          animation: pulse-bar 0.3s ease-in-out infinite alternate;
        }
      }
    }

    // 截取覆盖层
    .trim-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;

      .trim-handle {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 16px;
        transform: translateX(-50%);
        cursor: ew-resize;
        pointer-events: auto;
        z-index: 10;

        .trim-handle-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 4px;
          left: 50%;
          transform: translateX(-50%);
          background: #409eff;
          border-radius: 2px;
          box-shadow: 0 0 4px rgba(64, 158, 255, 0.5);
        }

        .trim-time {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #409eff;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
        }

        &.trim-handle-left .trim-handle-bar {
          background: #67c23a;
          box-shadow: 0 0 4px rgba(103, 194, 58, 0.5);
        }

        &.trim-handle-left .trim-time {
          background: #67c23a;
        }

        &.trim-handle-right .trim-handle-bar {
          background: #f56c6c;
          box-shadow: 0 0 4px rgba(245, 108, 108, 0.5);
        }

        &.trim-handle-right .trim-time {
          background: #f56c6c;
        }

        &:hover .trim-handle-bar {
          width: 6px;
        }
      }

      .trim-selection {
        position: absolute;
        top: 0;
        bottom: 0;
        background: rgba(64, 158, 255, 0.2);
        border-left: 2px solid #409eff;
        border-right: 2px solid #f56c6c;
        pointer-events: none;

        .trim-duration {
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(64, 158, 255, 0.9);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
        }
      }
    }
  }

@keyframes pulse-bar {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}

.audio-player-section {
    display: flex;
    justify-content: center;

    audio {
      width: 100%;
      max-width: 500px;
    }
  }

  .record-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;

    .el-button {
      min-width: 100px;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}


</style>
