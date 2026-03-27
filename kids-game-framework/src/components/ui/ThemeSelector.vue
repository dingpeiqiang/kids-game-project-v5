<template>
  <div class="theme-selector">
    <button class="theme-selector__btn" @click="togglePanel">
      <span class="theme-selector__icon">🎨</span>
      <span class="theme-selector__label">{{ currentThemeName }}</span>
    </button>

    <!-- 背景遮罩 -->
    <Transition name="fade">
      <div v-if="showPanel" class="theme-selector__overlay" @click="showPanel = false"></div>
    </Transition>

    <!-- 居中的主题选择面板 -->
    <Transition name="scale">
      <div v-if="showPanel" class="theme-selector__panel">
        <div class="theme-selector__header">
          <h3>{{ title }}</h3>
          <button class="theme-selector__close" @click="showPanel = false">✕</button>
        </div>

        <div class="theme-selector__list">
          <div
            v-for="t in themeList"
            :key="t.id"
            class="theme-selector__item"
            :class="{ 'theme-selector__item--active': t.id === currentThemeId }"
            :style="getThemeItemStyle(t.colors)"
            @click="selectTheme(t.id)"
          >
            <div class="theme-selector__preview">
              <div class="theme-selector__colors">
                <span class="theme-selector__dot" :style="{ background: t.colors?.primary || '#4ade80' }"></span>
                <span class="theme-selector__dot" :style="{ background: t.colors?.secondary || '#22c55e' }"></span>
                <span class="theme-selector__dot" :style="{ background: t.colors?.accent || '#fbbf24' }"></span>
              </div>
            </div>
            <div class="theme-selector__info">
              <span class="theme-selector__name">{{ t.name }}</span>
              <span class="theme-selector__desc">{{ t.description }}</span>
            </div>
            <div v-if="t.id === currentThemeId" class="theme-selector__check">✓</div>
          </div>
        </div>

        <div class="theme-selector__footer" v-if="showReset">
          <button class="theme-selector__reset" @click="resetTheme">{{ resetText }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '../../stores/theme.store'

const themeStore = useThemeStore()

withDefaults(defineProps<{
  /** 面板标题 */
  title?: string
  /** 重置按钮文字 */
  resetText?: string
  /** 是否显示重置按钮 */
  showReset?: boolean
}>(), {
  title: '选择主题',
  resetText: '恢复默认',
  showReset: true
})

const emit = defineEmits<{
  change: [themeId: string]
  reset: []
}>()

const showPanel = ref(false)

const themeList = computed(() => themeStore.themeList)
const currentThemeId = computed(() => themeStore.currentThemeId)
const currentThemeName = computed(() => themeStore.currentTheme?.name || '主题')

function getThemeItemStyle(themeColors: any) {
  return {
    '--item-primary': themeColors?.primary || '#4ade80',
    '--item-secondary': themeColors?.secondary || '#22c55e',
    '--item-accent': themeColors?.accent || '#fbbf24'
  }
}

function togglePanel() {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    themeStore.loadThemeList(true)
  }
}

function selectTheme(themeId: string) {
  themeStore.switchTheme(themeId)
  emit('change', themeId)
  showPanel.value = false
}

function resetTheme() {
  themeStore.loadThemeList()[0]?.id && themeStore.switchTheme(themeStore.themeList[0].id)
  emit('reset')
  showPanel.value = false
}
</script>

<style scoped>
.theme-selector {
  position: relative;
}

.theme-selector__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 2px solid var(--theme-accent, #fbbf24);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  background: var(--theme-surface, #334155);
  color: var(--theme-text, #ffffff);
}

.theme-selector__btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.theme-selector__icon {
  font-size: 18px;
}

.theme-selector__label {
  font-size: 14px;
}

/* 背景遮罩 */
.theme-selector__overlay {
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
.theme-selector__panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 16px;
  border: 2px solid var(--theme-accent, #fbbf24);
  z-index: 1000;
  background: var(--theme-surface, #334155);
  color: var(--theme-text, #ffffff);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.3s ease-out;
}

.theme-selector__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 16px 16px 0 0;
}

.theme-selector__header h3 {
  font-size: 18px;
  margin: 0;
  font-weight: bold;
}

.theme-selector__close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: inherit;
}

.theme-selector__close:hover {
  opacity: 1;
}

.theme-selector__list {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
}

.theme-selector__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.theme-selector__item:last-child {
  margin-bottom: 0;
}

.theme-selector__item:hover {
  transform: translateX(4px);
  filter: brightness(1.1);
}

.theme-selector__item--active {
  border-color: var(--item-accent);
  background: rgba(255, 255, 255, 0.05);
}

.theme-selector__preview {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--item-primary), var(--item-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 48px;
}

.theme-selector__colors {
  display: flex;
  gap: 4px;
}

.theme-selector__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.theme-selector__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-selector__name {
  font-weight: bold;
  font-size: 15px;
}

.theme-selector__desc {
  font-size: 12px;
  opacity: 0.7;
}

.theme-selector__check {
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

.theme-selector__footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  bottom: 0;
  background: inherit;
  border-radius: 0 0 16px 16px;
}

.theme-selector__reset {
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

.theme-selector__reset:hover {
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
  .theme-selector__panel {
    width: 95%;
    max-height: 85vh;
  }

  .theme-selector__item {
    padding: 12px;
  }

  .theme-selector__preview {
    width: 40px;
    height: 40px;
  }

  .theme-selector__header h3 {
    font-size: 18px;
  }
}
</style>
