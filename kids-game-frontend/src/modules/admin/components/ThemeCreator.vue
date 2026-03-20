<template>
  <div class="theme-creator">
    <!-- 头部 -->
    <div class="creator-header">
      <h2 class="title">🎨 主题创作</h2>
      <button @click="close" class="btn-close">✕</button>
    </div>

    <div class="creator-content">
      <!-- 左侧：配置面板 -->
      <div class="config-panel">
        <!-- 1. 基础信息 -->
        <section class="config-section">
          <h3 class="section-title">📝 基础信息</h3>
          
          <div class="form-group">
            <label class="form-label">主题名称 *</label>
            <input 
              v-model="formData.basic.name" 
              type="text" 
              class="form-input"
              placeholder="如：粉彩应用主题、贪吃蛇经典绿色"
            />
          </div>

          <div class="form-group">
            <label class="form-label">作者名称</label>
            <input 
              v-model="formData.basic.author" 
              type="text" 
              class="form-input"
              placeholder="官方设计师"
            />
          </div>

          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea 
              v-model="formData.basic.description" 
              class="form-textarea"
              rows="3"
              placeholder="主题描述信息..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">主题类型 *</label>
            <select v-model="formData.basic.applicableScope" class="form-select">
              <option value="all">🌐 应用主题 (用于首页/个人中心等)</option>
              <option value="specific">🎮 游戏主题 (指定游戏)</option>
            </select>
          </div>

          <!-- 仅当选择游戏主题时显示游戏选择器 -->
          <div v-if="formData.basic.applicableScope === 'specific'" class="form-group">
            <label class="form-label">选择游戏 *</label>
            <select v-model="formData.basic.selectedGameCode" class="form-select">
              <option value="">请选择游戏</option>
              <option v-for="game in games" :key="game.gameId" :value="game.gameCode">
                {{ game.gameName }} ({{ game.gameCode }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">价格 (游戏币)</label>
            <input 
              v-model.number="formData.basic.price" 
              type="number" 
              class="form-input"
              min="0"
            />
          </div>
        </section>

        <!-- 2. 样式配置 -->
        <section class="config-section">
          <h3 class="section-title">🎨 样式配置</h3>
          
          <!-- 颜色配置 -->
          <div class="style-subsection">
            <h4 class="subsection-title">颜色系统</h4>
            <div class="color-grid">
              <div v-for="(color, key) in formData.styles.colors" :key="key" class="color-item">
                <label class="color-label">{{ formatKey(key) }}</label>
                <div class="color-input-wrapper">
                  <input 
                    v-model="formData.styles.colors[key]" 
                    type="color" 
                    class="color-picker"
                  />
                  <input 
                    v-model="formData.styles.colors[key]" 
                    type="text" 
                    class="color-text"
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 字体大小 -->
          <div class="style-subsection">
            <h4 class="subsection-title">字体大小</h4>
            <div class="slider-grid">
              <div v-for="(size, key) in formData.styles.typography.fontSizes" :key="key" class="slider-item">
                <label class="slider-label">{{ formatKey(key) }}</label>
                <div class="slider-wrapper">
                  <input 
                    v-model="formData.styles.typography.fontSizes[key]" 
                    type="range" 
                    class="slider"
                    min="8" 
                    max="72" 
                    step="1"
                  />
                  <span class="slider-value">{{ size }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 圆角配置 -->
          <div class="style-subsection">
            <h4 class="subsection-title">圆角配置</h4>
            <div class="color-grid">
              <div v-for="(radius, key) in formData.styles.radius" :key="key" class="color-item">
                <label class="color-label">{{ formatKey(key) }}</label>
                <input 
                  v-model="formData.styles.radius[key]" 
                  type="text" 
                  class="form-input-small"
                  placeholder="8px"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 3. 资源配置 -->
        <section class="config-section">
          <h3 class="section-title">🖼️ 资源配置</h3>
          
          <div class="asset-list">
            <!-- 动态添加资源 -->
            <div v-for="(asset, key) in formData.assets" :key="key" class="asset-card">
              <div class="asset-header">
                <label class="asset-key">{{ formatKey(key) }}</label>
                <button @click="removeAsset(key)" class="btn-remove-asset">🗑️</button>
              </div>

              <!-- 资源类型选择 -->
              <select v-model="asset.type" class="form-select-small">
                <option value="color">🎨 颜色</option>
                <option value="emoji">😀 Emoji</option>
                <option value="image">🖼️ 图片 URL</option>
                <option value="audio">🎵 音频 URL</option>
              </select>

              <!-- 根据类型显示不同的输入 -->
              <div v-if="asset.type === 'color'" class="asset-input">
                <input 
                  v-model="(asset as ColorAsset).value" 
                  type="color" 
                  class="color-picker-full"
                />
              </div>

              <div v-else-if="asset.type === 'emoji'" class="asset-input">
                <input 
                  v-model="(asset as EmojiAsset).value" 
                  type="text" 
                  class="form-input"
                  placeholder="输入 emoji 字符"
                  maxlength="2"
                />
              </div>

              <div v-else-if="asset.type === 'image'" class="asset-input">
                <input 
                  v-model="(asset as ImageAsset).url" 
                  type="url" 
                  class="form-input"
                  placeholder="输入图片 URL"
                />
                <file-upload 
                  @upload="handleImageUpload(key, $event)"
                  accept="image/*"
                  class="upload-btn"
                >
                  📤 上传图片
                </file-upload>
                <img v-if="(asset as ImageAsset).url" :src="(asset as ImageAsset).url" class="asset-preview" />
              </div>

              <div v-else-if="asset.type === 'audio'" class="asset-input">
                <input 
                  v-model="(asset as AudioAsset).url" 
                  type="url" 
                  class="form-input"
                  placeholder="输入音频 URL"
                />
                <file-upload 
                  @upload="handleAudioUpload(key, $event)"
                  accept="audio/*"
                  class="upload-btn"
                >
                  📤 上传音频
                </file-upload>
                <div v-if="(asset as AudioAsset).url" class="audio-controls">
                  <audio :src="(asset as AudioAsset).url" controls class="audio-player" />
                  <div class="volume-control">
                    <label>音量:</label>
                    <input 
                      v-model.number="(asset as AudioAsset).volume" 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      class="slider"
                    />
                    <span>{{ ((asset as AudioAsset).volume || 0.5) * 100 }}%</span>
                  </div>
                  <label class="checkbox-label">
                    <input v-model="(asset as AudioAsset).loop" type="checkbox" />
                    循环播放
                  </label>
                </div>
              </div>
            </div>

            <!-- 添加新资源按钮 -->
            <button @click="addNewAsset" class="btn-add-asset">➕ 添加资源</button>
          </div>
        </section>

        <!-- 4. 音频配置 -->
        <section class="config-section">
          <h3 class="section-title">🎵 音频配置</h3>
          
          <div class="audio-list">
            <div v-for="(sound, key) in formData.audio" :key="key" class="audio-item">
              <label class="audio-key">{{ formatKey(key) }}</label>
              
              <input 
                v-model="sound.url" 
                type="url" 
                class="form-input"
                placeholder="音频 URL"
              />
              
              <file-upload 
                @upload="handleAudioUpload(key, $event)"
                accept="audio/*"
                class="upload-btn"
              >
                📤 上传音频
              </file-upload>

              <div v-if="sound.url" class="audio-controls-inline">
                <audio :src="sound.url" controls class="audio-player-small" />
                
                <div class="volume-slider">
                  <label>音量:</label>
                  <input 
                    v-model.number="sound.volume" 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    class="slider"
                  />
                  <span class="volume-value">{{ (sound.volume || 0.5) * 100 }}%</span>
                </div>

                <label v-if="key.includes('bgm')" class="checkbox-label">
                  <input v-model="sound.loop" type="checkbox" />
                  循环
                </label>

                <button @click="removeAudio(key)" class="btn-remove-audio">🗑️</button>
              </div>
            </div>

            <button @click="addNewAudio" class="btn-add-audio">➕ 添加音频</button>
          </div>
        </section>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="preview-panel">
        <h3 class="section-title">👁️ 实时预览</h3>
        <ThemePreview 
          :config="getThemeConfig()" 
          :preview-type="formData.basic.applicableScope === 'specific' ? 'game' : 'application'"
          :game-code="formData.basic.selectedGameCode"
        />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="creator-footer">
      <button @click="saveToLocal" class="btn-secondary">💾 保存到本地</button>
      <button @click="saveToCloud" class="btn-primary" :disabled="!validateForm()">
        ☁️ 上传到云端
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { 
  ThemeFormData, 
  ThemeConfig, 
  ThemeAsset, 
  ColorAsset, 
  EmojiAsset, 
  ImageAsset, 
  AudioAsset
} from '@/types/theme.types';
import ThemePreview from './ThemePreview.vue';
import { dialog } from '@/composables/useDialog';
import FileUpload from '@/components/FileUpload.vue';

const emit = defineEmits<{
  close: [];
  saved: [success: boolean];
}>();

// 游戏列表 (示例数据)
const games = ref([
  { gameId: 1, gameName: '贪吃蛇', gameCode: 'snake-vue3' },
  { gameId: 2, gameName: '飞机大战', gameCode: 'plane-shooter' },
]);

// 表单数据
const formData = reactive<ThemeFormData>({
  basic: {
    name: '',
    author: '官方设计师',
    description: '',
    applicableScope: 'all',
    price: 0,
  },
  
  styles: {
    colors: {
      primary: '#FF6B9D',
      secondary: '#4ECDC4',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#1f2937',
      accent: '#FFE66D',
      success: '#4ECDC4',
      warning: '#FFE66D',
      error: '#FF6B9D',
    },
    typography: {
      fontFamily: '"Inter", "Microsoft YaHei", sans-serif',
      fontSizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
    },
    radius: {
      sm: '0.375rem',
      base: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      base: '0 4px 6px rgba(0,0,0,0.1)',
    },
  },
  
  assets: {
    bg_main: { type: 'color', value: '#f9fafb' },
    icon_logo: { type: 'emoji', value: '🌈' },
    icon_home: { type: 'emoji', value: '🏠' },
    btn_primary: { type: 'color', value: '#FF6B9D' },
  },
  
  audio: {
    sfx_click: { type: 'audio', url: '', volume: 0.4 },
    sfx_notification: { type: 'audio', url: '', volume: 0.45 },
  },
});

// 格式化键名
function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
}

// 添加新资源
function addNewAsset() {
  const key = prompt('请输入资源键名 (如：bg_header, icon_shop):');
  if (key && !formData.assets[key]) {
    formData.assets[key] = { type: 'color', value: '#ffffff' };
  }
}

// 移除资源
function removeAsset(key: string) {
  delete formData.assets[key];
}

// 添加新音频
function addNewAudio() {
  const key = prompt('请输入音频键名 (如：bgm_menu, sfx_jump):');
  if (key && !formData.audio[key]) {
    formData.audio[key] = { type: 'audio', url: '', volume: 0.5, loop: false };
  }
}

// 移除音频
function removeAudio(key: string) {
  delete formData.audio[key];
}

// 处理图片上传
function handleImageUpload(key: string, event: any) {
  // TODO: 实现文件上传逻辑
  console.log('上传图片:', key, event);
}

// 处理音频上传
function handleAudioUpload(key: string, event: any) {
  // TODO: 实现文件上传逻辑
  console.log('上传音频:', key, event);
}

// 获取主题配置对象
function getThemeConfig(): ThemeConfig {
  return {
    default: {
      name: formData.basic.name,
      author: formData.basic.author,
      description: formData.basic.description,
      styles: formData.styles,
      assets: formData.assets,
      audio: formData.audio,
    },
  };
}

// 验证表单
function validateForm(): boolean {
  if (!formData.basic.name) {
    dialog.warning('请输入主题名称');
    return false;
  }
  
  if (formData.basic.applicableScope === 'specific' && !formData.basic.selectedGameCode) {
    dialog.warning('请选择游戏');
    return false;
  }
  
  return true;
}

// 保存到本地
function saveToLocal() {
  const config = getThemeConfig();
  localStorage.setItem('theme-draft', JSON.stringify(config));
  dialog.success('已保存到本地草稿');
}

// 上传到云端
async function saveToCloud() {
  if (!validateForm()) return;
  
  try {
    const payload = {
      themeName: formData.basic.name,
      authorName: formData.basic.author,
      applicableScope: formData.basic.applicableScope,
      price: formData.basic.price,
      description: formData.basic.description,
      config: getThemeConfig(),
      gameId: formData.basic.selectedGameId,
      gameCode: formData.basic.selectedGameCode,
    };
    
    // TODO: 调用 API 上传
    
    await dialog.success('上传成功!');
    emit('saved', true);
  } catch (error) {
    console.error('上传失败:', error);
    await dialog.error('上传失败，请重试');
  }
}

// 关闭
function close() {
  emit('close');
}
</script>

<style scoped lang="scss">
.theme-creator {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.creator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  
  .title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  
  .btn-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 20px;
    
    &:hover {
      background: #f0f0f0;
    }
  }
}

.creator-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  
  .config-panel {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .preview-panel {
    width: 500px;
    border-left: 1px solid #e0e0e0;
    padding: 20px;
    background: white;
    overflow-y: auto;
  }
}

.config-section {
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  
  .section-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;
  }
}

.style-subsection {
  margin-bottom: 20px;
  
  .subsection-title {
    font-size: 16px;
    font-weight: bold;
    color: #666;
    margin-bottom: 12px;
  }
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  
  .color-item {
    display: flex;
    flex-direction: column;
    
    .color-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 6px;
    }
    
    .color-input-wrapper {
      display: flex;
      gap: 8px;
      
      .color-picker {
        width: 50px;
        height: 36px;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
      }
      
      .color-text {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: monospace;
      }
    }
  }
}

.slider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  
  .slider-item {
    display: flex;
    flex-direction: column;
    
    .slider-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 6px;
    }
    
    .slider-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .slider {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: #e0e0e0;
        outline: none;
        
        &::-webkit-slider-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4ECDC4;
          cursor: pointer;
        }
      }
      
      .slider-value {
        min-width: 60px;
        font-size: 13px;
        color: #333;
        font-family: monospace;
      }
    }
  }
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .asset-card {
    background: #f9fafb;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e0e0e0;
    
    .asset-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .asset-key {
        font-size: 14px;
        font-weight: bold;
        color: #333;
      }
      
      .btn-remove-asset {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 18px;
        opacity: 0.6;
        
        &:hover {
          opacity: 1;
        }
      }
    }
    
    .asset-input {
      margin-top: 12px;
      
      .asset-preview {
        max-width: 200px;
        max-height: 200px;
        border-radius: 8px;
        margin-top: 8px;
        display: block;
      }
      
      .audio-controls {
        margin-top: 12px;
        
        .audio-player {
          width: 100%;
          margin-bottom: 8px;
        }
        
        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          
          .slider {
            flex: 1;
          }
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #666;
          cursor: pointer;
        }
      }
    }
  }
  
  .btn-add-asset {
    padding: 12px;
    background: #f0f0f0;
    border: 2px dashed #ccc;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    
    &:hover {
      background: #e0e0e0;
      border-color: #999;
    }
  }
}

.audio-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .audio-item {
    background: #f9fafb;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    
    .audio-key {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
      display: block;
    }
    
    .audio-controls-inline {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      
      .audio-player-small {
        flex: 1;
        min-width: 200px;
      }
      
      .volume-slider {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .slider {
          width: 100px;
        }
        
        .volume-value {
          min-width: 40px;
          font-size: 13px;
        }
      }
      
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        cursor: pointer;
      }
      
      .btn-remove-audio {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 18px;
        opacity: 0.6;
        
        &:hover {
          opacity: 1;
        }
      }
    }
  }
  
  .btn-add-audio {
    padding: 12px;
    background: #f0f0f0;
    border: 2px dashed #ccc;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    
    &:hover {
      background: #e0e0e0;
    }
  }
}

.creator-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  
  .btn-secondary {
    padding: 12px 24px;
    background: #f0f0f0;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    
    &:hover {
      background: #e0e0e0;
    }
  }
  
  .btn-primary {
    padding: 12px 24px;
    background: #4ECDC4;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    
    &:hover:not(:disabled) {
      background: #45b7aa;
    }
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
}

.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.form-input-small {
  width: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.form-select-small {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  margin-bottom: 8px;
}

.upload-btn {
  margin-top: 8px;
  padding: 8px 16px;
  background: #4ECDC4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  
  &:hover {
    background: #45b7aa;
  }
}

.color-picker-full {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}
</style>
