package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.UserRelation;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 用户关系Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface UserRelationMapper extends BaseMapper<UserRelation> {

    /**
     * 查询儿童的所有监护人
     *
     * @param kidId 儿童ID
     * @return 监护人列表
     */
    List<UserRelation> selectGuardiansByKidId(Long kidId);

    /**
     * 查询家长的所有儿童
     *
     * @param parentId 家长ID
     * @return 儿童列表
     */
    List<UserRelation> selectKidsByParentId(Long parentId);
}
