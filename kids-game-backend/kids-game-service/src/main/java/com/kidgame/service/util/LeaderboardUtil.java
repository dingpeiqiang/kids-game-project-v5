package com.kidgame.service.util;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.LeaderboardData;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.LeaderboardDataMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 排行榜工具类
 * 用于更新游戏排行榜数据
 */
@Slf4j
@Component
public class LeaderboardUtil {

    @Autowired
    private LeaderboardDataMapper leaderboardDataMapper;

    @Autowired
    private BaseUserMapper baseUserMapper;

    /**
     * 更新排行榜分数（取最大值）
     * 同时更新总榜、日榜、月榜
     *
     * @param userId  用户ID
     * @param gameId  游戏ID
     * @param score   分数
     * @return 是否更新成功
     */
    public boolean updateScore(Long userId, Long gameId, Integer score) {
        try {
            // 获取用户信息
            BaseUser user = baseUserMapper.selectById(userId);
            if (user == null) {
                log.warn("[Leaderboard] 用户不存在: userId={}", userId);
                return false;
            }

            long now = System.currentTimeMillis();
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE); // YYYY-MM-DD
            String thisMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")); // YYYY-MM
            String thisYear = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy")); // YYYY

            // 1. 更新总榜
            upsertData(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    "SCORE", score.longValue(), null, "ALL", null, null, null, now);

            // 2. 更新日榜
            upsertData(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    "SCORE", score.longValue(), null, "DAILY", today, null, null, now);

            // 3. 更新月榜
            upsertData(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    "SCORE", score.longValue(), null, "MONTHLY", null, thisMonth, null, now);

            // 4. 更新年榜
            upsertData(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    "SCORE", score.longValue(), null, "YEARLY", null, null, thisYear, now);

            log.info("[Leaderboard] 分数更新成功: userId={}, gameId={}, score={}", userId, gameId, score);
            return true;
        } catch (Exception e) {
            log.error("[Leaderboard] 分数更新失败: userId={}, gameId={}, score={}", userId, gameId, score, e);
            return false;
        }
    }

    /**
     * 更新排行榜数据（自定义维度，取最大值）
     */
    public boolean updateData(Long userId, Long gameId, String dimensionCode, Long value) {
        return updateData(userId, gameId, dimensionCode, value, true);
    }

    /**
     * 更新排行榜数据（自定义维度，支持最大/最小值选择）
     *
     * @param userId      用户ID
     * @param gameId      游戏ID
     * @param dimensionCode 维度代码
     * @param value       数值
     * @param isMax       true=取最大值，false=取最小值
     * @return 是否更新成功
     */
    public boolean updateData(Long userId, Long gameId, String dimensionCode, Long value, boolean isMax) {
        try {
            BaseUser user = baseUserMapper.selectById(userId);
            if (user == null) {
                log.warn("[Leaderboard] 用户不存在: userId={}", userId);
                return false;
            }

            long now = System.currentTimeMillis();
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String thisMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            String thisYear = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy"));

            // 更新总榜、日榜、月榜、年榜
            upsertDataWithStrategy(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    dimensionCode, value, null, "ALL", null, null, null, now, isMax);
            upsertDataWithStrategy(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    dimensionCode, value, null, "DAILY", today, null, null, now, isMax);
            upsertDataWithStrategy(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    dimensionCode, value, null, "MONTHLY", null, thisMonth, null, now, isMax);
            upsertDataWithStrategy(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    dimensionCode, value, null, "YEARLY", null, null, thisYear, now, isMax);

            log.info("[Leaderboard] 数据更新成功: userId={}, gameId={}, dimensionCode={}, value={}, isMax={}",
                    userId, gameId, dimensionCode, value, isMax);
            return true;
        } catch (Exception e) {
            log.error("[Leaderboard] 数据更新失败: userId={}, gameId={}, dimensionCode={}",
                    userId, gameId, dimensionCode, e);
            return false;
        }
    }

    /**
     * 更新排行榜数据（自定义维度，完全参数版本）
     */
    public boolean updateData(Long userId, Long gameId, String dimensionCode, Long value,
                              String rankType, String rankDate, String rankMonth, String rankYear) {
        return updateData(userId, gameId, dimensionCode, value, rankType, rankDate, rankMonth, rankYear, true);
    }

    /**
     * 更新排行榜数据（自定义维度，完全参数版本，支持最大/最小值选择）
     */
    public boolean updateData(Long userId, Long gameId, String dimensionCode, Long value,
                              String rankType, String rankDate, String rankMonth, String rankYear, boolean isMax) {
        try {
            BaseUser user = baseUserMapper.selectById(userId);
            if (user == null) {
                log.warn("[Leaderboard] 用户不存在: userId={}", userId);
                return false;
            }
            return upsertDataWithStrategy(userId, gameId, user.getUsername(), user.getNickname(), user.getAvatar(),
                    dimensionCode, value, null, rankType, rankDate, rankMonth, rankYear,
                    System.currentTimeMillis(), isMax);
        } catch (Exception e) {
            log.error("[Leaderboard] 数据更新失败: userId={}, gameId={}", userId, gameId, e);
            return false;
        }
    }

    /**
     * 内部方法：执行 upsert 操作（取最大值）
     */
    private boolean upsertData(Long userId, Long gameId, String username, String nickname, String avatar,
                               String dimensionCode, Long dimensionValue, java.math.BigDecimal decimalValue,
                               String rankType, String rankDate, String rankMonth, String rankYear,
                               long timestamp) {
        return upsertDataWithStrategy(userId, gameId, username, nickname, avatar,
                dimensionCode, dimensionValue, decimalValue,
                rankType, rankDate, rankMonth, rankYear, timestamp, true);
    }

    /**
     * 内部方法：执行 upsert 操作（支持最大/最小值策略）
     *
     * @param isMax true=取最大值，false=取最小值
     */
    private boolean upsertDataWithStrategy(Long userId, Long gameId, String username, String nickname, String avatar,
                                           String dimensionCode, Long dimensionValue, java.math.BigDecimal decimalValue,
                                           String rankType, String rankDate, String rankMonth, String rankYear,
                                           long timestamp, boolean isMax) {
        // 先查询是否存在记录
        LambdaQueryWrapper<LeaderboardData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeaderboardData::getUserId, userId)
                .eq(LeaderboardData::getGameId, gameId)
                .eq(LeaderboardData::getDimensionCode, dimensionCode)
                .eq(LeaderboardData::getRankType, rankType)
                .eq(rankDate != null, LeaderboardData::getRankDate, rankDate)
                .eq(rankMonth != null, LeaderboardData::getRankMonth, rankMonth)
                .eq(rankYear != null, LeaderboardData::getRankYear, rankYear)
                .eq(LeaderboardData::getDeleted, 0);

        LeaderboardData existing = leaderboardDataMapper.selectOne(wrapper);

        if (existing != null) {
            // 更新：根据策略判断是否需要更新
            boolean shouldUpdate;
            if (isMax) {
                // 取最大值：只有新值更大时才更新
                shouldUpdate = dimensionValue > existing.getDimensionValue();
            } else {
                // 取最小值：只有新值更小时才更新
                shouldUpdate = dimensionValue < existing.getDimensionValue();
            }

            if (shouldUpdate) {
                existing.setDimensionValue(dimensionValue);
                if (decimalValue != null) {
                    existing.setDecimalValue(decimalValue);
                }
                existing.setUpdateTime(timestamp);
                leaderboardDataMapper.updateById(existing);
                log.debug("[Leaderboard] 更新记录: dataId={}, dimensionValue={}, strategy={}",
                        existing.getDataId(), dimensionValue, isMax ? "MAX" : "MIN");
            }
        } else {
            // 插入新记录
            LeaderboardData data = new LeaderboardData();
            data.setGameId(gameId);
            data.setUserId(userId);
            data.setUsername(username);
            data.setNickname(nickname);
            data.setAvatarUrl(avatar);
            data.setDimensionCode(dimensionCode);
            data.setDimensionValue(dimensionValue);
            data.setDecimalValue(decimalValue);
            data.setRankType(rankType);
            data.setRankDate(rankDate);
            data.setRankMonth(rankMonth);
            data.setRankYear(rankYear);
            data.setCreateTime(timestamp);
            data.setUpdateTime(timestamp);
            leaderboardDataMapper.insert(data);
            log.debug("[Leaderboard] 新增记录: userId={}, dimensionValue={}, strategy={}",
                    userId, dimensionValue, isMax ? "MAX" : "MIN");
        }
        return true;
    }

    /**
     * 获取排行榜 TOP N
     *
     * @param gameId         游戏ID
     * @param dimensionCode  维度代码，默认 SCORE
     * @param rankType       排行类型：ALL/DAILY/MONTHLY/YEARLY
     * @param rankDate       日榜日期（YYYY-MM-DD）
     * @param limit          返回数量
     * @return 排行榜列表
     */
    public List<Map<String, Object>> getTopList(Long gameId, String dimensionCode, String rankType,
                                                 String rankDate, int limit) {
        return leaderboardDataMapper.selectLeaderboardWithRank(
                gameId, dimensionCode, rankType, rankDate, null, null, limit
        );
    }

    /**
     * 获取用户排名
     */
    public Map<String, Object> getUserRank(Long userId, Long gameId, String dimensionCode) {
        return leaderboardDataMapper.selectUserBestRank(userId, gameId, dimensionCode);
    }

    /**
     * 根据用户名获取用户
     */
    public BaseUser getUserByUsername(String username) {
        LambdaQueryWrapper<BaseUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BaseUser::getUsername, username);
        return baseUserMapper.selectOne(wrapper);
    }
}
