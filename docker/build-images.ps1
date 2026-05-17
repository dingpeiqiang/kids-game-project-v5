# ========================================
# Local Docker Image Build Script (Interactive)
# ========================================
# Purpose: Build images locally, then upload to server
# Advantage: No server resource consumption, fast build
# Usage:
#   .\build-images.ps1          # Interactive mode
#   .\build-images.ps1 -Service backend # Build backend only
#   .\build-images.ps1 -Service frontend # Build frontend only
#   .\build-images.ps1 -Service simple-game # Build simple-game only
#   .\build-images.ps1 -Service all # Build all images
# ========================================

param(
    [ValidateSet("backend", "frontend", "simple-game", "all")]
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"

# Configuration
$COMPOSE_FILE = "docker-compose.lowmem.yml"
$BACKEND_IMAGE = "kids-game-backend:latest"
$FRONTEND_IMAGE = "kids-game-frontend:latest"
$SIMPLE_GAME_IMAGE = "kids-game-simple-game:latest"
$OUTPUT_DIR = "../docker-images"

# Server Configuration (for reference only)
$SERVER_IP = "8.136.156.190"
$SERVER_USER = "root"

# Local Maven Path (optional, for faster builds)
$MAVEN_PATH = "D:\APP\WORK\apache-maven-3.6.3\bin\mvn.cmd"

# Function to display menu and get user selection
function Show-Menu {
    param(
        [string]$Title = "Docker Image Build Menu"
    )
    
    Clear-Host
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please select which service(s) to build:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Backend Only" -ForegroundColor White
    Write-Host "2. Frontend Only" -ForegroundColor White
    Write-Host "3. Simple Game Only" -ForegroundColor White
    Write-Host "4. All Services" -ForegroundColor White
    Write-Host "5. Custom Selection (Multiple)" -ForegroundColor White
    Write-Host "Q. Quit" -ForegroundColor Red
    Write-Host ""
}

# Function to get custom selection
function Get-CustomSelection {
    Write-Host "Select services to build (enter numbers separated by commas):" -ForegroundColor Yellow
    Write-Host "Example: 1,2 for Backend and Frontend" -ForegroundColor Gray
    Write-Host ""
    
    $input = Read-Host "Enter your choice"
    $selections = $input.Split(',') | ForEach-Object { $_.Trim() }
    
    $services = @()
    foreach ($sel in $selections) {
        switch ($sel) {
            "1" { $services += "backend" }
            "2" { $services += "frontend" }
            "3" { $services += "simple-game" }
            default { 
                if ($sel -ne "") {
                    Write-Host "Invalid selection: $sel" -ForegroundColor Red
                }
            }
        }
    }
    
    return $services
}

# Determine service to build
if ([string]::IsNullOrEmpty($Service)) {
    # Interactive mode
    do {
        Show-Menu
        $choice = Read-Host "Enter your choice"
        
        switch ($choice) {
            "1" { $Service = "backend"; break }
            "2" { $Service = "frontend"; break }
            "3" { $Service = "simple-game"; break }
            "4" { $Service = "all"; break }
            "5" { 
                $customServices = Get-CustomSelection
                if ($customServices.Count -eq 0) {
                    Write-Host "No valid services selected." -ForegroundColor Red
                    Start-Sleep -Seconds 2
                    continue
                } elseif ($customServices.Count -eq 3) {
                    $Service = "all"
                } else {
                    # For multiple selections, we'll process them individually
                    $Service = "custom"
                    $SelectedServices = $customServices
                }
                break
            }
            "Q" { 
                Write-Host "Build cancelled." -ForegroundColor Yellow
                exit 0
            }
            default {
                Write-Host "Invalid choice. Please try again." -ForegroundColor Red
                Start-Sleep -Seconds 2
            }
        }
    } while ($Service -eq "")
} else {
    # Command line mode
    Write-Host "Using command line parameter: Service = $Service" -ForegroundColor Green
}

# Handle custom selection
if ($Service -eq "custom") {
    Write-Host "Building selected services: $($SelectedServices -join ', ')" -ForegroundColor Cyan
} else {
    Write-Host "Building service: $Service" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Starting build process..." -ForegroundColor Yellow
Write-Host ""

# Helper function to check if a service should be built
function Should-BuildService {
    param(
        [string]$serviceName
    )
    
    if ($Service -eq "all") {
        return $true
    } elseif ($Service -eq "custom") {
        return $SelectedServices -contains $serviceName
    } else {
        return $Service -eq $serviceName
    }
}

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
Write-Host "[3/6] Building images..." -ForegroundColor Yellow
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray

if (Should-BuildService "backend") {
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

if (Should-BuildService "frontend") {
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

if (Should-BuildService "simple-game") {
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

if (Should-BuildService "backend") {
    Write-Host "  Exporting backend..." -ForegroundColor Gray
    docker save $BACKEND_IMAGE -o $BACKEND_TAR
}

if (Should-BuildService "frontend") {
    Write-Host "  Exporting frontend..." -ForegroundColor Gray
    docker save $FRONTEND_IMAGE -o $FRONTEND_TAR
}

if (Should-BuildService "simple-game") {
    Write-Host "  Exporting simple-game..." -ForegroundColor Gray
    docker save $SIMPLE_GAME_IMAGE -o $SIMPLE_GAME_TAR
}

Write-Host "  [OK] Images exported successfully" -ForegroundColor Green

# 6. Display file sizes
Write-Host ""
Write-Host "[6/6] Image file information..." -ForegroundColor Yellow
$TOTAL_SIZE = 0
if (Should-BuildService "backend") {
    $BACKEND_SIZE = [math]::Round((Get-Item $BACKEND_TAR).Length / 1MB, 2)
    Write-Host "  Backend image:  $BACKEND_SIZE MB" -ForegroundColor Cyan
    $TOTAL_SIZE += $BACKEND_SIZE
}
if (Should-BuildService "frontend") {
    $FRONTEND_SIZE = [math]::Round((Get-Item $FRONTEND_TAR).Length / 1MB, 2)
    Write-Host "  Frontend image: $FRONTEND_SIZE MB" -ForegroundColor Cyan
    $TOTAL_SIZE += $FRONTEND_SIZE
}
if (Should-BuildService "simple-game") {
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
Write-Host "To deploy on server, manually upload images:" -ForegroundColor Yellow
if (Should-BuildService "backend") {
    Write-Host "  scp docker-images/backend.tar root@8.136.156.190:/tmp/" -ForegroundColor Gray
}
if (Should-BuildService "frontend") {
    Write-Host "  scp docker-images/frontend.tar root@8.136.156.190:/tmp/" -ForegroundColor Gray
}
if (Should-BuildService "simple-game") {
    Write-Host "  scp docker-images/simple-game.tar root@8.136.156.190:/tmp/" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Then deploy on server:" -ForegroundColor Yellow
Write-Host "  ssh root@8.136.156.190" -ForegroundColor Gray
Write-Host "  cd ~/workspace/kids-game-project-v5/docker/scripts" -ForegroundColor Gray
Write-Host "  bash deploy-from-images.sh" -ForegroundColor Gray
Write-Host ""
