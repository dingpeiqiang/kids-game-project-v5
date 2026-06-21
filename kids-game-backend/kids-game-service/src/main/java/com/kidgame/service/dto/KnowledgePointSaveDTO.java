package com.kidgame.service.dto;

import lombok.Data;

/**
 * 知识点保存请求
 */
@Data
public class KnowledgePointSaveDTO {

    private Long knowledgePointId;

    /** 学科ID */
    private Long subjectId;

    /** 父知识点ID（null 为根节点） */
    private Long parentId;

    /** 知识点编码 */
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
}
