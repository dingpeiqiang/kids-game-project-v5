<template>
  <div class="basic-info-panel">
    <!-- 面板局部 JSON 模式 -->
    <template v-if="props.panelJsonMode">
      <el-card shadow="hover" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">📋 基本信息</span>
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
          placeholder="请输入主题基本信息 JSON"
          class="json-textarea"
          @input="handleJsonInput"
        />
      </el-card>
    </template>

    <!-- 表单模式 -->
    <template v-else>
      <el-card shadow="hover" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">📋 基本信息</span>
            <el-button size="small" type="info" plain @click="emit('toggleJsonMode')">
              <el-icon><Document /></el-icon>
              JSON
            </el-button>
          </div>
        </template>

        <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" size="default">
          <!-- 主题 ID -->
          <el-form-item label="主题 ID" prop="themeId">
            <el-input
              v-model="formData.themeId"
              placeholder="英文 + 数字 + 下划线"
              :disabled="!isEditMode || disableThemeId"
            />
            <div v-if="disableThemeId" class="form-tip" style="color: #f56c6c;">
              ℹ️ 当前为编辑模式，不可更改主题 ID
            </div>
            <div v-else-if="!isEditMode" class="form-tip">
              系统自动生成，一般无需修改
            </div>
          </el-form-item>

          <!-- 适用业务类型 -->
          <el-form-item label="适用业务类型" prop="ownerType">
            <el-select 
              v-model="formData.ownerType" 
              placeholder="请选择业务类型" 
              :disabled="disableGameSelect"
              @change="handleOwnerTypeChange"
            >
              <el-option label="游戏" value="GAME" />
              <el-option label="应用" value="APPLICATION" />
            </el-select>
            <div class="form-tip">选择主题所属的业务类型</div>
          </el-form-item>

          <!-- 适用业务（根据类型动态加载） -->
          <el-form-item label="适用业务" prop="ownerId">
            <el-select 
              v-model="formData.ownerId" 
              :placeholder="isLoadingBusiness ? '加载中...' : `请选择${formData.ownerType === 'GAME' ? '游戏' : '应用'}`" 
              :disabled="disableGameSelect || isLoadingBusiness"
              @change="handleBusinessChange"
              filterable
              clearable
            >
              <!-- 空状态提示 -->
              <template v-if="currentBusinessList.length === 0 && !isLoadingBusiness" #empty>
                <div style="padding: 20px; text-align: center; color: #999;">
                  <i class="el-icon-info" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                  <span>暂无{{ formData.ownerType === 'GAME' ? '游戏' : '应用' }}数据</span>
                </div>
              </template>
              
              <!-- 业务选项 -->
              <el-option
                v-for="item in currentBusinessList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ item.label }}</span>
                  <span style="color: #8492a6; font-size: 13px;">
                    {{ item.code ? item.code : 'ID: ' + item.dbId }}
                  </span>
                </div>
              </el-option>
            </el-select>
            <div v-if="disableGameSelect" class="form-tip" style="color: #f56c6c;">
              ℹ️ {{ disableThemeId ? '当前为编辑模式' : '当前为 DIY 模式' }},不可更改适用业务
            </div>
            <div v-else-if="isLoadingBusiness" class="form-tip" style="color: #409EFF;">
              ⏳ 正在加载{{ formData.ownerType === 'GAME' ? '游戏' : '应用' }}列表...
            </div>
            <div v-else class="form-tip">
              选择具体的{{ formData.ownerType === 'GAME' ? '游戏' : '应用' }}，将决定主题的资源加载路径
            </div>
          </el-form-item>

          <!-- 主题名称 -->
          <el-form-item label="主题名称" prop="themeName">
            <el-input
              v-model="formData.themeName"
              placeholder="请输入主题名称"
              maxlength="20"
              show-word-limit
            />
            <div class="form-tip">最多20字，支持中文</div>
          </el-form-item>

          <!-- 主题封面图 -->
          <el-form-item prop="coverImage">
            <template #label>
              <span>主题封面</span>
            </template>
            <div class="cover-uploader">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :auto-upload="false"
                @change="handleCoverChange"
              >
                <img v-if="formData.coverImage" :src="formData.coverImage" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div v-if="formData.coverImage" class="crop-actions">
                <el-button size="small" type="primary" @click="openCropper">
                  <el-icon><Edit /></el-icon>
                  裁剪图片
                </el-button>
                <el-button size="small" type="danger" @click="removeCover">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
              <div class="upload-tip">
                <div>建议尺寸：1920x1080</div>
                <div>支持格式：PNG、JPG、WEBP</div>
                <div>大小限制：≤5MB</div>
              </div>
            </div>
          </el-form-item>

          <!-- 主题标签 -->
          <el-form-item label="主题标签" prop="tags">
            <el-select
              v-model="formData.tags"
              multiple
              placeholder="选择标签（可多选）"
              style="width: 100%"
            >
              <el-option
                v-for="tag in tagList"
                :key="tag.value"
                :label="tag.label"
                :value="tag.value"
              />
            </el-select>
          </el-form-item>

          <!-- 主题描述 -->
          <el-form-item label="主题描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              placeholder="请输入主题描述"
              maxlength="200"
              show-word-limit
            />
            <div class="form-tip">最多200字</div>
          </el-form-item>

          <!-- 创作者信息 -->
          <el-form-item label="创作者">
            <div class="creator-info">
              <el-avatar :size="40" :src="userStore.currentUser?.avatar" />
              <div class="creator-details">
                <div class="creator-name">{{ userStore.currentUser?.nickname }}</div>
                <div class="creator-id">ID: {{ userStore.currentUser?.id }}</div>
              </div>
            </div>
          </el-form-item>

          <!-- 联系方式 -->
          <el-form-item label="联系方式">
            <el-input v-model="formData.contact" placeholder="选填，便于用户联系" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 图片裁剪对话框 -->
      <ImageCropper
        v-model="cropperVisible"
        :image-url="tempImageUrl"
        @confirm="handleCropConfirm"
      />

      <!-- 新手引导 -->
      <el-collapse v-if="!hasSeenGuide" class="guide-collapse">
        <el-collapse-item title="💡 新手引导：如何创建第一个主题" name="guide">
          <div class="guide-content">
            <h4>📝 步骤1：填写基本信息</h4>
            <p>先填写主题名称、选择适用游戏、上传封面图</p>

            <h4>🎨 步骤2：设计全局样式</h4>
            <p>设置主题的主色调、辅助色、字体等全局样式</p>

            <h4>🖼️ 步骤3：上传图片资源</h4>
            <p>上传游戏需要的所有图片，支持实时预览和批量上传</p>

            <h4>🔊 步骤4：上传音频资源</h4>
            <p>上传游戏背景音乐和音效，支持在线试听</p>

            <h4>👁️ 步骤5：预览和发布</h4>
            <p>预览主题效果，检查完整性，发布到市场</p>

            <el-button type="primary" @click="dismissGuide">我知道了</el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Document, Edit } from '@element-plus/icons-vue'
import { useUserStore } from '@/core/store/user.store'
import { gameApi } from '@/services/game-api.service'
import type { GTRSTheme } from '@/utils/gtrs-validator'
import ImageCropper from '../components/ImageCropper.vue'

interface Props {
  modelValue: GTRSTheme
  isDirty: boolean
  panelJsonMode: boolean  // 面板局部 JSON 模式
  disableGameSelect?: boolean  // 是否禁用游戏选择
  disableThemeId?: boolean  // 是否禁用主题 ID 编辑
}

interface Emits {
  (e: 'update:modelValue', value: GTRSTheme): void
  (e: 'update:isDirty', value: boolean): void
  (e: 'toggleJsonMode'): void  // 切换面板 JSON 模式
}

const props = withDefaults(defineProps<Props>(), {
  disableGameSelect: false,
  disableThemeId: false
})
const emit = defineEmits<Emits>()

const userStore = useUserStore()

// JSON 模式相关 - 使用 ref 保存用户输入，初始值从 modelValue 派生
const jsonContent = ref('')
const jsonError = ref<string | null>(null)

// 初始化 jsonContent
const initJsonContent = () => {
  jsonContent.value = JSON.stringify(props.modelValue.themeInfo || {}, null, 2)
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

// 表单数据
const formData = ref<GTRSTheme['themeInfo'] & { coverImage?: string; tags?: string[]; contact?: string }>({
  themeId: '',
  ownerType: 'GAME',  // 固定为 GAME
  ownerId: undefined as unknown as number,  // 数据库主键
  themeName: '',
  isDefault: false,
  coverImage: '',
  tags: [],
  description: '',
  author: userStore.currentUser?.nickname || '',
  contact: ''
})

// 表单引用
const formRef = ref()

// 加载状态
const isLoadingBusiness = ref(false)

// 是否为编辑模式
const isEditMode = ref(false)

// 是否已看过引导
const hasSeenGuide = ref(false)

// 裁剪器相关
const cropperVisible = ref(false)
const tempImageUrl = ref('')

// 游戏列表（从后端动态加载）
type BusinessItem = { 
  label: string      // 显示名称
  value: number      // ⭐ 数据库主键（gameId）
  dbId: number       // 数据库主键（与 value 相同）
  code?: string      // 业务编码（仅用于显示）
}

const gameList = ref<BusinessItem[]>([])
const appList = ref<BusinessItem[]>([])
const selectedDbId = ref<number | null>(null)

// 当前业务列表（根据类型动态切换）
const currentBusinessList = computed(() => {
  if (formData.value.ownerType === 'GAME') {
    return gameList.value
  } else {
    return appList.value
  }
})

// 从后端加载游戏列表
const loadGameList = async () => {
  isLoadingBusiness.value = true
  try {
    const games = await gameApi.getList()
    console.log('[BasicInfoPanel] 后端返回的游戏列表:', games)
    
    // 调试：检查第一个游戏的结构
    if (games && games.length > 0) {
      console.log('[BasicInfoPanel] 游戏对象结构:', JSON.stringify(games[0]))
    }
    
    gameList.value = games.map((g: any) => {
      // ⭐ 修复：更完整地尝试获取游戏名称
      // 优先级：gameName > name > title > 显示 gameCode > 显示 ID
      const label = g.gameName || g.name || g.title || g.gameCode || `游戏${g.gameId}`
      return {
        label: label,
        value: g.gameId,   // ⭐ 直接使用数据库主键 gameId
        dbId: g.gameId,    // 数据库主键（与 value 相同）
        code: g.gameCode,  // 业务编码
        originalData: g    // 保存原始数据，方便调试
      }
    })
    console.log('[BasicInfoPanel] 游戏列表映射完成:', gameList.value.length, '项')
  } catch (e) {
    console.error('[BasicInfoPanel] 加载游戏列表失败:', e)
    ElMessage.error('加载游戏列表失败，使用默认数据')
    // 降级为硬编码列表
    gameList.value = [
      { label: '贪吃蛇大冒险', value: 1, dbId: 1, code: 'snake-vue3' },
      { label: '植物大战僵尸', value: 2, dbId: 2, code: 'pvz' },
      { label: '飞行射击', value: 3, dbId: 3, code: 'shooter' }
    ]
  } finally {
    isLoadingBusiness.value = false
  }
}

// 加载应用列表（预留）
const loadAppList = async () => {
  isLoadingBusiness.value = true
  try {
    // TODO: 从后端加载应用列表
    // const apps = await appApi.getList()
    appList.value = [
      { label: '示例应用', value: 100, dbId: 100, code: 'example-app' }
    ]
    console.log('应用列表加载完成:', appList.value.length, '项')
  } catch (e) {
    console.error('加载应用列表失败:', e)
    appList.value = []
  } finally {
    isLoadingBusiness.value = false
  }
}

onMounted(() => {
  // ⭐ 根据当前的 ownerType 加载对应的业务列表
  if (formData.value.ownerType === 'GAME') {
    loadGameList()
    loadAppList() // 预加载应用列表（备用）
  } else {
    loadAppList()
    loadGameList() // 预加载游戏列表（备用）
  }
})

// 标签列表
const tagList = [
  { label: '可爱', value: 'cute' },
  { label: '复古', value: 'retro' },
  { label: '科幻', value: 'scifi' },
  { label: '卡通', value: 'cartoon' },
  { label: '写实', value: 'realistic' },
  { label: '梦幻', value: 'dreamy' },
  { label: '简约', value: 'minimalist' }
]

// 表单验证规则
const rules = {
  themeId: [
    { required: true, message: '请输入主题 ID', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '主题 ID 只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  ownerType: [
    { required: true, message: '请选择所有者类型', trigger: 'change' }
  ],
  ownerId: [
    { required: true, message: '请选择适用游戏', trigger: 'change' }
  ],
  themeName: [
    { required: true, message: '请输入主题名称', trigger: 'blur' },
    { min: 2, max: 20, message: '主题名称长度为 2-20 个字符', trigger: 'blur' }
  ],
  coverImage: [
    // 封面图为非必填项，仅在校验时提供提示
  ],
  description: [
    { required: true, message: '请输入主题描述', trigger: 'blur' },
    { max: 200, message: '描述最多 200 字', trigger: 'blur' }
  ]
}

// ========== JSON 模式方法 ==========

// 处理 JSON 输入
const handleJsonInput = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    emit('update:modelValue', {
      ...props.modelValue,
      themeInfo: parsed
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
      themeInfo: parsed
    })
    jsonError.value = null
    ElMessage.success('JSON 格式化成功')
  } catch (e: any) {
    jsonError.value = `格式化失败: ${e.message}`
  }
}

// ========== 表单模式方法 ==========

// 封面上传前校验
const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB！')
    return false
  }

  return true
}

// 封面选择变化 - 直接设置为封面
const handleCoverChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    formData.value.coverImage = dataUrl
    emit('update:modelValue', {
      ...props.modelValue,
      themeInfo: formData.value
    })
    ElMessage.success('封面上传成功')
  }
  reader.readAsDataURL(file.raw)
}

// 打开裁剪器
const openCropper = () => {
  if (!formData.value.coverImage) {
    ElMessage.warning('请先上传图片')
    return
  }
  tempImageUrl.value = formData.value.coverImage
  cropperVisible.value = true
}

// 确认裁剪
const handleCropConfirm = (croppedImage: string) => {
  formData.value.coverImage = croppedImage
  emit('update:modelValue', {
    ...props.modelValue,
    themeInfo: formData.value
  })
}

// 删除封面
const removeCover = () => {
  formData.value.coverImage = ''
  emit('update:modelValue', {
    ...props.modelValue,
    themeInfo: formData.value
  })
}

// 封面上传成功（保留备用）
const handleCoverSuccess = (response: any) => {
  ElMessage.success('封面上传成功')
}

// 游戏选择变化
const handleOwnerTypeChange = (newOwnerType: 'GAME' | 'APPLICATION') => {
  if (props.disableGameSelect) {
    const modeText = props.disableThemeId ? '编辑' : 'DIY'
    ElMessage.warning(`当前为${modeText}模式，不可更改业务类型`)
    return
  }
  
  console.log('切换业务类型:', newOwnerType)
  
  // 重置已选择的业务
  formData.value.ownerId = undefined as unknown as number
  selectedDbId.value = null
  
  // ⭐ 根据新的业务类型重新加载对应的业务列表
  if (newOwnerType === 'GAME') {
    loadGameList()
  } else {
    loadAppList()
  }
}

// 业务选择变化
const handleBusinessChange = (selectedGameId: number) => {
  if (props.disableGameSelect) {
    const modeText = props.disableThemeId ? '编辑' : 'DIY'
    ElMessage.warning(`当前为${modeText}模式，不可更改适用业务`)
    return
  }
  
  // ⭐ 根据选中的 gameId 查找业务信息
  const selected = currentBusinessList.value.find(g => g.value === selectedGameId)
  if (selected) {
    // ⭐ 主题 ID 生成规则：theme_{业务类型}_{gameId}_{时间戳}
    formData.value.themeId = `theme_${formData.value.ownerType.toLowerCase()}_${selectedGameId}_${Date.now()}`
  }
  isEditMode.value = false

  console.log('选择业务:', selectedGameId, '→ gameId:', selectedGameId)
}

// 关闭引导
const dismissGuide = () => {
  hasSeenGuide.value = true
  localStorage.setItem('gtrs_guide_seen', 'true')
}

// ========== 初始化 ==========

hasSeenGuide.value = localStorage.getItem('gtrs_guide_seen') === 'true'

// ========== 监听 ==========

// 监听外部传入的值（初始化）
watch(
  () => props.modelValue.themeInfo,
  (newValue) => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData.value)) {
      // ⭐ 先更新 formData
      formData.value = { ...newValue }
      
      // ⭐ 如果有 ownerId，确保加载了对应的业务类型列表
      if (newValue.ownerId && newValue.ownerType) {
        // 确保列表已加载
        if (newValue.ownerType === 'GAME' && gameList.value.length === 0) {
          loadGameList()
        } else if (newValue.ownerType === 'APPLICATION' && appList.value.length === 0) {
          loadAppList()
        }
      }
    }
  },
  { deep: true, immediate: true }
)

// 监听表单数据变化
watch(
  () => formData.value,
  (newValue) => {
    if (JSON.stringify(newValue) !== JSON.stringify(props.modelValue.themeInfo)) {
      emit('update:modelValue', {
        ...props.modelValue,
        themeInfo: newValue
      })
    }
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.basic-info-panel {
  max-width: 900px;
  margin: 0 auto;
}

.info-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-weight: bold;
      font-size: 16px;
    }
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.cover-uploader {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
    }
  }

  :deep(.el-upload-list__item) {
    border-radius: 6px;
  }
}

.avatar {
  width: 200px;
  height: 112.5px;
  display: block;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 112.5px;
  line-height: 112.5px;
  text-align: center;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.crop-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .creator-details {
    .creator-name {
      font-weight: bold;
      font-size: 14px;
      color: #303133;
    }

    .creator-id {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
}

.guide-collapse {
  margin-top: 20px;

  :deep(.el-collapse-item__header) {
    background: #f0f9ff;
    color: #409eff;
    font-weight: bold;
  }
}

.guide-content {
  padding: 10px 0;

  h4 {
    margin: 15px 0 8px 0;
    color: #303133;
    font-size: 14px;
  }

  p {
    color: #606266;
    font-size: 13px;
    margin: 0 0 10px 0;
  }
}
</style>
