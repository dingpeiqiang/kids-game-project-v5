<template>
  <div class="theme-diy-container">
    <!-- 顶部导航 -->
    <div class="diy-header">
      <button class="btn-back" @click="handleBack">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
      <h1 class="diy-title">
        <span class="title-icon">✨</span>
        主题创作
      </h1>
      <div class="header-placeholder"></div>
    </div>

    <!-- 步骤指示器 -->
    <div class="create-steps">
      <div 
        v-for="(step, index) in createSteps" 
        :key="step.id"
        :class="['create-step', { active: currentStep === step.id, completed: isStepCompleted(step.id) }]"
      >
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-info">
          <h4 class="step-title">{{ step.title }}</h4>
          <p class="step-description">{{ step.description }}</p>
        </div>
      </div>
    </div>

    <!-- 步骤内容 -->
    <div class="step-content-wrapper">
      <!-- 基本信息 -->
      <div v-if="currentStep === 'info'" class="step-content info-step">
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">🏷️</span>
            主题名称 <span class="required">*</span>
          </label>
          <input 
            v-model="themeData.name" 
            type="text" 
            placeholder="输入主题名称" 
            class="form-input"
            maxlength="50"
          />
          <div class="form-hint">{{ themeData.name.length }}/50 字符</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">👤</span>
            作者名称 <span class="required">*</span>
          </label>
          <input 
            v-model="themeData.author" 
            type="text" 
            placeholder="输入作者名称" 
            class="form-input"
            maxlength="30"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">📝</span>
            主题描述
          </label>
          <textarea 
            v-model="themeData.description" 
            placeholder="描述你的主题特点..." 
            class="form-textarea"
            rows="4"
            maxlength="200"
          ></textarea>
          <div class="form-hint">{{ themeData.description.length }}/200 字符</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">💰</span>
            定价（趣乐币）
          </label>
          <input
            v-model.number="themeData.price"
            type="number"
            min="0"
            max="9999"
            class="form-input"
            placeholder="0 表示免费"
          />
          <div class="form-hint">
            <span v-if="themeData.price === 0">✓ 免费主题</span>
            <span v-else>付费主题：{{ themeData.price }} 趣乐币</span>
          </div>
        </div>
      </div>

      <!-- 样式配置 -->
      <div v-else-if="currentStep === 'styles'" class="step-content styles-step">
        <div class="style-editor">
          <!-- 实时预览 -->
          <div class="style-preview-section">
            <h3 class="preview-title">🎨 实时预览</h3>
            <div class="preview-container" :style="previewContainerStyle">
              <div class="preview-card" :style="previewCardStyle">
                <h4 class="preview-heading" :style="{ color: themeStyles.color_text }">
                  {{ themeData.name || '主题预览' }}
                </h4>
                <p class="preview-text" :style="{ color: themeStyles.color_text_secondary }">
                  这是一个主题预览示例
                </p>
                <button class="preview-btn primary" :style="primaryBtnStyle">
                  主要按钮
                </button>
                <button class="preview-btn secondary" :style="secondaryBtnStyle">
                  次要按钮
                </button>
              </div>
            </div>
          </div>

          <!-- 颜色配置 -->
          <div class="style-controls">
            <div class="style-section">
              <h3 class="section-title">
                <span class="title-icon">🎨</span>
                颜色配置
              </h3>
              <div class="color-grid">
                <div v-for="colorKey in colorKeys" :key="colorKey" class="color-field">
                  <label class="color-label">{{ formatLabel(colorKey) }}</label>
                  <div class="color-input-wrapper">
                    <input 
                      v-model="themeStyles[colorKey]"
                      type="color"
                      class="color-picker"
                    />
                    <input 
                      v-model="themeStyles[colorKey]"
                      type="text"
                      class="color-text-input"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 尺寸配置 -->
            <div class="style-section">
              <h3 class="section-title">
                <span class="title-icon">📐</span>
                尺寸配置
              </h3>
              <div class="size-grid">
                <div v-for="sizeKey in sizeKeys" :key="sizeKey" class="size-field">
                  <label class="size-label">{{ formatLabel(sizeKey) }}</label>
                  <input 
                    v-model="themeStyles[sizeKey]"
                    type="text"
                    class="size-input"
                    placeholder="8px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源上传 -->
      <div v-else-if="currentStep === 'assets'" class="step-content assets-step">
        <div class="assets-grid">
          <!-- 图片资源 -->
          <div class="asset-section">
            <h3 class="section-title">
              <span class="title-icon">🖼️</span>
              图片资源
            </h3>
            <div class="asset-list">
              <div v-for="imgKey in imageAssetKeys" :key="imgKey" class="asset-item">
                <div class="asset-preview-box">
                  <img 
                    v-if="themeAssets[imgKey]" 
                    :src="themeAssets[imgKey]" 
                    class="asset-preview-img"
                  />
                  <div v-else class="asset-placeholder">
                    <span class="placeholder-icon">🖼️</span>
                  </div>
                </div>
                <div class="asset-info">
                  <span class="asset-name">{{ formatLabel(imgKey) }}</span>
                  <span class="asset-size-hint">建议尺寸：{{ getAssetSizeHint(imgKey) }}</span>
                </div>
                <div class="asset-actions">
                  <label class="btn-upload">
                    <input 
                      type="file"
                      accept="image/*"
                      @change="(e) => handleAssetUpload(imgKey, e)"
                      class="hidden-input"
                    />
                    <span>上传</span>
                  </label>
                  <button 
                    v-if="themeAssets[imgKey]"
                    class="btn-remove"
                    @click="removeAsset(imgKey)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 音效资源 -->
          <div class="asset-section">
            <h3 class="section-title">
              <span class="title-icon">🎵</span>
              音效资源
            </h3>
            <div class="asset-list">
              <div v-for="audioKey in audioAssetKeys" :key="audioKey" class="asset-item">
                <div class="asset-preview-box audio">
                  <span class="audio-icon">🎵</span>
                </div>
                <div class="asset-info">
                  <span class="asset-name">{{ formatLabel(audioKey) }}</span>
                  <span v-if="themeAssets[audioKey]" class="asset-status">已上传</span>
                </div>
                <div class="asset-actions">
                  <label class="btn-upload">
                    <input 
                      type="file"
                      accept="audio/*"
                      @change="(e) => handleAssetUpload(audioKey, e)"
                      class="hidden-input"
                    />
                    <span>上传</span>
                  </label>
                  <button 
                    v-if="themeAssets[audioKey]"
                    class="btn-play"
                    @click="playAudio(audioKey)"
                  >
                    试听
                  </button>
                  <button 
                    v-if="themeAssets[audioKey]"
                    class="btn-remove"
                    @click="removeAsset(audioKey)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 发布设置 -->
      <div v-else-if="currentStep === 'publish'" class="step-content publish-step">
        <div class="publish-preview">
          <h3 class="section-title">📦 发布预览</h3>

          <div class="preview-theme-card">
            <div class="preview-thumbnail" :style="previewThumbnailStyle">
              <span class="preview-icon">✨</span>
            </div>
            <div class="preview-details">
              <h4 class="preview-name">{{ themeData.name || '未命名主题' }}</h4>
              <p class="preview-author">作者：{{ themeData.author || '未知' }}</p>
              <p class="preview-desc">{{ themeData.description || '暂无描述' }}</p>
              <div class="preview-meta">
                <span class="preview-price">
                  {{ themeData.price > 0 ? `${themeData.price} 趣乐币` : '免费' }}
                </span>
                <span class="preview-base-theme">基于：{{ baseThemeName || '默认主题' }}</span>
              </div>
            </div>
          </div>

          <div class="publish-options">
            <div class="option-group">
              <label class="option-checkbox">
                <input 
                  v-model="publishConfig.saveLocally" 
                  type="checkbox" 
                />
                <span class="checkmark"></span>
                <span class="option-text">保存到本地</span>
              </label>
              <p class="option-desc">保存主题到本地库，方便后续编辑</p>
            </div>

            <div class="option-group">
              <label class="option-checkbox">
                <input 
                  v-model="publishConfig.publishToStore" 
                  type="checkbox" 
                />
                <span class="checkmark"></span>
                <span class="option-text">发布到商店</span>
              </label>
              <p class="option-desc">将主题发布到主题商店，其他用户可以购买或下载</p>
            </div>

            <div v-if="publishConfig.publishToStore" class="option-group">
              <label class="option-label">发布状态</label>
              <select v-model="publishConfig.status" class="form-input">
                <option value="draft">保存为草稿</option>
                <option value="on_sale">立即上架销售</option>
              </select>
            </div>
          </div>

          <div class="publish-summary">
            <div class="summary-item">
              <span class="summary-label">颜色配置：</span>
              <span class="summary-value">{{ Object.keys(themeStyles).filter(k => k.includes('color')).length }} 项</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">资源文件：</span>
              <span class="summary-value">{{ Object.keys(themeAssets).length }} 个</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="step-navigation">
      <button 
        v-if="currentStep !== 'info'" 
        class="btn-nav btn-prev"
        @click="prevStep"
      >
        <span class="nav-icon">←</span>
        上一步
      </button>
      
      <div class="nav-spacer"></div>
      
      <button 
        v-if="currentStep !== 'publish'" 
        class="btn-nav btn-next"
        @click="nextStep"
        :disabled="!canProceed"
      >
        下一步
        <span class="nav-icon">→</span>
      </button>
      
      <button 
        v-if="currentStep === 'publish'" 
        class="btn-nav btn-publish"
        @click="handlePublish"
        :disabled="!canPublish || isPublishing"
      >
        <span v-if="isPublishing" class="loading-spinner"></span>
        <span v-else>{{ publishConfig.publishToStore ? '发布主题' : '保存主题' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { themeManager } from '@/core/theme/ThemeManager';
import type { DiyThemeData } from '@/core/theme/ThemeManager';
import { dialog, useConfirm } from '@/composables/useDialog';

const router = useRouter();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'published', themeId: string): void;
}>();

// Props
const props = defineProps<{
  baseThemeKey?: string;
  baseThemeName?: string;
}>();

// 步骤配置
const createSteps = [
  { id: 'info', title: '基本信息', description: '设置主题名称和基本信息' },
  { id: 'styles', title: '样式配置', description: '配置主题颜色和样式' },
  { id: 'assets', title: '资源上传', description: '上传图片和音效资源' },
  { id: 'publish', title: '发布设置', description: '确认信息并发布' },
];

const currentStep = ref('info');
const isPublishing = ref(false);

// 主题数据
const themeData = reactive({
  name: '',
  author: '',
  description: '',
  price: 0,
  baseThemeKey: props.baseThemeKey || 'default',
});

// 样式配置
const themeStyles = reactive<Record<string, string>>({
  color_primary: '#4ECDC4',
  color_secondary: '#45B7D1',
  color_background: '#FFFFFF',
  color_text: '#333333',
  color_text_secondary: '#666666',
  color_border: '#E0E0E0',
  color_card_bg: '#F5F5F5',
  border_radius_btn: '8px',
  border_radius_card: '12px',
});

// 资源文件
const themeAssets = reactive<Record<string, string>>({});

// 发布配置
const publishConfig = reactive({
  saveLocally: true,
  publishToStore: false,
  status: 'draft' as 'draft' | 'on_sale',
});

// 资源键
const colorKeys = computed(() => 
  Object.keys(themeStyles).filter(k => k.startsWith('color_'))
);

const sizeKeys = computed(() => 
  Object.keys(themeStyles).filter(k => k.includes('radius'))
);

const imageAssetKeys = ['bg_image', 'logo_image', 'icon_image'];
const audioAssetKeys = ['bgm_audio', 'effect_audio'];

// 预览样式
const previewContainerStyle = computed(() => ({
  backgroundColor: themeStyles.color_background,
}));

const previewCardStyle = computed(() => ({
  backgroundColor: themeStyles.color_card_bg,
  borderRadius: themeStyles.border_radius_card,
}));

const primaryBtnStyle = computed(() => ({
  backgroundColor: themeStyles.color_primary,
  borderRadius: themeStyles.border_radius_btn,
}));

const secondaryBtnStyle = computed(() => ({
  backgroundColor: themeStyles.color_secondary,
  borderRadius: themeStyles.border_radius_btn,
}));

const previewThumbnailStyle = computed(() => ({
  background: `linear-gradient(135deg, ${themeStyles.color_primary} 0%, ${themeStyles.color_secondary} 100%)`,
}));

// 表单验证
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'info':
      return themeData.name.trim() !== '' && themeData.author.trim() !== '';
    case 'styles':
      return true;
    case 'assets':
      return true;
    default:
      return true;
  }
});

const canPublish = computed(() => {
  return themeData.name.trim() !== '' && 
         themeData.author.trim() !== '' && 
         (publishConfig.saveLocally || publishConfig.publishToStore);
});

// 步骤完成状态
function isStepCompleted(stepId: string): boolean {
  const steps = createSteps.map(s => s.id);
  const currentIndex = steps.indexOf(currentStep.value);
  const stepIndex = steps.indexOf(stepId);
  return stepIndex < currentIndex;
}

// 格式化标签
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// 获取资源尺寸提示
function getAssetSizeHint(key: string): string {
  const hints: Record<string, string> = {
    bg_image: '1920x1080',
    logo_image: '256x256',
    icon_image: '64x64',
  };
  return hints[key] || '自定义';
}

// 处理资源上传
function handleAssetUpload(key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    themeAssets[key] = result;
  };
  reader.readAsDataURL(file);
}

// 删除资源
function removeAsset(key: string): void {
  delete themeAssets[key];
}

// 播放音频
function playAudio(key: string): void {
  const src = themeAssets[key];
  if (!src) return;
  
  const audio = new Audio(src);
  audio.play();
}

// 上一步
function prevStep(): void {
  const steps = createSteps.map(s => s.id);
  const currentIndex = steps.indexOf(currentStep.value);
  if (currentIndex > 0) {
    currentStep.value = steps[currentIndex - 1];
  }
}

// 下一步
function nextStep(): void {
  if (!canProceed.value) return;
  
  const steps = createSteps.map(s => s.id);
  const currentIndex = steps.indexOf(currentStep.value);
  if (currentIndex < steps.length - 1) {
    currentStep.value = steps[currentIndex + 1];
  }
}

// 返回
async function handleBack(): Promise<void> {
  if (currentStep.value !== 'info') {
    const confirmed = await useConfirm({ message: '确定要返回吗？当前步骤的内容将不会保存。', title: '确认返回' });
    if (confirmed) emit('close');
  } else {
    emit('close');
  }
}

// 发布主题
async function handlePublish(): Promise<void> {
  if (!canPublish.value || isPublishing.value) return;

  isPublishing.value = true;
  
  try {
    const themeDataToSave: DiyThemeData = {
      baseThemeKey: themeData.baseThemeKey,
      name: themeData.name,
      author: themeData.author,
      description: themeData.description,
      assetOverrides: { ...themeAssets },
      styleOverrides: { ...themeStyles },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (publishConfig.saveLocally) {
      const themeKey = await themeManager.addLocalDiyTheme(themeDataToSave);
      console.log('[ThemeDIY] Theme saved locally:', themeKey);
    }

    if (publishConfig.publishToStore) {
      const result = await themeManager.uploadDiyToCloud(
        themeData.name,
        themeData.price,
        themeData.description,
        themeDataToSave.assetOverrides,
        themeDataToSave.styleOverrides
      );
      
      if (result) {
        emit('published', result);
      }
    }

    emit('close');
  } catch (error) {
    console.error('[ThemeDIY] Publish failed:', error);
    await dialog.error('发布失败，请重试');
  } finally {
    isPublishing.value = false;
  }
}

// 初始化
onMounted(() => {
  if (props.baseThemeName) {
    themeData.description = `基于"${props.baseThemeName}"的个性化主题`;
  }
});
</script>

<style scoped>
.theme-diy-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.diy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e0e0e0;
}

.back-icon {
  font-size: 18px;
}

.diy-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.title-icon {
  font-size: 28px;
}

.header-placeholder {
  width: 100px;
}

/* 步骤指示器 */
.create-steps {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 32px 24px;
  background: white;
  border-bottom: 1px solid #eee;
  position: relative;
}

.create-steps::before {
  content: '';
  position: absolute;
  top: 52px;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #e0e0e0;
  z-index: 0;
}

.create-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #999;
  margin-bottom: 12px;
  transition: all 0.3s;
  border: 2px solid #e0e0e0;
}

.create-step.active .step-number {
  background: #4ECDC4;
  color: white;
  border-color: #4ECDC4;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.create-step.completed .step-number {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.step-info {
  text-align: center;
}

.step-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.step-description {
  margin: 0;
  font-size: 12px;
  color: #888;
  max-width: 120px;
}

/* 步骤内容 */
.step-content-wrapper {
  flex: 1;
  padding: 32px 24px;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.step-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 表单样式 */
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.label-icon {
  font-size: 16px;
}

.required {
  color: #ff6b6b;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: #fafafa;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4ECDC4;
  background: white;
  box-shadow: 0 0 0 4px rgba(78, 205, 196, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
}

/* 样式编辑器 */
.style-editor {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 32px;
}

.style-preview-section {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
}

.preview-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.preview-container {
  padding: 20px;
  border-radius: 8px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-card {
  padding: 24px;
  text-align: center;
  width: 100%;
  max-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-heading {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 700;
}

.preview-text {
  margin: 0 0 20px 0;
  font-size: 14px;
}

.preview-btn {
  margin: 8px;
  padding: 10px 20px;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-btn:hover {
  transform: scale(1.05);
}

/* 颜色和尺寸配置 */
.style-controls {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.style-section {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.color-grid,
.size-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.color-field,
.size-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-label,
.size-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 48px;
  height: 36px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.color-text-input,
.size-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
  background: white;
}

.color-text-input:focus,
.size-input:focus {
  outline: none;
  border-color: #4ECDC4;
}

/* 资源上传 */
.assets-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.asset-section {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.asset-preview-box {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.asset-preview-box.audio {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.asset-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 28px;
  opacity: 0.5;
}

.audio-icon {
  font-size: 28px;
}

.asset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.asset-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.asset-size-hint,
.asset-status {
  font-size: 12px;
  color: #888;
}

.asset-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-upload,
.btn-play,
.btn-remove {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upload {
  background: #4ECDC4;
  color: white;
}

.btn-play {
  background: #45B7D1;
  color: white;
}

.btn-remove {
  background: #ff6b6b;
  color: white;
}

.btn-upload:hover,
.btn-play:hover,
.btn-remove:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.hidden-input {
  display: none;
}

/* 发布设置 */
.publish-preview {
  max-width: 800px;
  margin: 0 auto;
}

.preview-theme-card {
  display: flex;
  gap: 24px;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 32px;
}

.preview-thumbnail {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-icon {
  font-size: 48px;
}

.preview-details {
  flex: 1;
}

.preview-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.preview-author {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.preview-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #888;
  line-height: 1.5;
}

.preview-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.preview-price {
  font-weight: 600;
  color: #4ECDC4;
}

.preview-base-theme {
  color: #888;
  font-size: 13px;
}

/* 发布选项 */
.publish-options {
  margin-bottom: 32px;
}

.option-group {
  margin-bottom: 20px;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.option-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.option-text {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.option-desc {
  margin: 8px 0 0 32px;
  font-size: 13px;
  color: #888;
}

.option-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 发布摘要 */
.publish-summary {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 底部导航 */
.step-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.nav-spacer {
  flex: 1;
}

.btn-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-prev {
  background: #f0f0f0;
  color: #666;
}

.btn-prev:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-next {
  background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
  color: white;
}

.btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.btn-publish {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
  color: white;
  min-width: 140px;
  justify-content: center;
}

.btn-publish:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.nav-icon {
  font-size: 18px;
}

/* 加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .style-editor {
    grid-template-columns: 1fr;
  }
  
  .assets-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .create-steps {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
  }
  
  .create-steps::before {
    display: none;
  }
  
  .create-step {
    flex-direction: row;
    text-align: left;
  }
  
  .step-info {
    text-align: left;
  }
  
  .step-description {
    max-width: none;
  }
  
  .step-content {
    padding: 20px;
  }
  
  .preview-theme-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .preview-thumbnail {
    width: 100px;
    height: 100px;
  }
  
  .preview-meta {
    justify-content: center;
  }
  
  .color-grid,
  .size-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .diy-header {
    padding: 16px;
  }
  
  .diy-title {
    font-size: 20px;
  }
  
  .btn-back span:not(.back-icon) {
    display: none;
  }
  
  .asset-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .asset-actions {
    width: 100%;
  }
  
  .btn-upload,
  .btn-play,
  .btn-remove {
    flex: 1;
    text-align: center;
  }
  
  .btn-nav {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
