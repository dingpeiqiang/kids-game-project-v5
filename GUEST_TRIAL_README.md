# 游客试玩功能使用指南

## 功能说明

游客试玩功能允许未注册用户在不注册的情况下体验平台游戏，但有10分钟的时间限制。时间到期后，用户需要注册或登录才能继续游戏。

## 使用方法

### 1. 进入游客模式

1. 访问登录页面 (`/login`)
2. 点击"游客试玩（10分钟）"按钮
3. 弹出确认对话框，显示试玩规则
4. 确认后系统会自动设置游客身份并开始计时
5. 跳转到游戏列表页面
6. 页面顶部显示实时倒计时

### 2. 游戏体验

- 游客可以正常浏览和启动游戏
- 页面顶部显示实时倒计时（MM:SS格式）
- 游戏过程中后台会持续检查试玩时间
- 每秒自动更新剩余时间显示

### 3. 时间到期处理

当10分钟试玩时间到期时：
1. 系统会弹出提示框："游客试玩时间已到（10分钟），请注册或登录后继续游戏！"
2. 自动跳转到登录页面
3. 用户可以选择注册新账号或登录现有账号

## 技术实现

### 前端实现

#### 数据存储
```javascript
// localStorage 中存储的数据
localStorage.setItem('isGuest', 'true');           // 标识游客模式
localStorage.setItem('guestStartTime', timestamp); // 记录开始时间
```

#### 时间检查
```javascript
// 每秒更新一次倒计时
setInterval(() => {
  const isGuest = localStorage.getItem('isGuest') === 'true';
  if (isGuest) {
    const startTime = parseInt(localStorage.getItem('guestStartTime'));
    const elapsed = (Date.now() - startTime) / 1000; // 秒
    const remaining = Math.max(0, 600 - elapsed); // 剩余秒数
    
    // 更新UI显示
    remainingTime.value = remaining;
    
    if (elapsed >= 600) { // 10分钟 = 600秒
      alert('游客试玩时间已到，请注册或登录');
      router.push('/login');
    }
  }
}, 1000);
```

### 权限验证

在游戏启动前进行权限验证：
```javascript
function validateGameStartPermission() {
  const isGuest = localStorage.getItem('isGuest') === 'true';
  
  if (isGuest) {
    // 检查游客时间是否过期
    const startTime = parseInt(localStorage.getItem('guestStartTime'));
    const elapsed = (Date.now() - startTime) / (1000 * 60);
    
    if (elapsed >= 10) {
      alert('游客试玩时间已到，请注册或登录');
      return false;
    }
  }
  
  return true;
}
```

## 测试方法

### 手动测试

1. **正常流程测试**
   - 访问登录页 → 点击游客试玩 → 进入游戏 → 等待10分钟 → 验证跳转

2. **边界测试**
   - 在9分50秒时尝试启动新游戏
   - 在10分钟整时尝试启动游戏
   - 页面刷新后时间是否继续计算

3. **异常测试**
   - 清除localStorage后重新进入
   - 修改系统时间测试时间计算
   - 多标签页同时游玩

### 自动化测试

运行测试脚本：
```bash
# 在浏览器控制台执行
node test-guest-trial.js

# 或在页面中加载后执行
window.runGuestTrialTests()
```

## 注意事项

### 安全性考虑

1. **前端限制**: 当前实现主要在前端进行，高级用户可能通过修改localStorage绕过限制
2. **时间同步**: 使用客户端时间，可能存在时间偏差
3. **会话管理**: 建议后续增加后端会话管理

### 用户体验

1. **友好提示**: 时间即将到期时可增加倒计时提示
2. **数据保存**: 游客期间的游戏进度不会保存
3. **转化引导**: 时间到期时提供便捷的注册/登录入口

### 性能影响

1. **定时器开销**: 每30秒的检查对性能影响极小
2. **存储占用**: localStorage占用空间可忽略不计
3. **网络请求**: 无额外网络请求，纯前端实现

## 扩展建议

### 短期优化

1. **倒计时提示**: ✅ 已实现实时倒计时显示
2. **进度保存**: 允许游客保存部分游戏进度
3. **社交分享**: 鼓励游客分享给朋友

### 长期规划

1. **后端验证**: 增加服务器端时间验证
2. **数据分析**: 统计游客转化率和行为模式
3. **个性化时长**: 根据用户行为动态调整试玩时长
4. **防作弊机制**: 防止时间篡改和重复试玩

## 故障排除

### 常见问题

1. **游客模式无法启动**
   - 检查浏览器是否支持localStorage
   - 确认JavaScript未被禁用
   - 查看浏览器控制台错误信息

2. **时间计算不准确**
   - 检查系统时间是否正确
   - 确认时区设置无误
   - 验证Date对象正常工作

3. **跳转失败**
   - 检查路由配置是否正确
   - 确认登录页面路径无误
   - 查看导航守卫设置

### 调试技巧

```javascript
// 查看当前游客状态
console.log('Is Guest:', localStorage.getItem('isGuest'));
console.log('Start Time:', localStorage.getItem('guestStartTime'));

// 手动设置测试时间
localStorage.setItem('guestStartTime', (Date.now() - 11*60*1000).toString());

// 清除游客状态
localStorage.removeItem('isGuest');
localStorage.removeItem('guestStartTime');
```

## 版本历史

- v1.0.0: 初始版本，实现基本游客试玩功能
- 计划: 增加后端验证和数据分析功能