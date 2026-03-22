# Git 提交指南 - 音频格式转换功能

## 📝 提交信息模板

根据项目的 Git 提交规范，建议使用以下格式：

### 方案 A：分两次提交（推荐）

#### 第一次提交：后端实现
```bash
git add kids-game-backend/

git commit -m "feat(audio): 实现后端 WebM 转 MP3 功能

- 添加 AudioConverterService 服务，支持 WebM/WAV/M4A 转 MP3
- 集成 JavaCV (FFmpeg) 进行专业音频转换
- 在 ResourceUploadServiceImpl 中添加自动转换逻辑
- 扩展支持的音频类型，包含 WebM 格式
- 添加辅助方法处理文件扩展名和 URL 构建
- 完善错误处理和日志记录
- 添加 FFmpeg 安装脚本 install-ffmpeg.ps1

技术细节:
- 使用 libmp3lame 编码器
- 比特率 128kbps，采样率 44.1kHz
- 自动清理临时文件
- 转换失败自动降级

依赖:
- javacv-platform 1.5.9
- 需要安装 FFmpeg

Closes #音频格式转换"
```

#### 第二次提交：文档
```bash
git add *.md

git commit -m "docs(audio): 添加音频转换相关文档

- BACKEND_AUDIO_CONVERSION_GUIDE.md: 完整实现指南
- AUDIO_CONVERSION_COMPLETE.md: 实施完成总结
- QUICK_TEST_GUIDE.md: 快速测试指南
- README_AUDIO_CONVERSION.md: 项目总览文档
- GIT_COMMIT_AUDIO.md: Git 提交指南（本文档）

包含内容:
- 安装说明（Windows/Linux/macOS）
- 配置说明
- 测试步骤
- 故障排除
- 性能基准

Refs: feat(audio) 后端 WebM 转 MP3 功能"
```

---

### 方案 B：一次性提交

```bash
git add .

git commit -m "feat(audio): 实现后端 WebM 转 MP3 功能并添加文档

主要变更:
- 新增 AudioConverterService 服务，支持 WebM/WAV/M4A 转 MP3
- 修改 ResourceUploadServiceImpl 添加自动转换逻辑
- 添加 javacv-platform 依赖
- 创建 FFmpeg 安装脚本 install-ffmpeg.ps1
- 添加完整的实现和测试文档

技术细节:
- 使用 FFmpeg (libmp3lame) 进行专业转换
- 比特率 128kbps，采样率 44.1kHz
- 自动清理临时文件
- 完善的错误处理和日志记录
- 转换失败自动降级

文档:
- BACKEND_AUDIO_CONVERSION_GUIDE.md: 实现指南
- AUDIO_CONVERSION_COMPLETE.md: 完成总结
- QUICK_TEST_GUIDE.md: 测试指南
- README_AUDIO_CONVERSION.md: 总览文档

依赖:
- javacv-platform 1.5.9
- 运行时依赖：FFmpeg

Closes #音频格式转换"
```

---

## 🔍 提交前检查清单

### 代码质量
- [x] 编译无错误
- [x] 无严重警告
- [x] 代码格式化
- [x] 注释完整

### 测试
- [ ] FFmpeg 已安装并验证
- [ ] 本地测试通过
- [ ] 日志输出正常
- [ ] 错误处理有效

### 文档
- [x] 实现文档完整
- [x] 测试指南清晰
- [x] 安装说明详细
- [x] 常见问题解答

### Git 规范
- [x] 提交信息符合规范
- [x] 使用英文前缀（feat/docs/fix）
- [x] 中文描述详细说明
- [x] 引用相关 Issue

---

## 📦 建议的分支策略

### 开发分支
```bash
# 创建新分支
git checkout -b feature/audio-conversion

# 或者
git checkout -b feat/audio-webm-to-mp3
```

### 合并到主分支
```bash
# 切换回主分支
git checkout main

# 合并功能分支
git merge feature/audio-conversion

# 推送远程
git push origin main
```

---

## 🏷️ 标签管理（可选）

如果这是一个重要版本，可以打标签：

```bash
# 创建标签
git tag -a v1.2.0-audio-conversion -m "音频格式转换功能"

# 推送标签
git push origin v1.2.0-audio-conversion
```

---

## 📋 完整的提交流程示例

```powershell
# 1. 查看所有变更
git status

# 2. 查看具体变更
git diff

# 3. 添加后端代码
git add kids-game-backend/pom.xml
git add kids-game-service/src/main/java/com/kidgame/service/AudioConverterService.java
git add kids-game-service/src/main/java/com/kidgame/service/impl/ResourceUploadServiceImpl.java
git add install-ffmpeg.ps1

# 4. 提交后端代码
git commit -m "feat(audio): 实现后端 WebM 转 MP3 功能

- 添加 AudioConverterService 服务
- 修改 ResourceUploadServiceImpl 支持自动转换
- 添加 javacv-platform 依赖
- 创建 FFmpeg 安装脚本

技术细节:
- 使用 FFmpeg (libmp3lame) 进行专业转换
- 比特率 128kbps，采样率 44.1kHz
- 自动清理临时文件
- 完善的错误处理

依赖:
- javacv-platform 1.5.9
- 需要安装 FFmpeg"

# 5. 添加文档
git add *.md

# 6. 提交文档
git commit -m "docs(audio): 添加音频转换相关文档

- BACKEND_AUDIO_CONVERSION_GUIDE.md: 实现指南
- AUDIO_CONVERSION_COMPLETE.md: 完成总结
- QUICK_TEST_GUIDE.md: 测试指南
- README_AUDIO_CONVERSION.md: 总览文档

包含安装、配置、测试、故障排除等完整说明"

# 7. 推送到远程
git push origin feature/audio-conversion

# 8. 创建 Pull Request
# 在 GitHub/GitLab 上创建 PR，等待 Code Review
```

---

## 💡 提交信息最佳实践

### ✅ 好的提交信息
```
feat(audio): 实现后端 WebM 转 MP3 功能

- 添加 AudioConverterService 服务，支持 WebM/WAV/M4A 转 MP3
- 集成 JavaCV (FFmpeg) 进行专业音频转换
- 在 ResourceUploadServiceImpl 中添加自动转换逻辑
- 扩展支持的音频类型，包含 WebM 格式

技术细节:
- 使用 libmp3lame 编码器
- 比特率 128kbps，采样率 44.1kHz

Closes #123
```

### ❌ 不好的提交信息
```
更新代码

修改了一些 bug
添加了新功能
```

---

## 🔄 如果需要修改

### 修改上一次提交
```bash
# 修改提交信息
git commit --amend -m "新的提交信息"

# 添加遗漏的文件
git add 遗漏的文件
git commit --amend --no-edit
```

### 撤销提交
```bash
# 保留更改
git reset --soft HEAD~1

# 丢弃更改
git reset --hard HEAD~1
```

---

## 📊 提交统计

### 预期变更
- **新增文件**：5 个（1 个服务类 + 4 个文档）
- **修改文件**：2 个（pom.xml + ResourceUploadServiceImpl.java）
- **新增代码行数**：~400 行
- **新增文档行数**：~1000 行

### 影响范围
- ✅ 后端服务层
- ✅ 上传功能
- ✅ 音频处理流程
- ⚠️ 前端需相应调整

---

## 🎯 下一步

1. ✅ 按照上述流程提交代码
2. ⏳ 安装 FFmpeg 并测试
3. ⏳ 简化前端代码
4. ⏳ 完整测试验证
5. ⏳ Code Review
6. ⏳ 合并到主分支

---

**文档版本**：1.0  
**最后更新**：2026-03-22  
**适用项目**：kids-game-project-v5
