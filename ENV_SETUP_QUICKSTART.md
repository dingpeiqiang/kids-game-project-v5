# 环境变量配置快速指南 / Quick Environment Setup Guide

## 🚀 快速开始 / Quick Start

### 步骤 1: 复制配置文件 / Copy Configuration File

```bash
copy .env.example .env
```

### 步骤 2: 编辑 .env 文件 / Edit .env File

打开 `.env` 文件，修改以下必需配置：

**数据库配置 / Database:**
```bash
DB_PASSWORD=你的数据库密码
```

**Redis 配置:**
```bash
REDIS_PASSWORD=你的 Redis 密码
```

**JWT 配置:**
```bash
JWT_SECRET=你的 JWT 密钥（至少 32 个字符）
```

**腾讯云 COS 配置:**
```bash
COS_SECRET_ID=你的 COS SecretId
COS_SECRET_KEY=你的 COS SecretKey
```

**SFTP 配置:**
```bash
SFTP_PASSWORD=你的 SFTP 密码
```

### 步骤 3: 运行设置脚本 / Run Setup Script

**Windows CMD:**
```cmd
set-env-vars.bat
```

**PowerShell:**
```powershell
.\set-env-vars.ps1
```

### 步骤 4: 启动应用 / Start Application

现在可以启动你的应用了。

---

## ⚠️ 重要提示 / Important Notes

1. **不要提交 .env 文件到 Git** - 已自动添加到 .gitignore
2. **使用强密码** - 至少 12 位，包含字母、数字、特殊字符
3. **定期更换密码** - 建议每 3-6 个月
4. **团队成员各自创建 .env 文件** - 不要共享真实的 .env 文件

---

## 🔧 故障排查 / Troubleshooting

**Q: PowerShell 脚本报错？**

A: 可能是执行策略限制，使用以下命令：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\set-env-vars.ps1
```

**Q: 应用启动仍然失败？**

A: 检查以下几点：
1. .env 文件是否存在
2. 是否运行了设置脚本
3. 重启 IDE 或命令行窗口

**Q: 如何验证环境变量已设置？**

A: 在命令行中运行：
```cmd
echo %DB_HOST%
```

或在 PowerShell 中：
```powershell
$env:DB_HOST
```

---

## 📋 完整环境变量列表 / Complete Variable List

| 变量名 | 说明 | 必需 |
|--------|------|------|
| DB_HOST | 数据库主机 | 是 |
| DB_PORT | 数据库端口 | 是 |
| DB_NAME | 数据库名称 | 是 |
| DB_USERNAME | 数据库用户名 | 是 |
| DB_PASSWORD | 数据库密码 | 是 |
| REDIS_HOST | Redis 主机 | 是 |
| REDIS_PORT | Redis 端口 | 是 |
| REDIS_PASSWORD | Redis 密码 | 是 |
| JWT_SECRET | JWT 密钥 | 是 |
| COS_SECRET_ID | COS SecretId | 是 |
| COS_SECRET_KEY | COS SecretKey | 是 |
| SFTP_PASSWORD | SFTP 密码 | 是 |

---

## 🔗 相关文档 / Related Documents

- [README_ENV_SETUP.md](README_ENV_SETUP.md) - 详细配置指南
- [.env.example](.env.example) - 配置示例文件
