package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.kidgame.dao.entity.Draft;
import com.kidgame.dao.entity.DraftVersion;
import com.kidgame.dao.mapper.DraftMapper;
import com.kidgame.dao.mapper.DraftVersionMapper;
import com.kidgame.service.DraftService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 通用草稿服务实现类
 */
@Slf4j
@Service
public class DraftServiceImpl implements DraftService {

    @Autowired
    private DraftMapper draftMapper;

    @Autowired
    private DraftVersionMapper draftVersionMapper;

    // ==================== 配置常量 ====================

    /**
     * 最大草稿数量
     */
    private static final int MAX_DRAFT_COUNT = 20;

    /**
     * 保留的历史版本数量
     */
    private static final int KEEP_VERSION_COUNT = 10;

    // ==================== 基本CRUD操作 ====================

    @Override
    @Transactional
    public Draft saveDraft(Draft draft) {
        try {
            log.info("保存草稿: authorId={}, contentType={}, draftName={}",
                    draft.getAuthorId(), draft.getContentType(), draft.getDraftName());

            // 计算内容大小
            int size = draft.getContentJson() != null ? draft.getContentJson().getBytes().length : 0;
            draft.setContentSize(size);

            LocalDateTime now = LocalDateTime.now();

            if (draft.getDraftId() == null) {
                // 新增草稿
                draft.setStatus("draft");
                draft.setVersion(1);
                draft.setCreatedAt(now);
                draft.setUpdatedAt(now);

                int result = draftMapper.insert(draft);
                if (result > 0) {
                    log.info("草稿新增成功: draftId={}", draft.getDraftId());

                    // 检查草稿数量，超过限制则删除最旧的
                    checkAndCleanupDrafts(draft.getAuthorId(), draft.getContentType());
                } else {
                    log.error("草稿新增失败: authorId={}, draftName={}",
                            draft.getAuthorId(), draft.getDraftName());
                    return null;
                }
            } else {
                // 更新草稿
                Draft existingDraft = draftMapper.selectById(draft.getDraftId());
                if (existingDraft == null) {
                    log.error("草稿不存在: draftId={}", draft.getDraftId());
                    return null;
                }

                // 验证权限
                if (!existingDraft.getAuthorId().equals(draft.getAuthorId())) {
                    log.error("无权限更新草稿: draftId={}, authorId={}, existingAuthorId={}",
                            draft.getDraftId(), draft.getAuthorId(), existingDraft.getAuthorId());
                    return null;
                }

                // 如果内容发生变化，保存版本历史
                if (draft.getContentJson() != null && !draft.getContentJson().equals(existingDraft.getContentJson())) {
                    saveVersionHistory(existingDraft);
                    draft.setVersion(existingDraft.getVersion() + 1);
                } else {
                    draft.setVersion(existingDraft.getVersion());
                }

                draft.setUpdatedAt(now);

                int result = draftMapper.updateById(draft);
                if (result > 0) {
                    log.info("草稿更新成功: draftId={}, version={}", draft.getDraftId(), draft.getVersion());
                } else {
                    log.error("草稿更新失败: draftId={}", draft.getDraftId());
                    return null;
                }
            }

            return draft;
        } catch (Exception e) {
            log.error("保存草稿异常: authorId={}, draftName={}",
                    draft.getAuthorId(), draft.getDraftName(), e);
            return null;
        }
    }

    @Override
    public Draft getDraftById(Long draftId) {
        try {
            log.debug("查询草稿: draftId={}", draftId);
            Draft draft = draftMapper.selectById(draftId);
            if (draft != null) {
                log.debug("草稿查询成功: draftId={}, draftName={}", draftId, draft.getDraftName());
            } else {
                log.warn("草稿不存在: draftId={}", draftId);
            }
            return draft;
        } catch (Exception e) {
            log.error("查询草稿失败: draftId={}", draftId, e);
            return null;
        }
    }

    @Override
    @Transactional
    public boolean deleteDraft(Long draftId, Long authorId) {
        try {
            log.info("删除草稿: draftId={}, authorId={}", draftId, authorId);

            // 先查询草稿，验证权限
            Draft draft = draftMapper.selectById(draftId);
            if (draft == null) {
                log.warn("草稿不存在，删除失败: draftId={}", draftId);
                return false;
            }

            // 验证作者权限
            if (!draft.getAuthorId().equals(authorId)) {
                log.warn("无权限删除草稿: draftId={}, authorId={}, draftAuthorId={}",
                        draftId, authorId, draft.getAuthorId());
                return false;
            }

            // 删除草稿（级联删除版本历史）
            int result = draftMapper.deleteById(draftId);
            if (result > 0) {
                log.info("草稿删除成功: draftId={}", draftId);
                return true;
            } else {
                log.error("草稿删除失败: draftId={}", draftId);
                return false;
            }
        } catch (Exception e) {
            log.error("删除草稿异常: draftId={}, authorId={}", draftId, authorId, e);
            return false;
        }
    }

    // ==================== 查询操作 ====================

    @Override
    public List<Draft> getMyDrafts(Long authorId) {
        try {
            log.debug("获取用户草稿列表: authorId={}", authorId);
            List<Draft> drafts = draftMapper.findByAuthorId(authorId);
            log.debug("用户草稿列表查询成功: authorId={}, count={}", authorId, drafts.size());
            return drafts;
        } catch (Exception e) {
            log.error("获取用户草稿列表失败: authorId={}", authorId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<Draft> getDraftsByContentType(Long authorId, String contentType) {
        try {
            log.debug("获取用户指定类型的草稿: authorId={}, contentType={}", authorId, contentType);
            List<Draft> drafts = draftMapper.findByAuthorIdAndContentType(authorId, contentType);
            log.debug("草稿列表查询成功: authorId={}, contentType={}, count={}",
                    authorId, contentType, drafts.size());
            return drafts;
        } catch (Exception e) {
            log.error("获取草稿列表失败: authorId={}, contentType={}", authorId, contentType, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<Draft> getDraftsByRelatedEntity(String relatedEntityType, Long relatedEntityId) {
        try {
            log.debug("根据关联实体查询草稿: relatedEntityType={}, relatedEntityId={}",
                    relatedEntityType, relatedEntityId);
            List<Draft> drafts = draftMapper.findByRelatedEntity(relatedEntityType, relatedEntityId);
            log.debug("草稿列表查询成功: relatedEntityType={}, relatedEntityId={}, count={}",
                    relatedEntityType, relatedEntityId, drafts.size());
            return drafts;
        } catch (Exception e) {
            log.error("根据关联实体查询草稿失败: relatedEntityType={}, relatedEntityId={}",
                    relatedEntityType, relatedEntityId, e);
            return new ArrayList<>();
        }
    }

    // ==================== 版本管理 ====================

    @Override
    public List<DraftVersion> getDraftVersions(Long draftId) {
        try {
            log.debug("获取草稿版本历史: draftId={}", draftId);
            List<DraftVersion> versions = draftVersionMapper.findByDraftId(draftId);
            log.debug("草稿版本历史查询成功: draftId={}, count={}", draftId, versions.size());
            return versions;
        } catch (Exception e) {
            log.error("获取草稿版本历史失败: draftId={}", draftId, e);
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional
    public boolean rollbackToVersion(Long draftId, Integer version, Long authorId) {
        try {
            log.info("回滚草稿到指定版本: draftId={}, version={}, authorId={}",
                    draftId, version, authorId);

            // 查询草稿
            Draft draft = draftMapper.selectById(draftId);
            if (draft == null) {
                log.error("草稿不存在: draftId={}", draftId);
                return false;
            }

            // 验证权限
            if (!draft.getAuthorId().equals(authorId)) {
                log.error("无权限回滚草稿: draftId={}, authorId={}, draftAuthorId={}",
                        draftId, authorId, draft.getAuthorId());
                return false;
            }

            // 查询指定版本
            DraftVersion targetVersion = draftVersionMapper.findByDraftIdAndVersion(draftId, version);
            if (targetVersion == null) {
                log.error("目标版本不存在: draftId={}, version={}", draftId, version);
                return false;
            }

            // 保存当前版本作为新版本
            saveVersionHistory(draft);

            // 恢复到目标版本内容
            draft.setContentJson(targetVersion.getContentJson());
            draft.setMetadataJson(targetVersion.getMetadataJson());
            draft.setVersion(draft.getVersion() + 1);
            draft.setUpdatedAt(LocalDateTime.now());

            int result = draftMapper.updateById(draft);
            if (result > 0) {
                log.info("草稿回滚成功: draftId={}, newVersion={}", draftId, draft.getVersion());
                return true;
            } else {
                log.error("草稿回滚失败: draftId={}", draftId);
                return false;
            }
        } catch (Exception e) {
            log.error("回滚草稿异常: draftId={}, version={}, authorId={}",
                    draftId, version, authorId, e);
            return false;
        }
    }

    @Override
    @Transactional
    public int cleanupOldVersions(Long draftId, int keepVersions) {
        try {
            log.info("清理过期版本历史: draftId={}, keepVersions={}", draftId, keepVersions);

            List<DraftVersion> versions = draftVersionMapper.findByDraftId(draftId);
            if (versions.size() <= keepVersions) {
                log.info("版本历史数量未超过限制，无需清理: draftId={}, currentCount={}, keepVersions={}",
                        draftId, versions.size(), keepVersions);
                return 0;
            }

            // 超过限制的版本ID列表
            List<Long> versionIdsToDelete = versions.stream()
                    .skip(keepVersions)
                    .map(DraftVersion::getVersionId)
                    .collect(Collectors.toList());

            // 批量删除
            int deletedCount = 0;
            for (Long versionId : versionIdsToDelete) {
                deletedCount += draftVersionMapper.deleteById(versionId);
            }

            log.info("过期版本历史清理完成: draftId={}, deletedCount={}", draftId, deletedCount);
            return deletedCount;
        } catch (Exception e) {
            log.error("清理过期版本历史异常: draftId={}", draftId, e);
            return 0;
        }
    }

    // ==================== 批量操作 ====================

    @Override
    @Transactional
    public int batchDeleteDrafts(List<Long> draftIds, Long authorId) {
        try {
            log.info("批量删除草稿: authorId={}, count={}", authorId, draftIds.size());

            int deletedCount = 0;
            for (Long draftId : draftIds) {
                if (deleteDraft(draftId, authorId)) {
                    deletedCount++;
                }
            }

            log.info("批量删除草稿完成: authorId={}, deletedCount={}, total={}",
                    authorId, deletedCount, draftIds.size());
            return deletedCount;
        } catch (Exception e) {
            log.error("批量删除草稿异常: authorId={}", authorId, e);
            return 0;
        }
    }

    @Override
    @Transactional
    public int cleanupExpiredDrafts(Long authorId, String contentType, int days) {
        try {
            log.info("清理过期草稿: authorId={}, contentType={}, days={}", authorId, contentType, days);

            LocalDateTime expireTime = LocalDateTime.now().minusDays(days);

            LambdaQueryWrapper<Draft> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Draft::getStatus, "draft")
                    .lt(Draft::getUpdatedAt, expireTime);

            if (authorId != null) {
                wrapper.eq(Draft::getAuthorId, authorId);
            }

            if (contentType != null) {
                wrapper.eq(Draft::getContentType, contentType);
            }

            List<Draft> expiredDrafts = draftMapper.selectList(wrapper);
            int count = expiredDrafts.size();

            for (Draft draft : expiredDrafts) {
                draftMapper.deleteById(draft.getDraftId());
            }

            log.info("过期草稿清理完成: authorId={}, contentType={}, deletedCount={}",
                    authorId, contentType, count);
            return count;
        } catch (Exception e) {
            log.error("清理过期草稿异常: authorId={}, contentType={}, days={}",
                    authorId, contentType, days, e);
            return 0;
        }
    }

    // ==================== 统计操作 ====================

    @Override
    public Map<String, Object> getDraftStatistics(Long authorId) {
        try {
            log.debug("获取草稿统计信息: authorId={}", authorId);

            Map<String, Object> stats = new HashMap<>();

            // 获取所有草稿
            List<Draft> drafts = draftMapper.findByAuthorId(authorId);

            // 按内容类型分组统计
            Map<String, Long> byContentType = drafts.stream()
                    .collect(Collectors.groupingBy(Draft::getContentType, Collectors.counting()));

            // 按状态分组统计
            Map<String, Long> byStatus = drafts.stream()
                    .collect(Collectors.groupingBy(Draft::getStatus, Collectors.counting()));

            // 总统计
            int totalCount = drafts.size();
            int totalSize = drafts.stream().mapToInt(Draft::getContentSize).sum();

            stats.put("totalCount", totalCount);
            stats.put("totalSize", totalSize);
            stats.put("byContentType", byContentType);
            stats.put("byStatus", byStatus);

            log.debug("草稿统计信息获取成功: authorId={}", authorId);
            return stats;
        } catch (Exception e) {
            log.error("获取草稿统计信息失败: authorId={}", authorId, e);
            return new HashMap<>();
        }
    }

    @Override
    public int getDraftCount(Long authorId) {
        try {
            return draftMapper.countByAuthorId(authorId);
        } catch (Exception e) {
            log.error("获取草稿数量失败: authorId={}", authorId, e);
            return 0;
        }
    }

    @Override
    public int getDraftCountByContentType(Long authorId, String contentType) {
        try {
            return draftMapper.countByAuthorIdAndContentType(authorId, contentType);
        } catch (Exception e) {
            log.error("获取草稿数量失败: authorId={}, contentType={}", authorId, contentType, e);
            return 0;
        }
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 保存版本历史
     */
    private void saveVersionHistory(Draft draft) {
        try {
            DraftVersion version = new DraftVersion();
            version.setDraftId(draft.getDraftId());
            version.setVersion(draft.getVersion());
            version.setContentJson(draft.getContentJson());
            version.setMetadataJson(draft.getMetadataJson());
            version.setCreatedAt(LocalDateTime.now());
            version.setCreatedBy(draft.getAuthorId());

            draftVersionMapper.insert(version);

            // 清理旧版本
            cleanupOldVersions(draft.getDraftId(), KEEP_VERSION_COUNT);
        } catch (Exception e) {
            log.error("保存版本历史失败: draftId={}", draft.getDraftId(), e);
        }
    }

    /**
     * 检查并清理超过限制的草稿
     */
    private void checkAndCleanupDrafts(Long authorId, String contentType) {
        try {
            int draftCount = getDraftCount(authorId);
            if (draftCount <= MAX_DRAFT_COUNT) {
                return;
            }

            log.info("用户草稿数量超过限制，删除最旧的草稿: authorId={}, currentCount={}, maxCount={}",
                    authorId, draftCount, MAX_DRAFT_COUNT);

            List<Draft> allDrafts = draftMapper.findByAuthorId(authorId);
            int toDelete = draftCount - MAX_DRAFT_COUNT;

            for (int i = 0; i < toDelete && i < allDrafts.size(); i++) {
                Draft oldDraft = allDrafts.get(i);
                draftMapper.deleteById(oldDraft.getDraftId());
                log.info("删除旧草稿: draftId={}, draftName={}", oldDraft.getDraftId(), oldDraft.getDraftName());
            }
        } catch (Exception e) {
            log.error("检查并清理草稿失败: authorId={}", authorId, e);
        }
    }
}
