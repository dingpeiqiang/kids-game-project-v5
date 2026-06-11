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
import com.kidgame.dao.entity.FatiguePointsLog;
import com.kidgame.dao.entity.UserLevel;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.FatiguePointsLogMapper;
import com.kidgame.dao.mapper.UserLevelMapper;
import com.kidgame.dao.mapper.UserProfileMapper;
import com.kidgame.service.UserService;
import com.kidgame.service.cache.UserCacheService;
import com.kidgame.service.dto.AuthRegisterDTO;
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
    private UserLevelMapper userLevelMapper;

    @Autowired
    private FatiguePointsLogMapper fatiguePointsLogMapper;

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
        
        // 支持数字字符串格式
        if (userType.matches("\\d+")) {
            return Integer.parseInt(userType);
        }
        
        // 支持英文字符串格式
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
        log.info("用户注册请求: username={}, userType={}, nickname={}", 
            dto.getUsername(), dto.getUserType(), dto.getNickname());
        
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
        Integer userTypeInt = convertUserTypeToInt(dto.getUserType());
        log.info("转换用户类型: {} -> {}", dto.getUserType(), userTypeInt);
        user.setUserType(userTypeInt);
        user.setStatus(1);
        user.setCreateTime(System.currentTimeMillis());
        user.setUpdateTime(System.currentTimeMillis());

        baseUserMapper.insert(user);

        // 创建用户扩展信息
        UserProfile profile = new UserProfile();
        profile.setUserId(user.getUserId());
        profile.setProfileType(user.getUserType() == 0
                ? UserProfile.ProfileType.KID_INFO
                : UserProfile.ProfileType.PARENT_INFO);
        profile.setProfileData(dto.getExtInfoJson());
        profile.setCreateTime(System.currentTimeMillis());
        profile.setUpdateTime(System.currentTimeMillis());

        userProfileMapper.insert(profile);

        // 初始化用户等级（所有用户）
        initializeUserLevel(user.getUserId());

        // 如果是儿童用户，初始化游学币
        if (user.getUserType() != null && user.getUserType() == 0) {
            initializeFatiguePoints(user.getUserId());
        }

        return user;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BaseUser registerPublic(AuthRegisterDTO dto) {
        if (dto.getUserType() == null || dto.getUserType() != 1) {
            throw new RuntimeException("当前仅支持家长注册，儿童请使用儿童注册接口并绑定监护人");
        }
        String username = dto.getUsername() != null ? dto.getUsername().trim() : "";
        String phone = dto.getPhone() != null ? dto.getPhone().trim() : "";
        if (username.length() < 2 || username.length() > 20) {
            throw new RuntimeException("用户名长度为 2-20 个字符");
        }
        
        // 手机号改为可选，只有非空时才校验格式
        if (!phone.isEmpty() && !phone.matches("^1[3-9]\\d{9}$")) {
            throw new RuntimeException("手机号格式不正确");
        }
        
        if (dto.getPassword() == null || dto.getPassword().length() < 6) {
            throw new RuntimeException("密码至少 6 位");
        }

        LambdaQueryWrapper<BaseUser> usernameWrap = new LambdaQueryWrapper<>();
        usernameWrap.eq(BaseUser::getUsername, username).eq(BaseUser::getUserType, 1);
        if (baseUserMapper.selectOne(usernameWrap) != null) {
            throw new RuntimeException("该用户名已被注册");
        }

        // 手机号改为可选，只有非空时才检查重复注册
        if (!phone.isEmpty() && userProfileMapper.countByParentPhone(phone) > 0) {
            throw new RuntimeException("该手机号已注册");
        }

        BaseUser user = new BaseUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname() != null && !dto.getNickname().isBlank() ? dto.getNickname() : "家长");
        user.setUserType(1);
        user.setStatus(1);
        long now = System.currentTimeMillis();
        user.setCreateTime(now);
        user.setUpdateTime(now);
        baseUserMapper.insert(user);

        JSONObject ext = new JSONObject();
        // 只有手机号非空时才存储
        if (!phone.isEmpty()) {
            ext.put("phone", phone);
        }
        if (dto.getRealName() != null && !dto.getRealName().isBlank()) {
            ext.put("realName", dto.getRealName().trim());
        }

        UserProfile profile = new UserProfile();
        profile.setUserId(user.getUserId());
        profile.setProfileType(UserProfile.ProfileType.PARENT_INFO);
        profile.setProfileData(ext.toJSONString());
        profile.setCreateTime(now);
        profile.setUpdateTime(now);
        userProfileMapper.insert(profile);

        initializeUserLevel(user.getUserId());
        log.info("家长公开注册成功 userId={}, username={}", user.getUserId(), username);
        return user;
    }

    /**
     * 初始化用户等级
     * @param userId 用户 ID
     */
    private void initializeUserLevel(Long userId) {
        UserLevel level = new UserLevel();
        level.setUserId(userId);
        level.setCurrentLevel(1);
        level.setCurrentExp(0);
        level.setNextLevelExp(100);
        level.setLevelTitle("新手");
        level.setTotalExp(0);
        level.setCreateTime(System.currentTimeMillis());
        level.setUpdateTime(System.currentTimeMillis());

        userLevelMapper.insert(level);
        log.info("初始化用户等级成功。UserId: {}", userId);
    }

    /**
     * 初始化游学币（仅儿童用户）
     * @param userId 用户 ID
     */
    private void initializeFatiguePoints(Long userId) {
        // 设置初始游学币为 10
        BaseUser user = baseUserMapper.selectById(userId);
        if (user != null) {
            user.setFatiguePoints(10);
            user.setDailyAnswerPoints(0);
            user.setFatigueUpdateTime(System.currentTimeMillis());
            baseUserMapper.updateById(user);

            // 记录游学币日志
            FatiguePointsLog fatigueLog = new FatiguePointsLog();
            fatigueLog.setUserId(userId);
            fatigueLog.setChangeType(3); // 3-每日重置/初始赠送
            fatigueLog.setChangePoints(10);
            fatigueLog.setCurrentPoints(10);
            fatigueLog.setRelatedType("SYSTEM");
            fatigueLog.setRemark("新用户注册赠送 10 点游学币");
            fatigueLog.setCreateTime(System.currentTimeMillis());

            fatiguePointsLogMapper.insert(fatigueLog);
            log.info("初始化儿童用户游学币成功。UserId: {}, Points: 10", userId);
        }
    }

    @Override
    public UserLoginResponseDTO login(UserLoginDTO dto) {
        log.info("用户登录请求（兼容 /api/user/login）：username={}", dto.getUsername());
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setUsername(dto.getUsername());
        authRequest.setPassword(dto.getPassword());
        if (dto.getUserType() != null && !dto.getUserType().isBlank()) {
            authRequest.setUserType(convertUserTypeToInt(dto.getUserType()));
        }
        return toUserLoginResponse(authenticate(authRequest));
    }

    private UserLoginResponseDTO toUserLoginResponse(AuthResponseDTO auth) {
        return UserLoginResponseDTO.builder()
                .userId(auth.getUserId())
                .userType(auth.getUserType())
                .username(auth.getUsername())
                .nickname(auth.getNickname())
                .avatar(auth.getAvatar())
                .token(auth.getAccessToken())
                .refreshToken(auth.getRefreshToken())
                .fatiguePoints(auth.getFatiguePoints())
                .dailyAnswerPoints(auth.getDailyAnswerPoints())
                .grade(auth.getGrade())
                .parentId(auth.getParentId())
                .build();
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
    public boolean existsUsername(String username) {
        if (username == null || username.isBlank()) {
            return true;
        }
        return baseUserMapper.selectOne(
                new QueryWrapper<BaseUser>().eq("username", username)
        ) != null;
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
    public Page<BaseUser> listUsers(String userType, String status, Integer page, Integer size) {
        QueryWrapper<BaseUser> wrapper = new QueryWrapper<>();
        if (userType != null) {
            wrapper.eq("user_type", convertUserTypeToInt(userType));
        }
        if (status != null) {
            wrapper.eq("status", Integer.parseInt(status));
        }
        wrapper.orderByDesc("create_time");
        
        // 计算分页偏移量
        int offset = (page - 1) * size;
        
        // 先查询总数
        Long total = baseUserMapper.selectCount(wrapper);
        
        // 手动添加分页限制
        wrapper.last("LIMIT " + offset + "," + size);
        
        // 查询当前页数据
        List<BaseUser> records = baseUserMapper.selectList(wrapper);
        
        // 构建分页对象
        Page<BaseUser> mpPage = new Page<>(page, size, total);
        mpPage.setRecords(records);
        
        return mpPage;
    }

    @Override
    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        log.info("统一认证请求：username={}, userType={}, keyIndex={}", 
            request.getUsername(), request.getUserType(), request.getKeyIndex());
        
        // 1. 查询用户
        LambdaQueryWrapper<BaseUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BaseUser::getUsername, request.getUsername());
        // 如果前端传递了 userType，则加上类型过滤；否则只根据用户名查询
        if (request.getUserType() != null) {
            wrapper.eq(BaseUser::getUserType, request.getUserType());
        }
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
        
        // 7. 补充扩展信息
        if (profile != null && profile.getProfileData() != null) {
            try {
                JSONObject extInfo = JSON.parseObject(profile.getProfileData());
                if (user.getUserType() == 0) {
                    response.setGrade(extInfo.getString("grade"));
                    response.setParentId(extInfo.getLong("parentId"));
                } else if (user.getUserType() == 1) {
                    String phone = extInfo.getString("phone");
                    if (phone != null && !phone.isBlank()) {
                        response.setPhone(phone);
                    }
                }
            } catch (Exception e) {
                log.warn("解析用户扩展信息失败：{}", e.getMessage());
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
