package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.dao.entity.CreatorEarnings;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.entity.ThemeInfo;
import com.kidgame.dao.entity.ThemePurchase;
import com.kidgame.dao.entity.UserThemePreference;
import com.kidgame.dao.mapper.CreatorEarningsMapper;
import com.kidgame.dao.mapper.GameMapper;
import com.kidgame.dao.mapper.ThemeGameRelationMapper;
import com.kidgame.dao.mapper.ThemeInfoMapper;
import com.kidgame.dao.mapper.ThemePurchaseMapper;
import com.kidgame.dao.mapper.UserThemePreferenceMapper;
import com.kidgame.service.ThemeService;
import com.kidgame.service.GTRSSchemaService;
import com.kidgame.service.dto.ThemeUploadDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    @Autowired
    private GTRSSchemaService gtrsSchemaService;

    @Autowired
    private UserThemePreferenceMapper userThemePreferenceMapper;

    /**
     * 获取主题列表 (分页)
     * @param authorId 当前登录用户 ID（用于已下架主题过滤：已下架的非本人主题不显示）
     */
    @Override
    public Page<ThemeInfo> listThemes(String ownerType, Long ownerId, String status, Integer page, Integer pageSize, Long authorId) {
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

        // 已下架主题过滤：已下架的非本人创作主题不显示
        if (authorId != null) {
            // (status != 'offline') OR (status = 'offline' AND authorId = 当前用户)
            wrapper.and(w -> w
                .ne(ThemeInfo::getStatus, "offline")
                .or(w2 -> w2
                    .eq(ThemeInfo::getStatus, "offline")
                    .eq(ThemeInfo::getAuthorId, authorId)
                )
            );
        }

        wrapper.orderByDesc(ThemeInfo::getCreatedAt);

        return themeInfoMapper.selectPage(new Page<>(page, pageSize), wrapper);
    }

    /**
     * 获取游戏主题列表 (分页)
     * @param authorId 当前登录用户 ID（用于已下架主题过滤）
     */
    @Override
    public Page<ThemeInfo> listGameThemes(Long gameId, String gameCode, String status, Integer page, Integer pageSize) {
        // 直接根据 owner_id 查询属于该游戏的主题（authorId 由调用方传入，这里传 null 由调用方处理）
        return listThemes("GAME", gameId, status, page, pageSize, null);
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
            // 1. 验证主题配置是否符合GTRS规范
            String configJson;
            if (themeData.getConfig() != null) {
                configJson = JSON.toJSONString(themeData.getConfig());
            } else if (themeData.getConfigJson() != null) {
                configJson = themeData.getConfigJson();
            } else {
                log.error("主题配置为空：authorId={}, themeName={}", authorId, themeData.getThemeName());
                throw new RuntimeException("主题配置不能为空");
            }
            
            // 验证GTRS格式
            GTRSSchemaService.ValidationResult validationResult = gtrsSchemaService.validateTheme(configJson);
            if (!validationResult.isValid()) {
                log.error("主题GTRS格式验证失败：authorId={}, themeName={}, message={}", 
                        authorId, themeData.getThemeName(), validationResult.getMessage());
                throw new RuntimeException("主题格式不符合GTRS规范：" + validationResult.getMessage());
            }
            
            log.info("主题GTRS格式验证通过：authorId={}, themeName={}", authorId, themeData.getThemeName());
            
            // 2. 如果提供了gameCode但ownerId为空，根据gameCode查找游戏ID
            Long ownerId = themeData.getOwnerId();
            if ("GAME".equals(themeData.getOwnerType()) && ownerId == null && themeData.getGameCode() != null) {
                Game game = getGameByCode(themeData.getGameCode());
                if (game != null) {
                    ownerId = game.getGameId();
                    log.info("根据gameCode找到游戏：gameCode={}, gameId={}", themeData.getGameCode(), ownerId);
                } else {
                    log.warn("未找到对应游戏：gameCode={}", themeData.getGameCode());
                    // 可以设置为默认游戏ID或抛出异常
                }
            }
            
            // 3. 创建主题信息，处理兼容性字段
            ThemeInfo theme = new ThemeInfo();
            theme.setAuthorId(authorId);

            // 主题名称：优先使用themeName，如果为空则使用name
            String themeName = themeData.getThemeName();
            if (themeName == null || themeName.isEmpty()) {
                themeName = themeData.getName();
            }
            theme.setThemeName(themeName);

            // 所有者类型和ID
            theme.setOwnerType(themeData.getOwnerType() != null ? themeData.getOwnerType() : "GAME");
            theme.setOwnerId(ownerId);

            // ⭐ 是否为官方主题
            theme.setIsOfficial(themeData.getIsOfficial() != null ? themeData.getIsOfficial() : false);

            // 作者名称：优先使用authorName，如果为空则使用author
            String authorName = themeData.getAuthorName();
            if (authorName == null || authorName.isEmpty()) {
                authorName = themeData.getAuthor();
            }
            theme.setAuthorName(authorName != null ? authorName : "创作者");

            // 价格
            theme.setPrice(themeData.getPrice() != null ? themeData.getPrice() : 0);

            // 状态
            theme.setStatus(themeData.getStatus() != null ? themeData.getStatus() : "pending");

            // 缩略图URL：优先使用thumbnailUrl，如果为空则使用thumbnail
            String thumbnailUrl = themeData.getThumbnailUrl();
            if (thumbnailUrl == null || thumbnailUrl.isEmpty()) {
                thumbnailUrl = themeData.getThumbnail();
            }
            theme.setThumbnailUrl(thumbnailUrl);

            // 描述
            theme.setDescription(themeData.getDescription());
            theme.setConfigJson(configJson);
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
            throw e; // 重新抛出异常，让Controller处理
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
     * 审批主题（通过/拒绝）
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemeInfo approveTheme(Long themeId, Boolean approved) {
        try {
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在：themeId={}", themeId);
                return null;
            }

            // 只有待审核状态才能审批
            if (!"pending".equals(theme.getStatus())) {
                log.warn("主题不是待审核状态，无法审批：themeId={}, status={}", themeId, theme.getStatus());
                return null;
            }

            // 审批通过 → 上架；审批拒绝 → 下架
            theme.setStatus(approved ? "on_sale" : "offline");
            theme.setUpdatedAt(LocalDateTime.now());

            themeInfoMapper.updateById(theme);

            log.info("审批主题：themeId={}, approved={}, newStatus={}", themeId, approved, theme.getStatus());

            return theme;
        } catch (Exception e) {
            log.error("审批主题失败：themeId={}", themeId, e);
            throw e;
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
     * 获取用户已购买的主题列表
     */
    @Override
    public List<ThemeInfo> getPurchasedThemes(Long buyerId) {
        LambdaQueryWrapper<ThemePurchase> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ThemePurchase::getBuyerId, buyerId)
               .eq(ThemePurchase::getIsRefunded, 0);

        List<ThemePurchase> purchases = themePurchaseMapper.selectList(wrapper);

        if (purchases == null || purchases.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> themeIds = purchases.stream()
                .map(ThemePurchase::getThemeId)
                .collect(Collectors.toList());

        LambdaQueryWrapper<ThemeInfo> themeWrapper = new LambdaQueryWrapper<>();
        themeWrapper.in(ThemeInfo::getThemeId, themeIds);

        return themeInfoMapper.selectList(themeWrapper);
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

    /**
     * 获取用户可用的主题列表（官方主题 + 用户创作 + 已购买）
     */
    @Override
    public List<ThemeInfo> getMyAvailableThemes(Long userId, String ownerType, Long ownerId) {
        log.info("获取用户可用主题 - userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId);

        List<ThemeInfo> allThemes = new java.util.ArrayList<>();

        // 1. 查询官方主题（isOfficial = true）
        LambdaQueryWrapper<ThemeInfo> officialWrapper = new LambdaQueryWrapper<>();
        officialWrapper.eq(ThemeInfo::getIsOfficial, true)
                      .eq(ThemeInfo::getStatus, "on_sale");
        if (ownerType != null && !ownerType.isEmpty()) {
            officialWrapper.eq(ThemeInfo::getOwnerType, ownerType);
            if ("GAME".equals(ownerType) && ownerId != null) {
                officialWrapper.eq(ThemeInfo::getOwnerId, ownerId);
            }
        }
        List<ThemeInfo> officialThemes = themeInfoMapper.selectList(officialWrapper);
        log.info("官方主题查询结果 - ownerType: {}, 数量: {}", ownerType, officialThemes.size());
        allThemes.addAll(officialThemes);

        // 2. 查询用户创作的主题
        LambdaQueryWrapper<ThemeInfo> myWrapper = new LambdaQueryWrapper<>();
        myWrapper.eq(ThemeInfo::getAuthorId, userId);
        if (ownerType != null && !ownerType.isEmpty()) {
            myWrapper.eq(ThemeInfo::getOwnerType, ownerType);
            if ("GAME".equals(ownerType) && ownerId != null) {
                myWrapper.eq(ThemeInfo::getOwnerId, ownerId);
            }
        }
        List<ThemeInfo> myThemes = themeInfoMapper.selectList(myWrapper);
        log.info("用户主题查询结果 - userId: {}, ownerType: {}, 数量: {}", userId, ownerType, myThemes.size());
        allThemes.addAll(myThemes);

        // 3. 查询用户已购买的主题
        LambdaQueryWrapper<ThemePurchase> purchaseWrapper = new LambdaQueryWrapper<>();
        purchaseWrapper.eq(ThemePurchase::getBuyerId, userId)
                       .eq(ThemePurchase::getIsRefunded, 0);
        List<ThemePurchase> purchases = themePurchaseMapper.selectList(purchaseWrapper);

        if (!purchases.isEmpty()) {
            List<Long> themeIds = purchases.stream()
                    .map(ThemePurchase::getThemeId)
                    .collect(Collectors.toList());

            LambdaQueryWrapper<ThemeInfo> purchasedWrapper = new LambdaQueryWrapper<>();
            purchasedWrapper.in(ThemeInfo::getThemeId, themeIds);
            if (ownerType != null && !ownerType.isEmpty()) {
                purchasedWrapper.eq(ThemeInfo::getOwnerType, ownerType);
                if ("GAME".equals(ownerType) && ownerId != null) {
                    purchasedWrapper.eq(ThemeInfo::getOwnerId, ownerId);
                }
            }
            List<ThemeInfo> purchasedThemes = themeInfoMapper.selectList(purchasedWrapper);
            log.info("已购买主题查询结果 - userId: {}, ownerType: {}, 数量: {}", userId, ownerType, purchasedThemes.size());
            allThemes.addAll(purchasedThemes);
        } else {
            log.info("用户无购买记录 - userId: {}", userId);
        }

        // 去重（基于 themeId）
        List<ThemeInfo> result = allThemes.stream()
                .collect(Collectors.toMap(
                        ThemeInfo::getThemeId,
                        theme -> theme,
                        (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .collect(Collectors.toList());

        log.info("最终去重后主题数量：{}", result.size());
        return result;
    }
    
    /**
     * ⭐ 新增：获取用户可用的主题（支持分页和来源筛选）
     */
    @Override
    public Map<String, Object> getMyAvailableThemesWithPage(Long userId, String ownerType, Long ownerId, 
                                                             String source, Integer page, Integer pageSize) {
        log.info("获取用户可用主题（分页）- userId: {}, ownerType: {}, ownerId: {}, source: {}, page: {}, pageSize: {}", 
                userId, ownerType, ownerId, source, page, pageSize);
    
        // 1. 构建查询条件
        LambdaQueryWrapper<ThemeInfo> wrapper = buildQueryWrapper(userId, ownerType, ownerId, source);
    
        // 2. 执行分页查询
        Page<ThemeInfo> pageInfo = new Page<>(page, pageSize);
        themeInfoMapper.selectPage(pageInfo, wrapper);
        List<ThemeInfo> themes = pageInfo.getRecords();
        
        // ⭐ 3. 获取用户当前使用的主题 ID（用于标记 isCurrent）
        Long currentThemeId = null;
        try {
            UserThemePreference preference = userThemePreferenceMapper.selectUserCurrentTheme(userId, ownerType, ownerId);
            if (preference != null) {
                currentThemeId = preference.getThemeId();
                log.info("用户当前主题偏好 - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                        userId, ownerType, ownerId, currentThemeId);
            }
        } catch (Exception e) {
            log.warn("获取用户主题偏好失败，不影响主题列表返回", e);
        }
        
        // 4. 为每个主题添加游戏信息和 isCurrent 标记
        List<Map<String, Object>> themesWithGame = new java.util.ArrayList<>();
        for (ThemeInfo theme : themes) {
            Map<String, Object> themeMap = JSON.parseObject(JSON.toJSONString(theme), Map.class);

            // 查询主题关联的游戏信息
            if ("GAME".equals(theme.getOwnerType()) && theme.getOwnerId() != null) {
                var game = getGameById(theme.getOwnerId());
                if (game != null) {
                    themeMap.put("gameId", game.getGameId());
                    themeMap.put("gameCode", game.getGameCode());
                    themeMap.put("gameName", game.getGameName());
                }
            }

            // 如果没有关联游戏，设置默认值
            if (!themeMap.containsKey("gameName") || themeMap.get("gameName") == null) {
                themeMap.put("gameName", "游戏主题");
            }
            
            // ⭐ 标记是否为用户当前使用的主题（优先级最高）
            Boolean isCurrent = (currentThemeId != null && theme.getThemeId().equals(currentThemeId));
            themeMap.put("isCurrent", isCurrent != null ? isCurrent : false);

            themesWithGame.add(themeMap);
        }

        // 5. 返回分页数据
        Map<String, Object> result = new HashMap<>();
        result.put("list", themesWithGame);
        result.put("total", pageInfo.getTotal());
        result.put("pageNum", page);
        result.put("pageSize", pageSize);
    
        log.info("分页查询结果 - total: {}, pageNum: {}, list size: {}", pageInfo.getTotal(), page, themes.size());
        return result;
    }
    
    /**
     * 构建查询条件
     * 
     * ⭐ 优化说明：
     * - 简化 WHERE 条件，避免复杂的 OR 嵌套
     * - purchased 场景：只排除自己创作的，包含官方主题
     * - all 场景：官方 + 我的 + 已购买的（允许重复，由前端去重）
     */
    private LambdaQueryWrapper<ThemeInfo> buildQueryWrapper(Long userId, String ownerType, Long ownerId, String source) {
        LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
    
        // 基础条件：已上架
        wrapper.eq(ThemeInfo::getStatus, "on_sale");
    
        // 适用范围筛选
        if (ownerType != null && !ownerType.isEmpty()) {
            wrapper.eq(ThemeInfo::getOwnerType, ownerType);
            if ("GAME".equals(ownerType) && ownerId != null) {
                wrapper.eq(ThemeInfo::getOwnerId, ownerId);
            }
        }
    
        // ⭐ 来源筛选 - 简化逻辑
        switch (source) {
            case "official":
                // 官方主题：只显示官方的
                wrapper.eq(ThemeInfo::getIsOfficial, true);
                break;
    
            case "purchased":
                // 已购买的主题：查询已购买 ID 列表，排除自己创作的
                List<Long> purchasedIds = getPurchaseThemeIds(userId);
                if (purchasedIds.isEmpty()) {
                    // 没有购买记录，返回空结果
                    wrapper.eq(ThemeInfo::getThemeId, -1L);
                } else {
                    // 在已购买列表中，且不是自己创作的（包含官方主题）
                    wrapper.in(ThemeInfo::getThemeId, purchasedIds)
                           .ne(ThemeInfo::getAuthorId, userId);
                }
                break;
    
            case "mine":
                // 自己创作的主题
                wrapper.eq(ThemeInfo::getAuthorId, userId);
                break;
    
            default: // "all"
                // 全部可用主题：官方 OR 我的 OR 已购买的
                List<Long> allPurchasedIds = getPurchaseThemeIds(userId);
                
                if (allPurchasedIds.isEmpty()) {
                    // 没有购买记录：只显示官方和我的
                    wrapper.and(w -> w
                        .eq(ThemeInfo::getIsOfficial, true)
                        .or(or -> or.eq(ThemeInfo::getAuthorId, userId))
                    );
                } else {
                    // 有购买记录：官方 OR 我的 OR 已购买的（排除自己创作的重复项）
                    wrapper.and(w -> w
                        .eq(ThemeInfo::getIsOfficial, true)  // 官方主题
                        .or(or -> or
                            .eq(ThemeInfo::getAuthorId, userId)  // 我的主题
                            .or(in -> in
                                .in(ThemeInfo::getThemeId, allPurchasedIds)  // 已购买
                                .ne(ThemeInfo::getAuthorId, userId)  // 排除自己创作的
                            )
                        )
                    );
                }
                break;
        }
    
        return wrapper;
    }
    
    /**
     * 获取用户已购买的主题 ID 列表
     */
    private List<Long> getPurchaseThemeIds(Long userId) {
        LambdaQueryWrapper<ThemePurchase> purchaseWrapper = new LambdaQueryWrapper<>();
        purchaseWrapper.eq(ThemePurchase::getBuyerId, userId)
                       .eq(ThemePurchase::getIsRefunded, 0);
        List<ThemePurchase> purchases = themePurchaseMapper.selectList(purchaseWrapper);
    
        if (purchases.isEmpty()) {
            return new java.util.ArrayList<>();
        }
    
        return purchases.stream()
                .map(ThemePurchase::getThemeId)
                .collect(Collectors.toList());
    }
    
    
    /**
     * 更新主题
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemeInfo updateTheme(Long themeId, ThemeUploadDTO themeData) {
        try {
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在：themeId={}", themeId);
                throw new RuntimeException("主题不存在");
            }

            // 如果提供了新配置，验证并更新
            if (themeData.getConfig() != null || themeData.getConfigJson() != null) {
                String configJson;
                if (themeData.getConfig() != null) {
                    configJson = JSON.toJSONString(themeData.getConfig());
                } else {
                    configJson = themeData.getConfigJson();
                }

                // 验证GTRS格式
                GTRSSchemaService.ValidationResult validationResult = gtrsSchemaService.validateTheme(configJson);
                if (!validationResult.isValid()) {
                    log.error("主题GTRS格式验证失败：themeId={}, message={}", themeId, validationResult.getMessage());
                    throw new RuntimeException("主题格式不符合GTRS规范：" + validationResult.getMessage());
                }

                theme.setConfigJson(configJson);
            }

            // 更新可编辑字段
            if (themeData.getThemeName() != null) {
                theme.setThemeName(themeData.getThemeName());
            }
            if (themeData.getAuthorName() != null) {
                theme.setAuthorName(themeData.getAuthorName());
            }
            if (themeData.getPrice() != null) {
                theme.setPrice(themeData.getPrice());
            }
            if (themeData.getThumbnailUrl() != null) {
                theme.setThumbnailUrl(themeData.getThumbnailUrl());
            }
            if (themeData.getDescription() != null) {
                theme.setDescription(themeData.getDescription());
            }
            if (themeData.getStatus() != null) {
                theme.setStatus(themeData.getStatus());
            }

            theme.setUpdatedAt(LocalDateTime.now());
            themeInfoMapper.updateById(theme);

            log.info("更新主题成功：themeId={}, themeName={}", themeId, theme.getThemeName());
            return theme;
        } catch (Exception e) {
            log.error("更新主题失败：themeId={}", themeId, e);
            throw e;
        }
    }

    /**
     * 删除主题
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteTheme(Long themeId) {
        try {
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在：themeId={}", themeId);
                return false;
            }

            // 删除关联的购买记录
            LambdaQueryWrapper<ThemePurchase> purchaseWrapper = new LambdaQueryWrapper<>();
            purchaseWrapper.eq(ThemePurchase::getThemeId, themeId);
            themePurchaseMapper.delete(purchaseWrapper);

            // 删除关联的收益记录
            LambdaQueryWrapper<CreatorEarnings> earningsWrapper = new LambdaQueryWrapper<>();
            earningsWrapper.eq(CreatorEarnings::getThemeId, themeId);
            creatorEarningsMapper.delete(earningsWrapper);

            // 删除主题游戏关联关系
            LambdaQueryWrapper<com.kidgame.dao.entity.ThemeGameRelation> relationWrapper = new LambdaQueryWrapper<>();
            relationWrapper.eq(com.kidgame.dao.entity.ThemeGameRelation::getThemeId, themeId);
            themeGameRelationMapper.delete(relationWrapper);

            // 物理删除主题记录
            themeInfoMapper.deleteById(themeId);

            log.info("删除主题成功：themeId={}, themeName={}", themeId, theme.getThemeName());
            return true;
        } catch (Exception e) {
            log.error("删除主题失败：themeId={}", themeId, e);
            return false;
        }
    }

    // ==================== 用户主题偏好相关方法实现 ====================

    /**
     * ⭐ 获取用户当前使用的主题
     */
    @Override
    public UserThemePreference getUserCurrentTheme(Long userId, String ownerType, Long ownerId) {
        if (userId == null || ownerType == null || ownerId == null) {
            log.warn("参数为空，无法获取用户当前主题 - userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId);
            return null;
        }
        
        try {
            UserThemePreference preference = userThemePreferenceMapper.selectUserCurrentTheme(userId, ownerType, ownerId);
            if (preference != null) {
                log.info("获取用户当前主题成功 - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                        userId, ownerType, ownerId, preference.getThemeId());
            } else {
                log.info("用户暂无主题偏好 - userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId);
            }
            return preference;
        } catch (Exception e) {
            log.error("获取用户当前主题失败 - userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId, e);
            return null;
        }
    }

    /**
     * ⭐ 保存用户主题偏好
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean saveUserPreference(Long userId, String ownerType, Long ownerId, Long themeId) {
        if (userId == null || ownerType == null || ownerId == null || themeId == null) {
            log.warn("参数为空，无法保存用户主题偏好 - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                    userId, ownerType, ownerId, themeId);
            return false;
        }
        
        try {
            // 验证主题是否存在
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在：themeId={}", themeId);
                return false;
            }
            
            // 验证主题的 ownerType 和 ownerId 是否匹配
            if (!ownerType.equals(theme.getOwnerType()) || !ownerId.equals(theme.getOwnerId())) {
                log.warn("主题与目标不匹配 - theme: ownerType={}, ownerId={}, target: ownerType={}, ownerId={}",
                        theme.getOwnerType(), theme.getOwnerId(), ownerType, ownerId);
                return false;
            }
            
            // 查询是否已存在偏好记录
            UserThemePreference existing = userThemePreferenceMapper.selectUserCurrentTheme(userId, ownerType, ownerId);
            
            if (existing != null) {
                // 更新现有记录
                existing.setThemeId(themeId);
                existing.setIsActive(1);
                existing.setUpdatedAt(LocalDateTime.now());
                int updateResult = userThemePreferenceMapper.updateById(existing);
                log.info("更新用户主题偏好成功 - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                        userId, ownerType, ownerId, themeId);
                return updateResult > 0;
            } else {
                // 创建新记录
                UserThemePreference preference = new UserThemePreference();
                preference.setUserId(userId);
                preference.setOwnerType(ownerType);
                preference.setOwnerId(ownerId);
                preference.setThemeId(themeId);
                preference.setIsActive(1);
                preference.setCreatedAt(LocalDateTime.now());
                preference.setUpdatedAt(LocalDateTime.now());
                
                int insertResult = userThemePreferenceMapper.insert(preference);
                log.info("创建用户主题偏好成功 - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                        userId, ownerType, ownerId, themeId);
                return insertResult > 0;
            }
        } catch (Exception e) {
            log.error("保存用户主题偏好失败 - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                    userId, ownerType, ownerId, themeId, e);
            return false;
        }
    }

    /**
     * ⭐ 获取用户对游戏的默认主题（从 user_theme_preference 表）
     */
    @Override
    public Long getDefaultThemeForGame(Long gameId) {
        if (gameId == null) {
            log.warn("游戏 ID 为空，无法获取默认主题");
            return null;
        }
        
        try {
            // 这里可以扩展为：查找大多数用户为该游戏选择的主题作为推荐默认主题
            // 目前先返回 theme_info 表中标记为 is_default 的主题
            LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ThemeInfo::getOwnerId, gameId)
                   .eq(ThemeInfo::getOwnerType, "GAME")
                   .eq(ThemeInfo::getIsDefault, true)
                   .eq(ThemeInfo::getStatus, "on_sale")
                   .last("LIMIT 1");
            
            ThemeInfo defaultTheme = themeInfoMapper.selectOne(wrapper);
            if (defaultTheme != null) {
                log.info("获取游戏默认主题成功 - gameId: {}, themeId: {}", gameId, defaultTheme.getThemeId());
                return defaultTheme.getThemeId();
            } else {
                log.info("游戏暂无默认主题 - gameId: {}", gameId);
                return null;
            }
        } catch (Exception e) {
            log.error("获取游戏默认主题失败 - gameId: {}", gameId, e);
            return null;
        }
    }
}
