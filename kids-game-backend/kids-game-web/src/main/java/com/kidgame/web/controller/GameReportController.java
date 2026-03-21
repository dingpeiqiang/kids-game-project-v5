package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 游戏成绩上报控制器
 * 用于独立部署模式的游戏向平台提交成绩
 */
@Slf4j
@Tag(name = "游戏成绩管理", description = "游戏成绩上报相关接口")
@RestController
@RequestMapping("/api/game")
public class GameReportController {

    /**
     * 游戏成绩上报请求
     */
    @Data
    public static class GameReportRequest {
        @Parameter(description = "会话 Token")
        private String sessionToken;
        
        @Parameter(description = "得分")
        private Integer score;
        
        @Parameter(description = "游戏时长（秒）")
        private Long duration;
        
        @Parameter(description = "关卡")
        private Integer level;
        
        @Parameter(description = "是否胜利")
        private Boolean isWin;
        
        @Parameter(description = "详细信息")
        private java.util.Map<String, Object> details;
    }

    /**
     * 游戏成绩上报响应
     */
    @Data
    public static class GameReportResponse {
        @Parameter(description = "消耗的疲劳点数")
        private Integer consumePoints;
        
        @Parameter(description = "会话 ID")
        private Long sessionId;
        
        @Parameter(description = "用户 ID")
        private Long userId;
        
        @Parameter(description = "游戏 ID")
        private Long gameId;
    }

    @Operation(summary = "游戏成绩上报", description = "独立部署模式的游戏向平台提交成绩，需要消耗疲劳点数")
    @PostMapping("/report")
    public Result<GameReportResponse> reportGameResult(@RequestBody GameReportRequest request) {
        try {
            log.info("收到游戏成绩上报请求：sessionToken={}, score={}, duration={}", 
                request.getSessionToken(), request.getScore(), request.getDuration());

            // 验证 sessionToken 有效性
            if (request.getSessionToken() == null || request.getSessionToken().trim().isEmpty()) {
                return Result.error("sessionToken 不能为空");
            }

            // TODO: 实现具体的成绩上报逻辑
            // 1. 验证 sessionToken 有效性
            // 2. 获取会话信息（userId, gameId, sessionId）
            // 3. 检查用户疲劳度是否足够
            // 4. 扣除疲劳度并记录成绩
            // 5. 更新排行榜等信息

            // 临时实现：返回成功，但不实际处理
            log.warn("⚠️ 成绩上报功能暂未完全实现，仅返回成功响应");
            
            GameReportResponse response = new GameReportResponse();
            response.setConsumePoints(0); // 暂时不消耗疲劳点
            response.setSessionId(0L);
            response.setUserId(0L);
            response.setGameId(0L);

            return Result.success(response);
        } catch (Exception e) {
            log.error("游戏成绩上报失败：sessionToken={}, score={}, duration={}", 
                request.getSessionToken(), request.getScore(), request.getDuration(), e);
            return Result.error("成绩上报失败：" + e.getMessage());
        }
    }
}
