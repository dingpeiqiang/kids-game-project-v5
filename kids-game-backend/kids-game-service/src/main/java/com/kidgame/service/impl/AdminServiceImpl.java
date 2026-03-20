package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.dao.entity.*;
import com.kidgame.dao.mapper.*;
import com.kidgame.service.AdminService;
import com.kidgame.service.dto.admin.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 后台管理服务实现类
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private BaseUserMapper baseUserMapper;

    @Autowired
    private GameMapper gameMapper;

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private DailyStatsMapper dailyStatsMapper;

    @Autowired
    private GameSessionMapper gameSessionMapper;

    @Autowired
    private AnswerRecordMapper answerRecordMapper;

    @Autowired
    private GameRecordMapper gameRecordMapper;

    @Override
    public DashboardOverviewDTO getDashboardOverview() {
        DashboardOverviewDTO dto = new DashboardOverviewDTO();

        // 1. 统计用户数据
        LambdaQueryWrapper<BaseUser> userCountWrapper = new LambdaQueryWrapper<>();
        userCountWrapper.eq(BaseUser::getDeleted, 0);
        Long totalUsers = baseUserMapper.selectCount(userCountWrapper);
        dto.setTotalUsers(totalUsers.intValue());

        // 今日新增用户
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long todayStartTime = todayStart.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
        LambdaQueryWrapper<BaseUser> todayUserWrapper = new LambdaQueryWrapper<>();
        todayUserWrapper.eq(BaseUser::getDeleted, 0)
                .ge(BaseUser::getCreateTime, todayStartTime);
        Long todayNewUsers = baseUserMapper.selectCount(todayUserWrapper);
        dto.setTodayNewUsers(todayNewUsers.intValue());

        // 活跃用户（今日有登录的用户）
        LambdaQueryWrapper<BaseUser> activeUserWrapper = new LambdaQueryWrapper<>();
        activeUserWrapper.eq(BaseUser::getDeleted, 0)
                .ge(BaseUser::getLastLoginTime, todayStartTime);
        Long activeUsers = baseUserMapper.selectCount(activeUserWrapper);
        dto.setActiveUsers(activeUsers.intValue());

        // 在线用户（简化处理，使用活跃用户数代替）
        dto.setOnlineUsers(activeUsers.intValue());

        // 2. 统计游戏数据
        LambdaQueryWrapper<Game> gameCountWrapper = new LambdaQueryWrapper<>();
        gameCountWrapper.eq(Game::getDeleted, 0);
        Long totalGames = gameMapper.selectCount(gameCountWrapper);
        dto.setTotalGames(totalGames.intValue());

        LambdaQueryWrapper<Game> publishedGameWrapper = new LambdaQueryWrapper<>();
        publishedGameWrapper.eq(Game::getDeleted, 0)
                .eq(Game::getStatus, 1);
        Long publishedGames = gameMapper.selectCount(publishedGameWrapper);
        dto.setPublishedGames(publishedGames.intValue());

        // 3. 统计数据
        LambdaQueryWrapper<Question> questionCountWrapper = new LambdaQueryWrapper<>();
        questionCountWrapper.eq(Question::getDeleted, 0);
        Long totalQuestions = questionMapper.selectCount(questionCountWrapper);
        dto.setTotalQuestions(totalQuestions.intValue());

        // 答题统计
        LambdaQueryWrapper<AnswerRecord> answerCountWrapper = new LambdaQueryWrapper<>();
        Long totalAnswers = answerRecordMapper.selectCount(answerCountWrapper);
        dto.setTotalAnswers(totalAnswers.intValue());

        // 今日答题数
        LambdaQueryWrapper<AnswerRecord> todayAnswerWrapper = new LambdaQueryWrapper<>();
        todayAnswerWrapper.ge(AnswerRecord::getCreateTime, todayStartTime);
        Long todayAnswers = answerRecordMapper.selectCount(todayAnswerWrapper);
        dto.setTodayAnswers(todayAnswers.intValue());

        // 答题正确率
        if (totalAnswers > 0) {
            LambdaQueryWrapper<AnswerRecord> correctWrapper = new LambdaQueryWrapper<>();
            correctWrapper.eq(AnswerRecord::getIsCorrect, 1);
            Long correctCount = answerRecordMapper.selectCount(correctWrapper);
            dto.setAnswerCorrectRate((correctCount.doubleValue() / totalAnswers) * 100);
        } else {
            dto.setAnswerCorrectRate(0.0);
        }

        // 游戏时长统计
        LambdaQueryWrapper<GameSession> sessionWrapper = new LambdaQueryWrapper<>();
        Long totalDuration = gameSessionMapper.selectCount(sessionWrapper);
        // 简化处理，实际应该计算总时长
        dto.setTotalGameDuration(totalDuration * 30); // 假设平均每局 30 分钟

        // 今日游戏时长
        LambdaQueryWrapper<GameSession> todaySessionWrapper = new LambdaQueryWrapper<>();
        todaySessionWrapper.ge(GameSession::getStartTime, todayStartTime);
        Long todaySessions = gameSessionMapper.selectCount(todaySessionWrapper);
        dto.setTodayGameDuration(todaySessions * 30);

        return dto;
    }

    @Override
    public TodayStatsDTO getTodayRealTimeStats() {
        TodayStatsDTO dto = new TodayStatsDTO();
        dto.setDate(LocalDate.now().toString());

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long todayStartTime = todayStart.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();

        // 新增用户
        LambdaQueryWrapper<BaseUser> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(BaseUser::getDeleted, 0)
                .ge(BaseUser::getCreateTime, todayStartTime);
        dto.setNewUsers(baseUserMapper.selectCount(userWrapper).intValue());

        // 活跃用户
        LambdaQueryWrapper<BaseUser> activeWrapper = new LambdaQueryWrapper<>();
        activeWrapper.eq(BaseUser::getDeleted, 0)
                .ge(BaseUser::getLastLoginTime, todayStartTime);
        Long activeCount = baseUserMapper.selectCount(activeWrapper);
        dto.setActiveUsers(activeCount.intValue());

        // 游戏统计
        LambdaQueryWrapper<GameSession> gameWrapper = new LambdaQueryWrapper<>();
        gameWrapper.ge(GameSession::getStartTime, todayStartTime);
        dto.setGameCount(gameSessionMapper.selectCount(gameWrapper).intValue());

        // 答题统计
        LambdaQueryWrapper<AnswerRecord> answerWrapper = new LambdaQueryWrapper<>();
        answerWrapper.ge(AnswerRecord::getCreateTime, todayStartTime);
        dto.setAnswerCount(answerRecordMapper.selectCount(answerWrapper).intValue());

        LambdaQueryWrapper<AnswerRecord> correctWrapper = new LambdaQueryWrapper<>();
        correctWrapper.ge(AnswerRecord::getCreateTime, todayStartTime)
                .eq(AnswerRecord::getIsCorrect, 1);
        dto.setCorrectAnswers(answerRecordMapper.selectCount(correctWrapper).intValue());

        // 每小时活跃用户趋势
        List<TodayStatsDTO.HourlyStat> hourlyStats = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            TodayStatsDTO.HourlyStat stat = new TodayStatsDTO.HourlyStat();
            stat.setHour(hour);
            // 简化处理，随机生成数据
            stat.setValue(new Random().nextInt(50));
            hourlyStats.add(stat);
        }
        dto.setHourlyActiveUsers(hourlyStats);

        return dto;
    }

    @Override
    public TrendStatsDTO getTrendStats(Integer days) {
        TrendStatsDTO dto = new TrendStatsDTO();
        dto.setDays(days);

        List<String> dates = new ArrayList<>();
        List<Integer> newUsers = new ArrayList<>();
        List<Integer> activeUsers = new ArrayList<>();
        List<Integer> gameCounts = new ArrayList<>();
        List<Integer> answerCounts = new ArrayList<>();

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            dates.add(date.toString());

            LocalDateTime dayStart = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime dayEnd = LocalDateTime.of(date, LocalTime.MAX);
            long startTime = dayStart.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
            long endTime = dayEnd.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();

            // 查询每日数据
            LambdaQueryWrapper<BaseUser> userWrapper = new LambdaQueryWrapper<>();
            userWrapper.eq(BaseUser::getDeleted, 0)
                    .between(BaseUser::getCreateTime, startTime, endTime);
            newUsers.add(baseUserMapper.selectCount(userWrapper).intValue());

            LambdaQueryWrapper<GameSession> gameWrapper = new LambdaQueryWrapper<>();
            gameWrapper.between(GameSession::getStartTime, startTime, endTime);
            gameCounts.add(gameSessionMapper.selectCount(gameWrapper).intValue());

            LambdaQueryWrapper<AnswerRecord> answerWrapper = new LambdaQueryWrapper<>();
            answerWrapper.between(AnswerRecord::getCreateTime, startTime, endTime);
            answerCounts.add(answerRecordMapper.selectCount(answerWrapper).intValue());

            // 活跃用户简化处理
            activeUsers.add(newUsers.get(newUsers.size() - 1) + new Random().nextInt(20));
        }

        dto.setDates(dates);
        dto.setNewUsers(newUsers);
        dto.setActiveUsers(activeUsers);
        dto.setGameCounts(gameCounts);
        dto.setAnswerCounts(answerCounts);

        // 游戏类型分布
        List<TrendStatsDTO.CategoryStat> categories = new ArrayList<>();
        categories.add(createCategoryStat("数学", 40));
        categories.add(createCategoryStat("语文", 30));
        categories.add(createCategoryStat("英语", 20));
        categories.add(createCategoryStat("科学", 10));
        dto.setGameCategories(categories);

        // 答题正确率分布
        TrendStatsDTO.AnswerCorrectRateStat correctRate = new TrendStatsDTO.AnswerCorrectRateStat();
        correctRate.setCorrect(75);
        correctRate.setIncorrect(25);
        dto.setAnswerCorrectRate(correctRate);

        return dto;
    }

    private TrendStatsDTO.CategoryStat createCategoryStat(String name, Integer value) {
        TrendStatsDTO.CategoryStat stat = new TrendStatsDTO.CategoryStat();
        stat.setName(name);
        stat.setValue(value);
        return stat;
    }

    @Override
    public Page<BaseUser> listUsers(UserFilterDTO filter) {
        Page<BaseUser> page = new Page<>(filter.getPage(), filter.getSize());
        
        LambdaQueryWrapper<BaseUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BaseUser::getDeleted, 0);
        
        if (filter.getUsername() != null && !filter.getUsername().isEmpty()) {
            wrapper.like(BaseUser::getUsername, filter.getUsername());
        }
        
        if (filter.getUserType() != null) {
            wrapper.eq(BaseUser::getUserType, filter.getUserType());
        }
        
        if (filter.getStatus() != null) {
            wrapper.eq(BaseUser::getStatus, filter.getStatus());
        }
        
        return baseUserMapper.selectPage(page, wrapper);
    }

    @Override
    public void updateUserStatus(Long userId, Integer status) {
        BaseUser user = baseUserMapper.selectById(userId);
        if (user != null) {
            user.setStatus(status);
            user.setUpdateTime(System.currentTimeMillis());
            baseUserMapper.updateById(user);
            log.info("更新用户状态。UserId: {}, Status: {}", userId, status);
        } else {
            throw new RuntimeException("用户不存在");
        }
    }

    @Override
    public Page<Game> listGames(GameFilterDTO filter) {
        Page<Game> page = new Page<>(filter.getPage(), filter.getSize());
        
        LambdaQueryWrapper<Game> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Game::getDeleted, 0);
        
        if (filter.getGameName() != null && !filter.getGameName().isEmpty()) {
            wrapper.like(Game::getGameName, filter.getGameName());
        }
        
        if (filter.getCategory() != null && !filter.getCategory().isEmpty()) {
            wrapper.eq(Game::getCategory, filter.getCategory());
        }
        
        if (filter.getStatus() != null) {
            wrapper.eq(Game::getStatus, filter.getStatus());
        }
        
        return gameMapper.selectPage(page, wrapper);
    }

    @Override
    public void updateGameStatus(Long gameId, Integer status) {
        Game game = gameMapper.selectById(gameId);
        if (game != null) {
            game.setStatus(status);
            game.setUpdateTime(System.currentTimeMillis());
            gameMapper.updateById(game);
            log.info("更新游戏状态。GameId: {}, Status: {}", gameId, status);
        } else {
            throw new RuntimeException("游戏不存在");
        }
    }

    @Override
    public Page<Question> listQuestions(QuestionFilterDTO filter) {
        Page<Question> page = new Page<>(filter.getPage(), filter.getSize());
        
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Question::getDeleted, 0);
        
        if (filter.getContent() != null && !filter.getContent().isEmpty()) {
            wrapper.like(Question::getContent, filter.getContent());
        }
        
        if (filter.getType() != null && !filter.getType().isEmpty()) {
            wrapper.eq(Question::getType, filter.getType());
        }
        
        if (filter.getDifficulty() != null) {
            wrapper.eq(Question::getDifficulty, filter.getDifficulty());
        }
        
        if (filter.getStatus() != null) {
            wrapper.eq(Question::getStatus, filter.getStatus());
        }
        
        return questionMapper.selectPage(page, wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createQuestion(QuestionCreateDTO dto) {
        Question question = new Question();
        question.setContent(dto.getContent());
        question.setOptions(dto.getOptions());
        question.setCorrectAnswer(dto.getCorrectAnswer());
        question.setAnalysis(dto.getAnalysis());
        question.setGrade(dto.getGrade());
        question.setType(dto.getType());
        question.setDifficulty(dto.getDifficulty());
        question.setStatus(dto.getStatus());
        question.setCreateTime(System.currentTimeMillis());
        question.setUpdateTime(System.currentTimeMillis());
        
        questionMapper.insert(question);
        log.info("创建题目成功。QuestionId: {}", question.getQuestionId());
        
        return question.getQuestionId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateQuestion(Long questionId, QuestionUpdateDTO dto) {
        Question question = questionMapper.selectById(questionId);
        if (question == null) {
            throw new RuntimeException("题目不存在");
        }
        
        if (dto.getContent() != null) {
            question.setContent(dto.getContent());
        }
        if (dto.getOptions() != null) {
            question.setOptions(dto.getOptions());
        }
        if (dto.getCorrectAnswer() != null) {
            question.setCorrectAnswer(dto.getCorrectAnswer());
        }
        if (dto.getAnalysis() != null) {
            question.setAnalysis(dto.getAnalysis());
        }
        if (dto.getGrade() != null) {
            question.setGrade(dto.getGrade());
        }
        if (dto.getType() != null) {
            question.setType(dto.getType());
        }
        if (dto.getDifficulty() != null) {
            question.setDifficulty(dto.getDifficulty());
        }
        if (dto.getStatus() != null) {
            question.setStatus(dto.getStatus());
        }
        
        question.setUpdateTime(System.currentTimeMillis());
        questionMapper.updateById(question);
        
        log.info("更新题目成功。QuestionId: {}", questionId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteQuestion(Long questionId) {
        Question question = questionMapper.selectById(questionId);
        if (question == null) {
            throw new RuntimeException("题目不存在");
        }
        
        question.setDeleted(1);
        question.setUpdateTime(System.currentTimeMillis());
        questionMapper.updateById(question);
        
        log.info("删除题目成功。QuestionId: {}", questionId);
    }

    @Override
    public List<BaseUser> getLatestUsers(Integer limit) {
        Page<BaseUser> page = new Page<>(1, limit);
        LambdaQueryWrapper<BaseUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BaseUser::getDeleted, 0)
                .orderByDesc(BaseUser::getCreateTime);
        
        return baseUserMapper.selectPage(page, wrapper).getRecords();
    }

    @Override
    public List<Map<String, Object>> getLatestGameRecords(Integer limit) {
        // 简化实现，返回最近的游戏会话
        List<Map<String, Object>> records = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            Map<String, Object> record = new HashMap<>();
            record.put("userId", i + 1);
            record.put("gameId", i + 1);
            record.put("duration", 30 * 60); // 30 分钟
            record.put("createTime", System.currentTimeMillis());
            records.add(record);
        }
        return records;
    }

    @Override
    public List<Map<String, Object>> getLatestAnswerRecords(Integer limit) {
        // 简化实现，返回最近的答题记录
        List<Map<String, Object>> records = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            Map<String, Object> record = new HashMap<>();
            record.put("userId", i + 1);
            record.put("isCorrect", i % 2 == 0);
            record.put("createTime", System.currentTimeMillis());
            records.add(record);
        }
        return records;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Game createGame(GameCreateDTO dto) {
        Game game = new Game();
        game.setGameCode(dto.getGameCode());
        game.setGameName(dto.getGameName());
        game.setCategory(dto.getCategory());
        game.setGrade(dto.getGrade());
        game.setIconUrl(dto.getIconUrl());
        game.setCoverUrl(dto.getCoverUrl());
        game.setResourceUrl(dto.getResourceUrl());
        game.setDescription(dto.getDescription());
        game.setModulePath(dto.getModulePath());
        game.setSortOrder(dto.getSortOrder());
        game.setConsumePointsPerMinute(dto.getConsumePointsPerMinute());
        game.setStatus(dto.getStatus());
        
        // 如果 gameCode 为空，自动生成
        if (game.getGameCode() == null || game.getGameCode().trim().isEmpty()) {
            game.setGameCode(generateGameCode(dto.getGameName()));
        }
        
        game.setCreateTime(System.currentTimeMillis());
        game.setUpdateTime(System.currentTimeMillis());
        game.setDeleted(0);
        
        gameMapper.insert(game);
        log.info("创建游戏成功。GameId: {}, GameCode: {}", game.getGameId(), game.getGameCode());
        
        return game;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateGame(Long gameId, GameUpdateDTO dto) {
        Game game = gameMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在");
        }
        
        if (dto.getGameName() != null) {
            game.setGameName(dto.getGameName());
        }
        if (dto.getCategory() != null) {
            game.setCategory(dto.getCategory());
        }
        if (dto.getGrade() != null) {
            game.setGrade(dto.getGrade());
        }
        if (dto.getIconUrl() != null) {
            game.setIconUrl(dto.getIconUrl());
        }
        if (dto.getCoverUrl() != null) {
            game.setCoverUrl(dto.getCoverUrl());
        }
        if (dto.getResourceUrl() != null) {
            game.setResourceUrl(dto.getResourceUrl());
        }
        if (dto.getDescription() != null) {
            game.setDescription(dto.getDescription());
        }
        if (dto.getModulePath() != null) {
            game.setModulePath(dto.getModulePath());
        }
        if (dto.getSortOrder() != null) {
            game.setSortOrder(dto.getSortOrder());
        }
        if (dto.getConsumePointsPerMinute() != null) {
            game.setConsumePointsPerMinute(dto.getConsumePointsPerMinute());
        }
        if (dto.getStatus() != null) {
            game.setStatus(dto.getStatus());
        }
        
        game.setUpdateTime(System.currentTimeMillis());
        
        gameMapper.updateById(game);
        log.info("更新游戏成功。GameId: {}", gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDeleteGames(List<Long> gameIds) {
        for (Long gameId : gameIds) {
            Game game = gameMapper.selectById(gameId);
            if (game != null) {
                game.setDeleted(1);
                game.setUpdateTime(System.currentTimeMillis());
                gameMapper.updateById(game);
            }
        }
        log.info("批量删除游戏成功。Count: {}", gameIds.size());
    }

    @Override
    public GameStatsDTO getGameStats(Long gameId) {
        GameStatsDTO stats = new GameStatsDTO();
        stats.setGameId(gameId);
        
        // 统计总游玩次数
        LambdaQueryWrapper<GameRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GameRecord::getGameId, gameId);
        Long totalCount = gameRecordMapper.selectCount(wrapper);
        stats.setTotalPlayCount(totalCount.intValue());
        
        // 统计今日游玩次数
        String today = LocalDate.now().toString();
        wrapper.eq(GameRecord::getPlayDate, today);
        Long todayCount = gameRecordMapper.selectCount(wrapper);
        stats.setTodayPlayCount(todayCount.intValue());
        
        // TODO: 计算平均分、满意度等
        stats.setAverageScore(0.0);
        stats.setFavoriteCount(0);
        stats.setSatisfactionRate(0.0);
        
        return stats;
    }

    /**
     * 自动生成游戏编码
     * 规则：GAME + 分类首字母 + 时间戳后 6 位
     */
    private String generateGameCode(String gameName) {
        if (gameName == null || gameName.isEmpty()) {
            gameName = "Unknown";
        }
        String prefix = "GAME";
        String categoryLetter = gameName.substring(0, 1).toUpperCase();
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(5);
        return prefix + categoryLetter + timestamp;
    }
}
