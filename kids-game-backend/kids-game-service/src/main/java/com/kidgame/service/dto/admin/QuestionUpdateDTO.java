package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;

/**
 * 更新题目请求 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class QuestionUpdateDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 学科 ID
     */
    private Long subjectId;

    /**
     * 题目内容
     */
    private String content;

    /**
     * 选项（JSON 数组字符串）
     */
    private String options;

    /**
     * 正确答案
     */
    private String correctAnswer;

    /**
     * 答案解析
     */
    private String analysis;

    /**
     * 适龄阶段
     */
    private String grade;

    /**
     * 题型：choice-选择，fill-填空，judgment-判断
     */
    private String type;

    /**
     * 难度：1-5
     */
    private Integer difficulty;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;
}
