package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.kidgame.dao.entity.DailyStats;
import com.kidgame.dao.entity.GameRecord;
import com.kidgame.dao.entity.Kid;
import com.kidgame.dao.mapper.AnswerRecordMapper;
import com.kidgame.dao.mapper.DailyStatsMapper;
import com.kidgame.dao.mapper.GameRecordMapper;
import com.kidgame.dao.mapper.KidMapper;
import com.kidgame.service.StatsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 统计服务实现
 */
@Slf4j
@Service
public class StatsServiceImpl implements StatsService {

    @Autowired
    private DailyStatsMapper dailyStatsMapper;

    @Autowired
    private GameRecordMapper gameRecordMapper;

    @Autowired
    private AnswerRecordMapper answerRecordMapper;

    @Autowired
    private KidMapper kidMapper;

    @Override
    public DailyStats getDailyStats(LocalDate statDate) {
        DailyStats stats = dailyStatsMapper.selectByStatDate(statDate);
        if (stats == null) {
            stats = new DailyStats();
            stats.setStatDate(statDate);
            stats.setTotalUsers(0);
            stats.setActiveUsers(0);
            stats.setNewUsers(0);
            stats.setTotalGameDuration(0L);
            stats.setTotalGameCount(0);
            stats.setTotalAnswerCount(0);
            stats.setCorrectAnswerCount(0);
            stats.setTotalFatiguePoints(0);
            stats.setTotalConsumedPoints(0);
            stats.setCreateTime(System.currentTimeMillis());
            stats.setUpdateTime(System.currentTimeMillis());
            dailyStatsMapper.insert(stats);
        }
        return stats;
    }

    @Override
    public DailyStats getTodayStats() {
        return getDailyStats(LocalDate.now());
    }

    @Override
    public void incrementGameDuration(int minutes) {
        DailyStats stats = getTodayStats();
        stats.setTotalGameDuration(stats.getTotalGameDuration() + minutes);
        stats.setUpdateTime(System.currentTimeMillis());
        dailyStatsMapper.updateById(stats);
        log.info("游戏时长统计：增加{}分钟，总时长：{}分钟", minutes, stats.getTotalGameDuration());
    }

    @Override
    public void incrementGameCount() {
        DailyStats stats = getTodayStats();
        stats.setTotalGameCount(stats.getTotalGameCount() + 1);
        stats.setUpdateTime(System.currentTimeMillis());
        dailyStatsMapper.updateById(stats);
        log.info("游戏次数统计：总次数：{}", stats.getTotalGameCount());
    }

    @Override
    public void incrementAnswerStats(boolean isCorrect) {
        DailyStats stats = getTodayStats();
        stats.setTotalAnswerCount(stats.getTotalAnswerCount() + 1);
        if (isCorrect) {
            stats.setCorrectAnswerCount(stats.getCorrectAnswerCount() + 1);
        }
        stats.setUpdateTime(System.currentTimeMillis());
        dailyStatsMapper.updateById(stats);
        log.info("答题统计：总答题数：{}, 正确数：{}", stats.getTotalAnswerCount(), stats.getCorrectAnswerCount());
    }

    @Override
    public void recordFatiguePointsGranted(int points) {
        DailyStats stats = getTodayStats();
        stats.setTotalFatiguePoints(stats.getTotalFatiguePoints() + points);
        stats.setUpdateTime(System.currentTimeMillis());
        dailyStatsMapper.updateById(stats);
        log.info("游学币发放：增加{}点，总发放：{}点", points, stats.getTotalFatiguePoints());
    }

    @Override
    public void recordFatiguePointsConsumed(int points) {
        DailyStats stats = getTodayStats();
        stats.setTotalConsumedPoints(stats.getTotalConsumedPoints() + points);
        stats.setUpdateTime(System.currentTimeMillis());
        dailyStatsMapper.updateById(stats);
        log.info("游学币消耗：消耗{}点，总消耗：{}点", points, stats.getTotalConsumedPoints());
    }

    @Override
    public void summarizeYesterdayStats() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("开始汇总昨日统计数据：{}", yesterday);

        DailyStats stats = getDailyStats(yesterday);

        // 统计总用户数
        QueryWrapper<Kid> kidQuery = new QueryWrapper<>();
        kidQuery.le("create_time", yesterday.atTime(23, 59, 59));
        int totalUsers = kidMapper.selectCount(kidQuery).intValue();
        stats.setTotalUsers(totalUsers);

        // 统计昨日活跃用户（有游戏记录的用户）
        QueryWrapper<GameRecord> activeQuery = new QueryWrapper<>();
        activeQuery.select("DISTINCT user_id");
        activeQuery.ge("create_time", yesterday.atStartOfDay());
        activeQuery.le("create_time", yesterday.atTime(23, 59, 59));
        int activeUsers = gameRecordMapper.selectCount(activeQuery).intValue();
        stats.setActiveUsers(activeUsers);

        // 统计昨日新增用户
        QueryWrapper<Kid> newKidQuery = new QueryWrapper<>();
        newKidQuery.ge("create_time", yesterday.atStartOfDay());
        newKidQuery.le("create_time", yesterday.atTime(23, 59, 59));
        int newUsers = kidMapper.selectCount(newKidQuery).intValue();
        stats.setNewUsers(newUsers);

        // 统计总游戏时长和次数
        // 使用原生SQL查询
        Map<String, Object> gameStats = gameRecordMapper.selectGameStatsByDate(yesterday);
        if (gameStats != null) {
            Object durationObj = gameStats.get("totalDuration");
            Object countObj = gameStats.get("totalCount");
            stats.setTotalGameDuration(durationObj != null ? ((Number) durationObj).longValue() : 0L);
            stats.setTotalGameCount(countObj != null ? ((Number) countObj).intValue() : 0);
        }

        // 统计答题数据
        Map<String, Object> answerStats = answerRecordMapper.selectAnswerStatsByDate(yesterday);
        if (answerStats != null) {
            Object totalObj = answerStats.get("totalCount");
            Object correctObj = answerStats.get("correctCount");
            stats.setTotalAnswerCount(totalObj != null ? ((Number) totalObj).intValue() : 0);
            stats.setCorrectAnswerCount(correctObj != null ? ((Number) correctObj).intValue() : 0);
        }

        stats.setUpdateTime(System.currentTimeMillis());
        dailyStatsMapper.updateById(stats);

        log.info("昨日统计数据汇总完成：总用户={}, 活跃用户={}, 新增用户={}, 游戏时长={}分钟，游戏次数={}, 答题数={}, 正确数={}",
                stats.getTotalUsers(), stats.getActiveUsers(), stats.getNewUsers(),
                stats.getTotalGameDuration(), stats.getTotalGameCount(),
                stats.getTotalAnswerCount(), stats.getCorrectAnswerCount());
    }

    @Override
    public List<DailyStats> getRecentStats(int days) {
        LocalDate startDate = LocalDate.now().minusDays(days);
        return dailyStatsMapper.selectRecentStats(startDate);
    }

    @Override
    public Map<String, Object> getKidGameStats(Long kidId) {
        Map<String, Object> result = new HashMap<>();

        // 今日游戏次数
        QueryWrapper<GameRecord> todayQuery = new QueryWrapper<>();
        todayQuery.eq("user_id", kidId);
        todayQuery.ge("create_time", LocalDate.now().atStartOfDay());
        int todayGameCount = gameRecordMapper.selectCount(todayQuery).intValue();
        result.put("todayGameCount", todayGameCount);

        // 今日游戏时长
        Map<String, Object> todayDuration = gameRecordMapper.selectDurationByKidAndDate(kidId, LocalDate.now());
        result.put("todayDuration", todayDuration != null ? todayDuration.get("duration") : 0);

        // 总游戏次数
        QueryWrapper<GameRecord> totalQuery = new QueryWrapper<>();
        totalQuery.eq("user_id", kidId);
        int totalGameCount = gameRecordMapper.selectCount(totalQuery).intValue();
        result.put("totalGameCount", totalGameCount);

        // 总游戏时长
        Map<String, Object> totalDuration = gameRecordMapper.selectTotalDurationByKid(kidId);
        result.put("totalDuration", totalDuration != null ? totalDuration.get("duration") : 0);

        return result;
    }

    @Override
    public Map<String, Object> getKidAnswerStats(Long kidId) {
        Map<String, Object> result = new HashMap<>();

        // 今日答题统计
        Map<String, Object> todayStats = answerRecordMapper.selectStatsByKidAndDate(kidId, LocalDate.now());
        result.put("todayAnswerCount", todayStats != null ? todayStats.get("totalCount") : 0);
        result.put("todayCorrectCount", todayStats != null ? todayStats.get("correctCount") : 0);

        // 总答题统计
        Map<String, Object> totalStats = answerRecordMapper.selectTotalStatsByKid(kidId);
        result.put("totalAnswerCount", totalStats != null ? totalStats.get("totalCount") : 0);
        result.put("totalCorrectCount", totalStats != null ? totalStats.get("correctCount") : 0);

        return result;
    }
}
