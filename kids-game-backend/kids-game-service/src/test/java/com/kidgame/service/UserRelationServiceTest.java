package com.kidgame.service;

import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserRelation;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.service.dto.UserRegisterDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 用户关系服务单元测试
 */
@SpringBootTest
public class UserRelationServiceTest {

    @Autowired
    private UserRelationService userRelationService;

    @Autowired
    private UserService userService;

    private BaseUser createTestUser(String username, String userType) {
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setNickname("测试用户");
        dto.setUserType(userType);
        return userService.register(dto);
    }

    @Test
    public void testBindRelation() {
        BaseUser parent = createTestUser("test_parent_rel_001", "PARENT");
        BaseUser kid = createTestUser("test_kid_rel_001", "KID");

        UserRelation relation = userRelationService.bindRelation(
                parent.getUserId(),
                kid.getUserId(),
                "FATHER",
                true,
                "FULL"
        );

        assertNotNull(relation);
        assertEquals(parent.getUserId(), relation.getUserA());
        assertEquals(kid.getUserId(), relation.getUserB());
        assertEquals("FATHER", relation.getRoleType().toString());
        assertTrue(relation.getIsPrimary());
        assertEquals("FULL", relation.getPermissionLevel().toString());
    }

    @Test
    public void testGetGuardianKids() {
        BaseUser parent = createTestUser("test_parent_rel_002", "PARENT");
        BaseUser kid1 = createTestUser("test_kid_rel_002", "KID");
        BaseUser kid2 = createTestUser("test_kid_rel_003", "KID");

        userRelationService.bindRelation(parent.getUserId(), kid1.getUserId(), "FATHER", true, "FULL");
        userRelationService.bindRelation(parent.getUserId(), kid2.getUserId(), "FATHER", false, "FULL");

        List<UserRelation> relations = userRelationService.getGuardianKids(parent.getUserId());
        assertNotNull(relations);
        assertEquals(2, relations.size());
    }

    @Test
    public void testGetKidGuardians() {
        BaseUser parent1 = createTestUser("test_parent_rel_003", "PARENT");
        BaseUser parent2 = createTestUser("test_parent_rel_004", "PARENT");
        BaseUser kid = createTestUser("test_kid_rel_004", "KID");

        userRelationService.bindRelation(parent1.getUserId(), kid.getUserId(), "FATHER", true, "FULL");
        userRelationService.bindRelation(parent2.getUserId(), kid.getUserId(), "MOTHER", false, "FULL");

        List<UserRelation> relations = userRelationService.getKidGuardians(kid.getUserId());
        assertNotNull(relations);
        assertEquals(2, relations.size());
    }

    @Test
    public void testSetPrimaryGuardian() {
        BaseUser parent1 = createTestUser("test_parent_rel_005", "PARENT");
        BaseUser parent2 = createTestUser("test_parent_rel_006", "PARENT");
        BaseUser kid = createTestUser("test_kid_rel_005", "KID");

        userRelationService.bindRelation(parent1.getUserId(), kid.getUserId(), "FATHER", true, "FULL");
        userRelationService.bindRelation(parent2.getUserId(), kid.getUserId(), "MOTHER", false, "FULL");

        // 切换主监护人
        userRelationService.setPrimaryGuardian(parent2.getUserId(), kid.getUserId());

        List<UserRelation> relations = userRelationService.getKidGuardians(kid.getUserId());
        for (UserRelation r : relations) {
            if (r.getUserA().equals(parent2.getUserId())) {
                assertTrue(r.getIsPrimary());
            } else {
                assertFalse(r.getIsPrimary());
            }
        }
    }

    @Test
    public void testUnbindRelation() {
        BaseUser parent = createTestUser("test_parent_rel_007", "PARENT");
        BaseUser kid = createTestUser("test_kid_rel_006", "KID");

        userRelationService.bindRelation(parent.getUserId(), kid.getUserId(), "FATHER", true, "FULL");
        assertTrue(userRelationService.checkRelationExists(parent.getUserId(), kid.getUserId()));

        userRelationService.unbindRelation(parent.getUserId(), kid.getUserId());
        assertFalse(userRelationService.checkRelationExists(parent.getUserId(), kid.getUserId()));
    }
}
