<template>
  <div class="game-scene-preview">
    <div class="preview-header">
      <h3>游戏主题预览</h3>
      <el-tag v-if="theme" type="info">预览模式</el-tag>
      <el-tag v-else type="warning">无主题</el-tag>
    </div>

    <!-- 有主题时显示主题信息 -->
    <div class="preview-content" v-if="theme">
      <div class="theme-overview">
        <div class="info-card">
          <div class="card-header">
            <h4>主题信息</h4>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">主题ID：</span>
              <span class="value">{{ theme.themeInfo.themeId }}</span>
            </div>
            <div class="info-row">
              <span class="label">主题名称：</span>
              <span class="value">{{ theme.themeInfo.themeName }}</span>
            </div>
            <div class="info-row">
              <span class="label">适用游戏：</span>
              <span class="value">{{ theme.themeInfo.gameId }}</span>
            </div>
            <div class="info-row">
              <span class="label">创作者：</span>
              <span class="value">{{ theme.themeInfo.author }}</span>
            </div>
            <div class="info-row">
              <span class="label">描述：</span>
              <span class="value">{{ theme.themeInfo.description || '暂无描述' }}</span>
            </div>
          </div>
        </div>

        <div class="color-card">
          <div class="card-header">
            <h4>配色方案</h4>
          </div>
          <div class="card-body">
            <div class="color-grid">
              <div class="color-item">
                <div class="color-box" :style="{ background: theme.globalStyle.primaryColor }"></div>
                <span class="color-name">主色</span>
                <span class="color-value">{{ theme.globalStyle.primaryColor }}</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: theme.globalStyle.secondaryColor }"></div>
                <span class="color-name">辅助色</span>
                <span class="color-value">{{ theme.globalStyle.secondaryColor }}</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: theme.globalStyle.bgColor }"></div>
                <span class="color-name">背景色</span>
                <span class="color-value">{{ theme.globalStyle.bgColor }}</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: theme.globalStyle.textColor }"></div>
                <span class="color-name">文字色</span>
                <span class="color-value">{{ theme.globalStyle.textColor }}</span>
              </div>
            </div>

            <!-- 配色应用示例 -->
            <div class="color-demo" :style="{
              background: theme.globalStyle.bgColor,
              color: theme.globalStyle.textColor,
              fontFamily: theme.globalStyle.fontFamily,
              borderRadius: theme.globalStyle.borderRadius,
              boxShadow: theme.globalStyle.shadow
            }">
              <h3 :style="{ color: theme.globalStyle.primaryColor }">
                {{ theme.themeInfo.themeName }}
              </h3>
              <p>这是一段示例文字，使用主题的背景色和文字色。</p>
              <div class="demo-buttons">
                <button class="demo-btn primary" :style="{ background: theme.globalStyle.primaryColor }">
                  主要按钮
                </button>
                <button class="demo-btn secondary" :style="{ background: theme.globalStyle.secondaryColor }">
                  辅助按钮
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="resource-card">
          <div class="card-header">
            <h4>资源统计</h4>
          </div>
          <div class="card-body">
            <div class="stat-grid">
              <div class="stat-item">
                <div class="stat-icon">🖼️</div>
                <div class="stat-info">
                  <span class="stat-label">图片资源</span>
                  <span class="stat-value">{{ imageCount }}</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🔊</div>
                <div class="stat-info">
                  <span class="stat-label">音频资源</span>
                  <span class="stat-value">{{ audioCount }}</span>
                </div>
              </div>
            </div>

            <!-- 图片分类统计 -->
            <div class="resource-detail">
              <div class="detail-item" v-for="(items, category) in theme.resources.images" :key="category">
                <span class="category-label">{{ getCategoryName(category) }}</span>
                <span class="category-count">{{ Object.keys(items).length }} 个</span>
              </div>
            </div>

            <!-- 音频分类统计 -->
            <div class="resource-detail">
              <div class="detail-item" v-for="(items, category) in theme.resources.audio" :key="category">
                <span class="category-label">{{ getAudioCategoryName(category) }}</span>
                <span class="category-count">{{ Object.keys(items).length }} 个</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 待完善功能提示 -->
      <div class="coming-soon">
        <el-alert
          title="游戏实时预览功能开发中"
          type="info"
          :closable="false"
        >
          <p>游戏实时预览功能需要以下步骤完成后才能使用：</p>
          <ol>
            <li>为贪吃蛇游戏集成 GTRS 主题系统</li>
            <li>实现主题资源的动态加载和应用</li>
            <li>在预览组件中加载游戏实例</li>
          </ol>
          <p style="margin-top: 10px;">
            当前仅展示主题的基础信息和配色方案，完整的游戏效果请直接在游戏中测试。
          </p>
        </el-alert>
      </div>
    </div>

    <!-- 无主题时显示空状态 -->
    <div class="empty-state" v-else>
      <el-empty description="暂无主题数据">
        <el-button type="primary" @click="$emit('go-to-create')">
          创建新主题
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface Props {
  theme?: GTRSTheme
}

const props = defineProps<Props>()
const emit = defineEmits(['go-to-create'])

const imageCount = computed(() => {
  if (!props.theme?.resources?.images) return 0
  let count = 0
  Object.values(props.theme.resources.images).forEach(items => {
    count += Object.keys(items).length
  })
  return count
})

const audioCount = computed(() => {
  if (!props.theme?.resources?.audio) return 0
  let count = 0
  Object.values(props.theme.resources.audio).forEach(items => {
    count += Object.keys(items).length
  })
  return count
})

const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    login: '登录页',
    scene: '场景',
    ui: 'UI元素',
    icon: '图标',
    effect: '特效'
  }
  return names[category] || category
}

const getAudioCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    bgm: '背景音乐',
    effect: '音效',
    voice: '语音'
  }
  return names[category] || category
}
</script>

<style scoped lang="scss">
.game-scene-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
  overflow: hidden;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: white;
    border-bottom: 1px solid #e4e7ed;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .preview-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    .theme-overview {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;

      .info-card,
      .color-card,
      .resource-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        overflow: hidden;

        .card-header {
          padding: 16px 20px;
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;

          h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #606266;
          }
        }

        .card-body {
          padding: 20px;
        }
      }

      .info-card {
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .label {
            color: #909399;
            font-size: 14px;
          }

          .value {
            color: #303133;
            font-size: 14px;
            font-weight: 500;
            text-align: right;
            max-width: 60%;
            word-break: break-word;
          }
        }
      }

      .color-card {
        .color-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;

          .color-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 15px;
            background: #fafafa;
            border-radius: 8px;

            .color-box {
              width: 50px;
              height: 50px;
              border-radius: 8px;
              margin-bottom: 10px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .color-name {
              font-size: 12px;
              color: #606266;
              margin-bottom: 4px;
            }

            .color-value {
              font-size: 11px;
              color: #909399;
              font-family: monospace;
            }
          }
        }

        .color-demo {
          padding: 20px;
          border-radius: 8px;
          text-align: center;

          h3 {
            margin: 0 0 15px 0;
            font-size: 24px;
          }

          p {
            margin: 0 0 20px 0;
            font-size: 14px;
            line-height: 1.6;
          }

          .demo-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;

            .demo-btn {
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              color: white;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s;

              &:hover {
                opacity: 0.9;
                transform: translateY(-2px);
              }
            }
          }
        }
      }

      .resource-card {
        grid-column: span 2;

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: #fafafa;
            border-radius: 8px;

            .stat-icon {
              font-size: 32px;
            }

            .stat-info {
              display: flex;
              flex-direction: column;

              .stat-label {
                font-size: 12px;
                color: #909399;
                margin-bottom: 4px;
              }

              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #303133;
              }
            }
          }
        }

        .resource-detail {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;

          .detail-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f0f4ff;
            border-radius: 4px;

            .category-label {
              font-size: 13px;
              color: #606266;
            }

            .category-count {
              font-size: 12px;
              color: #409eff;
              font-weight: 500;
            }
          }
        }
      }
    }

    .coming-soon {
      margin-top: 20px;

      .el-alert {
        :deep(ol) {
          margin: 10px 0;
          padding-left: 20px;

          li {
            margin: 8px 0;
            line-height: 1.6;
          }
        }

        :deep(p) {
          margin: 8px 0;
          line-height: 1.6;
        }
      }
    }
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }
}
</style>
