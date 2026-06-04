package com.kidgame.web.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.kidgame.common.annotation.RequireLogin;
import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.GameComment;
import com.kidgame.dao.entity.Kid;
import com.kidgame.service.GameCommentService;
import com.kidgame.service.KidService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 游戏评论控制器
 */
@Slf4j
@Tag(name = "游戏评论", description = "游戏评论相关接口")
@RestController
@RequestMapping("/api/game")
public class GameCommentController {

    @Autowired
    private GameCommentService gameCommentService;

    @Autowired
    private KidService kidService;

    @Operation(summary = "提交游戏评论")
    @RequireLogin
    @PostMapping("/{gameId}/comment")
    public Result<Map<String, Object>> submitComment(
            @Parameter(description = "游戏ID") @PathVariable Long gameId,
            @Parameter(description = "评论内容") @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {
        try {
            // 从请求上下文中获取当前登录用户信息
            String userIdStr = (String) request.getAttribute("userId");
            Long userId = userIdStr != null ? Long.parseLong(userIdStr) : null;
            Integer userType = (Integer) request.getAttribute("userType");  // 0=KID, 1=PARENT, 2=ADMIN

            // 验证用户类型（必须是儿童用户，userType=0）
            if (userType == null || userType != 0) {
                return Result.error("只有儿童用户可以发表评论");
            }

            String content = (String) requestBody.get("content");
            Integer score = (Integer) requestBody.get("score");

            GameComment comment = gameCommentService.addComment(userId, gameId, content, score);

            // 获取用户信息
            Kid kid = kidService.getById(userId);
            String nickname = kid != null ? kid.getNickname() : null;
            String username = kid != null ? kid.getUsername() : null;

            Map<String, Object> result = new HashMap<>();
            result.put("id", comment.getCommentId().toString());
            result.put("gameId", comment.getGameId());
            result.put("userId", comment.getUserId());
            result.put("username", username);
            result.put("nickname", nickname);
            result.put("content", comment.getContent());
            result.put("score", comment.getScore());
            result.put("createdAt", comment.getCreateTime());

            return Result.success(result);
        } catch (Exception e) {
            log.error("提交评论失败. GameId: {}", gameId, e);
            return Result.error("提交评论失败：" + e.getMessage());
        }
    }

    @Operation(summary = "获取游戏评论列表")
    @GetMapping("/{gameId}/comments")
    public Result<List<Map<String, Object>>> getComments(
            @Parameter(description = "游戏ID") @PathVariable Long gameId,
            @Parameter(description = "页码（从0开始）") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "20") int size) {
        try {
            IPage<GameComment> commentPage = gameCommentService.getCommentsByGameId(gameId, page, size);
            List<GameComment> comments = commentPage.getRecords();

            List<Map<String, Object>> result = comments.stream().map(comment -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", comment.getCommentId().toString());
                map.put("gameId", comment.getGameId());
                map.put("userId", comment.getUserId());

                // 获取用户信息
                Kid kid = kidService.getById(comment.getUserId());
                String nickname = kid != null ? kid.getNickname() : null;
                String username = kid != null ? kid.getUsername() : null;

                map.put("username", username);
                map.put("nickname", nickname);
                map.put("content", comment.getContent());
                map.put("score", comment.getScore());
                map.put("createdAt", comment.getCreateTime());
                return map;
            }).toList();

            return Result.success(result);
        } catch (Exception e) {
            log.error("获取评论列表失败. GameId: {}", gameId, e);
            return Result.error("获取评论列表失败：" + e.getMessage());
        }
    }

    @Operation(summary = "获取游戏评论统计")
    @GetMapping("/{gameId}/comment-stats")
    public Result<Map<String, Object>> getCommentStats(
            @Parameter(description = "游戏ID") @PathVariable Long gameId) {
        try {
            int count = gameCommentService.getCommentCount(gameId);
            Double avgScore = gameCommentService.getAvgScore(gameId);

            Map<String, Object> result = new HashMap<>();
            result.put("commentCount", count);
            result.put("avgScore", avgScore != null ? avgScore : 0);

            return Result.success(result);
        } catch (Exception e) {
            log.error("获取评论统计失败. GameId: {}", gameId, e);
            return Result.error("获取评论统计失败：" + e.getMessage());
        }
    }
}