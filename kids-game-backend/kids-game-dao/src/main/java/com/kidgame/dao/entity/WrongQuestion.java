package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 错题本实体
 */
@Data
@TableName("t_wrong_question")
public class WrongQuestion implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "wrong_id", type = IdType.AUTO)
    private Long wrongId;

    /** 儿童用户ID */
    private Long userId;

    /** 题目ID */
    private Long questionId;

    /** 学科ID（冗余） */
    private Long subjectId;

    /** 知识点ID数组（冗余，JSON） */
    private String knowledgePointIds;

    /** 错误次数 */
    private Integer wrongCount;

    /** 最近答错时间 */
    private Long lastWrongTime;

    /** 最近错误答案 */
    private String lastWrongAnswer;

    /** 掌握度：0-未掌握，1-了解，2-熟悉，3-掌握 */
    private Integer masteryLevel;

    /** 复习次数 */
    private Integer reviewCount;

    /** 最近复习时间 */
    private Long lastReviewTime;

    /** 下次推荐复习时间 */
    private Long nextReviewTime;

    /** 状态：0-已掌握移除，1-待复习，2-复习中 */
    private Integer status;

    private Long createTime;

    private Long updateTime;

    @TableLogic
    private Integer deleted;
}
