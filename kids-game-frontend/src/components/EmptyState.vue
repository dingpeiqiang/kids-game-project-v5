<template>
  <div class="empty-state" :style="{ height: height }">
    <el-empty
      :description="description"
      :image="image"
      :image-size="imageSize"
    >
      <template v-if="showRefresh">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          {{ refreshText }}
        </el-button>
      </template>
      <slot v-else></slot>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'

interface EmptyStateProps {
  description?: string
  image?: string
  imageSize?: number
  height?: string
  showRefresh?: boolean
  refreshText?: string
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  description: '暂无数据',
  image: undefined,
  imageSize: 160,
  height: '300px',
  showRefresh: false,
  refreshText: '刷新'
})

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  
  :deep(.el-empty) {
    .el-empty__image {
      opacity: 0.8;
    }
    
    .el-empty__description {
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
