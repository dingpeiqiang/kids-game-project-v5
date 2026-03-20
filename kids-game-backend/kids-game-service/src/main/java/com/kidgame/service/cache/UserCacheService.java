package com.kidgame.service.cache;

import com.kidgame.dao.entity.BaseUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 用户缓存服务
 */
@Slf4j
@Service
public class UserCacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String USER_CACHE_PREFIX = "user:";
    private static final long USER_CACHE_EXPIRE_MINUTES = 30;

    /**
     * 缓存用户信息
     */
    public void cacheUser(BaseUser user) {
        if (user == null || user.getUserId() == null) {
            return;
        }
        String key = USER_CACHE_PREFIX + user.getUserId();
        try {
            redisTemplate.opsForValue().set(key, user, USER_CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
            log.debug("缓存用户信息：userId={}", user.getUserId());
        } catch (Exception e) {
            log.warn("Redis 缓存用户失败：{}", e.getMessage());
        }
    }

    /**
     * 获取缓存的用户信息
     */
    public BaseUser getCachedUser(Long userId) {
        if (userId == null) {
            return null;
        }
        String key = USER_CACHE_PREFIX + userId;
        try {
            Object obj = redisTemplate.opsForValue().get(key);
            if (obj instanceof BaseUser) {
                log.debug("命中用户缓存：userId={}", userId);
                return (BaseUser) obj;
            }
        } catch (Exception e) {
            log.warn("Redis 获取用户缓存失败：{}", e.getMessage());
        }
        return null;
    }

    /**
     * 清除用户缓存
     */
    public void evictUserCache(Long userId) {
        if (userId == null) {
            return;
        }
        String key = USER_CACHE_PREFIX + userId;
        try {
            redisTemplate.delete(key);
            log.debug("清除用户缓存：userId={}", userId);
        } catch (Exception e) {
            log.warn("Redis 清除用户缓存失败：{}", e.getMessage());
        }
    }
}
