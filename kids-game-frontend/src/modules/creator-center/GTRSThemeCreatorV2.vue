<template>
  <div class="gtrs-theme-creator">
    <!-- 顶部工具栏 -->
    <div class="creator-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回创作者中心
        </el-button>
        <span class="title">🎨 GTRS 主题编辑器</span>
        <el-tag v-if="isDirty" type="warning" size="small">未保存</el-tag>
      </div>
      <div class="header-center">
        <!-- 编辑模式切换 -->
        <el-radio-group v-model="editMode" size="small">
          <el-radio-button value="form">表单模式</el-radio-button>
          <el-radio-button value="json">JSON模式</el-radio-button>
        </el-radio-group>
      </div>
      <div class="header-right">
        <el-button @click="showDraftManager">
          <el-icon><FolderOpened /></el-icon>
          草稿管理
        </el-button>
        <el-button @click="saveDraft" :loading="saving">
          <el-icon><Document /></el-icon>
          保存草稿
        </el-button>
        <el-button type="primary" @click="publishTheme" :loading="publishing">
          <el-icon><Promotion /></el-icon>
          发布主题
        </el-button>
      </div>

      <!-- 草稿管理对话框 -->
      <DraftManager
        v-model="draftManagerVisible"
        @restore="handleDraftRestore"
      />
    </div>

    <!-- 主体内容 -->
    <div class="creator-body">
      <!-- 表单模式：左侧导航 -->
      <template v-if="editMode === 'form'">
        <div class="left-navigation">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="nav-item"
            :class="{ active: currentTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-label">{{ tab.label }}</span>
          </div>
        </div>

        <!-- 主编辑区 - 表单面板 -->
        <div class="main-editor">
          <!-- 基本信息面板 -->
          <BasicInfoPanel
            v-if="currentTab === 'basic'"
            v-model="themeData"
            :is-dirty="isDirty"
            :panel-json-mode="panelJsonModes.basic"
            @update:is-dirty="isDirty = $event"
            @toggle-json-mode="panelJsonModes.basic = !panelJsonModes.basic"
          />

          <!-- 全局样式面板 -->
          <GlobalStylePanel
            v-if="currentTab === 'style'"
            v-model="themeData"
            :is-dirty="isDirty"
            :panel-json-mode="panelJsonModes.style"
            @update:is-dirty="isDirty = $event"
            @toggle-json-mode="panelJsonModes.style = !panelJsonModes.style"
          />

          <!-- 图片资源面板 -->
          <ImageResourcePanel
            v-if="currentTab === 'image'"
            v-model="themeData"
            :is-dirty="isDirty"
            :panel-json-mode="panelJsonModes.image"
            @update:is-dirty="isDirty = $event"
            @toggle-json-mode="panelJsonModes.image = !panelJsonModes.image"
          />

          <!-- 音频资源面板 -->
          <AudioResourcePanel
            v-if="currentTab === 'audio'"
            v-model="themeData"
            :is-dirty="isDirty"
            :panel-json-mode="panelJsonModes.audio"
            @update:is-dirty="isDirty = $event"
            @toggle-json-mode="panelJsonModes.audio = !panelJsonModes.audio"
          />

          <!-- 实时预览面板 -->
          <PreviewPanel
            v-if="currentTab === 'preview'"
            :theme-data="themeData"
          />

          <!-- 发布面板 -->
          <PublishPanel
            v-if="currentTab === 'publish'"
            :theme-data="themeData"
            @publish="handlePublish"
          />
        </div>
      </template>

      <!-- JSON 模式 -->
      <template v-else>
        <div class="json-editor-container">
          <div class="json-toolbar">
            <el-button size="small" @click="formatJson" :disabled="!!jsonFormatError">
              <el-icon><Document /></el-icon>
              格式化
            </el-button>
            <el-button size="small" @click="validateJson">
              <el-icon><CircleCheck /></el-icon>
              校验
            </el-button>
            <el-tag v-if="jsonFormatError" type="danger" size="small">{{ jsonFormatError }}</el-tag>
            <el-tag v-else type="success" size="small">JSON 格式正确</el-tag>
          </div>
          <div class="json-editor-wrapper">
            <el-input
              v-model="themeJson"
              type="textarea"
              :rows="30"
              placeholder="请输入 GTRS 主题 JSON"
              class="json-textarea"
              @input="handleJsonInput"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-tooltip content="撤销">
          <el-button @click="undo" :disabled="!canUndo">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="重做">
          <el-button @click="redo" :disabled="!canRedo">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <el-button-group>
        <el-tooltip content="查看草稿">
          <el-button @click="showDraftList">
            <el-icon><FolderOpened /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="检查完整性">
          <el-button @click="showCompletenessResult">
            <el-icon><CircleCheck /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import {
  Document,
  Promotion,
  RefreshLeft,
  RefreshRight,
  FolderOpened,
  CircleCheck,
  ArrowLeft
} from '@element-plus/icons-vue'
import BasicInfoPanel from './panels/BasicInfoPanel.vue'
import GlobalStylePanel from './panels/GlobalStylePanel.vue'
import ImageResourcePanel from './panels/ImageResourcePanel.vue'
import AudioResourcePanel from './panels/AudioResourcePanel.vue'
import { themeApi } from '@/services/theme-api.service'
import PreviewPanel from './panels/PreviewPanel.vue'
import PublishPanel from './panels/PublishPanel.vue'
import DraftManager from './panels/DraftManager.vue'
import { validateGTRSTheme, type GTRSTheme } from '@/utils/gtrs-validator'
import defaultTheme from '@/configs/gtrs-template.json'
import { useUserStore } from '@/core/store/user.store'

// ========== 数据定义 ==========

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 路由参数：从DIY入口带入的原主题ID和游戏ID
// themeId: 加载原主题配置作为模板
// gameId: 新主题的 ownerId（数据库主键）
const routeThemeId = route.query.themeId as string | undefined
const routeGameId = route.query.gameId ? Number(route.query.gameId) : null

// 编辑模式：表单 / JSON
const editMode = ref<'form' | 'json'>('form')

const currentTab = ref<'basic' | 'style' | 'image' | 'audio' | 'preview' | 'publish'>('basic')
const isDirty = ref(false)
const saving = ref(false)
const publishing = ref(false)
const draftManagerVisible = ref(false)
const draftManagerRef = ref()

// JSON 模式相关
const themeJson = ref('')
const jsonFormatError = ref<string | null>(null)

// 各面板的局部 JSON 模式状态（相互独立）
const panelJsonModes = ref({
  basic: false,
  style: false,
  image: false,
  audio: false
})

// 主题数据 - 初始化为空白结构，通过 loadExistingTheme 加载
const createEmptyThemeData = (): GTRSTheme => ({
  specMeta: {
    specName: 'GTRS',
    specVersion: '1.0.0',
    compatibleVersion: '1.0.0'
  },
  themeInfo: {
    themeId: '',
    gameId: '',
    themeName: '',
    isDefault: false
  },
  globalStyle: {},
  resources: {
    images: {},
    audio: {},
    video: {}
  }
})

const themeData = ref<GTRSTheme>(createEmptyThemeData())

// 导航标签
const tabs = [
  { key: 'basic', label: '基本信息', icon: '📋' },
  { key: 'style', label: '全局样式', icon: '🎨' },
  { key: 'image', label: '图片资源', icon: '🖼️' },
  { key: 'audio', label: '音频资源', icon: '🔊' },
  { key: 'preview', label: '实时预览', icon: '👁️' },
  { key: 'publish', label: '发布主题', icon: '📤' }
]

// 撤销/重做栈
const undoStack = ref<GTRSTheme[]>([])
const redoStack = ref<GTRSTheme[]>([])

const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

// 自动保存定时器
let autoSaveTimer: number | null = null

// ========== 方法 ==========

// 切换 Tab
const switchTab = (tab: string) => {
  currentTab.value = tab as any
}

// 返回创作者中心
const goBack = async () => {
  if (isDirty.value) {
    try {
      await ElMessageBox.confirm(
        '当前有未保存的更改，确定要返回吗？',
        '确认返回',
        {
          confirmButtonText: '确定返回',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      router.push('/creator-center')
    } catch {
      // 用户取消
    }
  } else {
    router.push('/creator-center')
  }
}

// 保存草稿
const saveDraft = async () => {
  saving.value = true
  try {
    // TODO: 调用后端 API 保存草稿
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 保存到草稿管理器
    if (draftManagerRef.value) {
      draftManagerRef.value.saveDraft(
        themeData.value,
        themeData.value.themeInfo.themeName
      )
    }
    
    // 先保存到撤销栈（在修改 isDirty 之前）
    undoStack.value.push(JSON.parse(JSON.stringify(themeData.value)))
    
    // 然后标记为已保存
    isDirty.value = false
    
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('保存失败：' + (error as Error).message)
  } finally {
    saving.value = false
  }
}

// 显示草稿管理器
const showDraftManager = () => {
  draftManagerVisible.value = true
}

// 恢复草稿
const handleDraftRestore = (theme: GTRSTheme) => {
  themeData.value = JSON.parse(JSON.stringify(theme))
  isDirty.value = true
  ElMessage.success('草稿已恢复')
}

// 发布主题
const publishTheme = async (publishData?: { price: number; description: string }) => {
  // 验证主题
  const result = validateGTRSTheme(JSON.stringify(themeData.value))

  if (!result.valid) {
    ElMessage.error('主题校验失败：' + result.message)
    return
  }

  publishing.value = true
  try {
    // 从 themeData 中提取游戏信息
    const rawGameId = themeData.value.themeInfo.gameId  // 如 "game_snake_v3"
    // 将 "game_xxx_yyy" 格式转为 "XXX_YYY" 格式
    const gameCode = rawGameId
      ? rawGameId.replace(/^game_/, '').toUpperCase().replace(/-/g, '_')
      : null  // "game_snake_v3" → "SNAKE_VUE3"

    // ownerId = gameId（数据库主键），直接从路由参数获取
    // DIY 流程：点击已有主题 → 携带 gameId 跳转 → 发布新主题继承同一 gameId
    const ownerId = routeGameId || null

    // ⭐ 获取当前登录用户的真实信息
    // 后端会从 JWT token 中获取 authorId，这里只需要传递正确的 authorName
    const currentAuthorName = userStore.parentUsername || '创作者'

    // 构建上传数据
    const uploadData: any = {
      name: themeData.value.themeInfo.themeName,
      authorName: currentAuthorName,  // ⭐ 使用当前登录用户的真实名称
      price: publishData?.price ?? 0,
      description: publishData?.description || '',
      thumbnail: '',
      config: themeData.value, // 完整的 GTRS 主题数据
      ownerType: 'GAME',
      gameCode: gameCode,
      ownerId: ownerId,        // 直接使用路由传入的 gameId
      status: 'pending'
    }

    console.log('发布主题:', uploadData)

    // 调用后端 API 发布主题
    const response = await themeApi.upload(uploadData)

    ElMessage.success('主题提交成功！等待审核中...')
    isDirty.value = false

    // 发布成功后返回创作者中心
    setTimeout(() => {
      router.push('/creator-center')
    }, 1500)
  } catch (error) {
    console.error('发布失败:', error)
    ElMessage.error('发布失败：' + (error as Error).message)
  } finally {
    publishing.value = false
  }
}

// 撤销
const undo = () => {
  if (undoStack.value.length === 0) return

  redoStack.value.push(JSON.parse(JSON.stringify(themeData.value)))
  const previous = undoStack.value.pop()
  if (previous) {
    themeData.value = previous
    isDirty.value = true
  }
}

// 重做
const redo = () => {
  if (redoStack.value.length === 0) return

  undoStack.value.push(JSON.parse(JSON.stringify(themeData.value)))
  const next = redoStack.value.pop()
  if (next) {
    themeData.value = next
    isDirty.value = true
  }
}

// 查看草稿列表
const showDraftList = () => {
  ElMessageBox.alert('草稿列表功能开发中...', '提示')
}

// 检查完整性 - 严格模式，显示详细原因
interface CompletenessCheckResult {
  passed: boolean
  errors: {
    category: string
    field?: string
    message: string
    path?: string
  }[]
  warnings: {
    category: string
    message: string
  }[]
}

const checkCompleteness = (): CompletenessCheckResult => {
  const result: CompletenessCheckResult = {
    passed: true,
    errors: [],
    warnings: []
  }

  // ===== 1. 检查 specMeta =====
  if (!themeData.value.specMeta) {
    result.passed = false
    result.errors.push({ category: 'specMeta', message: '缺少规格元信息' })
  } else {
    if (!themeData.value.specMeta.specName) {
      result.passed = false
      result.errors.push({ category: 'specMeta.specName', message: '规格名称未填写' })
    }
    if (!themeData.value.specMeta.specVersion) {
      result.passed = false
      result.errors.push({ category: 'specMeta.specVersion', message: '规格版本未填写' })
    }
  }

  // ===== 2. 检查 themeInfo =====
  const themeInfo = themeData.value.themeInfo
  if (!themeInfo) {
    result.passed = false
    result.errors.push({ category: 'themeInfo', message: '缺少主题信息' })
  } else {
    if (!themeInfo.themeId) {
      result.warnings.push({ category: 'themeInfo.themeId', message: '主题ID未设置（保存后自动生成）' })
    }
    if (!themeInfo.themeName) {
      result.passed = false
      result.errors.push({ category: 'themeInfo.themeName', field: 'themeName', message: '主题名称未填写', path: '基本信息 > 主题名称' })
    } else if (themeInfo.themeName.length < 2) {
      result.passed = false
      result.errors.push({ category: 'themeInfo.themeName', field: 'themeName', message: `主题名称太短（当前：${themeInfo.themeName.length}字符，最少2字符）`, path: '基本信息 > 主题名称' })
    } else if (themeInfo.themeName.length > 50) {
      result.passed = false
      result.errors.push({ category: 'themeInfo.themeName', field: 'themeName', message: `主题名称太长（当前：${themeInfo.themeName.length}字符，最多50字符）`, path: '基本信息 > 主题名称' })
    }

    if (!themeInfo.gameId) {
      result.passed = false
      result.errors.push({ category: 'themeInfo.gameId', field: 'gameId', message: '未选择适用游戏', path: '基本信息 > 适用游戏' })
    }

    if (themeInfo.isDefault === undefined || themeInfo.isDefault === null) {
      result.warnings.push({ category: 'themeInfo.isDefault', message: '未设置是否默认主题' })
    }
  }

  // ===== 3. 检查 globalStyle =====
  const globalStyle = themeData.value.globalStyle
  if (!globalStyle || Object.keys(globalStyle).length === 0) {
    result.warnings.push({ category: 'globalStyle', message: '全局样式为空（将使用游戏默认样式）' })
  } else {
    // 检查具体样式字段
    const styleFields = [
      { key: 'primaryColor', label: '主色调' },
      { key: 'secondaryColor', label: '次要色' },
      { key: 'backgroundColor', label: '背景色' },
      { key: 'textColor', label: '文字颜色' },
      { key: 'borderRadius', label: '圆角半径' },
      { key: 'fontFamily', label: '字体' },
      { key: 'fontSize', label: '字号' }
    ]

    for (const field of styleFields) {
      if (globalStyle[field.key] !== undefined && globalStyle[field.key] !== null && globalStyle[field.key] !== '') {
        // 字段有值，检查格式
        if (field.key === 'primaryColor' || field.key === 'secondaryColor' || field.key === 'backgroundColor' || field.key === 'textColor') {
          const colorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
          if (!colorRegex.test(globalStyle[field.key])) {
            result.passed = false
            result.errors.push({
              category: `globalStyle.${field.key}`,
              field: field.key,
              message: `${field.label}格式错误（当前：${globalStyle[field.key]}，应为 #RRGGBB 或 #RGB）`,
              path: `全局样式 > ${field.label}`
            })
          }
        }
      }
    }
  }

  // ===== 4. 检查图片资源 =====
  const images = themeData.value.resources?.images || {}
  const imageCategories = Object.keys(images)

  if (imageCategories.length === 0) {
    result.warnings.push({ category: 'resources.images', message: '没有图片资源（图片资源可选）' })
  } else {
    for (const category of imageCategories) {
      const categoryData = images[category]
      if (!categoryData || typeof categoryData !== 'object') {
        result.warnings.push({ category: `resources.images.${category}`, message: `分类「${category}」数据格式错误` })
        continue
      }

      const keys = Object.keys(categoryData)
      if (keys.length === 0) {
        result.passed = false
        result.errors.push({
          category: `resources.images.${category}`,
          message: `分类「${category}」没有任何图片资源`,
          path: `图片资源 > ${category}`
        })
      } else {
        // 检查每个图片的必填字段
        for (const key of keys) {
          const img = categoryData[key]
          if (!img) continue

          if (!img.alias) {
            result.passed = false
            result.errors.push({
              category: `resources.images.${category}.${key}.alias`,
              message: `图片「${key}」的别名未填写`,
              path: `图片资源 > ${category} > ${key}`
            })
          }

          if (!img.src) {
            result.passed = false
            result.errors.push({
              category: `resources.images.${category}.${key}.src`,
              message: `图片「${key}」的资源地址未设置`,
              path: `图片资源 > ${category} > ${key}`
            })
          } else if (img.src === '[待上传]' || img.src === '') {
            result.passed = false
            result.errors.push({
              category: `resources.images.${category}.${key}.src`,
              message: `图片「${key}」的资源未上传`,
              path: `图片资源 > ${category} > ${key}`
            })
          }
        }
      }
    }
  }

  // ===== 5. 检查音频资源 =====
  const audios = themeData.value.resources?.audio || {}
  const audioCategories = Object.keys(audios)

  if (audioCategories.length === 0) {
    result.warnings.push({ category: 'resources.audio', message: '没有音频资源（音频资源可选）' })
  } else {
    for (const category of audioCategories) {
      const categoryData = audios[category]
      if (!categoryData || typeof categoryData !== 'object') {
        result.warnings.push({ category: `resources.audio.${category}`, message: `分类「${category}」数据格式错误` })
        continue
      }

      const keys = Object.keys(categoryData)
      if (keys.length === 0) {
        result.passed = false
        result.errors.push({
          category: `resources.audio.${category}`,
          message: `分类「${category}」没有任何音频资源`,
          path: `音频资源 > ${category}`
        })
      } else {
        // 检查每个音频的必填字段
        for (const key of keys) {
          const audio = categoryData[key]
          if (!audio) continue

          if (!audio.alias) {
            result.passed = false
            result.errors.push({
              category: `resources.audio.${category}.${key}.alias`,
              message: `音频「${key}」的别名未填写`,
              path: `音频资源 > ${category} > ${key}`
            })
          }

          if (!audio.src) {
            result.passed = false
            result.errors.push({
              category: `resources.audio.${category}.${key}.src`,
              message: `音频「${key}」的资源地址未设置`,
              path: `音频资源 > ${category} > ${key}`
            })
          } else if (audio.src === '[待上传]' || audio.src === '') {
            result.passed = false
            result.errors.push({
              category: `resources.audio.${category}.${key}.src`,
              message: `音频「${key}」的资源未上传`,
              path: `音频资源 > ${category} > ${key}`
            })
          }
        }
      }
    }
  }

  // ===== 6. 检查 video 资源（如果有）=====
  const videos = themeData.value.resources?.video || {}
  const videoCategories = Object.keys(videos)

  if (videoCategories.length > 0) {
    for (const category of videoCategories) {
      const categoryData = videos[category]
      if (!categoryData || typeof categoryData !== 'object') {
        result.warnings.push({ category: `resources.video.${category}`, message: `分类「${category}」数据格式错误` })
        continue
      }

      const keys = Object.keys(categoryData)
      for (const key of keys) {
        const video = categoryData[key]
        if (!video) continue

        if (!video.alias) {
          result.passed = false
          result.errors.push({
            category: `resources.video.${category}.${key}.alias`,
            message: `视频「${key}」的别名未填写`,
            path: `视频资源 > ${category} > ${key}`
          })
        }

        if (!video.src) {
          result.passed = false
          result.errors.push({
            category: `resources.video.${category}.${key}.src`,
            message: `视频「${key}」的资源地址未设置`,
            path: `视频资源 > ${category} > ${key}`
          })
        }
      }
    }
  }

  return result
}

// 显示完整性检查结果
const showCompletenessResult = () => {
  const result = checkCompleteness()

  if (result.passed && result.warnings.length === 0) {
    ElMessage.success('✓ 主题完整性检查通过！所有必填项已填写')
    return
  }

  // 构建详细的提示消息
  let message = ''

  if (result.errors.length > 0) {
    message += '【错误】以下问题需要修复：\n\n'
    result.errors.forEach((err, idx) => {
      const location = err.path || err.category
      message += `${idx + 1}. ${location}\n   原因：${err.message}\n\n`
    })
  }

  if (result.warnings.length > 0) {
    message += '【警告】以下问题需要注意：\n\n'
    result.warnings.forEach((warn, idx) => {
      message += `${idx + 1}. ${warn.category}\n   ${warn.message}\n\n`
    })
  }

  if (result.passed) {
    message += '\n✓ 必填项已填写完成，但有警告信息'
  }

  ElMessageBox.alert(message, '完整性检查结果', {
    type: result.errors.length > 0 ? 'error' : 'warning',
    confirmButtonText: '知道了',
    dangerouslyUseHTMLString: true
  })
}

// 处理发布事件
const handlePublish = (publishData: { price: number; description: string }) => {
  publishTheme(publishData)
}

// 自动保存
const startAutoSave = () => {
  autoSaveTimer = window.setInterval(() => {
    if (isDirty.value) {
      saveDraft()
    }
  }, 30000) // 30秒自动保存
}

// ========== 生命周期 ==========

// 加载已有主题 - 严格按照 configJson 结构，不做任何补充
const loadExistingTheme = async (themeId: string) => {
  try {
    const loading = ElLoading.service({ text: '正在加载主题...' })
    const result = await themeApi.download(themeId)
    loading.close()

    // BaseApiService 已经解包了 ApiResponse，所以 result 应该是 { configJson: "..." }
    let configJson: string | undefined

    if (typeof result === 'string') {
      configJson = result
    } else if (result && 'configJson' in result) {
      configJson = (result as any).configJson
    } else {
      configJson = undefined
    }

    if (!configJson) {
      ElMessage.error('主题配置为空，无法加载')
      router.push('/creator-center')
      return
    }

    // 解析 GTRS JSON
    let themeConfig: GTRSTheme
    try {
      themeConfig = JSON.parse(configJson)
    } catch {
      ElMessage.error('主题配置解析失败，格式错误')
      router.push('/creator-center')
      return
    }

    // 验证是否是 GTRS 格式
    if (!themeConfig.specMeta || themeConfig.specMeta.specName !== 'GTRS') {
      ElMessage.error('该主题不是有效的GTRS格式，无法编辑')
      router.push('/creator-center')
      return
    }

    // 严格加载：直接使用解析出的数据，完全按照 configJson 的报文结构
    // 不做任何补充、不添加默认值
    themeData.value = themeConfig
    isDirty.value = false

    // 同步更新 JSON 文本区域（如果当前是 JSON 模式）
    if (editMode.value === 'json') {
      syncToJson()
    }

    ElMessage.success('主题加载成功')
  } catch (error: any) {
    console.error('加载主题失败:', error)
    ElMessage.error(error.message || '加载主题失败')
  }
}

onMounted(() => {
  console.log('GTRS 主题编辑器已加载', {
    routeThemeId,
    routeGameId: routeGameId
  })

  // 检查是否有themeId参数，如果有则加载已有主题作为DIY模板
  if (routeThemeId) {
    loadExistingTheme(routeThemeId)
  }

  startAutoSave()
})

onUnmounted(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
})

// ========== JSON 模式方法 ==========

// 同步 themeData 到 JSON
const syncToJson = () => {
  try {
    themeJson.value = JSON.stringify(themeData.value, null, 2)
    jsonFormatError.value = null
  } catch (e) {
    console.error('同步到 JSON 失败:', e)
  }
}

// 处理 JSON 输入
const handleJsonInput = () => {
  try {
    const parsed = JSON.parse(themeJson.value)
    // 验证 GTRS 格式
    if (!parsed.specMeta || parsed.specMeta.specName !== 'GTRS') {
      jsonFormatError.value = '不是有效的 GTRS 格式'
      return
    }
    // 同步到 themeData
    themeData.value = parsed
    isDirty.value = true
    jsonFormatError.value = null
  } catch (e: any) {
    jsonFormatError.value = `JSON 解析错误: ${e.message}`
  }
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(themeJson.value)
    themeJson.value = JSON.stringify(parsed, null, 2)
    jsonFormatError.value = null
    ElMessage.success('JSON 格式化成功')
  } catch (e: any) {
    jsonFormatError.value = `格式化失败: ${e.message}`
  }
}

// 校验 JSON
const validateJson = () => {
  const result = validateGTRSTheme(themeJson.value)
  if (result.valid) {
    ElMessage.success('JSON 校验通过')
  } else {
    ElMessage.error(`校验失败: ${result.message}`)
  }
}

// ========== 监听 ==========

// 监听主题数据变化
watch(
  () => JSON.stringify(themeData.value),
  () => {
    isDirty.value = true
    // 如果是 JSON 模式，同步更新
    if (editMode.value === 'json') {
      syncToJson()
    }
  },
  { deep: true }
)

// 监听编辑模式切换
watch(editMode, (newMode) => {
  if (newMode === 'json') {
    syncToJson()
  }
})
</script>

<style scoped lang="scss">
.gtrs-theme-creator {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.creator-header {
  height: 60px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .back-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }

    .title {
      font-size: 20px;
      font-weight: bold;
      color: #303133;
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.creator-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-navigation {
  width: 200px;
  background: #fff;
  border-right: 1px solid #dcdfe6;
  padding: 20px 0;

  .nav-item {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s;
    color: #606266;

    &:hover {
      background: #f5f7fa;
    }

    &.active {
      background: #409eff;
      color: #fff;
    }

    .nav-icon {
      font-size: 18px;
    }

    .nav-label {
      font-size: 14px;
    }
  }
}

.main-editor {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.json-editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;

  .json-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding: 12px;
    background: #fff;
    border-radius: 8px;
  }

  .json-editor-wrapper {
    flex: 1;
    overflow: hidden;

    .json-textarea {
      height: 100%;

      :deep(.el-textarea__inner) {
        height: 100%;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
        resize: none;
        background: #1e1e1e;
        color: #d4d4d4;
        border: none;
        border-radius: 8px;
        padding: 16px;
      }
    }
  }
}

.toolbar {
  height: 50px;
  background: #fff;
  border-top: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
}
</style>
