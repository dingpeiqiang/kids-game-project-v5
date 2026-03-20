<template>
  <div class="image-list">
    <div class="image-grid">
      <draggable
        v-model="imageList"
        item-key="key"
        @end="handleDragEnd"
      >
        <template #item="{ element: image, index }">
          <div class="image-item">
            <!-- 图片预览 -->
            <div class="image-preview" @click="previewImage(image)">
              <img :src="image.src" :alt="image.alt" />
              <div class="image-overlay">
                <el-icon class="preview-icon"><ZoomIn /></el-icon>
              </div>
            </div>

            <!-- 图片信息 -->
            <div class="image-info">
              <div class="image-key">{{ image.key }}</div>
              <div class="image-alias">{{ image.alias }}</div>
            </div>

            <!-- 操作按钮 -->
            <div class="image-actions">
              <el-button
                size="small"
                type="primary"
                @click="editImage(image)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteImage(index)"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
      </draggable>

      <!-- 空状态 -->
      <el-empty
        v-if="imageList.length === 0"
        description="暂无图片，点击上方按钮上传"
      />
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" width="60%" append-to-body>
      <img :src="currentPreviewImage?.src" style="width: 100%" />
      <template #footer>
        <div class="preview-footer">
          <div class="preview-info">
            <div><strong>Key：</strong>{{ currentPreviewImage?.key }}</div>
            <div><strong>别名：</strong>{{ currentPreviewImage?.alias }}</div>
            <div><strong>尺寸：</strong>{{ imageSize }}</div>
          </div>
          <el-button @click="previewVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑图片" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="Key">
          <el-input v-model="editForm.key" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="editForm.alias" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.alt" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ZoomIn } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface Props {
  modelValue: Record<string, any>
  category: string
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 图片列表
const imageList = ref<any[]>([])

// 预览相关
const previewVisible = ref(false)
const currentPreviewImage = ref<any>(null)
const imageSize = ref('')

// 编辑相关
const editDialogVisible = ref(false)
const editForm = ref({
  key: '',
  alias: '',
  alt: ''
})
const editIndex = ref(-1)

// ========== 计算属性 ==========

// 转换为数组列表
const imageArray = computed(() => {
  return Object.entries(props.modelValue).map(([key, value]) => ({
    key,
    ...value
  }))
})

// ========== 方法 ==========

// 预览图片
const previewImage = (image: any) => {
  currentPreviewImage.value = image

  // 获取图片尺寸
  const img = new Image()
  img.src = image.src
  img.onload = () => {
    imageSize.value = `${img.width} x ${img.height}`
  }

  previewVisible.value = true
}

// 编辑图片
const editImage = (image: any, index: number) => {
  editForm.value = {
    key: image.key,
    alias: image.alias,
    alt: image.alt || ''
  }
  editIndex.value = index
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = () => {
  const newImages = { ...props.modelValue }
  const oldKey = Object.keys(newImages)[editIndex.value]

  // 删除旧的key
  delete newImages[oldKey]

  // 添加新的key
  newImages[editForm.value.key] = {
    ...newImages[oldKey],
    key: editForm.value.key,
    alias: editForm.value.alias,
    alt: editForm.value.alt
  }

  emit('update:modelValue', newImages)
  editDialogVisible.value = false
  ElMessage.success('图片信息已更新')
}

// 删除图片
const deleteImage = (index: number) => {
  ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    const newImages = { ...props.modelValue }
    const keys = Object.keys(newImages)
    delete newImages[keys[index]]

    emit('update:modelValue', newImages)
    ElMessage.success('图片已删除')
  }).catch(() => {})
}

// 拖拽结束
const handleDragEnd = () => {
  ElMessage.success('图片顺序已更新')
}

// ========== 监听 ==========

// 监听外部传入的值
watch(
  () => props.modelValue,
  (newValue) => {
    imageList.value = Object.entries(newValue).map(([key, value]) => ({
      key,
      ...value
    }))
  },
  { deep: true, immediate: true }
)
</script>

<style scoped lang="scss">
.image-list {
  min-height: 400px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.image-preview {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例 */
  overflow: hidden;
  cursor: pointer;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover .image-overlay {
    opacity: 1;
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;

  .preview-icon {
    color: #fff;
    font-size: 32px;
  }
}

.image-info {
  padding: 12px;
  border-top: 1px solid #f0f0f0;

  .image-key {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
    font-family: monospace;
  }

  .image-alias {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.image-actions {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #f0f0f0;

  .el-button {
    flex: 1;
  }
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .preview-info {
    font-size: 14px;
    color: #606266;

    div {
      margin-bottom: 4px;
    }
  }
}
</style>
