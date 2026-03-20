package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.kidgame.common.constant.GameConstants;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.util.JsonUtil;
import com.kidgame.dao.entity.*;
import com.kidgame.dao.mapper.*;
import com.kidgame.service.GamePermissionService;
import com.kidgame.service.GameService;
import com.kidgame.service.KidService;
import com.kidgame.service.ParentService;
import com.kidgame.service.dto.GameEndDTO;
import com.kidgame.service.dto.GameStartDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 游戏业务服务实现
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Slf4j
@Service
public class GameServiceImpl extends ServiceImpl<GameMapper, Game> implements GameService {

    @Autowired
    protected KidService kidService;

    @Autowired
    private GameSessionMapper gameSessionMapper;

    @Autowired
    private GameRecordMapper gameRecordMapper;

    @Autowired
    private ParentLimitMapper parentLimitMapper;

    @Autowired
    private KidMapper kidMapper;

    @Autowired
    private GamePermissionService gamePermissionService;

    @Autowired
    private ParentService parentService;

    @Override
    public List<Game> getGameListByGrade(String grade) {
        if (grade == null || grade.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "年级参数不能为空");
        }

        LambdaQueryWrapper<Game> wrapper = new LambdaQueryWrapper<>();
        wrapper.apply("FIND_IN_SET({0}, grade)", grade)
                .eq(Game::getStatus, GameConstants.GameStatus.ENABLED)
                .orderByAsc(Game::getSortOrder);

        List<Game> games = list(wrapper);
        log.info("按年级查询游戏列表. Grade: {}, Found: {}", grade, games.size());
        return games;
    }

    @Override
    public List<Game> getGameListByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "分类参数不能为空");
        }

        LambdaQueryWrapper<Game> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Game::getCategory, category)
                .eq(Game::getStatus, GameConstants.GameStatus.ENABLED)
                .orderByAsc(Game::getSortOrder);

        List<Game> games = list(wrapper);
        log.info("按分类查询游戏列表. Category: {}, Found: {}", category, games.size());
        return games;
    }

    @Override
    public Game getGameDetail(Long gameId) {
        return getById(gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long startGame(GameStartDTO dto) {
        // validateGameStart(dto); // 暂时屏蔽验证逻辑
    
        Long sessionId = createGameSession(dto);
        incrementOnlineCount(dto.getGameId());
    
        log.info("游戏启动成功。UserId: {}, GameId: {}, SessionId: {}", dto.getUserId(), dto.getGameId(), sessionId);
        return sessionId;
    }

    /**
     * 验证游戏启动条件（完整版）
     */
    protected void validateGameStart(GameStartDTO dto) {
        // 1. 检查游戏状态
        Game game = getById(dto.getGameId());
        if (game == null || game.getStatus() == GameConstants.GameStatus.DISABLED) {
            throw new BusinessException(ErrorCode.GAME_NOT_FOUND_OBJ);
        }

        // 2. 检查疲劳点（所有用户都要限制）
        Integer fatiguePoints = kidService.getFatiguePoints(dto.getUserId());
        if (fatiguePoints == null || fatiguePoints <= 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_FATIGUE_POINTS_OBJ);
        }
        
        // 3. 检查适龄性（仅儿童，已移除年龄段限制，只要赋权都可以玩）
        // 原逻辑：if (!game.getGrade().equals(kid.getGrade())) {
        //            throw new BusinessException(ErrorCode.GAME_NOT_AGE_APPROPRIATE_OBJ);
        //        }
        
        Kid kid = kidService.getById(dto.getUserId());
        if (kid != null) {
            // 是儿童用户，需要进行额外验证

            // 4. 检查游戏是否被屏蔽
            if (gamePermissionService.isGameBlocked(dto.getUserId(), GamePermission.UserType.KID, dto.getGameId())) {
                throw new BusinessException(ErrorCode.GAME_BLOCKED_BY_PARENT_OBJ);
            }

            // 5. 获取管控配置
            ParentLimit parentLimit = parentService.getParentLimit(dto.getUserId());

            // 6. 检查是否在允许时间段
            if (!isInAllowedTime(parentLimit)) {
                throw new BusinessException(ErrorCode.GAME_TIME_NOT_ALLOWED_OBJ);
            }

            // 7. 检查每日时长是否已用完
            if (isDailyDurationExceeded(dto.getUserId(), parentLimit)) {
                throw new BusinessException(ErrorCode.DAILY_DURATION_EXCEEDED_OBJ);
            }

            log.info("儿童游戏启动验证通过。UserId: {}, GameId: {}, FatiguePoints: {}",
                    dto.getUserId(), dto.getGameId(), fatiguePoints);
        } else {
            // 不是儿童，可能是家长，不需要儿童特有的验证（屏蔽、时间段、时长等）
            log.info("非儿童用户玩游戏，跳过儿童特有验证。UserId: {}, GameId: {}, FatiguePoints: {}",
                    dto.getUserId(), dto.getGameId(), fatiguePoints);
        }
    }

    /**
     * 检查是否在允许时间段
     *
     * @param parentLimit 管控配置
     * @return 是否在允许时间段
     */
    protected boolean isInAllowedTime(ParentLimit parentLimit) {
        if (parentLimit == null) {
            return true;
        }
        try {
            LocalTime now = LocalTime.now();
            LocalTime startTime = LocalTime.parse(parentLimit.getAllowedTimeStart());
            LocalTime endTime = LocalTime.parse(parentLimit.getAllowedTimeEnd());

            return !now.isBefore(startTime) && !now.isAfter(endTime);
        } catch (Exception e) {
            log.error("解析时间段失败. Start: {}, End: {}",
                    parentLimit.getAllowedTimeStart(), parentLimit.getAllowedTimeEnd(), e);
            return true;
        }
    }

    /**
     * 检查每日时长是否已用完
     *
     * @param kidId       儿童ID
     * @param parentLimit 管控配置
     * @return 是否已用完
     */
    protected boolean isDailyDurationExceeded(Long kidId, ParentLimit parentLimit) {
        if (parentLimit == null) {
            return false;
        }
        try {
            long todayDuration = getTodayTotalDuration(kidId);
            long todayDurationMinutes = todayDuration / 60;
            return todayDurationMinutes >= parentLimit.getDailyDuration();
        } catch (Exception e) {
            log.error("查询今日游戏时长失败. KidId: {}", kidId, e);
            return false;
        }
    }

    /**
     * 获取今日总游戏时长（秒）
     *
     * @param kidId 儿童ID
     * @return 时长（秒）
     */
    protected long getTodayTotalDuration(Long kidId) {
        String today = java.time.LocalDate.now().toString();
        LambdaQueryWrapper<GameRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GameRecord::getKidId, kidId)
                .eq(GameRecord::getPlayDate, today);
        List<GameRecord> records = gameRecordMapper.selectList(wrapper);
        return records.stream()
                .mapToLong(GameRecord::getDuration)
                .sum();
    }

    /**
     * 创建游戏会话
     */
    private Long createGameSession(GameStartDTO dto) {
        // 校验必填参数
        if (dto.getUserId() == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND_OBJ);
        }
        if (dto.getGameId() == null) {
            throw new BusinessException(ErrorCode.GAME_NOT_FOUND_OBJ);
        }
        
        long currentTime = System.currentTimeMillis();
        GameSession session = new GameSession();
        session.setUserId(dto.getUserId());
        session.setGameId(dto.getGameId());
        session.setStatus(GameConstants.SessionStatus.ONGOING);
        session.setStartTime(currentTime);
        session.setCreateTime(currentTime);
        session.setUpdateTime(currentTime);
        gameSessionMapper.insert(session);
        return session.getSessionId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void endGame(GameEndDTO dto) {
        // 获取会话信息
        GameSession session = gameSessionMapper.selectById(dto.getSessionId());
        if (session == null) {
            throw new BusinessException(ErrorCode.GAME_SESSION_NOT_FOUND_OBJ);
        }

        // 更新会话状态
        session.setStatus(0); // 已结束
        session.setEndTime(System.currentTimeMillis());
        session.setDuration((session.getEndTime() - session.getStartTime()) / 1000);
        session.setScore(dto.getScore());
        session.setUpdateTime(System.currentTimeMillis());
        gameSessionMapper.updateById(session);

        // 计算消耗的疲劳点
        Game game = getById(session.getGameId());
        int consumePoints = (int) (session.getDuration() / 60 * (game.getConsumePointsPerMinute() != null ? game.getConsumePointsPerMinute() : 1));
        session.setConsumePoints(consumePoints);

        // 所有用户都创建游戏记录和更新疲劳点
        Kid kid = kidService.getById(session.getUserId());
        if (kid != null) {
            // 儿童用户：创建详细记录
            GameRecord record = new GameRecord();
            record.setKidId(session.getUserId());
            record.setGameId(session.getGameId());
            record.setSessionId(session.getSessionId());
            record.setDuration(session.getDuration());
            record.setScore(session.getScore());
            record.setConsumePoints(consumePoints);
            record.setPlayDate(com.kidgame.common.util.DateUtil.formatDate(System.currentTimeMillis()));
            record.setCreateTime(System.currentTimeMillis());
            gameRecordMapper.insert(record);

            // 更新儿童疲劳点
            kidService.updateFatiguePoints(session.getUserId(), 1, -consumePoints, session.getSessionId());
        } else {
            // 非儿童用户（家长）：也扣除疲劳点，但不创建游戏记录
            kidService.updateFatiguePoints(session.getUserId(), 1, -consumePoints, session.getSessionId());
            log.info("家长用户游戏结束，扣除疲劳点。UserId: {}, SessionId: {}, ConsumePoints: {}",
                    session.getUserId(), session.getSessionId(), consumePoints);
        }

        // 减少在线人数
        decrementOnlineCount(session.getGameId());

        log.info("Game ended. SessionId: {}, Duration: {}, Score: {}, ConsumePoints: {}",
                session.getSessionId(), session.getDuration(), session.getScore(), consumePoints);
    }

    @Override
    public void heartbeat(Long sessionId, Long duration, Integer score) {
        GameSession session = gameSessionMapper.selectById(sessionId);
        if (session != null) {
            session.setDuration(duration);
            session.setScore(score);
            session.setUpdateTime(System.currentTimeMillis());
            gameSessionMapper.updateById(session);
        }
    }

    @Override
    public void incrementOnlineCount(Long gameId) {
        Game game = getById(gameId);
        if (game != null) {
            game.setOnlineCount((game.getOnlineCount() == null ? 0 : game.getOnlineCount()) + 1);
            updateById(game);
        }
    }

    @Override
    public void decrementOnlineCount(Long gameId) {
        Game game = getById(gameId);
        if (game != null && game.getOnlineCount() > 0) {
            game.setOnlineCount(game.getOnlineCount() - 1);
            updateById(game);
        }
    }

    @Override
    public List<Game> getAuthorizedGamesForKid(Long kidId, String grade, String category) {
        Kid kid = kidMapper.selectById(kidId);
        if (kid == null) {
            throw new BusinessException(ErrorCode.KID_NOT_FOUND_OBJ);
        }

        List<Long> blockedGameIds = getBlockedGameIds(kidId, kid.getParentId());
        List<Game> allGames = queryGamesByFilters(grade, category, kid.getGrade());
        List<Game> authorizedGames = filterBlockedGames(allGames, blockedGameIds);

        log.info("获取儿童授权游戏. KidId: {}, Grade: {}, Category: {}, Total: {}, Filtered: {}",
                kidId, grade, category, allGames.size(), authorizedGames.size());

        return authorizedGames;
    }

    /**
     * 获取被屏蔽的游戏 ID 列表
     */
    private List<Long> getBlockedGameIds(Long kidId, Long parentId) {
        if (parentId == null) {
            return new ArrayList<>();
        }

        LambdaQueryWrapper<ParentLimit> limitWrapper = new LambdaQueryWrapper<>();
        limitWrapper.eq(ParentLimit::getKidId, kidId)
                .eq(ParentLimit::getParentId, parentId);
        ParentLimit parentLimit = parentLimitMapper.selectOne(limitWrapper);

        if (parentLimit == null || parentLimit.getBlockedGames() == null || parentLimit.getBlockedGames().trim().isEmpty()) {
            return new ArrayList<>();
        }

        return JsonUtil.fromJsonListSafe(parentLimit.getBlockedGames(), new TypeReference<List<Long>>() {});
    }

    /**
     * 按条件查询游戏
     */
    private List<Game> queryGamesByFilters(String grade, String category, String defaultGrade) {
        LambdaQueryWrapper<Game> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Game::getStatus, GameConstants.GameStatus.ENABLED)
                .orderByAsc(Game::getSortOrder);

        String filterGrade = (grade != null && !grade.trim().isEmpty()) ? grade : defaultGrade;
        wrapper.apply("FIND_IN_SET({0}, grade)", filterGrade);

        if (category != null && !category.trim().isEmpty()) {
            wrapper.eq(Game::getCategory, category);
        }

        return list(wrapper);
    }

    /**
     * 过滤被屏蔽的游戏
     */
    private List<Game> filterBlockedGames(List<Game> games, List<Long> blockedGameIds) {
        if (blockedGameIds.isEmpty()) {
            return games;
        }
        return games.stream()
                .filter(game -> !blockedGameIds.contains(game.getGameId()))
                .collect(Collectors.toList());
    }

    @Override
    public Game getGameByCode(String gameCode) {
        if (gameCode == null || gameCode.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "游戏代码不能为空");
        }

        LambdaQueryWrapper<Game> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Game::getGameCode, gameCode);
        Game game = getOne(wrapper);

        log.info("按游戏代码查询游戏. GameCode: {}, Found: {}", gameCode, game != null);
        return game;
    }
}
