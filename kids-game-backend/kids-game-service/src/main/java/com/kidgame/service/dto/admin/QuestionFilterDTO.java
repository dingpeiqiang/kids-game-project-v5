package com.kidgame.service.dto.admin;

import lombok.Data;

/**
 * 题目筛选条件 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class QuestionFilterDTO {

    /**
     * 题目内容（模糊搜索）
     */
    private String content;

    /**
     * 学科 ID
     */
    private Long subjectId;

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

    /**
     * 页码
     */
    private Integer page = 1;

    /**
     * 每页数量
     */
    private Integer size = 10;
}
