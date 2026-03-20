<template>
  <div class="theme-selector">
    <button class="theme-btn" @click="togglePanel" :style="buttonStyle">
      <span class="theme-icon">🎨</span>
      <span class="theme-label">{{ currentThemeName }}</span>
    </button>
    
    <Transition name="fade">
      <div v-if="showPanel" class="theme-panel" :style="panelStyle">
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
}

function selectTheme(themeId: string) {
  themeStore.switchTheme(themeId)
  showPanel.value = false
}

function resetTheme() {
  themeStore.resetTheme()
  showPanel.value = false
}

onMounted(() => {
  themeStore.init()
})
</script>

<style scoped>
.theme-selector {
  position: relative;
  z-index: 1000;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 2px solid var(--theme-accent, #fbbf24);
  border-radius: 20px;
  background: var(--theme-surface, #2d5a3d);
  color: var(--theme-text, #fff);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.theme-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--theme-glow, 0 0 10px rgba(251,191,36,0.5));
}

.theme-icon {
  font-size: 16px;
}

.theme-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 12px;
  border: 2px solid var(--theme-accent);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow);
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--theme-primary);
}

.theme-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--theme-text-secondary);
  cursor: pointer;
  font-size: 18px;
}

.theme-list {
  padding: 8px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: var(--theme-background);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-item:hover {
  background: var(--item-primary);
  transform: translateX(4px);
}

.theme-item.active {
  border: 2px solid var(--item-accent);
}

.theme-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--item-primary), var(--item-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-colors {
  display: flex;
  gap: 3px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.theme-name {
  font-weight: bold;
  font-size: 14px;
}

.theme-desc {
  font-size: 11px;
  opacity: 0.7;
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--item-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.theme-footer {
  padding: 12px;
  border-top: 1px solid var(--theme-primary);
}

.reset-btn {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: var(--theme-error);
  color: white;
  cursor: pointer;
  font-size: 13px;
}

.reset-btn:hover {
  opacity: 0.9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
