package com.kidgame.service;

import com.kidgame.service.util.LeaderboardUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 排行榜服务
 */
@Slf4j
@Service
public class LeaderboardService {

    @Autowired
    private LeaderboardUtil leaderboardUtil;

    /**
     * 提交游戏分数
     *
     * @param userId  用户ID
     * @param gameId  游戏ID
     * @param score   分数
     * @return 结果
     */
    public Map<String, Object> submitScore(Long userId, Long gameId, Integer score) {
        Map<String, Object> result = new HashMap<>();

        boolean success = leaderboardUtil.updateScore(userId, gameId, score);
        result.put("success", success);

        if (success) {
            // 获取更新后的用户排名
            Map<String, Object> rankInfo = leaderboardUtil.getUserRank(userId, gameId, "SCORE");
            result.put("rank", rankInfo != null ? rankInfo.get("userRank") : null);
            result.put("bestScore", score);
        } else {
            result.put("rank", null);
            result.put("bestScore", null);
        }

        return result;
    }

    /**
     * 提交游戏数据（自定义维度）
     */
    public boolean submitData(Long userId, Long gameId, String dimensionCode, Long value, boolean isMax) {
        return leaderboardUtil.updateData(userId, gameId, dimensionCode, value, isMax);
    }

    /**
     * 获取排行榜 TOP N
     *
     * @param gameId    游戏ID
     * @param rankType  排行类型：ALL/DAILY/MONTHLY/YEARLY
     * @param limit     返回数量
     * @return 排行榜列表
     */
    public List<Map<String, Object>> getTopList(Long gameId, String rankType, int limit) {
        return getTopList(gameId, "SCORE", rankType, null, limit);
    }

    /**
     * 获取排行榜 TOP N（指定维度）
     */
    public List<Map<String, Object>> getTopList(Long gameId, String dimensionCode, String rankType,
                                                 String rankDate, int limit) {
        return leaderboardUtil.getTopList(gameId, dimensionCode, rankType, rankDate, limit);
    }

    /**
     * 获取日榜
     */
    public List<Map<String, Object>> getDailyTop(Long gameId, int limit) {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        return leaderboardUtil.getTopList(gameId, "SCORE", "DAILY", today, limit);
    }

    /**
     * 获取月榜
     */
    public List<Map<String, Object>> getMonthlyTop(Long gameId, int limit) {
        return leaderboardUtil.getTopList(gameId, "SCORE", "MONTHLY", null, limit);
    }

    /**
     * 获取年榜
     */
    public List<Map<String, Object>> getYearlyTop(Long gameId, int limit) {
        return leaderboardUtil.getTopList(gameId, "SCORE", "YEARLY", null, limit);
    }

    /**
     * 获取总榜
     */
    public List<Map<String, Object>> getAllTimeTop(Long gameId, int limit) {
        return leaderboardUtil.getTopList(gameId, "SCORE", "ALL", null, limit);
    }

    /**
     * 获取用户排名信息
     */
    public Map<String, Object> getUserRank(Long userId, Long gameId) {
        return leaderboardUtil.getUserRank(userId, gameId, "SCORE");
    }
}
