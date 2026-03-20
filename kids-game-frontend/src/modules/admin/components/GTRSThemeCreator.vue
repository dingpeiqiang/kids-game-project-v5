<template>
  <div class="gtrs-theme-creator">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span class="title">🎨 GTRS 主题编辑器</span>
          <div class="actions">
            <el-button @click="loadTemplate">加载模板</el-button>
            <el-button @click="resetToDefault">重置默认</el-button>
            <el-button type="primary" @click="saveTheme">保存主题</el-button>
          </div>
        </div>
      </template>

      <div class="editor-layout">
        <!-- 左侧：编辑区 -->
        <div class="edit-panel">
          <!-- 1. 主题基础信息 -->
          <el-card shadow="hover" class="section-card">
            <template #header>
              <span class="section-title">📋 主题基础信息</span>
            </template>
            <el-form label-width="120px" size="default">
              <el-form-item label="主题ID">
                <el-input v-model="themeData.themeInfo.themeId" placeholder="英文+数字+下划线" />
              </el-form-item>
              <el-form-item label="游戏ID">
                <el-input v-model="themeData.themeInfo.gameId" placeholder="game_001" />
              </el-form-item>
              <el-form-item label="主题名称">
                <el-input v-model="themeData.themeInfo.themeName" placeholder="支持中文" />
              </el-form-item>
              <el-form-item label="默认主题">
                <el-switch v-model="themeData.themeInfo.isDefault" />
              </el-form-item>
              <el-form-item label="创作者">
                <el-input v-model="themeData.themeInfo.author" placeholder="官方" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="themeData.themeInfo.description" type="textarea" :rows="2" />
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 2. 全局样式 -->
          <el-card shadow="hover" class="section-card">
            <template #header>
              <span class="section-title">🎨 全局样式</span>
            </template>
            <el-form label-width="120px" size="default">
              <el-form-item label="主色调">
                <el-color-picker v-model="themeData.globalStyle.primaryColor" />
                <span class="color-value">{{ themeData.globalStyle.primaryColor }}</span>
              </el-form-item>
              <el-form-item label="辅助色">
                <el-color-picker v-model="themeData.globalStyle.secondaryColor" />
                <span class="color-value">{{ themeData.globalStyle.secondaryColor }}</span>
              </el-form-item>
              <el-form-item label="背景色">
                <el-color-picker v-model="themeData.globalStyle.bgColor" />
                <span class="color-value">{{ themeData.globalStyle.bgColor }}</span>
              </el-form-item>
              <el-form-item label="文字颜色">
                <el-color-picker v-model="themeData.globalStyle.textColor" />
                <span class="color-value">{{ themeData.globalStyle.textColor }}</span>
              </el-form-item>
              <el-form-item label="字体">
                <el-input v-model="themeData.globalStyle.fontFamily" placeholder="Inter, sans-serif" />
              </el-form-item>
              <el-form-item label="圆角">
                <el-input v-model="themeData.globalStyle.borderRadius" placeholder="8px" />
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 3. 图片资源管理 -->
          <el-card shadow="hover" class="section-card">
            <template #header>
              <span class="section-title">🖼️ 图片资源</span>
            </template>

            <!-- 登录图片 -->
            <div class="resource-category">
              <div class="category-title">登录图片 (login)</div>
              <div
                v-for="(item, key) in themeData.resources.images.login"
                :key="key"
                class="resource-item"
              >
                <el-input :value="key" disabled placeholder="英文Key" class="key-input" />
                <el-input v-model="item.alias" placeholder="中文名称" class="alias-input" />
                <el-input v-model="item.src" placeholder="资源路径" class="src-input" />
                <el-select v-model="item.type" class="type-select">
                  <el-option label="PNG" value="png" />
                  <el-option label="JPG" value="jpg" />
                  <el-option label="WEBP" value="webp" />
                  <el-option label="GIF" value="gif" />
                </el-select>
                <el-button type="danger" size="small" @click="deleteResource('images', 'login', key)">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addImageResource('login')">
                + 添加登录图片
              </el-button>
            </div>

            <!-- UI图片 -->
            <div class="resource-category">
              <div class="category-title">UI图片 (ui)</div>
              <div
                v-for="(item, key) in themeData.resources.images.ui"
                :key="key"
                class="resource-item"
              >
                <el-input :value="key" disabled placeholder="英文Key" class="key-input" />
                <el-input v-model="item.alias" placeholder="中文名称" class="alias-input" />
                <el-input v-model="item.src" placeholder="资源路径" class="src-input" />
                <el-select v-model="item.type" class="type-select">
                  <el-option label="PNG" value="png" />
                  <el-option label="JPG" value="jpg" />
                  <el-option label="WEBP" value="webp" />
                  <el-option label="GIF" value="gif" />
                </el-select>
                <el-button type="danger" size="small" @click="deleteResource('images', 'ui', key)">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addImageResource('ui')">
                + 添加UI图片
              </el-button>
            </div>

            <!-- 图标 -->
            <div class="resource-category">
              <div class="category-title">图标 (icon)</div>
              <div
                v-for="(item, key) in themeData.resources.images.icon"
                :key="key"
                class="resource-item"
              >
                <el-input :value="key" disabled placeholder="英文Key" class="key-input" />
                <el-input v-model="item.alias" placeholder="中文名称" class="alias-input" />
                <el-input v-model="item.src" placeholder="资源路径" class="src-input" />
                <el-select v-model="item.type" class="type-select">
                  <el-option label="PNG" value="png" />
                  <el-option label="JPG" value="jpg" />
                  <el-option label="WEBP" value="webp" />
                  <el-option label="GIF" value="gif" />
                </el-select>
                <el-button type="danger" size="small" @click="deleteResource('images', 'icon', key)">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addImageResource('icon')">
                + 添加图标
              </el-button>
            </div>
          </el-card>

          <!-- 4. 音频资源管理 -->
          <el-card shadow="hover" class="section-card">
            <template #header>
              <span class="section-title">🔊 音频资源</span>
            </template>

            <!-- 背景音乐 -->
            <div class="resource-category">
              <div class="category-title">背景音乐 (bgm)</div>
              <div
                v-for="(item, key) in themeData.resources.audio.bgm"
                :key="key"
                class="resource-item"
              >
                <el-input :value="key" disabled placeholder="英文Key" class="key-input" />
                <el-input v-model="item.alias" placeholder="中文名称" class="alias-input" />
                <el-input v-model="item.src" placeholder="资源路径" class="src-input" />
                <el-slider v-model="item.volume" :min="0" :max="1" :step="0.1" class="volume-slider" />
                <el-select v-model="item.type" class="type-select">
                  <el-option label="MP3" value="mp3" />
                  <el-option label="WAV" value="wav" />
                  <el-option label="OGG" value="ogg" />
                </el-select>
                <el-button type="danger" size="small" @click="deleteResource('audio', 'bgm', key)">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addAudioResource('bgm')">
                + 添加背景音乐
              </el-button>
            </div>

            <!-- 音效 -->
            <div class="resource-category">
              <div class="category-title">音效 (effect)</div>
              <div
                v-for="(item, key) in themeData.resources.audio.effect"
                :key="key"
                class="resource-item"
              >
                <el-input :value="key" disabled placeholder="英文Key" class="key-input" />
                <el-input v-model="item.alias" placeholder="中文名称" class="alias-input" />
                <el-input v-model="item.src" placeholder="资源路径" class="src-input" />
                <el-slider v-model="item.volume" :min="0" :max="1" :step="0.1" class="volume-slider" />
                <el-select v-model="item.type" class="type-select">
                  <el-option label="MP3" value="mp3" />
                  <el-option label="WAV" value="wav" />
                  <el-option label="OGG" value="ogg" />
                </el-select>
                <el-button type="danger" size="small" @click="deleteResource('audio', 'effect', key)">
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addAudioResource('effect')">
                + 添加音效
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 右侧：实时预览区 -->
        <div class="preview-panel" :style="previewStyle">
          <el-card shadow="hover">
            <template #header>
              <span class="section-title">👁️ 实时预览</span>
            </template>

            <div class="preview-content">
              <h3>{{ themeData.themeInfo.themeName }}</h3>
              <p>ID: {{ themeData.themeInfo.themeId }}</p>
              <p>创作者: {{ themeData.themeInfo.author }}</p>

              <div class="style-preview">
                <div class="preview-box">
                  <div class="preview-label">主色调</div>
                  <div class="preview-color" :style="{ backgroundColor: themeData.globalStyle.primaryColor }">
                    {{ themeData.globalStyle.primaryColor }}
                  </div>
                </div>
                <div class="preview-box">
                  <div class="preview-label">背景色</div>
                  <div class="preview-color" :style="{ backgroundColor: themeData.globalStyle.bgColor }">
                    {{ themeData.globalStyle.bgColor }}
                  </div>
                </div>
                <div class="preview-box">
                  <div class="preview-label">文字颜色</div>
                  <div class="preview-color" :style="{ backgroundColor: themeData.globalStyle.textColor }">
                    {{ themeData.globalStyle.textColor }}
                  </div>
                </div>
              </div>

              <div class="resource-summary">
                <h4>资源统计</h4>
                <ul>
                  <li>登录图片: {{ Object.keys(themeData.resources.images.login).length }} 个</li>
                  <li>UI图片: {{ Object.keys(themeData.resources.images.ui).length }} 个</li>
                  <li>图标: {{ Object.keys(themeData.resources.images.icon).length }} 个</li>
                  <li>背景音乐: {{ Object.keys(themeData.resources.audio.bgm).length }} 个</li>
                  <li>音效: {{ Object.keys(themeData.resources.audio.effect).length }} 个</li>
                </ul>
              </div>
            </div>
          </el-card>

          <!-- 校验结果 -->
          <el-card shadow="hover" style="margin-top: 20px">
            <template #header>
              <span class="section-title">✅ 校验结果</span>
            </template>
            <div v-if="validationResult" class="validation-result">
              <el-tag :type="validationResult.valid ? 'success' : 'danger'" size="large">
                {{ validationResult.valid ? '校验通过' : '校验失败' }}
              </el-tag>
              <p>{{ validationResult.message }}</p>
              <div v-if="validationResult.errors && validationResult.errors.length > 0" class="error-list">
                <div v-for="(error, index) in validationResult.errors" :key="index" class="error-item">
                  <strong>{{ error.path }}:</strong> {{ error.message }}
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ElMessage,
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElColorPicker,
  ElSelect,
  ElOption,
  ElSlider,
  ElTag
} from 'element-plus'
import {
  validateGTRSTheme,
  generateResourceKey,
  createImageResource,
  createAudioResource,
  type GTRSTheme
} from '@/utils/gtrs-validator'
import defaultTheme from '@/configs/default-gtrs-theme.json'
import templateTheme from '@/configs/gtrs-template.json'

// 主题数据
const themeData = ref<GTRSTheme>(JSON.parse(JSON.stringify(defaultTheme)))

// 校验结果
const validationResult = ref<any>(null)

// 预览样式
const previewStyle = computed(() => ({
  backgroundColor: themeData.value.globalStyle.bgColor,
  color: themeData.value.globalStyle.textColor,
  fontFamily: themeData.value.globalStyle.fontFamily || 'Arial, sans-serif'
}))

// 加载模板
const loadTemplate = () => {
  themeData.value = JSON.parse(JSON.stringify(templateTheme))
  validationResult.value = null
  ElMessage.success('已加载GTRS模板')
}

// 重置为默认
const resetToDefault = () => {
  themeData.value = JSON.parse(JSON.stringify(defaultTheme))
  validationResult.value = null
  ElMessage.success('已重置为默认主题')
}

// 添加图片资源
const addImageResource = (category: 'login' | 'scene' | 'ui' | 'icon' | 'effect') => {
  const key = generateResourceKey(category, 'img')
  themeData.value.resources.images[category][key] = createImageResource('新图片')
}

// 添加音频资源
const addAudioResource = (category: 'bgm' | 'effect' | 'voice') => {
  const key = generateResourceKey(category, 'audio')
  themeData.value.resources.audio[category][key] = createAudioResource('新音频')
}

// 删除资源
const deleteResource = (
  type: 'images' | 'audio',
  category: string,
  key: string
) => {
  delete themeData.value.resources[type][category][key]
}

// 保存主题
const saveTheme = async () => {
  try {
    const jsonStr = JSON.stringify(themeData.value, null, 2)

    // 前端校验
    const result = validateGTRSTheme(jsonStr)
    validationResult.value = result

    if (!result.valid) {
      ElMessage.error('校验失败：' + result.message)
      return
    }

    // TODO: 调用后端API保存主题
    ElMessage.success('主题JSON生成成功！已准备好上传到服务器')
    console.log('最终标准JSON：', jsonStr)
  } catch (error) {
    ElMessage.error('保存失败：' + (error as Error).message)
  }
}

// 初始化
onMounted(() => {
  console.log('GTRS主题编辑器已加载')
})
</script>

<style scoped>
.gtrs-theme-creator {
  padding: 20px;
}

.header-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.editor-layout {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.edit-panel {
  flex: 1;
  overflow-y: auto;
  max-height: 80vh;
}

.preview-panel {
  width: 350px;
  overflow-y: auto;
  max-height: 80vh;
}

.section-card {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  font-size: 16px;
}

.resource-category {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.category-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #409eff;
}

.resource-item {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.key-input {
  width: 150px;
}

.alias-input {
  width: 120px;
}

.src-input {
  flex: 1;
}

.type-select {
  width: 100px;
}

.volume-slider {
  width: 120px;
}

.color-value {
  margin-left: 10px;
  font-family: monospace;
}

.preview-content h3 {
  margin-top: 0;
  color: inherit;
}

.style-preview {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.preview-box {
  flex: 1;
}

.preview-label {
  font-size: 12px;
  margin-bottom: 5px;
}

.preview-color {
  padding: 20px;
  text-align: center;
  border-radius: 4px;
  font-family: monospace;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.resource-summary {
  margin-top: 20px;
}

.resource-summary ul {
  list-style: none;
  padding: 0;
}

.resource-summary li {
  padding: 5px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.validation-result p {
  margin: 10px 0;
}

.error-list {
  margin-top: 10px;
  padding: 10px;
  background: #fef0f0;
  border-radius: 4px;
}

.error-item {
  padding: 5px 0;
  color: #f56c6c;
}
</style>
