package com.kidgame.service.dto;

import lombok.Data;

/**
 * 题目创建/更新请求
 */
@Data
public class QuestionSaveDTO {

    private Long questionId;

    private String content;

    /**
     * 选项 JSON 数组字符串，如 ["A","B","C","D"]
     */
    private String options;

    private String correctAnswer;

    private String analysis;

    private String grade;

    /**
     * choice / fill / judgment
     */
    private String type;

    private Integer difficulty;

    /**
     * 0-禁用 1-启用
     */
    private Integer status;
}