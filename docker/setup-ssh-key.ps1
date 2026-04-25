# ========================================
# Windows SSH Key Setup Script
# ========================================
# Purpose: Configure SSH key authentication for remote server
# Usage: .\setup-ssh-key.ps1
# ========================================

$ErrorActionPreference = "Stop"

$SERVER_IP = "8.136.156.190"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Ding@12435"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SSH Key Authentication Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if SSH key exists
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\id_ed25519.pub"
if (-not (Test-Path $SSH_KEY_PATH)) {
    Write-Host "[1/3] Generating SSH key pair..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "kids-game-deploy" -f "$env:USERPROFILE\.ssh\id_ed25519" -N ""
    Write-Host "  [OK] SSH key generated" -ForegroundColor Green
} else {
    Write-Host "[1/3] SSH key already exists" -ForegroundColor Green
}

# 2. Read public key
Write-Host ""
Write-Host "[2/3] Reading public key..." -ForegroundColor Yellow
$PUBLIC_KEY = Get-Content $SSH_KEY_PATH
Write-Host "  Public key: $($PUBLIC_KEY.Substring(0, 50))..." -ForegroundColor Gray

# 3. Upload public key to server
Write-Host ""
Write-Host "[3/3] Uploading public key to ${SERVER_IP}..." -ForegroundColor Yellow

# Method 1: Using ssh with password (requires sshpass or manual input)
Write-Host "  Attempting to upload via SSH..." -ForegroundColor Gray

try {
    # Try to create .ssh directory and add key
    $sshCommand = @"
mkdir -p ~/.ssh && 
chmod 700 ~/.ssh && 
echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && 
chmod 600 ~/.ssh/authorized_keys && 
echo 'SUCCESS'
"@
    
    # This will prompt for password
    Write-Host "  Please enter server password when prompted:" -ForegroundColor Yellow
    ssh ${SERVER_USER}@${SERVER_IP} $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] SSH key uploaded successfully" -ForegroundColor Green
    } else {
        throw "SSH command failed"
    }
} catch {
    Write-Host "  [WARN] Automatic upload failed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual setup required:" -ForegroundColor Cyan
    Write-Host "  1. Copy this public key:" -ForegroundColor White
    Write-Host "     $PUBLIC_KEY" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. SSH to server: ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
    Write-Host "  3. Run these commands on server:" -ForegroundColor White
    Write-Host "     mkdir -p ~/.ssh" -ForegroundColor Gray
    Write-Host "     chmod 700 ~/.ssh" -ForegroundColor Gray
    Write-Host "     echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "     chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
    exit 1
}

# 4. Test SSH connection
Write-Host ""
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
$testResult = ssh -o BatchMode=yes -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo CONNECTION_OK" 2>&1

if ($testResult -match "CONNECTION_OK") {
    Write-Host "  [OK] SSH key authentication working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now use build-images.ps1 without password prompts" -ForegroundColor Cyan
} else {
    Write-Host "  [ERROR] SSH key authentication not working" -ForegroundColor Red
    Write-Host "  Please check the manual setup steps above" -ForegroundColor Yellow
}
