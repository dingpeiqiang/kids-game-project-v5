@echo off
echo ====================================
echo 🎮 生成 坦克大战 GTRS 资源
echo ====================================

cd scripts
call npm install
node generate-resources.mjs

echo.
echo ====================================
echo ✅ 资源生成完成!
echo ====================================
pause
