# GTRS 录音格式 WebM 转 MP3 - 自动化安装脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GTRS 录音格式 WebM 转 MP3 转换工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到前端目录
Write-Host "[1/4] 切换到前端目录..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\kids-game-frontend"
Write-Host "✓ 当前目录：$(Get-Location)" -ForegroundColor Green
Write-Host ""

# 安装 lamejs 依赖
Write-Host "[2/4] 安装 lamejs MP3 编码库..." -ForegroundColor Yellow
Write-Host "正在执行：npm install lamejs --save" -ForegroundColor Gray
npm install lamejs --save

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ lamejs 安装成功" -ForegroundColor Green
} else {
    Write-Host "✗ lamejs 安装失败，请检查网络连接" -ForegroundColor Red
    Write-Host "可以手动执行：npm install lamejs --save" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 验证 tsconfig.json 配置
Write-Host "[3/4] 检查 TypeScript 配置..." -ForegroundColor Yellow
$tsConfigPath = "$PSScriptRoot\kids-game-frontend\tsconfig.json"

if (Test-Path $tsConfigPath) {
    $tsConfig = Get-Content $tsConfigPath -Raw | ConvertFrom-Json
    
    # 检查是否包含 types 配置
    if ($tsConfig.compilerOptions.types) {
        Write-Host "✓ TypeScript 配置已包含 types 字段" -ForegroundColor Green
    } else {
        Write-Host "⚠ TypeScript 配置未包含 types 字段，建议添加类型引用" -ForegroundColor Yellow
        Write-Host "提示：可以在 tsconfig.json 中添加：" -ForegroundColor Gray
        Write-Host '  "compilerOptions": {' -ForegroundColor Gray
        Write-Host '    "types": ["./src/types"]' -ForegroundColor Gray
        Write-Host '  }' -ForegroundColor Gray
    }
} else {
    Write-Host "✗ 未找到 tsconfig.json 文件" -ForegroundColor Red
}
Write-Host ""

# 显示下一步操作说明
Write-Host "[4/4] 修改 AudioResourcePanel.vue" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "安装完成！接下来需要修改代码" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请按照以下步骤修改代码：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 打开文件：" -ForegroundColor White
Write-Host "   kids-game-frontend/src/modules/creator-center/panels/AudioResourcePanel.vue" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 在 <script setup lang="ts"> 部分添加导入：" -ForegroundColor White
Write-Host @"
   // 在现有的 import 语句后添加
   import { convertBlobToMp3, audioBufferToMp3 } from '@/utils/audio-converter'
"@
Write-Host ""
Write-Host "3. 修改 confirmUploadRecording 函数：" -ForegroundColor White
Write-Host "   参考文档：AUDIO_WEBM_TO_MP3_CONVERSION.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. 修改 confirmTrim 函数（如果需要）：" -ForegroundColor White
Write-Host "   将截取后的音频也转换为 MP3 格式" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试验证" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动开发服务器进行测试：" -ForegroundColor White
Write-Host "  cd kids-game-frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "然后访问 GTRS 编辑器，测试录音功能：" -ForegroundColor White
Write-Host "  1. 点击录音按钮" -ForegroundColor Gray
Write-Host "  2. 录制一段音频" -ForegroundColor Gray
Write-Host "  3. 确认上传" -ForegroundColor Gray
Write-Host "  4. 检查格式是否显示为 'mp3'" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "已完成的工作" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ 安装 lamejs MP3 编码库" -ForegroundColor Green
Write-Host "  ✓ 创建音频转换工具 audio-converter.ts" -ForegroundColor Green
Write-Host "  ✓ 创建 TypeScript 类型定义 lamejs.d.ts" -ForegroundColor Green
Write-Host "  ✓ 创建详细文档 AUDIO_WEBM_TO_MP3_CONVERSION.md" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
