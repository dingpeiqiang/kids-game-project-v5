package com.kidgame.web.controller;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.service.ParentReportService;
import com.kidgame.service.UserRelationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 家长报表控制器
 */
@Tag(name = "家长报表", description = "家长查看孩子学习数据接口")
@RestController
@RequestMapping("/api/parent/report")
public class ParentReportController {

    @Autowired
    private ParentReportService parentReportService;

    @Autowired
    private UserRelationService userRelationService;

    @Operation(summary = "孩子总览")
    @GetMapping("/kid/{kidId}/overview")
    public Result<Map<String, Object>> kidOverview(
            @Parameter(description = "儿童ID") @PathVariable Long kidId,
            HttpServletRequest request) {
        assertAccess(kidId, request);
        return Result.success(parentReportService.kidOverview(kidId));
    }

    @Operation(summary = "孩子答题趋势")
    @GetMapping("/kid/{kidId}/trend")
    public Result<Map<String, Object>> kidTrend(
            @Parameter(description = "儿童ID") @PathVariable Long kidId,
            @Parameter(description = "天数") @RequestParam(defaultValue = "7") int days,
            HttpServletRequest request) {
        assertAccess(kidId, request);
        return Result.success(parentReportService.kidTrend(kidId, days));
    }

    @Operation(summary = "孩子薄弱知识点")
    @GetMapping("/kid/{kidId}/weak-points")
    public Result<Map<String, Object>> kidWeakPoints(
            @Parameter(description = "儿童ID") @PathVariable Long kidId,
            HttpServletRequest request) {
        assertAccess(kidId, request);
        return Result.success(parentReportService.kidWeakPoints(kidId));
    }

    @Operation(summary = "孩子错题本概览")
    @GetMapping("/kid/{kidId}/wrong-book")
    public Result<Map<String, Object>> kidWrongBook(
            @Parameter(description = "儿童ID") @PathVariable Long kidId,
            HttpServletRequest request) {
        assertAccess(kidId, request);
        return Result.success(parentReportService.kidWrongBookOverview(kidId));
    }

    @Operation(summary = "孩子最近答题")
    @GetMapping("/kid/{kidId}/recent")
    public Result<List<Map<String, Object>>> kidRecent(
            @Parameter(description = "儿童ID") @PathVariable Long kidId,
            @Parameter(description = "数量") @RequestParam(defaultValue = "10") int limit,
            HttpServletRequest request) {
        assertAccess(kidId, request);
        return Result.success(parentReportService.kidRecentRecords(kidId, limit));
    }

    // ==================== 内部方法 ====================

    /**
     * 访问校验：管理员、儿童本人或已绑定家长可访问。
     */
    private void assertAccess(Long kidId, HttpServletRequest request) {
        if (kidId == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "儿童ID不能为空");
        }
        // 管理员放行
        Integer userType = JwtAuthHelper.resolveUserType(request);
        if (userType != null && userType == 2) {
            return;
        }
        // 儿童本人放行
        Long currentKidId = JwtAuthHelper.resolveKidId(request);
        if (currentKidId != null && currentKidId.equals(kidId)) {
            return;
        }
        // 家长关系校验：当前用户必须是该儿童的已绑定监护人
        Long userId = JwtAuthHelper.resolveUserId(request);
        if (userId != null && userRelationService.checkRelationExists(userId, kidId)) {
            return;
        }
        throw new BusinessException(ErrorCode.FORBIDDEN, "无权访问该儿童的学情数据");
    }
}
