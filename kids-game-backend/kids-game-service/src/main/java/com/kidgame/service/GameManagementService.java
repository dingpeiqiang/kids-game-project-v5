package com.kidgame.service;

import com.kidgame.service.dto.admin.*;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

/**
 * 游戏管理服务接口（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
public interface GameManagementService {

    // ========== 游戏 CRUD ==========

    /**
     * 创建游戏
     *
     * @param dto 游戏创建信息
     * @param operatorId 操作人 ID
     * @return 游戏信息
     */
    GameManagementCreateDTO createGame(GameManagementCreateDTO dto, Long operatorId);

    /**
     * 更新游戏
     *
     * @param gameId 游戏 ID
     * @param dto 游戏更新信息
     * @param operatorId 操作人 ID
     */
    void updateGame(Long gameId, GameManagementUpdateDTO dto, Long operatorId);

    /**
     * 删除游戏
     *
     * @param gameId 游戏 ID
     * @param operatorId 操作人 ID
     */
    void deleteGame(Long gameId, Long operatorId);

    /**
     * 获取游戏列表（分页）
     *
     * @param query 查询条件
     * @return 游戏列表
     */
    Page<GameManagementQueryDTO> listGames(GameManagementQueryDTO query);

    /**
     * 获取游戏详情
     *
     * @param gameId 游戏 ID
     * @return 游戏详情
     */
    GameManagementQueryDTO getGameDetail(Long gameId);

    // ========== 上下架管理 ==========

    /**
     * 上架游戏
     *
     * @param gameId 游戏 ID
     * @param version 版本号
     * @param operatorId 操作人 ID
     */
    void publishGame(Long gameId, String version, Long operatorId);

    /**
     * 下架游戏
     *
     * @param gameId 游戏 ID
     * @param reason 下架原因
     * @param operatorId 操作人 ID
     */
    void unpublishGame(Long gameId, String reason, Long operatorId);

    // ========== 审核管理 ==========

    /**
     * 提交审核
     *
     * @param gameId 游戏 ID
     * @param operatorId 操作人 ID
     */
    void submitReview(Long gameId, Long operatorId);

    /**
     * 审核游戏
     *
     * @param gameId 游戏 ID
     * @param dto 审核信息
     * @param operatorId 操作人 ID
     */
    void reviewGame(Long gameId, GameReviewDTO dto, Long operatorId);

    /**
     * 获取待审核游戏列表
     *
     * @param pageable 分页参数
     * @return 待审核游戏列表
     */
    Page<GameManagementQueryDTO> listPendingReviewGames(org.springframework.data.domain.Pageable pageable);

    // ========== 版本管理 ==========

    /**
     * 发布新版本
     *
     * @param gameId 游戏 ID
     * @param dto 版本信息
     * @param operatorId 操作人 ID
     * @return 版本信息
     */
    GameVersionCreateDTO publishVersion(Long gameId, GameVersionCreateDTO dto, Long operatorId);

    /**
     * 获取版本历史
     *
     * @param gameId 游戏 ID
     * @return 版本列表
     */
    List<GameVersionCreateDTO> listVersions(Long gameId);

    /**
     * 回滚到指定版本
     *
     * @param gameId 游戏 ID
     * @param versionId 版本 ID
     * @param operatorId 操作人 ID
     */
    void rollbackVersion(Long gameId, Long versionId, Long operatorId);

    // ========== 标签管理 ==========

    /**
     * 为游戏添加标签
     *
     * @param gameId 游戏 ID
     * @param tagIds 标签 ID 列表
     */
    void addTags(Long gameId, List<Long> tagIds);

    /**
     * 移除游戏标签
     *
     * @param gameId 游戏 ID
     * @param tagId 标签 ID
     */
    void removeTag(Long gameId, Long tagId);

    /**
     * 获取游戏标签列表
     *
     * @param gameId 游戏 ID
     * @return 标签列表
     */
    List<Object> listGameTags(Long gameId);

    // ========== 资源管理 ==========

    /**
     * 上传游戏资源
     *
     * @param gameId 游戏 ID
     * @param type 资源类型
     * @param key 资源键名
     * @param file 文件
     * @return 资源信息
     */
    Object uploadResource(Long gameId, String type, String key, org.springframework.web.multipart.MultipartFile file);

    /**
     * 获取游戏资源列表
     *
     * @param gameId 游戏 ID
     * @return 资源列表
     */
    List<Object> listResources(Long gameId);

    /**
     * 删除游戏资源
     *
     * @param gameId 游戏 ID
     * @param resourceKey 资源键名
     */
    void deleteResource(Long gameId, String resourceKey);

    // ========== 批量操作 ==========

    /**
     * 批量上架游戏
     *
     * @param gameIds 游戏 ID 列表
     */
    void batchPublish(List<Long> gameIds);

    /**
     * 批量下架游戏
     *
     * @param gameIds 游戏 ID 列表
     * @param reason 下架原因
     */
    void batchUnpublish(List<Long> gameIds, String reason);

    /**
     * 批量删除游戏
     *
     * @param gameIds 游戏 ID 列表
     */
    void batchDelete(List<Long> gameIds);

    // ========== 数据统计 ==========

    /**
     * 获取游戏详细统计
     *
     * @param gameId 游戏 ID
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 统计数据
     */
    GameStatisticsDTO getGameStatistics(Long gameId, LocalDate startDate, LocalDate endDate);

    /**
     * 获取游戏趋势数据
     *
     * @param gameId 游戏 ID
     * @param days 天数
     * @return 趋势数据
     */
    Object getGameTrends(Long gameId, Integer days);

    /**
     * 导出游戏数据
     *
     * @param gameId 游戏 ID
     * @param dto 导出配置
     * @return Excel 文件字节数组
     */
    byte[] exportGameData(Long gameId, Object dto);

    // ========== 定时任务 ==========

    /**
     * 计算每日统计数据
     */
    void calculateDailyStatistics();

    /**
     * 计算留存率
     */
    void calculateRetentionRate();
}
