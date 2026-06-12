package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户收藏控制器
 */
@Tag(name = "收藏管理", description = "用户收藏游戏相关接口")
@RestController
@RequestMapping("/api/favorite")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @Operation(summary = "添加收藏")
    @PostMapping("/add")
    public Result<Boolean> addFavorite(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        boolean success = favoriteService.addFavorite(userId, gameId);
        return Result.success(success);
    }

    @Operation(summary = "取消收藏")
    @PostMapping("/remove")
    public Result<Boolean> removeFavorite(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        boolean success = favoriteService.removeFavorite(userId, gameId);
        return Result.success(success);
    }

    @Operation(summary = "获取用户收藏列表")
    @GetMapping("/list")
    public Result<List<Long>> getUserFavorites(
            @Parameter(description = "用户ID") @RequestParam Long userId) {
        List<Long> favorites = favoriteService.getUserFavorites(userId);
        return Result.success(favorites);
    }

    @Operation(summary = "检查是否已收藏")
    @GetMapping("/check")
    public Result<Boolean> isFavorited(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        boolean favorited = favoriteService.isFavorited(userId, gameId);
        return Result.success(favorited);
    }
}