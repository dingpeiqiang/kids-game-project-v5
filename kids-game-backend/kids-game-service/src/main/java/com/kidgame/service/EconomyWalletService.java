package com.kidgame.service;

import java.util.Map;

public interface EconomyWalletService {
    Map<String, Integer> getWallet(Long userId);

    void addCoins(Long userId, int amount, String remark);

    void addExp(Long userId, int amount);

    boolean spendCoins(Long userId, int amount, String remark);

    int getLevelByExp(int totalExp);
}