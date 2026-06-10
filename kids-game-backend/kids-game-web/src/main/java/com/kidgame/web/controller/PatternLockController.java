package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.service.PatternLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 图案解锁控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/pattern-lock")
@RequiredArgsConstructor
public class PatternLockController {

    private final PatternLockService patternLockService;

    /**
     * 保存图案解锁
     *
     * @param request 请求体 { userId, userType, pattern }
     * @return 结果
     */
    @PostMapping("/save")
    public ResponseEntity<Result<Void>> savePatternLock(@RequestBody Map<String, Object> request) {
        Long userId = Long.parseLong(request.get("userId").toString());
        String userType = request.get("userType").toString();
        String pattern = request.get("pattern").toString();

        log.info("保存图案解锁接口调用, userId={}, userType={}", userId, userType);

        patternLockService.savePatternLock(userId, userType, pattern);
        return ResponseEntity.ok(Result.success(null, "图案解锁保存成功"));
    }

    /**
     * 验证图案解锁
     *
     * @param request 请求体 { userId, userType, pattern }
     * @return 验证结果
     */
    @PostMapping("/validate")
    public ResponseEntity<Result<Map<String, Boolean>>> validatePattern(@RequestBody Map<String, Object> request) {
        Long userId = Long.parseLong(request.get("userId").toString());
        String userType = request.get("userType").toString();
        String pattern = request.get("pattern").toString();

        log.info("验证图案解锁接口调用, userId={}, userType={}", userId, userType);

        boolean isValid = patternLockService.validatePattern(userId, userType, pattern);

        Map<String, Boolean> result = new HashMap<>();
        result.put("valid", isValid);

        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * 检查是否存在图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型
     * @return 是否存在
     */
    @GetMapping("/exists")
    public ResponseEntity<Result<Map<String, Boolean>>> hasPatternLock(
            @RequestParam Long userId,
            @RequestParam String userType) {

        log.info("检查图案解锁存在性, userId={}, userType={}", userId, userType);

        boolean exists = patternLockService.hasPatternLock(userId, userType);

        Map<String, Boolean> result = new HashMap<>();
        result.put("exists", exists);

        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * 删除图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型
     * @return 结果
     */
    @DeleteMapping("/delete")
    public ResponseEntity<Result<Void>> deletePatternLock(
            @RequestParam Long userId,
            @RequestParam String userType) {

        log.info("删除图案解锁接口调用, userId={}, userType={}", userId, userType);

        patternLockService.deletePatternLock(userId, userType);
        return ResponseEntity.ok(Result.success(null, "图案解锁删除成功"));
    }

    /**
     * 更新图案解锁
     *
     * @param request 请求体 { userId, userType, pattern }
     * @return 结果
     */
    @PutMapping("/update")
    public ResponseEntity<Result<Void>> updatePatternLock(@RequestBody Map<String, Object> request) {
        Long userId = Long.parseLong(request.get("userId").toString());
        String userType = request.get("userType").toString();
        String pattern = request.get("pattern").toString();

        log.info("更新图案解锁接口调用, userId={}, userType={}", userId, userType);

        patternLockService.updatePatternLock(userId, userType, pattern);
        return ResponseEntity.ok(Result.success(null, "图案解锁更新成功"));
    }
}
