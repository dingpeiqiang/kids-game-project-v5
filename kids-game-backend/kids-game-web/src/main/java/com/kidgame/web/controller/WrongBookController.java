package com.kidgame.web.controller;

import com.kidgame.common.model.PageResult;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.dao.entity.Question;
import com.kidgame.dao.entity.WrongQuestion;
import com.kidgame.service.QuestionService;
import com.kidgame.service.WrongBookService;
import com.kidgame.service.util.QuestionAnswerEvaluator;
import com.kidgame.service.util.QuestionAnswerEvaluator.QuestionContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 错题本控制器
 */
@Tag(name = "错题本管理", description = "错题本相关接口")
@RestController
@RequestMapping("/api/wrong-book")
public class WrongBookController {

    @Autowired
    private WrongBookService wrongBookService;

    @Autowired
    private QuestionService questionService;

    @Operation(summary = "分页查询错题")
    @GetMapping("/page")
    public Result<PageResult<WrongQuestion>> page(
            @Parameter(description = "学科ID") @RequestParam(required = false) Long subjectId,
            @Parameter(description = "掌握度") @RequestParam(required = false) Integer masteryLevel,
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Long page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "10") Long size,
            HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(wrongBookService.page(userId, subjectId, masteryLevel, status, page, size));
    }

    @Operation(summary = "待复习错题列表")
    @GetMapping("/due-review")
    public Result<List<WrongQuestion>> listDueReview(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(wrongBookService.listDueReview(userId));
    }

    @Operation(summary = "复习错题")
    @PostMapping("/review")
    public Result<WrongQuestion> review(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        Long questionId = body.get("questionId") instanceof Number
                ? ((Number) body.get("questionId")).longValue() : null;
        String userAnswer = body.get("userAnswer") != null ? body.get("userAnswer").toString() : null;
        if (questionId == null) {
            return Result.error(400, "题目ID不能为空");
        }
        // 判分
        boolean isCorrect = evaluateAnswer(questionId, userAnswer);
        return Result.success(wrongBookService.review(userId, questionId, userAnswer, isCorrect));
    }

    @Operation(summary = "标记已掌握")
    @PostMapping("/{questionId}/mastered")
    public Result<Void> markMastered(@PathVariable Long questionId, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        wrongBookService.markMastered(userId, questionId);
        return Result.success();
    }

    @Operation(summary = "移出错题本")
    @DeleteMapping("/{questionId}")
    public Result<Void> remove(@PathVariable Long questionId, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        wrongBookService.remove(userId, questionId);
        return Result.success();
    }

    @Operation(summary = "错题统计")
    @GetMapping("/stats")
    public Result<Map<String, Object>> stats(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return Result.success(wrongBookService.stats(userId));
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

    private boolean evaluateAnswer(Long questionId, String userAnswer) {
        if (userAnswer == null || userAnswer.isEmpty()) {
            return false;
        }
        Question question = questionService.getById(questionId);
        if (question == null) {
            return false;
        }
        QuestionContext ctx = new QuestionContext(
                question.getType(),
                question.getOptions(),
                question.getCorrectAnswer(),
                question.getFillConfig(),
                question.getShortAnswerKeywords(),
                question.getAnswerMode());
        return QuestionAnswerEvaluator.isCorrect(ctx, userAnswer);
    }
}
