package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.UserGameRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户游戏记录 Mapper
 */
@Mapper
public interface UserGameRecordMapper extends BaseMapper<UserGameRecord> {

    /**
     * 获取用户最近的游戏记录
     */
    @Select("SELECT * FROM user_game_record WHERE user_id = #{userId} ORDER BY played_at DESC LIMIT #{limit}")
    List<UserGameRecord> selectRecentRecords(@Param("userId") Long userId, @Param("limit") Integer limit);

    /**
     * 获取用户常玩游戏（按游玩次数排序）
     */
    @Select("SELECT game_id, COUNT(*) as play_count FROM user_game_record WHERE user_id = #{userId} GROUP BY game_id ORDER BY play_count DESC LIMIT #{limit}")
    List<GamePlayCount> selectFrequentGames(@Param("userId") Long userId, @Param("limit") Integer limit);

    /**
     * 内部接口：游戏游玩次数统计
     */
    interface GamePlayCount {
        Integer getGameId();
        Integer getPlayCount();
    }
}