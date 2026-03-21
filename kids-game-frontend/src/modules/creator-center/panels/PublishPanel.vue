<template>
  <div class="publish-panel">
    <el-card shadow="hover" class="publish-card">
      <template #header>
        <span class="card-title">📤 发布主题</span>
      </template>

      <!-- 主题概览 -->
      <div class="theme-overview">
        <h3>📋 主题概览</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-label">主题名称</div>
            <div class="overview-value">{{ themeData.themeInfo.themeName }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">适用游戏</div>
            <div class="overview-value">{{ themeData.themeInfo.gameId }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">创作者</div>
            <div class="overview-value">{{ themeData.themeInfo.author }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">标签</div>
            <div class="overview-value">
              <el-tag
                v-for="tag in (themeData.themeInfo.tags || [])"
                :key="tag"
                size="small"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!themeData.themeInfo.tags?.length">无</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源统计 -->
      <div class="resource-stats">
        <h3>📊 资源统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ imageCount }}</div>
            <div class="stat-label">图片总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ audioCount }}</div>
            <div class="stat-label">音频总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ loginImages }}</div>
            <div class="stat-label">登录页图片</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ bgmCount }}</div>
            <div class="stat-label">背景音乐</div>
          </div>
        </div>
      </div>

      <!-- 完整性检查 -->
      <div class="completeness-check">
        <h3>🔍 完整性检查</h3>
        <el-alert
          :type="checkResult.type"
          :title="checkResult.title"
          :description="checkResult.description"
          show-icon
          :closable="false"
        />

        <div class="check-items">
          <div
            v-for="item in checkItems"
            :key="item.key"
            class="check-item"
            :class="{ passed: item.passed }"
          >
            <el-icon>
              <component :is="item.passed ? CircleCheck : CircleClose" />
            </el-icon>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 发布选项 -->
      <div class="publish-options">
        <h3>⚙️ 发布选项</h3>
        <el-form label-width="120px">
          <el-form-item label="主题价格">
            <el-radio-group v-model="publishOption.priceType">
              <el-radio value="free">免费</el-radio>
              <el-radio value="paid">付费</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item
            v-if="publishOption.priceType === 'paid'"
            label="价格"
          >
            <el-input-number
              v-model="publishOption.price"
              :min="1"
              :max="999"
              :precision="2"
              :step="0.01"
            >
              <template #append>元</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="发布说明">
            <el-input
              v-model="publishOption.description"
              type="textarea"
              :rows="3"
              placeholder="向用户介绍你的主题..."
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 发布按钮 -->
      <div class="publish-actions">
        <el-button @click="previewTheme">
          <el-icon><View /></el-icon>
          预览主题
        </el-button>
        <el-button type="primary" @click="submitPublish" :loading="publishing">
          <el-icon><Promotion /></el-icon>
          提交发布
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, CircleClose, View, Promotion } from '@element-plus/icons-vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface Props {
  themeData: GTRSTheme
}

interface Emits {
  (e: 'publish', data: {
    price: number
    description: string
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 发布选项
const publishOption = ref({
  priceType: 'free',
  price: 9.9,
  description: ''
})

const publishing = ref(false)

// ========== 计算属性 ==========

// 安全获取对象keys数量
const safeKeysCount = (obj: any): number => {
  if (!obj || typeof obj !== 'object') return 0
  return Object.keys(obj).length
}

// 图片数量
const imageCount = computed(() => {
  const images = props.themeData.resources?.images || {}
  return safeKeysCount(images.login) +
         safeKeysCount(images.scene) +
         safeKeysCount(images.ui) +
         safeKeysCount(images.icon) +
         safeKeysCount(images.effect)
})

// 音频数量
const audioCount = computed(() => {
  const audio = props.themeData.resources?.audio || {}
  return safeKeysCount(audio.bgm) +
         safeKeysCount(audio.effect) +
         safeKeysCount(audio.voice)
})

// 登录页图片
const loginImages = computed(() => {
  return safeKeysCount(props.themeData.resources?.images?.login)
})

// 背景音乐
const bgmCount = computed(() => {
  return safeKeysCount(props.themeData.resources?.audio?.bgm)
})

// 检查结果
const checkResult = computed(() => {
  const errors = checkItems.value.filter(item => !item.passed)

  if (errors.length === 0) {
    return {
      type: 'success',
      title: '✅ 主题完整性检查通过',
      description: '您的主题已准备就绪，可以发布到市场！'
    }
  } else {
    return {
      type: 'warning',
      title: '⚠️ 主题存在问题',
      description: `请修复以下 ${errors.length} 个问题后再发布`
    }
  }
})

// 检查项
const checkItems = computed(() => {
  const theme = props.themeData

  return [
    {
      key: 'themeName',
      label: '主题名称已填写',
      passed: !!theme.themeInfo.themeName
    },
    {
      key: 'gameId',
      label: '适用游戏已选择',
      passed: !!theme.themeInfo.gameId
    },
    {
      key: 'coverImage',
      label: '主题封面已上传',
      passed: true // 封面图为非必填项，始终通过检查
    },
    {
      key: 'description',
      label: '主题描述已填写',
      passed: !!theme.themeInfo.description
    },
    {
      key: 'images',
      label: '至少包含1张图片',
      passed: imageCount.value > 0
    },
    {
      key: 'audio',
      label: '至少包含1个音频',
      passed: audioCount.value > 0
    }
  ]
})

// ========== 方法 ==========

// 预览主题
const previewTheme = () => {
  ElMessage.info('预览功能开发中...')
}

// 提交发布
const submitPublish = async () => {
  // 检查完整性
  const errors = checkItems.value.filter(item => !item.passed)

  if (errors.length > 0) {
    ElMessage.warning('请先修复主题中的问题')
    return
  }

  // 确认发布
  const priceText = publishOption.value.priceType === 'free'
    ? '免费'
    : `${publishOption.value.price} 元`

  try {
    await ElMessageBox.confirm(
      `确定要发布主题「${props.themeData.themeInfo.themeName}」吗？\n\n价格：${priceText}`,
      '确认发布',
      {
        type: 'warning',
        confirmButtonText: '确定发布',
        cancelButtonText: '取消'
      }
    )
  } catch (error) {
    // 用户取消操作，不做任何处理
    if (error === 'cancel' || (error as Error).message === 'cancel') {
      return
    }
    throw error // 重新抛出其他错误
  }

  publishing.value = true
  try {
    // 传递价格和发布说明给父组件
    const finalPrice = publishOption.value.priceType === 'free' ? 0 : publishOption.value.price
    emit('publish', {
      price: finalPrice,
      description: publishOption.value.description
    })
  } catch (error) {
    console.error('发布过程中出错:', error)
    ElMessage.error('发布失败：' + (error as Error).message)
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped lang="scss">
.publish-panel {
  max-width: 900px;
  margin: 0 auto;
}

.publish-card {
  .card-title {
    font-weight: bold;
    font-size: 16px;
  }
}

.theme-overview,
.resource-stats,
.completeness-check,
.publish-options {
  margin-bottom: 30px;

  h3 {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #303133;
  }
}

.overview-grid,
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.overview-item,
.stat-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;

  .overview-label,
  .stat-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .overview-value,
  .stat-number {
    font-size: 20px;
    font-weight: bold;
    color: #303133;
  }
}

.stat-number {
  color: #409eff !important;
}

.check-items {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;

  &.passed {
    background: #f0f9ff;
    color: #67c23a;
  }

  .el-icon {
    font-size: 16px;
  }
}

.publish-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;

  .el-button {
    flex: 1;
  }
}
</style>
