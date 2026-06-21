package com.kidgame.service.dto;

import lombok.Data;

/**
 * 答题请求
 */
@Data
public class AnswerDTO {

    /** 儿童ID */
    private Long kidId;

    /** 题目ID */
    private Long questionId;

    /** 用户答案 */
    private String userAnswer;

    /** 答题时间（秒） */
    private Integer answerTime;

    /** 每日练习会话ID */
    private Long sessionId;

    /** 是否标记本题 */
    private Boolean marked;

    /** 是否收藏本题 */
    private Boolean collected;

    /** 答题结果 */
    @Data
    public static class Result {
        /** 是否正确 */
        private Boolean isCorrect;

        /** 正确答案（规范化后） */
        private String correctAnswer;

        /** 答案解析 */
        private String analysis;

        /** 获得游学币 */
        private Integer getPoints;

        /** 当前剩余游学币 */
        private Integer currentPoints;

        /** 题型 */
        private String questionType;

        /** 知识点ID数组（JSON） */
        private String knowledgePoints;

        /** 是否已加入错题本 */
        private Boolean addedToWrongBook;

        /** 简答题关键词匹配提示（仅简答题返回） */
        private java.util.List<String> matchedKeywords;
    }
}
