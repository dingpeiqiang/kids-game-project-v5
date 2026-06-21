package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 题目收藏实体
 */
@Data
@TableName("t_collection")
public class QuestionCollection implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "collection_id", type = IdType.AUTO)
    private Long collectionId;

    /** 用户ID */
    private Long userId;

    /** 题目ID */
    private Long questionId;

    /** 收藏笔记 */
    private String note;

    private Long createTime;

    @TableLogic
    private Integer deleted;
}
