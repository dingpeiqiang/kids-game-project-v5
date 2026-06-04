package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.dao.entity.GameComment;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 游戏评论Mapper
 */
public interface GameCommentMapper extends BaseMapper<GameComment> {

    /**
     * 根据游戏ID分页查询评论
     */
    IPage<GameComment> selectByGameId(Page<GameComment> page, @Param("gameId") Long gameId);

    /**
     * 根据游戏ID查询评论列表
     */
    List<GameComment> selectByGameId(@Param("gameId") Long gameId);

    /**
     * 根据游戏ID统计评论数量
     */
    int countByGameId(@Param("gameId") Long gameId);

    /**
     * 根据游戏ID计算平均评分
     */
    Double selectAvgScoreByGameId(@Param("gameId") Long gameId);
}