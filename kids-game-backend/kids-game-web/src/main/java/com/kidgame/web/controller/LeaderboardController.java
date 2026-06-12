package com.kidgame.web.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.service.GameService;
import com.kidgame.service.LeaderboardService;
import com.kidgame.service.dto.BatchRankRequest;
import com.kidgame.service.vo.UserRankVO;
import com.kidgame.service.util.LeaderboardUtil;
import io.jsonwebtoken.Claims;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 排行榜Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private LeaderboardUtil leaderboardUtil;

    @Autowired
    private BaseUserMapper baseUserMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private GameService gameService;

    /**
     * 排行榜条目VO
     */
    @Data
    public static class LeaderboardEntryVO {
        private Integer rank;       // 排名
        private Long userId;       // 用户ID
        private String username;   // 用户名
        private String nickname;   // 昵称
        private String avatar;     // 头像
        private Long score;        // 分数
        private Object extraData;  // 额外数据

        public LeaderboardEntryVO(Integer rank, Long userId, String username, String nickname,
                                  String avatar, Long score, Object extraData) {
            this.rank = rank;
            this.userId = userId;
            this.username = username;
            this.nickname = nickname;
            this.avatar = avatar;
            this.score = score;
            this.extraData = extraData;
        }
    }

    /**
     * 分数上报请求
     */
    @Data
    public static class SubmitScoreRequest {
        @com.fasterxml.jackson.annotation.JsonProperty("gameId")
        private Long gameId;         // 游戏ID
        @com.fasterxml.jackson.annotation.JsonProperty("score")
        private Integer score;       // 分数
        @com.fasterxml.jackson.annotation.JsonProperty("accessToken")
        private String accessToken;  // 访问令牌
    }

    /**
     * 分数上报响应
     */
    @Data
    public static class SubmitScoreResponse {
        private Boolean success;     // 是否成功
        private Integer rank;        // 当前排名
        private Long bestScore;      // 最佳分数
        private String msg;          // 消息

        public SubmitScoreResponse(Boolean success, Integer rank, Long bestScore, String msg) {
            this.success = success;
            this.rank = rank;
            this.bestScore = bestScore;
            this.msg = msg;
        }
    }

    /**
     * 排行榜查询结果
     */
    @Data
    public static class LeaderboardResponse {
        private String rankType;                 // 排行类型
        private List<LeaderboardEntryVO> list;  // 排行榜列表

        public LeaderboardResponse(String rankType, List<LeaderboardEntryVO> list) {
            this.rankType = rankType;
            this.list = list;
        }
    }

    /**
     * 1. 获取排行榜 TOP N（公开接口）
     * GET /api/leaderboard/top?gameId={gameId}&type={type}&limit={limit}
     * 或者 GET /api/leaderboard/top?gameCode={gameCode}&type={type}&limit={limit}
     *
     * @param gameId   游戏ID（可选，与 gameCode 二选一）
     * @param gameCode 游戏代码（可选，如 'sort', 'eliminate'）
     * @param type     排行类型：ALL/DAILY/MONTHLY/YEARLY（默认 ALL）
     * @param limit    返回数量（默认 20，最大 100）
     */
    @GetMapping("/top")
    public Result<LeaderboardResponse> getTopList(
            @RequestParam(required = false) Long gameId,
            @RequestParam(required = false) String gameCode,
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "20") Integer limit
    ) {
        try {
            // 解析 gameId：如果提供了 gameCode，则通过 gameService 获取对应的 gameId
            Long resolvedGameId = gameId;
            if (resolvedGameId == null && gameCode != null && !gameCode.isEmpty()) {
                Game game = gameService.getGameByCode(gameCode);
                if (game == null) {
                    return Result.error("游戏不存在：" + gameCode);
                }
                resolvedGameId = game.getGameId();
            }

            if (resolvedGameId == null) {
                return Result.error("游戏ID或游戏代码不能为空");
            }

            // 限制最大数量
            limit = Math.min(limit, 100);

            List<Map<String, Object>> rawList;
            switch (type.toUpperCase()) {
                case "DAILY":
                    rawList = leaderboardService.getDailyTop(resolvedGameId, limit);
                    break;
                case "MONTHLY":
                    rawList = leaderboardService.getMonthlyTop(resolvedGameId, limit);
                    break;
                case "YEARLY":
                    rawList = leaderboardService.getYearlyTop(resolvedGameId, limit);
                    break;
                case "ALL":
                default:
                    rawList = leaderboardService.getAllTimeTop(resolvedGameId, limit);
                    type = "ALL";
                    break;
            }

            // 转换为 VO
            List<LeaderboardEntryVO> entries = new ArrayList<>();
            for (Map<String, Object> item : rawList) {
                Integer rank = item.get("rank") != null ? ((Number) item.get("rank")).intValue() : null;
                Long userId = item.get("user_id") != null ? ((Number) item.get("user_id")).longValue() : null;
                String username = item.get("username") != null ? item.get("username").toString() : "";
                String nickname = item.get("nickname") != null ? item.get("nickname").toString() : "";
                String avatar = item.get("avatar_url") != null ? item.get("avatar_url").toString() : "";
                Long score = item.get("dimension_value") != null ? ((Number) item.get("dimension_value")).longValue() : 0L;
                Object extraData = item.get("extra_data");

                entries.add(new LeaderboardEntryVO(rank, userId, username, nickname, avatar, score, extraData));
            }

            return Result.success(new LeaderboardResponse(type, entries));
        } catch (Exception e) {
            log.error("[Leaderboard] 获取排行榜失败: gameId={}, type={}", gameId, type, e);
            return Result.error("获取排行榜失败");
        }
    }

    /**
     * 2. 获取用户排名（需要登录）
     * GET /api/leaderboard/user-rank?gameId={gameId}&accessToken={token}
     * 或者 GET /api/leaderboard/user-rank?gameCode={gameCode}&accessToken={token}
     */
    @GetMapping("/user-rank")
    public Result<UserRankVO> getUserRank(
            @RequestParam(required = false) Long gameId,
            @RequestParam(required = false) String gameCode,
            @RequestParam String accessToken
    ) {
        try {
            // 验证 token 并获取用户
            BaseUser user = getUserFromToken(accessToken);
            if (user == null) {
                return Result.error("请先登录");
            }

            // 解析 gameId：如果提供了 gameCode，则通过 gameService 获取对应的 gameId
            Long resolvedGameId = gameId;
            if (resolvedGameId == null && gameCode != null && !gameCode.isEmpty()) {
                Game game = gameService.getGameByCode(gameCode);
                if (game == null) {
                    return Result.error("游戏不存在：" + gameCode);
                }
                resolvedGameId = game.getGameId();
            }

            if (resolvedGameId == null) {
                return Result.error("游戏ID或游戏代码不能为空");
            }

            Map<String, Object> rankInfo = leaderboardService.getUserRank(user.getUserId(), resolvedGameId);
            if (rankInfo == null || rankInfo.isEmpty() || rankInfo.get("userRank") == null) {
                return Result.success(new UserRankVO(null, 0L, false));
            }

            Long score = rankInfo.get("userValue") != null ?
                    ((Number) rankInfo.get("userValue")).longValue() : 0L;
            Integer rank = rankInfo.get("userRank") != null ?
                    ((Number) rankInfo.get("userRank")).intValue() : null;

            return Result.success(new UserRankVO(rank, score, true));
        } catch (Exception e) {
            log.error("获取用户排名失败", e);
            return Result.error("获取排名失败：" + e.getMessage());
        }
    }
    /**
     * 3. 提交游戏分数（需要登录）
     * POST /api/leaderboard/submit
     */
    @PostMapping("/submit")
    public Result<SubmitScoreResponse> submitScore(@RequestBody SubmitScoreRequest request) {
        try {
            // 添加调试日志
            log.info("[Leaderboard] 收到提交分数请求: gameId={}, score={}, accessTokenLength={}", 
                    request.getGameId(), 
                    request.getScore(), 
                    request.getAccessToken() != null ? request.getAccessToken().length() : 0);
            
            // 验证请求参数
            if (request.getGameId() == null) {
                log.error("[Leaderboard] 游戏ID为空！原始请求对象: {}", request);
                return Result.error("游戏ID不能为空");
            }
            if (request.getScore() == null) {
                return Result.error("分数不能为空");
            }
            if (request.getAccessToken() == null || request.getAccessToken().trim().isEmpty()) {
                return Result.error("请先登录");
            }

            // 验证 token 并获取用户
            BaseUser user = getUserFromToken(request.getAccessToken());
            if (user == null) {
                return Result.error("登录已过期，请重新登录");
            }

            // 提交分数
            Map<String, Object> result = leaderboardService.submitScore(
                    user.getUserId(), request.getGameId(), request.getScore()
            );

            boolean success = (boolean) result.get("success");
            Integer rank = result.get("rank") != null ? ((Number) result.get("rank")).intValue() : null;
            Long bestScore = result.get("bestScore") != null ?
                    ((Number) result.get("bestScore")).longValue() : 0L;

            if (success) {
                log.info("[Leaderboard] 分数提交成功: userId={}, gameId={}, score={}, rank={}",
                        user.getUserId(), request.getGameId(), request.getScore(), rank);
                return Result.success(new SubmitScoreResponse(true, rank, bestScore, "分数已更新"));
            } else {
                return Result.success(new SubmitScoreResponse(false, null, null, "分数更新失败"));
            }
        } catch (Exception e) {
            log.error("[Leaderboard] 分数提交失败: gameId={}, score={}",
                    request.getGameId(), request.getScore(), e);
            return Result.error("分数提交失败");
        }
    }

    /**
     * 4. 批量获取用户排名
     * POST /api/leaderboard/batch-user-rank
     */
    @PostMapping("/batch-user-rank")
    public Result<Map<Long, UserRankVO>> getBatchUserRank(
            @RequestBody BatchRankRequest request
    ) {
        try {
            log.info("[Leaderboard] 批量获取用户排名: userId={}, gameCount={}", 
                    request.getUserId(), request.getGameIds() != null ? request.getGameIds().size() : 0);
            
            Map<Long, UserRankVO> result = new HashMap<>();

            if (request.getGameIds() == null || request.getGameIds().isEmpty()) {
                return Result.success(result);
            }

            for (Long gameId : request.getGameIds()) {
                try {
                    Map<String, Object> rankInfo = leaderboardService.getUserRank(
                            request.getUserId(), gameId
                    );
                    
                    log.debug("[Leaderboard] 游戏{}排名信息: {}", gameId, rankInfo);

                    if (rankInfo != null && !rankInfo.isEmpty() && rankInfo.get("userRank") != null) {
                        Long score = rankInfo.get("userValue") != null ?
                                ((Number) rankInfo.get("userValue")).longValue() : 0L;
                        Integer rank = ((Number) rankInfo.get("userRank")).intValue();
                        Integer totalCount = rankInfo.get("totalCount") != null ?
                                ((Number) rankInfo.get("totalCount")).intValue() : 0;
                        result.put(gameId, new UserRankVO(rank, score, true));
                        log.info("[Leaderboard] 游戏{} - 排名:{}/{}, 分数:{}", gameId, rank, totalCount, score);
                    } else {
                        result.put(gameId, new UserRankVO(null, 0L, false));
                        log.debug("[Leaderboard] 游戏{} - 无记录", gameId);
                    }
                } catch (Exception e) {
                    log.warn("[Leaderboard] 获取游戏{}排名失败: {}", gameId, e.getMessage());
                    result.put(gameId, new UserRankVO(null, 0L, false));
                }
            }

            log.info("[Leaderboard] 批量排名返回: {} 个游戏", result.size());
            return Result.success(result);
        } catch (Exception e) {
            log.error("[Leaderboard] 批量获取用户排名失败: userId={}", request.getUserId(), e);
            return Result.error("批量获取排名失败");
        }
    }

    /**
     * 5. 获取当前用户的所有游戏排名
     * GET /api/leaderboard/my-ranks?accessToken={token}&gameIds={gameId1,gameId2}
     */
    @GetMapping("/my-ranks")
    public Result<Map<Long, UserRankVO>> getMyRanks(
            @RequestParam String accessToken,
            @RequestParam List<Long> gameIds
    ) {
        try {
            // 验证 token 并获取用户
            BaseUser user = getUserFromToken(accessToken);
            if (user == null) {
                return Result.error("请先登录");
            }

            BatchRankRequest request = new BatchRankRequest();
            request.setUserId(user.getUserId());
            request.setGameIds(gameIds);

            return getBatchUserRank(request);
        } catch (Exception e) {
            log.error("[Leaderboard] 获取我的排名失败", e);
            return Result.error("获取排名失败");
        }
    }

    /**
     * 从 Token 获取用户
     */
    private BaseUser getUserFromToken(String accessToken) {
        try {
            // 验证并解析 JWT Token
            if (!jwtUtil.validateToken(accessToken)) {
                log.warn("[Leaderboard] Token 无效或已过期");
                return null;
            }

            // 从 Token 中获取 userId
            Claims claims = jwtUtil.parseToken(accessToken);
            String userIdStr = claims.get("userId", String.class);
            
            if (userIdStr == null || userIdStr.isEmpty()) {
                log.warn("[Leaderboard] Token 中缺少 userId");
                return null;
            }

            Long userId = Long.parseLong(userIdStr);
            
            // 查询用户信息
            BaseUser user = baseUserMapper.selectById(userId);
            if (user == null) {
                log.warn("[Leaderboard] 用户不存在: userId={}", userId);
                return null;
            }

            return user;
        } catch (Exception e) {
            log.error("[Leaderboard] Token验证失败: {}", e.getMessage(), e);
            return null;
        }
    }
}
