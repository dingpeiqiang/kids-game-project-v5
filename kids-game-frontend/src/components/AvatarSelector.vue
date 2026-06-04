<template>
  <el-dialog 
    v-model="visible" 
    title="选择头像" 
    width="700px"
    :close-on-click-modal="false"
  >
    <div class="avatar-selector">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 预设头像 -->
        <el-tab-pane label="🎨 预设头像" name="preset">
          <div class="avatar-grid">
            <!-- 儿童系列 -->
            <div class="avatar-category">
              <div class="category-title">👶 儿童系列</div>
              <div class="avatar-list">
                <div 
                  v-for="(avatar, index) in presetAvatars.kids" 
                  :key="index"
                  class="avatar-item"
                  :class="{ 'selected': selectedAvatar === avatar }"
                  @click="selectAvatar(avatar)"
                >
                  <el-image 
                    :src="avatar" 
                    fit="cover"
                    style="width: 80px; height: 80px; border-radius: 50%;"
                  />
                </div>
              </div>
            </div>
            
            <!-- 动物系列 -->
            <div class="avatar-category">
              <div class="category-title">🦁 动物系列</div>
              <div class="avatar-list">
                <div 
                  v-for="(avatar, index) in presetAvatars.animals" 
                  :key="index"
                  class="avatar-item"
                  :class="{ 'selected': selectedAvatar === avatar }"
                  @click="selectAvatar(avatar)"
                >
                  <el-image 
                    :src="avatar" 
                    fit="cover"
                    style="width: 80px; height: 80px; border-radius: 50%;"
                  />
                </div>
              </div>
            </div>
            
            <!-- 职业系列 -->
            <div class="avatar-category">
              <div class="category-title">💼 职业系列</div>
              <div class="avatar-list">
                <div 
                  v-for="(avatar, index) in presetAvatars.professions" 
                  :key="index"
                  class="avatar-item"
                  :class="{ 'selected': selectedAvatar === avatar }"
                  @click="selectAvatar(avatar)"
                >
                  <el-image 
                    :src="avatar" 
                    fit="cover"
                    style="width: 80px; height: 80px; border-radius: 50%;"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 自定义上传 -->
        <el-tab-pane label="📤 上传头像" name="upload">
          <div class="upload-area">
            <!-- 拖拽上传区域 -->
            <el-upload
              ref="uploadRef"
              drag
              :auto-upload="true"
              :show-file-list="false"
              :on-change="handleFileChange"
              :before-upload="beforeUpload"
              accept="image/*"
              class="upload-component"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 jpg/png 格式，大小不超过 2MB
                </div>
              </template>
            </el-upload>
            
            <!-- 上传进度 -->
            <div v-if="uploading" class="upload-progress">
              <el-progress :percentage="uploadProgress" :stroke-width="4" />
              <span>正在上传...</span>
            </div>
            
            <!-- 上传成功预览 -->
            <div v-if="uploadedPreview" class="uploaded-preview">
              <div class="preview-title">✅ 上传成功，请点击确认</div>
              <el-image 
                :src="uploadedPreview" 
                fit="cover"
                style="width: 150px; height: 150px; border-radius: 8px;"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <template #footer>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :disabled="!selectedAvatar && !uploadedPreview"
        >
          确认选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadProps, UploadInstance } from 'element-plus'
import { uploadImage } from '@/api/upload'

interface AvatarSelectorProps {
  modelValue: boolean
  currentAvatar?: string
}

const props = withDefaults(defineProps<AvatarSelectorProps>(), {
  currentAvatar: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', avatar: string): void
}>()

// 可见性控制
const visible = ref(false)
watch(() => props.modelValue, (val) => {
  visible.value = val
})
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// Tab 切换
const activeTab = ref('preset')

// 预设头像库（使用 DiceBear 在线头像 API）
const presetAvatars = reactive({
  kids: [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bear&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Rabbit&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Cat&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Dog&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Panda&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Tiger&backgroundColor=ffd7ba'
  ],
  animals: [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Lion&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Elephant&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Monkey&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Penguin&backgroundColor=ffd5dc'
  ],
  professions: [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Astronaut&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Doctor&backgroundColor=ffd7ba'
  ]
})

// 选择的头像
const selectedAvatar = ref<string>('')

// 上传相关
const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadedPreview = ref<string>('')

// 选择头像
const selectAvatar = (avatar: string) => {
  selectedAvatar.value = avatar
  uploadedPreview.value = '' // 清空上传预览
}

// 上传前验证
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }

  return isImage && isLt2M
}

// 文件变化处理
const handleFileChange: UploadProps['onChange'] = async (file) => {
  if (!file.raw) return
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    // 调用真实 API 上传
    const response = await uploadImage(file.raw, 'avatars')
    
    uploadedPreview.value = response.url
    selectedAvatar.value = '' // 清空预设选择
    ElMessage.success('上传成功，请点击确认')
  } catch (error) {
    ElMessage.error('上传失败：' + (error as any)?.message || '未知错误')
  } finally {
    uploading.value = false
  }
}

// 取消
const handleCancel = () => {
  selectedAvatar.value = ''
  uploadedPreview.value = ''
  visible.value = false
}

// 确认
const handleConfirm = () => {
  const avatar = uploadedPreview.value || selectedAvatar.value
  if (avatar) {
    emit('confirm', avatar)
    visible.value = false
  }
}
</script>

<style scoped lang="scss">
.avatar-selector {
  min-height: 400px;
}

.avatar-grid {
  padding: 10px;
}

.avatar-category {
  margin-bottom: 25px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.avatar-list {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.avatar-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 50%;
  padding: 3px;
  border: 2px solid transparent;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
  }
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.upload-component {
  width: 100%;
  max-width: 500px;
}

.upload-progress {
  width: 100%;
  max-width: 500px;
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  span {
    font-size: 12px;
    color: #909399;
  }
}

.uploaded-preview {
  margin-top: 20px;
  text-align: center;
  
  .preview-title {
    font-size: 14px;
    color: #67c23a;
    margin-bottom: 15px;
    font-weight: 600;
  }
}
</style>
