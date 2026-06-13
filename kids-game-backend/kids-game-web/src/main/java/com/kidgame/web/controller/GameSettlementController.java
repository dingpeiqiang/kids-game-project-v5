package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.service.GameSettlementService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameSettlementController {

    private final GameSettlementService gameSettlementService;
    private final JwtUtil jwtUtil;

    @PostMapping("/settle")
    public Result<Map<String, Object>> settle(
            @RequestHeader("Authorization") String authorization,
            @RequestBody SettleRequest body) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userId = Long.parseLong(jwtUtil.getUserId(token));
            Map<String, Object> data = gameSettlementService.settleGameEnd(
                    userId, body.getGameId(), body.getScore(),
                    body.getLevelReached() != null ? body.getLevelReached() : 0);
            return Result.success(data);
        } catch (Exception e) {
            log.error("游戏结算失败", e);
            return Result.error("游戏结算失败：" + e.getMessage());
        }
    }

    @Data
    public static class SettleRequest {
        private Long gameId;
        private Integer score;
        private Integer levelReached;
    }
}