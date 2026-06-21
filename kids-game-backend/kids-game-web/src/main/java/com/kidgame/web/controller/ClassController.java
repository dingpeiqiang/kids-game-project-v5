package com.kidgame.web.controller;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.dao.entity.ClassMember;
import com.kidgame.dao.entity.Kid;
import com.kidgame.dao.entity.SchoolClass;
import com.kidgame.service.ClassService;
import com.kidgame.service.dto.ClassSaveDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 班级管理控制器
 */
@Tag(name = "班级管理", description = "班级、成员相关接口")
@RestController
@RequestMapping("/api/class")
public class ClassController {

    @Autowired
    private ClassService classService;

    @Operation(summary = "创建班级")
    @PostMapping
    public Result<SchoolClass> create(@RequestBody ClassSaveDTO dto, HttpServletRequest request) {
        Long teacherId = resolveUserId(request);
        return Result.success(classService.create(teacherId, dto));
    }

    @Operation(summary = "更新班级")
    @PutMapping("/{classId}")
    public Result<SchoolClass> update(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            @RequestBody ClassSaveDTO dto,
            HttpServletRequest request) {
        Long teacherId = resolveUserId(request);
        assertCreator(classId, teacherId);
        return Result.success(classService.update(classId, dto));
    }

    @Operation(summary = "解散班级")
    @DeleteMapping("/{classId}")
    public Result<Void> delete(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            HttpServletRequest request) {
        Long teacherId = resolveUserId(request);
        assertCreator(classId, teacherId);
        classService.delete(classId);
        return Result.success();
    }

    @Operation(summary = "班级详情")
    @GetMapping("/{classId}")
    public Result<SchoolClass> getById(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(classService.getById(classId));
    }

    @Operation(summary = "我的班级列表（教师返回教的班，学生返回加入的班）")
    @GetMapping("/my")
    public Result<List<SchoolClass>> myClasses(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        // 教师优先返回所教班级；若教师未创建班级则返回其作为学生加入的班级
        List<SchoolClass> teacherClasses = classService.listByTeacher(userId);
        if (!teacherClasses.isEmpty()) {
            return Result.success(teacherClasses);
        }
        return Result.success(classService.listByStudent(userId));
    }

    @Operation(summary = "通过邀请码加入班级")
    @PostMapping("/join")
    public Result<Boolean> joinByCode(@RequestBody Map<String, String> body, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        String inviteCode = body.get("inviteCode");
        String role = body.getOrDefault("role", "STUDENT");
        return Result.success(classService.joinByCode(userId, inviteCode, role));
    }

    @Operation(summary = "直接加入班级")
    @PostMapping("/{classId}/join")
    public Result<Boolean> join(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        Long userId = resolveUserId(request);
        String role = body.getOrDefault("role", "STUDENT");
        return Result.success(classService.join(classId, userId, role));
    }

    @Operation(summary = "退出班级")
    @PostMapping("/{classId}/leave")
    public Result<Boolean> leave(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(classService.leave(classId, userId));
    }

    @Operation(summary = "班级成员列表")
    @GetMapping("/{classId}/members")
    public Result<List<ClassMember>> listMembers(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(classService.listMembers(classId));
    }

    @Operation(summary = "班级学生列表")
    @GetMapping("/{classId}/students")
    public Result<List<Kid>> listStudents(
            @Parameter(description = "班级ID") @PathVariable Long classId,
            HttpServletRequest request) {
        resolveUserId(request);
        return Result.success(classService.listStudents(classId));
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

    /** 校验当前用户是否为班级创建者 */
    private void assertCreator(Long classId, Long teacherId) {
        SchoolClass schoolClass = classService.getById(classId);
        if (schoolClass.getCreatorId() == null || !schoolClass.getCreatorId().equals(teacherId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "仅班级创建者可操作");
        }
    }
}
