package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.PatternLock;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

/**
 * 图案解锁 Mapper
 */
@Mapper
public interface PatternLockMapper extends BaseMapper<PatternLock> {

    /**
     * 根据用户ID和用户类型查询图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型
     * @return 图案解锁信息
     */
    Optional<PatternLock> selectByUserIdAndType(@Param("userId") Long userId, @Param("userType") String userType);

    /**
     * 根据用户ID和用户类型删除图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型
     * @return 删除数量
     */
    int deleteByUserIdAndType(@Param("userId") Long userId, @Param("userType") String userType);

    /**
     * 检查用户是否存在图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型
     * @return 是否存在
     */
    boolean existsByUserIdAndType(@Param("userId") Long userId, @Param("userType") String userType);
}
