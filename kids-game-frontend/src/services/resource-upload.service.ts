import { BaseApiService } from './base-api.service'

/**
 * 资源上传响应数据
 */
export interface UploadResponse {
  url: string
  filename: string
  size: number
  contentType: string
}

/**
 * 资源上传服务
 */
export class ResourceUploadService extends BaseApiService {
  private static instance: ResourceUploadService

  private constructor() {
    super()
  }

  static getInstance(): ResourceUploadService {
    if (!ResourceUploadService.instance) {
      ResourceUploadService.instance = new ResourceUploadService()
    }
    return ResourceUploadService.instance
  }

  /**
   * 上传图片
   * @param file 图片文件
   * @param category 分类，默认为 'themes/images'
   * @returns 上传结果，包含可访问的URL
   */
  async uploadImage(file: File, category = 'themes/images'): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const response = await this.axiosInstance.post<UploadResponse>('/api/resource/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  /**
   * 上传音频
   * @param file 音频文件
   * @param category 分类，默认为 'themes/audio'
   * @returns 上传结果，包含可访问的URL
   */
  async uploadAudio(file: File, category = 'themes/audio'): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const response = await this.axiosInstance.post<UploadResponse>('/api/resource/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  /**
   * 删除资源
   * @param url 资源URL
   */
  async deleteResource(url: string): Promise<void> {
    await this.axiosInstance.delete('/api/resource/delete', {
      params: { url }
    })
  }

  /**
   * 上传Base64图片（先转换为File再上传）
   * @param base64 Base64图片数据
   * @param filename 文件名
   * @param category 分类
   * @returns 上传结果
   */
  async uploadBase64Image(base64: string, filename: string, category = 'themes/images'): Promise<UploadResponse> {
    // 将Base64转换为Blob
    const base64Data = base64.split(',')[1] || base64
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    const mimeType = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/)?.[1] || 'image/png'
    const blob = new Blob([byteArray], { type: mimeType })

    const file = new File([blob], filename, { type: mimeType })
    return this.uploadImage(file, category)
  }

  /**
   * 上传Base64音频（先转换为File再上传）
   * @param base64 Base64音频数据
   * @param filename 文件名
   * @param category 分类
   * @returns 上传结果
   */
  async uploadBase64Audio(base64: string, filename: string, category = 'themes/audio'): Promise<UploadResponse> {
    // 将Base64转换为Blob
    const base64Data = base64.split(',')[1] || base64
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    const mimeType = base64.match(/^data:(audio\/[a-zA-Z+]+);base64,/)?.[1] || 'audio/mpeg'
    const blob = new Blob([byteArray], { type: mimeType })

    const file = new File([blob], filename, { type: mimeType })
    return this.uploadAudio(file, category)
  }
}

// 导出单例
export const resourceUploadService = ResourceUploadService.getInstance()

