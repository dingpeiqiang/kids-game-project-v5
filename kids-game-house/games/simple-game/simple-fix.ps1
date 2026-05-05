# 读取文件
$content = Get-Content -Path ".\src\games\rpgShooterTowerDefense\init.ts" -Raw -Encoding UTF8

# 替换开始界面（简化版本，只替换关键部分）
$content = $content -replace "ctx\.fillRect\(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT\)\s+ctx\.fillStyle = '#fff'\s+ctx\.font = 'bold 32px sans-serif'\s+ctx\.textAlign = 'center'\s+ctx\.fillText\(' RPG濉旈槻灏勫'", @"
ctx.fillRect(0, CANVAS_HEIGHT / 2 - 65, CANVAS_WIDTH, 130)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(' RPG旈槻灏勫'
"@

# 写回文件
Set-Content -Path ".\src\games\rpgShooterTowerDefense\init.ts" -Value $content -Encoding UTF8

Write-Host "Done"
