/**
 * ============================================
 * 通用草稿 API 服务
 * ============================================
 * 支持多种内容类型的草稿管理
 * 内容类型：THEME, GAME_CONFIG, ARTICLE, USER_CONFIG 等
 * ============================================
 */

import { apiClient } from './api-client.service'

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

export const draftApi = {
  saveDraft(params: SaveDraftParams): Promise<SaveDraftResponse> {
    return apiClient.post<SaveDraftResponse>('/api/draft', params)
  },

  getDraftDetail(draftId: number): Promise<Draft> {
    return apiClient.get<Draft>(`/api/draft/${draftId}`)
  },

  deleteDraft(draftId: number): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/draft/${draftId}`)
  },

  getMyDrafts(contentType?: DraftContentType): Promise<DraftListResponse> {
    const config = contentType ? { params: { contentType } } : {}
    return apiClient.get<DraftListResponse>('/api/draft/my', config as never)
  },

  getDraftsByRelatedEntity(
    relatedEntityType: string,
    relatedEntityId: number,
  ): Promise<Draft[]> {
    return apiClient.get<Draft[]>('/api/draft/related', {
      params: { relatedEntityType, relatedEntityId },
    } as never)
  },

  getDraftVersions(draftId: number): Promise<DraftVersion[]> {
    return apiClient.get<DraftVersion[]>(`/api/draft/${draftId}/versions`)
  },

  rollbackToVersion(
    draftId: number,
    version: number,
  ): Promise<{ success: boolean; draftId: number; version: number }> {
    return apiClient.post(`/api/draft/${draftId}/rollback/${version}`, {})
  },

  batchDeleteDrafts(draftIds: number[]): Promise<{
    success: boolean
    deletedCount: number
    totalCount: number
  }> {
    return apiClient.delete('/api/draft/batch', { data: draftIds } as never)
  },

  getDraftStatistics(): Promise<DraftStatistics> {
    return apiClient.get<DraftStatistics>('/api/draft/statistics')
  },
}

export default draftApi
