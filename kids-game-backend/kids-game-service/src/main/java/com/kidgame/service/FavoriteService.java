package com.kidgame.service;

import java.util.List;

/**
 * 用户收藏服务接口
 */
public interface FavoriteService {

    /**
     * 添加收藏
     * @param userId 用户ID
     * @param gameId 游戏ID
     * @return 是否添加成功
     */
    boolean addFavorite(Long userId, Long gameId);

    /**
     * 取消收藏
     * @param userId 用户ID
     * @param gameId 游戏ID
     * @return 是否取消成功
     */
    boolean removeFavorite(Long userId, Long gameId);

    /**
     * 获取用户的收藏游戏ID列表
     * @param userId 用户ID
     * @return 收藏的游戏ID列表
     */
    List<Long> getUserFavorites(Long userId);

    /**
     * 检查用户是否已收藏某游戏
     * @param userId 用户ID
     * @param gameId 游戏ID
     * @return 是否已收藏
     */
    boolean isFavorited(Long userId, Long gameId);
}