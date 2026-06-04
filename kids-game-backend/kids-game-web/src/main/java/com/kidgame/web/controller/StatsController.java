package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.DailyStats;
import com.kidgame.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 统计控制器
 */
@Tag(name = "统计管理", description = "统计数据相关接口")
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @Operation(summary = "获取今日统计数据")
    @GetMapping("/today")
    public Result<DailyStats> getTodayStats() {
        return Result.success(statsService.getTodayStats());
    }

    @Operation(summary = "获取指定日期统计数据")
    @GetMapping("/{date}")
    public Result<DailyStats> getDailyStats(
            @Parameter(description = "日期(yyyy-MM-dd)") @PathVariable String date) {
        LocalDate statDate = LocalDate.parse(date);
        return Result.success(statsService.getDailyStats(statDate));
    }

    @Operation(summary = "获取最近N天统计数据")
    @GetMapping("/recent")
    public Result<List<DailyStats>> getRecentStats(
            @Parameter(description = "天数") @RequestParam(defaultValue = "7") Integer days) {
        return Result.success(statsService.getRecentStats(days));
    }

    @Operation(summary = "获取儿童游戏统计")
    @GetMapping("/kid/game")
    public Result<Map<String, Object>> getKidGameStats(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        return Result.success(statsService.getKidGameStats(kidId));
    }

    @Operation(summary = "获取儿童答题统计")
    @GetMapping("/kid/answer")
    public Result<Map<String, Object>> getKidAnswerStats(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        return Result.success(statsService.getKidAnswerStats(kidId));
    }
}
