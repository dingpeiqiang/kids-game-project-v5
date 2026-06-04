<template>
  <div class="theme-diy-panel" @click.stop>
    <div class="panel-header">
      <h2 class="panel-title">主题 DIY 工坊</h2>
      <button class="btn-close" @click="$emit('close')">×</button>
    </div>

    <div class="panel-content">
      <div class="tabs">
        <button
          :class="['tab', activeTab === 'info' ? 'active' : '']"
          @click="activeTab = 'info'"
        >
          基本信息
        </button>
        <button
          :class="['tab', activeTab === 'assets' ? 'active' : '']"
          @click="activeTab = 'assets'"
        >
          资源替换
        </button>
        <button
          :class="['tab', activeTab === 'styles' ? 'active' : '']"
          @click="activeTab = 'styles'"
        >
          样式配置
        </button>
        <button
          :class="['tab', activeTab === 'preview' ? 'active' : '']"
          @click="activeTab = 'preview'"
        >
          实时预览
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'info'" class="tab-pane">
          <div class="form-group">
            <label class="form-label">主题名称</label>
            <input
              v-model="themeData.name"
              type="text"
              class="form-input"
              placeholder="请输入主题名称"
            />
          </div>
          <div class="form-group">
            <label class="form-label">作者名称</label>
            <input
              v-model="themeData.author"
              type="text"
              class="form-input"
              placeholder="请输入作者名称"
            />
          </div>
          <div class="form-group">
            <label class="form-label">基于主题</label>
            <select v-model="themeData.baseThemeKey" class="form-input">
              <option v-for="theme in baseThemes" :key="theme.key" :value="theme.key">
                {{ theme.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="activeTab === 'assets'" class="tab-pane">
          <div class="asset-list">
            <div v-for="key in assetKeys" :key="key" class="asset-item">
              <div class="asset-info">
                <span class="asset-key">{{ key }}</span>
                <span v-if="currentAssets[key]" class="asset-path">{{ currentAssets[key] }}</span>
              </div>
              <div class="asset-actions">
                <label class="btn-upload">
                  <input
                    type="file"
                    :accept="getFileAccept(key)"
                    @change="(e) => handleAssetUpload(key, e)"
                    class="hidden"
                  />
                  上传
                </label>
                <button v-if="currentAssets[key]" class="btn-preview" @click="previewAsset(key)">
                  预览
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'styles'" class="tab-pane">
          <div class="style-list">
            <div v-for="key in styleKeys" :key="key" class="style-item">
              <label class="style-label">{{ formatStyleKey(key) }}</label>
              <div class="style-input-wrapper">
                <input
                  v-if="isColorKey(key)"
                  v-model="currentStyles[key]"
                  type="color"
                  class="color-picker"
                />
                <input
                  v-model="currentStyles[key]"
                  :type="isSizeKey(key) ? 'text' : 'text'"
                  class="form-input style-input"
                  :placeholder="currentStyles[key]"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'preview'" class="tab-pane">
          <div class="preview-container">
            <div class="preview-card" :style="previewStyles">
              <h3 class="preview-title" :style="{ color: currentStyles.color_text }">
                {{ themeData.name || '未命名主题' }}
              </h3>
              <p class="preview-author" :style="{ color: currentStyles.color_text }">
                作者：{{ themeData.author || '未知' }}
              </p>
              <button
                class="preview-button"
                :style="{
                  backgroundColor: currentStyles.color_primary,
                  borderRadius: currentStyles.border_radius_btn,
                }"
              >
                示例按钮
              </button>
            </div>
            <div class="preview-assets">
              <h4 class="preview-subtitle">已替换资源</h4>
              <div class="asset-preview-grid">
                <div v-for="(path, key) in assetOverrides" :key="key" class="asset-preview-item">
                  <img v-if="isImage(path)" :src="path" :alt="key" class="asset-preview-img" />
                  <div v-else class="asset-preview-placeholder">{{ key }}</div>
                  <span class="asset-preview-key">{{ key }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <button class="btn btn-secondary" @click="handleReset">重置</button>
      <button class="btn btn-primary" @click="handleSaveLocal" :disabled="!isValid">
        保存到本地
      </button>
      <button class="btn btn-success" @click="showUploadModal = true" :disabled="!isValid">
        上传到平台
      </button>
    </div>

    <div v-if="showUploadModal" class="modal-overlay" @click="showUploadModal = false">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">上传主题到平台</h3>
        <div class="form-group">
          <label class="form-label">售价（趣乐币）</label>
          <input
            v-model="uploadPrice"
            type="number"
            min="0"
            class="form-input"
            placeholder="输入 0 表示免费"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showUploadModal = false">取消</button>
          <button class="btn btn-primary" @click="handleUploadToCloud">确认上传</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { themeManager, type DiyThemeData, type ThemeConfig } from './ThemeManager';

interface Props {
  existingThemeKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  existingThemeKey: '',
});

const emit = defineEmits<{
  close: [];
  saved: [themeKey: string];
}>();

const activeTab = ref<'info' | 'assets' | 'styles' | 'preview'>('info');
const showUploadModal = ref(false);
const uploadPrice = ref(0);

const baseThemes = ref<ThemeConfig[]>([]);
const assetKeys = ref<string[]>([]);
const styleKeys = ref<string[]>([]);

const themeData = reactive<DiyThemeData>({
  baseThemeKey: 'default',
  name: '',
  author: '',
  assetOverrides: {},
  styleOverrides: {},
  createdAt: 0,
  updatedAt: 0,
});

const assetOverrides = ref<Record<string, string>>({});

const currentAssets = computed(() => {
  const baseTheme = baseThemes.value.find((t) => t.key === themeData.baseThemeKey);
  if (!baseTheme) return {};
  return { ...baseTheme.assets, ...assetOverrides.value };
});

const currentStyles = computed(() => {
  const baseTheme = baseThemes.value.find((t) => t.key === themeData.baseThemeKey);
  if (!baseTheme) return {};
  return { ...baseTheme.styles, ...themeData.styleOverrides };
});

const previewStyles = computed(() => ({
  backgroundColor: currentStyles.value.color_btn_bg || '#333333',
  padding: '20px',
  borderRadius: currentStyles.value.border_radius_btn || '8px',
}));

const isValid = computed(() => {
  return themeData.name.trim() !== '' && themeData.author.trim() !== '';
});

onMounted(async () => {
  await themeManager.loadBaseConfig();
  baseThemes.value = await themeManager.getAllThemes();
  assetKeys.value = themeManager.getBaseAssetKeys();
  styleKeys.value = themeManager.getBaseStyleKeys();

  if (props.existingThemeKey) {
    loadExistingTheme(props.existingThemeKey);
  }
});

function loadExistingTheme(themeKey: string): void {
  const theme = baseThemes.value.find((t) => t.key === themeKey);
  if (theme) {
    themeData.name = theme.name;
    themeData.author = theme.author;
    themeData.baseThemeKey = theme.key;
  }
}

function getFileAccept(key: string): string {
  if (key.includes('bgm') || key.includes('sound') || key.includes('audio')) {
    return 'audio/*';
  }
  return 'image/*';
}

function isColorKey(key: string): boolean {
  return key.toLowerCase().includes('color');
}

function isSizeKey(key: string): boolean {
  return key.toLowerCase().includes('size') || key.toLowerCase().includes('radius');
}

function formatStyleKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function isImage(path: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(path);
}

function handleAssetUpload(key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    assetOverrides.value[key] = result;
    themeData.assetOverrides = { ...themeData.assetOverrides, [key]: result };
  };
  reader.readAsDataURL(file);
}

function previewAsset(key: string): void {
  const path = currentAssets.value[key];
  if (!path) return;

  if (isImage(path)) {
    const img = new Image();
    img.src = path;
    const win = window.open('', '_blank');
    win?.document.write(img.outerHTML || '');
  } else {
    const audio = new Audio(path);
    audio.play();
  }
}

function handleReset(): void {
  themeData.assetOverrides = {};
  themeData.styleOverrides = {};
  assetOverrides.value = {};
}

function handleSaveLocal(): void {
  const themeKey = themeManager.addLocalDiyTheme({
    ...themeData,
    assetOverrides: themeData.assetOverrides,
    styleOverrides: themeData.styleOverrides,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  emit('saved', themeKey);
  emit('close');
}

async function handleUploadToCloud(): void {
  const themeKey = themeManager.addLocalDiyTheme({
    ...themeData,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const result = await themeManager.uploadDiyToCloud(themeKey, uploadPrice.value);
  if (result) {
    alert('主题上传成功！');
    showUploadModal.value = false;
    emit('close');
  } else {
    alert('上传失败，请重试');
  }
}
</script>

<style scoped>
.theme-diy-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  background: #1a1a2e;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #2d2d44;
}

.panel-title {
  margin: 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #2d2d44;
  gap: 8px;
}

.tab {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab:hover {
  color: #fff;
}

.tab.active {
  color: #42b983;
  border-bottom-color: #42b983;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  color: #aaa;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: #2d2d44;
  border: 1px solid #3d3d5c;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #42b983;
}

.form-input::placeholder {
  color: #666;
}

.asset-list,
.style-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.asset-item,
.style-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #2d2d44;
  border-radius: 8px;
}

.asset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-key {
  color: #fff;
  font-weight: 500;
  font-size: 14px;
}

.asset-path {
  color: #888;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.asset-actions {
  display: flex;
  gap: 8px;
}

.btn-upload,
.btn-preview {
  padding: 6px 12px;
  background: #42b983;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-upload:hover,
.btn-preview:hover {
  opacity: 0.9;
}

.btn-preview {
  background: #3d5afe;
}

.style-label {
  color: #fff;
  font-size: 14px;
  min-width: 120px;
}

.style-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.color-picker {
  width: 40px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.style-input {
  flex: 1;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-card {
  padding: 30px;
  border-radius: 12px;
  text-align: center;
}

.preview-title {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.preview-author {
  margin: 0 0 20px 0;
  font-size: 14px;
  opacity: 0.8;
}

.preview-button {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-button:hover {
  transform: scale(1.05);
}

.preview-assets {
  background: #2d2d44;
  padding: 20px;
  border-radius: 12px;
}

.preview-subtitle {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 16px;
}

.asset-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.asset-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.asset-preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  background: #1a1a2e;
}

.asset-preview-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  border-radius: 8px;
  color: #666;
  font-size: 12px;
}

.asset-preview-key {
  color: #888;
  font-size: 12px;
  text-align: center;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #2d2d44;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #3d3d5c;
  color: #fff;
}

.btn-secondary:hover {
  background: #4d4d6c;
}

.btn-primary {
  background: #42b983;
  color: #fff;
}

.btn-primary:hover {
  background: #3aa876;
}

.btn-success {
  background: #3d5afe;
  color: #fff;
}

.btn-success:hover {
  background: #2f45e6;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: #1a1a2e;
  padding: 30px;
  border-radius: 16px;
  min-width: 400px;
  max-width: 90vw;
}

.modal-title {
  margin: 0 0 20px 0;
  color: #fff;
  font-size: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.hidden {
  display: none;
}
</style>
