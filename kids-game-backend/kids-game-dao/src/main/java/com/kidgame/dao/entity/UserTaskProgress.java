package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_user_task_progress")
public class UserTaskProgress implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long taskId;
    private Integer progress;
    /** 0进行中 1可领取 2已领取 */
    private Integer status;
    private String periodKey;
    private Long claimedTime;
    private Long updateTime;
}