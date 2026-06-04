package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.service.GameManagementService;
import com.kidgame.service.dto.admin.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

/**
 * 游戏管理控制器（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Slf4j
@Tag(name = "游戏管理", description = "游戏管理相关接口")
@RestController
@RequestMapping("/api/admin/games")
public class GameManagementController {

    @Autowired
    private GameManagementService gameManagementService;

    // ========== 游戏 CRUD ==========

    @Operation(summary = "获取游戏列表（分页）")
    @GetMapping("/list")
    public Result<Page<GameManagementQueryDTO>> listGames(
            @Parameter(description = "游戏名称") @RequestParam(required = false) String gameName,
            @Parameter(description = "游戏编码") @RequestParam(required = false) String gameCode,
            @Parameter(description = "游戏分类") @RequestParam(required = false) String category,
            @Parameter(description = "适龄阶段") @RequestParam(required = false) String grade,
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @Parameter(description = "标签 ID 列表（逗号分隔）") @RequestParam(required = false) String tagIds,
            @Parameter(description = "是否推荐") @RequestParam(required = false) Boolean isFeatured,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_time") String sortBy,
            @Parameter(description = "排序方式") @RequestParam(defaultValue = "desc") String sortOrder) {

        GameManagementQueryDTO query = new GameManagementQueryDTO();
        query.setGameName(gameName);
        query.setGameCode(gameCode);
        query.setCategory(category);
        query.setGrade(grade);
        query.setStatus(status);
        query.setTagIds(tagIds);
        query.setIsFeatured(isFeatured);
        query.setPage(page);
        query.setSize(size);
        query.setSortBy(sortBy);
        query.setSortOrder(sortOrder);

        Page<GameManagementQueryDTO> result = gameManagementService.listGames(query);
        return Result.success(result);
    }

    @Operation(summary = "获取游戏详情")
    @GetMapping("/{gameId}")
    public Result<GameManagementQueryDTO> getGameDetail(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId) {
        return Result.success(gameManagementService.getGameDetail(gameId));
    }

    @Operation(summary = "创建游戏")
    @PostMapping("/create")
    public Result<GameManagementCreateDTO> createGame(
            @RequestBody GameManagementCreateDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("创建游戏。GameCode: {}, UserId: {}", dto.getGameCode(), userId);
        GameManagementCreateDTO result = gameManagementService.createGame(dto, userId);
        return Result.success(result);
    }

    @Operation(summary = "更新游戏")
    @PutMapping("/{gameId}")
    public Result<Void> updateGame(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestBody GameManagementUpdateDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("更新游戏。GameId: {}, UserId: {}", gameId, userId);
        gameManagementService.updateGame(gameId, dto, userId);
        return Result.success();
    }

    @Operation(summary = "删除游戏")
    @DeleteMapping("/{gameId}")
    public Result<Void> deleteGame(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("删除游戏。GameId: {}, UserId: {}", gameId, userId);
        gameManagementService.deleteGame(gameId, userId);
        return Result.success();
    }

    // ========== 上下架管理 ==========

    @Operation(summary = "上架游戏")
    @PostMapping("/{gameId}/publish")
    public Result<Void> publishGame(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "版本号") @RequestParam String version,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("上架游戏。GameId: {}, Version: {}, UserId: {}", gameId, version, userId);
        gameManagementService.publishGame(gameId, version, userId);
        return Result.success();
    }

    @Operation(summary = "下架游戏")
    @PostMapping("/{gameId}/unpublish")
    public Result<Void> unpublishGame(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "下架原因") @RequestParam(required = false) String reason,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("下架游戏。GameId: {}, Reason: {}, UserId: {}", gameId, reason, userId);
        gameManagementService.unpublishGame(gameId, reason, userId);
        return Result.success();
    }

    // ========== 审核管理 ==========

    @Operation(summary = "提交审核")
    @PostMapping("/{gameId}/submit-review")
    public Result<Void> submitReview(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("提交游戏审核。GameId: {}, UserId: {}", gameId, userId);
        gameManagementService.submitReview(gameId, userId);
        return Result.success();
    }

    @Operation(summary = "审核游戏")
    @PostMapping("/{gameId}/review")
    public Result<Void> reviewGame(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestBody GameReviewDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("审核游戏。GameId: {}, DTO: {}, UserId: {}", gameId, dto, userId);
        gameManagementService.reviewGame(gameId, dto, userId);
        return Result.success();
    }

    @Operation(summary = "获取待审核游戏列表")
    @GetMapping("/pending-review")
    public Result<Page<GameManagementQueryDTO>> listPendingReviewGames(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "create_time"));
        Page<GameManagementQueryDTO> result = gameManagementService.listPendingReviewGames(pageable);
        return Result.success(result);
    }

    // ========== 版本管理 ==========

    @Operation(summary = "发布新版本")
    @PostMapping("/{gameId}/versions")
    public Result<GameVersionCreateDTO> publishVersion(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestBody GameVersionCreateDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("发布新版本。GameId: {}, Version: {}, UserId: {}", gameId, dto.getVersion(), userId);
        GameVersionCreateDTO result = gameManagementService.publishVersion(gameId, dto, userId);
        return Result.success(result);
    }

    @Operation(summary = "获取版本历史")
    @GetMapping("/{gameId}/versions")
    public Result<List<GameVersionCreateDTO>> listVersions(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId) {
        return Result.success(gameManagementService.listVersions(gameId));
    }

    @Operation(summary = "回滚到指定版本")
    @PostMapping("/{gameId}/versions/{versionId}/rollback")
    public Result<Void> rollbackVersion(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "版本 ID") @PathVariable Long versionId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        log.info("回滚版本。GameId: {}, VersionId: {}, UserId: {}", gameId, versionId, userId);
        gameManagementService.rollbackVersion(gameId, versionId, userId);
        return Result.success();
    }

    // ========== 标签管理 ==========

    @Operation(summary = "为游戏添加标签")
    @PostMapping("/{gameId}/tags")
    public Result<Void> addTags(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestBody List<Long> tagIds) {
        log.info("为游戏添加标签。GameId: {}, TagIds: {}", gameId, tagIds);
        gameManagementService.addTags(gameId, tagIds);
        return Result.success();
    }

    @Operation(summary = "移除游戏标签")
    @DeleteMapping("/{gameId}/tags/{tagId}")
    public Result<Void> removeTag(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "标签 ID") @PathVariable Long tagId) {
        log.info("移除游戏标签。GameId: {}, TagId: {}", gameId, tagId);
        gameManagementService.removeTag(gameId, tagId);
        return Result.success();
    }

    @Operation(summary = "获取游戏标签列表")
    @GetMapping("/{gameId}/tags")
    public Result<List<Object>> listGameTags(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId) {
        return Result.success(gameManagementService.listGameTags(gameId));
    }

    // ========== 资源管理 ==========

    @Operation(summary = "上传游戏资源")
    @PostMapping("/{gameId}/resources")
    public Result<Object> uploadResource(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "资源类型") @RequestParam String resourceType,
            @Parameter(description = "资源键名") @RequestParam String resourceKey,
            @Parameter(description = "文件") @RequestParam MultipartFile file) {
        log.info("上传资源。GameId: {}, Type: {}, Key: {}, Size: {}", gameId, resourceType, resourceKey, file.getSize());
        Object result = gameManagementService.uploadResource(gameId, resourceType, resourceKey, file);
        return Result.success(result);
    }

    @Operation(summary = "获取游戏资源列表")
    @GetMapping("/{gameId}/resources")
    public Result<List<Object>> listResources(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId) {
        return Result.success(gameManagementService.listResources(gameId));
    }

    @Operation(summary = "删除游戏资源")
    @DeleteMapping("/{gameId}/resources/{resourceKey}")
    public Result<Void> deleteResource(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "资源键名") @PathVariable String resourceKey) {
        log.info("删除资源。GameId: {}, ResourceKey: {}", gameId, resourceKey);
        gameManagementService.deleteResource(gameId, resourceKey);
        return Result.success();
    }

    // ========== 批量操作 ==========

    @Operation(summary = "批量上架游戏")
    @PostMapping("/batch-publish")
    public Result<Void> batchPublish(
            @RequestBody List<Long> gameIds) {
        log.info("批量上架游戏。Count: {}", gameIds.size());
        gameManagementService.batchPublish(gameIds);
        return Result.success();
    }

    @Operation(summary = "批量下架游戏")
    @PostMapping("/batch-unpublish")
    public Result<Void> batchUnpublish(
            @RequestBody List<Long> gameIds,
            @Parameter(description = "下架原因") @RequestParam(required = false) String reason) {
        log.info("批量下架游戏。Count: {}, Reason: {}", gameIds.size(), reason);
        gameManagementService.batchUnpublish(gameIds, reason);
        return Result.success();
    }

    @Operation(summary = "批量删除游戏")
    @DeleteMapping("/batch-delete")
    public Result<Void> batchDelete(
            @RequestBody List<Long> gameIds) {
        log.info("批量删除游戏。Count: {}", gameIds.size());
        gameManagementService.batchDelete(gameIds);
        return Result.success();
    }

    // ========== 数据统计 ==========

    @Operation(summary = "获取游戏详细统计")
    @GetMapping("/{gameId}/statistics")
    public Result<GameStatisticsDTO> getGameStatistics(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "开始日期") @RequestParam LocalDate startDate,
            @Parameter(description = "结束日期") @RequestParam LocalDate endDate) {
        log.info("查询游戏统计。GameId: {}, StartDate: {}, EndDate: {}", gameId, startDate, endDate);
        GameStatisticsDTO result = gameManagementService.getGameStatistics(gameId, startDate, endDate);
        return Result.success(result);
    }

    @Operation(summary = "获取游戏趋势数据")
    @GetMapping("/{gameId}/trends")
    public Result<Object> getGameTrends(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "天数") @RequestParam Integer days) {
        log.info("查询游戏趋势。GameId: {}, Days: {}", gameId, days);
        Object result = gameManagementService.getGameTrends(gameId, days);
        return Result.success(result);
    }

    @Operation(summary = "导出游戏数据")
    @PostMapping("/{gameId}/export")
    public Result<byte[]> exportGameData(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestBody Object dto) {
        log.info("导出游戏数据。GameId: {}", gameId);
        byte[] data = gameManagementService.exportGameData(gameId, dto);
        return Result.success(data);
    }
}
