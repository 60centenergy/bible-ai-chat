# Create Task Scheduler entry for Bible AI Chat auto-startup on reboot
$taskName = "BibleAIChat-Autostart"
$scriptPath = "c:\Users\Zack\SynologyDrive\Online Bible AI site\bible-ai-chat\start-servers-hidden.ps1"

# Create the action (run hidden PowerShell script)
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Create the trigger (at system startup, delay 30 seconds to allow system stabilization)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Create the settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

# Register the task
$principal = New-ScheduledTaskPrincipal -UserID "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

Write-Host "Task scheduled successfully!"
Write-Host "Task Name: $taskName"
Write-Host "Your servers will auto-start hidden on system reboot."
