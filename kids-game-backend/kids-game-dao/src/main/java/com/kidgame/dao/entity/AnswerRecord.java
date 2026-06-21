package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 答题记录实体
 */
@Data
@TableName("t_answer_record")
public class AnswerRecord implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 记录ID
     */
    @TableId(value = "record_id", type = IdType.AUTO)
    private Long recordId;

    /**
     * 儿童用户ID（映射 user_id 列；保留 kidId 字段名以向后兼容）
     */
    @TableField("user_id")
    private Long kidId;

    /**
     * 题目ID
     */
    private Long questionId;

    /**
     * 每日练习会话ID（t_daily_session.session_id）
     */
    private Long sessionId;

    /**
     * 学科ID（冗余便于统计）
     */
    private Long subjectId;

    /**
     * 本题知识点ID数组（冗余便于统计，JSON）
     */
    private String knowledgePointIds;

    /**
     * 题型（冗余）
     */
    private String questionType;

    /**
     * 难度（冗余）
     */
    private Integer difficulty;

    /**
     * 用户答案
     */
    private String userAnswer;

    /**
     * 是否正确：0-错误，1-正确
     */
    private Integer isCorrect;

    /**
     * 是否标记：0-否，1-是
     */
    private Integer isMarked;

    /**
     * 是否收藏：0-否，1-是
     */
    private Integer isCollected;

    /**
     * 是否错题：0-否，1-是（错题本来源）
     */
    private Integer isWrong;

    /**
     * 获得游学币
     */
    private Integer getPoints;

    /**
     * 答题时间（秒）
     */
    private Integer answerTime;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;
}
