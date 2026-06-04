<template>
  <el-dialog
    v-model="visible"
    title="图片DIY制作"
    width="900px"
    :close-on-click-modal="false"
    class="image-diy-dialog"
    @close="handleClose"
  >
    <div class="image-diy-panel">
      <!-- 左侧工具栏 -->
      <div class="diy-toolbar">
        <div class="toolbar-section">
          <h4 class="section-title">基础操作</h4>
          <div class="tool-buttons">
            <el-button size="small" @click="triggerFileSelect">
              <el-icon><Upload /></el-icon>
              上传图片
            </el-button>
            <el-button size="small" @click="createBlankCanvas">
              <el-icon><Plus /></el-icon>
              新建画布
            </el-button>
          </div>
        </div>

        <div class="toolbar-section">
          <h4 class="section-title">形状绘制</h4>
          <div class="tool-buttons">
            <el-button 
              size="small" 
              :type="currentTool === 'rect' ? 'primary' : ''"
              @click="setTool('rect')"
            >
              <el-icon><Crop /></el-icon>
              矩形
            </el-button>
            <el-button 
              size="small" 
              :type="currentTool === 'circle' ? 'primary' : ''"
              @click="setTool('circle')"
            >
              <el-icon><CircleCheck /></el-icon>
              圆形
            </el-button>
            <el-button 
              size="small" 
              :type="currentTool === 'line' ? 'primary' : ''"
              @click="setTool('line')"
            >
              <el-icon><Minus /></el-icon>
              线条
            </el-button>
            <el-button 
              size="small" 
              :type="currentTool === 'text' ? 'primary' : ''"
              @click="setTool('text')"
            >
              <el-icon><ChatLineRound /></el-icon>
              文字
            </el-button>
          </div>
        </div>

        <div class="toolbar-section">
          <h4 class="section-title">颜色设置</h4>
          <div class="color-picker-row">
            <div class="color-item">
              <span class="color-label">填充色</span>
              <el-color-picker v-model="fillColor" size="small" />
            </div>
            <div class="color-item">
              <span class="color-label">边框色</span>
              <el-color-picker v-model="strokeColor" size="small" />
            </div>
          </div>
          <div class="stroke-width-row">
            <span class="setting-label">边框粗细</span>
            <el-slider v-model="strokeWidth" :min="1" :max="20" :step="1" size="small" />
          </div>
        </div>

        <div class="toolbar-section">
          <h4 class="section-title">文字设置</h4>
          <div class="text-settings">
            <el-input 
              v-model="textContent" 
              placeholder="输入文字内容" 
              size="small"
              :disabled="currentTool !== 'text'"
            />
            <div class="font-settings">
              <el-select v-model="fontSize" size="small" style="width: 80px">
                <el-option label="12px" :value="12" />
                <el-option label="16px" :value="16" />
                <el-option label="20px" :value="20" />
                <el-option label="24px" :value="24" />
                <el-option label="32px" :value="32" />
                <el-option label="48px" :value="48" />
              </el-select>
              <el-color-picker v-model="textColor" size="small" />
            </div>
          </div>
        </div>

        <div class="toolbar-section">
          <h4 class="section-title">操作</h4>
          <div class="tool-buttons">
            <el-button size="small" @click="undo" :disabled="historyIndex <= 0">
              <el-icon><RefreshLeft /></el-icon>
              撤销
            </el-button>
            <el-button size="small" @click="redo" :disabled="historyIndex >= history.length - 1">
              <el-icon><RefreshRight /></el-icon>
              重做
            </el-button>
            <el-button size="small" type="danger" plain @click="clearCanvas">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>

        <div class="toolbar-section">
          <h4 class="section-title">预设模板</h4>
          <div class="template-grid">
            <div 
              v-for="template in presetTemplates" 
              :key="template.name"
              class="template-item"
              @click="applyTemplate(template)"
            >
              <div class="template-preview" :style="{ background: template.bgColor }">
                <span :style="{ color: template.textColor, fontSize: '12px' }">
                  {{ template.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧画布区域 -->
      <div class="diy-canvas-area">
        <div class="canvas-container" ref="canvasContainerRef">
          <canvas 
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          ></canvas>
          <div v-if="!hasImage" class="canvas-placeholder">
            <el-icon :size="48"><Picture /></el-icon>
            <p>点击"上传图片"或"新建画布"开始制作</p>
          </div>
        </div>

        <!-- 画布尺寸设置 -->
        <div class="canvas-settings">
          <span class="setting-label">画布尺寸:</span>
          <el-input-number v-model="canvasWidth" :min="100" :max="800" :step="10" size="small" />
          <span class="dimension-separator">×</span>
          <el-input-number v-model="canvasHeight" :min="100" :max="600" :step="10" size="small" />
          <el-button size="small" @click="resizeCanvas">应用</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          <el-icon><Check /></el-icon>
          保存图片
        </el-button>
      </div>
    </template>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Upload,
  Plus,
  CircleCheck,
  Minus,
  ChatLineRound,
  RefreshLeft,
  RefreshRight,
  Delete,
  Check,
  Picture,
  Crop
} from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  defaultWidth?: number
  defaultHeight?: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', blob: Blob, dataUrl: string): void
}

const props = withDefaults(defineProps<Props>(), {
  defaultWidth: 400,
  defaultHeight: 300
})

const emit = defineEmits<Emits>()

// 对话框可见性
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 画布相关
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasContainerRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const canvasWidth = ref(props.defaultWidth)
const canvasHeight = ref(props.defaultHeight)
const hasImage = ref(false)

// 绘图工具
const currentTool = ref<'rect' | 'circle' | 'line' | 'text' | null>(null)
const fillColor = ref('#409EFF')
const strokeColor = ref('#333333')
const strokeWidth = ref(2)

// 文字设置
const textContent = ref('')
const textColor = ref('#333333')
const fontSize = ref(24)

// 绘图状态
const isDrawing = ref(false)
const startX = ref(0)
const startY = ref(0)
const currentShape: any = ref(null)

// 历史记录
const history = ref<ImageData[]>([])
const historyIndex = ref(-1)
const saving = ref(false)

// 预设模板
const presetTemplates = [
  { name: '游戏按钮', bgColor: '#4ECDC4', textColor: '#FFFFFF', borderRadius: 8 },
  { name: '警告提示', bgColor: '#FFE66D', textColor: '#333333', borderRadius: 4 },
  { name: '错误提示', bgColor: '#FF6B6B', textColor: '#FFFFFF', borderRadius: 4 },
  { name: '成功提示', bgColor: '#95E1D3', textColor: '#2C5F2D', borderRadius: 4 },
  { name: '深色主题', bgColor: '#2C3E50', textColor: '#ECF0F1', borderRadius: 0 },
  { name: '浅色主题', bgColor: '#F8F9FA', textColor: '#343A40', borderRadius: 4 },
]

// 获取画布上下文
const getContext = (): CanvasRenderingContext2D | null => {
  const canvas = canvasRef.value
  if (!canvas) return null
  return canvas.getContext('2d')
}

// 保存历史记录
const saveHistory = () => {
  const ctx = getContext()
  if (!ctx) return
  
  // 删除当前索引之后的历史记录
  history.value = history.value.slice(0, historyIndex.value + 1)
  
  // 添加新的历史记录
  const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
  history.value.push(imageData)
  historyIndex.value++
  
  // 限制历史记录数量
  if (history.value.length > 20) {
    history.value.shift()
    historyIndex.value--
  }
}

// 撤销
const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    const ctx = getContext()
    if (ctx) {
      ctx.putImageData(history.value[historyIndex.value], 0, 0)
    }
  }
}

// 重做
const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    const ctx = getContext()
    if (ctx) {
      ctx.putImageData(history.value[historyIndex.value], 0, 0)
    }
  }
}

// 设置工具
const setTool = (tool: 'rect' | 'circle' | 'line' | 'text') => {
  currentTool.value = tool
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      // 调整画布大小以适应图片
      canvasWidth.value = Math.min(img.width, 600)
      canvasHeight.value = Math.min(img.height, 450)
      
      nextTick(() => {
        const ctx = getContext()
        if (ctx) {
          ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
          ctx.drawImage(img, 0, 0, canvasWidth.value, canvasHeight.value)
          hasImage.value = true
          saveHistory()
        }
      })
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
  
  // 清空文件输入
  target.value = ''
}

// 创建空白画布
const createBlankCanvas = () => {
  nextTick(() => {
    const ctx = getContext()
    if (ctx) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
      hasImage.value = true
      saveHistory()
    }
  })
}

// 调整画布大小
const resizeCanvas = () => {
  nextTick(() => {
    const ctx = getContext()
    if (ctx) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
      saveHistory()
    }
  })
}

// 清空画布
const clearCanvas = () => {
  const ctx = getContext()
  if (ctx) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
    saveHistory()
  }
}

// 应用模板
const applyTemplate = (template: any) => {
  nextTick(() => {
    const ctx = getContext()
    if (ctx) {
      // 填充背景
      ctx.fillStyle = template.bgColor
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
      
      // 绘制示例文字
      ctx.fillStyle = template.textColor
      ctx.font = `bold ${fontSize.value}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(template.name, canvasWidth.value / 2, canvasHeight.value / 2)
      
      hasImage.value = true
      saveHistory()
    }
  })
}

// 鼠标事件处理
const handleMouseDown = (e: MouseEvent) => {
  if (!currentTool.value) {
    ElMessage.warning('请先选择绘图工具')
    return
  }

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  startX.value = e.clientX - rect.left
  startY.value = e.clientY - rect.top
  isDrawing.value = true

  // 如果是文字工具，直接添加文字
  if (currentTool.value === 'text' && textContent.value) {
    const ctx = getContext()
    if (ctx) {
      ctx.fillStyle = textColor.value
      ctx.font = `${fontSize.value}px Arial`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(textContent.value, startX.value, startY.value)
      saveHistory()
    }
    isDrawing.value = false
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value || !currentTool.value || currentTool.value === 'text') return

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top

  // 恢复上一个状态
  if (historyIndex.value >= 0) {
    const ctx = getContext()
    if (ctx) {
      ctx.putImageData(history.value[historyIndex.value], 0, 0)
      drawShape(ctx, startX.value, startY.value, currentX, currentY, currentTool.value)
    }
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (!isDrawing.value || !currentTool.value || currentTool.value === 'text') return

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const endX = e.clientX - rect.left
  const endY = e.clientY - rect.top

  const ctx = getContext()
  if (ctx) {
    drawShape(ctx, startX.value, startY.value, endX, endY, currentTool.value)
    saveHistory()
  }

  isDrawing.value = false
}

// 绘制形状
const drawShape = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tool: string
) => {
  ctx.fillStyle = fillColor.value
  ctx.strokeStyle = strokeColor.value
  ctx.lineWidth = strokeWidth.value

  switch (tool) {
    case 'rect':
      const width = x2 - x1
      const height = y2 - y1
      ctx.fillRect(x1, y1, width, height)
      ctx.strokeRect(x1, y1, width, height)
      break
    case 'circle':
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      ctx.beginPath()
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      break
    case 'line':
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      break
  }
}

// 保存图片
const handleSave = () => {
  const canvas = canvasRef.value
  if (!canvas) {
    ElMessage.error('画布未初始化')
    return
  }

  saving.value = true
  try {
    // 转换为 blob
    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        const dataUrl = canvas.toDataURL('image/png')
        emit('save', blob, dataUrl)
        ElMessage.success('图片制作完成')
        handleClose()
      } else {
        ElMessage.error('保存失败')
      }
      saving.value = false
    }, 'image/png')
  } catch (error) {
    ElMessage.error('保存失败：' + (error as Error).message)
    saving.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  // 重置状态
  hasImage.value = false
  currentTool.value = null
  history.value = []
  historyIndex.value = -1
}

// 监听对话框打开
watch(visible, (newVal) => {
  if (newVal) {
    // 对话框打开时初始化空白画布
    nextTick(() => {
      createBlankCanvas()
    })
  }
})
</script>

<style scoped lang="scss">
.image-diy-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.image-diy-panel {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.diy-toolbar {
  width: 250px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  max-height: 550px;
}

.toolbar-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.tool-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .el-button {
    flex: 1;
    min-width: 80px;
  }
}

.color-picker-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.color-label {
  font-size: 12px;
  color: #606266;
}

.stroke-width-row,
.text-settings {
  margin-top: 12px;
}

.setting-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  display: block;
}

.font-settings {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.template-item {
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    transform: scale(1.02);
  }
}

.template-preview {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.diy-canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.canvas-container {
  flex: 1;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-height: 400px;

  canvas {
    background: white;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    cursor: crosshair;
  }
}

.canvas-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

.canvas-settings {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;

  .dimension-separator {
    color: #909399;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
