# 主题系统 API 接口文档

## 基础信息

- **Base URL**: `/api/theme`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

---

## 主题管理 API

### 1. 获取主题列表

**接口**: `GET /api/theme/list`

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 状态筛选：on_sale/offline/pending |
| page | Integer | 否 | 页码，默认 1 |
| pageSize | Integer | 否 | 每页大小，默认 20 |
| gameId | Long | 否 | 游戏 ID（按游戏筛选） |
| gameCode | String | 否 | 游戏代码（按游戏筛选） |

**请求示例**:
```http
GET /api/theme/list?status=on_sale&page=1&pageSize=20&gameId=1&gameCode=snake-vue3
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "themeId": 1,
        "themeName": "经典复古",
        "authorId": 1,
        "authorName": "官方",
        "price": 0,
        "status": "on_sale",
        "downloadCount": 100,
        "totalRevenue": 0,
        "thumbnailUrl": "https://...",
        "isDefault": true,
        "applicableScope": "all",
        "configJson": {...},
        "createdAt": "2026-03-15T10:00:00",
        "updatedAt": "2026-03-15T10:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 2. 获取主题详情

**接口**: `GET /api/theme/detail`

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 主题 ID |

**请求示例**:
```http
GET /api/theme/detail?id=1
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "themeId": 1,
    "themeName": "经典复古",
    "authorId": 1,
    "configJson": {...}
  }
}
```

---

### 3. 上传主题

**接口**: `POST /api/theme/upload`

**请求体**:
```json
{
  "themeName": "经典复古主题",
  "authorName": "官方",
  "price": 0,
  "status": "on_sale",
  "applicableScope": "all",
  "thumbnailUrl": "https://...",
  "description": "适用于所有游戏的经典主题",
  "config": {
    "default": {
      "name": "经典复古",
      "assets": {},
      "styles": {
        "color_primary": "#42b983"
      }
    }
  },
  "gameId": 1,
  "gameCode": "snake-vue3",
  "isDefault": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "themeId": 1,
    "themeName": "经典复古主题"
  }
}
```

---

### 4. 更新主题

**接口**: `POST /api/theme/update`

**请求体**:
```json
{
  "themeId": 1,
  "themeName": "新主题名称",
  "price": 50,
  "status": "on_sale",
  "config": {...}
}
```

---

### 5. 删除主题

**接口**: `POST /api/theme/delete`

**请求体**:
```json
{
  "themeId": 1
}
```

---

## 主题 - 游戏关系 API

### 6. 为游戏添加主题

**接口**: `POST /api/theme/game-relation`

**请求体**:
```json
{
  "themeId": 1,
  "gameId": 1,
  "gameCode": "snake-vue3",
  "isDefault": false
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

### 7. 从游戏移除主题

**接口**: `DELETE /api/theme/game-relation`

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| themeId | Long | 是 | 主题 ID |
| gameId | Long | 是 | 游戏 ID |

**请求示例**:
```http
DELETE /api/theme/game-relation?themeId=1&gameId=1
Authorization: Bearer {token}
```

---

### 8. 设置游戏默认主题

**接口**: `POST /api/theme/set-default`

**请求体**:
```json
{
  "gameId": 1,
  "themeId": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

### 9. 获取主题关联的游戏

**接口**: `GET /api/theme/games`

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| themeId | Long | 是 | 主题 ID |

**请求示例**:
```http
GET /api/theme/games?themeId=1
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": [1, 2, 3]
}
```

---

## 交易相关 API

### 10. 购买主题

**接口**: `POST /api/theme/buy`

**请求体**:
```json
{
  "themeId": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "purchaseId": 1,
    "themeId": 1,
    "buyerId": 100,
    "pricePaid": 50,
    "purchaseTime": "2026-03-15T12:00:00"
  }
}
```

---

### 11. 下载主题

**接口**: `GET /api/theme/download`

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 主题 ID |

**请求示例**:
```http
GET /api/theme/download?id=1
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "config": {
      "default": {
        "name": "经典复古",
        "assets": {},
        "styles": {}
      }
    }
  }
}
```

---

### 12. 获取创作者收益

**接口**: `GET /api/theme/earnings`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "earningsId": 1,
        "themeId": 1,
        "amount": 50,
        "status": "pending",
        "createdAt": "2026-03-15T12:00:00"
      }
    ],
    "totalEarnings": 500,
    "withdrawableEarnings": 200
  }
}
```

---

### 13. 提现收益

**接口**: `POST /api/theme/withdraw`

**请求体**:
```json
{
  "amount": 100
}
```

---

### 14. 切换上架状态

**接口**: `POST /api/theme/toggle-sale`

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| themeId | Long | 是 | 主题 ID |
| onSale | Boolean | 是 | 是否上架 |

**请求示例**:
```http
POST /api/theme/toggle-sale?themeId=1&onSale=true
Authorization: Bearer {token}
```

---

### 15. 检查购买状态

**接口**: `GET /api/theme/check-purchase`

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| themeId | Long | 是 | 主题 ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "purchased": true
  }
}
```

---

## 错误响应

**通用错误格式**:
```json
{
  "success": false,
  "message": "错误描述信息",
  "code": 500
}
```

**常见错误码**:
| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未登录/Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用示例（前端）

### 获取游戏主题列表
```typescript
async function getGameThemes(gameId: number, gameCode: string) {
  const response = await axios.get('/api/theme/list', {
    params: { gameId, gameCode, status: 'on_sale' },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data.list;
}
```

### 为游戏添加主题
```typescript
async function addThemeToGame(themeId: number, gameId: number, gameCode: string) {
  await axios.post('/api/theme/game-relation', {
    themeId,
    gameId,
    gameCode,
    isDefault: false
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

### 设置默认主题
```typescript
async function setDefaultTheme(gameId: number, themeId: number) {
  await axios.post('/api/theme/set-default', {
    gameId,
    themeId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

### 购买主题
```typescript
async function buyTheme(themeId: number) {
  const response = await axios.post('/api/theme/buy', {
    themeId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.success;
}
```
