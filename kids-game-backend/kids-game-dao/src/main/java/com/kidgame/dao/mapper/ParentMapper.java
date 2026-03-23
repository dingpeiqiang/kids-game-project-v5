package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Parent;
import org.apache.ibatis.annotations.Mapper;

/**
 * 家长用户 Mapper
 * @deprecated 已废弃，请使用 BaseUserMapper 替代
 */
@Deprecated
@Mapper
public interface ParentMapper extends BaseMapper<Parent> {
}
