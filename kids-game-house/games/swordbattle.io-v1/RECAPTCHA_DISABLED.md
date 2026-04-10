# reCAPTCHA 禁用说明

## 问题
在国内网络环境下，Google reCAPTCHA 服务无法访问，导致以下错误：
```
GET https://www.google.com/recaptcha/api.js?render=... net::ERR_CONNECTION_TIMED_OUT
```

## 解决方案

### 1. HTML 层面
在 `index.html` 中：
- ✅ 注释掉了 reCAPTCHA 脚本加载
- ✅ 添加了 mock 的 `grecaptcha` 对象，提供开发环境的模拟实现

```javascript
window.grecaptcha = {
  ready: function(callback) {
    callback();
  },
  execute: function(siteKey, options) {
    return Promise.resolve('dev-token-' + Date.now());
  }
};
```

### 2. 配置文件
`config.json` 中已设置：
```json
{
  "recaptcha": false
}
```

### 3. 代码兼容性
所有使用 `grecaptcha` 的地方都有 try-catch 保护：
- OpenScene.js
- TitleScene.js  
- GameScene.js

## 影响范围

### ✅ 正常工作的功能
- 游戏登录
- 用户注册
- 秘密链接登录
- 所有游戏场景

### ⚠️ 注意事项
- Mock token 格式：`dev-token-{timestamp}`
- 仅适用于开发和测试环境
- 生产环境需要启用真实的 reCAPTCHA

## 如何恢复 reCAPTCHA（生产环境）

如果需要在国内生产环境使用验证码，建议：

### 方案 1：使用国内验证码服务
- 腾讯云验证码
- 极验验证
- 网易易盾

### 方案 2：使用代理
配置反向代理转发 reCAPTCHA 请求

### 方案 3：条件加载
根据环境动态加载：
```javascript
if (window.location.hostname !== 'localhost') {
  // 加载 reCAPTCHA
}
```

## 测试验证

✅ reCAPTCHA 脚本不再加载  
✅ 无 ERR_CONNECTION_TIMED_OUT 错误  
✅ grecaptcha.ready() 正常回调  
✅ grecaptcha.execute() 返回 mock token  
✅ 登录/注册功能正常工作  

## 相关文件

- [index.html](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/index.html)
- [config.json](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/config.json)
- [src/OpenScene.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/src/OpenScene.js)
- [src/TitleScene.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/src/TitleScene.js)
- [src/GameScene.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/src/GameScene.js)
