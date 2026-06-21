package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * 每日练习会话实体
 */
@Data
@TableName("t_daily_session")
public class DailySession implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "session_id", type = IdType.AUTO)
    private Long sessionId;

    /** 儿童用户ID */
    private Long userId;

    /** 会话日期 */
    private LocalDate sessionDate;

    /** 学科ID（NULL为综合） */
    private Long subjectId;

    /** 本次练习知识点范围（JSON） */
    private String knowledgePointIds;

    /** 难度范围：ALL/EASY/MEDIUM/HARD */
    private String difficultyRange;

    /** 本次题目总数 */
    private Integer totalCount;

    /** 已答题数 */
    private Integer answeredCount;

    /** 答对题数 */
    private Integer correctCount;

    /** 本次获得游学币 */
    private Integer pointsEarned;

    /** 本次用时（秒） */
    private Integer duration;

    /** 来源：DAILY-每日练习，RECOMMEND-推荐练习，WRONG_REVIEW-错题复习，ASSIGNMENT-教师任务 */
    private String source;

    /** 来源ID（如任务ID） */
    private Long sourceId;

    /** 状态：0-进行中，1-已完成，2-已放弃 */
    private Integer status;

    /** 开始时间 */
    private Long startTime;

    /** 结束时间 */
    private Long endTime;

    private Long createTime;

    private Long updateTime;

    @TableLogic
    private Integer deleted;
}
