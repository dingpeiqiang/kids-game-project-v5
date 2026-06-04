package com.kidgame.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebSocket消息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {

    /**
     * 消息类型
     */
    private String type;

    /**
     * 消息数据
     */
    private Object data;

    /**
     * 时间戳
     */
    private Long timestamp;
}
