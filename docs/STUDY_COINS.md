# 游学币规则

## 获得方式（仅三种）

| 方式 | 说明 | 接口/入口 |
|------|------|-----------|
| **答题** | 答对且未达家长设置的每日答题游学币上限 | `POST /api/question/submit` → `FatiguePointsService.addFatiguePoints` |
| **家长奖励** | 已绑定家长给孩子发放（单次 1–50） | `POST /api/parent/reward-study-coins` |
| **系统赠与** | 注册初始游学币、每日补充至初始值、管理员系统发放 | `initializeFatiguePoints`、`resetDailyFatiguePoints`、`grantStudyCoinsBySystem` |

## 禁止

- **游戏不能获得游学币**（无游戏结算奖励、无游玩加分币）。
- 游戏仅可 **消耗** 游学币（会话结束按规则扣减），见 `consumeFatiguePoints` / `GameSessionService`。
- 通用 `POST /api/user/fatigue/add` 已限制为 **管理员** 且仅用于儿童答题类补发；业务应使用答题或家长奖励接口。

## 后端校验

`FatiguePointsServiceImpl.assertAllowedCoinChange`：正数变动仅允许 `changeType` 为答题(2)、每日重置(3)、初始化(4)、家长奖励(5)、系统赠与(6)；且禁止 `GAME_SESSION` / `GAME_REWARD` 类入账。

## 前端约定

- 儿童端展示游学币来自服务端 `fatiguePoints` 字段（API 字段名暂未改名）。
- 文案统一使用「游学币」，勿写「游戏获得游学币」。