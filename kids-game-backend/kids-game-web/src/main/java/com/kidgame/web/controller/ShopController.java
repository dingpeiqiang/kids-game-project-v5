package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.service.ShopService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final JwtUtil jwtUtil;

    @GetMapping("/products")
    public Result<List<Map<String, Object>>> products() {
        return Result.success(shopService.listProducts());
    }

    @PostMapping("/purchase")
    public Result<Map<String, Object>> purchase(
            @RequestHeader("Authorization") String authorization,
            @RequestBody PurchaseBody body) {
        String token = authorization.replace("Bearer ", "");
        Long userId = Long.parseLong(jwtUtil.getUserId(token));
        int qty = body.getQuantity() != null ? body.getQuantity() : 1;
        return Result.success(shopService.purchase(userId, body.getProductId(), qty));
    }

    @Data
    public static class PurchaseBody {
        private Long productId;
        private Integer quantity;
    }
}