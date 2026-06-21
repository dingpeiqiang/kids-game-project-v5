package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 知识点实体（树形结构）
 */
@Data
@TableName("t_knowledge_point")
public class KnowledgePoint implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "knowledge_point_id", type = IdType.AUTO)
    private Long knowledgePointId;

    /** 学科ID */
    private Long subjectId;

    /** 父知识点ID（NULL为根节点） */
    private Long parentId;

    /** 知识点编码（同学科内唯一） */
    private String code;

    /** 知识点名称 */
    private String name;

    /** 所属章节 */
    private String chapter;

    /** 知识点描述 */
    private String description;

    /** 排序 */
    private Integer sortOrder;

    /** 状态：0-禁用，1-启用 */
    private Integer status;

    private Long createTime;

    private Long updateTime;

    @TableLogic
    private Integer deleted;
}
