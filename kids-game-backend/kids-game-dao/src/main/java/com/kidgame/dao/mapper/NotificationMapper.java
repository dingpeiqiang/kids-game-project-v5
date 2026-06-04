package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 通知 Mapper 接口
 */
@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {

    /**
     * 查询用户未读通知数量
     */
    @Select("SELECT COUNT(*) FROM t_notification WHERE user_id = #{userId} AND user_type = #{userType} AND is_read = 0 AND deleted = 0")
    int countUnreadByUserId(@Param("userId") Long userId, @Param("userType") Integer userType);

    /**
     * 查询用户待处理的通知（如待确认的绑定请求）
     */
    @Select("SELECT * FROM t_notification WHERE user_id = #{userId} AND user_type = #{userType} AND status = 0 AND deleted = 0 ORDER BY create_time DESC")
    List<Notification> selectPendingByUserId(@Param("userId") Long userId, @Param("userType") Integer userType);
}
