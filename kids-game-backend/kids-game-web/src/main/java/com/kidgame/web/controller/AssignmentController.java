package com.kidgame.web.controller;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.PageResult;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.dao.entity.AssignmentCompletion;
import com.kidgame.dao.entity.PracticeAssignment;
import com.kidgame.service.AssignmentService;
import com.kidgame.service.dto.AssignmentSaveDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 教师练习任务控制器
 */
@Tag(name = "教师练习任务", description = "任务布置、完成情况相关接口")
@RestController
@RequestMapping("/api/assignment")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @Operation(summary = "创建任务（教师）")
    @PostMapping
    public Result<PracticeAssignment> create(@RequestBody AssignmentSaveDTO dto, HttpServletRequest request) {
        Long teacherId = resolveUserId(request);
        return Result.success(assignmentService.create(teacherId, dto));
    }

    @Operation(summary = "更新任务（教师）")
    @PutMapping("/{assignmentId}")
    public Result<PracticeAssignment> update(
            @Parameter(description = "任务ID") @PathVariable Long assignmentId,
            @RequestBody AssignmentSaveDTO dto,
            HttpServletRequest request) {
        Long teacherId = resolveUserId(request);
        assertCreator(assignmentId, teacherId);
        return Result.success(assignmentService.update(assignmentId, dto));
    }

    @Operation(summary = "删除任务（教师）")
    @DeleteMapping("/{assignmentId}")
    public Result<Void> delete(
            @Parameter(description = "任务ID") @PathVariable Long assignmentId,
            HttpServletRequest request) {
        Long teacherId = resolveUserId(request);
        assertCreator(assignmentId, teacherId);
        assignmentService.delete(assignmentId);
        return Result.success();
    }

    @Operation(summary = "任务详情")
    @GetMapping("/{assignmentId}")
    public Result<PracticeAssignment> getById(
            @Parameter(description = "任务ID") @PathVariable Long assignmentId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(assignmentService.getById(assignmentId));
    }

    @Operation(summary = "教师任务列表")
    @GetMapping("/teacher")
    public Result<PageResult<PracticeAssignment>> pageByTeacher(
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Long page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "10") Long size,
            HttpServletRequest request) {
        Long teacherId = resolveUserId(request);
        return Result.success(assignmentService.pageByTeacher(teacherId, status, page, size));
    }

    @Operation(summary = "班级任务列表（学生）")
    @GetMapping("/class/{classId}")
    public Result<List<PracticeAssignment>> listByClass(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(assignmentService.listByClass(classId));
    }

    @Operation(summary = "任务完成情况列表（教师）")
    @GetMapping("/{assignmentId}/completions")
    public Result<List<AssignmentCompletion>> listCompletions(
            @Parameter(description = "任务ID") @PathVariable Long assignmentId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(assignmentService.listCompletions(assignmentId));
    }

    @Operation(summary = "我的完成情况（学生）")
    @GetMapping("/{assignmentId}/completion")
    public Result<AssignmentCompletion> getCompletion(
            @Parameter(description = "任务ID") @PathVariable Long assignmentId,
            HttpServletRequest request) {
        Long studentId = resolveUserId(request);
        return Result.success(assignmentService.getCompletion(assignmentId, studentId));
    }

    @Operation(summary = "开始任务（学生）")
    @PostMapping("/{assignmentId}/start")
    public Result<AssignmentCompletion> startAssignment(
            @Parameter(description = "任务ID") @PathVariable Long assignmentId,
            HttpServletRequest request) {
        Long studentId = resolveUserId(request);
        return Result.success(assignmentService.startAssignment(assignmentId, studentId));
    }

    @Operation(summary = "完成任务（学生）")
    @PostMapping("/{assignmentId}/finish")
    public Result<Void> finishAssignment(
            @Parameter(description = "任务ID") @PathVariable Long assignmentId,
            HttpServletRequest request) {
        Long studentId = resolveUserId(request);
        assignmentService.finishAssignment(assignmentId, studentId);
        return Result.success();
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

    /** 校验当前用户是否为任务创建者 */
    private void assertCreator(Long assignmentId, Long teacherId) {
        PracticeAssignment assignment = assignmentService.getById(assignmentId);
        if (assignment.getTeacherId() == null || !assignment.getTeacherId().equals(teacherId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "仅任务创建者可操作");
        }
    }
}
