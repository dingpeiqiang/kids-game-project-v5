package com.kidgame.service;

import java.util.List;
import java.util.Map;

public interface ShopService {
    List<Map<String, Object>> listProducts();

    Map<String, Object> purchase(Long userId, Long productId, int quantity);
}