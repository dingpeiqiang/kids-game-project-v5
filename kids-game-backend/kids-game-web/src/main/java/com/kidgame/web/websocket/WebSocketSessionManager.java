package com.kidgame.web.websocket;

import jakarta.websocket.Session;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket Session 管理器
 */
public class WebSocketSessionManager {

    private static final Map<String, Session> sessions = new ConcurrentHashMap<>();

    /**
     * 添加 session
     */
    public static void add(String sessionId, Session session) {
        sessions.put(sessionId, session);
    }

    /**
     * 移除 session
     */
    public static void remove(String sessionId) {
        sessions.remove(sessionId);
    }

    /**
     * 获取 session
     */
    public static Session get(String sessionId) {
        return sessions.get(sessionId);
    }

    /**
     * 获取所有 session
     */
    public static Map<String, Session> getAll() {
        return sessions;
    }

    /**
     * 发送消息给指定 session
     */
    public static void send(String sessionId, String message) {
        Session session = sessions.get(sessionId);
        if (session != null && session.isOpen()) {
            session.getAsyncRemote().sendText(message);
        }
    }

    /**
     * 广播消息给所有 session
     */
    public static void broadcast(String message) {
        sessions.values().forEach(session -> {
            if (session.isOpen()) {
                session.getAsyncRemote().sendText(message);
            }
        });
    }

    /**
     * 获取连接数
     */
    public static int size() {
        return sessions.size();
    }
}
