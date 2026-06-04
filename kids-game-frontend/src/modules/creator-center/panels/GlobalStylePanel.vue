<template>
  <div class="global-style-panel">
    <!-- 面板局部 JSON 模式 -->
    <template v-if="props.panelJsonMode">
      <el-card shadow="hover" class="style-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">🎨 全局样式</span>
            <el-button size="small" type="primary" plain @click="emit('toggleJsonMode')">
              <el-icon><Edit /></el-icon>
              切换表单
            </el-button>
          </div>
        </template>
        <div class="card-toolbar">
          <el-button size="small" @click="formatJson" :disabled="!!jsonError">
            <el-icon><Document /></el-icon>
            格式化
          </el-button>
          <el-tag v-if="jsonError" type="danger" size="small">{{ jsonError }}</el-tag>
          <el-tag v-else type="success" size="small">格式正确</el-tag>
        </div>
        <el-input
          v-model="jsonContent"
          type="textarea"
          :rows="20"
          placeholder="请输入全局样式 JSON"
          class="json-textarea"
          @input="handleJsonInput"
        />
      </el-card>
    </template>

    <!-- 表单模式 -->
    <template v-else>
      <el-card shadow="hover" class="style-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">🎨 全局样式</span>
            <el-button size="small" type="info" plain @click="emit('toggleJsonMode')">
              <el-icon><Document /></el-icon>
              JSON
            </el-button>
          </div>
        </template>

        <!-- 严格显示：只显示 configJson 中实际存在的样式字段 -->
        <div v-if="styleFields.length > 0" class="style-content">
          <!-- 颜色配置 -->
          <div v-if="colorFields.length > 0" class="style-section">
            <h3 class="section-title">🌈 颜色配置</h3>

            <div class="color-grid">
              <div v-for="field in colorFields" :key="field.key" class="color-item">
                <label>{{ field.label }}</label>
                <el-color-picker
                  v-model="localStyle[field.key]"
                  @change="handleFieldChange(field.key)"
                />
                <div class="color-preview" :style="{ background: localStyle[field.key] || '#000' }"></div>
              </div>
            </div>
          </div>

          <!-- 字体配置 -->
          <div v-if="fontFields.length > 0" class="style-section">
            <h3 class="section-title">🔤 字体配置</h3>

            <div class="font-config">
              <div v-for="field in fontFields" :key="field.key" class="form-item">
                <label>{{ field.label }}</label>
                <el-input
                  v-if="field.type === 'text'"
                  v-model="localStyle[field.key]"
                  :placeholder="`输入 ${field.label}`"
                  @change="handleFieldChange(field.key)"
                />
                <el-select
                  v-else-if="field.type === 'select'"
                  v-model="localStyle[field.key]"
                  placeholder="请选择"
                  @change="handleFieldChange(field.key)"
                >
                  <el-option
                    v-for="opt in field.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <el-input
                  v-else
                  v-model="localStyle[field.key]"
                  :placeholder="`输入 ${field.label}`"
                  @change="handleFieldChange(field.key)"
                />
              </div>
            </div>
          </div>

          <!-- 其他样式字段 -->
          <div v-if="otherFields.length > 0" class="style-section">
            <h3 class="section-title">⚙️ 其他样式</h3>

            <div class="other-config">
              <div v-for="field in otherFields" :key="field.key" class="form-item">
                <label>{{ field.label }}</label>
                <el-input
                  v-model="localStyle[field.key]"
                  :placeholder="`输入 ${field.label}`"
                  @change="handleFieldChange(field.key)"
                />
              </div>
            </div>
          </div>

          <!-- 样式预览 -->
          <div class="style-section">
            <h3 class="section-title">👁️ 样式预览</h3>

            <div class="preview-container">
              <div class="preview-card" :style="previewStyle">
                <div class="preview-header">
                  <h3>标题</h3>
                  <p>这是一段示例文本</p>
                </div>
                <div class="preview-content">
                  <button class="preview-button">按钮</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无全局样式 -->
        <el-empty v-else description="该主题无全局样式配置" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Edit } from '@element-plus/icons-vue'
import type { GTRSTheme } from '@/utils/gtrs-validator'

interface Props {
  modelValue: GTRSTheme
  isDirty: boolean
  panelJsonMode: boolean  // 面板局部 JSON 模式
}

interface Emits {
  (e: 'update:modelValue', value: GTRSTheme): void
  (e: 'update:isDirty', value: boolean): void
  (e: 'toggleJsonMode'): void  // 切换面板 JSON 模式
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// JSON 模式相关 - 使用 ref 保存用户输入，初始值从 modelValue 派生
const jsonContent = ref('')
const jsonError = ref<string | null>(null)

// 初始化 jsonContent
const initJsonContent = () => {
  jsonContent.value = JSON.stringify(props.modelValue.globalStyle || {}, null, 2)
}

// 监听 panelJsonMode 变化
watch(
  () => props.panelJsonMode,
  (isJsonMode) => {
    if (!isJsonMode) {
      // 退出 JSON 模式时，重新从 modelValue 初始化
      initJsonContent()
    }
  }
)

// 组件挂载时初始化
initJsonContent()

// 颜色字段定义
const COLOR_FIELDS = ['primaryColor', 'secondaryColor', 'bgColor', 'textColor', 'borderColor', 'shadowColor']
const COLOR_LABELS: Record<string, string> = {
  primaryColor: '主色调',
  secondaryColor: '辅助色',
  bgColor: '背景色',
  textColor: '文字颜色',
  borderColor: '边框颜色',
  shadowColor: '阴影颜色'
}

// 字体字段定义
const FONT_FIELDS = ['fontFamily', 'fontSize', 'fontWeight']
const FONT_LABELS: Record<string, string> = {
  fontFamily: '字体',
  fontSize: '字号',
  fontWeight: '字重'
}

// 本地样式数据
const localStyle = ref<Record<string, any>>({})

// 计算属性：获取实际存在的样式字段
const styleFields = computed(() => {
  const style = props.modelValue?.globalStyle || {}
  return Object.keys(style).filter(key => style[key] !== undefined && style[key] !== null && style[key] !== '')
})

// 颜色字段
const colorFields = computed(() => {
  return styleFields.value
    .filter(key => COLOR_FIELDS.includes(key))
    .map(key => ({ key, label: COLOR_LABELS[key] || key }))
})

// 字体字段
const fontFields = computed(() => {
  return styleFields.value
    .filter(key => FONT_FIELDS.includes(key))
    .map(key => {
      if (key === 'fontFamily') {
        return {
          key,
          label: FONT_LABELS[key] || key,
          type: 'select',
          options: [
            { label: '微软雅黑', value: 'Microsoft YaHei' },
            { label: '思源黑体', value: 'Source Han Sans CN' },
            { label: '苹方', value: 'PingFang SC' },
            { label: '宋体', value: 'SimSun' },
            { label: '黑体', value: 'SimHei' }
          ]
        }
      }
      return { key, label: FONT_LABELS[key] || key, type: 'text' }
    })
})

// 其他字段
const otherFields = computed(() => {
  const reservedKeys = [...COLOR_FIELDS, ...FONT_FIELDS]
  return styleFields.value
    .filter(key => !reservedKeys.includes(key))
    .map(key => ({ key, label: key }))
})

// 预览样式
const previewStyle = computed(() => {
  const style = localStyle.value
  return {
    backgroundColor: style.bgColor || '#ffffff',
    color: style.textColor || '#303133',
    fontFamily: style.fontFamily || 'Microsoft YaHei',
    fontSize: (style.fontSize || 14) + 'px',
    borderRadius: style.borderRadius || '8px'
  }
})

// ========== JSON 模式方法 ==========

// 处理 JSON 输入
const handleJsonInput = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    emit('update:modelValue', {
      ...props.modelValue,
      globalStyle: parsed
    })
    emit('update:isDirty', true)
    jsonError.value = null
  } catch (e: any) {
    jsonError.value = `JSON 解析错误: ${e.message}`
  }
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    const formatted = JSON.stringify(parsed, null, 2)
    jsonContent.value = formatted
    emit('update:modelValue', {
      ...props.modelValue,
      globalStyle: parsed
    })
    jsonError.value = null
    ElMessage.success('JSON 格式化成功')
  } catch (e: any) {
    jsonError.value = `格式化失败: ${e.message}`
  }
}

// ========== 表单模式方法 ==========

// 处理字段变化
const handleFieldChange = (key: string) => {
  const newGlobalStyle = { ...props.modelValue.globalStyle }
  newGlobalStyle[key] = localStyle.value[key]

  emit('update:modelValue', {
    ...props.modelValue,
    globalStyle: newGlobalStyle
  })
  emit('update:isDirty', true)
}

// 监听外部数据变化
watch(
  () => props.modelValue?.globalStyle,
  (newStyle) => {
    if (newStyle) {
      localStyle.value = { ...newStyle }
    } else {
      localStyle.value = {}
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped lang="scss">
.global-style-panel {
  max-width: 1000px;
  margin: 0 auto;
}

.style-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-weight: bold;
    font-size: 16px;
  }
}

.card-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.json-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    background: #1e1e1e;
    color: #d4d4d4;
    border: none;
    border-radius: 8px;
    padding: 16px;
  }
}

.style-section {
  margin-bottom: 30px;

  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #303133;
  }
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }

  .color-preview {
    width: 100%;
    height: 30px;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
  }
}

.font-config,
.other-config {
  .form-item {
    margin-bottom: 16px;
    max-width: 400px;

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }
  }
}

.preview-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.preview-card {
  padding: 20px;
  background: #fff;
  transition: all 0.3s;

  .preview-header {
    margin-bottom: 16px;

    h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }

    p {
      margin: 0;
      opacity: 0.8;
    }
  }

  .preview-button {
    padding: 8px 16px;
    background: v-bind('localStyle.primaryColor || "#409eff"');
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
}
</style>
