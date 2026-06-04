package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.SystemConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 系统配置Mapper
 */
@Mapper
public interface SystemConfigMapper extends BaseMapper<SystemConfig> {

    /**
     * 根据配置键查询
     */
    @Select("SELECT * FROM t_system_config WHERE config_key = #{configKey}")
    SystemConfig selectByKey(@Param("configKey") String configKey);

    /**
     * 根据配置分组查询
     */
    @Select("SELECT * FROM t_system_config WHERE config_group = #{configGroup} ORDER BY config_key")
    List<SystemConfig> selectByGroup(@Param("configGroup") String configGroup);

    /**
     * 查询所有配置分组
     */
    @Select("SELECT DISTINCT config_group FROM t_system_config ORDER BY config_group")
    List<String> selectAllGroups();
}
