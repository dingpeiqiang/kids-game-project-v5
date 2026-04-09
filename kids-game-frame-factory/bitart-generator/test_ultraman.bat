@echo off
chcp 65001 >nul
echo Testing BitArt with "奥特曼" prompt...
echo.
target\release\bitart.exe -p "奥特曼" -o test_ultraman.png
echo.
echo Test completed. Check if test_ultraman.png was created.
pause
