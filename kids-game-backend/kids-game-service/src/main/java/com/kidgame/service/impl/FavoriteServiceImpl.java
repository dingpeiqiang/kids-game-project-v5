package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.Favorite;
import com.kidgame.dao.mapper.FavoriteMapper;
import com.kidgame.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户收藏服务实现
 */
@Service
public class FavoriteServiceImpl implements FavoriteService {

    @Autowired
    private FavoriteMapper favoriteMapper;

    @Override
    @Transactional
    public boolean addFavorite(Long userId, Long gameId) {
        // 检查是否已收藏
        if (isFavorited(userId, gameId)) {
            return true; // 已收藏，返回成功
        }

        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setGameId(gameId);
        favorite.setCreateTime(System.currentTimeMillis());

        return favoriteMapper.insert(favorite) > 0;
    }

    @Override
    @Transactional
    public boolean removeFavorite(Long userId, Long gameId) {
        // 使用逻辑删除
        LambdaQueryWrapper<Favorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Favorite::getUserId, userId)
               .eq(Favorite::getGameId, gameId);

        int count = favoriteMapper.delete(wrapper);
        return count > 0;
    }

    @Override
    public List<Long> getUserFavorites(Long userId) {
        return favoriteMapper.selectGameIdsByUserId(userId);
    }

    @Override
    public boolean isFavorited(Long userId, Long gameId) {
        return favoriteMapper.countByUserIdAndGameId(userId, gameId) > 0;
    }
}