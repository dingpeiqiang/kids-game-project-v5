package com.kidgame.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.Question;
import com.kidgame.service.dto.admin.*;

import java.util.List;
import java.util.Map;

/**
 * 后台管理服务接口
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
public interface AdminService {

    /**
     * 获取仪表盘概览数据
     */
    DashboardOverviewDTO getDashboardOverview();

    /**
     * 获取今日实时统计
     */
    TodayStatsDTO getTodayRealTimeStats();

    /**
     * 获取趋势统计数据
     *
     * @param days 天数（7 或 30）
     */
    TrendStatsDTO getTrendStats(Integer days);

    /**
     * 获取用户列表（分页）
     *
     * @param filter 筛选条件
     * @return 用户列表
     */
    Page<BaseUser> listUsers(UserFilterDTO filter);

    /**
     * 更新用户状态
     *
     * @param userId 用户 ID
     * @param status 状态
     */
    void updateUserStatus(Long userId, Integer status);

    /**
     * 获取游戏列表（分页）
     *
     * @param filter 筛选条件
     * @return 游戏列表
     */
    Page<Game> listGames(GameFilterDTO filter);

    /**
     * 更新游戏状态
     *
     * @param gameId 游戏 ID
     * @param status 状态
     */
    void updateGameStatus(Long gameId, Integer status);

    /**
     * 获取题目列表（分页）
     *
     * @param filter 筛选条件
     * @return 题目列表
     */
    Page<Question> listQuestions(QuestionFilterDTO filter);

    /**
     * 创建题目
     *
     * @param dto 题目信息
     * @return 题目 ID
     */
    Long createQuestion(QuestionCreateDTO dto);

    /**
     * 更新题目
     *
     * @param questionId 题目 ID
     * @param dto 题目信息
     */
    void updateQuestion(Long questionId, QuestionUpdateDTO dto);

    /**
     * 删除题目
     *
     * @param questionId 题目 ID
     */
    void deleteQuestion(Long questionId);

    /**
     * 获取最新注册用户列表
     *
     * @param limit 数量限制
     */
    List<BaseUser> getLatestUsers(Integer limit);

    /**
     * 获取最新游戏记录
     *
     * @param limit 数量限制
     */
    List<Map<String, Object>> getLatestGameRecords(Integer limit);

    /**
     * 获取最新答题记录
     *
     * @param limit 数量限制
     */
    List<Map<String, Object>> getLatestAnswerRecords(Integer limit);

    /**
     * 创建游戏
     *
     * @param dto 游戏信息
     * @return 游戏实体
     */
    Game createGame(GameCreateDTO dto);

    /**
     * 更新游戏信息
     *
     * @param gameId 游戏 ID
     * @param dto 游戏信息
     */
    void updateGame(Long gameId, GameUpdateDTO dto);

    /**
     * 批量删除游戏
     *
     * @param gameIds 游戏 ID 列表
     */
    void batchDeleteGames(List<Long> gameIds);

    /**
     * 获取游戏统计信息
     *
     * @param gameId 游戏 ID
     * @return 游戏统计数据
     */
    GameStatsDTO getGameStats(Long gameId);
}
