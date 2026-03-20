package com.kidgame.service;

import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.service.dto.UserLoginDTO;
import com.kidgame.service.dto.UserLoginResponseDTO;
import com.kidgame.service.dto.UserRegisterDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 统一用户服务单元测试
 */
@SpringBootTest
public class UserServiceTest {

    @Autowired
    private UserService userService;

    @Test
    public void testRegisterKid() {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("test_kid_001");
        dto.setPassword("password123");
        dto.setNickname("测试儿童");
        dto.setUserType("KID");
        dto.setEmail("kid@test.com");

        BaseUser user = userService.register(dto);
        assertNotNull(user);
        assertNotNull(user.getUserId());
        assertEquals("test_kid_001", user.getUsername());
        assertEquals("KID", user.getUserType());
        assertEquals("ACTIVE", user.getStatus());
    }

    @Test
    public void testRegisterParent() {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("test_parent_001");
        dto.setPassword("password123");
        dto.setNickname("测试家长");
        dto.setUserType("PARENT");
        dto.setEmail("parent@test.com");

        BaseUser user = userService.register(dto);
        assertNotNull(user);
        assertEquals("PARENT", user.getUserType());
    }

    @Test
    public void testLogin() {
        // 先注册
        UserRegisterDTO registerDTO = new UserRegisterDTO();
        registerDTO.setUsername("test_login_001");
        registerDTO.setPassword("password123");
        registerDTO.setNickname("测试登录");
        registerDTO.setUserType("KID");
        userService.register(registerDTO);

        // 测试登录
        UserLoginDTO loginDTO = new UserLoginDTO();
        loginDTO.setUsername("test_login_001");
        loginDTO.setPassword("password123");

        UserLoginResponseDTO responseDTO = userService.login(loginDTO);
        assertNotNull(responseDTO);
        assertEquals("test_login_001", responseDTO.getUsername());
    }

    @Test
    public void testVerifyPassword() {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("test_verify_001");
        dto.setPassword("password123");
        dto.setNickname("测试验证");
        dto.setUserType("KID");
        BaseUser user = userService.register(dto);

        assertTrue(userService.verifyPassword(user.getUserId(), "password123"));
        assertFalse(userService.verifyPassword(user.getUserId(), "wrong_password"));
    }

    @Test
    public void testUpdatePassword() {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("test_update_pwd_001");
        dto.setPassword("password123");
        dto.setNickname("测试修改密码");
        dto.setUserType("KID");
        BaseUser user = userService.register(dto);

        userService.updatePassword(user.getUserId(), "password123", "newpassword456");

        assertTrue(userService.verifyPassword(user.getUserId(), "newpassword456"));
        assertFalse(userService.verifyPassword(user.getUserId(), "password123"));
    }

    @Test
    public void testGetUserProfile() {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("test_profile_001");
        dto.setPassword("password123");
        dto.setNickname("测试档案");
        dto.setUserType("KID");
        dto.setExtInfoJson("{\"age\":8,\"grade\":\"2\"}");
        BaseUser user = userService.register(dto);

        UserProfile profile = userService.getUserProfile(user.getUserId());
        assertNotNull(profile);
        assertEquals(user.getUserId(), profile.getUserId());
        assertEquals("{\"age\":8,\"grade\":\"2\"}", profile.getProfileData());
    }

    @Test
    public void testDisableAndEnableUser() {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("test_status_001");
        dto.setPassword("password123");
        dto.setNickname("测试状态");
        dto.setUserType("KID");
        BaseUser user = userService.register(dto);

        assertEquals("ACTIVE", user.getStatus());

        userService.disableUser(user.getUserId());
        BaseUser disabledUser = userService.getUserById(user.getUserId());
        assertEquals("DISABLED", disabledUser.getStatus());

        userService.enableUser(user.getUserId());
        BaseUser enabledUser = userService.getUserById(user.getUserId());
        assertEquals("ACTIVE", enabledUser.getStatus());
    }

    @Test
    public void testListUsers() {
        List<BaseUser> users = userService.listUsers("KID", "ACTIVE", 1, 10);
        assertNotNull(users);
        assertTrue(users.size() >= 0);
    }
}
