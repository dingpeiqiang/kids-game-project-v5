package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.GameEconomyConfig;
import com.kidgame.dao.entity.GameSessionScore;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.GameEconomyConfigMapper;
import com.kidgame.dao.mapper.GameSessionScoreMapper;
import com.kidgame.service.EconomyWalletService;
import com.kidgame.service.FatiguePointsService;
import com.kidgame.service.GameService;
import com.kidgame.service.GameSettlementService;
import com.kidgame.service.TaskProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameSettlementServiceImpl implements GameSettlementService {

    private final GameService gameService;
    private final GameEconomyConfigMapper gameEconomyConfigMapper;
    private final BaseUserMapper baseUserMapper;
    private final GameSessionScoreMapper gameSessionScoreMapper;
    private final FatiguePointsService fatiguePointsService;
    private final EconomyWalletService economyWalletService;
    private final TaskProgressService taskProgressService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> settleGameEnd(Long userId, Long gameId, int score, int levelReached) {
        Map<String, Object> result = new HashMap<>();
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            result.put("success", false);
            result.put("message", "用户不存在");
            return result;
        }

        Game game = gameService.getGameDetail(gameId);
        int studyCost = resolveStudyCoinCost(gameId, game);
        int userType = user.getUserType() != null ? user.getUserType() : 0;

        if (studyCost > 0) {
            fatiguePointsService.consumeFatiguePoints(userId, userType, studyCost, gameId);
        }

        LevelReward reward = calcLevelReward(gameId, levelReached);
        if (reward.coins > 0) {
            economyWalletService.addCoins(userId, reward.coins, "游戏关卡奖励 gameId=" + gameId);
        }
        if (reward.exp > 0) {
            economyWalletService.addExp(userId, reward.exp);
        }

        GameSessionScore session = new GameSessionScore();
        session.setGameId(gameId);
        session.setUserId(userId);
        session.setUsername(user.getUsername());
        session.setNickname(user.getNickname());
        session.setAvatar(user.getAvatar());
        session.setScore(score);
        session.setLevelReached(levelReached);
        session.setCreateTime(System.currentTimeMillis());
        gameSessionScoreMapper.insert(session);

        Map<String, Object> rankInfo = gameSessionScoreMapper.selectUserBestRank(gameId, userId);
        Integer rank = null;
        if (rankInfo != null && rankInfo.get("user_rank") != null) {
            rank = ((Number) rankInfo.get("user_rank")).intValue();
            if (rank > 100) rank = null;
        }

        taskProgressService.onMetric(userId, "PLAY_GAME", 1);

        Map<String, Integer> wallet = economyWalletService.getWallet(userId);
        result.put("success", true);
        result.put("coinsEarned", reward.coins);
        result.put("expEarned", reward.exp);
        result.put("studyCoinsSpent", studyCost);
        result.put("coins", wallet.get("coins"));
        result.put("studyCoins", wallet.get("studyCoins"));
        result.put("exp", wallet.get("exp"));
        result.put("level", wallet.get("level"));
        result.put("rank", rank);
        result.put("sessionScore", score);
        return result;
    }

    private int resolveStudyCoinCost(Long gameId, Game game) {
        GameEconomyConfig cfg = gameEconomyConfigMapper.selectOne(
                new LambdaQueryWrapper<GameEconomyConfig>().eq(GameEconomyConfig::getGameId, gameId));
        if (cfg != null && cfg.getEnabled() != null && cfg.getEnabled() == 1 && cfg.getStudyCoinCost() != null) {
            return Math.max(0, cfg.getStudyCoinCost());
        }
        if (game != null && game.getConsumePointsPerMinute() != null) {
            return Math.max(1, game.getConsumePointsPerMinute());
        }
        return 1;
    }

    private LevelReward calcLevelReward(Long gameId, int levelReached) {
        int level = Math.max(1, levelReached);
        GameEconomyConfig cfg = gameEconomyConfigMapper.selectOne(
                new LambdaQueryWrapper<GameEconomyConfig>().eq(GameEconomyConfig::getGameId, gameId));
        if (cfg != null && cfg.getLevelRewardsJson() != null && !cfg.getLevelRewardsJson().isBlank()) {
            try {
                JSONArray arr = JSON.parseArray(cfg.getLevelRewardsJson());
                int coins = 0, exp = 0;
                for (int i = 0; i < arr.size(); i++) {
                    JSONObject o = arr.getJSONObject(i);
                    int lv = o.getIntValue("level", i + 1);
                    if (lv <= level) {
                        coins += o.getIntValue("coins", 0);
                        exp += o.getIntValue("exp", 0);
                    }
                }
                if (coins > 0 || exp > 0) {
                    return new LevelReward(coins, exp);
                }
            } catch (Exception e) {
                log.warn("解析关卡奖励失败 gameId={}", gameId, e);
            }
        }
        return new LevelReward(Math.min(3 + level, 15), Math.min(2 + level / 2, 20));
    }

    private record LevelReward(int coins, int exp) {}
}