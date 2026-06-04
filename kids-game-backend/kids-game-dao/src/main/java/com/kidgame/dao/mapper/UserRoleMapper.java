package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Role;
import com.kidgame.dao.entity.UserRole;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 用户角色关联Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface UserRoleMapper extends BaseMapper<UserRole> {

    /**
     * 查询用户的角色列表
     *
     * @param userId 用户ID
     * @return 角色列表
     */
    List<Role> selectRolesByUserId(Long userId);
}
