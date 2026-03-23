package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.TypeReference;
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
 * 主题服务实现
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
     * @param authorId 当前登录用户 ID；用于获取当前用户拥有的主题；用于获取当前用户拥有的默认主题
     */
    @Override
    public Page<ThemeInfo> listThemes(String ownerType, Long ownerId, String status, Integer page, Integer pageSize, Long authorId) {
        LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();

        // 根据 owner_type 过滤?
        if (ownerType != null && !ownerType.isEmpty()) {
            if ("APPLICATION".equals(ownerType)) {
                // 应用主题；获取应用所有的主题
                wrapper.eq(ThemeInfo::getOwnerType, "APPLICATION");
            } else if ("GAME".equals(ownerType)) {
                // 游戏主题；获取游戏所有的主题
                wrapper.eq(ThemeInfo::getOwnerType, "GAME");

                // 如果指定了游戏ID；则进一步过滤?
                if (ownerId != null) {
                    wrapper.eq(ThemeInfo::getOwnerId, ownerId);
                }
            }
        }

        // 根据 status 过滤?
        if (status != null && !status.isEmpty()) {
            wrapper.eq(ThemeInfo::getStatus, status);
        }

        // 获取当前用户的主题；(status != 'offline') OR (status = 'offline' AND authorId = 当前用户)
        if (authorId != null) {
            // (status != 'offline') OR (status = 'offline' AND authorId = 褰撳墠鐢ㄦ埛)
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
     * @param authorId 当前登录用户 ID；用于获取当前用户拥有的主题；用于获取当前用户拥有的默认主题
     */
    @Override
    public Page<ThemeInfo> listGameThemes(Long gameId, String gameCode, String status, Integer page, Integer pageSize) {
        // 转换为根据 owner_id 查询；如果是游戏主题；则 authorId 也传入；否则传入 null；则不考虑 authorId
        return listThemes("GAME", gameId, status, page, pageSize, null);
    }

    /**
     * 获取主题关联的游戏ID列表
     */
    @Override
    public List<Long> getThemeGames(Long themeId) {
        log.debug("获取主题关联的游戏ID列表；themeId={}", themeId);
        return themeGameRelationMapper.selectGameIdsByThemeId(themeId);
    }

    /**
     * 获取主题所属ID
     */
    @Override
    public Long getThemeOwner(Long themeId) {
        ThemeInfo theme = themeInfoMapper.selectById(themeId);
        if (theme == null) {
            log.warn("主题不存在；themeId={}", themeId);
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
            log.debug("主题详情；themeId={}, themeName={}, ownerType={}, ownerId={}", 
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
            // 1. 验证主题配置是否为空
            String configJson;
            if (themeData.getConfig() != null) {
                configJson = JSON.toJSONString(themeData.getConfig());
            } else if (themeData.getConfigJson() != null) {
                configJson = themeData.getConfigJson();
            } else {
                log.error("主题配置为空；authorId={}, themeName={}", authorId, themeData.getThemeName());
                throw new RuntimeException("主题配置不能为空");
            }
            
            // 验证GTRS格式
            GTRSSchemaService.ValidationResult validationResult = gtrsSchemaService.validateTheme(configJson);
            if (!validationResult.isValid()) {
                log.error("主题GTRS格式验证失败：authorId={}, themeName={}, message={}", 
                        authorId, themeData.getThemeName(), validationResult.getMessage());
                throw new RuntimeException("主题格式不符合GTRS规范：" + validationResult.getMessage());
            }
            
            log.info("主题GTRS格式验证通过；authorId={}, themeName={}", authorId, themeData.getThemeName());
            
            // 2. 如果没有指定 gameId 和 ownerId；则根据 gameCode 查找游戏ID
            Long ownerId = themeData.getOwnerId();
            if ("GAME".equals(themeData.getOwnerType()) && ownerId == null && themeData.getGameCode() != null) {
                Game game = getGameByCode(themeData.getGameCode());
                if (game != null) {
                    ownerId = game.getGameId();
                    log.info("根据gameCode找到游戏；gameCode={}, gameId={}", themeData.getGameCode(), ownerId);
                } else {
                    log.warn("未找到游戏；gameCode={}", themeData.getGameCode());
                    // 是否自动创建游戏ID？
                }
            }
            
            // 3. 创建主题信息；是否需要唯一性检查？
            ThemeInfo theme = new ThemeInfo();
            theme.setAuthorId(authorId);

            // 主题名称；如果 themeName 为空；则使用 name
            String themeName = themeData.getThemeName();
            if (themeName == null || themeName.isEmpty()) {
                themeName = themeData.getName();
            }
            theme.setThemeName(themeName);

            // 所属类型
            theme.setOwnerType(themeData.getOwnerType() != null ? themeData.getOwnerType() : "GAME");
            theme.setOwnerId(ownerId);

            // 是否官方？
            theme.setIsOfficial(themeData.getIsOfficial() != null ? themeData.getIsOfficial() : false);

            // 作者名称；如果 authorName 为空；则使用 author
            String authorName = themeData.getAuthorName();
            if (authorName == null || authorName.isEmpty()) {
                authorName = themeData.getAuthor();
            }
            theme.setAuthorName(authorName != null ? authorName : "未知作者");

            // 价格
            theme.setPrice(themeData.getPrice() != null ? themeData.getPrice() : 0);

            // 状态
            theme.setStatus(themeData.getStatus() != null ? themeData.getStatus() : "pending");

            // 缩略图URL；如果 thumbnailUrl 为空；则使用 thumbnail
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
                log.info("上传主题成功；themeId={}, themeName={}, ownerType={}, ownerId={}", 
                        theme.getThemeId(), theme.getThemeName(), theme.getOwnerType(), theme.getOwnerId());
                return theme;
            }
            
            return null;
        } catch (Exception e) {
            log.error("上传主题失败；authorId={}, themeName={}", authorId, themeData.getThemeName(), e);
            throw e; // 重新抛出异常；由Controller处理
        }
    }

    /**
     * 购买主题
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemePurchase purchaseTheme(Long themeId, Long buyerId) {
        try {
            // 1. 检查是否已经购买
            LambdaQueryWrapper<ThemePurchase> checkWrapper = new LambdaQueryWrapper<>();
            checkWrapper.eq(ThemePurchase::getThemeId, themeId)
                       .eq(ThemePurchase::getBuyerId, buyerId)
                       .eq(ThemePurchase::getIsRefunded, 0);
            
            Long count = themePurchaseMapper.selectCount(checkWrapper);
            if (count > 0) {
                log.warn("用户已经购买主题；themeId={}, buyerId={}", themeId, buyerId);
                return null;
            }
            
            // 2. 获取主题信息
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在；themeId={}", themeId);
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
            
            // 4. 更新主题下载次数和总收入
            theme.setDownloadCount(theme.getDownloadCount() + 1);
            theme.setTotalRevenue(theme.getTotalRevenue() + theme.getPrice());
            themeInfoMapper.updateById(theme);
            
            // 5. 创建创作者收益记录
            CreatorEarnings earnings = new CreatorEarnings();
            earnings.setCreatorId(theme.getAuthorId());
            earnings.setThemeId(themeId);
            earnings.setAmount(theme.getPrice());
            earnings.setStatus("pending");
            earnings.setCreatedAt(LocalDateTime.now());
            
            creatorEarningsMapper.insert(earnings);
            
            log.info("购买主题成功；themeId={}, buyerId={}, price={}", themeId, buyerId, theme.getPrice());
            
            return purchase;
        } catch (Exception e) {
            log.error("购买主题失败；themeId={}, buyerId={}", themeId, buyerId, e);
            return null;
        }
    }

    /**
     * 下载主题；是否已经购买主题；如果是免费主题；则不需要购买
     */
    @Override
    public String downloadTheme(Long themeId, Long userId) {
        // 1. 获取主题配置
        ThemeInfo theme = themeInfoMapper.selectById(themeId);
        if (theme == null) {
            log.warn("主题不存在；themeId={}", themeId);
            return null;
        }
        
        // 2. 是否为免费主题；价格为 0 或 null？
        boolean isFree = theme.getPrice() == null || theme.getPrice() == 0;
        
        if (!isFree) {
            // 3. 如果不是免费主题；则检查是否已经购买
            if (!hasPurchased(themeId, userId)) {
                log.warn("用户未购买主题；无法下载；themeId={}, userId={}, price={}", 
                        themeId, userId, theme.getPrice());
                return null;
            }
        } else {
            log.info("免费主题；无需购买；直接下载；themeId={}", themeId);
        }
        
        log.info("下载主题；themeId={}, userId={}, isFree={}", themeId, userId, isFree);

        // 解析 GTRS 配置；themeInfo 中包含；specMeta + globalStyle + resources
        String configJson = theme.getConfigJson();
        Map<String, Object> gtrsTheme = new HashMap<>();

        // 1. 解析 configJson 获取 globalStyle + resources
        Map<String, Object> configObj = null;
        if (configJson != null && !configJson.trim().isEmpty()) {
            try {
                configObj = JSON.parseObject(configJson, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.error("解析 configJson 失败；themeId={}", themeId, e);
            }
        }

        // 2. 解析 GTRS 配置；如果没有 themeInfo；则从数据源中查询？
        Map<String, Object> specMeta = new HashMap<>();
        specMeta.put("specName", "GTRS");
        specMeta.put("specVersion", "1.0.0");
        specMeta.put("compatibleVersion", "1.0.0");
        gtrsTheme.put("specMeta", specMeta);

        // 3. 解析 configJson 获取 globalStyle + resources
        if (configObj != null) {
            gtrsTheme.put("globalStyle", configObj.get("globalStyle"));
            gtrsTheme.put("resources", configObj.get("resources"));
        } else {
            // 为空；则为空配置
            gtrsTheme.put("globalStyle", new HashMap<>());
            gtrsTheme.put("resources", new HashMap<>());
        }

        // 返回 themeInfo 配置；作为 response 数据？
        return JSON.toJSONString(gtrsTheme);
    }

    /**
     * 获取主题编辑数据；配置；资源摘要
     * 返回；themeInfo；配置；资源摘要
     */
    @Override
    public Map<String, Object> getEditorData(Long themeId, Long userId) {
        // 1. 获取主题信息
        ThemeInfo theme = themeInfoMapper.selectById(themeId);
        if (theme == null) {
            log.warn("主题不存在；themeId={}", themeId);
            return null;
        }

        // 2. 是否免费；是否已经购买？
        boolean isFree = theme.getPrice() == null || theme.getPrice() == 0;
        if (!isFree && !hasPurchased(themeId, userId)) {
            log.warn("用户未购买主题；无法编辑；themeId={}, userId={}", themeId, userId);
            return null;
        }

        // 3. 构造 themeInfo；配置；
        Map<String, Object> themeInfo = new HashMap<>();
        themeInfo.put("themeId", theme.getThemeId());
        themeInfo.put("themeName", theme.getThemeName());
        themeInfo.put("authorName", theme.getAuthorName());
        themeInfo.put("authorId", theme.getAuthorId());
        themeInfo.put("ownerType", theme.getOwnerType());
        themeInfo.put("ownerId", theme.getOwnerId());
        themeInfo.put("isDefault", theme.getIsDefault() != null && theme.getIsDefault());
        themeInfo.put("description", theme.getDescription());
        themeInfo.put("price", theme.getPrice());
        themeInfo.put("status", theme.getStatus());
        themeInfo.put("thumbnailUrl", theme.getThumbnailUrl());
        themeInfo.put("downloadCount", theme.getDownloadCount());
        themeInfo.put("totalRevenue", theme.getTotalRevenue());
        themeInfo.put("createdAt", theme.getCreatedAt());
        themeInfo.put("updatedAt", theme.getUpdatedAt());

        // 4. 解析 configJson 获取配置
        Map<String, Object> config = new HashMap<>();
        String configJson = theme.getConfigJson();

        // 添加 specMeta
        Map<String, Object> specMeta = new HashMap<>();
        specMeta.put("specName", "GTRS");
        specMeta.put("specVersion", "1.0.0");
        specMeta.put("compatibleVersion", "1.0.0");
        config.put("specMeta", specMeta);

        // 解析骞舵坊鍔?globalStyle 鍜?resources
        if (configJson != null && !configJson.trim().isEmpty()) {
            try {
                Map<String, Object> configObj = JSON.parseObject(configJson, new TypeReference<Map<String, Object>>() {});
                if (configObj != null) {
                    config.put("globalStyle", configObj.get("globalStyle"));
                    config.put("resources", configObj.get("resources"));
                } else {
                    config.put("globalStyle", new HashMap<>());
                    config.put("resources", new HashMap<>());
                }
            } catch (Exception e) {
                log.error("瑙ｆ瀽 configJson 澶辫触锛歵hemeId={}", themeId, e);
                config.put("globalStyle", new HashMap<>());
                config.put("resources", new HashMap<>());
            }
        } else {
            config.put("globalStyle", new HashMap<>());
            config.put("resources", new HashMap<>());
        }

        // 5. 返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("themeInfo", themeInfo);
        result.put("config", config);

        log.info("获取编辑数据成功；themeId={}", themeId);
        return result;
    }

    /**
     * 获取我的主题
     */
    @Override
    public List<ThemeInfo> getMyThemes(Long authorId) {
        LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ThemeInfo::getAuthorId, authorId)
               .orderByDesc(ThemeInfo::getCreatedAt);

        return themeInfoMapper.selectList(wrapper);
    }

    /**
     * ⭐ 获取我的主题（支持按 ownerType 和 ownerId 筛选）
     */
    @Override
    public List<ThemeInfo> getMyThemes(Long authorId, String ownerType, Long ownerId) {
        LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ThemeInfo::getAuthorId, authorId);

        // 如果指定了 ownerType，则添加筛选条件
        if (ownerType != null && !ownerType.isEmpty()) {
            wrapper.eq(ThemeInfo::getOwnerType, ownerType);

            // 如果是游戏主题且指定了 ownerId，则添加 ownerId 筛选
            if ("GAME".equals(ownerType) && ownerId != null) {
                wrapper.eq(ThemeInfo::getOwnerId, ownerId);
            }
        }

        wrapper.orderByDesc(ThemeInfo::getCreatedAt);

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
     * 切换主题销售状态
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemeInfo toggleSaleStatus(Long themeId, Boolean onSale) {
        try {
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在；themeId={}", themeId);
                return null;
            }

            theme.setStatus(onSale ? "on_sale" : "offline");
            theme.setUpdatedAt(LocalDateTime.now());

            themeInfoMapper.updateById(theme);

            log.info("切换主题销售状态成功；themeId={}, newStatus={}", themeId, theme.getStatus());

            return theme;
        } catch (Exception e) {
            log.error("切换主题销售状态失败；themeId={}", themeId, e);
            return null;
        }
    }

    /**
     * 审核主题；通过/拒绝？
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ThemeInfo approveTheme(Long themeId, Boolean approved) {
        try {
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在；themeId={}", themeId);
                return null;
            }

            // 如果不是待审核状态；则无法审核
            if (!"pending".equals(theme.getStatus())) {
                log.warn("主题不是待审核状态；无法审核；themeId={}, status={}", themeId, theme.getStatus());
                return null;
            }

            // 审核通过；则上架；否则下架
            theme.setStatus(approved ? "on_sale" : "offline");
            theme.setUpdatedAt(LocalDateTime.now());

            themeInfoMapper.updateById(theme);

            log.info("审核主题；themeId={}, approved={}, newStatus={}", themeId, approved, theme.getStatus());

            return theme;
        } catch (Exception e) {
            log.error("审核主题失败；themeId={}", themeId, e);
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
                log.warn("可提现收益不足；creatorId={}, 申请={}, 可用={}", creatorId, amount, withdrawable);
                return false;
            }
            
            // 2. 更新提现记录状态
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
                    // 部分提现；则只提现一部分；剩余部分则不处理？
                    break;
                }
            }
            
            log.info("提现成功；creatorId={}, amount={}", creatorId, amount);
            
            return true;
        } catch (Exception e) {
            log.error("提现失败；creatorId={}, amount={}", creatorId, amount, e);
            return false;
        }
    }

    /**
     * 检查用户是否已经购买主题
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
     * 获取用户购买的主题列表
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
            log.debug("根据 gameCode 查找游戏；code={}, id={}, name={}",
                    gameCode, game.getGameId(), game.getGameName());
        } else {
            log.warn("未找到游戏；gameCode={}", gameCode);
        }

        return game;
    }

    /**
     * 获取用户使用的主题；游戏主题 + 用户主题 + 购买的主题
     */
    @Override
    public List<ThemeInfo> getMyAvailableThemes(Long userId, String ownerType, Long ownerId) {
        log.info("获取用户使用的主题 - userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId);

        List<ThemeInfo> allThemes = new java.util.ArrayList<>();

        // 1. 获取游戏主题；isOfficial = true？
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
        log.info("游戏主题查询结果 - ownerType: {}, 数量: {}", ownerType, officialThemes.size());
        allThemes.addAll(officialThemes);

        // 2. 获取用户主题
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

        // 3. 获取用户购买的主题
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
            log.info("购买主题查询结果 - userId: {}, ownerType: {}, 数量: {}", userId, ownerType, purchasedThemes.size());
            allThemes.addAll(purchasedThemes);
        } else {
            log.info("用户未购买主题 - userId: {}", userId);
        }

        // 去重；按 themeId？
        List<ThemeInfo> result = allThemes.stream()
                .collect(Collectors.toMap(
                        ThemeInfo::getThemeId,
                        theme -> theme,
                        (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .collect(Collectors.toList());

        log.info("最终主题数量；{}", result.size());
        return result;
    }
    
    /**
     * 获取用户使用的主题；分页；返回用户当前使用的主题ID；是否当前使用
     */
    @Override
    public Map<String, Object> getMyAvailableThemesWithPage(Long userId, String ownerType, Long ownerId, 
                                                             String source, Integer page, Integer pageSize) {
        log.info("获取用户使用的主题；分页- userId: {}, ownerType: {}, ownerId: {}, source: {}, page: {}, pageSize: {}", 
                userId, ownerType, ownerId, source, page, pageSize);
    
        // 1. 构造查询条件
        LambdaQueryWrapper<ThemeInfo> wrapper = buildQueryWrapper(userId, ownerType, ownerId, source);
    
        // 2. 分页查询
        Page<ThemeInfo> pageInfo = new Page<>(page, pageSize);
        themeInfoMapper.selectPage(pageInfo, wrapper);
        List<ThemeInfo> themes = pageInfo.getRecords();
        
        // 3. 获取用户当前使用的主题ID；是否当前使用
        Long currentThemeId = null;
        try {
            UserThemePreference preference = userThemePreferenceMapper.selectUserCurrentTheme(userId, ownerType, ownerId);
            if (preference != null) {
                currentThemeId = preference.getThemeId();
                log.info("用户当前主题锅忓ソ - userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                        userId, ownerType, ownerId, currentThemeId);
            }
        } catch (Exception e) {
            log.warn("获取用户主题锅忓ソ失败；不返回主题列表", e);
        }
        
        // 4. 构造主题数据；添加 gameId；gameCode；gameName；isCurrent
        List<Map<String, Object>> themesWithGame = new java.util.ArrayList<>();
        for (ThemeInfo theme : themes) {
            Map<String, Object> themeMap = JSON.parseObject(JSON.toJSONString(theme), Map.class);

            // 获取主题关联的游戏ID；gameName？
            if ("GAME".equals(theme.getOwnerType()) && theme.getOwnerId() != null) {
                var game = getGameById(theme.getOwnerId());
                if (game != null) {
                    themeMap.put("gameId", game.getGameId());
                    themeMap.put("gameCode", game.getGameCode());
                    themeMap.put("gameName", game.getGameName());
                }
            }

            // 如果没有游戏名称；则为空？
            if (!themeMap.containsKey("gameName") || themeMap.get("gameName") == null) {
                themeMap.put("gameName", "游戏主题");
            }
            
            // 是否用户当前使用的主题；是否当前使用
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
     * 构造查询条件
     * 
     * 包含WHERE条件；OR关系
     * - purchased 包含已购买的主题ID；不包含自己的
     * - all 包含所有；+ 官方的 + 用户的 + 购买的；去重；分页
     */
    private LambdaQueryWrapper<ThemeInfo> buildQueryWrapper(Long userId, String ownerType, Long ownerId, String source) {
        LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
    
        // 默认条件；是否上架
        wrapper.eq(ThemeInfo::getStatus, "on_sale");
    
        // 使用过滤？
        if (ownerType != null && !ownerType.isEmpty()) {
            wrapper.eq(ThemeInfo::getOwnerType, ownerType);
            if ("GAME".equals(ownerType) && ownerId != null) {
                wrapper.eq(ThemeInfo::getOwnerId, ownerId);
            }
        }
    
        // 来源过滤？- 组合
        switch (source) {
            case "official":
                // 官方主题；只包含官方的
                wrapper.eq(ThemeInfo::getIsOfficial, true);
                break;
    
            case "purchased":
                // 已购买的主题；包含已购买的主题ID；不包含自己的
                List<Long> purchasedIds = getPurchaseThemeIds(userId);
                if (purchasedIds.isEmpty()) {
                    // 没有购买记录；则只包含官方的
                    wrapper.eq(ThemeInfo::getThemeId, -1L);
                } else {
                    // 有购买记录；则包含官方的；不包含自己的
                    wrapper.in(ThemeInfo::getThemeId, purchasedIds)
                           .ne(ThemeInfo::getAuthorId, userId);
                }
                break;
    
            case "mine":
                // 用户的主题
                wrapper.eq(ThemeInfo::getAuthorId, userId);
                break;
    
            default: // "all"
                // 所有主题；官方的 + 用户的 + 购买的；去重；分页
                List<Long> allPurchasedIds = getPurchaseThemeIds(userId);
                
                if (allPurchasedIds.isEmpty()) {
                    // 没有购买记录；则只包含官方的；用户自己的
                    wrapper.and(w -> w
                        .eq(ThemeInfo::getIsOfficial, true)
                        .or(or -> or.eq(ThemeInfo::getAuthorId, userId))
                    );
                } else {
                    // 有购买记录；则包含官方的；用户自己的；已购买的；不包含自己的
                    wrapper.and(w -> w
                        .eq(ThemeInfo::getIsOfficial, true)  // 官方主题
                        .or(or -> or
                            .eq(ThemeInfo::getAuthorId, userId)  // 用户自己的
                            .or(in -> in
                                .in(ThemeInfo::getThemeId, allPurchasedIds)  // 已购买的
                                .ne(ThemeInfo::getAuthorId, userId)  // 不包含自己的
                            )
                        )
                    );
                }
                break;
        }
    
        return wrapper;
    }
    
    /**
     * 获取用户购买的主题ID列表
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
                log.warn("主题不存在；themeId={}", themeId);
                throw new RuntimeException("主题不存在");
            }

            // 如果包含新的配置；则验证并更新
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
                    log.error("主题GTRS格式验证失败；themeId={}, message={}", themeId, validationResult.getMessage());
                    throw new RuntimeException("主题格式不符合GTRS规范：" + validationResult.getMessage());
                }

                theme.setConfigJson(configJson);
            }

            // 更新基本信息
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

            log.info("更新主题成功；themeId={}, themeName={}", themeId, theme.getThemeName());
            return theme;
        } catch (Exception e) {
            log.error("更新主题失败；themeId={}", themeId, e);
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
                log.warn("主题不存在；themeId={}", themeId);
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

            // 删除关联的游戏关系
            LambdaQueryWrapper<com.kidgame.dao.entity.ThemeGameRelation> relationWrapper = new LambdaQueryWrapper<>();
            relationWrapper.eq(com.kidgame.dao.entity.ThemeGameRelation::getThemeId, themeId);
            themeGameRelationMapper.delete(relationWrapper);

            // 最后删除主题记录
            themeInfoMapper.deleteById(themeId);

            log.info("删除主题成功；themeId={}, themeName={}", themeId, theme.getThemeName());
            return true;
        } catch (Exception e) {
            log.error("删除主题失败；themeId={}", themeId, e);
            return false;
        }
    }

    // ==================== 用户主题锅忓ソ服务 ====================

    /**
     * 获取用户当前使用的主题
     */
    @Override
    public UserThemePreference getUserCurrentTheme(Long userId, String ownerType, Long ownerId) {
        if (userId == null || ownerType == null || ownerId == null) {
            log.warn("参数为空；无法获取用户使用的主题；userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId);
            return null;
        }

        try {
            UserThemePreference preference = userThemePreferenceMapper.selectUserCurrentTheme(userId, ownerType, ownerId);
            if (preference != null) {
                log.info("获取用户当前主题成功；userId: {}, ownerType: {}, ownerId: {}, themeId: {}",
                        userId, ownerType, ownerId, preference.getThemeId());
            } else {
                log.info("用户没有主题偏好；userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId);
            }
            return preference;
        } catch (Exception e) {
            log.error("获取用户当前主题失败；userId: {}, ownerType: {}, ownerId: {}", userId, ownerType, ownerId, e);
            return null;
        }
    }

    /**
     * ⭐ 获取用户所有主题偏好设置
     */
    @Override
    public List<UserThemePreference> getUserPreferences(Long userId) {
        if (userId == null) {
            log.warn("参数为空；无法获取用户主题偏好列表；userId: {}", userId);
            return new java.util.ArrayList<>();
        }

        try {
            LambdaQueryWrapper<UserThemePreference> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(UserThemePreference::getUserId, userId)
                   .orderByDesc(UserThemePreference::getCreatedAt);

            List<UserThemePreference> preferences = userThemePreferenceMapper.selectList(wrapper);
            log.info("获取用户主题偏好列表成功；userId: {}, 数量: {}", userId, preferences.size());

            return preferences;
        } catch (Exception e) {
            log.error("获取用户主题偏好列表失败；userId: {}", userId, e);
            return new java.util.ArrayList<>();
        }
    }

    /**
     * 保存用户主题偏好
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean saveUserPreference(Long userId, String ownerType, Long ownerId, Long themeId) {
        if (userId == null || ownerType == null || ownerId == null || themeId == null) {
            log.warn("参数为空；无法保存用户主题偏好；userId: {}, ownerType: {}, ownerId: {}, themeId: {}",
                    userId, ownerType, ownerId, themeId);
            return false;
        }

        try {
            // 验证主题是否存在
            ThemeInfo theme = themeInfoMapper.selectById(themeId);
            if (theme == null) {
                log.warn("主题不存在；themeId={}", themeId);
                return false;
            }

            // 验证主题的 ownerType 和 ownerId 是否匹配
            if (!ownerType.equals(theme.getOwnerType()) || !ownerId.equals(theme.getOwnerId())) {
                log.warn("主题不匹配；theme: ownerType={}, ownerId={}, target: ownerType={}, ownerId={}",
                        theme.getOwnerType(), theme.getOwnerId(), ownerType, ownerId);
                return false;
            }
            
            // 验证是否已经存在记录
            UserThemePreference existing = userThemePreferenceMapper.selectUserCurrentTheme(userId, ownerType, ownerId);
            
            if (existing != null) {
                // 更新已有记录
                existing.setThemeId(themeId);
                existing.setIsActive(1);
                existing.setUpdatedAt(LocalDateTime.now());
                int updateResult = userThemePreferenceMapper.updateById(existing);
                log.info("更新用户主题锅忓ソ成功；userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
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
                log.info("创建用户主题锅忓ソ成功；userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                        userId, ownerType, ownerId, themeId);
                return insertResult > 0;
            }
        } catch (Exception e) {
            log.error("保存用户主题锅忓ソ失败；userId: {}, ownerType: {}, ownerId: {}, themeId: {}", 
                    userId, ownerType, ownerId, themeId, e);
            return false;
        }
    }

    /**
     * 获取游戏的默认主题；从 user_theme_preference 表中
     */
    @Override
    public Long getDefaultThemeForGame(Long gameId) {
        if (gameId == null) {
            log.warn("游戏 ID 为空；无法获取游戏默认主题");
            return null;
        }
        
        try {
            // 先从 user_theme_preference 表中查找；如果没有；则从 theme_info 表中查找；查找 is_default 为 true 的主题
            LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ThemeInfo::getOwnerId, gameId)
                   .eq(ThemeInfo::getOwnerType, "GAME")
                   .eq(ThemeInfo::getIsDefault, true)
                   .eq(ThemeInfo::getStatus, "on_sale")
                   .last("LIMIT 1");
            
            ThemeInfo defaultTheme = themeInfoMapper.selectOne(wrapper);
            if (defaultTheme != null) {
                log.info("获取游戏默认主题成功；gameId: {}, themeId: {}", gameId, defaultTheme.getThemeId());
                return defaultTheme.getThemeId();
            } else {
                log.info("游戏没有默认主题；gameId: {}", gameId);
                return null;
            }
        } catch (Exception e) {
            log.error("获取游戏默认主题失败；gameId: {}", gameId, e);
            return null;
        }
    }
}

