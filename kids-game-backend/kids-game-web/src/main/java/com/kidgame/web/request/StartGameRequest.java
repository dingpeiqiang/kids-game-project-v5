package com.kidgame.web.request;

import lombok.Data;

/**
 * 启动游戏请求
 */
@Data
public class StartGameRequest {
    /**
     * 游戏 ID
     */
    private Long gameId;
}
