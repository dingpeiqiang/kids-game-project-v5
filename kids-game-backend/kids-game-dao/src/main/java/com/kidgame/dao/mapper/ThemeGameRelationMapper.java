package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.ThemeGameRelation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 主题 - 游戏关系 Mapper
 */
@Mapper
public interface ThemeGameRelationMapper extends BaseMapper<ThemeGameRelation> {

    /**
     * 根据主题 ID 查询关联的游戏列表
     * @param themeId 主题 ID
     * @return 游戏 ID 列表
     */
    List<Long> selectGameIdsByThemeId(@Param("themeId") Long themeId);

    /**
     * 根据游戏 ID 查询关联的主题列表
     * @param gameId 游戏 ID
     * @return 主题关系列表
     */
    List<ThemeGameRelation> selectRelationsByGameId(@Param("gameId") Long gameId);

    /**
     * 获取游戏的默认主题
     * @param gameId 游戏 ID
     * @return 默认主题关系
     */
    ThemeGameRelation selectDefaultTheme(@Param("gameId") Long gameId);

    /**
     * 设置游戏的默认主题（先取消其他默认，再设置新的）
     * @param gameId 游戏 ID
     * @param themeId 主题 ID
     * @return 影响行数
     */
    int setDefaultTheme(@Param("gameId") Long gameId, @Param("themeId") Long themeId);
}
