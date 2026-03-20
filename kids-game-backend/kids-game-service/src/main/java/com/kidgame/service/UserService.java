package com.kidgame.service;

import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.service.dto.AuthRequestDTO;
import com.kidgame.service.dto.AuthResponseDTO;
import com.kidgame.service.dto.UserLoginDTO;
import com.kidgame.service.dto.UserLoginResponseDTO;
import com.kidgame.service.dto.UserRegisterDTO;

import java.util.List;

/**
 * 统一用户服务接口
 */
public interface UserService {

    /**
     * 用户注册
     */
    BaseUser register(UserRegisterDTO dto);

    /**
     * 用户登录
     */
    UserLoginResponseDTO login(UserLoginDTO dto);

    /**
     * 验证密码
     */
    boolean verifyPassword(Long userId, String password);

    /**
     * 修改密码
     */
    void updatePassword(Long userId, String oldPassword, String newPassword);

    /**
     * 更新用户信息
     */
    BaseUser updateUser(BaseUser user);

    /**
     * 根据ID获取用户
     */
    BaseUser getUserById(Long userId);

    /**
     * 根据用户名获取用户
     */
    BaseUser getUserByUsername(String username);

    /**
     * 获取用户扩展信息
     */
    UserProfile getUserProfile(Long userId);

    /**
     * 更新用户扩展信息
     */
    UserProfile updateUserProfile(UserProfile profile);

    /**
     * 禁用用户
     */
    void disableUser(Long userId);

    /**
     * 启用用户
     */
    void enableUser(Long userId);

    /**
     * 分页查询用户列表
     */
    List<BaseUser> listUsers(String userType, String status, Integer page, Integer size);

    /**
     * 统一认证（支持儿童/家长/管理员）
     */
    AuthResponseDTO authenticate(AuthRequestDTO request);

    /**
     * 刷新 Access Token
     */
    String refreshAccessToken(String refreshToken, String deviceFingerprint);
}
