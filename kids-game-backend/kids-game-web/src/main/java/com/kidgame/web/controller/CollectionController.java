package com.kidgame.web.controller;

import com.kidgame.common.model.PageResult;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.dao.entity.QuestionCollection;
import com.kidgame.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 题目收藏控制器
 */
@Tag(name = "题目收藏管理", description = "题目收藏相关接口")
@RestController
@RequestMapping("/api/collection")
public class CollectionController {

    @Autowired
    private CollectionService collectionService;

    @Operation(summary = "分页查询收藏")
    @GetMapping("/page")
    public Result<PageResult<QuestionCollection>> page(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Long page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "10") Long size,
            HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(collectionService.page(userId, page, size));
    }

    @Operation(summary = "收藏/取消收藏")
    @PostMapping("/toggle")
    public Result<Boolean> toggle(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        Long questionId = body.get("questionId") instanceof Number
                ? ((Number) body.get("questionId")).longValue() : null;
        String note = body.get("note") != null ? body.get("note").toString() : null;
        if (questionId == null) {
            return Result.error(400, "题目ID不能为空");
        }
        return Result.success(collectionService.toggle(userId, questionId, note));
    }

    @Operation(summary = "检查是否已收藏")
    @GetMapping("/check/{questionId}")
    public Result<Boolean> check(@PathVariable Long questionId, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(collectionService.isCollected(userId, questionId));
    }

    @Operation(summary = "取消收藏")
    @DeleteMapping("/{questionId}")
    public Result<Void> remove(@PathVariable Long questionId, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        collectionService.remove(userId, questionId);
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
            throw new com.kidgame.common.exception.BusinessException(com.kidgame.common.constant.ErrorCode.FORBIDDEN_OBJ, "未登录");
        }
        return userId;
    }
}
