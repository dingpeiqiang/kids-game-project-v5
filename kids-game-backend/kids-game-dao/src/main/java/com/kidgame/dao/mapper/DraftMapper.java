package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Draft;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 草稿 Mapper 接口
 */
@Mapper
public interface DraftMapper extends BaseMapper<Draft> {

    /**
     * 根据作者ID查询草稿列表
     */
    @Select("SELECT * FROM draft WHERE author_id = #{authorId} ORDER BY updated_at DESC")
    List<Draft> findByAuthorId(@Param("authorId") Long authorId);

    /**
     * 根据作者ID和内容类型查询草稿列表
     */
    @Select("SELECT * FROM draft WHERE author_id = #{authorId} AND content_type = #{contentType} ORDER BY updated_at DESC")
    List<Draft> findByAuthorIdAndContentType(@Param("authorId") Long authorId, @Param("contentType") String contentType);

    /**
     * 根据作者ID统计草稿数量
     */
    @Select("SELECT COUNT(*) FROM draft WHERE author_id = #{authorId}")
    int countByAuthorId(@Param("authorId") Long authorId);

    /**
     * 根据作者ID和内容类型统计草稿数量
     */
    @Select("SELECT COUNT(*) FROM draft WHERE author_id = #{authorId} AND content_type = #{contentType}")
    int countByAuthorIdAndContentType(@Param("authorId") Long authorId, @Param("contentType") String contentType);

    /**
     * 根据关联实体查询草稿
     */
    @Select("SELECT * FROM draft WHERE related_entity_type = #{relatedEntityType} AND related_entity_id = #{relatedEntityId}")
    List<Draft> findByRelatedEntity(@Param("relatedEntityType") String relatedEntityType, @Param("relatedEntityId") Long relatedEntityId);
}
