package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameSessionScore;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface GameSessionScoreMapper extends BaseMapper<GameSessionScore> {

    @Select("""
            SELECT s.user_id, s.username, s.nickname, s.avatar, s.score,
                   (SELECT COUNT(*) + 1 FROM t_game_session_score t
                    WHERE t.game_id = s.game_id AND t.deleted = 0 AND t.score > s.score) AS user_rank
            FROM t_game_session_score s
            WHERE s.game_id = #{gameId} AND s.deleted = 0
            ORDER BY s.score DESC, s.create_time ASC
            LIMIT #{limit}
            """)
    List<Map<String, Object>> selectTopByGame(@Param("gameId") Long gameId, @Param("limit") int limit);

    @Select("""
            SELECT user_rank, score FROM (
              SELECT user_id, score,
                RANK() OVER (ORDER BY score DESC, create_time ASC) AS user_rank
              FROM t_game_session_score
              WHERE game_id = #{gameId} AND user_id = #{userId} AND deleted = 0
            ) x ORDER BY score DESC LIMIT 1
            """)
    Map<String, Object> selectUserBestRank(@Param("gameId") Long gameId, @Param("userId") Long userId);

    /**
     * 获取用户的游戏记录列表（每个游戏最近一次游玩），按时间倒序
     */
    @Select("""
            SELECT t.game_id, t.score, t.create_time AS played_at,
                   (t.score >= (
                      SELECT MAX(s.score) FROM t_game_session_score s
                      WHERE s.game_id = t.game_id AND s.user_id = t.user_id AND s.deleted = 0
                   )) AS is_new_best
            FROM t_game_session_score t
            WHERE t.user_id = #{userId} AND t.deleted = 0
              AND t.create_time = (
                SELECT MAX(t2.create_time) FROM t_game_session_score t2
                WHERE t2.game_id = t.game_id AND t2.user_id = t.user_id AND t2.deleted = 0
              )
            ORDER BY t.create_time DESC
            """)
    List<Map<String, Object>> selectUserGameRecords(@Param("userId") Long userId);
}