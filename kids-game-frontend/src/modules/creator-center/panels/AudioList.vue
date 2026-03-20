<template>
  <div class="audio-list">
    <div class="audio-items">
      <div
        v-for="(audio, index) in audioArray"
        :key="audio.key"
        class="audio-item"
      >
        <!-- 音频播放器 -->
        <AudioPlayer :audio="audio" :index="index" />

        <!-- 音频信息 -->
        <div class="audio-info">
          <div class="audio-key">{{ audio.key }}</div>
          <div class="audio-alias">{{ audio.alias }}</div>
          <div class="audio-details">
            <span>时长：{{ formatDuration(audio.duration) }}</span>
            <span>音量：{{ Math.round(audio.volume * 100) }}%</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="audio-actions">
          <el-button size="small" @click="editAudio(audio)">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="deleteAudio(index)">
            删除
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="audioArray.length === 0"
        description="暂无音频，点击上方按钮上传"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑音频" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="Key">
          <el-input v-model="editForm.key" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="editForm.alias" />
        </el-form-item>
        <el-form-item label="音量">
          <el-slider
            v-model="editForm.volume"
            :min="0"
            :max="1"
            :step="0.1"
            show-input
          />
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
import AudioPlayer from './AudioPlayer.vue'
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

// 编辑对话框
const editDialogVisible = ref(false)
const editForm = ref({
  key: '',
  alias: '',
  volume: 0.5
})
const editIndex = ref(-1)

// ========== 计算属性 ==========

// 转换为数组列表
const audioArray = computed(() => {
  return Object.entries(props.modelValue).map(([key, value]) => ({
    key,
    ...value
  }))
})

// ========== 方法 ==========

// 编辑音频
const editAudio = (audio: any, index: number) => {
  editForm.value = {
    key: audio.key,
    alias: audio.alias,
    volume: audio.volume
  }
  editIndex.value = index
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = () => {
  const newAudios = { ...props.modelValue }
  const oldKey = Object.keys(newAudios)[editIndex.value]

  // 删除旧的key
  delete newAudios[oldKey]

  // 添加新的key
  newAudios[editForm.value.key] = {
    ...newAudios[oldKey],
    key: editForm.value.key,
    alias: editForm.value.alias,
    volume: editForm.value.volume
  }

  emit('update:modelValue', newAudios)
  editDialogVisible.value = false
  ElMessage.success('音频信息已更新')
}

// 删除音频
const deleteAudio = (index: number) => {
  ElMessageBox.confirm('确定要删除这个音频吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    const newAudios = { ...props.modelValue }
    const keys = Object.keys(newAudios)
    delete newAudios[keys[index]]

    emit('update:modelValue', newAudios)
    ElMessage.success('音频已删除')
  }).catch(() => {})
}

// 格式化时间
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ========== 监听 ==========

// 监听外部传入的值
watch(
  () => props.modelValue,
  (newValue) => {
    // 数据变化时无需处理，由 AudioPlayer 组件处理播放逻辑
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.audio-list {
  min-height: 400px;
}

.audio-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audio-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.audio-info {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;

  .audio-key {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
    font-family: monospace;
  }

  .audio-alias {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    margin-bottom: 6px;
  }

  .audio-details {
    font-size: 12px;
    color: #606266;

    span {
      margin-right: 16px;
    }
  }
}

.audio-actions {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #f0f0f0;

  .el-button {
    flex: 1;
  }
}
</style>
