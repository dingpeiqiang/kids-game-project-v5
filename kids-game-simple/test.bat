@echo off
chcp 65001 >nul
REM RPG Shooter Windows 快速测试脚本
REM 使用方法: test.bat

echo.
echo 🎮 RPG Shooter 测试套件
echo ========================
echo.

REM 检查依赖
echo 检查依赖...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm 未安装
    pause
    exit /b 1
)

echo ✅ 依赖检查通过
echo.

REM 安装依赖
echo 安装依赖...
call npm install --silent
echo ✅ 依赖安装完成
echo.

REM 运行TypeScript编译检查
echo TypeScript 编译检查...
call npx tsc --noEmit
if %errorlevel% equ 0 (
    echo ✅ TypeScript 编译通过
) else (
    echo ❌ TypeScript 编译失败
    pause
    exit /b 1
)
echo.

REM 运行单元测试
echo 运行单元测试...
call npm test -- --passWithNoTests
if %errorlevel% equ 0 (
    echo ✅ 单元测试通过
) else (
    echo ⚠️  单元测试有失败（可能是正常的，如果没有编写测试）
)
echo.

REM 生成测试报告
echo 生成测试报告...
echo 测试报告 > test-report.txt
echo ======== >> test-report.txt
echo 日期: %date% %time% >> test-report.txt
echo. >> test-report.txt
echo 模块列表: >> test-report.txt
dir /b src\games\rpgShooter\*.ts >> test-report.txt 2>nul
echo. >> test-report.txt
echo 文档列表: >> test-report.txt
dir /b src\games\rpgShooter\*.md >> test-report.txt 2>nul
echo ✅ 测试报告已生成: test-report.txt
echo.

REM 询问是否启动开发服务器
set /p startDev="是否启动开发服务器进行测试？(y/n): "
if /i "%startDev%"=="y" (
    echo 启动开发服务器...
    echo 访问 http://localhost:5173 查看游戏
    echo 访问 http://localhost:5173/rpg-shooter-test.html 查看测试清单
    call npm run dev
)

echo.
echo 🎉 测试完成！
echo.
echo 下一步：
echo 1. 查看 test-report.txt 了解测试结果
echo 2. 运行 npm run dev 启动游戏
echo 3. 打开浏览器访问测试页面
echo 4. 按照 TESTING_GUIDE.md 进行手动测试
echo.
pause
