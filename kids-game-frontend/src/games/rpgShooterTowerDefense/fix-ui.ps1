# 修改 rpgShooterTowerDefense 的开始和结束界面
$filePath = "d:\工作\sitech\项目\研发\git_workspace\AI-GAME\kids-game-project-v5-master\kids-game-simple\src\games\rpgShooterTowerDefense\init.ts"

# 读取文件内容（使用 UTF-8 编码）
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# 替换开始界面
$oldStartScreen = @'
    // 开始/结束界面
    if (!state.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(' RPG塔防射击', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
      
      ctx.font = '16px sans-serif'
      ctx.fillText('建造炮台防御敌人，同时控制角色射击！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      
      ctx.fillStyle = '#00E676'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText('点击屏幕开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
'@

$newStartScreen = @'
    // 开始界面（与 dragonShooter 统一模板风格）
    if (!state.gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 65, CANVAS_WIDTH, 130)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(' RPG塔防射击', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('建造炮台防御敌人，控制角色自动射击！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8)
      ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 15px sans-serif'
      ctx.fillText(' 自动射击！只需移动角色！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px sans-serif'
      ctx.fillText('点击屏幕开始 · 连击越多越爽！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    }
'@

$content = $content -replace [regex]::Escape($oldStartScreen), $newStartScreen

# 替换结束界面
$oldEndScreen = @'
    if (state.gameEnded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
      
      ctx.font = '18px sans-serif'
      ctx.fillText(`到达波次: ${state.wave}/8`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.fillText(`最终得分: ${state.resources.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
'@

$newEndScreen = @'
    // 游戏结束界面（与 dragonShooter 统一模板风格）
    if (state.gameEnded) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 80, CANVAS_WIDTH, 160)
      
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 10
      ctx.fillText(' 游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
      ctx.shadowBlur = 0
      
      ctx.fillStyle = '#fff'
      ctx.font = '18px sans-serif'
      ctx.fillText(`最终得分 ${state.resources.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5)
      ctx.fillText(`到达波次: ${state.wave}/8`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
      ctx.fillText(`最高连击 ${state.combo.maxCombo}x`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45)
      
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '14px sans-serif'
      ctx.fillText('点击重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70)
    }
'@

$content = $content -replace [regex]::Escape($oldEndScreen), $newEndScreen

# 写回文件（使用 UTF-8 编码）
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)

Write-Host "✅ 文件已成功修改！"
