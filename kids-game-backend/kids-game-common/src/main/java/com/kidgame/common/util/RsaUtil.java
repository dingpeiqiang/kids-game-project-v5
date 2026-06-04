package com.kidgame.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * RSA 加密工具类
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Component
public class RsaUtil {
    
    /**
     * RSA 算法
     */
    public static final String RSA_ALGORITHM = "RSA";
    
    /**
     * 加密/解密方式
     */
    public static final String RSA_TRANSFORMATION = "RSA/ECB/PKCS1Padding";
    
    /**
     * 密钥长度
     */
    public static final int KEY_SIZE = 2048;
    
    /**
     * 生成 RSA 密钥对
     * 
     * @return 密钥对（包含公钥和私钥）
     * @throws NoSuchAlgorithmException 算法不存在
     */
    public static KeyPair generateKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance(RSA_ALGORITHM);
        generator.initialize(KEY_SIZE);
        return generator.generateKeyPair();
    }
    
    /**
     * 获取公钥字符串（Base64 编码）
     * 
     * @param publicKey 公钥对象
     * @return Base64 编码的公钥字符串
     */
    public static String getPublicKeyString(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }
    
    /**
     * 获取私钥字符串（Base64 编码）
     * 
     * @param privateKey 私钥对象
     * @return Base64 编码的私钥字符串
     */
    public static String getPrivateKeyString(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }
    
    /**
     * 从字符串加载公钥
     * 
     * @param publicKeyStr Base64 编码的公钥字符串
     * @return 公钥对象
     * @throws Exception 加载失败
     */
    public static PublicKey loadPublicKey(String publicKeyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyStr);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory factory = KeyFactory.getInstance(RSA_ALGORITHM);
        return factory.generatePublic(spec);
    }
    
    /**
     * 从字符串加载私钥
     * 
     * @param privateKeyStr Base64 编码的私钥字符串
     * @return 私钥对象
     * @throws Exception 加载失败
     */
    public static PrivateKey loadPrivateKey(String privateKeyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(privateKeyStr);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory factory = KeyFactory.getInstance(RSA_ALGORITHM);
        return factory.generatePrivate(spec);
    }
    
    /**
     * 使用公钥加密数据
     * 
     * @param data 原始数据
     * @param publicKey 公钥
     * @return Base64 编码的加密数据
     * @throws Exception 加密失败
     */
    public static String encrypt(byte[] data, PublicKey publicKey) throws Exception {
        Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        
        // RSA 加密有数据长度限制，需要分段加密
        int inputLength = data.length;
        int offSet = 0;
        byte[] cache = new byte[KEY_SIZE / 8 - 11]; // PKCS1Padding 需要保留 11 字节
        byte[] resultBytes = new byte[0];
        
        while (inputLength - offSet > 0) {
            if (inputLength - offSet > cache.length) {
                byte[] doFinal = cipher.doFinal(data, offSet, cache.length);
                resultBytes = join(resultBytes, doFinal);
            } else {
                byte[] doFinal = cipher.doFinal(data, offSet, inputLength - offSet);
                resultBytes = join(resultBytes, doFinal);
            }
            offSet += cache.length;
        }
        
        return Base64.getEncoder().encodeToString(resultBytes);
    }
    
    /**
     * 使用私钥解密数据
     * 
     * @param encryptedData Base64 编码的加密数据
     * @param privateKey 私钥
     * @return 原始数据
     * @throws Exception 解密失败
     */
    public static byte[] decrypt(String encryptedData, PrivateKey privateKey) throws Exception {
        Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, privateKey);
        
        byte[] dataBytes = Base64.getDecoder().decode(encryptedData);
        
        // RSA 解密有数据长度限制，需要分段解密
        int inputLength = dataBytes.length;
        int offSet = 0;
        byte[] cache = new byte[KEY_SIZE / 8];
        byte[] resultBytes = new byte[0];
        
        while (inputLength - offSet > 0) {
            if (inputLength - offSet > cache.length) {
                byte[] doFinal = cipher.doFinal(dataBytes, offSet, cache.length);
                resultBytes = join(resultBytes, doFinal);
            } else {
                byte[] doFinal = cipher.doFinal(dataBytes, offSet, inputLength - offSet);
                resultBytes = join(resultBytes, doFinal);
            }
            offSet += cache.length;
        }
        
        return resultBytes;
    }
    
    /**
     * 合并两个 byte 数组
     * 
     * @param array1 数组 1
     * @param array2 数组 2
     * @return 合并后的数组
     */
    private static byte[] join(byte[] array1, byte[] array2) {
        byte[] result = new byte[array1.length + array2.length];
        System.arraycopy(array1, 0, result, 0, array1.length);
        System.arraycopy(array2, 0, result, array1.length, array2.length);
        return result;
    }
    
    /**
     * 生成密钥对并转换为 Map
     * 
     * @return 包含公钥和私钥的 Map
     * @throws NoSuchAlgorithmException 算法不存在
     */
    public static Map<String, String> generateKeyPairMap() throws NoSuchAlgorithmException {
        KeyPair keyPair = generateKeyPair();
        
        Map<String, String> keyMap = new HashMap<>();
        keyMap.put("publicKey", getPublicKeyString(keyPair.getPublic()));
        keyMap.put("privateKey", getPrivateKeyString(keyPair.getPrivate()));
        
        return keyMap;
    }
}
