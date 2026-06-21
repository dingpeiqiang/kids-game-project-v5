package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.dao.entity.DailySession;
import com.kidgame.dao.entity.Question;
import com.kidgame.service.PracticeService;
import com.kidgame.service.dto.AnswerDTO;
import com.kidgame.service.dto.PracticeStartDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 每日练习控制器
 */
@Tag(name = "每日练习管理", description = "每日练习会话相关接口")
@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    @Autowired
    private PracticeService practiceService;

    @Operation(summary = "开始练习会话")
    @PostMapping("/start")
    public Result<DailySession> start(@RequestBody PracticeStartDTO dto, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(practiceService.start(userId, dto));
    }

    @Operation(summary = "获取下一题")
    @GetMapping("/{sessionId}/next")
    public Result<Question> nextQuestion(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(practiceService.nextQuestion(sessionId));
    }

    @Operation(summary = "提交单题答案")
    @PostMapping("/{sessionId}/submit")
    public Result<AnswerDTO.Result> submit(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @RequestBody AnswerDTO dto,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(practiceService.submit(sessionId, dto));
    }

    @Operation(summary = "结束会话")
    @PostMapping("/{sessionId}/finish")
    public Result<DailySession> finish(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(practiceService.finish(sessionId));
    }

    @Operation(summary = "放弃会话")
    @PostMapping("/{sessionId}/abandon")
    public Result<DailySession> abandon(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(practiceService.abandon(sessionId));
    }

    @Operation(summary = "会话详情")
    @GetMapping("/{sessionId}")
    public Result<DailySession> getById(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(practiceService.getById(sessionId));
    }

    @Operation(summary = "今日会话列表")
    @GetMapping("/today")
    public Result<List<DailySession>> listToday(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(practiceService.listToday(userId));
    }

    @Operation(summary = "今日统计")
    @GetMapping("/today-stats")
    public Result<Map<String, Object>> todayStats(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(practiceService.todayStats(userId));
    }

    // ==================== 内部方法 ====================

    private Long resolveUserId(HttpServletRequest request) {
        Long kidId = JwtAuthHelper.resolveKidId(request);
        if (kidId != null) {
            return kidId;
        }
        Long userId = JwtAuthHelper.resolveUserId(request);
        if (userId == null) {
            throw new com.kidgame.common.exception.BusinessException(com.kidgame.common.constant.ErrorCode.FORBIDDEN_OBJ, "未登录");
        }
        return userId;
    }
}
