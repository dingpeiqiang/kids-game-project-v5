package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_sign_in_reward_config")
public class SignInRewardConfig implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long configId;
    private Integer dayIndex;
    private Integer coinsReward;
    private Integer studyCoinsReward;
    private Integer expReward;
    private Integer enabled;
    private Long updateTime;
}