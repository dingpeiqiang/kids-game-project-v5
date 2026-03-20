package com.kidgame.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.dao.entity.CreatorEarnings;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.ThemeInfo;
import com.kidgame.dao.entity.ThemePurchase;
import com.kidgame.service.dto.ThemeUploadDTO;

import java.util.List;

/**
 * 主题业务服务
 */
public interface ThemeService {

    /**
     * 获取主题列表（分页）
     * @param ownerType 所有者类型筛选（GAME-游戏主题/APPLICATION-应用主题）
     * @param ownerId 所有者 ID（仅当 ownerType=GAME 时有效，指定游戏 ID）
     * @param status 状态筛选（可选）
     * @param page 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    Page<ThemeInfo> listThemes(String ownerType, Long ownerId, String status, Integer page, Integer pageSize);

    /**
     * 获取游戏主题列表（分页，带关系信息）
     * @param gameId 游戏 ID
     * @param gameCode 游戏代码
     * @param status 状态筛选（可选）
     * @param page 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    Page<ThemeInfo> listGameThemes(Long gameId, String gameCode, String status, Integer page, Integer pageSize);

    /**
     * 获取主题关联的游戏 ID 列表
     * @param themeId 主题 ID
     * @return 游戏 ID 列表
     */
    List<Long> getThemeGames(Long themeId);

    /**
     * 获取主题所有者 ID
     * @param themeId 主题 ID
     * @return 所有者 ID(游戏 ID 或应用 ID)
     */
    Long getThemeOwner(Long themeId);

    /**
     * 获取主题详情
     * @param themeId 主题 ID
     * @return 主题信息
     */
    ThemeInfo getThemeDetail(Long themeId);

    /**
     * 上传主题
     * @param authorId 作者 ID
     * @param themeData 主题数据
     * @return 上传后的主题信息
     */
    ThemeInfo uploadTheme(Long authorId, ThemeUploadDTO themeData);

    /**
     * 购买主题
     * @param themeId 主题 ID
     * @param buyerId 购买者 ID
     * @return 购买记录
     */
    ThemePurchase purchaseTheme(Long themeId, Long buyerId);

    /**
     * 下载主题（检查是否已购买）
     * @param themeId 主题 ID
     * @param userId 用户 ID
     * @return 主题配置 JSON
     */
    String downloadTheme(Long themeId, Long userId);

    /**
     * 获取我的主题列表
     * @param authorId 作者 ID
     * @return 主题列表
     */
    List<ThemeInfo> getMyThemes(Long authorId);

    /**
     * 获取创作者收益
     * @param creatorId 创作者 ID
     * @return 收益记录列表
     */
    List<CreatorEarnings> getEarnings(Long creatorId);

    /**
     * 切换上架状态
     * @param themeId 主题 ID
     * @param onSale 是否上架
     * @return 更新后的主题信息
     */
    ThemeInfo toggleSaleStatus(Long themeId, Boolean onSale);

    /**
     * 提现收益
     * @param creatorId 创作者 ID
     * @param amount 提现金额
     * @return 是否成功
     */
    boolean withdrawEarnings(Long creatorId, Integer amount);

    /**
     * 检查用户是否已购买主题
     * @param themeId 主题 ID
     * @param userId 用户 ID
     * @return 是否已购买
     */
    boolean hasPurchased(Long themeId, Long userId);

    /**
     * 获取创作者总收益
     * @param creatorId 创作者 ID
     * @return 总收益金额
     */
    Integer getTotalEarnings(Long creatorId);

    /**
     * 获取可提现收益
     * @param creatorId 创作者 ID
     * @return 可提现金额
     */
    Integer getWithdrawableEarnings(Long creatorId);

    /**
     * 根据ID获取游戏信息
     * @param gameId 游戏ID
     * @return 游戏信息
     */
    Game getGameById(Long gameId);

    /**
     * 根据游戏代码获取游戏信息
     * @param gameCode 游戏代码
     * @return 游戏信息
     */
    Game getGameByCode(String gameCode);
}
