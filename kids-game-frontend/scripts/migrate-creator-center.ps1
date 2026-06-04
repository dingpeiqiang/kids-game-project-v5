# 创作者中心模块化重构 - 自动化集成脚本
# Windows PowerShell 版本

param(
    [switch]$BackupOnly,      # 仅备份
    [switch]$UseNewVersion,   # 使用新版本替换
    [switch]$DryRun          # 预演模式，不实际修改文件
)

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FrontendRoot = Join-Path $ProjectRoot "kids-game-frontend"
$CreatorCenterDir = Join-Path $FrontendRoot "src\modules\creator-center"
$ComponentsDir = Join-Path $CreatorCenterDir "components"

Write-Info "========================================"
Write-Info "创作者中心模块化重构 - 自动化集成脚本"
Write-Info "========================================"
Write-Info ""
Write-Info "项目根目录：$ProjectRoot"
Write-Info "前端目录：$FrontendRoot"
Write-Info "创作者中心目录：$CreatorCenterDir"
Write-Info ""

# 检查目录是否存在
if (-not (Test-Path $FrontendRoot)) {
    Write-Error "❌ 前端目录不存在：$FrontendRoot"
    exit 1
}

if (-not (Test-Path $CreatorCenterDir)) {
    Write-Error "❌ 创作者中心目录不存在：$CreatorCenterDir"
    exit 1
}

# Step 1: 备份原文件
Write-Info "📦 Step 1: 备份原有文件..."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "index.vue.backup.$timestamp"
$backupPath = Join-Path $CreatorCenterDir $backupFile

if (Test-Path (Join-Path $CreatorCenterDir "index.vue")) {
    if (-not $DryRun) {
        Copy-Item (Join-Path $CreatorCenterDir "index.vue") $backupPath
        Write-Success "✅ 已备份到：$backupFile"
    } else {
        Write-Info "[预演] 将备份 index.vue 到 $backupFile"
    }
} else {
    Write-Warning "⚠️  index.vue 不存在，跳过备份"
}

# 创建通用备份链接
$latestBackup = Join-Path $CreatorCenterDir "index.vue.backup"
if (Test-Path $backupPath) {
    if (-not $DryRun) {
        Copy-Item $backupPath $latestBackup -Force
        Write-Success "✅ 已创建最新备份：index.vue.backup"
    } else {
        Write-Info "[预演] 将创建最新备份链接"
    }
}

if ($BackupOnly) {
    Write-Success "✅ 备份完成！"
    Write-Info "备份文件位置：$backupPath"
    exit 0
}

# Step 2: 创建组件目录
Write-Info ""
Write-Info "📁 Step 2: 创建组件目录..."
if (-not $DryRun) {
    if (-not (Test-Path $ComponentsDir)) {
        New-Item -ItemType Directory -Path $ComponentsDir | Out-Null
        Write-Success "✅ 已创建目录：components"
    } else {
        Write-Warning "⚠️  components 目录已存在"
    }
} else {
    Write-Info "[预演] 将创建 components 目录"
}

# Step 3: 检查并移动组件文件
Write-Info ""
Write-Info "🔧 Step 3: 检查组件文件..."

$componentFiles = @(
    "OfficialThemesList.vue",
    "MyThemesManagement.vue",
    "ThemeStore.vue",
    "ThemeSwitcher.vue"
)

foreach ($file in $componentFiles) {
    $sourceFile = Join-Path $CreatorCenterDir $file
    $targetFile = Join-Path $ComponentsDir $file
    
    if (Test-Path $sourceFile) {
        if (-not $DryRun) {
            if (-not (Test-Path $targetFile)) {
                Move-Item $sourceFile $targetFile
                Write-Success "✅ 已移动：$file → components/$file"
            } else {
                Write-Warning "⚠️  components/$file 已存在，跳过"
            }
        } else {
            Write-Info "[预演] 将移动 $file → components/$file"
        }
    } else {
        Write-Warning "⚠️  源文件不存在：$file"
    }
}

# Step 4: 处理主组件
Write-Info ""
Write-Info "📄 Step 4: 处理主组件..."

$refactoredFile = Join-Path $CreatorCenterDir "index-refactored.vue"
$mainFile = Join-Path $CreatorCenterDir "index.vue"

if (Test-Path $refactoredFile) {
    if ($UseNewVersion) {
        if (-not $DryRun) {
            # 重命名原文件为 .old
            $oldFile = Join-Path $CreatorCenterDir "index.vue.old"
            Rename-Item $mainFile "index.vue.old" -Force
            
            # 将重构版重命名为 index.vue
            Rename-Item $refactoredFile "index.vue" -Force
            
            Write-Success "✅ 已使用新版本替换原文件"
            Write-Warning "⚠️  原文件已保存为：index.vue.old"
        } else {
            Write-Info "[预演] 将使用 index-refactored.vue 替换 index.vue"
        }
    } else {
        Write-Info "ℹ️  保留原 index.vue，你可以手动集成新组件"
        Write-Info "ℹ️  新版本位于：index-refactored.vue"
    }
} else {
    Write-Warning "⚠️  index-refactored.vue 不存在"
}

# Step 5: 生成迁移报告
Write-Info ""
Write-Info "📊 Step 5: 生成迁移报告..."

$reportFile = Join-Path $ProjectRoot "MIGRATION_REPORT_$timestamp.md"
$reportContent = @"
# 创作者中心模块化重构 - 迁移报告

**执行时间**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**执行模式**: $(if ($DryRun) { "预演模式" } elseif ($BackupOnly) { "仅备份" } elseif ($UseNewVersion) { "完全替换" } else { "标准集成" })

## ✅ 已完成的操作

### 1. 文件备份
- 原文件：index.vue
- 备份位置：$backupFile
- 备份状态：$(if (Test-Path $backupPath) { "✅ 成功" } else { "❌ 失败" })

### 2. 组件目录
- 目录路径：components/
- 创建状态：$(if (Test-Path $ComponentsDir) { "✅ 已创建" } else { "❌ 未创建" })

### 3. 组件文件移动
$(foreach ($file in $componentFiles) {
    $targetFile = Join-Path $ComponentsDir $file
    "- $($file): $(if (Test-Path $targetFile) { '✅ 已移动' } else { '⚠️ 未移动' })"
})

### 4. 主组件处理
- 原文件：index.vue
- 重构版：index-refactored.vue
- 处理方式：$(if ($UseNewVersion) { "✅ 完全替换" } else { "⚠️  保留原版，需手动集成" })

## 📝 后续待办事项

### 立即可做
1. [ ] 检查 TypeScript 编译错误
2. [ ] 启动开发服务器测试
3. [ ] 访问创作者中心页面验证功能

### 短期计划
1. [ ] 补充业务逻辑（API 调用）
2. [ ] 添加错误处理
3. [ ] 优化加载状态显示

### 长期优化
1. [ ] 编写单元测试
2. [ ] 实现异步组件懒加载
3. [ ] 性能优化和监控

## 🔍 验证步骤

### 1. 文件结构检查
``````bash
ls src/modules/creator-center/
# 应该看到：
# - index.vue (或 index.vue.old)
# - components/ (目录)
``````

### 2. 编译检查
``````bash
npm run dev
# 应该没有 TypeScript 错误
``````

### 3. 功能测试
访问：http://localhost:5173/creator-center

测试以下标签页:
- 🏛️ 官方主题
- 🎨 我的主题  
- 🛍️ 主题商店
- 🎯 切换主题

## ⚠️ 注意事项

1. **备份文件位置**: $backupPath
2. **回滚方法**: 
   ```bash
   cp $backupPath src/modules/creator-center/index.vue
   ```

## 📞 获取帮助

如遇问题，请查看:
- MIGRATION_GUIDE.md - 详细迁移指南
- CREATOR_CENTER_QUICKSTART.md - 快速开始指南
- CREATOR_CENTER_FINAL_REPORT.md - 完整总结报告

---
*自动生成于 $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
"@

if (-not $DryRun) {
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Success "✅ 迁移报告已生成：MIGRATION_REPORT_$timestamp.md"
} else {
    Write-Info "[预演] 将生成迁移报告"
}

# 完成
Write-Info ""
Write-Info "========================================"
Write-Success "🎉 迁移完成!"
Write-Info "========================================"
Write-Info ""

if ($DryRun) {
    Write-Warning "⚠️  以上是预演结果，未实际修改任何文件"
    Write-Info "💡 运行以下命令执行实际操作:"
    Write-Info "   .\scripts\migrate-creator-center.ps1"
} else {
    Write-Info "📝 下一步操作:"
    Write-Info "   1. 检查迁移报告：MIGRATION_REPORT_$timestamp.md"
    Write-Info "   2. 启动开发服务器：npm run dev"
    Write-Info "   3. 访问创作者中心进行测试"
    Write-Info ""
    
    if (-not $UseNewVersion) {
        Write-Warning "⚠️  注意：你选择了保留原 index.vue"
        Write-Info "💡 如需使用新版本，运行:"
        Write-Info "   .\scripts\migrate-creator-center.ps1 -UseNewVersion"
    }
}

Write-Info ""
