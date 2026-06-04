package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Permission;
import org.apache.ibatis.annotations.Mapper;

/**
 * 权限Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface PermissionMapper extends BaseMapper<Permission> {
}
