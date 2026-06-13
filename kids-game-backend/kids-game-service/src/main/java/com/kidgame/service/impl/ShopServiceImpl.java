package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.common.constant.GameConstants;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.ShopProduct;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.ShopProductMapper;
import com.kidgame.service.EconomyWalletService;
import com.kidgame.service.FatiguePointsService;
import com.kidgame.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {

    private final ShopProductMapper shopProductMapper;
    private final EconomyWalletService economyWalletService;
    private final FatiguePointsService fatiguePointsService;
    private final BaseUserMapper baseUserMapper;

    @Override
    public List<Map<String, Object>> listProducts() {
        List<ShopProduct> list = shopProductMapper.selectList(
                new LambdaQueryWrapper<ShopProduct>()
                        .eq(ShopProduct::getEnabled, 1)
                        .orderByAsc(ShopProduct::getSortOrder));
        List<Map<String, Object>> out = new ArrayList<>();
        for (ShopProduct p : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("productId", p.getProductId());
            m.put("productCode", p.getProductCode());
            m.put("productName", p.getProductName());
            m.put("productType", p.getProductType());
            m.put("priceCoins", p.getPriceCoins());
            m.put("grantStudyCoins", p.getGrantStudyCoins());
            out.add(m);
        }
        return out;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> purchase(Long userId, Long productId, int quantity) {
        Map<String, Object> res = new HashMap<>();
        if (quantity < 1) quantity = 1;
        ShopProduct product = shopProductMapper.selectById(productId);
        if (product == null || product.getEnabled() == null || product.getEnabled() != 1) {
            res.put("success", false);
            res.put("message", "商品不存在或已下架");
            return res;
        }
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            res.put("success", false);
            res.put("message", "用户不存在");
            return res;
        }
        int totalCoins = product.getPriceCoins() * quantity;
        if (!economyWalletService.spendCoins(userId, totalCoins, "商城购买:" + product.getProductCode())) {
            res.put("success", false);
            res.put("message", "金币不足");
            return res;
        }
        int grant = (product.getGrantStudyCoins() != null ? product.getGrantStudyCoins() : 0) * quantity;
        if (grant > 0) {
            int userType = user.getUserType() != null ? user.getUserType() : 0;
            fatiguePointsService.grantStudyCoinsBySystem(
                    userId, userType, grant,
                    GameConstants.FatigueChangeType.SYSTEM_GRANT,
                    "SHOP", "金币兑换游学币", productId);
        }
        res.put("success", true);
        res.put("message", "兑换成功");
        res.put("grantStudyCoins", grant);
        res.put("wallet", economyWalletService.getWallet(userId));
        return res;
    }
}