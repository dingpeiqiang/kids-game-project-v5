package com.kidgame.service;

import com.kidgame.dao.entity.Draft;
import com.kidgame.dao.entity.DraftVersion;

import java.util.List;
import java.util.Map;

/**
 * 通用草稿服务接口
 * 支持多种内容类型的草稿管理
 */
public interface DraftService {

    // ==================== 基本CRUD操作 ====================

    /**
     * 保存草稿（新增或更新）
     * @param draft 草稿数据
     * @return 保存后的草稿
     */
    Draft saveDraft(Draft draft);

    /**
     * 根据ID查询草稿
     * @param draftId 草稿ID
     * @return 草稿数据
     */
    Draft getDraftById(Long draftId);

    /**
     * 删除草稿
     * @param draftId 草稿ID
     * @param authorId 作者ID（用于权限验证）
     * @return 是否删除成功
     */
    boolean deleteDraft(Long draftId, Long authorId);

    // ==================== 查询操作 ====================

    /**
     * 获取用户的所有草稿
     * @param authorId 作者ID
     * @return 草稿列表
     */
    List<Draft> getMyDrafts(Long authorId);

    /**
     * 根据内容类型获取草稿
     * @param authorId 作者ID
     * @param contentType 内容类型
     * @return 草稿列表
     */
    List<Draft> getDraftsByContentType(Long authorId, String contentType);

    /**
     * 根据关联实体查询草稿
     * @param relatedEntityType 关联实体类型
     * @param relatedEntityId 关联实体ID
     * @return 草稿列表
     */
    List<Draft> getDraftsByRelatedEntity(String relatedEntityType, Long relatedEntityId);

    // ==================== 版本管理 ====================

    /**
     * 获取草稿的版本历史
     * @param draftId 草稿ID
     * @return 版本历史列表
     */
    List<DraftVersion> getDraftVersions(Long draftId);

    /**
     * 回滚到指定版本
     * @param draftId 草稿ID
     * @param version 版本号
     * @param authorId 作者ID（用于权限验证）
     * @return 是否回滚成功
     */
    boolean rollbackToVersion(Long draftId, Integer version, Long authorId);

    /**
     * 清理过期的版本历史（保留最近N个版本）
     * @param draftId 草稿ID
     * @param keepVersions 保留的版本数量
     * @return 清理的版本数量
     */
    int cleanupOldVersions(Long draftId, int keepVersions);

    // ==================== 批量操作 ====================

    /**
     * 批量删除草稿
     * @param draftIds 草稿ID列表
     * @param authorId 作者ID（用于权限验证）
     * @return 删除成功的数量
     */
    int batchDeleteDrafts(List<Long> draftIds, Long authorId);

    /**
     * 清理过期草稿
     * @param authorId 作者ID（为null则清理所有用户的草稿）
     * @param contentType 内容类型（为null则清理所有类型）
     * @param days 过期天数
     * @return 删除的草稿数量
     */
    int cleanupExpiredDrafts(Long authorId, String contentType, int days);

    // ==================== 统计操作 ====================

    /**
     * 获取草稿统计信息
     * @param authorId 作者ID
     * @return 统计信息（按内容类型分组）
     */
    Map<String, Object> getDraftStatistics(Long authorId);

    /**
     * 获取用户草稿数量
     * @param authorId 作者ID
     * @return 草稿数量
     */
    int getDraftCount(Long authorId);

    /**
     * 获取用户指定内容类型的草稿数量
     * @param authorId 作者ID
     * @param contentType 内容类型
     * @return 草稿数量
     */
    int getDraftCountByContentType(Long authorId, String contentType);
}
