package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.dao.entity.Subject;
import com.kidgame.service.SubjectService;
import com.kidgame.service.dto.SubjectSaveDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 学科控制器
 */
@Tag(name = "学科管理", description = "学科相关接口")
@RestController
@RequestMapping("/api/subject")
public class SubjectController {

    @Autowired
    private SubjectService subjectService;

    @Operation(summary = "查启用学科列表")
    @GetMapping("/list")
    public Result<List<Subject>> list(HttpServletRequest request) {
        return Result.success(subjectService.listAll());
    }

    @Operation(summary = "查全部学科列表（含禁用）")
    @GetMapping("/list-all")
    public Result<List<Subject>> listAll(HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        return Result.success(subjectService.listAllIncludeDisabled());
    }

    @Operation(summary = "学科详情")
    @GetMapping("/{id}")
    public Result<Subject> getById(
            @Parameter(description = "学科ID") @PathVariable Long id,
            HttpServletRequest request) {
        return Result.success(subjectService.getById(id));
    }

    @Operation(summary = "创建学科")
    @PostMapping
    public Result<Subject> create(@RequestBody SubjectSaveDTO dto, HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        return Result.success(subjectService.create(dto));
    }

    @Operation(summary = "更新学科")
    @PutMapping("/{id}")
    public Result<Subject> update(
            @PathVariable Long id,
            @RequestBody SubjectSaveDTO dto,
            HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        dto.setSubjectId(id);
        return Result.success(subjectService.update(dto));
    }

    @Operation(summary = "删除学科")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        subjectService.delete(id);
        return Result.success();
    }
}
