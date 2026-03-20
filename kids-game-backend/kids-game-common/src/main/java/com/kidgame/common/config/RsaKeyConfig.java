package com.kidgame.common.config;

import com.kidgame.common.util.RsaUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.KeyPair;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RSA 密钥配置
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Configuration
public class RsaKeyConfig {
    
    /**
     * 存储多代密钥（支持密钥轮换）
     * keyIndex -> KeyPair
     */
    private static final ConcurrentHashMap<Integer, KeyPair> KEY_PAIRS = new ConcurrentHashMap<>();
    
    /**
     * 当前使用的密钥索引
     */
    private static volatile int CURRENT_KEY_INDEX = 0;
    
    @Value("${rsa.key.rotation.enabled:false}")
    private boolean keyRotationEnabled;
    
    /**
     * 初始化 RSA 密钥对
     * 
     * @return 密钥对 Bean
     */
    @Bean
    public KeyPair rsaKeyPair() {
        try {
            // 生成新密钥对
            KeyPair keyPair = RsaUtil.generateKeyPair();
            
            // 存入 Map
            KEY_PAIRS.put(CURRENT_KEY_INDEX, keyPair);
            
            log.info("RSA 密钥对初始化成功，索引：{}", CURRENT_KEY_INDEX);
            logPublicKeyInfo(keyPair);
            
            return keyPair;
        } catch (NoSuchAlgorithmException e) {
            log.error("RSA 密钥对生成失败", e);
            throw new RuntimeException("RSA 密钥对生成失败", e);
        }
    }
    
    /**
     * 获取当前密钥对
     * 
     * @return 当前密钥对
     */
    public static KeyPair getCurrentKeyPair() {
        return KEY_PAIRS.get(CURRENT_KEY_INDEX);
    }
    
    /**
     * 获取指定索引的密钥对
     * 
     * @param keyIndex 密钥索引
     * @return 密钥对，如果不存在则返回 null
     */
    public static KeyPair getKeyPair(int keyIndex) {
        return KEY_PAIRS.get(keyIndex);
    }
    
    /**
     * 获取当前密钥索引
     * 
     * @return 当前密钥索引
     */
    public static int getCurrentKeyIndex() {
        return CURRENT_KEY_INDEX;
    }
    
    /**
     * 密钥轮换（生成新密钥对，保留旧密钥）
     * 
     * @return 新的密钥索引
     */
    public synchronized int rotateKey() {
        try {
            // 生成新密钥对
            KeyPair newKeyPair = RsaUtil.generateKeyPair();
            
            // 更新索引
            int newIndex = CURRENT_KEY_INDEX + 1;
            KEY_PAIRS.put(newIndex, newKeyPair);
            CURRENT_KEY_INDEX = newIndex;
            
            log.info("RSA 密钥轮换成功，新索引：{}", newIndex);
            logPublicKeyInfo(newKeyPair);
            
            // 保留最近 3 代密钥（用于解密旧的登录请求）
            if (KEY_PAIRS.size() > 3) {
                int oldestIndex = newIndex - KEY_PAIRS.size();
                KEY_PAIRS.remove(oldestIndex);
                log.debug("清理过期密钥，索引：{}", oldestIndex);
            }
            
            return newIndex;
        } catch (NoSuchAlgorithmException e) {
            log.error("RSA 密钥轮换失败", e);
            throw new RuntimeException("RSA 密钥轮换失败", e);
        }
    }
    
    /**
     * 打印公钥信息（用于调试）
     */
    private void logPublicKeyInfo(KeyPair keyPair) {
        String publicKeyStr = RsaUtil.getPublicKeyString(keyPair.getPublic());
        log.info("RSA 公钥 (Base64): {}", publicKeyStr);
        log.info("RSA 公钥指纹: {}", generateFingerprint(publicKeyStr));
    }
    
    /**
     * 生成公钥指纹（用于快速识别）
     */
    private String generateFingerprint(String publicKeyStr) {
        try {
            byte[] bytes = publicKeyStr.getBytes();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(8, bytes.length); i++) {
                sb.append(String.format("%02X", bytes[i]));
                if (i < bytes.length - 1 && i < 7) {
                    sb.append(":");
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }
}
