package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.service.UserGameRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户游戏记录控制器
 */
@Slf4j
@Tag(name = "用户游戏记录", description = "用户游戏记录管理接口")
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserGameRecordController {

    private final UserGameRecordService userGameRecordService;
    private final JwtUtil jwtUtil;

    @Operation(summary = "保存游戏记录")
    @PostMapping("/game-record")
    public Result<Void> saveGameRecord(
            @RequestHeader("Authorization") String authorization,
            @Parameter(description = "游戏ID") @RequestParam Integer gameId,
            @Parameter(description = "得分") @RequestParam Integer score,
            @Parameter(description = "是否新纪录") @RequestParam(defaultValue = "false") Boolean isNewBest) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userId = Long.parseLong(jwtUtil.getUserId(token));
            userGameRecordService.saveGameRecord(userId, gameId, score, isNewBest);
            return Result.success();
        } catch (Exception e) {
            log.error("保存游戏记录失败", e);
            return Result.error("保存游戏记录失败：" + e.getMessage());
        }
    }

    @Operation(summary = "获取用户最近游玩记录")
    @GetMapping("/game-records/recent")
    public Result<List<UserGameRecordService.GameRecordDTO>> getRecentRecords(
            @RequestHeader("Authorization") String authorization,
            @Parameter(description = "数量限制") @RequestParam(defaultValue = "20") Integer limit) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userId = Long.parseLong(jwtUtil.getUserId(token));
            List<UserGameRecordService.GameRecordDTO> records = userGameRecordService.getRecentRecords(userId, limit);
            return Result.success(records);
        } catch (Exception e) {
            log.error("获取最近游玩记录失败", e);
            return Result.error("获取最近游玩记录失败：" + e.getMessage());
        }
    }

    @Operation(summary = "获取用户常玩游戏")
    @GetMapping("/game-records/frequent")
    public Result<List<Integer>> getFrequentGames(
            @RequestHeader("Authorization") String authorization,
            @Parameter(description = "数量限制") @RequestParam(defaultValue = "10") Integer limit) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userId = Long.parseLong(jwtUtil.getUserId(token));
            List<Integer> games = userGameRecordService.getFrequentGames(userId, limit);
            return Result.success(games);
        } catch (Exception e) {
            log.error("获取常玩游戏失败", e);
            return Result.error("获取常玩游戏失败：" + e.getMessage());
        }
    }
}