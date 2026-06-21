package com.kidgame.service.dto;

import lombok.Data;

import java.util.List;

/**
 * 教师布置练习任务请求
 */
@Data
public class AssignmentSaveDTO {

    private Long assignmentId;

    /** 班级ID */
    private Long classId;

    /** 任务标题 */
    private String title;

    /** 任务说明 */
    private String description;

    /** 学科ID */
    private Long subjectId;

    /** 知识点范围 */
    private List<Long> knowledgePointIds;

    /** 难度范围 */
    private String difficultyRange;

    /** 题目数量 */
    private Integer questionCount;

    /** 指定题型（null 为混合） */
    private String questionType;

    /** 截止时间（毫秒时间戳） */
    private Long dueTime;

    /** 完成奖励游学币 */
    private Integer pointsReward;

    /** 状态：0-草稿，1-发布 */
    private Integer status;
}
