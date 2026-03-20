package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameTag;
import com.kidgame.dao.entity.GameTagRelation;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 游戏标签关联Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface GameTagRelationMapper extends BaseMapper<GameTagRelation> {

    /**
     * 查询游戏的标签列表
     *
     * @param gameId 游戏ID
     * @return 标签列表
     */
    List<GameTag> selectTagsByGameId(Long gameId);

    /**
     * 查询标签的游戏列表
     *
     * @param tagId 标签ID
     * @return 游戏列表
     */
    List<GameTagRelation> selectGamesByTagId(Long tagId);
}
