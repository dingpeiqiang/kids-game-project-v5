package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 题目实体
 */
@Data
@TableName("t_question")
public class Question implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 题目ID
     */
    @TableId(value = "question_id", type = IdType.AUTO)
    private Long questionId;

    /**
     * 题目内容
     */
    private String content;

    /**
     * 选项（JSON数组）
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
     * 题型（choice/填空/judgment）
     */
    private String type;

    /**
     * 难度（1-5）
     */
    private Integer difficulty;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;
}
