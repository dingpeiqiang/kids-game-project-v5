package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.GameComment;
import com.kidgame.dao.mapper.GameCommentMapper;
import com.kidgame.service.GameCommentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 游戏评论服务实现
 */
@Slf4j
@Service
public class GameCommentServiceImpl extends ServiceImpl<GameCommentMapper, GameComment> implements GameCommentService {

    @Autowired
    private GameCommentMapper gameCommentMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public GameComment addComment(Long userId, Long gameId, String content, Integer score) {
        // 参数校验
        if (userId == null || userId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "用户ID无效");
        }
        if (gameId == null || gameId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "游戏ID无效");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "评论内容不能为空");
        }
        if (content.length() > 200) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "评论内容不能超过200字");
        }
        if (score == null || score < 1 || score > 5) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "评分必须在1-5之间");
        }

        GameComment comment = new GameComment();
        comment.setUserId(userId);
        comment.setGameId(gameId);
        comment.setContent(content.trim());
        comment.setScore(score);
        comment.setCreateTime(System.currentTimeMillis());
        comment.setDeleted(0);

        int result = gameCommentMapper.insert(comment);
        if (result <= 0) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "评论添加失败");
        }

        log.info("用户 {} 对游戏 {} 添加评论: {}", userId, gameId, content);
        return comment;
    }

    @Override
    public IPage<GameComment> getCommentsByGameId(Long gameId, int page, int size) {
        if (gameId == null || gameId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "游戏ID无效");
        }

        Page<GameComment> pageQuery = new Page<>(page, size);
        return gameCommentMapper.selectByGameId(pageQuery, gameId);
    }

    @Override
    public List<GameComment> getCommentsByGameId(Long gameId) {
        if (gameId == null || gameId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "游戏ID无效");
        }

        return gameCommentMapper.selectByGameId(gameId);
    }

    @Override
    public int getCommentCount(Long gameId) {
        if (gameId == null || gameId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "游戏ID无效");
        }

        return gameCommentMapper.countByGameId(gameId);
    }

    @Override
    public Double getAvgScore(Long gameId) {
        if (gameId == null || gameId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "游戏ID无效");
        }

        return gameCommentMapper.selectAvgScoreByGameId(gameId);
    }
}