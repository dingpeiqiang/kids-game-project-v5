package com.kidgame.service;

import java.util.List;
import java.util.Map;

/**
 * 游戏记录服务
 */
public interface GameRecordService {

    /**
     * 获取用户游戏记录（每个游戏最近一次游玩记录）
     */
    List<Map<String, Object>> getUserGameRecords(Long userId);
}
