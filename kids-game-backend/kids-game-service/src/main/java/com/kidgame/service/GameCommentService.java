package com.kidgame.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.kidgame.dao.entity.GameComment;

import java.util.List;

/**
 * 游戏评论Service
 */
public interface GameCommentService {

    /**
     * 添加评论
     */
    GameComment addComment(Long userId, Long gameId, String content, Integer score);

    /**
     * 根据游戏ID分页查询评论
     */
    IPage<GameComment> getCommentsByGameId(Long gameId, int page, int size);

    /**
     * 根据游戏ID查询评论列表
     */
    List<GameComment> getCommentsByGameId(Long gameId);

    /**
     * 根据游戏ID统计评论数量
     */
    int getCommentCount(Long gameId);

    /**
     * 根据游戏ID计算平均评分
     */
    Double getAvgScore(Long gameId);
}