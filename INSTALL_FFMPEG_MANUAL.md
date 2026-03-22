# Windows FFmpeg 安装指南（手动版）

由于 PowerShell 脚本在某些环境有兼容性问题，请按照以下步骤手动安装。

---

## 📥 方法一：自动安装脚本（推荐）

如果脚本能正常运行：

```powershell
cd D:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5
.\install-ffmpeg.ps1
```

**如果遇到错误**，请使用方法二手动安装。

---

## 🔧 方法二：手动安装（100% 成功）

### 步骤 1：下载 FFmpeg

访问官方下载页面：
```
https://www.gyan.dev/ffmpeg/builds/
```

点击：**`ffmpeg-release-essentials.zip`** 下载

或者使用这个直接链接：
```
https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
```

---

### 步骤 2：解压文件

1. 下载完成后，找到下载的 zip 文件
2. 右键 → 解压到当前文件夹
3. 你会得到一个类似 `ffmpeg-6.0-full_build` 的文件夹

---

### 步骤 3：移动到 C 盘

1. 将解压后的文件夹重命名为 `ffmpeg`
2. 剪切（Ctrl+X）这个 `ffmpeg` 文件夹
3. 粘贴（Ctrl+V）到 `C:\ffmpeg`

最终路径应该是：
```
C:\ffmpeg
```

---

### 步骤 4：添加到环境变量 PATH

#### Windows 10/11:

1. **打开系统属性**
   - 按 `Win + R`
   - 输入 `sysdm.cpl`
   - 按 Enter

2. **打开环境变量**
   - 点击"高级"选项卡
   - 点击"环境变量"按钮

3. **编辑 Path 变量**
   - 在"系统变量"部分找到 `Path`
   - 选中 `Path`，点击"编辑"
   - 点击"新建"
   - 输入：`C:\ffmpeg\bin`
   - 点击"确定"保存

4. **保存所有设置**
   - 连续点击"确定"关闭所有窗口

---

### 步骤 5：验证安装

1. **打开新的命令提示符**
   - 按 `Win + R`
   - 输入 `cmd`
   - 按 Enter
   
   **重要**：必须是新开的窗口！

2. **运行验证命令**
   ```
   ffmpeg -version
   ```

3. **检查输出**
   
   如果看到类似以下输出，说明安装成功：
   ```
   ffmpeg version 6.0-full_build-www.gyan.dev Copyright (c) 2000-2023 the FFmpeg developers
   built with gcc 12.2.0 Rev10, Built by MSYS2 project
   ...
   ```

---

## ✅ 快速验证

打开命令提示符（CMD），依次执行：

```cmd
REM 检查 FFmpeg 是否在 PATH 中
where ffmpeg

REM 查看版本
ffmpeg -version
```

**预期结果**：
- `where ffmpeg` 应该返回 `C:\ffmpeg\bin\ffmpeg.exe`
- `ffmpeg -version` 应该显示版本信息

---

## 🐛 常见问题

### Q1: "ffmpeg 不是内部或外部命令"

**原因**：PATH 未生效或未正确添加

**解决**：
1. 确保已按照步骤 4 添加到 PATH
2. **必须重新打开**命令提示符窗口
3. 或者直接重启电脑

---

### Q2: 找不到 `C:\ffmpeg\bin\ffmpeg.exe`

**检查**：
1. 确认文件夹路径是 `C:\ffmpeg`（不是 `C:\Program Files\ffmpeg`）
2. 确认 `C:\ffmpeg\bin\ffmpeg.exe` 文件存在

**修复**：
```cmd
dir C:\ffmpeg\bin\ffmpeg.exe
```

如果文件不存在，重新执行步骤 3。

---

### Q3: 权限问题

如果提示权限不足，以**管理员身份**运行命令提示符：

1. 按 `Win` 键，输入 `cmd`
2. 右键点击"命令提示符"
3. 选择"以管理员身份运行"

---

## 📝 验证清单

安装完成后，请确认：

- [ ] FFmpeg 已下载到 `C:\ffmpeg`
- [ ] `C:\ffmpeg\bin\ffmpeg.exe` 文件存在
- [ ] `C:\ffmpeg\bin` 已添加到系统 PATH
- [ ] 在新 CMD 窗口运行 `ffmpeg -version` 能看到版本信息
- [ ] 在新 CMD 窗口运行 `where ffmpeg` 返回 `C:\ffmpeg\bin\ffmpeg.exe`

---

## 🎯 下一步

FFmpeg 安装完成后，继续测试音频转换功能：

1. 启动后端服务
2. 访问 GTRS 编辑器
3. 录制一段音频
4. 观察后端日志是否显示转换成功

---

## 📞 需要帮助？

如果遇到问题，请提供以下信息：

1. Windows 版本
2. 执行的步骤
3. 完整的错误信息
4. `ffmpeg -version` 的输出

---

**最后更新**：2026-03-22  
**适用系统**：Windows 10/11
