package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_game_economy_config")
public class GameEconomyConfig implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long gameId;
    private Integer studyCoinCost;
    private String levelRewardsJson;
    private Integer enabled;
    private Long updateTime;
}