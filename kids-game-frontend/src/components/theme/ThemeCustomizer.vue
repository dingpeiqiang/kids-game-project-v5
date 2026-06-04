<template>
  <div class="theme-customizer">
    <div class="customizer-header">
      <h3>自定义主题</h3>
      <button class="close-button" @click="$emit('close')">×</button>
    </div>

    <div class="customizer-content">
      <!-- 主题名称 -->
      <div class="form-group">
        <label>主题名称</label>
        <input
          v-model="themeName"
          type="text"
          placeholder="输入主题名称"
          class="form-input"
        />
      </div>

      <!-- 颜色配置 -->
      <div class="color-section">
        <h4>主题颜色</h4>
        <div class="color-grid">
          <div v-for="(color, key) in colorLabels" :key="key" class="color-field">
            <label>{{ color.label }}</label>
            <div class="color-input-wrapper">
              <input
                v-model="themeColors[key]"
                type="color"
                class="color-input"
              />
              <input
                v-model="themeColors[key]"
                type="text"
                class="color-text-input"
                :placeholder="color.defaultValue"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 功能色配置 -->
      <div class="color-section">
        <h4>功能颜色</h4>
        <div class="color-grid">
          <div v-for="(label, key) in functionalColorLabels" :key="key" class="color-field">
            <label>{{ label }}</label>
            <div class="color-input-wrapper">
              <input
                v-model="themeColors[key]"
                type="color"
                class="color-input"
              />
              <input
                v-model="themeColors[key]"
                type="text"
                class="color-text-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="customizer-footer">
      <button class="btn btn-secondary" @click="resetToDefault">重置</button>
      <button class="btn btn-primary" @click="saveTheme" :disabled="!canSave">
        保存主题
      </button>
    </div>

    <!-- 预览区域 -->
    <div class="theme-preview">
      <h4>主题预览</h4>
      <div class="preview-buttons">
        <button class="preview-btn preview-btn-primary">主要按钮</button>
        <button class="preview-btn preview-btn-secondary">次要按钮</button>
        <button class="preview-btn preview-btn-warning">警告按钮</button>
        <button class="preview-btn preview-btn-error">错误按钮</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useThemeStore } from '../../core/store';
import type { ThemeConfig } from '../../types/theme';

const emit = defineEmits<{
  close: [];
  saved: [themeId: string];
}>();

const themeStore = useThemeStore();

// 主题名称
const themeName = ref('我的主题');

// 主题颜色
const themeColors = reactive({
  primary: '#FF6B9D',
  secondary: '#4ECDC4',
  yellow: '#FFE66D',
  blue: '#45B7D1',
  purple: '#A66CFF',
  success: '#4ECDC4',
  warning: '#FFE66D',
  error: '#FF6B9D',
  info: '#45B7D1',
});

// 颜色标签映射
const colorLabels = {
  primary: { label: '主色调', defaultValue: '#FF6B9D' },
  secondary: { label: '次色调', defaultValue: '#4ECDC4' },
  yellow: { label: '黄色', defaultValue: '#FFE66D' },
  blue: { label: '蓝色', defaultValue: '#45B7D1' },
  purple: { label: '紫色', defaultValue: '#A66CFF' },
};

const functionalColorLabels = {
  success: '成功',
  warning: '警告',
  error: '错误',
  info: '信息',
};

// 是否可以保存
const canSave = computed(() => {
  return themeName.value.trim() !== '' &&
    Object.values(themeColors).every(color => color !== '');
});

// 重置为默认
function resetToDefault(): void {
  const defaultTheme = themeStore.currentTheme;
  themeName.value = '我的主题';
  Object.assign(themeColors, {
    primary: defaultTheme.colors.primary,
    secondary: defaultTheme.colors.secondary,
    yellow: defaultTheme.colors.yellow,
    blue: defaultTheme.colors.blue,
    purple: defaultTheme.colors.purple,
    success: defaultTheme.colors.success,
    warning: defaultTheme.colors.warning,
    error: defaultTheme.colors.error,
    info: defaultTheme.colors.info,
  });
}

// 保存主题
function saveTheme(): void {
  const themeConfig: Omit<ThemeConfig, 'id'> = {
    name: themeName.value,
    colors: {
      primary: themeColors.primary,
      secondary: themeColors.secondary,
      yellow: themeColors.yellow,
      blue: themeColors.blue,
      purple: themeColors.purple,
      white: '#ffffff',
      gray: themeStore.currentTheme.colors.gray,
      success: themeColors.success,
      warning: themeColors.warning,
      error: themeColors.error,
      info: themeColors.info,
    },
    typography: themeStore.currentTheme.typography,
    radius: themeStore.currentTheme.radius,
    shadow: themeStore.currentTheme.shadow,
    spacing: themeStore.currentTheme.spacing,
    transition: themeStore.currentTheme.transition,
  };

  const themeId = themeStore.createCustomTheme(themeConfig);
  themeStore.switchTheme(themeId);

  emit('saved', themeId);
  emit('close');
}
</script>

<style scoped>
.theme-customizer {
  background-color: var(--kid-white);
  border-radius: var(--kid-radius-lg);
  box-shadow: var(--kid-shadow-xl);
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.customizer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--kid-gray-200);
}

.customizer-header h3 {
  margin: 0;
  font-size: var(--kid-text-lg);
  color: var(--kid-gray-800);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--kid-gray-500);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--kid-transition-fast);
}

.close-button:hover {
  color: var(--kid-gray-700);
}

.customizer-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--kid-text-sm);
  font-weight: 500;
  color: var(--kid-gray-700);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--kid-gray-300);
  border-radius: var(--kid-radius-md);
  font-size: var(--kid-text-base);
  transition: border-color var(--kid-transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--kid-primary);
}

.color-section {
  margin-bottom: 24px;
}

.color-section h4 {
  margin: 0 0 12px 0;
  font-size: var(--kid-text-sm);
  font-weight: 600;
  color: var(--kid-gray-800);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.color-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-field label {
  font-size: var(--kid-text-xs);
  color: var(--kid-gray-600);
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--kid-radius-sm);
  cursor: pointer;
}

.color-text-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--kid-gray-300);
  border-radius: var(--kid-radius-sm);
  font-size: var(--kid-text-sm);
  font-family: monospace;
  text-transform: uppercase;
}

.color-text-input:focus {
  outline: none;
  border-color: var(--kid-primary);
}

.customizer-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--kid-gray-200);
}

.btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: var(--kid-radius-md);
  font-size: var(--kid-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--kid-transition-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--kid-primary);
  color: white;
}

.btn-primary:not(:disabled):hover {
  background-color: color-mix(in srgb, var(--kid-primary) 90%, black);
}

.btn-secondary {
  background-color: var(--kid-gray-100);
  color: var(--kid-gray-700);
}

.btn-secondary:hover {
  background-color: var(--kid-gray-200);
}

.theme-preview {
  padding: 20px;
  background-color: var(--kid-gray-50);
  border-top: 1px solid var(--kid-gray-200);
}

.theme-preview h4 {
  margin: 0 0 12px 0;
  font-size: var(--kid-text-sm);
  font-weight: 600;
  color: var(--kid-gray-800);
}

.preview-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--kid-radius-md);
  font-size: var(--kid-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: transform var(--kid-transition-fast);
}

.preview-btn:hover {
  transform: scale(1.02);
}

.preview-btn-primary {
  background-color: v-bind('themeColors.primary');
  color: white;
}

.preview-btn-secondary {
  background-color: v-bind('themeColors.secondary');
  color: white;
}

.preview-btn-warning {
  background-color: v-bind('themeColors.warning');
  color: var(--kid-gray-800);
}

.preview-btn-error {
  background-color: v-bind('themeColors.error');
  color: white;
}

/* 响应式 */
@media (max-width: 480px) {
  .theme-customizer {
    max-width: 100%;
    max-height: 90vh;
  }

  .color-grid {
    grid-template-columns: 1fr;
  }

  .preview-buttons {
    flex-direction: column;
  }

  .preview-btn {
    width: 100%;
  }
}
</style>
