package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 班级成员实体
 */
@Data
@TableName("t_class_member")
public class ClassMember implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "member_id", type = IdType.AUTO)
    private Long memberId;

    /** 班级ID */
    private Long classId;

    /** 用户ID */
    private Long userId;

    /** 角色：TEACHER-教师，STUDENT-学生 */
    private String role;

    /** 加入时间 */
    private Long joinTime;

    /** 状态：0-已退出，1-正常 */
    private Integer status;

    private Long createTime;

    private Long updateTime;

    @TableLogic
    private Integer deleted;
}
