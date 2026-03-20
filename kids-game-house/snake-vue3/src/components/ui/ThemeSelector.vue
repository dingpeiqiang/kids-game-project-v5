<template>
  <div class="theme-selector">
    <button class="theme-btn" @click="togglePanel" :style="buttonStyle">
      <span class="theme-icon">🎨</span>
      <span class="theme-label">{{ currentThemeName }}</span>
    </button>
    
    <!-- 背景遮罩 -->
    <Transition name="fade">
      <div v-if="showPanel" class="overlay" @click="showPanel = false"></div>
    </Transition>
    
    <!-- 居中的主题选择面板 -->
    <Transition name="scale">
      <div v-if="showPanel" class="theme-panel-centered" :style="panelStyle">
        <div class="theme-header">
          <h3>选择主题</h3>
          <button class="close-btn" @click="showPanel = false">✕</button>
        </div>
        
        <div class="theme-list">
          <div
            v-for="t in themeList"
            :key="t.id"
            class="theme-item"
            :class="{ active: t.id === currentThemeId && !isCustomTheme }"
            :style="getThemeItemStyle(t.colors)"
            @click="selectTheme(t.id)"
          >
            <div class="theme-preview">
              <div class="preview-colors">
                <span class="color-dot" :style="{ background: t.colors.primary }"></span>
                <span class="color-dot" :style="{ background: t.colors.secondary }"></span>
                <span class="color-dot" :style="{ background: t.colors.accent }"></span>
              </div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{{ t.name }}</span>
              <span class="theme-desc">{{ t.description }}</span>
            </div>
            <div v-if="t.id === currentThemeId && !isCustomTheme" class="check-icon">✓</div>
          </div>
        </div>
        
        <div class="theme-footer">
          <button class="reset-btn" @click="resetTheme">恢复默认</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const showPanel = ref(false)

const themeList = computed(() => themeStore.themeList)
const currentThemeId = computed(() => themeStore.currentThemeId)
const currentThemeName = computed(() => themeStore.currentTheme.name)
const isCustomTheme = computed(() => themeStore.isCustomTheme)
const colors = computed(() => themeStore.currentTheme.colors)

const buttonStyle = computed(() => ({
  backgroundColor: colors.value.surface,
  borderColor: colors.value.accent,
  color: colors.value.text
}))

const panelStyle = computed(() => ({
  backgroundColor: colors.value.surface,
  borderColor: colors.value.accent,
  color: colors.value.text,
  boxShadow: themeStore.currentTheme.effects.shadow
}))

function getThemeItemStyle(themeColors: any) {
  return {
    '--item-primary': themeColors.primary,
    '--item-secondary': themeColors.secondary,
    '--item-accent': themeColors.accent
  }
}

function togglePanel() {
  showPanel.value = !showPanel.value
  // 每次打开面板时，强制从后台重新加载主题列表
  if (showPanel.value) {
    themeStore.loadThemeListFromBackend(true).then(() => {
      console.log('✅ 主题列表已实时刷新')
    }).catch(err => {
      console.error('❌ 主题列表刷新失败:', err)
    })
  }
}

function selectTheme(themeId: string) {
  // 优先从后端加载完整主题资源包
  themeStore.switchToBackendTheme(themeId).then(success => {
    if (success) {
      console.log('✅ 已加载后端主题资源包:', themeId)
    } else {
      console.warn('⚠️ 后端加载失败，使用本地预设:', themeId)
      themeStore.switchTheme(themeId)
    }
    showPanel.value = false
  })
}

function resetTheme() {
  themeStore.resetTheme()
  showPanel.value = false
}

// 主题初始化已在 main.ts 中完成，这里不需要重复调用
</script>

<style scoped>
.theme-selector {
  position: relative;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  background: var(--theme-surface, #334155);
  color: var(--theme-text, #ffffff);
  border-color: var(--theme-accent, #fbbf24);
}

.theme-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.theme-icon {
  font-size: 18px;
}

/* 背景遮罩 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
}

/* 居中的主题面板 */
.theme-panel-centered {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 16px;
  border: 2px solid;
  z-index: 1000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.3s ease-out;
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid;
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 16px 16px 0 0;
}

.theme-header h3 {
  font-size: 18px;
  margin: 0;
  font-weight: bold;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: inherit;
}

.close-btn:hover {
  opacity: 1;
}

.theme-list {
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.theme-item:last-child {
  margin-bottom: 0;
}

.theme-item:hover {
  transform: translateX(4px);
  filter: brightness(1.1);
}

.theme-item.active {
  border-color: var(--item-accent);
  background: rgba(255, 255, 255, 0.05);
}

.theme-preview {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--item-primary), var(--item-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-colors {
  display: flex;
  gap: 4px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-name {
  font-weight: bold;
  font-size: 15px;
}

.theme-desc {
  font-size: 12px;
  opacity: 0.7;
}

.check-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--item-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.theme-footer {
  padding: 16px 20px;
  border-top: 1px solid;
  position: sticky;
  bottom: 0;
  background: inherit;
  border-radius: 0 0 16px 16px;
}

.reset-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.reset-btn:hover {
  opacity: 0.9;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

.scale-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .theme-panel-centered {
    width: 95%;
    max-height: 85vh;
  }
  
  .theme-item {
    padding: 12px;
  }
  
  .theme-preview {
    width: 40px;
    height: 40px;
  }
}
</style>
