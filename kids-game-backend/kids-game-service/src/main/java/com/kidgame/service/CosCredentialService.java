package com.kidgame.service;

import java.util.Map;

/**
 * 腾讯云 COS 临时密钥服务接口
 * 
 * 用于生成前端直传 COS 所需的临时密钥
 * 
 * @author kids-game-team
 * @date 2026-03-19
 */
public interface CosCredentialService {

    /**
     * 获取上传临时密钥
     * 
     * @param filename 文件名（用于提取扩展名）
     * @param category 资源分类（如 themes/images, themes/audio）
     * @return 临时密钥信息
     */
    Map<String, Object> getUploadCredential(String filename, String category);

    /**
     * 获取通用上传临时密钥（不限制具体路径）
     * 
     * @param filename 文件名
     * @return 临时密钥信息
     */
    Map<String, Object> getUploadCredential(String filename);
}
