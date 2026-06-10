package com.kidgame.service.impl;

import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.util.BCryptGenerator;
import com.kidgame.dao.entity.PatternLock;
import com.kidgame.dao.mapper.PatternLockMapper;
import com.kidgame.service.PatternLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 图案解锁服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PatternLockServiceImpl implements PatternLockService {

    private final PatternLockMapper patternLockMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void savePatternLock(Long userId, String userType, String pattern) {
        log.info("保存图案解锁, userId={}, userType={}", userId, userType);

        // 生成盐值并加密图案
        String salt = BCryptGenerator.generateSalt();
        String encryptedPattern = BCryptGenerator.hashPassword(pattern, salt);

        // 检查是否已存在，存在则删除
        if (hasPatternLock(userId, userType)) {
            deletePatternLock(userId, userType);
        }

        // 创建新记录
        PatternLock patternLock = new PatternLock();
        patternLock.setUserId(userId);
        patternLock.setUserType(userType);
        patternLock.setEncryptedPattern(encryptedPattern);
        patternLock.setSalt(salt);
        patternLock.setCreateTime(System.currentTimeMillis());
        patternLock.setUpdateTime(System.currentTimeMillis());

        patternLockMapper.insert(patternLock);
        log.info("图案解锁保存成功, userId={}", userId);
    }

    @Override
    public boolean validatePattern(Long userId, String userType, String pattern) {
        log.debug("验证图案解锁, userId={}, userType={}", userId, userType);

        Optional<PatternLock> optionalPatternLock = patternLockMapper.selectByUserIdAndType(userId, userType);

        if (optionalPatternLock.isEmpty()) {
            log.warn("图案解锁不存在, userId={}, userType={}", userId, userType);
            return false;
        }

        PatternLock patternLock = optionalPatternLock.get();
        String encryptedPattern = patternLock.getEncryptedPattern();
        String salt = patternLock.getSalt();

        // 使用盐值验证图案
        String hashedInput = BCryptGenerator.hashPassword(pattern, salt);
        boolean isValid = hashedInput.equals(encryptedPattern);

        if (!isValid) {
            log.warn("图案解锁验证失败, userId={}", userId);
        }

        return isValid;
    }

    @Override
    public boolean hasPatternLock(Long userId, String userType) {
        return patternLockMapper.existsByUserIdAndType(userId, userType);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePatternLock(Long userId, String userType) {
        log.info("删除图案解锁, userId={}, userType={}", userId, userType);
        patternLockMapper.deleteByUserIdAndType(userId, userType);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePatternLock(Long userId, String userType, String pattern) {
        log.info("更新图案解锁, userId={}, userType={}", userId, userType);
        savePatternLock(userId, userType, pattern);
    }
}
