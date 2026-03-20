package com.kidgame.web.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.GameRecord;
import com.kidgame.dao.entity.GameSession;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.GameMapper;
import com.kidgame.dao.mapper.GameRecordMapper;
import com.kidgame.dao.mapper.GameSessionMapper;
import com.kidgame.service.FatiguePointsService;
import com.kidgame.web.request.SubmitGameResultRequest;
import com.kidgame.web.util.LeaderboardUtil;
import com.kidgame.common.util.JsonUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 游戏会话服务
 */
@Slf4j
@Service
public class GameSessionService {

    @Autowired
    private GameSessionMapper gameSessionMapper;

    @Autowired
    private GameMapper gameMapper;

    @Autowired
    private BaseUserMapper userMapper;

    @Autowired
    private FatiguePointsService fatiguePointsService;

    @Autowired
    private GameRecordMapper gameRecordMapper;

    /**
     * 启动游戏会话
     */
    @Transactional(rollbackFor = Exception.class)
    public GameSession startGame(Long userId, Long gameId) {
        // 检查游戏是否存在
        Game game = gameMapper.selectById(gameId);
        if (game == null || game.getStatus() != 1) {
            throw new BusinessException("游戏不存在或已下架");
        }

        // 检查用户疲劳点
        BaseUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        if (user.getFatiguePoints() == null || user.getFatiguePoints() <= 0) {
            throw new BusinessException("疲劳点不足，请休息后再玩");
        }

        log.info("[GameSession] 用户 {} 启动游戏，当前疲劳点: {}", userId, user.getFatiguePoints());

        // 创建会话
        GameSession session = new GameSession();
        session.setUserId(userId);
        session.setGameId(gameId);
        session.setSessionToken(generateSessionToken());
        session.setStatus(1); // 进行中
        session.setStartTime(System.currentTimeMillis());
        session.setCreateTime(System.currentTimeMillis());
        session.setUpdateTime(System.currentTimeMillis());

        gameSessionMapper.insert(session);

        log.info("[GameSession] 创建会话成功，会话ID: {}, 用户ID: {}, 游戏ID: {}",
                session.getSessionId(), userId, gameId);

        return session;
    }

    /**
     * 提交游戏结果
     */
    @Transactional(rollbackFor = Exception.class)
    public void submitResult(String sessionToken, SubmitGameResultRequest result) {
        // 查找会话
        LambdaQueryWrapper<GameSession> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(GameSession::getSessionToken, sessionToken);
        GameSession session = gameSessionMapper.selectOne(queryWrapper);

        if (session == null) {
            throw new BusinessException("会话不存在");
        }

        // 检查会话状态
        if (session.getStatus() == 0) {
            log.warn("[GameSession] 会话已结束，重复提交结果，会话ID: {}", session.getSessionId());
            throw new BusinessException("会话已结束");
        }

        // 更新会话
        session.setEndTime(System.currentTimeMillis());
        session.setDuration(result.getDuration());
        session.setScore(result.getScore());
        
        // 将详细信息存储到 gameData 字段（JSON 格式）
        // 注意：如果 GameSession 实体没有 gameData 字段，这部分可以省略
        // if (result.getDetails() != null) {
        //     session.setGameData(JsonUtil.toJson(result.getDetails()));
        // }
        
        session.setStatus(0); // 已结束
        session.setUpdateTime(System.currentTimeMillis());

        int updated = gameSessionMapper.updateById(session);
        if (updated == 0) {
            throw new BusinessException("更新会话失败");
        }

        // 计算消耗的疲劳点（每分钟1点）
        int consumePoints = (int) Math.ceil(result.getDuration() / 60.0);
        session.setConsumePoints(consumePoints);

        // 扣除用户疲劳点
        BaseUser user = userMapper.selectById(session.getUserId());
        if (user != null) {
            fatiguePointsService.consumeFatiguePoints(
                session.getUserId(),
                user.getUserType(),
                consumePoints,
                session.getSessionId()
            );
        }

        // 更新排行榜
        try {
            LeaderboardUtil.updateScore(session.getUserId(), session.getGameId(), result.getScore());
        } catch (Exception e) {
            log.error("[GameSession] 更新排行榜失败", e);
        }

        // 保存游戏记录
        saveGameRecord(session);

        log.info("[GameSession] 提交结果成功，会话ID: {}, 分数: {}, 时长: {}秒, 消耗疲劳点: {}",
                session.getSessionId(), result.getScore(), result.getDuration(), consumePoints);
    }

    /**
     * 结束会话
     */
    public void endSession(Long sessionId) {
        GameSession session = gameSessionMapper.selectById(sessionId);
        if (session != null && session.getStatus() != 0) {
            session.setStatus(0);
            session.setEndTime(System.currentTimeMillis());
            session.setUpdateTime(System.currentTimeMillis());

            long duration = System.currentTimeMillis() - session.getStartTime();
            session.setDuration(duration / 1000);

            int consumePoints = (int) Math.ceil(session.getDuration() / 60.0);
            session.setConsumePoints(consumePoints);

            // 扣除疲劳点
            BaseUser user = userMapper.selectById(session.getUserId());
            if (user != null) {
                fatiguePointsService.consumeFatiguePoints(
                    session.getUserId(),
                    user.getUserType(),
                    consumePoints,
                    session.getSessionId()
                );
            }

            gameSessionMapper.updateById(session);

            // 保存游戏记录
            saveGameRecord(session);

            log.info("[GameSession] 结束会话成功，会话ID: {}", sessionId);
        }
    }

    /**
     * 根据令牌获取会话
     */
    public GameSession getSessionByToken(String sessionToken) {
        LambdaQueryWrapper<GameSession> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(GameSession::getSessionToken, sessionToken);
        return gameSessionMapper.selectOne(queryWrapper);
    }

    /**
     * 生成会话令牌
     */
    private String generateSessionToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 保存游戏记录
     */
    private void saveGameRecord(GameSession session) {
        try {
            GameRecord record = new GameRecord();
            record.setKidId(session.getUserId());
            record.setGameId(session.getGameId());
            record.setSessionId(session.getSessionId());
            record.setDuration(session.getDuration());
            record.setScore(session.getScore());
            record.setConsumePoints(session.getConsumePoints() != null ? session.getConsumePoints() : 0);
            record.setPlayDate(LocalDate.now().toString());

            gameRecordMapper.insert(record);
            log.info("[GameSession] 保存游戏记录成功，记录ID: {}", record.getRecordId());

        } catch (Exception e) {
            log.error("[GameSession] 保存游戏记录失败", e);
        }
    }
}
