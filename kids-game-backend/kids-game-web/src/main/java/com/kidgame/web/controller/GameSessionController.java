package com.kidgame.web.controller;

import com.kidgame.common.annotation.RequireLogin;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.GameSession;
import com.kidgame.web.request.StartGameRequest;
import com.kidgame.web.request.SubmitGameResultRequest;
import com.kidgame.web.service.GameSessionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 游戏会话控制器
 * 处理游戏会话的创建、结果提交等操作
 */
@Slf4j
@RestController
@RequestMapping("/api/game/session")
@RequireLogin
public class GameSessionController {

    @Autowired
    private GameSessionService gameSessionService;

    /**
     * 启动游戏会话
     * 前端调用此接口创建游戏会话，获取 session_token
     */
    @PostMapping("/start")
    public Result<GameSession> startGame(@RequestBody StartGameRequest request, HttpServletRequest httpRequest) {
        try {
            // 从请求属性中获取当前用户 ID（由 JwtInterceptor 设置）
            String userIdStr = (String) httpRequest.getAttribute("userId");
            Long userId = Long.valueOf(userIdStr);

            // 添加详细日志
            log.info("[GameSession] 用户 {} 启动游戏，请求数据: gameId={}", userId, request.getGameId());

            if (request.getGameId() == null) {
                log.error("[GameSession] gameId 为 null，请求体解析失败");
                return Result.error("游戏ID不能为空");
            }

            GameSession session = gameSessionService.startGame(userId, request.getGameId());
            return Result.success(session);

        } catch (Exception e) {
            log.error("[GameSession] 启动游戏失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 提交游戏结果
     * 游戏结束后，前端将结果提交到后端
     */
    @PostMapping("/{sessionId}/result")
    public Result<Void> submitResult(
            @PathVariable Long sessionId,
            @RequestBody SubmitGameResultRequest request) {
    
        try {
            // 验证 session_token
            if (!sessionId.equals(request.getSessionId())) {
                return Result.error("会话 ID 不匹配");
            }
    
            log.info("[GameSession] 提交游戏结果，会话 ID: {}, 分数: {}", sessionId, request.getScore());
    
            gameSessionService.submitResult(request.getSessionToken(), request);
            return Result.success();
    
        } catch (Exception e) {
            log.error("[GameSession] 提交游戏结果失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 结束会话
     * 用户主动退出或超时时调用
     */
    @PostMapping("/{sessionId}/end")
    public Result<Void> endSession(@PathVariable Long sessionId) {
        try {
            log.info("[GameSession] 结束会话，会话 ID: {}", sessionId);
            gameSessionService.endSession(sessionId);
            return Result.success();

        } catch (Exception e) {
            log.error("[GameSession] 结束会话失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取会话信息（通过 session_token）
     */
    @GetMapping("/token/{token}")
    public Result<GameSession> getSessionByToken(@PathVariable String token) {
        try {
            GameSession session = gameSessionService.getSessionByToken(token);
            if (session == null) {
                return Result.error("会话不存在");
            }
            return Result.success(session);

        } catch (Exception e) {
            log.error("[GameSession] 获取会话失败", e);
            return Result.error(e.getMessage());
        }
    }
}
