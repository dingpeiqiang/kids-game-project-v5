package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 班级实体
 */
@Data
@TableName("t_class")
public class SchoolClass implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "class_id", type = IdType.AUTO)
    private Long classId;

    /** 班级名称 */
    private String className;

    /** 年级 */
    private String grade;

    /** 学年（如 2025-2026） */
    private String schoolYear;

    /** 创建者ID（教师） */
    private Long creatorId;

    /** 邀请码 */
    private String inviteCode;

    /** 班级描述 */
    private String description;

    /** 状态：0-已解散，1-正常 */
    private Integer status;

    private Long createTime;

    private Long updateTime;

    @TableLogic
    private Integer deleted;
}
