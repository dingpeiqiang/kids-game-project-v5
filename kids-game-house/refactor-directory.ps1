# ============================================
# 目录结构重构脚本
# 功能：将现有项目迁移到新的统一架构
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Kids Game Project Directory Structure Refactor" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $PSScriptRoot

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create new directory structure
Write-Host "Step 1: Creating new directory structure..." -ForegroundColor Green
$directories = @(
    "tools/gtrs-generator/src",
    "tools/gtrs-generator/templates",
    "tools/audio-converter",
    "tools/image-optimizer",
    "tools/shared-scripts",
    "games",
    "resources/images/backgrounds",
    "resources/images/buttons",
    "resources/images/icons",
    "resources/audio/bgm",
    "resources/audio/sfx",
    "resources/fonts",
    "resources/templates",
    "docs/development-guide",
    "docs/tools-manual",
    "docs/game-designs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Step 2: Migrating tools..." -ForegroundColor Green

# Copy resource generator
if (Test-Path "plane-shooter-vue3/scripts") {
    Copy-Item "plane-shooter-vue3/scripts/*" "tools/gtrs-generator/src/" -Recurse -Force
    Write-Host "  ✓ Moved: plane-shooter-vue3/scripts → tools/gtrs-generator/src/" -ForegroundColor Green
}

# Move audio converter tools
if (Test-Path "convert-audio-to-mp3-simple.ps1") {
    Move-Item "convert-audio-to-mp3-simple.ps1" "tools/audio-converter/" -Force
    Write-Host "  ✓ Moved: convert-audio-to-mp3-simple.ps1 → tools/audio-converter/" -ForegroundColor Green
}

if (Test-Path "update-gtrs-config-simple.ps1") {
    Move-Item "update-gtrs-config-simple.ps1" "tools/audio-converter/" -Force
    Write-Host "  ✓ Moved: update-gtrs-config-simple.ps1 → tools/audio-converter/" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Migrating games..." -ForegroundColor Green

# Move plane-shooter-complete to games/plane-shooter
if (Test-Path "plane-shooter-complete") {
    Move-Item "plane-shooter-complete" "games/plane-shooter" -Force
    Write-Host "  ✓ Moved: plane-shooter-complete → games/plane-shooter" -ForegroundColor Green
}

# Move snake-vue3 to games/snake
if (Test-Path "snake-vue3") {
    Move-Item "snake-vue3" "games/snake" -Force
    Write-Host "  ✓ Moved: snake-vue3 → games/snake" -ForegroundColor Green
}

# Move tank-battle-vue3 to games/tank-battle
if (Test-Path "tank-battle-vue3") {
    Move-Item "tank-battle-vue3" "games/tank-battle" -Force
    Write-Host "  ✓ Moved: tank-battle-vue3 → games/tank-battle" -ForegroundColor Green
}

# Move plants-vs-zombie to games/plants-vs-zombie
if (Test-Path "plants-vs-zombie") {
    Move-Item "plants-vs-zombie" "games/plants-vs-zombie" -Force
    Write-Host "  ✓ Moved: plants-vs-zombie → games/plants-vs-zombie" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Organizing documentation..." -ForegroundColor Green

# Move documentation
$docFiles = Get-ChildItem -Filter "*.md"
foreach ($doc in $docFiles) {
    $destDir = "docs/game-designs"
    
    if ($doc.Name -like "AUDIO_*") {
        $destDir = "docs/tools-manual"
    } elseif ($doc.Name -like "*DEVELOPMENT*" -or $doc.Name -like "*QUICK_START*") {
        $destDir = "docs/development-guide"
    }
    
    Move-Item $doc.FullName "$destDir/$($doc.Name)" -Force
    Write-Host "  ✓ Moved: $($doc.Name) → $destDir/" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Creating shared resources..." -ForegroundColor Green

# Copy common resources (example: copy from plane-shooter)
if (Test-Path "games/plane-shooter/public/themes/default/assets") {
    $source = "games/plane-shooter/public/themes/default/assets"
    
    # Copy images
    if (Test-Path "$source/scene") {
        Copy-Item "$source/scene/*" "resources/images/backgrounds/" -Recurse -Force
        Copy-Item "$source/sprite/*" "resources/images/icons/" -Recurse -Force
        Write-Host "  ✓ Copied images to resources/images/" -ForegroundColor Green
    }
    
    # Copy audio
    if (Test-Path "$source/audio") {
        Copy-Item "$source/audio/*" "resources/audio/" -Recurse -Force
        Write-Host "  ✓ Copied audio to resources/audio/" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 6: Creating README files..." -ForegroundColor Green

# Create tools README
$toolsReadme = @"
# Kids Game Tools

This directory contains all shared tools for game development.

## Subdirectories

- **gtrs-generator/**: GTRS resource generator
- **audio-converter/**: Audio format conversion tools
- **image-optimizer/**: Image optimization utilities
- **shared-scripts/**: Common PowerShell/Batch scripts

## Usage

See individual README files in each subdirectory for usage instructions.
"@

Set-Content "tools/README.md" $toolsReadme -Encoding UTF8
Write-Host "  ✓ Created: tools/README.md" -ForegroundColor Green

# Create games README
$gamesReadme = @"
# Kids Games

This directory contains all game projects.

## Games

- **plane-shooter/**: Vertical scrolling shooter game
- **snake/**: Classic snake game
- **tank-battle/**: Tank battle game
- **plants-vs-zombie/**: Tower defense game

## Quick Start

Each game is a standalone Vue3 + Phaser project. See individual README for setup instructions.
"@

Set-Content "games/README.md" $gamesReadme -Encoding UTF8
Write-Host "  ✓ Created: games/README.md" -ForegroundColor Green

# Create resources README
$resourcesReadme = @"
# Kids Game Resources

Shared resources library for all games.

## Categories

- **images/**: Common image assets
- **audio/**: Common audio files
- **fonts/**: Font files
- **templates/**: Game configuration templates
"@

Set-Content "resources/README.md" $resourcesReadme -Encoding UTF8
Write-Host "  ✓ Created: resources/README.md" -ForegroundColor Green

# Create docs README
$docsReadme = @"
# Kids Game Documentation

Centralized documentation for the entire project.

## Sections

- **development-guide/**: Development guides and tutorials
- **tools-manual/**: Tool usage manuals
- **game-designs/**: Individual game design documents
"@

Set-Content "docs/README.md" $docsReadme -Encoding UTF8
Write-Host "  ✓ Created: docs/README.md" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Display new structure
Write-Host "New Directory Structure:" -ForegroundColor Yellow
Write-Host ""
Write-Host "kids-game-house/" -ForegroundColor White
Write-Host "├── tools/           [All shared tools]" -ForegroundColor Cyan
Write-Host "│   ├── gtrs-generator/" -ForegroundColor Gray
Write-Host "│   ├── audio-converter/" -ForegroundColor Gray
Write-Host "│   └── ..." -ForegroundColor Gray
Write-Host "├── games/           [All game projects]" -ForegroundColor Cyan
Write-Host "│   ├── plane-shooter/" -ForegroundColor Gray
Write-Host "│   ├── snake/" -ForegroundColor Gray
Write-Host "│   └── ..." -ForegroundColor Gray
Write-Host "├── resources/       [Shared resources]" -ForegroundColor Cyan
Write-Host "├── docs/            [Documentation]" -ForegroundColor Cyan
Write-Host "└── shared/          [Shared code]" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review the new structure" -ForegroundColor White
Write-Host "  2. Update import paths in game projects" -ForegroundColor White
Write-Host "  3. Test each game individually" -ForegroundColor White
Write-Host "  4. Update build scripts" -ForegroundColor White
Write-Host ""

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ Refactoring Successful!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
