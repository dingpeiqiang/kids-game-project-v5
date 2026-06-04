<template>
  <div class="theme-selector">
    <!-- 触发按钮 -->
    <button class="theme-btn" @click="togglePanel">
      <span>🎨</span>
      <span :style="{ fontSize: ui.getFontSize(14) }">{{ currentThemeName }}</span>
    </button>

    <!-- 背景遮罩 -->
    <Transition name="fade">
      <div v-if="showPanel" class="overlay" @click="showPanel = false"/>
    </Transition>

    <!-- 主题选择面板 -->
    <Transition name="scale">
      <div v-if="showPanel" class="theme-panel">
        <div class="panel-header">
          <h3 :style="{ fontSize: ui.getFontSize(18) }">选择主题</h3>
          <button class="close-btn" @click="showPanel = false" :style="{ fontSize: ui.getFontSize(20) }">✕</button>
        </div>

        <div class="theme-list">
          <div
            v-for="t in themeList"
            :key="t.id"
            class="theme-item"
            :class="{ active: t.id === currentThemeId }"
            @click="selectTheme(t.id)"
          >
            <!-- 颜色预览 -->
            <div class="theme-preview"
                 :style="{ background: `linear-gradient(135deg, ${t.colors?.primary || '#6366f1'}, ${t.colors?.secondary || '#8b5cf6'})` }">
              <div class="flex gap-1">
                <span class="color-dot" :style="{ background: t.colors?.primary || '#6366f1' }"/>
                <span class="color-dot" :style="{ background: t.colors?.secondary || '#8b5cf6' }"/>
                <span class="color-dot" :style="{ background: t.colors?.accent || '#fbbf24' }"/>
              </div>
            </div>

            <!-- 主题信息 -->
            <div class="flex-1">
              <div class="font-bold" :style="{ fontSize: ui.getFontSize(14) }">{{ t.name }}</div>
              <div class="text-gray-400" :style="{ fontSize: ui.getFontSize(12) }">{{ t.description }}</div>
            </div>

            <span v-if="t.id === currentThemeId" class="check-mark">✓</span>
          </div>
        </div>

        <div class="panel-footer">
          <button class="reset-btn" @click="resetTheme" :style="{ fontSize: ui.getFontSize(14) }">
            恢复默认
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useResponsiveUI } from '@/utils/uiResponsive'

const themeStore = useThemeStore()
const ui = useResponsiveUI()

const showPanel = ref(false)

const themeList       = computed(() => themeStore.themeList)
const currentThemeId  = computed(() => themeStore.currentThemeId)
const currentThemeName = computed(() => themeStore.currentTheme?.name || '默认主题')

function togglePanel() {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    themeStore.loadThemeListFromBackend?.(true)?.catch(() => {})
  }
}

function selectTheme(themeId: string) {
  if (themeStore.switchToBackendTheme) {
    themeStore.switchToBackendTheme(themeId).then(ok => {
      if (!ok) themeStore.switchTheme?.(themeId)
    }).catch(() => { themeStore.switchTheme?.(themeId) })
  } else {
    themeStore.switchTheme?.(themeId)
  }
  showPanel.value = false
}

function resetTheme() {
  themeStore.resetTheme?.()
  showPanel.value = false
}
</script>

<style scoped>
.theme-selector { position: relative; }

.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(55, 65, 81, 0.8);
  border: 1px solid rgba(251, 191, 36, 0.4);
  color: #fff;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.theme-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }

/* 遮罩 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
}

/* 面板 */
.theme-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 380px;
  max-height: 80vh;
  overflow-y: auto;
  background: #1f2937;
  border: 2px solid rgba(251, 191, 36, 0.3);
  border-radius: 16px;
  z-index: 1000;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  position: sticky;
  top: 0;
  background: #1f2937;
  border-radius: 16px 16px 0 0;
  color: white;
}

.close-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
}
.close-btn:hover { color: white; }

.theme-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  color: white;
}
.theme-item:hover { background: rgba(255,255,255,0.07); transform: translateX(3px); }
.theme-item.active { border-color: #fbbf24; background: rgba(251,191,36,0.08); }

.theme-preview {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.4);
}

.check-mark {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fbbf24;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000;
  font-size: 14px;
  flex-shrink: 0;
}

.panel-footer {
  padding: 14px 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  position: sticky;
  bottom: 0;
  background: #1f2937;
  border-radius: 0 0 16px 16px;
}

.reset-btn {
  width: 100%;
  padding: 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}
.reset-btn:hover { opacity: 0.85; }

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-enter-active { transition: all 0.3s ease-out; }
.scale-leave-active { transition: all 0.2s ease-in; }
.scale-enter-from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
.scale-leave-to  { opacity: 0; transform: translate(-50%, -50%) scale(1.05); }
</style>
