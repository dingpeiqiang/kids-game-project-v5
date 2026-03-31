@echo off
echo ===============================================
echo          🎮 游戏项目智能创建向导
echo         kids-game-frame-factory v3.2.0
echo ===============================================
echo.

REM 检查Node.js环境
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装或未添加到PATH
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查当前目录
set "FRAMEWORK_DIR=%~dp0.."
if not exist "%FRAMEWORK_DIR%\templates\game-template\" (
    echo ❌ 未找到游戏模板目录
    echo 请确保在kids-game-frame-factory目录下运行此脚本
    pause
    exit /b 1
)

:MAIN_MENU
cls
echo ===============================================
echo                🎮 主菜单
echo ===============================================
echo 1. 创建新的游戏项目
echo 2. 检查框架完整性
echo 3. 显示开发指南
echo 4. 打开可视化编辑器
echo 5. 生成游戏资源占位符
echo 6. 退出
echo.

set /p CHOICE="请选择操作 (1-6): "

if "%CHOICE%"=="1" goto CREATE_GAME
if "%CHOICE%"=="2" goto CHECK_FRAMEWORK
if "%CHOICE%"=="3" goto SHOW_GUIDE
if "%CHOICE%"=="4" goto OPEN_EDITOR
if "%CHOICE%"=="5" goto GEN_RESOURCES
if "%CHOICE%"=="6" goto EXIT
echo ❌ 无效的选择
echo 请按任意键返回...
pause >nul
goto MAIN_MENU

:CREATE_GAME
cls
echo ===============================================
echo            🎮 创建新游戏
echo ===============================================
echo.
set /p GAME_ID="请输入游戏ID (小写字母+下划线): "
set /p GAME_NAME="请输入游戏名称: "
set /p GAME_DESC="请输入游戏描述 (可选): "

REM 验证游戏ID格式
echo %GAME_ID% | findstr /r "^[a-z][a-z0-9_]*$" >nul
if %errorlevel% neq 0 (
    echo ❌ 游戏ID格式错误
    echo 必须是小写字母开头，只能包含小写字母、数字和下划线
    echo 请按任意键返回...
    pause >nul
    goto CREATE_GAME
)

REM 检查目标目录
if exist "%GAME_ID%" (
    echo ❌ 目录 %GAME_ID% 已存在
    echo 请按任意键返回...
    pause >nul
    goto CREATE_GAME
)

echo.
echo 📋 确认信息:
echo   - 游戏ID: %GAME_ID%
echo   - 游戏名称: %GAME_NAME%
echo   - 游戏描述: %GAME_DESC%
echo   - 目标目录: %GAME_ID%
echo.
set /p CONFIRM="确认创建? (Y/N): "

if /i "%CONFIRM%"=="Y" goto CONFIRM_CREATE
if /i "%CONFIRM%"=="N" goto CREATE_GAME
echo ❌ 无效的确认选项
goto CREATE_GAME

:CONFIRM_CREATE
echo.
echo 🚀 正在创建游戏 "%GAME_NAME%" ...
echo ===============================================
node "%FRAMEWORK_DIR%\scripts\enhance-dev-tools.js" create "%GAME_ID%" "%GAME_NAME%" "%GAME_DESC%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ 游戏项目创建成功!
    echo   - 进入项目: cd %GAME_ID%
    echo   - 安装依赖: npm install
    echo   - 开始开发: npm run dev
    echo.
    echo 📋 已创建文件:
    dir /b "%GAME_ID%"
) else (
    echo ❌ 创建失败
)

echo 请按任意键返回主菜单...
pause >nul
goto MAIN_MENU

:CHECK_FRAMEWORK
cls
echo ===============================================
echo            📊 检查框架完整性
echo ===============================================
echo.
node "%FRAMEWORK_DIR%\scripts\enhance-dev-tools.js" check
echo.
echo 请按任意键返回主菜单...
pause >nul
goto MAIN_MENU

:SHOW_GUIDE
cls
echo ===============================================
echo            📖 开发指南
echo ===============================================
node "%FRAMEWORK_DIR%\scripts\enhance-dev-tools.js" guide
echo.
echo 请按任意键返回主菜单...
pause >nul
goto MAIN_MENU

:OPEN_EDITOR
echo 🎨 正在打开可视化关卡编辑器...
start "" "%FRAMEWORK_DIR%\tools\level-editor-prototype.html"
echo ✅ 编辑器已打开
echo 请按任意键返回主菜单...
pause >nul
goto MAIN_MENU

:GEN_RESOURCES
cls
echo ===============================================
echo            🎨 生成游戏资源占位符
echo ===============================================
echo.
set /p TARGET_DIR="请输入目标项目目录: "

if not exist "%TARGET_DIR%" (
    echo ❌ 目标目录不存在
    echo 请按任意键返回...
    pause >nul
    goto GEN_RESOURCES
)

REM 调用资源生成工具
node "%FRAMEWORK_DIR%\scripts\resource-generator.js" placeholder "%TARGET_DIR%"
echo.
echo 请按任意键返回主菜单...
pause >nul
goto MAIN_MENU

:EXIT
cls
echo ===============================================
echo                🙏 感谢使用
echo           kids-game-frame-factory
echo ===============================================
echo.
echo 🚀 祝你开发顺利!
echo 📧 如有问题，请参考AI_INSTRUCTIONS.md
echo.
pause
exit /b 0