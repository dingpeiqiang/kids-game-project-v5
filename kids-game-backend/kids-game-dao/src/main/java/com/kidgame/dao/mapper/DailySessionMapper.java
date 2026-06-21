package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.DailySession;
import org.apache.ibatis.annotations.Mapper;

/**
 * 每日练习会话 Mapper
 */
@Mapper
public interface DailySessionMapper extends BaseMapper<DailySession> {
}
