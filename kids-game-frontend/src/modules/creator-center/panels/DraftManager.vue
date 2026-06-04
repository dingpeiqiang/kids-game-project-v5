<template>
  <el-dialog
    v-model="visible"
    title="草稿管理"
    width="900px"
  >
    <div class="draft-manager">
      <!-- 草稿列表 -->
      <div class="draft-list" v-if="draftList.length > 0">
        <div
          v-for="draft in draftList"
          :key="draft.id"
          class="draft-item"
          :class="{ active: selectedDraftId === draft.id }"
        >
          <!-- 草稿封面 -->
          <div class="draft-cover">
            <img v-if="draft.coverImage" :src="draft.coverImage" alt="封面" />
            <div v-else class="no-cover">暂无封面</div>
          </div>

          <!-- 草稿信息 -->
          <div class="draft-info">
            <div class="draft-name">{{ draft.name || '未命名草稿' }}</div>
            <div class="draft-meta">
              <span class="draft-date">{{ formatDate(draft.updatedAt) }}</span>
              <span class="draft-size">{{ formatSize(draft.size) }}</span>
            </div>
            <div class="draft-tags">
              <el-tag
                v-for="tag in draft.tags"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- 草稿操作 -->
          <div class="draft-actions">
            <el-button type="primary" size="small" @click="handleRestore(draft)">
              <el-icon><RefreshRight /></el-icon>
              恢复
            </el-button>
            <el-button size="small" @click="handleDownload(draft)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(draft)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无草稿" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight, Download, Delete } from '@element-plus/icons-vue'
import { draftApi, type Draft, DraftContentType } from '@/services/draft-api.service'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface DraftItem {
  id: string
  name: string
  coverImage: string
  themeData: any
  updatedAt: string
  size: number
  tags: string[]
}

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'restore', theme: GTRSTheme): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const draftList = ref<DraftItem[]>([])
const selectedDraftId = ref('')

// 加载草稿列表
const loadDrafts = async () => {
  try {
    const response = await draftApi.getMyDrafts(DraftContentType.THEME)
    draftList.value = response.list.map((draft: Draft) => ({
      id: String(draft.draftId),
      name: draft.draftName,
      coverImage: draft.thumbnailUrl || '',
      themeData: draft.contentJson,
      updatedAt: draft.updatedAt,
      size: draft.contentSize,
      tags: draft.tags ? draft.tags.split(',') : []
    }))

    console.log('[DraftManager] 草稿列表加载成功:', draftList.value.length, '条')
  } catch (error) {
    console.error('加载草稿失败:', error)
    ElMessage.error('加载草稿列表失败')
  }
}

// 保存草稿（不再需要，由父组件调用后端 API）
const saveDraft = () => {
  // 不再需要，由父组件调用 draftApi.saveDraft()
  console.log('[DraftManager] saveDraft 已废弃，请使用父组件的保存逻辑')
}

// 恢复草稿
const handleRestore = async (draft: DraftItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复草稿"${draft.name}"吗？当前未保存的更改将丢失。`,
      '确认恢复',
      {
        type: 'warning',
        confirmButtonText: '恢复',
        cancelButtonText: '取消'
      }
    )

    // 解析 contentJson
    const themeData = typeof draft.themeData === 'string'
      ? JSON.parse(draft.themeData)
      : draft.themeData

    emit('restore', themeData)
    ElMessage.success('草稿已恢复')
    visible.value = false
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('恢复草稿失败:', error)
    }
  }
}

// 下载草稿
const handleDownload = (draft: DraftItem) => {
  try {
    const configJson = typeof draft.themeData === 'string'
      ? draft.themeData
      : JSON.stringify(draft.themeData, null, 2)

    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${draft.name}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('草稿已下载')
  } catch (error) {
    console.error('下载草稿失败:', error)
    ElMessage.error('下载草稿失败')
  }
}

// 删除草稿
const handleDelete = async (draft: DraftItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除草稿"${draft.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    // 调用通用草稿 API 删除草稿
    await draftApi.deleteDraft(Number(draft.id))

    const index = draftList.value.findIndex(d => d.id === draft.id)
    if (index >= 0) {
      draftList.value.splice(index, 1)
      ElMessage.success('草稿已删除')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除草稿失败:', error)
      ElMessage.error('删除草稿失败：' + (error?.message || '未知错误'))
    }
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString()
}

// 格式化大小
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 暴露方法供父组件调用
defineExpose({
  saveDraft,
  loadDrafts
})

// 组件挂载时加载草稿列表
onMounted(() => {
  loadDrafts()
})
</script>

<style scoped lang="scss">
.draft-manager {
  max-height: 600px;
  overflow-y: auto;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.draft-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
  }

  &.active {
    border-color: #409eff;
    background: #f0f9ff;
  }
}

.draft-cover {
  width: 120px;
  height: 67.5px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.no-cover {
  font-size: 12px;
  color: #909399;
}

.draft-info {
  flex: 1;
  min-width: 0;
}

.draft-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.draft-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.draft-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
