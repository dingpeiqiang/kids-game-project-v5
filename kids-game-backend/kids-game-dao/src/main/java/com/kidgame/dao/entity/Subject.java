package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 学科表
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_subject")
public class Subject implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 学科ID
     */
    @TableId(value = "subject_id", type = IdType.AUTO)
    private Long subjectId;

    /**
     * 学科编码
     */
    private String subjectCode;

    /**
     * 学科名称
     */
    private String subjectName;

    /**
     * 学科图标
     */
    private String iconUrl;

    /**
     * 学科描述
     */
    private String description;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 状态：0-禁用, 1-启用
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
