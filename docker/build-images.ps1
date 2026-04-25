# ========================================
# Local Docker Image Build Script
# ========================================
# Purpose: Build images locally, then upload to server
# Advantage: No server resource consumption, fast build
# Usage:
#   .\build-images.ps1          # Build all images
#   .\build-images.ps1 backend # Build backend only
#   .\build-images.ps1 frontend# Build frontend only
# ========================================

param(
    [ValidateSet("backend", "frontend", "simple-game", "all")]
    [string]$Service = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Local Docker Image Build (Service: $Service)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$COMPOSE_FILE = "docker-compose.lowmem.yml"
$BACKEND_IMAGE = "kids-game-backend:latest"
$FRONTEND_IMAGE = "kids-game-frontend:latest"
$SIMPLE_GAME_IMAGE = "kids-game-simple-game:latest"
$OUTPUT_DIR = "../docker-images"

# Server Configuration
$SERVER_IP = "8.136.156.190"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Ding@12435"

# Local Maven Path (optional, for faster builds)
$MAVEN_PATH = "D:\APP\WORK\apache-maven-3.6.3\bin\mvn.cmd"

# 1. Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
$dockerCheck = docker --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Docker installed: $dockerCheck" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Docker not installed, please install Docker Desktop first" -ForegroundColor Red
    exit 1
}

# 2. Create output directory
Write-Host ""
Write-Host "[2/6] Creating output directory..." -ForegroundColor Yellow
if (Test-Path $OUTPUT_DIR) {
    Remove-Item -Recurse -Force $OUTPUT_DIR
}
New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
Write-Host "  [OK] Directory created: $OUTPUT_DIR" -ForegroundColor Green

# 3. Build images based on service parameter
Write-Host ""
Write-Host "[3/6] Building images (service: $Service)..." -ForegroundColor Yellow
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray

if ($Service -eq "all" -or $Service -eq "backend") {
    Write-Host "  Building backend..." -ForegroundColor Cyan
    
    # 快速模式：先在本地构建 JAR，再打包到 Docker
    Write-Host "    Step 1: Building JAR locally (using local Maven cache)..." -ForegroundColor Gray
    
    # 选择 Maven 命令
    if (Test-Path $MAVEN_PATH) {
        $MVN_CMD = $MAVEN_PATH
        Write-Host "    Using local Maven: $MAVEN_PATH" -ForegroundColor Gray
    } else {
        $MVN_CMD = "mvn"
        Write-Host "    Using system Maven" -ForegroundColor Gray
    }
    
    Push-Location ..\kids-game-backend
    & $MVN_CMD clean package -DskipTests -pl kids-game-web -am -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    [ERROR] Local build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "    [OK] JAR built successfully" -ForegroundColor Green
    
    # 使用快速 Dockerfile（不需要下载依赖）
    Write-Host "    Step 2: Building Docker image..." -ForegroundColor Gray
    docker build `
        -f Dockerfile.backend.fast `
        -t $BACKEND_IMAGE `
        ..

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Backend image build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Backend image built" -ForegroundColor Green
}

if ($Service -eq "all" -or $Service -eq "frontend") {
    Write-Host "  Building frontend..." -ForegroundColor Cyan
    docker build `
        -f Dockerfile.frontend `
        -t $FRONTEND_IMAGE `
        --build-arg BUILDKIT_INLINE_CACHE=1 `
        ..

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Frontend image build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Frontend image built" -ForegroundColor Green
}

if ($Service -eq "all" -or $Service -eq "simple-game") {
    Write-Host "  Building simple-game..." -ForegroundColor Cyan
    docker build `
        -f Dockerfile.simple-game `
        -t $SIMPLE_GAME_IMAGE `
        --build-arg BUILDKIT_INLINE_CACHE=1 `
        ..

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Simple-game image build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Simple-game image built" -ForegroundColor Green
}

# 5. Export images
Write-Host ""
Write-Host "[5/6] Exporting image files..." -ForegroundColor Yellow

$BACKEND_TAR = Join-Path $OUTPUT_DIR "backend.tar"
$FRONTEND_TAR = Join-Path $OUTPUT_DIR "frontend.tar"
$SIMPLE_GAME_TAR = Join-Path $OUTPUT_DIR "simple-game.tar"

if ($Service -eq "all" -or $Service -eq "backend") {
    Write-Host "  Exporting backend..." -ForegroundColor Gray
    docker save $BACKEND_IMAGE -o $BACKEND_TAR
}

if ($Service -eq "all" -or $Service -eq "frontend") {
    Write-Host "  Exporting frontend..." -ForegroundColor Gray
    docker save $FRONTEND_IMAGE -o $FRONTEND_TAR
}

if ($Service -eq "all" -or $Service -eq "simple-game") {
    Write-Host "  Exporting simple-game..." -ForegroundColor Gray
    docker save $SIMPLE_GAME_IMAGE -o $SIMPLE_GAME_TAR
}

Write-Host "  [OK] Images exported successfully" -ForegroundColor Green

# 6. Display file sizes
Write-Host ""
Write-Host "[6/6] Image file information..." -ForegroundColor Yellow
$TOTAL_SIZE = 0
if ($Service -eq "all" -or $Service -eq "backend") {
    $BACKEND_SIZE = [math]::Round((Get-Item $BACKEND_TAR).Length / 1MB, 2)
    Write-Host "  Backend image:  $BACKEND_SIZE MB" -ForegroundColor Cyan
    $TOTAL_SIZE += $BACKEND_SIZE
}
if ($Service -eq "all" -or $Service -eq "frontend") {
    $FRONTEND_SIZE = [math]::Round((Get-Item $FRONTEND_TAR).Length / 1MB, 2)
    Write-Host "  Frontend image: $FRONTEND_SIZE MB" -ForegroundColor Cyan
    $TOTAL_SIZE += $FRONTEND_SIZE
}
if ($Service -eq "all" -or $Service -eq "simple-game") {
    $SIMPLE_GAME_SIZE = [math]::Round((Get-Item $SIMPLE_GAME_TAR).Length / 1MB, 2)
    Write-Host "  Simple-game image: $SIMPLE_GAME_SIZE MB" -ForegroundColor Cyan
    $TOTAL_SIZE += $SIMPLE_GAME_SIZE
}
Write-Host "  Total: $([math]::Round($TOTAL_SIZE, 2)) MB" -ForegroundColor Cyan

# Complete
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Images saved in: docker-images/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual upload to server:" -ForegroundColor Yellow
if ($Service -eq "all" -or $Service -eq "backend") {
    Write-Host "  scp docker-images/backend.tar root@8.136.156.190:/tmp/" -ForegroundColor Gray
}
if ($Service -eq "all" -or $Service -eq "frontend") {
    Write-Host "  scp docker-images/frontend.tar root@8.136.156.190:/tmp/" -ForegroundColor Gray
}
if ($Service -eq "all" -or $Service -eq "simple-game") {
    Write-Host "  scp docker-images/simple-game.tar root@8.136.156.190:/tmp/" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Then deploy on server:" -ForegroundColor Yellow
Write-Host "  ssh root@8.136.156.190" -ForegroundColor Gray
Write-Host "  cd ~/workspace/kids-game-project-v5/docker/scripts" -ForegroundColor Gray
Write-Host "  bash deploy-from-images.sh" -ForegroundColor Gray
Write-Host ""
