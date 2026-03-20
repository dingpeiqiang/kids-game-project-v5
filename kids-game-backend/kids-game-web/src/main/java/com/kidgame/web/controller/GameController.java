package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.Game;
import com.kidgame.service.GameService;
import com.kidgame.service.dto.GameEndDTO;
import com.kidgame.service.dto.GameStartDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 游戏控制器
 */
@Slf4j
@Tag(name = "游戏管理", description = "游戏相关接口")
@RestController
@RequestMapping("/api/game")
public class GameController {

    @Autowired
    private GameService gameService;

    @Operation(summary = "获取游戏列表")
    @GetMapping("/list")
    public Result<List<Game>> getGameList(
            @Parameter(description = "学龄") @RequestParam(required = false) String grade,
            @Parameter(description = "分类") @RequestParam(required = false) String category,
            @Parameter(description = "儿童ID（用于获取授权游戏）") @RequestParam(required = false) Long kidId) {
        try {
            // 如果提供了 kidId，则返回该儿童授权的游戏列表
            if (kidId != null) {
                return Result.success(gameService.getAuthorizedGamesForKid(kidId, grade, category));
            }

            if (grade != null && !grade.trim().isEmpty()) {
                return Result.success(gameService.getGameListByGrade(grade));
            } else if (category != null && !category.trim().isEmpty()) {
                return Result.success(gameService.getGameListByCategory(category));
            }
            // 默认返回所有上架的游戏
            return Result.success(gameService.list());
        } catch (Exception e) {
            log.error("Failed to get game list. Grade: {}, Category: {}, KidId: {}", grade, category, kidId, e);
            return Result.error("获取游戏列表失败: " + e.getMessage());
        }
    }

    @Operation(summary = "获取游戏详情")
    @GetMapping("/{gameId}")
    public Result<Game> getGameDetail(
            @Parameter(description = "游戏ID") @PathVariable Long gameId) {
        return Result.success(gameService.getGameDetail(gameId));
    }

    @Operation(summary = "开始游戏")
    @PostMapping("/start")
    public Result<Long> startGame(@RequestBody GameStartDTO dto) {
        Long sessionId = gameService.startGame(dto);
        return Result.success(sessionId);
    }

    @Operation(summary = "结束游戏")
    @PostMapping("/end")
    public Result<Void> endGame(@RequestBody GameEndDTO dto) {
        gameService.endGame(dto);
        return Result.success();
    }

    @Operation(summary = "游戏心跳")
    @PostMapping("/heartbeat")
    public Result<Void> heartbeat(
            @Parameter(description = "会话ID") @RequestParam Long sessionId,
            @Parameter(description = "时长（秒）") @RequestParam Long duration,
            @Parameter(description = "分数") @RequestParam Integer score) {
        gameService.heartbeat(sessionId, duration, score);
        return Result.success();
    }

    @Operation(summary = "通过游戏代码获取游戏信息")
    @GetMapping("/code/{gameCode}")
    public Result<Game> getGameByCode(
            @Parameter(description = "游戏代码") @PathVariable String gameCode) {
        try {
            Game game = gameService.getGameByCode(gameCode);
            if (game == null) {
                return Result.error("游戏不存在：" + gameCode);
            }
            return Result.success(game);
        } catch (Exception e) {
            log.error("Failed to get game by code. GameCode: {}", gameCode, e);
            return Result.error("获取游戏信息失败：" + e.getMessage());
        }
    }

    @Operation(summary = "获取游戏的主题资源模板")
    @GetMapping("/theme-template")
    public Result<Object> getGameThemeTemplate(
            @Parameter(description = "游戏代码") @RequestParam String gameCode) {
        try {
            // 从 classpath 读取所有可用的游戏模板
            // 注意：这是一个简化实现，实际应该从数据库或配置中心获取
            
            // 尝试从多个可能的位置加载模板
            String[] possiblePaths = {
                "/config/theme-template-" + gameCode + ".json",
                "/templates/theme-template-" + gameCode + ".json",
                "/games/" + gameCode + "/theme-template.json"
            };
            
            for (String path : possiblePaths) {
                var resource = GameController.class.getResource(path);
                if (resource != null) {
                    java.io.InputStream inputStream = resource.openStream();
                    java.util.Scanner scanner = new java.util.Scanner(inputStream).useDelimiter("\\A");
                    String templateContent = scanner.hasNext() ? scanner.next() : "";
                    
                    com.alibaba.fastjson2.JSONObject template = 
                        com.alibaba.fastjson2.JSON.parseObject(templateContent);
                    
                    return Result.success(template);
                }
            }
            
            log.warn("游戏 {} 的主题模板文件未找到", gameCode);
            return Result.error("该游戏暂无主题模板配置");
        } catch (Exception e) {
            log.error("Failed to get game theme template. GameCode: {}", gameCode, e);
            return Result.error("获取主题模板失败：" + e.getMessage());
        }
    }
}
