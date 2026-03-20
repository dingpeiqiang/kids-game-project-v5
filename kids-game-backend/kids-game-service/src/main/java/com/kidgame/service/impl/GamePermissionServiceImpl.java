package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.kidgame.common.util.JsonUtil;
import com.kidgame.dao.entity.GamePermission;
import com.kidgame.dao.mapper.BlockedGameMapper;
import com.kidgame.dao.mapper.GamePermissionMapper;
import com.kidgame.service.GamePermissionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 游戏权限服务实现（支持所有用户类型）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Slf4j
@Service
public class GamePermissionServiceImpl extends ServiceImpl<GamePermissionMapper, GamePermission>
        implements GamePermissionService {

    @Autowired
    private BlockedGameMapper blockedGameMapper;

    // ========== 基础 CRUD ==========

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createPermission(GamePermission permission) {
        long currentTime = System.currentTimeMillis();
        permission.setCreateTime(currentTime);
        permission.setUpdateTime(currentTime);

        // 设置默认值
        if (permission.getUserType() == null) {
            permission.setUserType(GamePermission.UserType.KID);
        }
        if (permission.getResourceType() == null) {
            permission.setResourceType(GamePermission.ResourceType.GAME);
        }

        getBaseMapper().insert(permission);
        log.info("创建游戏权限. PermissionId: {}, UserId: {}, UserType: {}, GameId: {}, Type: {}",
                permission.getPermissionId(), permission.getUserId(), permission.getUserType(),
                permission.getGameId(), permission.getPermissionType());

        return permission.getPermissionId();
    }

    @Override
    public void updatePermission(GamePermission permission) {
        permission.setUpdateTime(System.currentTimeMillis());
        getBaseMapper().updateById(permission);
        log.info("更新游戏权限. PermissionId: {}", permission.getPermissionId());
    }

    @Override
    public void deleteById(Long permissionId) {
        getBaseMapper().deleteById(permissionId);
        log.info("删除游戏权限. PermissionId: {}", permissionId);
    }

    @Override
    public void deletePermission(Long userId, Integer userType, Long gameId) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType)
                .eq(GamePermission::getGameId, gameId);
        getBaseMapper().delete(wrapper);
        log.info("删除游戏权限. UserId: {}, UserType: {}, GameId: {}", userId, userType, gameId);
    }

    // ========== 查询接口 ==========

    @Override
    public GamePermission setPermission(GamePermission permission) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, permission.getUserId())
                .eq(GamePermission::getUserType, permission.getUserType())
                .eq(GamePermission::getGameId, permission.getGameId());
        GamePermission existing = getBaseMapper().selectOne(wrapper);

        if (existing != null) {
            permission.setPermissionId(existing.getPermissionId());
            updatePermission(permission);
        } else {
            long currentTime = System.currentTimeMillis();
            permission.setCreateTime(currentTime);
            permission.setUpdateTime(currentTime);

            // 设置默认值
            if (permission.getUserType() == null) {
                permission.setUserType(GamePermission.UserType.KID);
            }
            if (permission.getResourceType() == null) {
                permission.setResourceType(GamePermission.ResourceType.GAME);
            }

            getBaseMapper().insert(permission);
            log.info("创建游戏权限. PermissionId: {}, UserId: {}, UserType: {}, GameId: {}, Type: {}",
                    permission.getPermissionId(), permission.getUserId(), permission.getUserType(),
                    permission.getGameId(), permission.getPermissionType());
        }

        return permission;
    }

    @Override
    public List<GamePermission> batchSetPermissions(List<GamePermission> permissions) {
        List<GamePermission> results = new ArrayList<>();
        for (GamePermission permission : permissions) {
            results.add(setPermission(permission));
        }
        return results;
    }

    @Override
    public GamePermission getPermission(Long userId, Integer userType, Long gameId) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType)
                .eq(GamePermission::getGameId, gameId);
        return getBaseMapper().selectOne(wrapper);
    }

    @Override
    public List<GamePermission> getUserPermissions(Long userId, Integer userType) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType);
        return getBaseMapper().selectList(wrapper);
    }

    @Override
    public List<GamePermission> getGamePermissions(Long gameId) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getGameId, gameId);
        return getBaseMapper().selectList(wrapper);
    }

    @Override
    public List<GamePermission> getPermissions(Long userId, Integer userType, Long gameId) {
        return getBaseMapper().selectPermissions(userId, userType, gameId);
    }

    @Override
    public List<GamePermission> getResourcePermissions(String resourceType, Long resourceId) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getResourceType, resourceType)
                .eq(GamePermission::getGameId, resourceId);
        return getBaseMapper().selectList(wrapper);
    }

    // ========== 权限检查 ==========

    @Override
    public boolean checkGameStart(Long userId, Integer userType, Long gameId) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType)
                .eq(GamePermission::getGameId, gameId);
        GamePermission permission = getBaseMapper().selectOne(wrapper);

        if (permission == null) {
            return true;
        }

        String type = permission.getPermissionType();
        if (GamePermission.PermissionType.BLOCK.equals(type)) {
            return false;
        }
        if (GamePermission.PermissionType.LIMIT_TIME.equals(type)
                || GamePermission.PermissionType.LIMIT_COUNT.equals(type)) {
            return true;
        }

        return true;
    }

    @Override
    public boolean isGameBlocked(Long userId, Integer userType, Long gameId) {
        // 检查细粒度权限表
        List<GamePermission> permissions = getPermissions(userId, userType, gameId);
        for (GamePermission permission : permissions) {
            if (GamePermission.PermissionType.BLOCK.equals(permission.getPermissionType())) {
                return true;
            }
        }

        // 检查屏蔽游戏表（仅针对儿童用户，兼容旧数据）
        if (userType == GamePermission.UserType.KID) {
            return getBaseMapper().isGameBlocked(userId, userType, gameId);
        }

        return false;
    }

    @Override
    public boolean checkPermission(Long userId, Integer userType, String resourceType, Long resourceId, String operation) {
        // TODO: 实现通用的权限检查逻辑
        // 根据资源类型和操作类型检查权限
        return true;
    }

    // ========== 便捷方法 ==========

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void blockGame(Long userId, Integer userType, Long gameId) {
        // 检查是否已屏蔽
        if (isGameBlocked(userId, userType, gameId)) {
            log.warn("游戏已被屏蔽. UserId: {}, UserType: {}, GameId: {}", userId, userType, gameId);
            return;
        }

        // 创建屏蔽权限
        GamePermission permission = new GamePermission();
        permission.setUserId(userId);
        permission.setUserType(userType);
        permission.setGameId(gameId);
        permission.setPermissionType(GamePermission.PermissionType.BLOCK);
        permission.setResourceType(GamePermission.ResourceType.GAME);
        permission.setPermissionParams(null);
        createPermission(permission);

        // 如果是儿童用户，同时添加到屏蔽游戏表（兼容旧数据）
        if (userType == GamePermission.UserType.KID) {
            com.kidgame.dao.entity.BlockedGame blockedGame = new com.kidgame.dao.entity.BlockedGame();
            blockedGame.setKidId(userId);
            blockedGame.setGameId(gameId);
            blockedGame.setCreateTime(System.currentTimeMillis());
            blockedGameMapper.insert(blockedGame);
        }

        log.info("屏蔽游戏. UserId: {}, UserType: {}, GameId: {}", userId, userType, gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unblockGame(Long userId, Integer userType, Long gameId) {
        // 删除屏蔽权限
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType)
                .eq(GamePermission::getGameId, gameId)
                .eq(GamePermission::getPermissionType, GamePermission.PermissionType.BLOCK);
        getBaseMapper().delete(wrapper);

        // 如果是儿童用户，同时删除屏蔽游戏表记录（兼容旧数据）
        if (userType == GamePermission.UserType.KID) {
            LambdaQueryWrapper<com.kidgame.dao.entity.BlockedGame> blockedWrapper = new LambdaQueryWrapper<>();
            blockedWrapper.eq(com.kidgame.dao.entity.BlockedGame::getKidId, userId)
                    .eq(com.kidgame.dao.entity.BlockedGame::getGameId, gameId);
            blockedGameMapper.delete(blockedWrapper);
        }

        log.info("取消屏蔽游戏. UserId: {}, UserType: {}, GameId: {}", userId, userType, gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchBlockGames(Long userId, Integer userType, List<Long> gameIds) {
        if (gameIds == null || gameIds.isEmpty()) {
            return;
        }

        for (Long gameId : gameIds) {
            if (!isGameBlocked(userId, userType, gameId)) {
                blockGame(userId, userType, gameId);
            }
        }

        log.info("批量屏蔽游戏. UserId: {}, UserType: {}, Count: {}", userId, userType, gameIds.size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUnblockGames(Long userId, Integer userType, List<Long> gameIds) {
        if (gameIds == null || gameIds.isEmpty()) {
            return;
        }

        for (Long gameId : gameIds) {
            unblockGame(userId, userType, gameId);
        }

        log.info("批量取消屏蔽游戏. UserId: {}, UserType: {}, Count: {}", userId, userType, gameIds.size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void setLimitTimePermission(Long userId, Integer userType, Long gameId, Integer maxMinutes) {
        Map<String, Object> params = new HashMap<>();
        params.put("max_minutes", maxMinutes);
        params.put("reset_period", GamePermission.ResetPeriod.DAILY);

        GamePermission permission = new GamePermission();
        permission.setUserId(userId);
        permission.setUserType(userType);
        permission.setGameId(gameId);
        permission.setResourceType(GamePermission.ResourceType.GAME);
        permission.setPermissionType(GamePermission.PermissionType.LIMIT_TIME);
        permission.setPermissionParams(JsonUtil.toJson(params));
        createPermission(permission);

        log.info("设置限时权限. UserId: {}, UserType: {}, GameId: {}, MaxMinutes: {}",
                userId, userType, gameId, maxMinutes);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void setLimitCountPermission(Long userId, Integer userType, Long gameId, Integer maxCount) {
        Map<String, Object> params = new HashMap<>();
        params.put("max_count", maxCount);
        params.put("reset_period", GamePermission.ResetPeriod.DAILY);

        GamePermission permission = new GamePermission();
        permission.setUserId(userId);
        permission.setUserType(userType);
        permission.setGameId(gameId);
        permission.setResourceType(GamePermission.ResourceType.GAME);
        permission.setPermissionType(GamePermission.PermissionType.LIMIT_COUNT);
        permission.setPermissionParams(JsonUtil.toJson(params));
        createPermission(permission);

        log.info("设置限次权限. UserId: {}, UserType: {}, GameId: {}, MaxCount: {}",
                userId, userType, gameId, maxCount);
    }

    @Override
    public void updatePermissionType(Long userId, Integer userType, Long gameId, String permissionType) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType)
                .eq(GamePermission::getGameId, gameId);
        GamePermission permission = getBaseMapper().selectOne(wrapper);

        if (permission != null) {
            permission.setPermissionType(String.valueOf(permissionType));
            updatePermission(permission);
        }
    }

    @Override
    public void updateTimeLimit(Long userId, Integer userType, Long gameId, Integer timeLimitMinutes) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType)
                .eq(GamePermission::getGameId, gameId);
        GamePermission permission = getBaseMapper().selectOne(wrapper);

        if (permission != null) {
            Map<String, Object> params = new HashMap<>();
            params.put("max_minutes", timeLimitMinutes);
            params.put("reset_period", GamePermission.ResetPeriod.DAILY);
            permission.setPermissionParams(JsonUtil.toJson(params));
            updatePermission(permission);
        }
    }

    @Override
    public void updateCountLimit(Long userId, Integer userType, Long gameId, Integer countLimit) {
        LambdaQueryWrapper<GamePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GamePermission::getUserId, userId)
                .eq(GamePermission::getUserType, userType)
                .eq(GamePermission::getGameId, gameId);
        GamePermission permission = getBaseMapper().selectOne(wrapper);

        if (permission != null) {
            Map<String, Object> params = new HashMap<>();
            params.put("max_count", countLimit);
            params.put("reset_period", GamePermission.ResetPeriod.DAILY);
            permission.setPermissionParams(JsonUtil.toJson(params));
            updatePermission(permission);
        }
    }
}
