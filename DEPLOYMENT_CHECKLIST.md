# 阿里云部署快速检查清单

## 📋 部署前准备

### 1. 阿里云资源准备
- [ ] ECS 服务器已购买并启动
- [ ] 安全组规则已配置（开放 80、443、22 端口）
- [ ] 域名已购买并完成备案（可选）
- [ ] 腾讯云 COS 账号已创建
- [ ] COS Bucket 已创建

### 2. 本地准备工作
- [ ] 代码已提交到 Git 仓库
- [ ] `.env.production.example` 已准备好
- [ ] 已记录所有必要的配置信息：
  - [ ] MySQL 密码
  - [ ] COS Secret ID 和 Secret Key
  - [ ] JWT Secret
  - [ ] 域名（如果有）

---

## 🖥️ 服务器环境配置

### 1. 系统更新
```bash
ssh root@your-server-ip
sudo apt update && sudo apt upgrade -y  # Ubuntu
# 或
sudo yum update -y  # CentOS
```
- [ ] 系统已更新到最新版本

### 2. Docker 安装
```bash
curl -fsSL https://get.docker.com | bash -s docker
sudo systemctl start docker
sudo systemctl enable docker
docker --version
```
- [ ] Docker 已安装
- [ ] Docker 服务已启动并设置开机自启

### 3. Docker Compose 安装
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```
- [ ] Docker Compose 已安装

### 4. Docker 镜像加速（可选）
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```
- [ ] 镜像加速已配置（可选）

---

## 🚀 应用部署

### 1. 上传代码
```bash
cd /opt
git clone https://your-git-repo/kids-game-project-v5.git
cd kids-game-project-v5
```
- [ ] 代码已上传到服务器

### 2. 配置环境变量
```bash
cp .env.production.example .env.production
vim .env.production
```

**必须修改的配置：**
- [ ] `MYSQL_ROOT_PASSWORD` - 使用强密码
- [ ] `MYSQL_PASSWORD` - 使用强密码
- [ ] `COS_SECRET_ID` - 腾讯云 COS Secret ID
- [ ] `COS_SECRET_KEY` - 腾讯云 COS Secret Key
- [ ] `COS_BUCKET` - COS Bucket 名称
- [ ] `COS_REGION` - COS 区域
- [ ] `JWT_SECRET` - 至少 32 字符的密钥
- [ ] `VITE_API_BASE_URL` - 前端 API 地址

### 3. 构建并启动
```bash
chmod +x deploy.sh
./deploy.sh deploy
```
- [ ] 镜像构建成功
- [ ] 所有容器已启动

### 4. 验证部署
```bash
# 查看容器状态
docker-compose ps

# 测试前端
curl http://localhost

# 测试后端
curl http://localhost:8080/actuator/health

# 查看日志
docker-compose logs -f
```
- [ ] 所有容器运行正常（STATUS: Up）
- [ ] 前端可以访问
- [ ] 后端健康检查通过
- [ ] 数据库连接正常
- [ ] Redis 连接正常

---

## 🔐 安全配置

### 1. 防火墙配置
```bash
# Ubuntu
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# CentOS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```
- [ ] 防火墙已启用
- [ ] 只开放必要端口

### 2. SSH 加固（推荐）
```bash
vim /etc/ssh/sshd_config
# 修改 SSH 端口
# Port 2222
# 禁用 root 登录
# PermitRootLogin no
sudo systemctl restart sshd
```
- [ ] SSH 端口已修改（可选）
- [ ] Root 登录已禁用（可选）

### 3. 数据库安全
- [ ] 数据库端口（3306）未对公网开放
- [ ] Redis 端口（6379）未对公网开放
- [ ] 使用了强密码

---

## 🌐 域名和 SSL（可选但推荐）

### 1. 域名解析
- [ ] 在阿里云 DNS 添加 A 记录
- [ ] 域名指向服务器 IP
- [ ] DNS 解析生效（ping 域名测试）

### 2. SSL 证书申请
- [ ] 阿里云免费 SSL 证书已申请
- [ ] 或 Let's Encrypt 证书已获取

### 3. Nginx HTTPS 配置
- [ ] SSL 证书已上传到服务器
- [ ] Nginx SSL 配置已完成
- [ ] HTTP 自动跳转到 HTTPS
- [ ] 重启服务后 HTTPS 正常工作

---

## 📊 监控和维护

### 1. 日志监控
```bash
# 查看实时日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看最近 100 行
docker-compose logs --tail=100
```
- [ ] 日志可以正常查看
- [ ] 无错误日志

### 2. 数据库备份
```bash
# 手动备份
./deploy.sh backup

# 设置定时备份
crontab -e
# 0 2 * * * cd /opt/kids-game-project-v5 && ./deploy.sh backup
```
- [ ] 数据库备份功能测试成功
- [ ] 定时备份已配置（推荐）

### 3. 资源监控
```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```
- [ ] 资源使用情况正常
- [ ] 磁盘空间充足

---

## ✅ 最终验证

### 功能测试
- [ ] 网站首页可以正常访问
- [ ] 用户可以注册/登录
- [ ] 游戏列表正常显示
- [ ] 游戏可以正常加载和游玩
- [ ] 资源上传功能正常（如果使用 COS）
- [ ] API 接口响应正常

### 性能测试
- [ ] 页面加载速度 < 3 秒
- [ ] API 响应时间 < 500ms
- [ ] 并发访问无明显延迟

### 安全测试
- [ ] HTTPS 正常工作
- [ ] 敏感信息未泄露
- [ ] 数据库无法从外网访问
- [ ] JWT Token 正常工作

---

## 📝 文档和记录

- [ ] 记录服务器 IP 和登录信息
- [ ] 记录所有密码和密钥（妥善保管）
- [ ] 记录域名和 SSL 证书到期时间
- [ ] 备份配置文件到安全位置
- [ ] 更新项目文档

---

## 🎯 后续优化（可选）

- [ ] 配置 CDN 加速静态资源
- [ ] 设置监控告警（Prometheus + Grafana）
- [ ] 配置日志收集（ELK Stack）
- [ ] 启用数据库主从复制
- [ ] 配置负载均衡（多实例部署）
- [ ] 自动化部署（CI/CD）

---

## 🆘 遇到问题？

查看完整文档：`DEPLOYMENT_GUIDE.md`

常见问题排查：
1. 容器启动失败 → `docker-compose logs <service>`
2. 数据库连接失败 → 检查 `.env.production` 配置
3. 前端无法访问 → 检查 Nginx 配置和端口
4. API 请求失败 → 检查后端日志和 CORS 配置

---

**部署完成！🎉**

记得定期：
- 更新系统和依赖
- 备份数据库
- 监控资源使用
- 检查安全日志
