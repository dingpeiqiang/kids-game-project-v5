package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.UserSignIn;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户签到记录 Mapper
 */
@Mapper
public interface UserSignInMapper extends BaseMapper<UserSignIn> {

    /**
     * 查询用户最近连续签到天数
     * @param userId 用户ID
     * @return 连续签到天数
     */
    @Select("SELECT COUNT(*) FROM t_user_sign_in WHERE user_id = #{userId} AND sign_in_date >= DATE_SUB(CURDATE(), INTERVAL (COUNT(*) - 1) DAY)")
    int getConsecutiveDays(@Param("userId") Long userId);

    /**
     * 查询用户指定日期的签到记录
     * @param userId 用户ID
     * @param signInDate 签到日期
     * @return 签到记录
     */
    @Select("SELECT * FROM t_user_sign_in WHERE user_id = #{userId} AND sign_in_date = #{signInDate}")
    UserSignIn getByUserIdAndDate(@Param("userId") Long userId, @Param("signInDate") String signInDate);

    /**
     * 查询用户最近的签到记录
     * @param userId 用户ID
     * @param limit 限制数量
     * @return 签到记录列表
     */
    @Select("SELECT * FROM t_user_sign_in WHERE user_id = #{userId} ORDER BY sign_in_date DESC LIMIT #{limit}")
    List<UserSignIn> getRecentSignIns(@Param("userId") Long userId, @Param("limit") int limit);
}