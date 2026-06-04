<template>
  <div class="image-cropper-dialog">
    <el-dialog
      v-model="visible"
      title="🖼️ 图片裁剪"
      width="900px"
      :close-on-click-modal="false"
      @opened="onDialogOpened"
      @closed="onDialogClosed"
    >
      <div class="cropper-container">
        <!-- 左侧：裁剪区域 -->
        <div class="cropper-main">
          <div class="image-wrapper" ref="imageWrapperRef">
            <canvas ref="canvasRef"></canvas>
          </div>
        </div>

        <!-- 右侧：控制面板 -->
        <div class="cropper-controls">
          <!-- 预览区域 -->
          <div class="preview-section">
            <h4>实时预览</h4>
            <div class="preview-canvas">
              <canvas ref="previewCanvas"></canvas>
            </div>
            <div class="preview-info">
              <span>尺寸：{{ cropWidth }} x {{ cropHeight }} px</span>
            </div>
          </div>

          <!-- 裁剪设置 -->
          <div class="settings-section">
            <h4>裁剪设置</h4>
            
            <!-- 宽高比选择 -->
            <el-form label-width="80px" size="small">
              <el-form-item label="宽高比">
                <el-radio-group v-model="aspectRatio" @change="handleAspectRatioChange">
                  <el-radio-button :value="null">自由</el-radio-button>
                  <el-radio-button :value="16/9">16:9</el-radio-button>
                  <el-radio-button :value="4/3">4:3</el-radio-button>
                  <el-radio-button :value="1">1:1</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <!-- 旋转功能 -->
              <el-form-item label="旋转">
                <el-button-group>
                  <el-button size="small" @click="rotate(-90)">
                    <el-icon><RefreshLeft /></el-icon>
                    左转 90°
                  </el-button>
                  <el-button size="small" @click="rotate(90)">
                    <el-icon><RefreshRight /></el-icon>
                    右转 90°
                  </el-button>
                </el-button-group>
              </el-form-item>

              <!-- 缩放功能 -->
              <el-form-item label="缩放">
                <div class="scale-control">
                  <el-slider
                    v-model="zoom"
                    :min="0.1"
                    :max="3"
                    :step="0.1"
                    style="flex: 1; margin-right: 10px;"
                    @input="renderImage"
                  />
                  <el-input-number
                    v-model="zoom"
                    :min="0.1"
                    :max="3"
                    :step="0.1"
                    size="small"
                    style="width: 80px;"
                    @change="renderImage"
                  />
                </div>
              </el-form-item>

              <!-- 重置按钮 -->
              <el-form-item>
                <el-button @click="resetCropper" icon="RefreshLeft">
                  重置所有设置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm" :loading="cropping">
            <el-icon><Check /></el-icon>
            确认裁剪
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshLeft, RefreshRight, Check } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  imageUrl: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', croppedImage: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const imageWrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const cropping = ref(false)

// 图片相关
const imgElement = ref<HTMLImageElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

// 裁剪设置
const aspectRatio = ref<number | null>(null)
const zoom = ref(1)
const rotation = ref(0) // 旋转角度（度）

// 裁剪框相关
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const cropBox = ref({
  x: 0,
  y: 0,
  width: 200,
  height: 200
})

// 预览相关
const cropWidth = ref(0)
const cropHeight = ref(0)

// 画布尺寸
const canvasWidth = ref(600)
const canvasHeight = ref(400)

// 初始化
const onDialogOpened = async () => {
  await nextTick()
  initCanvas()
}

// 初始化画布
const initCanvas = () => {
  if (!canvasRef.value || !imageWrapperRef.value) return

  // 创建临时图片元素加载图片
  imgElement.value = new Image()
  imgElement.value.crossOrigin = 'anonymous'
  imgElement.value.src = props.imageUrl
  
  imgElement.value.onload = () => {
    // 计算合适的画布尺寸
    calculateCanvasSize()
    
    // 获取 2D 上下文
    ctx.value = canvasRef.value!.getContext('2d')
    
    // 初始化裁剪框
    initCropBox()
    
    // 渲染图片
    renderImage()
    
    // 绑定鼠标事件
    bindMouseEvents()
  }
  
  imgElement.value.onerror = () => {
    ElMessage.error('图片加载失败')
  }
}

// 计算画布尺寸
const calculateCanvasSize = () => {
  if (!imgElement.value || !imageWrapperRef.value) return
  
  const wrapper = imageWrapperRef.value
  const maxWidth = wrapper.clientWidth - 40
  const maxHeight = wrapper.clientHeight - 40
  
  const imgRatio = imgElement.value.width / imgElement.value.height
  
  if (maxWidth / maxHeight > imgRatio) {
    canvasHeight.value = maxHeight
    canvasWidth.value = maxHeight * imgRatio
  } else {
    canvasWidth.value = maxWidth
    canvasHeight.value = maxWidth / imgRatio
  }
  
  if (canvasRef.value) {
    canvasRef.value.width = canvasWidth.value
    canvasRef.value.height = canvasHeight.value
  }
}

// 初始化裁剪框
const initCropBox = () => {
  if (!canvasRef.value) return
  
  const size = Math.min(canvasWidth.value, canvasHeight.value) * 0.8
  cropBox.value = {
    x: (canvasWidth.value - size) / 2,
    y: (canvasHeight.value - size) / 2,
    width: size,
    height: size
  }
  
  updateCropSize()
}

// 更新裁剪尺寸显示
const updateCropSize = () => {
  if (!imgElement.value) return
  
  // 计算实际裁剪的图片尺寸
  const scaleX = imgElement.value.width / canvasWidth.value
  const scaleY = imgElement.value.height / canvasHeight.value
  
  cropWidth.value = Math.round(cropBox.value.width * scaleX)
  cropHeight.value = Math.round(cropBox.value.height * scaleY)
  
  updatePreview()
}

// 更新预览
const updatePreview = () => {
  if (!previewCanvas.value || !imgElement.value || !ctx.value) return
  
  const previewSize = 200
  previewCanvas.value.width = previewSize
  previewCanvas.value.height = previewSize
  
  const previewCtx = previewCanvas.value.getContext('2d')
  if (!previewCtx) return
  
  previewCtx.clearRect(0, 0, previewSize, previewSize)
  previewCtx.fillStyle = '#fff'
  previewCtx.fillRect(0, 0, previewSize, previewSize)
  
  // 计算裁剪区域在原始图片上的位置
  const scaleX = imgElement.value.width / canvasWidth.value
  const scaleY = imgElement.value.height / canvasHeight.value
  
  const sx = cropBox.value.x * scaleX
  const sy = cropBox.value.y * scaleY
  const sWidth = cropBox.value.width * scaleX
  const sHeight = cropBox.value.height * scaleY
  
  // 绘制到预览画布（保持比例）
  const destRatio = sWidth / sHeight
  let dWidth, dHeight, dx, dy
  
  if (destRatio > 1) {
    dWidth = previewSize
    dHeight = previewSize / destRatio
    dx = 0
    dy = (previewSize - dHeight) / 2
  } else {
    dHeight = previewSize
    dWidth = previewSize * destRatio
    dx = (previewSize - dWidth) / 2
    dy = 0
  }
  
  previewCtx.drawImage(
    imgElement.value,
    sx, sy, sWidth, sHeight,
    dx, dy, dWidth, dHeight
  )
}

// 对话框关闭后的回调
const onDialogClosed = () => {
  // 清理
  imgElement.value = null
  ctx.value = null
}

// 处理宽高比变化
const handleAspectRatioChange = () => {
  if (aspectRatio.value === null) {
    // 自由模式，不调整
    return
  }
  
  // 按新的宽高比调整裁剪框
  const currentCenterX = cropBox.value.x + cropBox.value.width / 2
  const currentCenterY = cropBox.value.y + cropBox.value.height / 2
  
  if (cropBox.value.width > cropBox.value.height * aspectRatio.value) {
    // 宽度太大，调整宽度
    cropBox.value.width = cropBox.value.height * aspectRatio.value
  } else {
    // 高度太大，调整高度
    cropBox.value.height = cropBox.value.width / aspectRatio.value
  }
  
  // 保持中心点不变
  cropBox.value.x = currentCenterX - cropBox.value.width / 2
  cropBox.value.y = currentCenterY - cropBox.value.height / 2
  
  // 确保不超出画布
  constrainCropBox()
  
  renderImage()
  updateCropSize()
}

// 限制裁剪框在画布内
const constrainCropBox = () => {
  if (!canvasRef.value) return
  
  // 左边界
  if (cropBox.value.x < 0) {
    cropBox.value.x = 0
  }
  // 右边界
  if (cropBox.value.x + cropBox.value.width > canvasWidth.value) {
    cropBox.value.x = canvasWidth.value - cropBox.value.width
  }
  // 上边界
  if (cropBox.value.y < 0) {
    cropBox.value.y = 0
  }
  // 下边界
  if (cropBox.value.y + cropBox.value.height > canvasHeight.value) {
    cropBox.value.y = canvasHeight.value - cropBox.value.height
  }
}

// 旋转图片
const rotate = (degrees: number) => {
  rotation.value = (rotation.value + degrees) % 360
  renderImage()
}

// 重置裁剪器
const resetCropper = () => {
  zoom.value = 1
  rotation.value = 0
  aspectRatio.value = null
  initCropBox()
  renderImage()
}

// 渲染图片
const renderImage = () => {
  if (!ctx.value || !imgElement.value || !canvasRef.value) return
  
  const ctx2d = ctx.value
  const canvas = canvasRef.value
  
  // 清空画布
  ctx2d.clearRect(0, 0, canvas.width, canvas.height)
  
  ctx2d.save()
  
  // 移动到画布中心
  ctx2d.translate(canvas.width / 2, canvas.height / 2)
  
  // 旋转
  ctx2d.rotate((rotation.value * Math.PI) / 180)
  
  // 缩放
  ctx2d.scale(zoom.value, zoom.value)
  
  // 绘制图片（居中）
  const imgWidth = imgElement.value.width
  const imgHeight = imgElement.value.height
  ctx2d.drawImage(
    imgElement.value,
    -imgWidth / 2,
    -imgHeight / 2,
    imgWidth,
    imgHeight
  )
  
  ctx2d.restore()
  
  // 绘制裁剪框和遮罩
  drawCropOverlay()
}

// 绘制裁剪遮罩
const drawCropOverlay = () => {
  if (!ctx.value || !canvasRef.value) return
  
  const ctx2d = ctx.value
  const canvas = canvasRef.value
  
  // 绘制半透明遮罩
  ctx2d.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx2d.fillRect(0, 0, canvas.width, canvas.height)
  
  // 清除裁剪区域（显示原图）
  ctx2d.globalCompositeOperation = 'destination-out'
  ctx2d.fillRect(cropBox.value.x, cropBox.value.y, cropBox.value.width, cropBox.value.height)
  ctx2d.globalCompositeOperation = 'source-over'
  
  // 绘制裁剪框边框
  ctx2d.strokeStyle = '#fff'
  ctx2d.lineWidth = 2
  ctx2d.strokeRect(cropBox.value.x, cropBox.value.y, cropBox.value.width, cropBox.value.height)
  
  // 绘制九宫格线
  ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx2d.lineWidth = 1
  
  // 垂直线
  const thirdWidth = cropBox.value.width / 3
  for (let i = 1; i < 3; i++) {
    const x = cropBox.value.x + i * thirdWidth
    ctx2d.beginPath()
    ctx2d.moveTo(x, cropBox.value.y)
    ctx2d.lineTo(x, cropBox.value.y + cropBox.value.height)
    ctx2d.stroke()
  }
  
  // 水平线
  const thirdHeight = cropBox.value.height / 3
  for (let i = 1; i < 3; i++) {
    const y = cropBox.value.y + i * thirdHeight
    ctx2d.beginPath()
    ctx2d.moveTo(cropBox.value.x, y)
    ctx2d.lineTo(cropBox.value.x + cropBox.value.width, y)
    ctx2d.stroke()
  }
}

// 绑定鼠标事件
const bindMouseEvents = () => {
  if (!canvasRef.value) return
  
  canvasRef.value.addEventListener('mousedown', handleMouseDown)
  canvasRef.value.addEventListener('mousemove', handleMouseMove)
  canvasRef.value.addEventListener('mouseup', handleMouseUp)
  canvasRef.value.addEventListener('mouseleave', handleMouseUp)
}

// 鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 检查是否在裁剪框内
  if (
    x >= cropBox.value.x &&
    x <= cropBox.value.x + cropBox.value.width &&
    y >= cropBox.value.y &&
    y <= cropBox.value.y + cropBox.value.height
  ) {
    isDragging.value = true
    dragStartX.value = x - cropBox.value.x
    dragStartY.value = y - cropBox.value.y
  }
}

// 鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  cropBox.value.x = x - dragStartX.value
  cropBox.value.y = y - dragStartY.value
  
  // 限制在画布内
  constrainCropBox()
  
  renderImage()
  updateCropSize()
}

// 鼠标释放
const handleMouseUp = () => {
  isDragging.value = false
}

// 取消
const handleCancel = () => {
  visible.value = false
}

// 确认裁剪
const handleConfirm = async () => {
  if (!imgElement.value) {
    ElMessage.error('图片未加载')
    return
  }

  cropping.value = true

  try {
    // 创建临时 canvas 用于裁剪
    const tempCanvas = document.createElement('canvas')
    
    // 计算实际裁剪尺寸
    const scaleX = imgElement.value.width / canvasWidth.value
    const scaleY = imgElement.value.height / canvasHeight.value
    
    const sx = cropBox.value.x * scaleX
    const sy = cropBox.value.y * scaleY
    const sWidth = cropBox.value.width * scaleX
    const sHeight = cropBox.value.height * scaleY
    
    tempCanvas.width = sWidth
    tempCanvas.height = sHeight
    
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) {
      throw new Error('无法获取 2D 上下文')
    }
    
    // 应用旋转和缩放到裁剪结果
    tempCtx.translate(sWidth / 2, sHeight / 2)
    tempCtx.rotate((rotation.value * Math.PI) / 180)
    tempCtx.scale(zoom.value, zoom.value)
    tempCtx.translate(-sWidth / 2, -sHeight / 2)
    
    // 绘制裁剪区域
    tempCtx.drawImage(
      imgElement.value,
      sx, sy, sWidth, sHeight,
      0, 0, sWidth, sHeight
    )
    
    // 转换为 Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      tempCanvas.toBlob(((blob: Blob | null) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('无法转换为 Blob'))
        }
      }) as any) // JPEG 格式，质量 0.9
    })

    // 转换为 DataURL
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      emit('confirm', dataUrl)
      visible.value = false
      ElMessage.success('裁剪成功')
    }
    reader.onerror = () => {
      ElMessage.error('读取图片失败')
    }
    reader.readAsDataURL(blob)
  } catch (error: any) {
    console.error('裁剪失败:', error)
    ElMessage.error(error.message || '裁剪失败')
  } finally {
    cropping.value = false
  }
}
</script>

<style scoped lang="scss">
.image-cropper-dialog {
  .cropper-container {
    display: flex;
    gap: 20px;
    height: 500px;
  }

  .cropper-main {
    flex: 1;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 20px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    .image-wrapper {
      max-width: 100%;
      max-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .cropper-controls {
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .preview-section {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #303133;
      font-weight: bold;
    }

    .preview-canvas {
      width: 100%;
      aspect-ratio: 1;
      background: #fff;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      canvas {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .preview-info {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      text-align: center;
    }
  }

  .settings-section {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #303133;
      font-weight: bold;
    }

    .scale-control {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>
