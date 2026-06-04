package com.kidgame.service.dto;

import lombok.Data;

/**
 * 开始游戏请求
 */
@Data
public class GameStartDTO {

    /**
     * 用户ID（儿童或家长）
     */
    private Long userId;

    /**
     * 游戏ID
     */
    private Long gameId;
}
