package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Kid;
import org.apache.ibatis.annotations.Mapper;

/**
 * 儿童用户 Mapper
 */
@Mapper
public interface KidMapper extends BaseMapper<Kid> {
}
