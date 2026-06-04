<template>
  <div class="compare-preview">
    <div class="preview-header">
      <h3>主题对比预览</h3>
      <div class="compare-actions">
        <el-button type="primary" size="small" @click="syncThemes">
          <el-icon><Refresh /></el-icon>
          同步主题
        </el-button>
        <el-button type="success" size="small" @click="applyLeft">
          应用左主题
        </el-button>
        <el-button type="success" size="small" @click="applyRight">
          应用右主题
        </el-button>
      </div>
    </div>

    <div class="compare-content">
      <div class="compare-pane left-pane">
        <div class="pane-header">
          <h4>当前主题</h4>
          <el-tag type="primary">当前</el-tag>
        </div>

        <div class="pane-content">
          <div class="theme-info">
            <h5>主题信息</h5>
            <div class="info-item">
              <span class="label">主题ID：</span>
              <span class="value">{{ leftTheme?.themeInfo?.themeId || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">主题名称：</span>
              <span class="value">{{ leftTheme?.themeInfo?.themeName || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">创作者：</span>
              <span class="value">{{ leftTheme?.themeInfo?.author || 'N/A' }}</span>
            </div>
          </div>

          <div class="color-preview">
            <h5>配色方案</h5>
            <div class="color-grid">
              <div class="color-item">
                <div class="color-box" :style="{ background: leftTheme?.globalStyle?.primaryColor }"></div>
                <span>主色</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: leftTheme?.globalStyle?.secondaryColor }"></div>
                <span>辅助色</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: leftTheme?.globalStyle?.bgColor }"></div>
                <span>背景色</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: leftTheme?.globalStyle?.textColor }"></div>
                <span>文字色</span>
              </div>
            </div>
          </div>

          <div class="component-demo">
            <h5>组件示例</h5>
            <el-button type="primary">主要按钮</el-button>
            <el-button type="success">成功按钮</el-button>
            <el-card class="demo-card">
              <template #header>
                <span>卡片标题</span>
              </template>
              <p>卡片内容</p>
            </el-card>
          </div>
        </div>
      </div>

      <div class="compare-divider">
        <el-icon><Switch /></el-icon>
        <span>VS</span>
      </div>

      <div class="compare-pane right-pane">
        <div class="pane-header">
          <h4>预览主题</h4>
          <el-tag type="success">预览</el-tag>
        </div>

        <div class="pane-content">
          <div class="theme-info">
            <h5>主题信息</h5>
            <div class="info-item">
              <span class="label">主题ID：</span>
              <span class="value">{{ rightTheme?.themeInfo?.themeId || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">主题名称：</span>
              <span class="value">{{ rightTheme?.themeInfo?.themeName || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">创作者：</span>
              <span class="value">{{ rightTheme?.themeInfo?.author || 'N/A' }}</span>
            </div>
          </div>

          <div class="color-preview">
            <h5>配色方案</h5>
            <div class="color-grid">
              <div class="color-item">
                <div class="color-box" :style="{ background: rightTheme?.globalStyle?.primaryColor }"></div>
                <span>主色</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: rightTheme?.globalStyle?.secondaryColor }"></div>
                <span>辅助色</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: rightTheme?.globalStyle?.bgColor }"></div>
                <span>背景色</span>
              </div>
              <div class="color-item">
                <div class="color-box" :style="{ background: rightTheme?.globalStyle?.textColor }"></div>
                <span>文字色</span>
              </div>
            </div>
          </div>

          <div class="component-demo">
            <h5>组件示例</h5>
            <el-button type="primary">主要按钮</el-button>
            <el-button type="success">成功按钮</el-button>
            <el-card class="demo-card">
              <template #header>
                <span>卡片标题</span>
              </template>
              <p>卡片内容</p>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Switch } from '@element-plus/icons-vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface Props {
  currentTheme?: GTRSTheme
  previewTheme?: GTRSTheme
}

const props = defineProps<Props>()
const emit = defineEmits(['apply-theme'])

const leftTheme = computed(() => props.currentTheme)
const rightTheme = computed(() => props.previewTheme)

const syncThemes = () => {
  ElMessage.success('主题已同步')
}

const applyLeft = () => {
  emit('apply-theme', 'left')
  ElMessage.success('已应用当前主题')
}

const applyRight = () => {
  emit('apply-theme', 'right')
  ElMessage.success('已应用预览主题')
}
</script>

<style scoped lang="scss">
.compare-preview {
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

    .compare-actions {
      display: flex;
      gap: 10px;
    }
  }

  .compare-content {
    flex: 1;
    display: flex;
    padding: 20px;
    gap: 20px;
    overflow: hidden;

    .compare-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 8px;
      overflow: hidden;

      .pane-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: #fafafa;
        border-bottom: 1px solid #e4e7ed;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
      }

      .pane-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;

        .theme-info,
        .color-preview,
        .component-demo {
          margin-bottom: 30px;

          &:last-child {
            margin-bottom: 0;
          }

          h5 {
            margin: 0 0 15px 0;
            font-size: 14px;
            font-weight: 600;
            color: #606266;
          }
        }

        .theme-info {
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
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
            }
          }
        }

        .color-preview {
          .color-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;

            .color-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 15px;
              background: #fafafa;
              border-radius: 8px;

              .color-box {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }

              span {
                font-size: 12px;
                color: #606266;
              }
            }
          }
        }

        .component-demo {
          display: flex;
          flex-direction: column;
          gap: 15px;

          .el-button {
            margin-right: 10px;
          }

          .demo-card {
            p {
              margin: 0;
              color: #606266;
            }
          }
        }
      }
    }

    .compare-divider {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 10px;

      .el-icon {
        font-size: 24px;
        color: #909399;
        margin-bottom: 5px;
      }

      span {
        font-size: 18px;
        font-weight: bold;
        color: #909399;
      }
    }
  }
}
</style>
