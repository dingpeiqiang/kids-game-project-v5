import { resourceUploadService } from './resource-upload.service'

// 导出类型
export type { UploadResponse } from './resource-upload.service'

/**
 * 统一上传响应
 */
export interface UnifiedUploadResponse {
  url: string
  filename: string
  size: number
  contentType: string
}

/**
 * 统一上传服务
 * 
 * 文件上传到后端服务器，由后端服务器转发到 COS
 * 
 * 使用方式：
 * const response = await unifiedUploadService.uploadImage(file)
 * console.log('文件 URL:', response.url)
 */
export class UnifiedUploadService {
  private static instance: UnifiedUploadService

  private constructor() {
  }

  static getInstance(): UnifiedUploadService {
    if (!UnifiedUploadService.instance) {
      UnifiedUploadService.instance = new UnifiedUploadService()
    }
    return UnifiedUploadService.instance
  }

  /**
   * 上传图片
   * @param file 图片文件
   * @param category 分类
   * @returns 上传结果
   */
  async uploadImage(file: File, category?: string): Promise<UnifiedUploadResponse> {
    console.log(`上传图片到后端服务器，文件名: ${file.name}, 大小: ${file.size} bytes`)

    const response = await resourceUploadService.uploadImage(file, category)
    return {
      url: response.url,
      filename: response.filename,
      size: response.size,
      contentType: response.contentType
    }
  }

  /**
   * 上传音频
   * @param file 音频文件
   * @param category 分类
   * @returns 上传结果
   */
  async uploadAudio(file: File, category?: string): Promise<UnifiedUploadResponse> {
    console.log(`上传音频到后端服务器，文件名: ${file.name}, 大小: ${file.size} bytes`)

    const response = await resourceUploadService.uploadAudio(file, category)
    return {
      url: response.url,
      filename: response.filename,
      size: response.size,
      contentType: response.contentType
    }
  }

  /**
   * 删除资源
   * @param url 资源 URL
   */
  async deleteResource(url: string): Promise<void> {
    console.log(`删除资源: ${url}`)
    await resourceUploadService.deleteResource(url)
  }

  /**
   * 上传 Base64 图片
   * @param base64 Base64 图片数据
   * @param filename 文件名
   * @param category 分类
   * @returns 上传结果
   */
  async uploadBase64Image(
    base64: string,
    filename: string,
    category?: string
  ): Promise<UnifiedUploadResponse> {
    console.log(`上传 Base64 图片到后端服务器，文件名: ${filename}`)

    const response = await resourceUploadService.uploadBase64Image(base64, filename, category)
    return {
      url: response.url,
      filename: response.filename,
      size: response.size,
      contentType: response.contentType
    }
  }

  /**
   * 上传 Base64 音频
   * @param base64 Base64 音频数据
   * @param filename 文件名
   * @param category 分类
   * @returns 上传结果
   */
  async uploadBase64Audio(
    base64: string,
    filename: string,
    category?: string
  ): Promise<UnifiedUploadResponse> {
    console.log(`上传 Base64 音频到后端服务器，文件名: ${filename}`)

    const response = await resourceUploadService.uploadBase64Audio(base64, filename, category)
    return {
      url: response.url,
      filename: response.filename,
      size: response.size,
      contentType: response.contentType
    }
  }

  /**
   * 获取上传方式的描述
   */
  getUploadMethodDescription(): string {
    return '后端服务器（通过后端转发到 COS）'
  }
}

// 导出单例
export const unifiedUploadService = UnifiedUploadService.getInstance()
