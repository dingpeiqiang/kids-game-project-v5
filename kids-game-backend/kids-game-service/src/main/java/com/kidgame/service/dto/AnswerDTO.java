package com.kidgame.service.dto;

import lombok.Data;

/**
 * 答题请求
 */
@Data
public class AnswerDTO {

    /**
     * 儿童ID
     */
    private Long kidId;

    /**
     * 题目ID
     */
    private Long questionId;

    /**
     * 用户答案
     */
    private String userAnswer;

    /**
     * 答题时间（秒）
     */
    private Integer answerTime;

    /**
     * 答题结果
     */
    @Data
    public static class Result {
        /**
         * 是否正确
         */
        private Boolean isCorrect;

        /**
         * 正确答案
         */
        private String correctAnswer;

        /**
         * 答案解析
         */
        private String analysis;

        /**
         * 获得疲劳点
         */
        private Integer getPoints;

        /**
         * 当前剩余疲劳点
         */
        private Integer currentPoints;
    }
}
