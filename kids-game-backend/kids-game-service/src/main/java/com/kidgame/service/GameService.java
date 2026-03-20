package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.Game;
import com.kidgame.service.dto.GameStartDTO;
import com.kidgame.service.dto.GameEndDTO;

import java.util.List;

/**
 * 游戏业务服务
 */
public interface GameService extends IService<Game> {

    /**
     * 获取游戏列表（按学龄筛选）
     * @param grade 学龄
     * @return 游戏列表
     */
    List<Game> getGameListByGrade(String grade);

    /**
     * 获取游戏列表（按分类筛选）
     * @param category 分类
     * @return 游戏列表
     */
    List<Game> getGameListByCategory(String category);

    /**
     * 获取游戏详情
     * @param gameId 游戏ID
     * @return 游戏信息
     */
    Game getGameDetail(Long gameId);

    /**
     * 开始游戏
     * @param dto 开始游戏请求
     * @return 会话ID
     */
    Long startGame(GameStartDTO dto);

    /**
     * 结束游戏
     * @param dto 结束游戏请求
     */
    void endGame(GameEndDTO dto);

    /**
     * 游戏心跳（同步状态）
     * @param sessionId 会话ID
     * @param duration 游玩时长（秒）
     * @param score 当前分数
     */
    void heartbeat(Long sessionId, Long duration, Integer score);

    /**
     * 增加游戏在线人数
     * @param gameId 游戏ID
     */
    void incrementOnlineCount(Long gameId);

    /**
     * 减少游戏在线人数
     * @param gameId 游戏ID
     */
    void decrementOnlineCount(Long gameId);

    /**
     * 获取儿童授权的游戏列表（排除家长屏蔽的游戏）
     * @param kidId 儿童ID
     * @param grade 学龄（可选）
     * @param category 分类（可选）
     * @return 游戏列表
     */
    List<Game> getAuthorizedGamesForKid(Long kidId, String grade, String category);

    /**
     * 通过游戏代码获取游戏信息
     * @param gameCode 游戏代码
     * @return 游戏信息
     */
    Game getGameByCode(String gameCode);
}
