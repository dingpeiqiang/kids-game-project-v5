package com.kidgame.web.controller;

import com.kidgame.common.annotation.RequireLogin;
import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.Draft;
import com.kidgame.dao.entity.DraftVersion;
import com.kidgame.service.DraftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 通用草稿管理控制器
 * 支持多种内容类型的草稿管理
 */
@Slf4j
@RestController
@RequestMapping("/api/draft")
@Tag(name = "草稿管理", description = "通用草稿管理接口")
public class DraftController {

    @Autowired
    private DraftService draftService;

    // ==================== 基本CRUD操作 ====================

    /**
     * 保存草稿
     */
    @Operation(summary = "保存草稿")
    @PostMapping
    @RequireLogin
    public Result<Map<String, Object>> saveDraft(
            @Parameter(description = "草稿数据")
            @RequestBody Map<String, Object> params,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);

            // 构建草稿对象
            Draft draft = new Draft();
            draft.setAuthorId(authorId);
            draft.setAuthorType("USER");

            // 基本信息
            draft.setContentType((String) params.get("contentType"));
            draft.setDraftName((String) params.get("draftName"));
            draft.setDraftTitle((String) params.get("draftTitle"));

            // 内容
            draft.setContentJson((String) params.get("contentJson"));
            draft.setMetadataJson((String) params.get("metadataJson"));
            draft.setThumbnailUrl((String) params.get("thumbnailUrl"));

            // 关联信息（可选）
            draft.setRelatedEntityType((String) params.get("relatedEntityType"));
            draft.setRelatedEntityId(params.get("relatedEntityId") != null ?
                    Long.valueOf(params.get("relatedEntityId").toString()) : null);

            // 其他字段
            draft.setTags((String) params.get("tags"));
            draft.setRemark((String) params.get("remark"));

            // ID（更新时需要）
            if (params.get("draftId") != null) {
                draft.setDraftId(Long.valueOf(params.get("draftId").toString()));
            }

            log.info("保存草稿 - authorId: {}, contentType: {}, draftName: {}",
                    authorId, draft.getContentType(), draft.getDraftName());

            // 验证必填字段
            if (draft.getContentType() == null || draft.getContentType().isEmpty()) {
                return Result.error("内容类型不能为空");
            }

            if (draft.getDraftName() == null || draft.getDraftName().isEmpty()) {
                return Result.error("草稿名称不能为空");
            }

            if (draft.getContentJson() == null || draft.getContentJson().isEmpty()) {
                return Result.error("草稿内容不能为空");
            }

            Draft savedDraft = draftService.saveDraft(draft);

            if (savedDraft != null) {
                Map<String, Object> result = new HashMap<>();
                result.put("draftId", savedDraft.getDraftId());
                result.put("draftName", savedDraft.getDraftName());
                result.put("contentType", savedDraft.getContentType());
                result.put("version", savedDraft.getVersion());
                result.put("createdAt", savedDraft.getCreatedAt());
                result.put("updatedAt", savedDraft.getUpdatedAt());
                return Result.success(result);
            } else {
                return Result.error("保存草稿失败");
            }
        } catch (Exception e) {
            log.error("保存草稿失败", e);
            return Result.error("保存草稿失败：" + e.getMessage());
        }
    }

    /**
     * 获取草稿详情
     */
    @Operation(summary = "获取草稿详情")
    @GetMapping("/{draftId}")
    @RequireLogin
    public Result<Draft> getDraftDetail(
            @Parameter(description = "草稿ID")
            @PathVariable Long draftId,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);
            log.info("获取草稿详情 - draftId: {}, authorId: {}", draftId, authorId);

            Draft draft = draftService.getDraftById(draftId);

            if (draft == null) {
                return Result.error("草稿不存在");
            }

            // 验证权限
            if (!draft.getAuthorId().equals(authorId)) {
                log.warn("无权限访问草稿: draftId={}, authorId={}, draftAuthorId={}",
                        draftId, authorId, draft.getAuthorId());
                return Result.error("无权限访问该草稿");
            }

            return Result.success(draft);
        } catch (Exception e) {
            log.error("获取草稿详情失败", e);
            return Result.error("获取草稿详情失败：" + e.getMessage());
        }
    }

    /**
     * 删除草稿
     */
    @Operation(summary = "删除草稿")
    @DeleteMapping("/{draftId}")
    @RequireLogin
    public Result<Map<String, Boolean>> deleteDraft(
            @Parameter(description = "草稿ID")
            @PathVariable Long draftId,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);
            log.info("删除草稿 - draftId: {}, authorId: {}", draftId, authorId);

            boolean success = draftService.deleteDraft(draftId, authorId);

            if (success) {
                Map<String, Boolean> result = new HashMap<>();
                result.put("success", true);
                return Result.success(result);
            } else {
                return Result.error("删除草稿失败：草稿不存在或无权限");
            }
        } catch (Exception e) {
            log.error("删除草稿失败", e);
            return Result.error("删除草稿失败：" + e.getMessage());
        }
    }

    // ==================== 查询操作 ====================

    /**
     * 获取我的草稿列表
     */
    @Operation(summary = "获取我的草稿列表")
    @GetMapping("/my")
    @RequireLogin
    public Result<Map<String, Object>> getMyDrafts(
            @Parameter(description = "内容类型")
            @RequestParam(required = false) String contentType,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);
            log.info("获取用户草稿列表 - authorId: {}, contentType: {}", authorId, contentType);

            List<Draft> drafts;

            if (contentType != null && !contentType.isEmpty()) {
                drafts = draftService.getDraftsByContentType(authorId, contentType);
            } else {
                drafts = draftService.getMyDrafts(authorId);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("list", drafts);
            result.put("total", drafts.size());

            return Result.success(result);
        } catch (Exception e) {
            log.error("获取草稿列表失败", e);
            return Result.error("获取草稿列表失败：" + e.getMessage());
        }
    }

    /**
     * 根据关联实体查询草稿
     */
    @Operation(summary = "根据关联实体查询草稿")
    @GetMapping("/related")
    @RequireLogin
    public Result<List<Draft>> getDraftsByRelatedEntity(
            @Parameter(description = "关联实体类型")
            @RequestParam String relatedEntityType,
            @Parameter(description = "关联实体ID")
            @RequestParam Long relatedEntityId) {

        try {
            log.info("根据关联实体查询草稿 - relatedEntityType: {}, relatedEntityId: {}",
                    relatedEntityType, relatedEntityId);

            List<Draft> drafts = draftService.getDraftsByRelatedEntity(relatedEntityType, relatedEntityId);

            return Result.success(drafts);
        } catch (Exception e) {
            log.error("根据关联实体查询草稿失败", e);
            return Result.error("查询失败：" + e.getMessage());
        }
    }

    // ==================== 版本管理 ====================

    /**
     * 获取草稿版本历史
     */
    @Operation(summary = "获取草稿版本历史")
    @GetMapping("/{draftId}/versions")
    @RequireLogin
    public Result<List<DraftVersion>> getDraftVersions(
            @Parameter(description = "草稿ID")
            @PathVariable Long draftId,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);
            log.info("获取草稿版本历史 - draftId: {}, authorId: {}", draftId, authorId);

            // 验证权限
            Draft draft = draftService.getDraftById(draftId);
            if (draft == null) {
                return Result.error("草稿不存在");
            }
            if (!draft.getAuthorId().equals(authorId)) {
                return Result.error("无权限访问该草稿");
            }

            List<DraftVersion> versions = draftService.getDraftVersions(draftId);

            return Result.success(versions);
        } catch (Exception e) {
            log.error("获取草稿版本历史失败", e);
            return Result.error("获取版本历史失败：" + e.getMessage());
        }
    }

    /**
     * 回滚到指定版本
     */
    @Operation(summary = "回滚到指定版本")
    @PostMapping("/{draftId}/rollback/{version}")
    @RequireLogin
    public Result<Map<String, Object>> rollbackToVersion(
            @Parameter(description = "草稿ID")
            @PathVariable Long draftId,
            @Parameter(description = "版本号")
            @PathVariable Integer version,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);
            log.info("回滚草稿到指定版本 - draftId: {}, version: {}, authorId: {}",
                    draftId, version, authorId);

            boolean success = draftService.rollbackToVersion(draftId, version, authorId);

            if (success) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("draftId", draftId);
                result.put("version", version);
                return Result.success(result);
            } else {
                return Result.error("回滚失败：草稿不存在或无权限");
            }
        } catch (Exception e) {
            log.error("回滚草稿失败", e);
            return Result.error("回滚失败：" + e.getMessage());
        }
    }

    // ==================== 批量操作 ====================

    /**
     * 批量删除草稿
     */
    @Operation(summary = "批量删除草稿")
    @DeleteMapping("/batch")
    @RequireLogin
    public Result<Map<String, Object>> batchDeleteDrafts(
            @Parameter(description = "草稿ID列表")
            @RequestBody List<Long> draftIds,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);
            log.info("批量删除草稿 - authorId: {}, count: {}", authorId, draftIds.size());

            int deletedCount = draftService.batchDeleteDrafts(draftIds, authorId);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("deletedCount", deletedCount);
            result.put("totalCount", draftIds.size());

            return Result.success(result);
        } catch (Exception e) {
            log.error("批量删除草稿失败", e);
            return Result.error("批量删除失败：" + e.getMessage());
        }
    }

    // ==================== 统计操作 ====================

    /**
     * 获取草稿统计信息
     */
    @Operation(summary = "获取草稿统计信息")
    @GetMapping("/statistics")
    @RequireLogin
    public Result<Map<String, Object>> getDraftStatistics(HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null || userIdStr.isEmpty()) {
                return Result.error("请先登录");
            }

            Long authorId = Long.valueOf(userIdStr);
            log.info("获取草稿统计信息 - authorId: {}", authorId);

            Map<String, Object> stats = draftService.getDraftStatistics(authorId);

            return Result.success(stats);
        } catch (Exception e) {
            log.error("获取草稿统计信息失败", e);
            return Result.error("获取统计信息失败：" + e.getMessage());
        }
    }
}
