package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.dao.entity.CreatorEarnings;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.ThemeInfo;
import com.kidgame.dao.entity.ThemePurchase;
import com.kidgame.dao.mapper.CreatorEarningsMapper;
import com.kidgame.dao.mapper.GameMapper;
import com.kidgame.dao.mapper.ThemeGameRelationMapper;
import com.kidgame.dao.mapper.ThemeInfoMapper;
import com.kidgame.dao.mapper.ThemePurchaseMapper;
import com.kidgame.service.ThemeService;
import com.kidgame.service.dto.ThemeUploadDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 主题业务服务实现
 */
@Slf4j
@Service
public class ThemeServiceImpl implements ThemeService {

    @Autowired
    private ThemeInfoMapper themeInfoMapper;

    @Autowired
    private ThemePurchaseMapper themePurchaseMapper;

    @Autowired
    private CreatorEarningsMapper creatorEarningsMapper;

    @Autowired
    private GameMapper gameMapper;

    @Autowired
    private ThemeGameRelationMapper themeGameRelationMapper;

    /**
     * 获取主题列表 (分页)
     */
    @Override
    public Page<ThemeInfo> listThemes(String ownerType, Long ownerId, String status, Integer page, Integer pageSize) {
        LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
            
        // 根据所有者类型筛选
        if (ownerType != null && !ownerType.isEmpty()) {
            if ("APPLICATION".equals(ownerType)) {
                // 应用主题：适用于所有应用的通用主题
                wrapper.eq(ThemeInfo::getOwnerType, "APPLICATION");
            } else if ("GAME".equals(ownerType)) {
                // 游戏主题：仅适用于特定游戏的专用主题
                wrapper.eq(ThemeInfo::getOwnerType, "GAME");
                    
                // 如果有指定游戏 ID，进一步筛选
                if (ownerId != null) {
                    wrapper.eq(ThemeInfo::getOwnerId, ownerId);
                }
            }
        }
            
        // 状态筛选
        if (status != null && !status.isEmpty()) {
            wrapper.eq(ThemeInfo::getStatus, status);
        }
            
        wrapper.orderByDesc(ThemeInfo::getCreatedAt);
            
        return themeInfoMapper.selectPage(new Page<>(page, pageSize), wrapper);
    }

    /**
     * 获取游戏主题列表 (分页)
     */
    @Override
    public Page<ThemeInfo> listGameThemes(Long gameId, String gameCode, String status, Integer page, Integer pageSize) {
        // 直接根据 owner_id 查询属于该游戏的主题
        return listThemes("GAME", gameId, status, page, pageSize);
    }

    /**
     * 获取主题关联的游戏 ID 列表
     */
    @Override
    public List<Long> getThemeGames(Long themeId) {
        log.debug("获取主题关联的游戏列表：themeId={}", themeId);
        return themeGameRelationMapper.selectGameIdsByThemeId(themeId);
    }

    /**
     * 获取主题所有者 ID
     */
    @Override
    public Long getThemeOwner(Long themeId) {
        ThemeInfo theme = themeInfoMapper.selectById(themeId);
        if (theme == null) {
            log.warn("主题不存在：themeId={}", themeId);
            return null;
        }
        return theme.getOwnerId();
    }

    /**
     * 获取主题详情
     */
    @Override
    public ThemeInfo getThemeDetail(Long themeId) {
        ThemeInfo theme = themeInfoMapper.selectById(themeId);
        
        if (theme != null) {
            log.debug("主题详情：themeId={}, themeName={}, ownerType={}, ownerId={}", 
                    themeId, theme.getThemeName(), theme.getOwnerType(), theme.getOwnerId());
        }
        
        return theme;
    }

    /**
     * 上传主题
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemeInfo uploadTheme(Long authorId, ThemeUploadDTO themeData) {
        try {
            // 1. 创建主题信息
            ThemeInfo theme = new ThemeInfo();
            theme.setAuthorId(authorId);
            theme.setThemeName(themeData.getThemeName());
            theme.setOwnerType(themeData.getOwnerType());
            theme.setOwnerId(themeData.getOwnerId());
            theme.setAuthorName(themeData.getAuthorName());
            theme.setPrice(themeData.getPrice());
            theme.setStatus(themeData.getStatus());
            theme.setThumbnailUrl(themeData.getThumbnailUrl());
            theme.setDescription(themeData.getDescription());
            theme.setConfigJson(JSON.toJSONString(themeData.getConfig()));
            theme.setDownloadCount(0);
            theme.setTotalRevenue(0);
            theme.setCreatedAt(LocalDateTime.now());
            theme.setUpdatedAt(LocalDateTime.now());
            
            int result = themeInfoMapper.insert(theme);
            
            if (result > 0 && theme.getThemeId() != null) {
                log.info("上传主题成功：themeId={}, themeName={}, ownerType={}, ownerId={}", 
                        theme.getThemeId(), theme.getThemeName(), theme.getOwnerType(), theme.getOwnerId());
                return theme;
            }
            
            return null;
        } catch (Exception e) {
            log.error("上传主题失败：authorId={}, themeName={}", authorId, themeData.getThemeName(), e);
            return null;
        }
    }

    /**
     * 购买主题
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemePurchase purchaseTheme(Long themeId, Long buyerId) {
        try {
            // 1. 检查是否已购买
            LambdaQueryWrapper<ThemePurchase> checkWrapper = new LambdaQueryWrapper<>();
            checkWrapper.eq(ThemePurchase::getThemeId, themeId)
                       .eq(ThemePurchase::getBuyerId, buyerId)
                       .eq(ThemePurchase::getIsRefunded, 0);
            
            Long count = themePurchaseMapper.selectCount(checkWrapper);
            if (count > 0) {
                log.warn("用户已购买该主题：themeId={}, buyerId={}", themeId, buyerId);
                return null;
            }
            
            // 2. 获取主题信息
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在：themeId={}", themeId);
                return null;
            }
            
            // 3. 创建购买记录
            ThemePurchase purchase = new ThemePurchase();
            purchase.setThemeId(themeId);
            purchase.setBuyerId(buyerId);
            purchase.setPricePaid(theme.getPrice());
            purchase.setPurchaseTime(LocalDateTime.now());
            purchase.setIsRefunded(0);
            
            themePurchaseMapper.insert(purchase);
            
            // 4. 更新主题下载次数和收益
            theme.setDownloadCount(theme.getDownloadCount() + 1);
            theme.setTotalRevenue(theme.getTotalRevenue() + theme.getPrice());
            themeInfoMapper.updateById(theme);
            
            // 5. 记录创作者收益
            CreatorEarnings earnings = new CreatorEarnings();
            earnings.setCreatorId(theme.getAuthorId());
            earnings.setThemeId(themeId);
            earnings.setAmount(theme.getPrice());
            earnings.setStatus("pending");
            earnings.setCreatedAt(LocalDateTime.now());
            
            creatorEarningsMapper.insert(earnings);
            
            log.info("购买主题成功：themeId={}, buyerId={}, price={}", themeId, buyerId, theme.getPrice());
            
            return purchase;
        } catch (Exception e) {
            log.error("购买主题失败：themeId={}, buyerId={}", themeId, buyerId, e);
            return null;
        }
    }

    /**
     * 下载主题（检查是否已购买或是否为免费主题）
     */
    @Override
    public String downloadTheme(Long themeId, Long userId) {
        // 1. 获取主题配置
        ThemeInfo theme = themeInfoMapper.selectById(themeId);
        if (theme == null) {
            log.warn("主题不存在：themeId={}", themeId);
            return null;
        }
        
        // 2. 检查是否为免费主题（价格为 0 或 null）
        boolean isFree = theme.getPrice() == null || theme.getPrice() == 0;
        
        if (!isFree) {
            // 3. 如果不是免费主题，检查是否已购买
            if (!hasPurchased(themeId, userId)) {
                log.warn("用户未购买付费主题，无法下载：themeId={}, userId={}, price={}", 
                        themeId, userId, theme.getPrice());
                return null;
            }
        } else {
            log.info("免费主题，无需购买即可下载：themeId={}", themeId);
        }
        
        log.info("下载主题：themeId={}, userId={}, isFree={}", themeId, userId, isFree);
        
        return theme.getConfigJson();
    }

    /**
     * 获取我的主题列表
     */
    @Override
    public List<ThemeInfo> getMyThemes(Long authorId) {
        LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ThemeInfo::getAuthorId, authorId)
               .orderByDesc(ThemeInfo::getCreatedAt);
        
        return themeInfoMapper.selectList(wrapper);
    }

    /**
     * 获取创作者收益
     */
    @Override
    public List<CreatorEarnings> getEarnings(Long creatorId) {
        LambdaQueryWrapper<CreatorEarnings> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CreatorEarnings::getCreatorId, creatorId)
               .orderByDesc(CreatorEarnings::getCreatedAt);
        
        return creatorEarningsMapper.selectList(wrapper);
    }

    /**
     * 切换上架状态
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemeInfo toggleSaleStatus(Long themeId, Boolean onSale) {
        try {
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在：themeId={}", themeId);
                return null;
            }
            
            theme.setStatus(onSale ? "on_sale" : "offline");
            theme.setUpdatedAt(LocalDateTime.now());
            
            themeInfoMapper.updateById(theme);
            
            log.info("切换主题上架状态：themeId={}, newStatus={}", themeId, theme.getStatus());
            
            return theme;
        } catch (Exception e) {
            log.error("切换主题上架状态失败：themeId={}", themeId, e);
            return null;
        }
    }

    /**
     * 提现收益
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean withdrawEarnings(Long creatorId, Integer amount) {
        try {
            // 1. 获取可提现收益
            Integer withdrawable = getWithdrawableEarnings(creatorId);
            if (withdrawable < amount) {
                log.warn("可提现收益不足：creatorId={}, 请求={}, 可用={}", creatorId, amount, withdrawable);
                return false;
            }
            
            // 2. 更新收益记录状态
            LambdaQueryWrapper<CreatorEarnings> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(CreatorEarnings::getCreatorId, creatorId)
                   .eq(CreatorEarnings::getStatus, "pending")
                   .orderByAsc(CreatorEarnings::getCreatedAt);
            
            List<CreatorEarnings> earningsList = creatorEarningsMapper.selectList(wrapper);
            
            int remaining = amount;
            for (CreatorEarnings earnings : earningsList) {
                if (remaining <= 0) break;
                
                if (earnings.getAmount() <= remaining) {
                    earnings.setStatus("withdrawn");
                    earnings.setWithdrawnAt(LocalDateTime.now());
                    creatorEarningsMapper.updateById(earnings);
                    remaining -= earnings.getAmount();
                } else {
                    // 部分提现（这种情况不应该发生，因为金额是整数）
                    break;
                }
            }
            
            log.info("提现成功：creatorId={}, amount={}", creatorId, amount);
            
            return true;
        } catch (Exception e) {
            log.error("提现失败：creatorId={}, amount={}", creatorId, amount, e);
            return false;
        }
    }

    /**
     * 检查用户是否已购买主题
     */
    @Override
    public boolean hasPurchased(Long themeId, Long userId) {
        LambdaQueryWrapper<ThemePurchase> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ThemePurchase::getThemeId, themeId)
               .eq(ThemePurchase::getBuyerId, userId)
               .eq(ThemePurchase::getIsRefunded, 0);
        
        Long count = themePurchaseMapper.selectCount(wrapper);
        return count > 0;
    }

    /**
     * 获取创作者总收益
     */
    @Override
    public Integer getTotalEarnings(Long creatorId) {
        List<CreatorEarnings> earningsList = getEarnings(creatorId);
        return earningsList.stream()
                .mapToInt(CreatorEarnings::getAmount)
                .sum();
    }

    /**
     * 获取可提现收益
     */
    @Override
    public Integer getWithdrawableEarnings(Long creatorId) {
        LambdaQueryWrapper<CreatorEarnings> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CreatorEarnings::getCreatorId, creatorId)
               .eq(CreatorEarnings::getStatus, "pending");
        
        List<CreatorEarnings> earningsList = creatorEarningsMapper.selectList(wrapper);
        return earningsList.stream()
                .mapToInt(CreatorEarnings::getAmount)
                .sum();
    }

    /**
     * 根据ID获取游戏信息
     */
    @Override
    public Game getGameById(Long gameId) {
        return gameMapper.selectById(gameId);
    }

    /**
     * 根据游戏代码获取游戏信息
     */
    @Override
    public Game getGameByCode(String gameCode) {
        if (gameCode == null || gameCode.isEmpty()) {
            return null;
        }
        
        LambdaQueryWrapper<Game> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Game::getGameCode, gameCode);
        
        Game game = gameMapper.selectOne(wrapper);
        if (game != null) {
            log.debug("通过 gameCode 查询到游戏: code={}, id={}, name={}", 
                    gameCode, game.getGameId(), game.getGameName());
        } else {
            log.warn("未找到游戏: gameCode={}", gameCode);
        }
        
        return game;
    }
}
