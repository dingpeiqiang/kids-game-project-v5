-- ========================================
-- 为用户 31 插入所有主题的购买记录
-- ========================================

-- 1. 首先查看当前所有可购买的主题
SELECT 
    theme_id AS '主题ID',
    theme_name AS '主题名称',
    owner_type AS '所有者类型',
    owner_id AS '所有者ID',
    price AS '价格',
    status AS '状态'
FROM theme_info
WHERE status = 'on_sale'
ORDER BY theme_id;

-- 2. 为用户 31 批量插入主题购买记录
-- 使用 INSERT IGNORE 避免重复插入（唯一约束：theme_id + buyer_id）
INSERT IGNORE INTO theme_purchase (
    theme_id,
    buyer_id,
    price_paid,
    purchase_time,
    is_refunded
)
SELECT 
    theme_id,
    31 AS buyer_id,
    price AS price_paid,
    NOW() AS purchase_time,
    0 AS is_refunded
FROM theme_info
WHERE status = 'on_sale';

-- 3. 验证插入结果 - 查看用户 31 的所有购买记录
SELECT 
    tp.purchase_id AS '购买ID',
    tp.theme_id AS '主题ID',
    ti.theme_name AS '主题名称',
    ti.owner_type AS '所有者类型',
    ti.owner_id AS '所有者ID',
    tp.buyer_id AS '买家ID',
    tp.price_paid AS '支付价格',
    tp.purchase_time AS '购买时间',
    tp.is_refunded AS '已退款'
FROM theme_purchase tp
INNER JOIN theme_info ti ON tp.theme_id = ti.theme_id
WHERE tp.buyer_id = 31
ORDER BY tp.purchase_id;

-- 4. 统计信息
SELECT 
    '✅ 插入完成！' AS '状态',
    COUNT(*) AS '用户31拥有的主题数'
FROM theme_purchase
WHERE buyer_id = 31;

-- 5. 如果需要查看用户 31 未购买的主题（应该为空）
SELECT 
    ti.theme_id AS '主题ID',
    ti.theme_name AS '主题名称',
    ti.price AS '价格'
FROM theme_info ti
WHERE ti.status = 'on_sale'
AND NOT EXISTS (
    SELECT 1 FROM theme_purchase tp 
    WHERE tp.theme_id = ti.theme_id 
    AND tp.buyer_id = 31
);
