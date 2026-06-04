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
     * 儿童ID
     */
    private Long kidId;

    /**
     * 题目ID
     */
    private Long questionId;

    /**
     * 用户答案
     */
    private String userAnswer;

    /**
     * 是否正确
     */
    private Integer isCorrect;

    /**
     * 获得疲劳点
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
