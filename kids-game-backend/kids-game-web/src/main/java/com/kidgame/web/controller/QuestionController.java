package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.Question;
import com.kidgame.service.QuestionService;
import com.kidgame.service.dto.AnswerDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @Parameter(description = "学龄") @RequestParam String grade) {
        Question question = questionService.getRandomQuestion(grade);
        return Result.success(question);
    }

    @Operation(summary = "提交答案")
    @PostMapping("/submit")
    public Result<AnswerDTO.Result> submitAnswer(@RequestBody AnswerDTO dto) {
        AnswerDTO.Result result = questionService.submitAnswer(dto);
        return Result.success(result);
    }

    @Operation(summary = "获取答题记录")
    @GetMapping("/records")
    public Result<List<AnswerRecord>> getAnswerRecords(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @Parameter(description = "数量限制") @RequestParam(required = false, defaultValue = "20") Integer limit) {
        List<AnswerRecord> records = questionService.getAnswerRecords(kidId, limit);
        return Result.success(records);
    }
}
