package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.ParentLimit;
import org.apache.ibatis.annotations.Mapper;

/**
 * 家长管控规则 Mapper
 * @deprecated 已废弃，请使用 UserControlConfigMapper 替代
 */
@Deprecated
@Mapper
public interface ParentLimitMapper extends BaseMapper<ParentLimit> {
}
