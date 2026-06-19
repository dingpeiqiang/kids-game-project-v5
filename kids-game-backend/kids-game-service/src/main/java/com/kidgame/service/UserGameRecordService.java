package com.kidgame.service;

import java.util.List;
import java.util.Map;

/**
 * 用户游戏记录服务接口
 */
public interface UserGameRecordService {

    /**
     * 保存游戏记录
     */
    void saveGameRecord(Long userId, Integer gameId, Integer score, Boolean isNewBest);

    /**
     * 获取用户最近游玩记录
     */
    List<GameRecordDTO> getRecentRecords(Long userId, Integer limit);

    /**
     * 获取用户常玩游戏
     */
    List<Integer> getFrequentGames(Long userId, Integer limit);

    /**
     * 游戏记录 DTO
     */
    record GameRecordDTO(Integer gameId, Integer score, String playedAt, Boolean isNewBest) {}
}