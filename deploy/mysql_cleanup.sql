-- ================================================
-- 儿童游戏平台 - 数据库清理脚本 v1.0
-- 生成时间：2026-06-28
-- 按外键依赖顺序删除所有表，确保清理成功
-- ================================================

USE kidgame;

-- 禁用外键检查，确保清理顺利
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================
-- 1. 用户体系（关联表优先）
-- ================================================
DROP TABLE IF EXISTS t_user_role;
DROP TABLE IF EXISTS t_role_permission;
DROP TABLE IF EXISTS t_user_profile;
DROP TABLE IF EXISTS t_user_relation;
DROP TABLE IF EXISTS t_relation_confirmation;
DROP TABLE IF EXISTS t_user_request;
DROP TABLE IF EXISTS t_user_control_config;
DROP TABLE IF EXISTS t_user_level;
DROP TABLE IF EXISTS t_user_achievement;
DROP TABLE IF EXISTS t_user_action_log;
DROP TABLE IF EXISTS t_role;
DROP TABLE IF EXISTS t_permission;
DROP TABLE IF EXISTS t_user;

-- ================================================
-- 2. 游戏模块（关联表优先）
-- ================================================
DROP TABLE IF EXISTS t_game_tag_relation;
DROP TABLE IF EXISTS t_game_config;
DROP TABLE IF EXISTS t_game_mode_config;
DROP TABLE IF EXISTS t_game_resource_config;
DROP TABLE IF EXISTS t_game_comment;
DROP TABLE IF EXISTS t_game_permission;
DROP TABLE IF EXISTS t_game_record;
DROP TABLE IF EXISTS t_game_session;
DROP TABLE IF EXISTS t_game_review_record;
DROP TABLE IF EXISTS t_game_statistics;
DROP TABLE IF EXISTS t_game_version_history;
DROP TABLE IF EXISTS t_blocked_game;
DROP TABLE IF EXISTS t_user_favorite;
DROP TABLE IF EXISTS t_game_tag;
DROP TABLE IF EXISTS t_game;

-- ================================================
-- 3. 排行榜模块（关联表优先）
-- ================================================
DROP TABLE IF EXISTS t_leaderboard_data;
DROP TABLE IF EXISTS t_leaderboard_config;
DROP TABLE IF EXISTS t_leaderboard_dimension;

-- ================================================
-- 4. 学科与试题模块（关联表优先）
-- ================================================
DROP TABLE IF EXISTS t_answer_record;
DROP TABLE IF EXISTS t_wrong_question;
DROP TABLE IF EXISTS t_collection;
DROP TABLE IF EXISTS t_daily_session;
DROP TABLE IF EXISTS t_knowledge_point;
DROP TABLE IF EXISTS t_question;
DROP TABLE IF EXISTS t_subject;

-- ================================================
-- 5. 班级与任务模块（关联表优先）
-- ================================================
DROP TABLE IF EXISTS t_class_member;
DROP TABLE IF EXISTS t_assignment_completion;
DROP TABLE IF EXISTS t_practice_assignment;
DROP TABLE IF EXISTS t_class;

-- ================================================
-- 6. 经济与任务系统（关联表优先）
-- ================================================
DROP TABLE IF EXISTS t_user_sign_in;
DROP TABLE IF EXISTS t_sign_in_reward_config;
DROP TABLE IF EXISTS t_game_economy_config;
DROP TABLE IF EXISTS t_game_session_score;
DROP TABLE IF EXISTS t_user_task_progress;
DROP TABLE IF EXISTS t_task_definition;
DROP TABLE IF EXISTS t_user_title;
DROP TABLE IF EXISTS t_title_definition;
DROP TABLE IF EXISTS t_product_config;
DROP TABLE IF EXISTS t_user_purchase;
DROP TABLE IF EXISTS t_shop_product;

-- ================================================
-- 7. 主题系统（注意外键依赖：t_theme_assets 依赖 t_theme_info）
-- ================================================
DROP TABLE IF EXISTS t_theme_assets;
DROP TABLE IF EXISTS t_user_theme_preference;
DROP TABLE IF EXISTS t_theme_purchase;
DROP TABLE IF EXISTS t_theme_info;

-- ================================================
-- 8. 系统模块
-- ================================================
DROP TABLE IF EXISTS t_notification;
DROP TABLE IF EXISTS t_daily_stats;
DROP TABLE IF EXISTS t_system_config;

-- ================================================
-- 9. 草稿系统（关联表优先）
-- ================================================
DROP TABLE IF EXISTS t_draft_category_relation;
DROP TABLE IF EXISTS t_draft_version;
DROP TABLE IF EXISTS t_draft;
DROP TABLE IF EXISTS t_draft_category;
DROP TABLE IF EXISTS t_creator_earnings;

-- ================================================
-- 10. 补充缺失表
-- ================================================
DROP TABLE IF EXISTS t_fatigue_points_log;
DROP TABLE IF EXISTS t_parent_limit;
DROP TABLE IF EXISTS user_game_record;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database cleanup completed successfully!' AS message;