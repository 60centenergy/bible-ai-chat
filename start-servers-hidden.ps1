# Start frontend in hidden window
$process1 = New-Object System.Diagnostics.ProcessStartInfo
$process1.FileName = "c:\Users\Zack\SynologyDrive\Online Bible AI site\bible-ai-chat\start-frontend.bat"
$process1.UseShellExecute = $true
$process1.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
[System.Diagnostics.Process]::Start($process1) | Out-Null

# Wait a moment before starting backend
Start-Sleep -Seconds 2

# Start backend in hidden window
$process2 = New-Object System.Diagnostics.ProcessStartInfo
$process2.FileName = "c:\Users\Zack\SynologyDrive\Online Bible AI site\bible-ai-chat\start-backend.bat"
$process2.UseShellExecute = $true
$process2.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
[System.Diagnostics.Process]::Start($process2) | Out-Null

Write-Host "Servers started successfully in hidden mode!"
