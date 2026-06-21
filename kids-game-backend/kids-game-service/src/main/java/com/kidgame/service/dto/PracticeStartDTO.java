package com.kidgame.service.dto;

import lombok.Data;

import java.util.List;

/**
 * 开始每日练习会话请求
 */
@Data
public class PracticeStartDTO {

    /** 学科ID（null 为综合） */
    private Long subjectId;

    /** 知识点ID范围（null 为不限） */
    private List<Long> knowledgePointIds;

    /** 难度范围：ALL/EASY/MEDIUM/HARD */
    private String difficultyRange;

    /** 题目数量（默认 5） */
    private Integer questionCount;

    /** 题型限制（null 为混合） */
    private String questionType;

    /** 来源：DAILY/RECOMMEND/WRONG_REVIEW/ASSIGNMENT */
    private String source;

    /** 来源ID（如任务ID） */
    private Long sourceId;
}
