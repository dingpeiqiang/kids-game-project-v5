package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 教师练习任务实体
 */
@Data
@TableName("t_practice_assignment")
public class PracticeAssignment implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "assignment_id", type = IdType.AUTO)
    private Long assignmentId;

    /** 教师ID */
    private Long teacherId;

    /** 班级ID */
    private Long classId;

    /** 任务标题 */
    private String title;

    /** 任务说明 */
    private String description;

    /** 学科ID */
    private Long subjectId;

    /** 知识点范围（JSON） */
    private String knowledgePointIds;

    /** 难度范围 */
    private String difficultyRange;

    /** 题目数量 */
    private Integer questionCount;

    /** 指定题型（NULL为混合） */
    private String questionType;

    /** 截止时间 */
    private Long dueTime;

    /** 完成奖励游学币 */
    private Integer pointsReward;

    /** 状态：0-草稿，1-已发布，2-已截止，3-已删除 */
    private Integer status;

    private Long createTime;

    private Long updateTime;

    @TableLogic
    private Integer deleted;
}
