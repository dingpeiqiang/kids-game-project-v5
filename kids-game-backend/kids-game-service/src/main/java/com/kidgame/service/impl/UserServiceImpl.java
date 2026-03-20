package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.common.config.RsaKeyConfig;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.common.util.RsaUtil;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.UserProfileMapper;
import com.kidgame.service.UserService;
import com.kidgame.service.cache.UserCacheService;
import com.kidgame.service.dto.AuthRequestDTO;
import com.kidgame.service.dto.AuthResponseDTO;
import com.kidgame.service.dto.UserLoginDTO;
import com.kidgame.service.dto.UserLoginResponseDTO;
import com.kidgame.service.dto.UserRegisterDTO;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

/**
 * 统一用户服务实现
 */
@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    private BaseUserMapper baseUserMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserCacheService userCacheService;

    /**
     * 将用户类型整数转换为字符串角色
     */
    private String convertUserRoleToString(Integer userType) {
        if (userType == null) {
            return "unknown";
        }
        switch (userType) {
            case 0: return "kid";
            case 1: return "parent";
            case 2: return "admin";
            default: return "unknown";
        }
    }

    /**
     * 将用户类型字符串转换为整数
     */
    private Integer convertUserTypeToInt(String userType) {
        if (userType == null) {
            return null;
        }
        switch (userType.toUpperCase()) {
            case "KID":
                return 0;
            case "PARENT":
                return 1;
            case "ADMIN":
                return 2;
            default:
                throw new IllegalArgumentException("Unknown user type: " + userType);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BaseUser register(UserRegisterDTO dto) {
        // 检查用户名是否已存在
        BaseUser existUser = baseUserMapper.selectOne(
                new QueryWrapper<BaseUser>().eq("username", dto.getUsername())
        );
        if (existUser != null) {
            throw new RuntimeException("用户名已存在");
        }

        // 创建用户
        BaseUser user = new BaseUser();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname() != null ? dto.getNickname() : dto.getUsername());
        user.setUserType(convertUserTypeToInt(dto.getUserType()));
        user.setStatus(1);
        user.setCreateTime(System.currentTimeMillis());
        user.setUpdateTime(System.currentTimeMillis());

        baseUserMapper.insert(user);

        // 创建用户扩展信息
        UserProfile profile = new UserProfile();
        profile.setUserId(user.getUserId());
        profile.setProfileData(dto.getExtInfoJson());
        profile.setCreateTime(System.currentTimeMillis());
        profile.setUpdateTime(System.currentTimeMillis());

        userProfileMapper.insert(profile);

        return user;
    }

    @Override
    public UserLoginResponseDTO login(UserLoginDTO dto) {
        log.info("用户登录请求：username={}", dto.getUsername());
        
        QueryWrapper<BaseUser> wrapper = new QueryWrapper<>();
        wrapper.eq("username", dto.getUsername());
        if (dto.getUserType() != null) {
            wrapper.eq("user_type", convertUserTypeToInt(dto.getUserType()));
        }

        BaseUser user = baseUserMapper.selectOne(wrapper);
        if (user == null) {
            log.warn("用户不存在：username={}", dto.getUsername());
            throw new RuntimeException("用户不存在");
        }

        if (user.getStatus() != 1) {
            log.warn("用户已被禁用：username={}, status={}", dto.getUsername(), user.getStatus());
            throw new RuntimeException("用户已被禁用");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            log.warn("密码错误：username={}", dto.getUsername());
            throw new RuntimeException("密码错误");
        }

        // 准备 JWT claims，包含用户角色等信息
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", convertUserRoleToString(user.getUserType()));
        
        // 获取用户扩展信息
        UserProfile profile = userProfileMapper.selectOne(
                new QueryWrapper<UserProfile>().eq("user_id", user.getUserId())
        );
        if (profile != null && profile.getProfileData() != null) {
            try {
                JSONObject extInfo = JSON.parseObject(profile.getProfileData());
                // 根据用户类型添加不同的 claims
                if (user.getUserType() == 0) { // KID
                    claims.put("kidId", user.getUserId().toString());
                    claims.put("parentId", extInfo.getString("parentId"));
                    claims.put("grade", extInfo.getString("grade"));
                } else if (user.getUserType() == 1) { // PARENT
                    claims.put("parentId", user.getUserId().toString());
                } else if (user.getUserType() == 2) { // ADMIN
                    claims.put("adminId", user.getUserId().toString());
                }
            } catch (Exception e) {
                log.warn("解析用户扩展信息失败：{}", e.getMessage());
            }
        }

        // 生成 JWT Token 和 Refresh Token（使用包含 claims 的版本）
        String token = jwtUtil.generateToken(user.getUserId().toString(), claims);
        String refreshToken = jwtUtil.generateRefreshToken(user.getUserId().toString());

        // 构建响应 DTO（不返回 password 字段）
        UserLoginResponseDTO responseDTO = UserLoginResponseDTO.builder()
                .userId(user.getUserId())
                .userType(user.getUserType())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .fatiguePoints(user.getFatiguePoints() != null ? user.getFatiguePoints() : 10)
                .dailyAnswerPoints(user.getDailyAnswerPoints() != null ? user.getDailyAnswerPoints() : 0)
                .token(token)
                .refreshToken(refreshToken)
                .build();

        // 根据用户类型获取额外信息（profile 已在上文获取）
        if (user.getUserType() != null) {
            switch (user.getUserType()) {
                case 0: // KID
                    // 从 UserProfile 中获取 grade 和 parentId
                    if (profile != null && profile.getProfileData() != null) {
                        try {
                            JSONObject extInfo = JSON.parseObject(profile.getProfileData());
                            responseDTO.setGrade(extInfo.getString("grade"));
                            responseDTO.setParentId(extInfo.getLong("parentId"));
                        } catch (Exception e) {
                            log.warn("解析儿童扩展信息失败：{}", e.getMessage());
                        }
                    }
                    break;
                case 1: // PARENT
                case 2: // ADMIN
                    // 家长和管理员不需要额外信息
                    break;
            }
        }

        // 缓存用户信息
        userCacheService.cacheUser(user);
        
        log.info("用户登录成功：username={}, userId={}", dto.getUsername(), user.getUserId());

        return responseDTO;
    }

    @Override
    public boolean verifyPassword(Long userId, String password) {
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            return false;
        }
        return passwordEncoder.matches(password, user.getPassword());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("旧密码错误");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BaseUser updateUser(BaseUser user) {
        user.setUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
        return baseUserMapper.selectById(user.getUserId());
    }

    @Override
    public BaseUser getUserById(Long userId) {
        // 先从缓存获取
        BaseUser cachedUser = userCacheService.getCachedUser(userId);
        if (cachedUser != null) {
            return cachedUser;
        }
        
        // 缓存未命中，查询数据库
        BaseUser user = baseUserMapper.selectById(userId);
        if (user != null) {
            userCacheService.cacheUser(user);
        }
        return user;
    }

    @Override
    public BaseUser getUserByUsername(String username) {
        return baseUserMapper.selectOne(
                new QueryWrapper<BaseUser>().eq("username", username)
        );
    }

    @Override
    public UserProfile getUserProfile(Long userId) {
        return userProfileMapper.selectOne(
                new QueryWrapper<UserProfile>().eq("user_id", userId)
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserProfile updateUserProfile(UserProfile profile) {
        profile.setUpdateTime(System.currentTimeMillis());

        QueryWrapper<UserProfile> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", profile.getUserId());

        UserProfile existProfile = userProfileMapper.selectOne(wrapper);
        if (existProfile != null) {
            profile.setProfileId(existProfile.getProfileId());
            userProfileMapper.updateById(profile);
        } else {
            profile.setCreateTime(System.currentTimeMillis());
            userProfileMapper.insert(profile);
        }

        return userProfileMapper.selectById(profile.getProfileId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void disableUser(Long userId) {
        BaseUser user = new BaseUser();
        user.setUserId(userId);
        user.setStatus(0);
        user.setUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void enableUser(Long userId) {
        BaseUser user = new BaseUser();
        user.setUserId(userId);
        user.setStatus(1);
        user.setUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
    }

    @Override
    public List<BaseUser> listUsers(String userType, String status, Integer page, Integer size) {
        QueryWrapper<BaseUser> wrapper = new QueryWrapper<>();
        if (userType != null) {
            wrapper.eq("user_type", convertUserTypeToInt(userType));
        }
        if (status != null) {
            wrapper.eq("status", Integer.parseInt(status));
        }
        wrapper.orderByDesc("create_time");

        Page<BaseUser> pageObj = new Page<>(page, size);
        return baseUserMapper.selectPage(pageObj, wrapper).getRecords();
    }

    @Override
    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        log.info("统一认证请求：username={}, userType={}, keyIndex={}", 
            request.getUsername(), request.getUserType(), request.getKeyIndex());
        
        // 1. 查询用户
        LambdaQueryWrapper<BaseUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BaseUser::getUsername, request.getUsername());
        wrapper.eq(BaseUser::getUserType, request.getUserType());
        wrapper.eq(BaseUser::getStatus, 1);
        
        BaseUser user = baseUserMapper.selectOne(wrapper);
        if (user == null) {
            log.warn("用户不存在：username={}", request.getUsername());
            throw new RuntimeException("用户不存在");
        }
        
        // 2. 解密和验证密码
        String rawPassword = decryptPasswordIfNeeded(request);
        
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            log.warn("密码错误：username={}", request.getUsername());
            throw new RuntimeException("密码错误");
        }
        
        // 3. 准备 JWT claims
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId().toString());
        claims.put("userType", user.getUserType());
        claims.put("role", convertUserRoleToString(user.getUserType()));
        
        // 4. 获取用户扩展信息
        UserProfile profile = userProfileMapper.selectOne(
            new LambdaQueryWrapper<UserProfile>()
                .eq(UserProfile::getUserId, user.getUserId())
        );
        
        if (profile != null && profile.getProfileData() != null) {
            try {
                JSONObject extInfo = JSON.parseObject(profile.getProfileData());
                
                if (user.getUserType() == 0) { // KID
                    claims.put("kidId", user.getUserId().toString());
                    claims.put("parentId", extInfo.getString("parentId"));
                    claims.put("grade", extInfo.getString("grade"));
                } else if (user.getUserType() == 1) { // PARENT
                    claims.put("parentId", user.getUserId().toString());
                } else if (user.getUserType() == 2) { // ADMIN
                    claims.put("adminId", user.getUserId().toString());
                }
            } catch (Exception e) {
                log.warn("解析用户扩展信息失败：{}", e.getMessage());
            }
        }
        
        // 5. 生成 Token
        boolean rememberMe = request.getRememberMe() != null && request.getRememberMe();
        String accessToken = jwtUtil.generateToken(user.getUserId().toString(), claims);
        String refreshToken = jwtUtil.generateRefreshToken(user.getUserId().toString());
        
        // 6. 构建响应
        AuthResponseDTO response = AuthResponseDTO.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(rememberMe ? 7 * 24 * 3600L : 24 * 3600L)
            .userId(user.getUserId())
            .userType(user.getUserType())
            .username(user.getUsername())
            .nickname(user.getNickname())
            .avatar(user.getAvatar())
            .roles(Arrays.asList(convertUserRoleToString(user.getUserType())))
            .fatiguePoints(user.getFatiguePoints() != null ? user.getFatiguePoints() : 10)
            .dailyAnswerPoints(user.getDailyAnswerPoints() != null ? user.getDailyAnswerPoints() : 0)
            .build();
        
        // 7. 补充儿童信息
        if (user.getUserType() == 0 && profile != null) {
            try {
                JSONObject extInfo = JSON.parseObject(profile.getProfileData());
                response.setGrade(extInfo.getString("grade"));
                response.setParentId(extInfo.getLong("parentId"));
            } catch (Exception e) {
                log.warn("解析儿童扩展信息失败：{}", e.getMessage());
            }
        }
        
        // 8. 更新登录信息
        user.setLastLoginTime(System.currentTimeMillis());
        user.setLastLoginIp(getClientIp());
        baseUserMapper.updateById(user);
        
        // 9. 缓存用户信息
        userCacheService.cacheUser(user);
        
        log.info("用户登录成功：userId={}, username={}", user.getUserId(), user.getUsername());
        
        return response;
    }
    
    /**
     * 解密密码（如果需要）
     * 
     * @param request 认证请求
     * @return 明文密码
     */
    private String decryptPasswordIfNeeded(AuthRequestDTO request) {
        // 优先使用加密密码
        if (request.getEncryptedPassword() != null && !request.getEncryptedPassword().isEmpty()) {
            try {
                log.debug("使用 RSA 解密密码，keyIndex={}", request.getKeyIndex());
                
                // 获取对应索引的密钥对
                var keyPair = RsaKeyConfig.getKeyPair(request.getKeyIndex());
                if (keyPair == null) {
                    log.warn("找不到密钥对，索引：{}", request.getKeyIndex());
                    throw new RuntimeException("密钥不存在");
                }
                
                // 使用私钥解密
                byte[] decryptedBytes = RsaUtil.decrypt(request.getEncryptedPassword(), keyPair.getPrivate());
                return new String(decryptedBytes, StandardCharsets.UTF_8);
                
            } catch (Exception e) {
                log.error("RSA 密码解密失败", e);
                throw new RuntimeException("密码解密失败：" + e.getMessage());
            }
        }
        
        // 向后兼容：使用明文密码
        if (request.getPassword() != null) {
            log.debug("使用明文密码（向后兼容）");
            return request.getPassword();
        }
        
        throw new RuntimeException("密码不能为空");
    }

    @Override
    public String refreshAccessToken(String refreshToken, String deviceFingerprint) {
        // 1. 验证 Refresh Token
        if (!jwtUtil.validateToken(refreshToken)) {
            log.warn("Refresh Token 无效或已过期");
            throw new RuntimeException("Refresh Token 无效或已过期");
        }
        
        // 2. 检查类型
        if (!jwtUtil.isRefreshToken(refreshToken)) {
            log.warn("Token 类型不正确");
            throw new RuntimeException("Token 类型不正确");
        }
        
        // 3. 获取用户 ID
        String userId = jwtUtil.getUserId(refreshToken);
        
        // 4. 验证用户状态
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null || user.getStatus() != 1) {
            log.warn("用户不存在或被禁用：userId={}", userId);
            throw new RuntimeException("用户不存在或被禁用");
        }
        
        // 5. 可选：验证设备指纹（如果启用了设备绑定）
        // if (deviceFingerprint != null) {
        //     // 验证设备指纹是否匹配
        // }
        
        // 6. 重新生成 Access Token
        Claims oldClaims = jwtUtil.parseToken(refreshToken);
        Map<String, Object> newClaims = new HashMap<>();
        newClaims.putAll(oldClaims);
        newClaims.put("type", "access"); // 改为 access 类型
        
        String newAccessToken = jwtUtil.generateToken(userId, newClaims);
        
        log.info("用户 {} 刷新 Token 成功", userId);
        
        return newAccessToken;
    }

    /**
     * 获取客户端 IP（辅助方法）
     */
    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) 
            RequestContextHolder.getRequestAttributes();
        
        if (attributes == null) {
            return "unknown";
        }
        
        HttpServletRequest request = attributes.getRequest();
        
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip;
    }
}
