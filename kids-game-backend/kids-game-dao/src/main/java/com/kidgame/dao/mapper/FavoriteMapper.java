package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Favorite;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 用户收藏Mapper
 */
@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {

    /**
     * 查询用户的收藏游戏ID列表
     *
     * @param userId 用户ID
     * @return 收藏的游戏ID列表
     */
    List<Long> selectGameIdsByUserId(@Param("userId") Long userId);

    /**
     * 检查用户是否已收藏某游戏
     *
     * @param userId 用户ID
     * @param gameId 游戏ID
     * @return 收藏记录数量
     */
    int countByUserIdAndGameId(@Param("userId") Long userId, @Param("gameId") Long gameId);
}