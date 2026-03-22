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
          <!-- 主题 ID（编辑模式显示只读，其他模式不显示） -->
          <el-form-item v-if="props.mode === 'edit'" label="主题 ID">
            <el-input v-model="formData.themeId" disabled />
            <div class="form-tip">数据库自增 ID</div>
          </el-form-item>

          <!-- 作者 ID（所有模式都不显示） -->
          <!-- 作者名称（所有模式都不显示） -->
          <!-- 是否为官方主题（所有模式都不显示） -->

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
              :placeholder="`请选择${formData.ownerType === 'GAME' ? '游戏' : '应用'}`"
              @change="handleBusinessChange"
              filterable
              clearable
            >
              <!-- 空状态提示 -->
              <template v-if="currentBusinessList.length === 0" #empty>
                <div style="padding: 20px; text-align: center; color: #999;">
                  <span>暂无{{ formData.ownerType === 'GAME' ? '游戏' : '应用' }}数据</span>
                </div>
              </template>

              <!-- ⭐ 兜底 option：当已选 ownerId 不在当前列表中时，插入一个临时选项防止显示数字 -->
              <el-option
                v-if="formData.ownerId && !currentBusinessList.find(i => i.value === formData.ownerId)"
                :key="'fallback-' + formData.ownerId"
                :label="`ID: ${formData.ownerId}（未知业务）`"
                :value="formData.ownerId"
              />

              <!-- 业务选项 -->
              <el-option
                v-for="item in currentBusinessList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <span style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ item.label }}</span>
                  <span style="color: #8492a6; font-size: 13px; margin-left: 16px;">
                    {{ item.code || 'ID: ' + item.dbId }}
                  </span>
                </span>
              </el-option>
            </el-select>
            <div class="form-tip">
              选择具体的{{ formData.ownerType === 'GAME' ? '游戏' : '应用' }}，将决定主题的资源加载路径
            </div>
          </el-form-item>

          <!-- 主题名称 -->
          <el-form-item label="主题名称" prop="themeName">
            <el-input
              v-model="formData.themeName"
              placeholder="请输入主题名称"
              maxlength="100"
              show-word-limit
            />
            <div class="form-tip">最多100字</div>
          </el-form-item>

          <!-- 价格 -->
          <el-form-item label="价格（游戏币）" prop="price">
            <el-input-number
              v-model="formData.price"
              :min="0"
              :max="99999"
              controls-position="right"
              style="width: 200px"
            />
            <div class="form-tip">0 表示免费</div>
          </el-form-item>

          <!-- 状态 -->
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" style="width: 200px">
              <el-option label="待审核" value="pending" />
              <el-option label="已上架" value="on_sale" />
              <el-option label="已下架" value="offline" />
            </el-select>
            <div class="form-tip">只有审核通过的主题才能上架销售</div>
          </el-form-item>

          <!-- 统计信息（所有模式都不显示） -->
          <!-- 下载次数 -->
          <!-- 总收益 -->

          <!-- 缩略图 URL -->
          <el-form-item prop="thumbnailUrl">
            <template #label>
              <span>缩略图 URL</span>
            </template>
            <div class="cover-uploader">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :auto-upload="false"
                @change="handleCoverChange"
              >
                <img v-if="formData.thumbnailUrl" :src="formData.thumbnailUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div v-if="formData.thumbnailUrl" class="crop-actions">
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

          <!-- 主题描述 -->
          <el-form-item label="主题描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              placeholder="请输入主题描述"
              show-word-limit
            />
            <div class="form-tip">描述主题的特点和使用场景</div>
          </el-form-item>

          <!-- 是否为默认主题（所有模式都不显示） -->
          <!-- 创建时间（所有模式都不显示） -->
          <!-- 更新时间（所有模式都不显示） -->
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
import { ElMessage, ElLoading } from 'element-plus'
import { Plus, Delete, Document, Edit } from '@element-plus/icons-vue'
import { useUserStore } from '@/core/store/user.store'
import ImageCropper from '../components/ImageCropper.vue'
import { unifiedUploadService } from '@/services/unified-upload.service'

interface Props {
  modelValue: {
    themeId: number
    authorId: number
    isOfficial: boolean
    ownerType: 'GAME' | 'APPLICATION'
    ownerId: number | null
    themeName: string
    authorName: string
    price: number
    status: 'pending' | 'on_sale' | 'offline'
    downloadCount: number
    totalRevenue: number
    thumbnailUrl: string
    description: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
  isDirty: boolean
  panelJsonMode: boolean  // 面板局部 JSON 模式
  disableGameSelect?: boolean  // 是否禁用游戏选择
  disableThemeId?: boolean  // 是否禁用主题 ID 编辑
  mode?: 'create' | 'diy' | 'edit'  // 模式：创作/DIY/编辑
  // ⭐ 由父组件统一加载后传入，确保组件挂载时列表已就绪
  gameList?: { label: string; value: number; dbId: number; code?: string }[]
  appList?: { label: string; value: number; dbId: number; code?: string }[]
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
  (e: 'update:isDirty', value: boolean): void
  (e: 'toggleJsonMode'): void  // 切换面板 JSON 模式
}

const props = withDefaults(defineProps<Props>(), {
  disableGameSelect: false,
  disableThemeId: false,
  mode: 'create',
  gameList: () => [],
  appList: () => []
})
const emit = defineEmits<Emits>()

const userStore = useUserStore()

// 表单数据（与 theme_info 表字段对应）
const formData = ref<{
  themeId: number
  authorId: number
  isOfficial: boolean
  ownerType: 'GAME' | 'APPLICATION'
  ownerId: number | null
  themeName: string
  authorName: string
  price: number
  status: 'pending' | 'on_sale' | 'offline'
  downloadCount: number
  totalRevenue: number
  thumbnailUrl: string
  description: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}>({
  themeId: 0,
  authorId: userStore.currentUser?.id || 0,
  isOfficial: false,
  ownerType: 'GAME',
  ownerId: null,
  themeName: '',
  authorName: userStore.currentUser?.nickname || '',
  price: 0,
  status: 'pending',
  downloadCount: 0,
  totalRevenue: 0,
  thumbnailUrl: '',
  description: '',
  isDefault: false,
  createdAt: '',
  updatedAt: ''
})

// JSON 模式相关 - 使用 ref 保存用户输入，初始值从 modelValue 派生
const jsonContent = ref('')
const jsonError = ref<string | null>(null)

// 初始化 jsonContent
const initJsonContent = () => {
  // JSON 模式显示表单数据（排除只读字段）
  const editableData = {
    ownerType: formData.value.ownerType,
    ownerId: formData.value.ownerId,
    themeName: formData.value.themeName,
    price: formData.value.price,
    status: formData.value.status,
    thumbnailUrl: formData.value.thumbnailUrl,
    description: formData.value.description
  }
  jsonContent.value = JSON.stringify(editableData, null, 2)
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

// 表单引用
const formRef = ref()

// 是否为编辑模式
const isEditMode = ref(false)

// 是否已看过引导
const hasSeenGuide = ref(false)

// 裁剪器相关
const cropperVisible = ref(false)
const tempImageUrl = ref('')

// 游戏列表（由父组件统一加载传入，组件挂载时已就绪）
type BusinessItem = { 
  label: string      // 显示名称
  value: number      // 数据库主键（gameId）
  dbId: number       // 数据库主键（与 value 相同）
  code?: string      // 业务编码（仅用于显示）
}

// 当前业务列表（根据类型动态切换，直接用 props）
const currentBusinessList = computed<BusinessItem[]>(() => {
  return formData.value.ownerType === 'GAME' ? props.gameList : props.appList
})

const selectedDbId = ref<number | null>(null)

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
  ownerType: [
    { required: true, message: '请选择业务类型', trigger: 'change' }
  ],
  ownerId: [
    { required: true, message: '请选择适用业务', trigger: 'change' }
  ],
  themeName: [
    { required: true, message: '请输入主题名称', trigger: 'blur' },
    { min: 2, max: 100, message: '主题名称长度为 2-100 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入主题描述', trigger: 'blur' }
  ]
}

// ========== JSON 模式方法 ==========

// 处理 JSON 输入
const handleJsonInput = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    // 更新表单数据
    formData.value = {
      ...formData.value,
      ownerType: parsed.ownerType || 'GAME',
      ownerId: parsed.ownerId || null,
      themeName: parsed.themeName || '',
      price: parsed.price || 0,
      status: parsed.status || 'pending',
      thumbnailUrl: parsed.thumbnailUrl || '',
      description: parsed.description || ''
    }
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
    // 更新 formData 的可编辑字段
    formData.value = {
      ...formData.value,
      ...parsed
    }
    emit('update:modelValue', formData.value)
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

// 封面选择变化 - 使用统一上传服务
const handleCoverChange = async (file: any) => {
  try {
    const loading = ElLoading.service({ text: '正在上传缩略图...' })
    
    // ⭐ 使用统一上传服务
    const result = await unifiedUploadService.uploadImage(file.raw, 'themes/images')
    
    // 更新缩略图 URL
    formData.value.thumbnailUrl = result.url
    emit('update:modelValue', formData.value)
    emit('update:isDirty', true)
    
    loading.close()
    ElMessage.success('缩略图上传成功')
  } catch (error) {
    console.error('缩略图上传失败:', error)
    ElMessage.error('缩略图上传失败：' + (error as Error).message)
  }
}

// 打开裁剪器
const openCropper = () => {
  if (!formData.value.thumbnailUrl) {
    ElMessage.warning('请先上传图片')
    return
  }
  tempImageUrl.value = formData.value.thumbnailUrl
  cropperVisible.value = true
}

// 确认裁剪
const handleCropConfirm = (croppedImage: string) => {
  formData.value.thumbnailUrl = croppedImage
  emit('update:isDirty', true)
}

// 删除封面
const removeCover = () => {
  formData.value.thumbnailUrl = ''
  emit('update:isDirty', true)
}

// 封面上传成功（保留备用）
const handleCoverSuccess = (response: any) => {
  ElMessage.success('缩略图上传成功')
}

// 游戏选择变化
const handleOwnerTypeChange = (newOwnerType: 'GAME' | 'APPLICATION') => {
  if (props.disableGameSelect) {
    const modeText = props.disableThemeId ? '编辑' : 'DIY'
    ElMessage.warning(`当前为${modeText}模式，不可更改业务类型`)
    return
  }
  console.log('切换业务类型:', newOwnerType)
  // ⭐ 切换类型时必须清空 ownerId，防止旧 id 在新列表中找不到 label
  formData.value.ownerId = undefined as unknown as number
  selectedDbId.value = null
}

// 业务选择变化
const handleBusinessChange = (selectedGameId: number) => {
  if (props.disableGameSelect) {
    const modeText = props.disableThemeId ? '编辑' : 'DIY'
    ElMessage.warning(`当前为${modeText}模式，不可更改适用业务`)
    return
  }

  console.log('选择业务:', selectedGameId, '→ gameId:', selectedGameId)
  emit('update:isDirty', true)
}

// 关闭引导
const dismissGuide = () => {
  hasSeenGuide.value = true
  localStorage.setItem('gtrs_guide_seen', 'true')
}

// ========== 初始化 ==========

hasSeenGuide.value = localStorage.getItem('gtrs_guide_seen') === 'true'

// ========== 监听 ==========

// ⭐ 一次性加载方案：组件挂载时父组件已保证数据就绪，直接赋值即可
onMounted(() => {
  // modelValue 现在直接是 themeBasicInfo 对象
  if (props.modelValue) {
    formData.value = { ...props.modelValue }
    console.log('[BasicInfoPanel] onMounted 赋值完成，ownerId:', formData.value.ownerId, '列表长度:', currentBusinessList.value.length)
    // ⭐ 挂载完成后校验一次 ownerId 是否在列表中
    validateOwnerIdInList('onMounted')
    // 初始化 JSON 内容
    initJsonContent()
  }
})

// ⭐ 监听外部 themeBasicInfo 变化（草稿恢复等场景），直接赋值，无需竞态处理
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) return
    
    // ⭐ 关键修复：检查是否真的需要更新，避免循环
    const isDifferent = Object.keys(newValue).some(key => {
      const typedKey = key as keyof typeof newValue
      return formData.value[typedKey] !== newValue[typedKey]
    })
    
    if (!isDifferent) {
      // 数据没有变化，不需要更新，直接返回
      return
    }
    
    console.log('[BasicInfoPanel] 检测到外部数据变化，更新 formData')
    // 合并数据，保留已有的只读字段值
    formData.value = {
      ...formData.value,
      ...newValue
    }
    console.log('[BasicInfoPanel] watch 赋值，ownerId:', formData.value.ownerId)
    // 赋值完成后再次校验
    validateOwnerIdInList('themeInfo-watch')
  },
  { deep: false }
)

// ⭐ 监听业务列表变化（props 更新时），确保 ownerId 能在列表中命中
watch(
  currentBusinessList,
  (newList) => {
    if (newList.length > 0 && formData.value.ownerId) {
      validateOwnerIdInList('list-updated')
    }
  },
  { deep: false }
)

// ========== 工具方法 ==========

/**
 * 校验当前 ownerId 是否存在于业务列表中
 * 如果不在列表中且列表非空，说明数据不一致，打印警告
 */
const validateOwnerIdInList = (from: string) => {
  const ownerId = formData.value.ownerId
  if (!ownerId) return
  const list = currentBusinessList.value
  if (list.length === 0) return  // 列表还没加载，不做判断
  const found = list.find(item => item.value === ownerId)
  if (found) {
    console.log(`[BasicInfoPanel][${from}] ✅ ownerId=${ownerId} 命中: ${found.label}`)
  } else {
    console.warn(`[BasicInfoPanel][${from}] ⚠️ ownerId=${ownerId} 在列表中找不到对应项，列表:`, list)
  }
}

// 监听表单数据变化
watch(
  () => formData.value,
  (newVal) => {
    // ⭐ 关键修复：同步数据到父组件的 themeBasicInfo
    emit('update:modelValue', newVal)
    // 同时标记为 dirty
    emit('update:isDirty', true)
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
