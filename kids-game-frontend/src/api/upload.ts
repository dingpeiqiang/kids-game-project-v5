import request from '@/utils/request'

export interface UploadResponse {
  url: string
  filename: string
  size: number
  contentType: string
}

/**
 * 上传图片
 */
export function uploadImage(file: File, category?: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category || 'avatars')
  
  return request<any, UploadResponse>({
    url: '/api/resource/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传音频
 */
export function uploadAudio(file: File, category?: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category || 'themes/audio')
  
  return request<any, UploadResponse>({
    url: '/api/resource/upload/audio',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除资源
 */
export function deleteResource(url: string) {
  return request({
    url: '/api/resource/delete',
    method: 'delete',
    params: { url }
  })
}
