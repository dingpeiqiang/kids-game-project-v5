package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.UserRequest;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户申请记录 Mapper
 */
@Mapper
public interface UserRequestMapper extends BaseMapper<UserRequest> {
}
