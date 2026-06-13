package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.mapper.GameSessionScoreMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 单局得分排行榜（每游戏前100名）
 */
@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class SessionLeaderboardController {

    private final GameSessionScoreMapper gameSessionScoreMapper;

    @GetMapping("/session-top")
    public Result<Map<String, Object>> sessionTop(
            @RequestParam Long gameId,
            @RequestParam(defaultValue = "100") Integer limit) {
        limit = Math.min(Math.max(limit, 1), 100);
        List<Map<String, Object>> raw = gameSessionScoreMapper.selectTopByGame(gameId, limit);
        List<Map<String, Object>> list = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> row : raw) {
            Map<String, Object> e = new HashMap<>();
            e.put("rank", rank++);
            e.put("userId", row.get("user_id"));
            e.put("username", row.get("username"));
            e.put("nickname", row.get("nickname"));
            e.put("avatar", row.get("avatar"));
            e.put("score", row.get("score"));
            list.add(e);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("rankType", "SESSION");
        res.put("list", list);
        return Result.success(res);
    }
}