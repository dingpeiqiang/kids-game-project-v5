package com.kidgame.web.util;

import com.kidgame.dao.entity.LeaderboardData;
import com.kidgame.dao.mapper.LeaderboardDataMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 排行榜工具类
 * 用于更新游戏排行榜数据
 */
@Slf4j
@Component
public class LeaderboardUtil {

    @Autowired
    private LeaderboardDataMapper leaderboardDataMapper;

    /**
     * 更新排行榜分数（取最大值）
     */
    public static void updateScore(Long userId, Long gameId, Integer score) {
        // 注意：这里需要在 Spring 上下文中获取 LeaderboardDataMapper 实例
        // 由于静态方法无法直接注入依赖，需要通过 ApplicationContext 获取
        // 为简化，这里暂时不做实现，后续可以改为非静态方法
        log.info("[Leaderboard] 更新排行榜分数: userId={}, gameId={}, score={}", userId, gameId, score);
    }

    /**
     * 更新排行榜数据（自定义维度）
     */
    public static void updateData(Long userId, Long gameId, String dimensionCode, Long value, boolean isMax) {
        log.info("[Leaderboard] 更新排行榜数据: userId={}, gameId={}, dimensionCode={}, value={}, isMax={}",
                userId, gameId, dimensionCode, value, isMax);
    }
}
