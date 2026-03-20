package com.kidgame.service;

import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.GamePermission;
import com.kidgame.service.dto.UserRegisterDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 游戏权限服务单元测试
 */
@SpringBootTest
public class GamePermissionServiceTest {

    @Autowired
    private GamePermissionService gamePermissionService;

    @Autowired
    private UserService userService;

    private BaseUser createTestUser(String username) {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setNickname("测试用户");
        dto.setUserType("KID");
        return userService.register(dto);
    }

    @Test
    public void testSetPermission() {
        BaseUser kid = createTestUser("test_kid_perm_001");

        GamePermission permission = new GamePermission();
        permission.setUserId(kid.getUserId());
        permission.setGameId(1L);
        permission.setPermissionType("LIMIT_TIME");
        permission.setPermissionParams("{\"max_minutes\": 30}");

        GamePermission result = gamePermissionService.setPermission(permission);
        assertNotNull(result);
        assertEquals(kid.getUserId(), result.getUserId());
        assertEquals(1L, result.getGameId());
        assertEquals("LIMIT_TIME", result.getPermissionType());
        assertTrue(result.getPermissionParams().contains("30"));
    }

    @Test
    public void testGetPermission() {
        BaseUser kid = createTestUser("test_kid_perm_002");

        GamePermission permission = new GamePermission();
        permission.setUserId(kid.getUserId());
        permission.setGameId(2L);
        permission.setPermissionType("BLOCK");

        gamePermissionService.setPermission(permission);

        GamePermission result = gamePermissionService.getPermission(kid.getUserId(), 2L);
        assertNotNull(result);
        assertEquals("BLOCK", result.getPermissionType());
    }

    @Test
    public void testBlockGame() {
        BaseUser kid = createTestUser("test_kid_perm_003");

        GamePermission permission = new GamePermission();
        permission.setUserId(kid.getUserId());
        permission.setGameId(3L);
        permission.setPermissionType("BLOCK");

        gamePermissionService.setPermission(permission);

        assertFalse(gamePermissionService.checkGameStart(kid.getUserId(), GamePermission.UserType.KID, 3L));
    }

    @Test
    public void testAllowGame() {
        BaseUser kid = createTestUser("test_kid_perm_004");

        GamePermission permission = new GamePermission();
        permission.setUserId(kid.getUserId());
        permission.setGameId(4L);
        permission.setPermissionType("ALLOW");

        gamePermissionService.setPermission(permission);

        assertTrue(gamePermissionService.checkGameStart(kid.getUserId(), GamePermission.UserType.KID, 4L));
    }

    @Test
    public void testBatchSetPermissions() {
        BaseUser kid = createTestUser("test_kid_perm_005");

        GamePermission p1 = new GamePermission();
        p1.setUserId(kid.getUserId());
        p1.setGameId(5L);
        p1.setPermissionType("ALLOW");

        GamePermission p2 = new GamePermission();
        p2.setUserId(kid.getUserId());
        p2.setGameId(6L);
        p2.setPermissionType("BLOCK");

        List<GamePermission> results = gamePermissionService.batchSetPermissions(Arrays.asList(p1, p2));
        assertNotNull(results);
        assertEquals(2, results.size());
    }

    @Test
    public void testUpdateTimeLimit() {
        BaseUser kid = createTestUser("test_kid_perm_006");

        GamePermission permission = new GamePermission();
        permission.setUserId(kid.getUserId());
        permission.setGameId(7L);
        permission.setPermissionType("LIMIT_TIME");
        permission.setPermissionParams("{\"max_minutes\": 30}");

        gamePermissionService.setPermission(permission);

        gamePermissionService.updateTimeLimit(kid.getUserId(), GamePermission.UserType.KID, 7L, 60);

        GamePermission updated = gamePermissionService.getPermission(kid.getUserId(), GamePermission.UserType.KID, 7L);
        assertTrue(updated.getPermissionParams().contains("60"));
    }

    @Test
    public void testUpdatePermissionType() {
        BaseUser kid = createTestUser("test_kid_perm_007");

        GamePermission permission = new GamePermission();
        permission.setUserId(kid.getUserId());
        permission.setGameId(8L);
        permission.setPermissionType("BLOCK");

        gamePermissionService.setPermission(permission);

        gamePermissionService.updatePermissionType(kid.getUserId(), GamePermission.UserType.KID, 8L, "ALLOW");

        GamePermission updated = gamePermissionService.getPermission(kid.getUserId(), GamePermission.UserType.KID, 8L);
        assertEquals("ALLOW", updated.getPermissionType());
    }
}
