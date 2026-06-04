# API Mock 配置说明

## 问题描述

在开发环境中，后端服务器未运行时，所有 `/api/*` 请求都会返回 HTML（index.html），导致 JSON 解析错误：

```
Error fetching data: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

这是因为 Vite 开发服务器将无法识别的请求都返回 index.html（SPA fallback）。

## 解决方案

在 [vite.config.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/vite.config.js) 的 `htmlFragmentsPlugin` 中添加了 API Mock 中间件。

### 实现代码

```javascript
// Mock API 端点
if (req.url.startsWith('/api/')) {
  res.setHeader('Content-Type', 'application/json');
  
  // 根据不同的 API 端点返回不同的 mock 数据
  if (req.url === '/api/getfeaturedcontent') {
    res.end(JSON.stringify([]));
  } else if (req.url === '/api/loginsecret' || req.url === '/api/login' || req.url === '/api/signup') {
    // 登录/注册 API - 返回成功但无实际功能
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Backend not running in dev mode' 
    }));
  } else if (req.url.includes('/api/changename')) {
    res.end(JSON.stringify({ success: false }));
  } else if (req.url.includes('/api/serverinfo')) {
    res.end(JSON.stringify({ players: 0, maxPlayers: 100 }));
  } else {
    // 默认返回空对象
    res.end(JSON.stringify({}));
  }
  return;
}
```

## Mock API 端点列表

### 1. `/api/getfeaturedcontent`
**用途**：获取精选内容（视频、推荐等）  
**Mock 响应**：`[]`（空数组）  
**影响**：Featured widget 不显示内容，不影响游戏

### 2. `/api/loginsecret`
**用途**：使用秘密链接登录  
**Mock 响应**：
```json
{
  "success": false,
  "error": "Backend not running in dev mode"
}
```
**影响**：秘密链接登录不可用，显示错误提示

### 3. `/api/login`
**用途**：用户名密码登录  
**Mock 响应**：
```json
{
  "success": false,
  "error": "Backend not running in dev mode"
}
```
**影响**：账号登录不可用，显示错误提示

### 4. `/api/signup`
**用途**：用户注册  
**Mock 响应**：
```json
{
  "success": false,
  "error": "Backend not running in dev mode"
}
```
**影响**：注册功能不可用，显示错误提示

### 5. `/api/changename`
**用途**：修改用户名  
**Mock 响应**：
```json
{
  "success": false
}
```
**影响**：改名功能不可用

### 6. `/api/serverinfo`
**用途**：获取服务器信息（玩家数量等）  
**Mock 响应**：
```json
{
  "players": 0,
  "maxPlayers": 100
}
```
**影响**：显示 0 个在线玩家

### 7. 其他 `/api/*` 端点
**Mock 响应**：`{}`（空对象）  
**影响**：根据具体功能可能有限制

## 技术细节

### 中间件执行顺序

```
HTTP Request
    ↓
Vite Dev Server
    ↓
htmlFragmentsPlugin 中间件
    ├─ 检查是否为 HTML 片段 → 是 → 返回 HTML
    ├─ 检查是否为 API 请求 → 是 → 返回 Mock JSON
    └─ 否则 → next() → 静态文件或其他处理
```

### 为什么需要 Mock API？

1. **前端独立开发**：无需启动后端即可测试前端 UI
2. **避免错误**：防止 JSON 解析错误导致页面崩溃
3. **快速迭代**：专注于前端功能，不受后端影响
4. **降级体验**：即使后端不可用，游戏仍可运行

### 与后端联调

当需要与真实后端联调时，有两种方案：

#### 方案 1：注释掉 Mock（临时）
```javascript
// 暂时禁用 Mock
/*
if (req.url.startsWith('/api/')) {
  // ...
}
*/
```

#### 方案 2：使用 Vite 代理（推荐）
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端地址
        changeOrigin: true
      }
    }
  }
});
```

## 测试验证

✅ `/api/getfeaturedcontent` 返回 `[]`  
✅ `/api/login` 返回错误信息  
✅ `/api/signup` 返回错误信息  
✅ `/api/serverinfo` 返回玩家数量  
✅ 无 JSON 解析错误  
✅ 游戏可以正常启动和运行  

## 相关文件

- [vite.config.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/vite.config.js) - API Mock 实现
- [src/TitleScene.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/src/TitleScene.js) - API 调用位置

## 扩展 Mock API

如果需要添加更多 Mock API，只需在中间件中添加新的条件分支：

```javascript
else if (req.url === '/api/newendpoint') {
  res.end(JSON.stringify({ 
    // 你的 mock 数据
  }));
}
```

## 注意事项

1. **仅用于开发**：Mock API 只在 Vite 开发服务器中生效
2. **生产构建**：生产环境需要真实后端或不同的配置
3. **数据持久化**：Mock API 不支持数据持久化，刷新后数据丢失
4. **错误模拟**：可以模拟各种错误场景进行测试

## 总结

通过添加 API Mock 中间件，解决了开发环境中后端未启动时的 JSON 解析错误问题。现在即使没有后端服务，游戏也可以正常运行，只是部分需要后端支持的功能（登录、注册等）会显示相应的提示信息。
