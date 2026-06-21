package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 任务完成情况实体
 */
@Data
@TableName("t_assignment_completion")
public class AssignmentCompletion implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "completion_id", type = IdType.AUTO)
    private Long completionId;

    /** 任务ID */
    private Long assignmentId;

    /** 学生ID */
    private Long studentId;

    /** 关联的练习会话ID */
    private Long sessionId;

    /** 任务题目数 */
    private Integer totalCount;

    /** 已答题数 */
    private Integer answeredCount;

    /** 答对题数 */
    private Integer correctCount;

    /** 获得游学币 */
    private Integer pointsEarned;

    /** 用时（秒） */
    private Integer duration;

    /** 完成状态：0-未开始，1-进行中，2-已完成 */
    private Integer finishStatus;

    /** 完成时间 */
    private Long finishTime;

    private Long createTime;

    private Long updateTime;

    @TableLogic
    private Integer deleted;
}
