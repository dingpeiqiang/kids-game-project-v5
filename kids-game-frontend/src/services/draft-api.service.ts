/**
 * ============================================
 * 通用草稿 API 服务
 * ============================================
 * 支持多种内容类型的草稿管理
 * 内容类型：THEME, GAME_CONFIG, ARTICLE, USER_CONFIG 等
 * ============================================
 */

import { BaseApiService } from './base-api.service'

/**
 * 草稿内容类型枚举
 */
export enum DraftContentType {
  THEME = 'THEME',              // 主题草稿
  GAME_CONFIG = 'GAME_CONFIG',  // 游戏配置草稿
  ARTICLE = 'ARTICLE',          // 文章草稿
  USER_CONFIG = 'USER_CONFIG',  // 用户配置草稿
}

/**
 * 草稿状态枚举
 */
export enum DraftStatus {
  DRAFT = 'draft',        // 草稿
  ARCHIVED = 'archived',  // 已归档
  PUBLISHED = 'published' // 已发布
}

/**
 * 草稿数据接口
 */
export interface Draft {
  draftId: number
  authorId: number
  authorType: string
  contentType: DraftContentType
  draftName: string
  draftTitle?: string
  contentJson: string
  metadataJson?: string
  thumbnailUrl?: string
  relatedEntityType?: string
  relatedEntityId?: number
  status: DraftStatus
  contentSize: number
  version: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
  tags?: string
  remark?: string
}

/**
 * 草稿版本数据接口
 */
export interface DraftVersion {
  versionId: number
  draftId: number
  version: number
  contentJson: string
  metadataJson?: string
  changeLog?: string
  createdAt: string
  createdBy?: number
}

/**
 * 草稿统计信息接口
 */
export interface DraftStatistics {
  totalCount: number
  totalSize: number
  byContentType: Record<string, number>
  byStatus: Record<string, number>
}

/**
 * 保存草稿参数接口
 */
export interface SaveDraftParams {
  draftId?: number                        // 更新时需要
  contentType: DraftContentType           // 内容类型（必填）
  draftName: string                        // 草稿名称（必填）
  draftTitle?: string                      // 草稿标题
  contentJson: string                     // 内容JSON（必填）
  metadataJson?: string                   // 元数据JSON
  thumbnailUrl?: string                    // 缩略图URL
  relatedEntityType?: string               // 关联实体类型
  relatedEntityId?: number                 // 关联实体ID
  tags?: string                            // 标签（逗号分隔）
  remark?: string                          // 备注
}

/**
 * 保存草稿响应接口
 */
export interface SaveDraftResponse {
  draftId: number
  draftName: string
  contentType: DraftContentType
  version: number
  createdAt: string
  updatedAt: string
}

/**
 * 草稿列表响应接口
 */
export interface DraftListResponse {
  list: Draft[]
  total: number
}

/**
 * 通用草稿 API 服务类
 */
class DraftApiService extends BaseApiService {
  private static instance: DraftApiService

  private constructor() {
    super()
  }

  static getInstance(): DraftApiService {
    if (!DraftApiService.instance) {
      DraftApiService.instance = new DraftApiService()
    }
    return DraftApiService.instance
  }

  // ==================== 基本CRUD操作 ====================

  /**
   * 保存草稿
   * POST /api/draft
   */
  async saveDraft(params: SaveDraftParams): Promise<SaveDraftResponse> {
    return this.post<SaveDraftResponse>('/api/draft', params)
  }

  /**
   * 获取草稿详情
   * GET /api/draft/{draftId}
   */
  async getDraftDetail(draftId: number): Promise<Draft> {
    return this.get<Draft>(`/api/draft/${draftId}`)
  }

  /**
   * 删除草稿
   * DELETE /api/draft/{draftId}
   */
  async deleteDraft(draftId: number): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/api/draft/${draftId}`)
  }

  // ==================== 查询操作 ====================

  /**
   * 获取我的草稿列表
   * GET /api/draft/my
   */
  async getMyDrafts(contentType?: DraftContentType): Promise<DraftListResponse> {
    const config = contentType ? { params: { contentType } } : {}
    return this.get<DraftListResponse>('/api/draft/my', config)
  }

  /**
   * 根据关联实体查询草稿
   * GET /api/draft/related
   */
  async getDraftsByRelatedEntity(
    relatedEntityType: string,
    relatedEntityId: number
  ): Promise<Draft[]> {
    return this.get<Draft[]>('/api/draft/related', {
      params: {
        relatedEntityType,
        relatedEntityId
      }
    })
  }

  // ==================== 版本管理 ====================

  /**
   * 获取草稿版本历史
   * GET /api/draft/{draftId}/versions
   */
  async getDraftVersions(draftId: number): Promise<DraftVersion[]> {
    return this.get<DraftVersion[]>(`/api/draft/${draftId}/versions`)
  }

  /**
   * 回滚到指定版本
   * POST /api/draft/{draftId}/rollback/{version}
   */
  async rollbackToVersion(
    draftId: number,
    version: number
  ): Promise<{ success: boolean; draftId: number; version: number }> {
    return this.post<{ success: boolean; draftId: number; version: number }>(
      `/api/draft/${draftId}/rollback/${version}`,
      {}
    )
  }

  // ==================== 批量操作 ====================

  /**
   * 批量删除草稿
   * DELETE /api/draft/batch
   */
  async batchDeleteDrafts(draftIds: number[]): Promise<{
    success: boolean
    deletedCount: number
    totalCount: number
  }> {
    return this.delete<{
      success: boolean
      deletedCount: number
      totalCount: number
    }>('/api/draft/batch', {
      data: draftIds
    })
  }

  // ==================== 统计操作 ====================

  /**
   * 获取草稿统计信息
   * GET /api/draft/statistics
   */
  async getDraftStatistics(): Promise<DraftStatistics> {
    return this.get<DraftStatistics>('/api/draft/statistics')
  }
}

// 导出单例
export const draftApi = DraftApiService.getInstance()

// 默认导出
export default draftApi
