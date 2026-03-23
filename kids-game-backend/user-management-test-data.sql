-- ================================================
-- 用户管理系统 - 测试数据初始化脚本
-- 版本：v1.0.0
-- 日期：2026-03-23
-- 说明：用于开发和测试环境的测试数据
-- ================================================

-- ================================================
-- 1. 测试用户数据
-- ================================================

-- 1.1 管理员用户（2 个）
INSERT INTO t_user (user_type, username, password, nickname, avatar, status, fatigue_points, last_login_time) VALUES
(2, 'admin', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '超级管理员', '/avatars/admin.png', 1, 0, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(2, 'operator', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '运营管理员', '/avatars/operator.png', 1, 0, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- 1.2 家长用户（5 个）
INSERT INTO t_user (user_type, username, password, nickname, avatar, status, fatigue_points) VALUES
(1, 'parent1', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '张妈妈', '/avatars/parent1.png', 1, 0),
(1, 'parent2', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '李爸爸', '/avatars/parent2.png', 1, 0),
(1, 'parent3', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '王妈妈', '/avatars/parent3.png', 1, 0),
(1, 'parent4', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '赵爸爸', '/avatars/parent4.png', 1, 0),
(1, 'parent5', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '刘妈妈', '/avatars/parent5.png', 1, 0);

-- 1.3 儿童用户（10 个）
INSERT INTO t_user (user_type, username, password, nickname, avatar, status, fatigue_points, daily_answer_points) VALUES
(0, 'kid001', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '张小宝', '/avatars/kid1.png', 1, 10, 5),
(0, 'kid002', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '李小贝', '/avatars/kid2.png', 1, 10, 3),
(0, 'kid003', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '王小星', '/avatars/kid3.png', 1, 10, 8),
(0, 'kid004', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '赵小辰', '/avatars/kid4.png', 1, 10, 2),
(0, 'kid005', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '刘小宇', '/avatars/kid5.png', 1, 10, 6),
(0, 'kid006', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '黄小轩', '/avatars/kid6.png', 1, 10, 4),
(0, 'kid007', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '周小怡', '/avatars/kid7.png', 1, 10, 7),
(0, 'kid008', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '吴小涵', '/avatars/kid8.png', 1, 10, 1),
(0, 'kid009', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '郑小琪', '/avatars/kid9.png', 1, 10, 9),
(0, 'kid010', '$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm', '孙小睿', '/avatars/kid10.png', 1, 10, 0);

-- ================================================
-- 2. 用户扩展信息
-- ================================================

-- 2.1 家长扩展信息
INSERT INTO t_user_profile (user_id, profile_type, ext_info_json) VALUES
((SELECT user_id FROM t_user WHERE username = 'parent1' LIMIT 1), 'PARENT_INFO', 
 '{"children": [], "occupation": "教师", "phone": "13800138001", "email": "parent1@example.com"}'),
((SELECT user_id FROM t_user WHERE username = 'parent2' LIMIT 1), 'PARENT_INFO', 
 '{"children": [], "occupation": "医生", "phone": "13800138002", "email": "parent2@example.com"}'),
((SELECT user_id FROM t_user WHERE username = 'parent3' LIMIT 1), 'PARENT_INFO', 
 '{"children": [], "occupation": "工程师", "phone": "13800138003", "email": "parent3@example.com"}');

-- 2.2 儿童扩展信息
INSERT INTO t_user_profile (user_id, profile_type, ext_info_json) VALUES
((SELECT user_id FROM t_user WHERE username = 'kid001' LIMIT 1), 'KID_INFO', 
 '{"grade": "三年级", "school": "实验小学", "birthday": "2015-05-20", "interests": ["数学", "绘画"]}'),
((SELECT user_id FROM t_user WHERE username = 'kid002' LIMIT 1), 'KID_INFO', 
 '{"grade": "四年级", "school": "育才小学", "birthday": "2014-08-15", "interests": ["英语", "音乐"]}'),
((SELECT user_id FROM t_user WHERE username = 'kid003' LIMIT 1), 'KID_INFO', 
 '{"grade": "二年级", "school": "光明小学", "birthday": "2016-03-10", "interests": ["科学", "体育"]}'),
((SELECT user_id FROM t_user WHERE username = 'kid004' LIMIT 1), 'KID_INFO', 
 '{"grade": "五年级", "school": "希望小学", "birthday": "2013-11-25", "interests": ["语文", "美术"]}'),
((SELECT user_id FROM t_user WHERE username = 'kid005' LIMIT 1), 'KID_INFO', 
 '{"grade": "一年级", "school": "阳光小学", "birthday": "2017-06-01", "interests": ["数学", "游戏"]}');

-- ================================================
-- 3. 用户关系
-- ================================================

-- 3.1 家长与儿童关系（多监护人场景）
INSERT INTO t_user_relation (relation_type, user_a, user_b, role_type, is_primary, permission_level, status) VALUES
-- parent1 是 kid001 和 kid002 的妈妈（主监护人）
(1, (SELECT user_id FROM t_user WHERE username = 'parent1' LIMIT 1), 
     (SELECT user_id FROM t_user WHERE username = 'kid001' LIMIT 1), 2, 1, 3, 1),
(1, (SELECT user_id FROM t_user WHERE username = 'parent1' LIMIT 1), 
     (SELECT user_id FROM t_user WHERE username = 'kid002' LIMIT 1), 2, 1, 3, 1),

-- parent2 是 kid001 的爸爸（次要监护人）
(1, (SELECT user_id FROM t_user WHERE username = 'parent2' LIMIT 1), 
     (SELECT user_id FROM t_user WHERE username = 'kid001' LIMIT 1), 1, 0, 3, 1),

-- parent3 是 kid003 和 kid004 的妈妈
(1, (SELECT user_id FROM t_user WHERE username = 'parent3' LIMIT 1), 
     (SELECT user_id FROM t_user WHERE username = 'kid003' LIMIT 1), 2, 1, 3, 1),
(1, (SELECT user_id FROM t_user WHERE username = 'parent3' LIMIT 1), 
     (SELECT user_id FROM t_user WHERE username = 'kid004' LIMIT 1), 2, 1, 3, 1),

-- parent4 是 kid005 的爸爸
(1, (SELECT user_id FROM t_user WHERE username = 'parent4' LIMIT 1), 
     (SELECT user_id FROM t_user WHERE username = 'kid005' LIMIT 1), 1, 1, 3, 1);

-- ================================================
-- 4. 管控配置
-- ================================================

-- 4.1 为每个儿童设置管控配置
INSERT INTO t_user_control_config (user_id, guardian_id, daily_duration, single_duration, allowed_time_start, 
                                    allowed_time_end, answer_get_points, daily_answer_limit, 
                                    fatigue_point_threshold, rest_duration, fatigue_control_mode)
SELECT 
    ku.user_id,
    pu.user_id AS guardian_id,
    60 AS daily_duration,
    30 AS single_duration,
    '06:00' AS allowed_time_start,
    '22:00' AS allowed_time_end,
    1 AS answer_get_points,
    10 AS daily_answer_limit,
    60 AS fatigue_point_threshold,
    15 AS rest_duration,
    'SOFT' AS fatigue_control_mode
FROM t_user ku, t_user pu
WHERE ku.user_type = 0 
  AND pu.user_type = 1
  AND EXISTS (
      SELECT 1 FROM t_user_relation ur 
      WHERE ur.user_a = pu.user_id 
        AND ur.user_b = ku.user_id 
        AND ur.deleted = 0
  );

-- ================================================
-- 5. 用户等级和成就（手动初始化）
-- ================================================

-- ⚠️ 注意：用户注册时会自动初始化等级和成就
-- 以下 SQL 仅用于为现有测试用户补充数据

-- 5.1 为儿童用户初始化等级
UPDATE t_user_level ul
SET current_exp = FLOOR(RAND() * 500),
    total_exp = FLOOR(RAND() * 1000),
    level_title = CASE 
        WHEN FLOOR(RAND() * 1000) > 500 THEN '学霸'
        WHEN FLOOR(RAND() * 1000) > 200 THEN '高手'
        ELSE '新手'
    END
WHERE EXISTS (SELECT 1 FROM t_user u WHERE u.user_id = ul.user_id AND u.user_type = 0);

-- 5.2 为部分儿童添加成就
INSERT INTO t_user_achievement (user_id, achievement_code, achievement_name, achievement_type, description, progress, target_value, status)
SELECT 
    u.user_id,
    'first_login' AS achievement_code,
    '初次登录' AS achievement_name,
    'GENERAL' AS achievement_type,
    '首次登录系统' AS description,
    1 AS progress,
    1 AS target_value,
    1 AS status
FROM t_user u
WHERE u.user_type = 0 AND u.username IN ('kid001', 'kid002', 'kid003');

INSERT INTO t_user_achievement (user_id, achievement_code, achievement_name, achievement_type, description, progress, target_value, status)
SELECT 
    u.user_id,
    'game_master' AS achievement_code,
    '游戏大师' AS achievement_name,
    'GAME' AS achievement_type,
    '累计游戏 10 小时' AS description,
    36000 AS progress,  -- 秒
    36000 AS target_value,
    1 AS status
FROM t_user u
WHERE u.user_type = 0 AND u.username IN ('kid001', 'kid004');

-- ================================================
-- 6. 用户行为日志（模拟最近 7 天的数据）
-- ================================================

-- 6.1 生成测试行为日志
INSERT INTO t_user_action_log (user_id, user_type, action_type, action_desc, ip_address, device_info, create_time)
SELECT 
    u.user_id,
    u.user_type,
    action_types.action_type,
    CONCAT(action_types.action_type, ' 操作') AS action_desc,
    CONCAT('192.168.1.', FLOOR(RAND() * 255)) AS ip_address,
    CASE FLOOR(RAND() * 3)
        WHEN 0 THEN 'Windows Chrome'
        WHEN 1 THEN 'Mac Safari'
        ELSE 'Mobile iOS'
    END AS device_info,
    UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY)) * 1000 + FLOOR(RAND() * 86400000) AS create_time
FROM t_user u
CROSS JOIN (
    SELECT 'LOGIN' AS action_type UNION ALL
    SELECT 'LOGOUT' UNION ALL
    SELECT 'PLAY_GAME' UNION ALL
    SELECT 'ANSWER' UNION ALL
    SELECT 'VIEW_PROFILE'
) action_types
WHERE u.deleted = 0
LIMIT 500;

-- ================================================
-- 7. 申请记录（测试审批流程）
-- ================================================

INSERT INTO t_user_request (requester_id, requester_type, approver_id, approver_type, request_type, request_params, status, reason)
VALUES
-- kid001 申请延长游戏时间
((SELECT user_id FROM t_user WHERE username = 'kid001' LIMIT 1), 0, 
 (SELECT user_id FROM t_user WHERE username = 'parent1' LIMIT 1), 1,
 'EXTEND_TIME', '{"duration": 30, "reason": "作业已完成"}', 0, '今天作业做完了，想多玩一会儿'),

-- kid002 申请解锁新游戏
((SELECT user_id FROM t_user WHERE username = 'kid002' LIMIT 1), 0,
 (SELECT user_id FROM t_user WHERE username = 'parent1' LIMIT 1), 1,
 'UNLOCK_GAME', '{"game_id": 5, "game_name": "数学大冒险"}', 1, '这个游戏对学习数学有帮助'),

-- kid003 的申请已过期
((SELECT user_id FROM t_user WHERE username = 'kid003' LIMIT 1), 0,
 (SELECT user_id FROM t_user WHERE username = 'parent3' LIMIT 1), 1,
 'EXTEND_TIME', '{"duration": 20}', 3, '想要更多游戏时间');

-- ================================================
-- 9. 统计查询（验证数据）
-- ================================================

INSERT INTO t_notification (user_id, user_type, type, title, content, status, sender_id, sender_type, extra_data, create_time)
VALUES
-- 发送给 kid001 的通知
((SELECT user_id FROM t_user WHERE username = 'kid001' LIMIT 1), 0, 
 'REQUEST_APPROVED', '申请已通过', '你的延长游戏时间申请已通过', 1,
 (SELECT user_id FROM t_user WHERE username = 'parent1' LIMIT 1), 1,
 '{"request_id": 1, "approved_duration": 30}',
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 发送给家长的待审批通知
((SELECT user_id FROM t_user WHERE username = 'parent1' LIMIT 1), 1,
 'REQUEST_PENDING', '有待审批的申请', '孩子提交了延长游戏时间的申请', 0,
 (SELECT user_id FROM t_user WHERE username = 'kid001' LIMIT 1), 0,
 '{"request_id": 1}',
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- ================================================
-- 9. 统计查询（验证数据）
-- ================================================

SELECT '测试数据初始化完成！' AS status,
       (SELECT COUNT(*) FROM t_user WHERE deleted = 0) AS total_users,
       (SELECT COUNT(*) FROM t_user WHERE user_type = 0 AND deleted = 0) AS kid_count,
       (SELECT COUNT(*) FROM t_user WHERE user_type = 1 AND deleted = 0) AS parent_count,
       (SELECT COUNT(*) FROM t_user WHERE user_type = 2 AND deleted = 0) AS admin_count,
       (SELECT COUNT(*) FROM t_user_relation WHERE deleted = 0) AS total_relations,
       (SELECT COUNT(*) FROM t_user_control_config WHERE deleted = 0) AS control_configs,
       (SELECT COUNT(*) FROM t_user_achievement WHERE deleted = 0) AS achievements,
       (SELECT COUNT(*) FROM t_user_action_log) AS action_logs;  -- ⚠️ t_user_action_log 没有 deleted 字段

-- ================================================
-- 10. 有用的查询视图（开发调试用）
-- ================================================

-- 查看每个家长的子女数量
CREATE OR REPLACE VIEW v_parent_kids_summary AS
SELECT 
    p.user_id AS parent_id,
    p.username AS parent_username,
    p.nickname AS parent_nickname,
    COUNT(ur.user_b) AS kid_count,
    GROUP_CONCAT(k.username SEPARATOR ', ') AS kids_usernames
FROM t_user p
LEFT JOIN t_user_relation ur ON p.user_id = ur.user_a AND ur.deleted = 0
LEFT JOIN t_user k ON ur.user_b = k.user_id AND k.deleted = 0
WHERE p.user_type = 1 AND p.deleted = 0
GROUP BY p.user_id, p.username, p.nickname;

-- 查看每个儿童的监护人信息
CREATE OR REPLACE VIEW v_kid_guardians_summary AS
SELECT 
    k.user_id AS kid_id,
    k.username AS kid_username,
    k.nickname AS kid_nickname,
    COUNT(ur.user_a) AS guardian_count,
    GROUP_CONCAT(
        CONCAT(p.nickname, '(', 
            CASE ur.role_type 
                WHEN 1 THEN '爸爸' 
                WHEN 2 THEN '妈妈' 
                ELSE '监护人' 
            END,
            CASE WHEN ur.is_primary = 1 THEN '-主' ELSE '' END,
            ')'
        ) SEPARATOR ', '
    ) AS guardians
FROM t_user k
LEFT JOIN t_user_relation ur ON k.user_id = ur.user_b AND ur.deleted = 0
LEFT JOIN t_user p ON ur.user_a = p.user_id AND p.deleted = 0
WHERE k.user_type = 0 AND k.deleted = 0
GROUP BY k.user_id, k.username, k.nickname;

-- 查看用户活跃度
CREATE OR REPLACE VIEW v_user_activity_overview AS
SELECT 
    u.user_id,
    u.username,
    u.user_type,
    u.nickname,
    u.status,
    ul.current_level,
    ul.total_exp,
    (SELECT COUNT(*) FROM t_user_action_log al WHERE al.user_id = u.user_id) AS total_actions,
    (SELECT MAX(FROM_UNIXTIME(al.create_time / 1000)) FROM t_user_action_log al WHERE al.user_id = u.user_id) AS last_action_time,
    u.fatigue_points,
    u.daily_answer_points
FROM t_user u
LEFT JOIN t_user_level ul ON u.user_id = ul.user_id
WHERE u.deleted = 0
ORDER BY u.create_time DESC;

-- 执行查询展示统计数据
SELECT '=== 用户统计 ===' AS info;
SELECT * FROM v_parent_kids_summary;

SELECT '=== 儿童监护人统计 ===' AS info;
SELECT * FROM v_kid_guardians_summary;

SELECT '=== 用户活跃度总览 ===' AS info;
SELECT * FROM v_user_activity_overview LIMIT 20;
