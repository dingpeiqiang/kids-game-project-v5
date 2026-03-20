package com.kidgame.service;

import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserControlConfig;
import com.kidgame.service.dto.UserRegisterDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 用户管控配置服务单元测试
 */
@SpringBootTest
public class UserControlConfigServiceTest {

    @Autowired
    private UserControlConfigService userControlConfigService;

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
    public void testSaveConfig() {
        BaseUser kid = createTestUser("test_kid_config_001");

        UserControlConfig config = new UserControlConfig();
        config.setUserId(kid.getUserId());
        config.setDailyDuration(120);
        config.setAnswerGetPoints(60);
        config.setAllowedTimeStart("08:00:00");
        config.setAllowedTimeEnd("20:00:00");

        UserControlConfig result = userControlConfigService.saveConfig(config);
        assertNotNull(result);
        assertEquals(kid.getUserId(), result.getUserId());
        assertEquals(120, result.getDailyDuration());
        assertEquals(60, result.getAnswerGetPoints());
    }

    @Test
    public void testGetConfig() {
        BaseUser kid = createTestUser("test_kid_config_002");

        UserControlConfig config = new UserControlConfig();
        config.setUserId(kid.getUserId());
        config.setDailyDuration(90);
        userControlConfigService.saveConfig(config);

        UserControlConfig result = userControlConfigService.getConfigByUserId(kid.getUserId());
        assertNotNull(result);
        assertEquals(90, result.getDailyDuration());
    }

    @Test
    public void testUpdateTimeLimit() {
        BaseUser kid = createTestUser("test_kid_config_003");

        UserControlConfig config = new UserControlConfig();
        config.setUserId(kid.getUserId());
        config.setDailyDuration(60);
        userControlConfigService.saveConfig(config);

        userControlConfigService.updateTimeLimit(kid.getUserId(), 180);

        UserControlConfig updated = userControlConfigService.getConfigByUserId(kid.getUserId());
        assertEquals(180, updated.getDailyDuration());
    }

    @Test
    public void testUpdateFatiguePoint() {
        BaseUser kid = createTestUser("test_kid_config_004");

        UserControlConfig config = new UserControlConfig();
        config.setUserId(kid.getUserId());
        config.setAnswerGetPoints(30);
        config.setDailyAnswerLimit(5);
        userControlConfigService.saveConfig(config);

        userControlConfigService.updateFatiguePoint(kid.getUserId(), 45, 15);

        UserControlConfig updated = userControlConfigService.getConfigByUserId(kid.getUserId());
        assertEquals(45, updated.getAnswerGetPoints());
        assertEquals(15, updated.getDailyAnswerLimit());
    }

    @Test
    public void testUpdateTimeRange() {
        BaseUser kid = createTestUser("test_kid_config_005");

        UserControlConfig config = new UserControlConfig();
        config.setUserId(kid.getUserId());
        config.setAllowedTimeStart("09:00:00");
        config.setAllowedTimeEnd("19:00:00");
        userControlConfigService.saveConfig(config);

        userControlConfigService.updateTimeRange(kid.getUserId(), "08:00:00", "21:00:00");

        UserControlConfig updated = userControlConfigService.getConfigByUserId(kid.getUserId());
        assertEquals("08:00:00", updated.getAllowedTimeStart());
        assertEquals("21:00:00", updated.getAllowedTimeEnd());
    }

    @Test
    public void testCheckFatigue() {
        BaseUser kid = createTestUser("test_kid_config_006");

        UserControlConfig config = new UserControlConfig();
        config.setUserId(kid.getUserId());
        config.setBlockedGames("{\"games\":[1,2]}");
        userControlConfigService.saveConfig(config);

        // 未达到疲劳点
        assertFalse(userControlConfigService.checkFatigue(kid.getUserId(), 20));

        // 达到疲劳点
        assertTrue(userControlConfigService.checkFatigue(kid.getUserId(), 30));

        // 超过疲劳点
        assertTrue(userControlConfigService.checkFatigue(kid.getUserId(), 40));
    }

    @Test
    public void testUpdateFatigueMode() {
        BaseUser kid = createTestUser("test_kid_config_007");

        UserControlConfig config = new UserControlConfig();
        config.setUserId(kid.getUserId());
        config.setBlockedGames("{\"mode\":\"SOFT\"}");
        userControlConfigService.saveConfig(config);

        userControlConfigService.updateFatigueMode(kid.getUserId(), "HARD");

        UserControlConfig updated = userControlConfigService.getConfigByUserId(kid.getUserId());
        assertTrue(updated.getBlockedGames().contains("HARD"));
    }
}
