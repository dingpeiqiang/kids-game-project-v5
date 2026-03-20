package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Permission;
import com.kidgame.dao.entity.RolePermission;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 角色权限关联Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface RolePermissionMapper extends BaseMapper<RolePermission> {

    /**
     * 查询角色的权限列表
     *
     * @param roleId 角色ID
     * @return 权限列表
     */
    List<Permission> selectPermissionsByRoleId(Long roleId);

    /**
     * 查询用户的权限列表（通过角色）
     *
     * @param userId 用户ID
     * @return 权限列表
     */
    List<Permission> selectPermissionsByUserId(Long userId);
}
