<template>
  <label class="file-upload-label">
    <input 
      type="file" 
      :accept="accept"
      @change="handleFileChange"
      class="hidden-input"
      :disabled="uploading"
    />
    <span class="upload-btn" :class="{ uploading }">
      {{ uploading ? '⏳ 上传中...' : (text || '📤 上传文件') }}
    </span>
  </label>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits<{
  upload: [data: { url: string; filename: string; size: number }];
  error: [error: string];
}>();

const props = withDefaults(defineProps<{
  accept?: string;
  text?: string;
  category?: string;
  uploadUrl?: string;
}>(), {
  accept: '*/*',
  text: '',
  category: 'themes/resources',
  uploadUrl: '/api/resource/upload'
});

const uploading = ref(false);

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  // 验证文件类型
  if (props.accept !== '*/*' && !file.type.match(props.accept)) {
    const errorMsg = `不支持的文件类型：${file.type}`;
    emit('error', errorMsg);
    alert(errorMsg);
    return;
  }
  
  uploading.value = true;
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post(props.uploadUrl, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      },
      params: { 
        category: props.category,
        ...(props.uploadUrl.includes('image') ? {} : { category: props.category.replace('images', 'audio') })
      }
    });
    
    if (response.data.code === 200) {
      emit('upload', {
        url: response.data.data?.url,
        filename: response.data.data?.filename,
        size: file.size
      });
      
      // 清空 input，允许重复上传同一文件
      target.value = '';
    } else {
      const errorMsg = response.data.msg || '上传失败';
      emit('error', errorMsg);
      alert(errorMsg);
    }
  } catch (error: any) {
    console.error('上传失败:', error);
    const errorMsg = error.response?.data?.message || error.message || '上传失败，请重试';
    emit('error', errorMsg);
    alert(errorMsg);
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped lang="scss">
.file-upload-label {
  display: inline-block;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.upload-btn {
  display: inline-block;
  padding: 8px 16px;
  background: #4ECDC4;
  color: white;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s ease;
  
  &:hover:not(.uploading) {
    background: #45b7aa;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(78, 205, 196, 0.3);
  }
  
  &.uploading {
    background: #ccc;
    cursor: not-allowed;
  }
}
</style>
