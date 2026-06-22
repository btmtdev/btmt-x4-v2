# ============================================================
# Run this DIRECTLY on server 10.30.92.66 (RDP/console, NOT via WinRM)
# Run as Administrator in PowerShell
# ============================================================

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$runnerDir = "D:\actions-runner"

# Create dir
if (!(Test-Path $runnerDir)) { New-Item -ItemType Directory -Path $runnerDir -Force }
Set-Location $runnerDir

# Download runner (skip if already extracted)
if (!(Test-Path ".\config.cmd")) {
    Invoke-WebRequest -Uri "https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-win-x64-2.322.0.zip" -OutFile "runner.zip" -UseBasicParsing
    Expand-Archive -Path "runner.zip" -DestinationPath $runnerDir -Force
    Remove-Item "runner.zip"
}

# Configure runner (token expires in 1 hour from 12:42)
.\config.cmd --url https://github.com/btmtdev/btmt-x4-v2 --token CASKJMTTWFZ4VW2YOVOKHRLKHDMYO --name "x4-server" --labels "self-hosted,Windows,X64" --runasservice --windowslogonaccount "NT AUTHORITY\SYSTEM" --unattended

Write-Host "`nDone! Runner service installed. Check with: Get-Service *actions*"
