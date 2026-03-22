<template>
  <div class="image-resource-panel">
    <!-- 面板局部 JSON 模式 -->
    <template v-if="props.panelJsonMode">
      <el-card shadow="hover" class="resource-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">🖼️ 图片资源</span>
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
          placeholder="请输入图片资源 JSON"
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
            <span class="card-title">🖼️ 图片资源</span>
            <div style="display: flex; gap: 8px;">
              <el-button size="small" type="info" plain @click="refreshPanel">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button size="small" type="info" plain @click="emit('toggleJsonMode')">
                <el-icon><Document /></el-icon>
                JSON
              </el-button>
            </div>
          </div>
        </template>

        <!-- 严格显示：只显示 configJson 中实际存在的图片分类 -->
        <el-tabs v-if="availableCategories.length > 0" v-model="activeCategory" type="border-card">
          <el-tab-pane
            v-for="category in availableCategories"
            :key="category.key"
            :label="`${category.label} (${category.count})`"
            :name="category.key"
          >
            <!-- 图片列表 -->
            <div v-if="Object.keys(category.items).length > 0" class="image-list">
              <div v-for="(item, key) in category.items" :key="key" class="image-item">
                <div class="image-preview" @click="previewImage(item.src, item.alias || key)">
                  <img v-if="item.src" :src="getImageUrl(item.src)" :alt="item.alias || key" />
                  <div v-else class="no-image">待上传</div>
                  <div v-if="item.src" class="preview-overlay">
                    <el-icon><ZoomIn /></el-icon>
                  </div>
                </div>
                <div class="image-info">
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
                    <span class="info-value">{{ item.type || 'png' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">地址:</span>
                    <span class="info-value src-value" :class="{ empty: !item.src }">
                      {{ item.src ? '已设置' : '待上传' }}
                    </span>
                  </div>
                </div>
                <div class="image-actions">
                  <!-- 上传图片按钮 -->
                  <el-button
                    size="small"
                    type="primary"
                    :loading="uploading[`${category.key}.${key}`]"
                    @click="selectImage(category.key, key)"
                  >
                    <el-icon><Upload /></el-icon>
                    {{ uploading[`${category.key}.${key}`] ? '上传中...' : '上传图片' }}
                  </el-button>

                  <!-- 图片制作按钮 -->
                  <el-button
                    size="small"
                    type="success"
                    @click="openImageDIY(category.key, key)"
                  >
                    <el-icon><Brush /></el-icon>
                    图片制作
                  </el-button>

                  <!-- 删除功能已禁用 -->
                  <!-- <el-button
                    v-if="item.src"
                    size="small"
                    type="danger"
                    plain
                    @click="deleteImage(category.key, key)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button> -->
                </div>
              </div>
            </div>

            <!-- 无图片 -->
            <el-empty v-else description="该分类下无图片资源" />
          </el-tab-pane>
        </el-tabs>

        <!-- 无图片资源 -->
        <el-empty v-else description="该主题无图片资源" />

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileSelect"
        />
      </el-card>

      <!-- 图片预览对话框 -->
      <el-dialog
        v-model="previewVisible"
        :title="`图片预览 - ${previewImageTitle}`"
        width="80%"
        class="image-preview-dialog"
        :append-to-body="true"
      >
        <div class="preview-container">
          <img :src="previewImageUrl" alt="预览图片" />
        </div>
      </el-dialog>

      <!-- 图片DIY面板 -->
      <ImageDIYPanel
        v-model="diyPanelVisible"
        :default-width="diyCanvasWidth"
        :default-height="diyCanvasHeight"
        @save="handleDIYSave"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Edit, Refresh, ZoomIn, Delete, Upload, Brush } from '@element-plus/icons-vue'
import ImageDIYPanel from './ImageDIYPanel.vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'
import { unifiedUploadService } from '@/services/unified-upload.service'

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
  jsonContent.value = JSON.stringify(props.modelValue.resources?.images || {}, null, 2)
}

// 监听 modelValue 变化（只在非 JSON 模式下从外部同步）
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

// 分类标签映射
const CATEGORY_LABELS: Record<string, string> = {
  login: '登录页',
  scene: '场景',
  ui: 'UI元素',
  icon: '图标',
  effect: '特效'
}

// 当前分类
const activeCategory = ref('')

// 文件选择目标
const currentSelectKey = ref<string | null>(null)
const currentSelectCategory = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 上传状态
const uploading = ref<Record<string, boolean>>({})

// 图片预览
const previewVisible = ref(false)
const previewImageUrl = ref('')
const previewImageTitle = ref('')

// 图片DIY面板
const diyPanelVisible = ref(false)
const diyCurrentCategory = ref<string | null>(null)
const diyCurrentKey = ref<string | null>(null)
const diyCanvasWidth = ref(400)
const diyCanvasHeight = ref(300)

// 分类标签映射
const getCategoryLabel = (key: string) => CATEGORY_LABELS[key] || key

// 计算属性：只显示实际存在的分类
const availableCategories = computed(() => {
  const images = props.modelValue?.resources?.images || {}
  const result: Array<{
    key: string
    label: string
    count: number
    items: Record<string, any>
  }> = []

  console.log('[ImageResourcePanel] images 数据:', images)

  for (const [categoryKey, categoryValue] of Object.entries(images)) {
    console.log(`[ImageResourcePanel] 检查分类 ${categoryKey}:`, categoryValue)
    
    // 跳过空值
    if (!categoryValue) {
      console.log(`[ImageResourcePanel] 分类 ${categoryKey} 为空，跳过`)
      continue
    }
    
    // categoryValue 必须是对象且不是数组
    if (typeof categoryValue !== 'object' || Array.isArray(categoryValue)) {
      console.log(`[ImageResourcePanel] 分类 ${categoryKey} 类型不正确，跳过`)
      continue
    }
    
    const items: Record<string, any> = {}
    for (const [itemKey, itemValue] of Object.entries(categoryValue)) {
      console.log(`[ImageResourcePanel]   检查项目 ${itemKey}:`, itemValue)
      
      // itemValue 必须是对象且不是数组
      if (itemValue && typeof itemValue === 'object' && !Array.isArray(itemValue)) {
        items[itemKey] = itemValue
      } else {
        console.log(`[ImageResourcePanel]   项目 ${itemKey} 类型不正确，跳过`)
      }
    }

    if (Object.keys(items).length > 0) {
      result.push({
        key: categoryKey,
        label: getCategoryLabel(categoryKey),
        count: Object.keys(items).length,
        items
      })
      console.log(`[ImageResourcePanel] 分类 ${categoryKey} 有效，包含 ${Object.keys(items).length} 个项目`)
    } else {
      console.log(`[ImageResourcePanel] 分类 ${categoryKey} 没有有效项目`)
    }
  }

  console.log('[ImageResourcePanel] 有效分类列表:', result)
  return result
})

// ========== JSON 模式方法 ==========

// 处理 JSON 输入
const handleJsonInput = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        images: parsed
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
        images: parsed
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
  () => props.modelValue?.resources?.images,
  () => {
    if (!activeCategory.value && availableCategories.value.length > 0) {
      activeCategory.value = availableCategories.value[0].key
    }
  },
  { immediate: true }
)

// 选择图片
const selectImage = (category: string, key: string) => {
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
    // 显示上传中状态
    uploading.value[uploadKey] = true

    // 上传到服务器
    const result = await unifiedUploadService.uploadImage(file)

    // 更新数据
    const images = JSON.parse(JSON.stringify(props.modelValue.resources.images))
    const categoryData = images[category]

    // 根据文件扩展名判断类型（更可靠），而不是依赖浏览器的 MIME type
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const imageType = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension) ? extension : 'png'

    categoryData[key] = {
      ...categoryData[key],
      src: result.url,
      type: imageType
    }

    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        images
      }
    })
    emit('update:isDirty', true)

    ElMessage.success(`图片上传成功：${file.name}`)
  } catch (error: any) {
    console.error('图片上传失败:', error)
    ElMessage.error(`图片上传失败：${error.message || '未知错误'}`)
  } finally {
    // 清除上传状态
    uploading.value[uploadKey] = false
    target.value = ''
  }
}

// 处理别名更新
const handleItemUpdate = (category: string, key: string, item: any) => {
  const images = JSON.parse(JSON.stringify(props.modelValue.resources.images))
  const categoryData = images[category]

  categoryData[key] = {
    ...categoryData[key],
    alias: item.alias
  }

  emit('update:modelValue', {
    ...props.modelValue,
    resources: {
      ...props.modelValue.resources,
      images
    }
  })
  emit('update:isDirty', true)
}

// 刷新面板（强制重新计算）
const refreshPanel = () => {
  // 通过触发响应式更新来强制刷新
  activeCategory.value = ''
  setTimeout(() => {
    if (availableCategories.value.length > 0) {
      activeCategory.value = availableCategories.value[0].key
    }
  }, 10)
  ElMessage.success('面板已刷新')
}

// 获取图片的完整 URL
const getImageUrl = (path: string): string => {
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

// 预览图片
const previewImage = (src: string, title: string) => {
  if (!src) return
  previewImageUrl.value = getImageUrl(src)
  previewImageTitle.value = title
  previewVisible.value = true
}

// 打开图片DIY面板
const openImageDIY = (category: string, key: string) => {
  diyCurrentCategory.value = category
  diyCurrentKey.value = key
  
  // 根据资源key设置推荐的画布尺寸
  const sizeHints: Record<string, { width: number; height: number }> = {
    bg_image: { width: 800, height: 450 },
    logo_image: { width: 256, height: 256 },
    icon_image: { width: 64, height: 64 },
    button: { width: 200, height: 60 },
    card: { width: 300, height: 200 },
    avatar: { width: 128, height: 128 },
  }
  
  const size = sizeHints[key] || { width: 400, height: 300 }
  diyCanvasWidth.value = size.width
  diyCanvasHeight.value = size.height
  
  diyPanelVisible.value = true
}

// 处理DIY保存的图片
const handleDIYSave = async (blob: Blob, dataUrl: string) => {
  if (!diyCurrentCategory.value || !diyCurrentKey.value) return
  
  const category = diyCurrentCategory.value
  const key = diyCurrentKey.value
  const uploadKey = `${category}.${key}`
  
  try {
    // 显示上传中状态
    uploading.value[uploadKey] = true
    
    // 将blob转换为File对象
    const file = new File([blob], `diy-${key}-${Date.now()}.png`, { type: 'image/png' })
    
    // 上传到服务器
    const result = await unifiedUploadService.uploadImage(file)
    
    // 更新数据
    const images = JSON.parse(JSON.stringify(props.modelValue.resources.images))
    const categoryData = images[category]
    
    categoryData[key] = {
      ...categoryData[key],
      src: result.url,
      type: 'png'
    }
    
    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        images
      }
    })
    emit('update:isDirty', true)
    
    ElMessage.success('图片制作并上传成功')
  } catch (error: any) {
    console.error('图片上传失败:', error)
    ElMessage.error(`上传失败：${error.message || '未知错误'}`)
  } finally {
    uploading.value[uploadKey] = false
    diyCurrentCategory.value = null
    diyCurrentKey.value = null
  }
}

// 删除图片
const deleteImage = async (category: string, key: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '确认删除', {
      type: 'warning'
    })

    const item = props.modelValue.resources.images[category][key]
    if (item.src) {
      // 从服务器删除
      try {
        await unifiedUploadService.deleteResource(item.src)
      } catch (error) {
        console.error('删除服务器资源失败:', error)
      }
    }

    // 清除数据
    const images = JSON.parse(JSON.stringify(props.modelValue.resources.images))
    images[category][key] = {
      ...images[category][key],
      src: ''
    }

    emit('update:modelValue', {
      ...props.modelValue,
      resources: {
        ...props.modelValue.resources,
        images
      }
    })
    emit('update:isDirty', true)

    ElMessage.success('图片已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除图片失败:', error)
      ElMessage.error(`删除失败：${error.message || '未知错误'}`)
    }
  }
}
</script>

<style scoped lang="scss">
.image-resource-panel {
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

.image-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  .image-preview {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e4e7ed;
    cursor: pointer;
    position: relative;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .no-image {
      color: #c0c4cc;
      font-size: 12px;
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;

      .el-icon {
        color: #fff;
        font-size: 24px;
      }
    }

    &:hover .preview-overlay {
      opacity: 1;
    }
  }

  .image-info {
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
    }
  }

  .image-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 100px;
  }
}

.image-preview-dialog {
  .preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 20px;

    img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

</style>
