package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.DraftVersion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 草稿版本 Mapper 接口
 */
@Mapper
public interface DraftVersionMapper extends BaseMapper<DraftVersion> {

    /**
     * 根据草稿ID查询版本历史
     */
    @Select("SELECT * FROM draft_version WHERE draft_id = #{draftId} ORDER BY version DESC")
    List<DraftVersion> findByDraftId(@Param("draftId") Long draftId);

    /**
     * 根据草稿ID和版本号查询
     */
    @Select("SELECT * FROM draft_version WHERE draft_id = #{draftId} AND version = #{version}")
    DraftVersion findByDraftIdAndVersion(@Param("draftId") Long draftId, @Param("version") Integer version);
}
