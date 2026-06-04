<template>
  <div class="theme-demo">
    <div class="demo-header">
      <h1>主题系统演示</h1>
      <div class="theme-controls">
        <ThemeSwitcher />
        <button class="btn-customize" @click="showCustomizer = true">
          自定义主题
        </button>
      </div>
    </div>

    <div class="demo-content">
      <!-- 颜色演示 -->
      <section class="demo-section">
        <h2>主题颜色</h2>
        <div class="color-palette">
          <div v-for="(color, key) in colorSwatches" :key="key" class="color-swatch">
            <div
              class="swatch"
              :style="{ backgroundColor: color.value }"
            ></div>
            <span class="color-name">{{ color.name }}</span>
            <span class="color-value">{{ color.value }}</span>
          </div>
        </div>
      </section>

      <!-- 按钮演示 -->
      <section class="demo-section">
        <h2>按钮样式</h2>
        <div class="button-group">
          <button class="btn btn-primary">主要按钮</button>
          <button class="btn btn-secondary">次要按钮</button>
          <button class="btn btn-warning">警告按钮</button>
          <button class="btn btn-error">错误按钮</button>
          <button class="btn btn-success">成功按钮</button>
        </div>
      </section>

      <!-- 卡片演示 -->
      <section class="demo-section">
        <h2>卡片样式</h2>
        <div class="card-grid">
          <div v-for="i in 4" :key="i" class="card">
            <div class="card-header">
              <h3>卡片 {{ i }}</h3>
            </div>
            <div class="card-body">
              <p>这是一个演示卡片，展示当前主题的效果。</p>
              <button class="btn btn-sm btn-primary">操作</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 表单演示 -->
      <section class="demo-section">
        <h2>表单样式</h2>
        <div class="form-demo">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" placeholder="请输入用户名" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" placeholder="请输入密码" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea rows="3" placeholder="请输入备注"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary">取消</button>
            <button class="btn btn-primary">提交</button>
          </div>
        </div>
      </section>

      <!-- 状态演示 -->
      <section class="demo-section">
        <h2>状态提示</h2>
        <div class="status-group">
          <div class="status status-success">
            <span class="status-icon">✓</span>
            <span>操作成功</span>
          </div>
          <div class="status status-warning">
            <span class="status-icon">⚠</span>
            <span>请注意</span>
          </div>
          <div class="status status-error">
            <span class="status-icon">✕</span>
            <span>操作失败</span>
          </div>
          <div class="status status-info">
            <span class="status-icon">ℹ</span>
            <span>提示信息</span>
          </div>
        </div>
      </section>

      <!-- 当前主题信息 -->
      <section class="demo-section">
        <h2>当前主题信息</h2>
        <div class="theme-info">
          <div class="info-item">
            <span class="info-label">主题名称：</span>
            <span class="info-value">{{ currentTheme.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">主题 ID：</span>
            <span class="info-value">{{ currentTheme.id }}</span>
          </div>
          <div class="info-item" v-if="currentTheme.description">
            <span class="info-label">主题描述：</span>
            <span class="info-value">{{ currentTheme.description }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">主题类型：</span>
            <span class="info-value">{{ themeType }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 自定义主题对话框 -->
    <div v-if="showCustomizer" class="customizer-overlay" @click="showCustomizer = false">
      <div class="customizer-modal" @click.stop>
        <ThemeCustomizer
          @close="showCustomizer = false"
          @saved="onThemeSaved"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useThemeStore } from '@/core/store';
import { ThemeSwitcher, ThemeCustomizer } from '@/components/theme';

const themeStore = useThemeStore();
const showCustomizer = ref(false);

const currentTheme = computed(() => themeStore.currentTheme);

const colorSwatches = computed(() => [
  { name: '主色调', value: currentTheme.value.colors.primary },
  { name: '次色调', value: currentTheme.value.colors.secondary },
  { name: '黄色', value: currentTheme.value.colors.yellow },
  { name: '蓝色', value: currentTheme.value.colors.blue },
  { name: '紫色', value: currentTheme.value.colors.purple },
  { name: '成功', value: currentTheme.value.colors.success },
  { name: '警告', value: currentTheme.value.colors.warning },
  { name: '错误', value: currentTheme.value.colors.error },
  { name: '信息', value: currentTheme.value.colors.info },
]);

const themeType = computed(() => {
  if (themeStore.isCustomTheme(currentTheme.value.id)) {
    return '自定义主题';
  }
  return '预设主题';
});

function onThemeSaved(themeId: string): void {
  console.log('自定义主题已保存:', themeId);
}
</script>

<style scoped>
.theme-demo {
  min-height: 100vh;
  background-color: var(--kid-gray-50);
  padding: 20px;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 20px;
  background-color: var(--kid-white);
  border-radius: var(--kid-radius-lg);
  box-shadow: var(--kid-shadow-md);
}

.demo-header h1 {
  margin: 0;
  color: var(--kid-gray-800);
  font-size: var(--kid-text-2xl);
}

.theme-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.btn-customize {
  padding: 10px 20px;
  background-color: var(--kid-primary);
  color: white;
  border: none;
  border-radius: var(--kid-radius-md);
  font-size: var(--kid-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--kid-transition-fast);
}

.btn-customize:hover {
  background-color: color-mix(in srgb, var(--kid-primary) 90%, black);
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  background-color: var(--kid-white);
  border-radius: var(--kid-radius-lg);
  box-shadow: var(--kid-shadow-md);
  padding: 24px;
  margin-bottom: 24px;
}

.demo-section h2 {
  margin: 0 0 20px 0;
  color: var(--kid-gray-800);
  font-size: var(--kid-text-xl);
  border-bottom: 2px solid var(--kid-gray-100);
  padding-bottom: 12px;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.color-swatch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.swatch {
  height: 80px;
  border-radius: var(--kid-radius-md);
  box-shadow: var(--kid-shadow-sm);
  transition: transform var(--kid-transition-fast);
}

.swatch:hover {
  transform: scale(1.05);
}

.color-name {
  font-size: var(--kid-text-sm);
  font-weight: 500;
  color: var(--kid-gray-700);
}

.color-value {
  font-size: var(--kid-text-xs);
  font-family: monospace;
  color: var(--kid-gray-500);
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--kid-radius-md);
  font-size: var(--kid-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--kid-transition-fast);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--kid-shadow-md);
}

.btn-primary {
  background-color: var(--kid-primary);
  color: white;
}

.btn-secondary {
  background-color: var(--kid-secondary);
  color: white;
}

.btn-warning {
  background-color: var(--kid-warning);
  color: var(--kid-gray-800);
}

.btn-error {
  background-color: var(--kid-error);
  color: white;
}

.btn-success {
  background-color: var(--kid-success);
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: var(--kid-text-xs);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.card {
  background-color: var(--kid-gray-50);
  border-radius: var(--kid-radius-md);
  overflow: hidden;
  border: 1px solid var(--kid-gray-200);
  transition: all var(--kid-transition-fast);
}

.card:hover {
  box-shadow: var(--kid-shadow-lg);
  transform: translateY(-4px);
}

.card-header {
  padding: 16px;
  background-color: var(--kid-primary);
  color: white;
}

.card-header h3 {
  margin: 0;
  font-size: var(--kid-text-lg);
}

.card-body {
  padding: 16px;
}

.card-body p {
  margin: 0 0 12px 0;
  color: var(--kid-gray-600);
  font-size: var(--kid-text-sm);
}

.form-demo {
  max-width: 400px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--kid-text-sm);
  font-weight: 500;
  color: var(--kid-gray-700);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--kid-gray-300);
  border-radius: var(--kid-radius-md);
  font-size: var(--kid-text-base);
  transition: border-color var(--kid-transition-fast);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--kid-primary);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.status-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--kid-radius-md);
  font-size: var(--kid-text-sm);
  font-weight: 500;
}

.status-success {
  background-color: rgba(var(--kid-success), 0.1);
  color: var(--kid-success);
  border: 1px solid var(--kid-success);
}

.status-warning {
  background-color: rgba(var(--kid-warning), 0.1);
  color: var(--kid-warning);
  border: 1px solid var(--kid-warning);
}

.status-error {
  background-color: rgba(var(--kid-error), 0.1);
  color: var(--kid-error);
  border: 1px solid var(--kid-error);
}

.status-info {
  background-color: rgba(var(--kid-info), 0.1);
  color: var(--kid-info);
  border: 1px solid var(--kid-info);
}

.status-icon {
  font-weight: bold;
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  gap: 8px;
  font-size: var(--kid-text-sm);
}

.info-label {
  color: var(--kid-gray-600);
  font-weight: 500;
  min-width: 80px;
}

.info-value {
  color: var(--kid-gray-800);
  font-family: monospace;
}

.customizer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.customizer-modal {
  background-color: var(--kid-white);
  border-radius: var(--kid-radius-lg);
  box-shadow: var(--kid-shadow-xl);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

/* 响应式 */
@media (max-width: 768px) {
  .demo-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .theme-controls {
    justify-content: space-between;
  }

  .color-palette {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
