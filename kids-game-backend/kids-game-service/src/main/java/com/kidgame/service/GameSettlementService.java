package com.kidgame.service;

import java.util.Map;

public interface GameSettlementService {

    /**
     * 游戏结束结算：扣游学币、发关卡金币/经验、记录单局得分排行
     */
    Map<String, Object> settleGameEnd(Long userId, Long gameId, int score, int levelReached);
}