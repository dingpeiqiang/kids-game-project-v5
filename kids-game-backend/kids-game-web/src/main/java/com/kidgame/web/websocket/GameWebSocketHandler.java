package com.kidgame.web.websocket;

import com.alibaba.fastjson2.JSON;
import com.kidgame.common.dto.WebSocketMessage;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 游戏WebSocket处理器
 * 路径: /ws/{userId}
 */
@Slf4j
@Component
@ServerEndpoint("/ws/{userId}")
public class GameWebSocketHandler {

    /**
     * 连接建立成功调用
     */
    @OnOpen
    public void onOpen(Session session, @PathParam("userId") String userId) {
        String sessionId = session.getId();
        WebSocketSessionManager.add(sessionId, session);
        log.info("[WebSocket] 用户 {} 连接成功, sessionId: {}, 当前连接数: {}", userId, sessionId, WebSocketSessionManager.size());

        // 发送连接成功消息
        WebSocketMessage message = WebSocketMessage.builder()
                .type("connected")
                .data("WebSocket连接成功")
                .timestamp(System.currentTimeMillis())
                .build();
        session.getAsyncRemote().sendText(JSON.toJSONString(message));
    }

    /**
     * 连接关闭调用
     */
    @OnClose
    public void onClose(Session session, @PathParam("userId") String userId) {
        String sessionId = session.getId();
        WebSocketSessionManager.remove(sessionId);
        log.info("[WebSocket] 用户 {} 断开连接, sessionId: {}, 当前连接数: {}", userId, sessionId, WebSocketSessionManager.size());
    }

    /**
     * 收到客户端消息调用
     */
    @OnMessage
    public void onMessage(String message, Session session, @PathParam("userId") String userId) {
        log.info("[WebSocket] 收到用户 {} 的消息: {}", userId, message);

        try {
            // 解析消息
            WebSocketMessage wsMessage = JSON.parseObject(message, WebSocketMessage.class);
            handleMessage(session, userId, wsMessage);
        } catch (Exception e) {
            log.error("[WebSocket] 消息处理失败: {}", message, e);
            sendError(session, "消息格式错误");
        }
    }

    /**
     * 发生错误调用
     */
    @OnError
    public void onError(Session session, Throwable error, @PathParam("userId") String userId) {
        log.error("[WebSocket] 用户 {} 发生错误", userId, error);
    }

    /**
     * 处理消息
     */
    private void handleMessage(Session session, String userId, WebSocketMessage message) {
        String type = message.getType();
        Object data = message.getData();

        switch (type) {
            case "ping":
                // 心跳检测
                sendPong(session);
                break;
            case "game_state":
                // 游戏状态同步
                handleGameState(session, userId, data);
                break;
            case "control_command":
                // 控制指令
                handleControlCommand(session, userId, data);
                break;
            case "sync_request":
                // 同步请求
                handleSyncRequest(session, userId, data);
                break;
            default:
                log.warn("[WebSocket] 未知的消息类型: {}", type);
                sendError(session, "未知的消息类型: " + type);
        }
    }

    /**
     * 处理游戏状态同步
     */
    private void handleGameState(Session session, String userId, Object data) {
        log.info("[WebSocket] 处理游戏状态同步, 用户: {}, 数据: {}", userId, data);

        // 广播给所有连接的客户端
        WebSocketMessage response = WebSocketMessage.builder()
                .type("game_state_update")
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
        WebSocketSessionManager.broadcast(JSON.toJSONString(response));
    }

    /**
     * 处理控制指令
     */
    private void handleControlCommand(Session session, String userId, Object data) {
        log.info("[WebSocket] 处理控制指令, 用户: {}, 数据: {}", userId, data);

        // 回复确认
        WebSocketMessage response = WebSocketMessage.builder()
                .type("command_ack")
                .data("指令已接收")
                .timestamp(System.currentTimeMillis())
                .build();
        session.getAsyncRemote().sendText(JSON.toJSONString(response));
    }

    /**
     * 处理同步请求
     */
    private void handleSyncRequest(Session session, String userId, Object data) {
        log.info("[WebSocket] 处理同步请求, 用户: {}, 数据: {}", userId, data);

        // 发送同步数据
        WebSocketMessage response = WebSocketMessage.builder()
                .type("sync_data")
                .data("同步数据")
                .timestamp(System.currentTimeMillis())
                .build();
        session.getAsyncRemote().sendText(JSON.toJSONString(response));
    }

    /**
     * 发送心跳响应
     */
    private void sendPong(Session session) {
        WebSocketMessage message = WebSocketMessage.builder()
                .type("pong")
                .data(System.currentTimeMillis())
                .timestamp(System.currentTimeMillis())
                .build();
        session.getAsyncRemote().sendText(JSON.toJSONString(message));
    }

    /**
     * 发送错误消息
     */
    private void sendError(Session session, String errorMessage) {
        WebSocketMessage message = WebSocketMessage.builder()
                .type("error")
                .data(errorMessage)
                .timestamp(System.currentTimeMillis())
                .build();
        session.getAsyncRemote().sendText(JSON.toJSONString(message));
    }
}
