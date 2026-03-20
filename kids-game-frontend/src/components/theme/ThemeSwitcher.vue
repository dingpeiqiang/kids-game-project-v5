<template>
  <div class="theme-switcher">
    <button
      class="theme-button"
      @click="toggleDropdown"
      :title="currentTheme.name"
    >
      <div class="theme-preview">
        <span
          class="color-dot primary"
          :style="{ backgroundColor: currentTheme.colors.primary }"
        ></span>
        <span
          class="color-dot secondary"
          :style="{ backgroundColor: currentTheme.colors.secondary }"
        ></span>
      </div>
      <span class="theme-name">{{ currentTheme.name }}</span>
      <svg class="arrow-icon" :class="{ 'open': isDropdownOpen }" viewBox="0 0 24 24">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
    </button>

    <transition name="dropdown">
      <div v-if="isDropdownOpen" class="theme-dropdown">
        <div class="theme-list">
          <div
            v-for="theme in availableThemes"
            :key="theme.id"
            class="theme-item"
            :class="{ active: theme.id === currentTheme.id }"
            @click="selectTheme(theme)"
          >
            <div class="theme-preview">
              <span
                class="color-dot primary"
                :style="{ backgroundColor: theme.colors.primary }"
              ></span>
              <span
                class="color-dot secondary"
                :style="{ backgroundColor: theme.colors.secondary }"
              ></span>
              <span
                class="color-dot yellow"
                :style="{ backgroundColor: theme.colors.yellow }"
              ></span>
              <span
                class="color-dot blue"
                :style="{ backgroundColor: theme.colors.blue }"
              ></span>
              <span
                class="color-dot purple"
                :style="{ backgroundColor: theme.colors.purple }"
              ></span>
            </div>
            <span class="theme-item-name">{{ theme.name }}</span>
            <span v-if="theme.description" class="theme-item-description">
              {{ theme.description }}
            </span>
            <svg v-if="theme.id === currentTheme.id" class="check-icon" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useThemeStore } from '../../core/store';
import type { ThemeConfig } from '../../types/theme';

const themeStore = useThemeStore();

const isDropdownOpen = ref(false);

const currentTheme = computed(() => themeStore.currentTheme);
const availableThemes = computed(() => themeStore.availableThemes);

function toggleDropdown(): void {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function selectTheme(theme: ThemeConfig): void {
  themeStore.switchTheme(theme.id);
  isDropdownOpen.value = false;
}

function closeDropdown(): void {
  isDropdownOpen.value = false;
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const switcher = document.querySelector('.theme-switcher');
  if (switcher && !switcher.contains(target)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.theme-switcher {
  position: relative;
  display: inline-block;
}

.theme-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--kid-white);
  border: 1px solid var(--kid-gray-200);
  border-radius: var(--kid-radius-lg);
  cursor: pointer;
  transition: all var(--kid-transition-base) ease;
  font-family: inherit;
  font-size: var(--kid-text-sm);
  color: var(--kid-gray-700);
}

.theme-button:hover {
  background-color: var(--kid-gray-50);
  border-color: var(--kid-gray-300);
}

.theme-preview {
  display: flex;
  gap: 4px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: transform var(--kid-transition-fast) ease;
}

.theme-button:hover .color-dot {
  transform: scale(1.1);
}

.theme-name {
  font-weight: 500;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  transition: transform var(--kid-transition-base) ease;
}

.arrow-icon.open {
  transform: rotate(180deg);
}

.theme-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 280px;
  max-height: 400px;
  overflow-y: auto;
  background-color: var(--kid-white);
  border: 1px solid var(--kid-gray-200);
  border-radius: var(--kid-radius-lg);
  box-shadow: var(--kid-shadow-xl);
  z-index: 1000;
}

.theme-list {
  padding: 8px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--kid-radius-md);
  cursor: pointer;
  transition: all var(--kid-transition-base) ease;
  flex-wrap: wrap;
}

.theme-item:hover {
  background-color: var(--kid-gray-50);
}

.theme-item.active {
  background-color: var(--kid-gray-100);
}

.theme-item .theme-preview {
  display: flex;
  gap: 3px;
}

.theme-item .color-dot {
  width: 10px;
  height: 10px;
}

.theme-item-name {
  font-size: var(--kid-text-sm);
  font-weight: 500;
  color: var(--kid-gray-700);
  flex: 1;
}

.theme-item-description {
  font-size: var(--kid-text-xs);
  color: var(--kid-gray-500);
  width: 100%;
  margin-left: 0;
  margin-top: 2px;
}

.check-icon {
  width: 20px;
  height: 20px;
  fill: var(--kid-primary);
  margin-left: auto;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--kid-transition-base) ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 响应式 */
@media (max-width: 768px) {
  .theme-dropdown {
    right: -50%;
    min-width: 240px;
  }

  .theme-button {
    padding: 6px 12px;
  }

  .theme-name {
    display: none;
  }
}

@media (max-width: 480px) {
  .theme-dropdown {
    right: -100%;
    min-width: 200px;
  }

  .theme-item {
    gap: 8px;
  }

  .theme-item-description {
    display: none;
  }
}
</style>
