@echo off
chcp 65001 >nul
echo ========================================
echo   清理未实现的占位游戏
echo ========================================
echo.

echo 🗑️  将删除以下未实现的占位游戏：
echo    1. 数字拼图 (NUMBER_PUZZLE)
echo    2. 图形匹配 (SHAPE_MATCH)
echo    3. 数学闯关 (MATH_CHALLENGE)
echo    4. 打地鼠 (WHACK_A_MOLE)
echo    5. 英语单词卡片 (ENGLISH_CARDS)
echo    6. 探险岛屿 (ADVENTURE_ISLAND)
echo.
echo ✅ 保留实际可运行的游戏：
echo    1. 超级染色体 (CHROMOSOME)
echo    2. 飞机大战 (PLANE_SHOOTER)
echo    3. 贪吃蛇大冒险 (SNAKE_VUE3)
echo.
pause

echo.
echo [1/2] 执行清理 SQL...
mysql -u root -p kids_game < cleanup-games.sql
if errorlevel 1 (
    echo ❌ SQL 执行失败！
    pause
    exit /b 1
)
echo ✅ 清理完成
echo.

echo [2/2] 验证剩余游戏...
mysql -u root -p kids_game -e "SELECT game_code, game_name, status FROM t_game ORDER BY sort_order;"
echo.

echo ========================================
echo   ✅ 清理完成！
echo ========================================
echo.
echo 📋 数据库中现在只保留 3 个实际可运行的游戏
echo.
pause
