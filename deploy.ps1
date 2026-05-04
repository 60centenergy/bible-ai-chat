# Bible AI Chat - Automated Deployment Script
# This script helps push to GitHub and manage deployment

param(
    [string]$Action = "help",
    [string]$GitHubRepo = ""
)

# Add tools to PATH
$env:Path = "C:\Program Files\Git\cmd;C:\Program Files\nodejs;" + $env:Path

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Show-Help {
    Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║         Bible AI Chat - Deployment Helper Script              ║
╚════════════════════════════════════════════════════════════════╝

Usage: .\deploy.ps1 -Action <action> [-GitHubRepo <url>]

Actions:
  push              Push code to GitHub
  status            Show git status
  rebuild           Rebuild frontend
  help              Show this help message

Examples:
  .\deploy.ps1 -Action push -GitHubRepo https://github.com/60centenergy/bible-ai-chat.git
  .\deploy.ps1 -Action rebuild
  .\deploy.ps1 -Action status

"@
}

function Push-ToGitHub {
    param([string]$RepoUrl)
    
    if ([string]::IsNullOrEmpty($RepoUrl)) {
        Write-Host "[FAIL] Error: GitHub repo URL required" -ForegroundColor Red
        Write-Host "Usage: .\deploy.ps1 -Action push -GitHubRepo <url>" -ForegroundColor Yellow
        return $false
    }

    Write-Host "[INFO] Pushing to GitHub..." -ForegroundColor Cyan
    
    Push-Location $projectRoot
    try {
        # Check if remote exists
        $remote = git remote -v | Select-String "origin"
        if ($remote) {
            Write-Host "Remote already exists, updating..." -ForegroundColor Yellow
            git remote set-url origin $RepoUrl
        } else {
            Write-Host "Adding new remote..." -ForegroundColor Yellow
            git remote add origin $RepoUrl
        }
        
        # Rename branch to main if needed
        $currentBranch = git rev-parse --abbrev-ref HEAD
        if ($currentBranch -eq "master") {
            Write-Host "Renaming branch: master to main" -ForegroundColor Yellow
            git branch -M main
        }
        
        # Push
        Write-Host "Pushing to origin..." -ForegroundColor Yellow
        git push -u origin main
        
        Write-Host "[OK] Successfully pushed to GitHub" -ForegroundColor Green
        Write-Host ("Repository: {0}" -f $RepoUrl) -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host ("[FAIL] Error during push: {0}" -f $_) -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

function Show-Status {
    Write-Host "[INFO] Git Status:" -ForegroundColor Cyan
    Push-Location $projectRoot
    try {
        git status
        Write-Host ""
        Write-Host "[INFO] Build Status:" -ForegroundColor Cyan
        if (Test-Path "frontend/dist") {
            Write-Host "[OK] Frontend built successfully" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Frontend not built yet" -ForegroundColor Yellow
        }
    }
    finally {
        Pop-Location
    }
}

function Rebuild-Frontend {
    Write-Host "Rebuilding frontend..." -ForegroundColor Cyan
    Push-Location "$projectRoot/frontend"
    try {
        Write-Host "Running: npm install and npm run build" -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -eq 0) {
            npm run build
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Frontend rebuilt successfully" -ForegroundColor Green
                return $true
            }
        }
        Write-Host "[FAIL] Build failed" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Main execution
switch ($Action.ToLower()) {
    "push" { Push-ToGitHub $GitHubRepo }
    "status" { Show-Status }
    "rebuild" { Rebuild-Frontend }
    "help" { Show-Help }
    default { 
        Write-Host ("Unknown action: {0}" -f $Action) -ForegroundColor Red
        Show-Help 
    }
}
