package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_task_definition")
public class TaskDefinition implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long taskId;
    private String taskCode;
    private String taskName;
    private String taskDesc;
    private String taskType;
    private Integer targetValue;
    private String metric;
    private Integer coinsReward;
    private Integer expReward;
    private String ownerType;
    private Long ownerId;
    private Long kidId;
    private Integer enabled;
    private Integer sortOrder;
    private Long createTime;
    private Long updateTime;
    @TableLogic
    private Integer deleted;
}