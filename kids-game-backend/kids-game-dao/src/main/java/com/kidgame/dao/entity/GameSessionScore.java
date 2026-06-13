package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_game_session_score")
public class GameSessionScore implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long gameId;
    private Long userId;
    private String username;
    private String nickname;
    private String avatar;
    private Integer score;
    private Integer levelReached;
    private Long createTime;
    @TableLogic
    private Integer deleted;
}