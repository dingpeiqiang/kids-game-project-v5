import { apiClient } from '@/services/api-client.service'

export interface UploadResponse {
  url: string
  filename: string
  size: number
  contentType: string
}

export function uploadImage(file: File, category?: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category || 'avatars')

  return apiClient.post<UploadResponse>('/api/resource/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  } as never)
}

export function uploadAudio(file: File, category?: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category || 'themes/audio')

  return apiClient.post<UploadResponse>('/api/resource/upload/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  } as never)
}

export function deleteResource(url: string) {
  return apiClient.delete('/api/resource/delete', { params: { url } } as never)
}