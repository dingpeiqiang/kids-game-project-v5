-- ================================================
-- kids-game-simple 游戏注册脚本
-- 执行此脚本将把前端游戏注册到 t_game 表
-- ================================================

-- 禁用外键检查（如果需要）
-- SET FOREIGN_KEY_CHECKS = 0;

-- 逻辑思维类
INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('eliminate', '极速消除', 'LOGIC', '6-12', '消除,益智', '点击同色方块，触发连锁爆炸！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('tetris', '方块消除', 'LOGIC', '6-12', '消除,益智', '经典俄罗斯方块，益智又上瘾！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('jewelMatch', '宠物消消乐', 'LOGIC', '6-12', '消除,益智', '交换宠物消除，3个以上连成一线！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('bubbleShooter', '泡泡龙', 'LOGIC', '6-12', '消除,射击', '经典泡泡龙射击，3个以上相同颜色消除！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('sort', '色彩排序', 'LOGIC', '6-12', '益智,排序', '10关卡渐进难度，液体排序超治愈！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

-- 记忆训练类
INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('memoryMatch', '翻牌配对', 'MEMORY', '6-12', '记忆,配对', '翻开卡牌找到相同图案，考验你的记忆力！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

-- 专注力类
INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('colorTap', '颜色Tap', 'ATTENTION', '6-12', '反应,点击', '快速点击匹配颜色，测试你的反应力！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('whackMole', '打地鼠', 'ATTENTION', '6-12', '反应,敲击', '快速敲击出洞的地鼠，金色鼠得分多，小心炸弹！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

-- 反应速度类
INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('pop', '气球砰砰', 'REACTION', '6-12', '点击,反应', '疯狂点击气球，炸出高分！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

-- 手眼协调类
INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('fruitSlice', '水果切切', 'COORDINATION', '6-12', '切割,滑动', '划动切割水果，果汁飞溅超解压！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('cookieCut', '切饼干', 'COORDINATION', '6-12', '切割,滑动', '滑动切割飞起的饼干，碎屑四溅超有趣！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('dodge', '轻量躲避', 'COORDINATION', '6-12', '躲避,跑酷', '滑动躲避障碍，收集加分道具', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('neonRun', '霓虹跑酷', 'COORDINATION', '6-12', '跑酷,躲避', '躲避障碍收集金币，无尽奔跑！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('slimeJump', '史莱姆跳', 'COORDINATION', '6-12', '跳跃,收集', '控制史莱姆不断往上跳，收集星星得高分！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('snake', '贪吃蛇', 'COORDINATION', '6-12', '经典,收集', '控制小蛇吃食物，别撞墙和自己的尾巴！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('racingRun', '极速赛车', 'COORDINATION', '6-12', '赛车,躲避', '飙车躲障碍！拾取道具触发火焰加速、护盾、磁铁吸分，超爽！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('starCatcher', '星星捕手', 'COORDINATION', '6-12', '益智,收集', '控制小精灵收集星星，躲避乌云袭击！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

-- 空间想象类
INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('jump3d', '云端立体跳跳', 'SPATIAL', '8-14', '3D,跳跃', '3D立体跳一跳！长按蓄力精准跳跃，挑战极限高分！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('stack3d', '3D堆叠乐园', 'SPATIAL', '8-14', '3D,堆叠', '3D模型堆叠挑战，不倒塌就得分', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('bouncePath', '弹珠迷宫', 'SPATIAL', '6-12', '益智,弹珠', '控制弹珠收集星星，弹跳乐趣多！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('stack', '叠叠乐', 'SPATIAL', '6-12', '堆叠,精准', '精准堆叠方块，叠得越高分数越高！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('mazeExplorer', '星界迷宫', 'SPATIAL', '8-14', '3D,迷宫', '3D第一人称迷宫探险！收集钥匙开启出口传送门，限时闯关挑战！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('carParking3d', '3D停车大师', 'COORDINATION', '10-16', '3D,驾驶', '真实3D停车模拟！精准操控车辆，完成倒车入库、侧方停车等挑战！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('voxelSandbox', '方块沙盒世界', 'CREATIVITY', '8-14', '沙盒,建造', '3D体素沙盒建造游戏！随机地形生成，自由破坏建造、昼夜光影系统，创造你的专属世界！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

-- 策略规划类
INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('plantsVsZombies', '植物大战僵尸', 'STRATEGY', '8-14', '塔防,种植', '种植植物抵御僵尸入侵，保护你的家园！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('towerDefense', '星际塔防', 'STRATEGY', '8-14', '塔防,策略', '放置防御塔拦截外星入侵者，守住防线！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('rpgShooterTD', 'RPG塔防射击', 'STRATEGY', '10-16', '塔防,射击,RPG', '双系统战斗！建造炮台防御+角色移动射击，策略与操作并重！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('spaceShooter', '太空射击', 'STRATEGY', '8-14', '射击,飞行', '驾驶飞船消灭外星入侵者，躲避弹幕！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('rpgShooter', '星际猎手', 'STRATEGY', '10-16', 'RPG,射击', 'RPG移动射击！击杀敌人获得经验升级，提升属性挑战波次！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('dragonShooter', '打龙小游戏', 'STRATEGY', '8-14', '射击,休闲', '国产爆款！滑动控制自动射击，龙体分裂爽感无限！', 1, 1, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('contraRpg', '魂斗罗RPG', 'STRATEGY', '10-16', '射击,RPG', '经典横版射击闯关！击败敌人收集道具，挑战最终BOSS！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('wangzheRpg', '王者荣耀', 'STRATEGY', '12-18', '对战,MOBA', '横版对战！摇杆移动+技能释放，击杀敌方3次获胜！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('dnfRpg', '地下城勇士', 'STRATEGY', '12-18', '格斗,RPG', '高仿DNF！选择职业闯荡地下城，连招浮空击败BOSS！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('abyssDungeon', '深渊地下城', 'STRATEGY', '10-16', '3D,RPG,地牢', '3D顶视角RPG！探索随机地牢、击杀怪物、收集装备、挑战BOSS！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

INSERT INTO t_game (game_code, game_name, category, grade, tags, description, status, is_featured, create_time, update_time, deleted)
VALUES ('rollingBall', '云端滚球闯关', 'COORDINATION', '8-14', '3D,闯关,物理', '3D物理滚球闯关！收集水晶、躲避障碍，在悬空赛道上挑战极限！', 1, 0, UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0)
ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), category = VALUES(category), tags = VALUES(tags), description = VALUES(description), update_time = UNIX_TIMESTAMP(NOW()) * 1000;

-- ================================================
-- 为已注册的游戏创建排行榜维度记录（t_leaderboard_dimension）
-- 注意：t_leaderboard_dimension 表无 status 字段
-- ================================================
INSERT INTO t_leaderboard_dimension (game_id, dimension_code, dimension_name, data_type, create_time, update_time, deleted)
SELECT game_id, 'SCORE', '积分排行', 'INT', UNIX_TIMESTAMP(NOW()) * 1000, UNIX_TIMESTAMP(NOW()) * 1000, 0
FROM t_game g WHERE game_code IN ('eliminate', 'tetris', 'jewelMatch', 'bubbleShooter', 'sort', 'memoryMatch', 'colorTap', 'whackMole', 'pop', 'fruitSlice', 'cookieCut', 'dodge', 'neonRun', 'slimeJump', 'snake', 'racingRun', 'starCatcher', 'jump3d', 'stack3d', 'bouncePath', 'stack', 'mazeExplorer', 'carParking3d', 'voxelSandbox', 'plantsVsZombies', 'towerDefense', 'rpgShooterTD', 'spaceShooter', 'rpgShooter', 'dragonShooter', 'contraRpg', 'wangzheRpg', 'dnfRpg', 'abyssDungeon', 'rollingBall')
AND NOT EXISTS (SELECT 1 FROM t_leaderboard_dimension lbd WHERE lbd.game_id = g.game_id AND lbd.dimension_code = 'SCORE');

-- ================================================
-- 验证注册结果
-- ================================================
SELECT '注册成功的游戏列表：' AS message;
SELECT game_id, game_code, game_name, category FROM t_game WHERE game_code IN ('eliminate', 'tetris', 'jewelMatch', 'bubbleShooter', 'sort', 'memoryMatch', 'colorTap', 'whackMole', 'pop', 'fruitSlice', 'cookieCut', 'dodge', 'neonRun', 'slimeJump', 'snake', 'racingRun', 'starCatcher', 'jump3d', 'stack3d', 'bouncePath', 'stack', 'mazeExplorer', 'carParking3d', 'voxelSandbox', 'plantsVsZombies', 'towerDefense', 'rpgShooterTD', 'spaceShooter', 'rpgShooter', 'dragonShooter', 'contraRpg', 'wangzheRpg', 'dnfRpg', 'abyssDungeon', 'rollingBall') AND deleted = 0;

-- 重新启用外键检查（如果需要）
-- SET FOREIGN_KEY_CHECKS = 1;
