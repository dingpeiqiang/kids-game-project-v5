package com.kidgame.service.dto;

import lombok.Data;

/**
 * 班级保存请求
 */
@Data
public class ClassSaveDTO {

    private Long classId;

    /** 班级名称 */
    private String className;

    /** 年级 */
    private String grade;

    /** 学年（如 2025-2026） */
    private String schoolYear;

    /** 班级描述 */
    private String description;
}
