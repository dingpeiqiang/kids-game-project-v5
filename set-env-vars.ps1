# Kids Game Project Environment Variable Setup Script (PowerShell)
# Usage: Open PowerShell in the project directory and run: .\set-env-vars.ps1

Write-Host "Loading environment variables from .env file..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env first" -ForegroundColor Yellow
    pause
    exit 1
}

# Read .env file and set environment variables
$envFile = Get-Content ".env" -Encoding UTF8
foreach ($line in $envFile) {
    # Skip comments and empty lines
    if ($line -match "^#" -or [string]::IsNullOrWhiteSpace($line)) {
        continue
    }
    
    # Parse key=value pairs
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Set environment variable for current session
        Set-Item -Path "env:$key" -Value $value
    }
}

Write-Host "Environment variables loaded successfully!" -ForegroundColor Green
Write-Host "You can now start your application." -ForegroundColor Cyan
