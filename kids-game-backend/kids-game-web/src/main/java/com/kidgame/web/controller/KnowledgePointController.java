package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.dao.entity.KnowledgePoint;
import com.kidgame.service.KnowledgePointService;
import com.kidgame.service.dto.KnowledgePointSaveDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 知识点控制器
 */
@Tag(name = "知识点管理", description = "知识点相关接口")
@RestController
@RequestMapping("/api/knowledge-point")
public class KnowledgePointController {

    @Autowired
    private KnowledgePointService knowledgePointService;

    @Operation(summary = "按学科查知识点列表")
    @GetMapping("/list")
    public Result<List<KnowledgePoint>> list(
            @Parameter(description = "学科ID") @RequestParam Long subjectId,
            HttpServletRequest request) {
        return Result.success(knowledgePointService.listBySubject(subjectId));
    }

    @Operation(summary = "按学科查知识点树形结构")
    @GetMapping("/tree")
    public Result<List<KnowledgePoint>> tree(
            @Parameter(description = "学科ID") @RequestParam Long subjectId,
            HttpServletRequest request) {
        return Result.success(knowledgePointService.listTree(subjectId));
    }

    @Operation(summary = "知识点详情")
    @GetMapping("/{id}")
    public Result<KnowledgePoint> getById(
            @Parameter(description = "知识点ID") @PathVariable Long id,
            HttpServletRequest request) {
        return Result.success(knowledgePointService.getById(id));
    }

    @Operation(summary = "创建知识点")
    @PostMapping
    public Result<KnowledgePoint> create(@RequestBody KnowledgePointSaveDTO dto, HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        return Result.success(knowledgePointService.create(dto));
    }

    @Operation(summary = "更新知识点")
    @PutMapping("/{id}")
    public Result<KnowledgePoint> update(
            @PathVariable Long id,
            @RequestBody KnowledgePointSaveDTO dto,
            HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        dto.setKnowledgePointId(id);
        return Result.success(knowledgePointService.update(dto));
    }

    @Operation(summary = "删除知识点")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        knowledgePointService.delete(id);
        return Result.success();
    }
}
