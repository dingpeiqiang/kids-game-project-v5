package com.kidgame.service.dto;

import lombok.Data;

/**
 * 学科保存请求
 */
@Data
public class SubjectSaveDTO {

    private Long subjectId;

    /** 学科编码 */
    private String subjectCode;

    /** 学科名称 */
    private String subjectName;

    /** 学科图标 */
    private String iconUrl;

    /** 学科描述 */
    private String description;

    /** 排序 */
    private Integer sortOrder;

    /** 状态：0-禁用，1-启用 */
    private Integer status;
}
