package com.kidgame.web.controller;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.model.PageResult;
import com.kidgame.common.util.JwtAuthHelper;
import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.Question;
import com.kidgame.service.QuestionService;
import com.kidgame.service.dto.AnswerDTO;
import com.kidgame.service.dto.QuestionSaveDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;
import java.util.Map;


/**
 * 题目控制器
 */
@Tag(name = "答题管理", description = "答题相关接口")
@RestController
@RequestMapping("/api/question")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @Operation(summary = "获取随机题目")
    @GetMapping("/random")
    public Result<Question> getRandomQuestion(
            @Parameter(description = "学龄") @RequestParam String grade,
            @Parameter(description = "本会话已做题目ID，逗号分隔，避免重复") @RequestParam(required = false) String excludeIds,
            HttpServletRequest request) {
        List<Long> exclude = parseExcludeIds(excludeIds);
        Question question = questionService.getRandomQuestion(grade, exclude);
        return Result.success(question);
    }

    @Operation(summary = "提交答案")
    @PostMapping("/submit")
    public Result<AnswerDTO.Result> submitAnswer(@RequestBody AnswerDTO dto, HttpServletRequest request) {
        Long tokenKidId = JwtAuthHelper.resolveKidId(request);
        if (tokenKidId != null && dto.getKidId() != null && !tokenKidId.equals(dto.getKidId())) {
            return Result.error(ErrorCode.FORBIDDEN, "无权为该儿童提交答题");
        }
        if (dto.getKidId() == null && tokenKidId != null) {
            dto.setKidId(tokenKidId);
        }
        AnswerDTO.Result result = questionService.submitAnswer(dto);
        return Result.success(result);
    }

    @Operation(summary = "获取答题记录")
    @GetMapping("/records")
    public Result<List<AnswerRecord>> getAnswerRecords(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @Parameter(description = "数量限制") @RequestParam(required = false, defaultValue = "20") Integer limit,
            HttpServletRequest request) {
        JwtAuthHelper.assertKidSelf(kidId, request);
        List<AnswerRecord> records = questionService.getAnswerRecords(kidId, limit);
        return Result.success(records);
    }

    @Operation(summary = "今日答题已获得游学币")
    @GetMapping("/today-points")
    public Result<Integer> getTodayAnswerPoints(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            HttpServletRequest request) {
        JwtAuthHelper.assertKidSelf(kidId, request);
        return Result.success(questionService.getTodayAnswerPoints(kidId));
    }

    @Operation(summary = "分页查询题目（管理端）")
    @GetMapping("/page")
    public Result<PageResult<Question>> pageQuestions(
            @Parameter(description = "学龄") @RequestParam(required = false) String grade,
            @Parameter(description = "题型") @RequestParam(required = false) String type,
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Long page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "10") Long size,
            HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        return Result.success(questionService.pageQuestions(grade, type, status, page, size));
    }

    @Operation(summary = "题目详情（管理端）")
    @GetMapping("/{questionId}")
    public Result<Question> getQuestionDetail(
            @Parameter(description = "题目ID") @PathVariable Long questionId,
            HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        return Result.success(questionService.getQuestionDetail(questionId));
    }

    @Operation(summary = "创建题目")
    @PostMapping
    public Result<Question> createQuestion(@RequestBody QuestionSaveDTO dto, HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        return Result.success(questionService.createQuestion(dto));
    }

    @Operation(summary = "更新题目")
    @PutMapping("/{questionId}")
    public Result<Question> updateQuestion(
            @PathVariable Long questionId,
            @RequestBody QuestionSaveDTO dto,
            HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        dto.setQuestionId(questionId);
        return Result.success(questionService.updateQuestion(dto));
    }

    @Operation(summary = "删除题目")
    @DeleteMapping("/{questionId}")
    public Result<Void> deleteQuestion(@PathVariable Long questionId, HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        questionService.deleteQuestion(questionId);
        return Result.success();
    }

    @Operation(summary = "批量更新题目状态")
    @PutMapping("/batch-status")
    public Result<Integer> batchUpdateStatus(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        JwtAuthHelper.assertAdmin(request);
        @SuppressWarnings("unchecked")
        List<Long> ids = (List<Long>) body.get("questionIds");
        Integer status = body.get("status") instanceof Number
                ? ((Number) body.get("status")).intValue()
                : null;
        return Result.success(questionService.batchUpdateStatus(ids, status));
    }

    private static List<Long> parseExcludeIds(String excludeIds) {
        if (!StringUtils.hasText(excludeIds)) {
            return Collections.emptyList();
        }
        List<Long> ids = new java.util.ArrayList<>();
        for (String part : excludeIds.split(",")) {
            String t = part.trim();
            if (!StringUtils.hasText(t)) {
                continue;
            }
            try {
                ids.add(Long.parseLong(t));
            } catch (NumberFormatException ignored) {
                // skip invalid segment
            }
        }
        return ids;
    }
}
