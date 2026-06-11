package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.UserControlConfig;
import com.kidgame.dao.mapper.UserControlConfigMapper;
import com.kidgame.service.UserControlConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalTime;

/**
 * 用户管控配置服务实现
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Service
public class UserControlConfigServiceImpl extends ServiceImpl<UserControlConfigMapper, UserControlConfig>
        implements UserControlConfigService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Long createConfig(UserControlConfig config) {
        long currentTime = System.currentTimeMillis();
        config.setCreateTime(currentTime);
        config.setUpdateTime(currentTime);

        // 设置默认值
        if (config.getDailyDuration() == null) {
            config.setDailyDuration(60);
        }
        if (config.getSingleDuration() == null) {
            config.setSingleDuration(30);
        }
        if (config.getAllowedTimeStart() == null) {
            config.setAllowedTimeStart("06:00");
        }
        if (config.getAllowedTimeEnd() == null) {
            config.setAllowedTimeEnd("22:00");
        }
        if (config.getAnswerGetPoints() == null) {
            config.setAnswerGetPoints(1);
        }
        if (config.getDailyAnswerLimit() == null) {
            config.setDailyAnswerLimit(10);
        }

        getBaseMapper().insert(config);
        log.info("创建管控配置. ConfigId: {}, UserId: {}", config.getConfigId(), config.getUserId());

        return config.getConfigId();
    }

    @Override
    public void updateConfig(UserControlConfig config) {
        config.setUpdateTime(System.currentTimeMillis());
        getBaseMapper().updateById(config);
        log.info("更新管控配置. ConfigId: {}", config.getConfigId());
    }

    @Override
    public void deleteConfig(Long configId) {
        getBaseMapper().deleteById(configId);
        log.info("删除管控配置. ConfigId: {}", configId);
    }

    @Override
    public UserControlConfig getConfigByUserId(Long userId) {
        LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserControlConfig::getUserId, userId);
        UserControlConfig config = getBaseMapper().selectOne(wrapper);

        if (config == null) {
            // 返回默认配置
            config = createDefaultConfig(userId);
        }

        return config;
    }

    @Override
    public UserControlConfig getConfig(Long userId, Long guardianId) {
        LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserControlConfig::getUserId, userId);
        if (guardianId != null) {
            wrapper.eq(UserControlConfig::getGuardianId, guardianId);
        }
        UserControlConfig config = getBaseMapper().selectOne(wrapper);

        if (config == null) {
            // 返回默认配置
            config = createDefaultConfig(userId);
            if (guardianId != null) {
                config.setGuardianId(guardianId);
            }
        }

        return config;
    }

    /**
     * 创建默认配置
     */
    private UserControlConfig createDefaultConfig(Long userId) {
        UserControlConfig config = new UserControlConfig();
        config.setUserId(userId);
        config.setDailyDuration(60);
        config.setSingleDuration(30);
        config.setAllowedTimeStart("06:00");
        config.setAllowedTimeEnd("22:00");
        config.setAnswerGetPoints(1);
        config.setDailyAnswerLimit(10);
        config.setBlockedGames(null);
        return config;
    }

    @Override
    public UserControlConfig saveConfig(UserControlConfig config) {
        LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserControlConfig::getUserId, config.getUserId());
        if (config.getGuardianId() != null) {
            wrapper.eq(UserControlConfig::getGuardianId, config.getGuardianId());
        }
        UserControlConfig existing = getBaseMapper().selectOne(wrapper);

        if (existing != null) {
            config.setConfigId(existing.getConfigId());
            updateConfig(config);
        } else {
            long currentTime = System.currentTimeMillis();
            config.setCreateTime(currentTime);
            config.setUpdateTime(currentTime);

            if (config.getDailyDuration() == null) {
                config.setDailyDuration(60);
            }
            if (config.getSingleDuration() == null) {
                config.setSingleDuration(30);
            }
            if (config.getAllowedTimeStart() == null) {
                config.setAllowedTimeStart("06:00");
            }
            if (config.getAllowedTimeEnd() == null) {
                config.setAllowedTimeEnd("22:00");
            }
            if (config.getAnswerGetPoints() == null) {
                config.setAnswerGetPoints(1);
            }
            if (config.getDailyAnswerLimit() == null) {
                config.setDailyAnswerLimit(10);
            }

            getBaseMapper().insert(config);
            log.info("创建管控配置. ConfigId: {}, UserId: {}", config.getConfigId(), config.getUserId());
        }

        return config;
    }

    @Override
    public void updateTimeLimit(Long userId, Integer dailyTimeLimitMinutes) {
        LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserControlConfig::getUserId, userId);
        UserControlConfig config = getBaseMapper().selectOne(wrapper);

        if (config == null) {
            config = createDefaultConfig(userId);
            config.setDailyDuration(dailyTimeLimitMinutes);
            saveConfig(config);
        } else {
            config.setDailyDuration(dailyTimeLimitMinutes);
            updateConfig(config);
        }
    }

    @Override
    public void updateFatiguePoint(Long userId, Integer fatiguePointMinutes, Integer restDurationMinutes) {
        // 当前实体类没有游学币相关字段，暂时使用日志记录
        log.info("更新游学币设置. UserId: {}, FatiguePointMinutes: {}, RestDurationMinutes: {}",
                userId, fatiguePointMinutes, restDurationMinutes);
        // TODO: 需要在实体类中添加游学币相关字段后实现
    }

    @Override
    public void updateTimeRange(Long userId, String allowedStartTime, String allowedEndTime) {
        LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserControlConfig::getUserId, userId);
        UserControlConfig config = getBaseMapper().selectOne(wrapper);

        if (config == null) {
            config = createDefaultConfig(userId);
            config.setAllowedTimeStart(allowedStartTime);
            config.setAllowedTimeEnd(allowedEndTime);
            saveConfig(config);
        } else {
            config.setAllowedTimeStart(allowedStartTime);
            config.setAllowedTimeEnd(allowedEndTime);
            updateConfig(config);
        }
    }

    @Override
    public void updateFatigueMode(Long userId, String fatigueControlMode) {
        // 当前实体类没有游学币控制模式字段，暂时使用日志记录
        log.info("更新游学币控制模式. UserId: {}, Mode: {}", userId, fatigueControlMode);
        // TODO: 需要在实体类中添加游学币控制模式字段后实现
    }

    @Override
    public boolean checkTimeRange(Long userId) {
        LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserControlConfig::getUserId, userId);
        UserControlConfig config = getBaseMapper().selectOne(wrapper);

        if (config == null) {
            config = createDefaultConfig(userId);
        }

        try {
            LocalTime now = LocalTime.now();
            LocalTime startTime = LocalTime.parse(config.getAllowedTimeStart());
            LocalTime endTime = LocalTime.parse(config.getAllowedTimeEnd());

            return now.isAfter(startTime) && now.isBefore(endTime);
        } catch (Exception e) {
            log.error("解析时间范围失败", e);
            return true;
        }
    }

    @Override
    public boolean checkDailyLimit(Long userId) {
        // TODO: 需要结合游戏会话记录来实现每日时长检查
        // 暂时返回 false 表示未超过限制
        return false;
    }

    @Override
    public boolean checkFatigue(Long userId, Integer playedMinutes) {
        // 当前实体类没有游学币相关字段，暂时返回 false
        // TODO: 需要在实体类中添加游学币相关字段后实现
        return false;
    }

    @Override
    public void deleteByUserId(Long userId) {
        LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserControlConfig::getUserId, userId);
        UserControlConfig config = getBaseMapper().selectOne(wrapper);
        if (config != null) {
            deleteConfig(config.getConfigId());
        }
    }

    @Override
    public Page<UserControlConfig> listConfigs(Long kidId, Integer page, Integer size) {
        // 构建查询 SQL
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT c.*, ");
        sql.append("       u1.nickname AS child_nickname, ");
        sql.append("       u2.nickname AS guardian_nickname ");
        sql.append("FROM t_user_control_config c ");
        sql.append("LEFT JOIN t_user u1 ON c.user_id = u1.user_id ");
        sql.append("LEFT JOIN t_user u2 ON c.guardian_id = u2.user_id ");
        sql.append("WHERE c.deleted = 0 ");
        
        if (kidId != null) {
            sql.append("AND c.user_id = ? ");
        }
        
        sql.append("ORDER BY c.create_time DESC ");
        
        // 计算总数
        String countSql = "SELECT COUNT(*) FROM t_user_control_config c WHERE c.deleted = 0" + 
                         (kidId != null ? " AND c.user_id = ?" : "");
        Long total;
        if (kidId != null) {
            total = jdbcTemplate.queryForObject(countSql, Long.class, kidId);
        } else {
            total = jdbcTemplate.queryForObject(countSql, Long.class);
        }
        
        // 分页查询数据
        int offset = (page - 1) * size;
        String dataSql = sql.toString() + "LIMIT ?,?";
        
        java.util.List<UserControlConfig> records;
        if (kidId != null) {
            records = jdbcTemplate.query(dataSql, new Object[]{kidId, offset, size}, (rs, rowNum) -> {
                UserControlConfig config = mapResultSetToConfig(rs);
                return config;
            });
        } else {
            records = jdbcTemplate.query(dataSql, new Object[]{offset, size}, (rs, rowNum) -> {
                UserControlConfig config = mapResultSetToConfig(rs);
                return config;
            });
        }
        
        // 构建分页对象
        Page<UserControlConfig> pageObj = new Page<>(page, size, total);
        pageObj.setRecords(records);
        return pageObj;
    }
    
    /**
     * 将 ResultSet 映射为 UserControlConfig 对象
     */
    private UserControlConfig mapResultSetToConfig(java.sql.ResultSet rs) throws java.sql.SQLException {
        UserControlConfig config = new UserControlConfig();
        config.setConfigId(rs.getLong("config_id"));
        config.setUserId(rs.getLong("user_id"));
        config.setGuardianId(rs.getObject("guardian_id", Long.class));
        config.setChildNickname(rs.getString("child_nickname"));
        config.setGuardianNickname(rs.getString("guardian_nickname"));
        config.setDailyDuration(rs.getInt("daily_duration"));
        config.setSingleDuration(rs.getInt("single_duration"));
        config.setAllowedTimeStart(rs.getString("allowed_time_start"));
        config.setAllowedTimeEnd(rs.getString("allowed_time_end"));
        config.setAnswerGetPoints(rs.getInt("answer_get_points"));
        config.setDailyAnswerLimit(rs.getInt("daily_answer_limit"));
        config.setBlockedGames(rs.getString("blocked_games"));
        config.setFatiguePointThreshold(rs.getObject("fatigue_point_threshold", Integer.class));
        config.setRestDuration(rs.getObject("rest_duration", Integer.class));
        config.setFatigueControlMode(rs.getString("fatigue_control_mode"));
        config.setContinuousPlayReminder(rs.getObject("continuous_play_reminder", Integer.class));
        config.setDailyGameLimit(rs.getObject("daily_game_limit", Integer.class));
        config.setGameInterval(rs.getObject("game_interval", Integer.class));
        config.setCreateTime(rs.getLong("create_time"));
        config.setUpdateTime(rs.getLong("update_time"));
        config.setDeleted(rs.getInt("deleted"));
        return config;
    }
}
