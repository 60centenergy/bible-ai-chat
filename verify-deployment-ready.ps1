# Bible AI Chat - Pre-Deployment Verification Script
# Checks that everything is ready to deploy

$env:Path = "C:\Program Files\Git\cmd;C:\Program Files\nodejs;" + $env:Path
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$checks = @()

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Bible AI Chat - Pre-Deployment Verification Report         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check 1: Frontend Build
Write-Host ""
Write-Host "Check 1: Frontend Build" -ForegroundColor Yellow
if (Test-Path "$projectRoot/frontend/dist/index.html") {
    Write-Host "  [OK] Frontend built successfully" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  [FAIL] Frontend not built" -ForegroundColor Red
    $checks += $false
}

# Check 2: .env File
Write-Host "Check 2: Environment Variables" -ForegroundColor Yellow
if (Test-Path "$projectRoot/.env") {
    Write-Host "  [OK] .env file exists" -ForegroundColor Green
    $envContent = Get-Content "$projectRoot/.env"
    if ($envContent -match "GROQ_API_KEY") {
        Write-Host "  [OK] GROQ_API_KEY configured" -ForegroundColor Green
        $checks += $true
    } else {
        Write-Host "  [WARN] GROQ_API_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] .env file missing" -ForegroundColor Red
    $checks += $false
}

# Check 3: .gitignore
Write-Host "Check 3: Git Configuration" -ForegroundColor Yellow
if (Test-Path "$projectRoot/.gitignore") {
    Write-Host "  [OK] .gitignore exists" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  [FAIL] .gitignore missing" -ForegroundColor Red
    $checks += $false
}

# Check 4: Git Repository
Write-Host "Check 4: Git Repository" -ForegroundColor Yellow
Push-Location $projectRoot
$gitStatus = git status 2>&1
if ($gitStatus -notmatch "fatal") {
    Write-Host "  [OK] Git repository initialized" -ForegroundColor Green
    $lastCommit = git log -1 --oneline
    Write-Host "  [INFO] Latest commit recorded" -ForegroundColor Cyan
    $checks += $true
} else {
    Write-Host "  [FAIL] Git repository not initialized" -ForegroundColor Red
    $checks += $false
}
Pop-Location

# Check 5: Backend Package.json
Write-Host "Check 5: Backend Configuration" -ForegroundColor Yellow
if (Test-Path "$projectRoot/backend/package.json") {
    $packageJson = Get-Content "$projectRoot/backend/package.json" | ConvertFrom-Json
    if ($packageJson.scripts.build -and $packageJson.scripts.start) {
        Write-Host "  [OK] Backend has build and start scripts" -ForegroundColor Green
        $checks += $true
    } else {
        Write-Host "  [FAIL] Missing build/start scripts in backend/package.json" -ForegroundColor Red
        $checks += $false
    }
} else {
    Write-Host "  [FAIL] backend/package.json missing" -ForegroundColor Red
    $checks += $false
}

# Check 6: Tools Installed
Write-Host "Check 6: Required Tools" -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
$npmVersion = npm --version 2>&1
$gitVersion = git --version 2>&1

if ($nodeVersion -notmatch "not recognized") {
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  [FAIL] Node.js not found" -ForegroundColor Red
    $checks += $false
}

if ($npmVersion -notmatch "not recognized") {
    Write-Host "  [OK] npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] npm not found" -ForegroundColor Red
}

if ($gitVersion -notmatch "not recognized") {
    Write-Host "  [OK] Git: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Git not found" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
$passCount = ($checks | Where-Object { $_ -eq $true }).Count
$totalCount = $checks.Count
Write-Host "║                          SUMMARY                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($passCount -eq $totalCount) {
    Write-Host "[OK] ALL CHECKS PASSED! Ready for deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Create GitHub repository at https://github.com/new" -ForegroundColor White
    Write-Host "2. Run: .\deploy.ps1 -Action push -GitHubRepo <your-repo-url>" -ForegroundColor White
    Write-Host "3. Follow DEPLOYMENT_GUIDE.md for Render and Cloudflare setup" -ForegroundColor White
} else {
    Write-Host "[WARN] Some checks failed ($passCount/$totalCount passed)" -ForegroundColor Yellow
    Write-Host "Please fix issues before deploying." -ForegroundColor White
}

Write-Host ""
