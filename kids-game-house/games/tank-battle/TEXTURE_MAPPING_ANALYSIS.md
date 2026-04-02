# 纹理方向映射分析

## 问题确认
用户反馈：**资源图片的坦克方向与命名不一致**

## 可能的映射关系

### 方案 1：命名和朝向完全相反
| 文件名 | 图片实际朝向 | 使用场景（移动方向） |
|--------|------------|-------------------|
| `enemy_light_up.png` | ⬇️ 向下 | 向下移动（vy > 0）|
| `enemy_light_down.png` | ⬆️ 向上 | 向上移动（vy < 0）|
| `enemy_light_left.png` | ➡️ 向右 | 向右移动（vx > 0）|
| `enemy_light_right.png` | ⬅️ 向左 | 向左移动（vx < 0）|

### 方案 2：命名和朝向互换（水平方向相反）
| 文件名 | 图片实际朝向 | 使用场景（移动方向） |
|--------|------------|-------------------|
| `enemy_light_up.png` | ⬇️ 向下 | 向下移动（vy > 0）|
| `enemy_light_down.png` | ⬆️ 向上 | 向上移动（vy < 0）|
| `enemy_light_left.png` | ⬅️ 向左 | 向左移动（vx < 0）|
| `enemy_light_right.png` | ➡️ 向右 | 向右移动（vx > 0）|

### 方案 3：只有水平方向相反
| 文件名 | 图片实际朝向 | 使用场景（移动方向） |
|--------|------------|-------------------|
| `enemy_light_up.png` | ⬆️ 向上 | 向上移动（vy < 0）|
| `enemy_light_down.png` | ⬇️ 向下 | 向下移动（vy > 0）|
| `enemy_light_left.png` | ➡️ 向右 | 向右移动（vx > 0）|
| `enemy_light_right.png` | ⬅️ 向左 | 向左移动（vx < 0）|

## 测试方法

1. **测试向下移动**（敌人初始方向）：
   - 观察敌人是否"倒着走"
   - 如果倒着，说明 `enemy_light_down.png` 图片实际朝上
   - 应该改用 `enemy_light_up.png`

2. **测试其他方向**：
   - 观察敌人转向其他方向时是否正确
   - 记录每个方向的表现

## 参考信息

**玩家坦克**（假设命名和朝向一致）：
- `player_tank_up.png` → 炮口朝上
- `player_tank_down.png` → 炮口朝下
- `player_tank_left.png` → 炮口朝左
- `player_tank_right.png` → 炮口朝右

## 待确认

请确认每张敌人图片的实际朝向：
1. `enemy_light_up.png` - 炮口朝哪里？
2. `enemy_light_down.png` - 炮口朝哪里？
3. `enemy_light_left.png` - 炮口朝哪里？
4. `enemy_light_right.png` - 炮口朝哪里？
