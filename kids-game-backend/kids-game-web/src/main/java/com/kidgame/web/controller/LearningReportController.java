package com.kidgame.web.controller;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.service.LearningReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 个人学习报告控制器
 */
@Tag(name = "个人学习报告", description = "儿童个人学习数据统计接口")
@RestController
@RequestMapping("/api/learning-report")
public class LearningReportController {

    @Autowired
    private LearningReportService learningReportService;

    @Operation(summary = "学习总览")
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(learningReportService.overview(userId));
    }

    @Operation(summary = "答题趋势")
    @GetMapping("/trend")
    public Result<Map<String, Object>> trend(
            @Parameter(description = "天数") @RequestParam(defaultValue = "7") int days,
            HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(learningReportService.trend(userId, days));
    }

    @Operation(summary = "知识点掌握度")
    @GetMapping("/knowledge-mastery")
    public Result<Map<String, Object>> knowledgeMastery(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(learningReportService.knowledgeMastery(userId));
    }

    @Operation(summary = "学科分布")
    @GetMapping("/subject-distribution")
    public Result<Map<String, Object>> subjectDistribution(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(learningReportService.subjectDistribution(userId));
    }

    @Operation(summary = "难度分析")
    @GetMapping("/difficulty-analysis")
    public Result<Map<String, Object>> difficultyAnalysis(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(learningReportService.difficultyAnalysis(userId));
    }

    @Operation(summary = "最近答题记录")
    @GetMapping("/recent")
    public Result<List<Map<String, Object>>> recentRecords(
            @Parameter(description = "数量") @RequestParam(defaultValue = "10") int limit,
            HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(learningReportService.recentRecords(userId, limit));
    }

    // ==================== 内部方法 ====================

    private Long resolveUserId(HttpServletRequest request) {
        Long kidId = JwtAuthHelper.resolveKidId(request);
        if (kidId != null) {
            return kidId;
        }
        Long userId = JwtAuthHelper.resolveUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "未登录");
        }
        return userId;
    }
}
