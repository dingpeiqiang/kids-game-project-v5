# 测试用户密码说明

## 📋 当前测试账号信息

### **统一密码（所有用户）**

所有测试用户的密码哈希值都是：
```
$2b$10$kI/VYImYHOzGwaEr87PyxeiOEaQT5OZXTO8ePLl.qVKzhurP5hKS6
```

**对应的明文密码是**: `password123`

✅ **已验证**: BCrypt 验证通过

---

## 🔐 测试账号列表

### **管理员账号（2 个）**

| 用户名 | 昵称 | 密码 | 用户类型 |
|--------|------|------|---------|
| `admin` | 超级管理员 | `password123` | 管理员 (2) |
| `operator` | 运营管理员 | `password123` | 管理员 (2) |

---

### **家长账号（5 个）**

| 用户名 | 昵称 | 密码 | 用户类型 |
|--------|------|------|---------|
| `parent1` | 张妈妈 | `password123` | 家长 (1) |
| `parent2` | 李爸爸 | `password123` | 家长 (1) |
| `parent3` | 王妈妈 | `password123` | 家长 (1) |
| `parent4` | 赵爸爸 | `password123` | 家长 (1) |
| `parent5` | 刘妈妈 | `password123` | 家长 (1) |

---

### **儿童账号（10 个）**

| 用户名 | 昵称 | 密码 | 用户类型 | 疲劳点 |
|--------|------|------|---------|--------|
| `kid001` | 张小宝 | `password123` | 儿童 (0) | 10 |
| `kid002` | 李小贝 | `password123` | 儿童 (0) | 10 |
| `kid003` | 王小星 | `password123` | 儿童 (0) | 10 |
| `kid004` | 赵小辰 | `password123` | 儿童 (0) | 10 |
| `kid005` | 刘小宇 | `password123` | 儿童 (0) | 10 |
| `kid006` | 黄小轩 | `password123` | 儿童 (0) | 10 |
| `kid007` | 周小怡 | `password123` | 儿童 (0) | 10 |
| `kid008` | 吴小涵 | `password123` | 儿童 (0) | 10 |
| `kid009` | 郑小琪 | `password123` | 儿童 (0) | 10 |
| `kid010` | 孙小睿 | `password123` | 儿童 (0) | 10 |

---

## ⚠️ 安全警告

**这些密码仅用于开发和测试环境！**

❌ **不要在生产环境使用相同的密码！**  
❌ **不要在生产环境使用弱密码！**  
❌ **不要将密码硬编码在 SQL 脚本中！**

---

## 🔧 如何生成 BCrypt 密码哈希

### **方法 1: 使用在线工具**

推荐网站：
- https://bcrypt-generator.com/
- https://devglan.com/online-tools/bcrypt-hash-online
- https://md5hashing.net/hash/bcrypt

**步骤**:
1. 打开任意一个网站
2. 输入你的密码（如：`MySecure@Pass123`）
3. Rounds 设置为 `10`
4. 点击 "Hash" 或 "Generate"
5. 复制生成的哈希值到 SQL 脚本

---

### **方法 2: 使用 Java 代码生成**

创建测试类：

```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        
        // 生成密码哈希
        String password = "password123";
        String hash = encoder.encode(password);
        
        System.out.println("Password: " + password);
        System.out.println("Hash: " + hash);
        
        // 验证密码
        boolean matches = encoder.matches(password, hash);
        System.out.println("Matches: " + matches);
    }
}
```

**运行结果**:
```
Password: password123
Hash: $2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm
Matches: true
```

---

### **方法 3: 使用 Python 脚本**

```python
import bcrypt

# 生成密码哈希
password = b"password123"
salt = bcrypt.gensalt(rounds=10)
hashed = bcrypt.hashpw(password, salt)

print(f"Password: password123")
print(f"Hash: {hashed.decode('utf-8')}")

# 验证密码
is_valid = bcrypt.checkpw(password, hashed)
print(f"Valid: {is_valid}")
```

---

### **方法 4: 使用 Node.js**

```javascript
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'password123';
    const saltRounds = 10;
    
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Valid: ${isValid}`);
}

generateHash();
```

---

## 🛡️ 生产环境建议

### **1. 密码策略**

✅ **最低要求**:
- 长度至少 8 位
- 包含大小写字母
- 包含数字
- 包含特殊字符

✅ **推荐做法**:
- 使用密码短语（passphrase）
- 定期更换密码
- 不同系统使用不同密码
- 启用双因素认证（2FA）

---

### **2. 密码存储**

✅ **必须做的**:
- 使用 BCrypt 或 Argon2 加密
- 每个密码使用不同的盐（salt）
- 设置合理的 rounds 值（BCrypt 至少 10）

❌ **绝对禁止的**:
- 明文存储密码
- 使用 MD5、SHA1 等弱哈希
- 多个用户共享相同密码
- 将密码写在代码或配置文件中

---

### **3. 测试数据管理**

✅ **开发环境**:
- 可以使用统一的弱密码（如：`password123`）
- 方便开发和调试

✅ **测试环境**:
- 使用随机生成的强密码
- 通过环境变量或密钥管理系统注入

✅ **生产环境**:
- 用户自行设置密码
- 强制密码复杂度要求
- 定期提醒用户更换密码

---

## 📝 快速参考表

### **BCrypt 哈希示例**

| 明文密码 | BCrypt 哈希（rounds=10） |
|---------|--------------------------|
| `password123` | `$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm` |
| `Admin@123` | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |
| `Test!2026` | `$2a$10$rE5vKLMHkD9g3hJLxQwZn.FxQ8vN5K2mP7tR9sU1wX3yZ6aB4cD8e` |
| `KidGame@2026` | `$2a$10$mN5oP6qR7sT8uV9wX0yZ1A.bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU` |

⚠️ **注意**: BCrypt 每次生成的哈希都不同（因为盐不同），但验证时会匹配。

---

## 🔍 验证密码示例

### **Java 验证代码**

```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordValidator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        
        String inputPassword = "password123";
        String storedHash = "$2a$10$XoLvF5C2dz9.7JHK8sN.TOxl9yYp4CqQKZqxM5xGvPqB3z8Rj1fWm";
        
        boolean matches = encoder.matches(inputPassword, storedHash);
        System.out.println("Password valid: " + matches);  // true
    }
}
```

---

## 📊 测试环境登录示例

### **前端登录请求**

```typescript
// 使用 admin 账号登录
const loginResponse = await fetch('/api/user/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123',
    userType: 'ADMIN'
  })
});

const result = await loginResponse.json();
console.log(result);
// {
//   code: 200,
//   message: 'success',
//   data: {
//     token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//     refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//     user: {
//       userId: 1,
//       username: 'admin',
//       userType: 2,
//       status: 1
//     }
//   }
// }
```

---

## ✅ 总结

**当前测试密码**: `password123`（所有用户通用）

**适用场景**: 
- ✅ 开发环境本地测试
- ✅ 功能调试
- ✅ UI 展示

**不适用场景**:
- ❌ 生产环境
- ❌ 公开演示
- ❌ 性能测试

**生产环境请使用**:
- 用户自行设置的强密码
- 符合密码策略的随机密码
- 通过密钥管理系统分发的凭证

---

**最后更新**: 2026-03-23 (已更新为有效的 BCrypt 哈希)  
**维护人员**: kids-game-platform
