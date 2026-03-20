package com.kidgame.web.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.Question;
import com.kidgame.service.AdminService;
import com.kidgame.service.dto.admin.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 后台管理控制器
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Tag(name = "后台管理", description = "系统运营后台管理接口")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    /**
     * 仪表盘概览
     */
    @Operation(summary = "获取仪表盘概览数据")
    @GetMapping("/dashboard/overview")
    public Result<DashboardOverviewDTO> getDashboardOverview() {
        DashboardOverviewDTO dto = adminService.getDashboardOverview();
        return Result.success(dto);
    }

    /**
     * 今日实时统计
     */
    @Operation(summary = "获取今日实时统计")
    @GetMapping("/dashboard/today-stats")
    public Result<TodayStatsDTO> getTodayRealTimeStats() {
        TodayStatsDTO dto = adminService.getTodayRealTimeStats();
        return Result.success(dto);
    }

    /**
     * 趋势统计
     */
    @Operation(summary = "获取趋势统计数据")
    @GetMapping("/dashboard/trend")
    public Result<TrendStatsDTO> getTrendStats(
            @Parameter(description = "天数（7 或 30）") 
            @RequestParam(defaultValue = "7") Integer days) {
        TrendStatsDTO dto = adminService.getTrendStats(days);
        return Result.success(dto);
    }

    /**
     * 用户管理 - 列表
     */
    @Operation(summary = "获取用户列表（分页）")
    @GetMapping("/users")
    public Result<Page<BaseUser>> listUsers(
            @Parameter(description = "用户名") @RequestParam(required = false) String username,
            @Parameter(description = "用户类型：0-KID, 1-PARENT, 2-ADMIN") @RequestParam(required = false) Integer userType,
            @Parameter(description = "状态：0-禁用，1-正常，2-锁定") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        
        UserFilterDTO filter = new UserFilterDTO();
        filter.setUsername(username);
        filter.setUserType(userType);
        filter.setStatus(status);
        filter.setPage(page);
        filter.setSize(size);
        
        Page<BaseUser> result = adminService.listUsers(filter);
        return Result.success(result);
    }

    /**
     * 用户管理 - 更新状态
     */
    @Operation(summary = "更新用户状态")
    @PutMapping("/users/{userId}/status")
    public Result<Void> updateUserStatus(
            @Parameter(description = "用户 ID") @PathVariable Long userId,
            @Parameter(description = "状态：0-禁用，1-正常，2-锁定") @RequestParam Integer status) {
        adminService.updateUserStatus(userId, status);
        return Result.success();
    }

    /**
     * 游戏管理 - 列表
     */
    @Operation(summary = "获取游戏列表（分页）")
    @GetMapping("/games")
    public Result<Page<Game>> listGames(
            @Parameter(description = "游戏名称") @RequestParam(required = false) String gameName,
            @Parameter(description = "游戏分类") @RequestParam(required = false) String category,
            @Parameter(description = "状态：0-禁用，1-启用") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        
        GameFilterDTO filter = new GameFilterDTO();
        filter.setGameName(gameName);
        filter.setCategory(category);
        filter.setStatus(status);
        filter.setPage(page);
        filter.setSize(size);
        
        Page<Game> result = adminService.listGames(filter);
        return Result.success(result);
    }

    /**
     * 游戏管理 - 更新状态
     */
    @Operation(summary = "更新游戏状态")
    @PutMapping("/games/{gameId}/status")
    public Result<Void> updateGameStatus(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @Parameter(description = "状态：0-禁用，1-启用") @RequestParam Integer status) {
        adminService.updateGameStatus(gameId, status);
        return Result.success();
    }

    /**
     * 游戏管理 - 创建游戏
     */
    @Operation(summary = "创建游戏")
    @PostMapping("/games")
    public Result<Game> createGame(@RequestBody GameCreateDTO dto) {
        Game game = adminService.createGame(dto);
        return Result.success(game);
    }

    /**
     * 游戏管理 - 更新游戏
     */
    @Operation(summary = "更新游戏信息")
    @PutMapping("/games/{gameId}")
    public Result<Void> updateGame(
            @Parameter(description = "游戏 ID") @PathVariable Long gameId,
            @RequestBody GameUpdateDTO dto) {
        adminService.updateGame(gameId, dto);
        return Result.success();
    }

    /**
     * 游戏管理 - 批量删除
     */
    @Operation(summary = "批量删除游戏")
    @DeleteMapping("/games/batch")
    public Result<Void> batchDeleteGames(
            @RequestBody List<Long> gameIds) {
        adminService.batchDeleteGames(gameIds);
        return Result.success();
    }

    /**
     * 游戏管理 - 获取统计
     */
    @Operation(summary = "获取游戏统计信息")
    @GetMapping("/games/{gameId}/stats")
    public Result<GameStatsDTO> getGameStats(@PathVariable Long gameId) {
        return Result.success(adminService.getGameStats(gameId));
    }

    /**
     * 题库管理 - 列表
     */
    @Operation(summary = "获取题目列表（分页）")
    @GetMapping("/questions")
    public Result<Page<Question>> listQuestions(
            @Parameter(description = "题目内容") @RequestParam(required = false) String content,
            @Parameter(description = "题型") @RequestParam(required = false) String type,
            @Parameter(description = "难度：1-5") @RequestParam(required = false) Integer difficulty,
            @Parameter(description = "状态：0-禁用，1-启用") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        
        QuestionFilterDTO filter = new QuestionFilterDTO();
        filter.setContent(content);
        filter.setType(type);
        filter.setDifficulty(difficulty);
        filter.setStatus(status);
        filter.setPage(page);
        filter.setSize(size);
        
        Page<Question> result = adminService.listQuestions(filter);
        return Result.success(result);
    }

    /**
     * 题库管理 - 创建题目
     */
    @Operation(summary = "创建题目")
    @PostMapping("/questions")
    public Result<Long> createQuestion(@RequestBody QuestionCreateDTO dto) {
        Long questionId = adminService.createQuestion(dto);
        return Result.success(questionId);
    }

    /**
     * 题库管理 - 更新题目
     */
    @Operation(summary = "更新题目")
    @PutMapping("/questions/{questionId}")
    public Result<Void> updateQuestion(
            @Parameter(description = "题目 ID") @PathVariable Long questionId,
            @RequestBody QuestionUpdateDTO dto) {
        adminService.updateQuestion(questionId, dto);
        return Result.success();
    }

    /**
     * 题库管理 - 删除题目
     */
    @Operation(summary = "删除题目")
    @DeleteMapping("/questions/{questionId}")
    public Result<Void> deleteQuestion(
            @Parameter(description = "题目 ID") @PathVariable Long questionId) {
        adminService.deleteQuestion(questionId);
        return Result.success();
    }

    /**
     * 获取最新注册用户
     */
    @Operation(summary = "获取最新注册用户列表")
    @GetMapping("/users/latest")
    public Result<List<BaseUser>> getLatestUsers(
            @Parameter(description = "数量限制") @RequestParam(defaultValue = "5") Integer limit) {
        List<BaseUser> users = adminService.getLatestUsers(limit);
        return Result.success(users);
    }

    /**
     * 获取最新游戏记录
     */
    @Operation(summary = "获取最新游戏记录")
    @GetMapping("/game-records/latest")
    public Result<List<Map<String, Object>>> getLatestGameRecords(
            @Parameter(description = "数量限制") @RequestParam(defaultValue = "5") Integer limit) {
        List<Map<String, Object>> records = adminService.getLatestGameRecords(limit);
        return Result.success(records);
    }

    /**
     * 获取最新答题记录
     */
    @Operation(summary = "获取最新答题记录")
    @GetMapping("/answer-records/latest")
    public Result<List<Map<String, Object>>> getLatestAnswerRecords(
            @Parameter(description = "数量限制") @RequestParam(defaultValue = "5") Integer limit) {
        List<Map<String, Object>> records = adminService.getLatestAnswerRecords(limit);
        return Result.success(records);
    }
}
