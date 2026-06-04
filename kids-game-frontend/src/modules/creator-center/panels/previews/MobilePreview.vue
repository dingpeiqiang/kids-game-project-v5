<template>
  <div class="mobile-preview">
    <div class="preview-header">
      <h3>移动端预览</h3>
      <el-select v-model="deviceType" placeholder="选择设备" size="small" style="width: 150px;">
        <el-option label="iPhone 14" value="iphone-14" />
        <el-option label="iPhone SE" value="iphone-se" />
        <el-option label="iPad" value="ipad" />
        <el-option label="Android" value="android" />
      </el-select>
    </div>

    <div class="preview-content" v-if="theme">
      <div class="device-frame" :class="deviceType">
        <div class="device-notch" v-if="deviceType === 'iphone-14'"></div>

        <div class="device-screen">
          <!-- 状态栏 -->
          <div class="status-bar">
            <span class="time">{{ currentTime }}</span>
            <div class="status-icons">
              <span class="icon">📶</span>
              <span class="icon">📶</span>
              <span class="icon">🔋</span>
            </div>
          </div>

          <!-- 主题预览内容 -->
          <div class="page-content">
            <div class="theme-preview-content">
              <div class="theme-header">
                <h2 :style="{ color: theme.globalStyle.primaryColor }">
                  {{ theme.themeInfo.themeName }}
                </h2>
                <p :style="{ color: theme.globalStyle.textColor }">
                  {{ theme.themeInfo.description || '暂无描述' }}
                </p>
              </div>

              <div class="color-section">
                <h3>主题配色</h3>
                <div class="color-grid">
                  <div
                    class="color-sample"
                    :style="{ background: theme.globalStyle.primaryColor }"
                  >
                    <span>主色</span>
                  </div>
                  <div
                    class="color-sample"
                    :style="{ background: theme.globalStyle.secondaryColor }"
                  >
                    <span>辅助色</span>
                  </div>
                  <div
                    class="color-sample"
                    :style="{ background: theme.globalStyle.bgColor }"
                  >
                    <span>背景色</span>
                  </div>
                  <div
                    class="color-sample"
                    :style="{ background: theme.globalStyle.textColor }"
                  >
                    <span>文字色</span>
                  </div>
                </div>
              </div>

              <div class="component-section">
                <h3>组件样式</h3>
                <button class="preview-button primary" :style="{ background: theme.globalStyle.primaryColor }">
                  主要按钮
                </button>
                <button class="preview-button secondary" :style="{ background: theme.globalStyle.secondaryColor }">
                  辅助按钮
                </button>
                <div class="preview-card" :style="{
                  background: theme.globalStyle.bgColor,
                  color: theme.globalStyle.textColor,
                  borderRadius: theme.globalStyle.borderRadius,
                  boxShadow: theme.globalStyle.shadow
                }">
                  <h4 :style="{ color: theme.globalStyle.primaryColor }">卡片标题</h4>
                  <p>这是使用主题背景色和文字色的卡片示例。</p>
                </div>
              </div>

              <div class="resource-summary">
                <h3>资源统计</h3>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="label">图片资源</span>
                    <span class="value">{{ imageCount }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">音频资源</span>
                    <span class="value">{{ audioCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部导航 -->
          <div class="bottom-nav" :style="{ background: theme.globalStyle.bgColor }">
            <div class="nav-item">
              <span class="icon">👤</span>
              <span>登录</span>
            </div>
            <div class="nav-item">
              <span class="icon">🎮</span>
              <span>游戏</span>
            </div>
            <div class="nav-item">
              <span class="icon">🏆</span>
              <span>结果</span>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface Props {
  theme?: GTRSTheme
}

const props = defineProps<Props>()
const emit = defineEmits(['go-to-create'])

const deviceType = ref('iphone-14')
const currentTime = ref('12:00')

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

let timer: NodeJS.Timeout

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="scss">
.mobile-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
  overflow: hidden;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: white;
    }
  }

  .preview-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: auto;

    .device-frame {
      position: relative;
      background: #000;
      border-radius: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

      &.iphone-14 {
        width: 390px;
        height: 844px;
        border: 8px solid #333;

        .device-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 30px;
          background: #000;
          border-radius: 0 0 20px 20px;
          z-index: 10;
        }
      }

      &.iphone-se {
        width: 375px;
        height: 667px;
        border: 8px solid #333;
        border-radius: 30px;
      }

      &.ipad {
        width: 768px;
        height: 1024px;
        border: 12px solid #333;
        border-radius: 20px;
      }

      &.android {
        width: 412px;
        height: 915px;
        border: 8px solid #333;
        border-radius: 30px;
      }

      .device-screen {
        width: 100%;
        height: 100%;
        background: #fff;
        border-radius: 32px;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 12px;

          .status-icons {
            display: flex;
            gap: 12px;

            .icon {
              font-size: 14px;
            }
          }
        }

        .page-content {
          flex: 1;
          overflow-y: auto;

          .theme-preview-content {
            padding: 20px;

            .theme-header {
              margin-bottom: 24px;
              text-align: center;

              h2 {
                margin: 0 0 8px 0;
                font-size: 24px;
              }

              p {
                margin: 0;
                font-size: 14px;
              }
            }

            .color-section,
            .component-section,
            .resource-summary {
              margin-bottom: 24px;

              h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
              }
            }

            .color-section {
              .color-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;

                .color-sample {
                  padding: 16px;
                  border-radius: 8px;
                  text-align: center;

                  span {
                    font-size: 12px;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                  }
                }
              }
            }

            .component-section {
              display: flex;
              flex-direction: column;
              gap: 12px;

              .preview-button {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;

                &:hover {
                  opacity: 0.9;
                  transform: translateY(-2px);
                }

                &.secondary {
                  background: #67c23a !important;
                }
              }

              .preview-card {
                padding: 16px;

                h4 {
                  margin: 0 0 8px 0;
                  font-size: 16px;
                }

                p {
                  margin: 0;
                  font-size: 14px;
                  line-height: 1.6;
                }
              }
            }

            .resource-summary {
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;

                .summary-item {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 12px;
                  background: #f5f7fa;
                  border-radius: 8px;

                  .label {
                    font-size: 14px;
                    color: #606266;
                  }

                  .value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #409eff;
                  }
                }
              }
            }
          }
        }

        .bottom-nav {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 10px 0;
          border-top: 1px solid rgba(0, 0, 0, 0.2);

          .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 16px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            transition: all 0.3s;

            span.icon {
              font-size: 20px;
            }

            span {
              font-size: 12px;
            }
          }
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
