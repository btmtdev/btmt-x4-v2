# BTMT-X4 IIS First-Time Setup
# Run ONCE as Administrator on a fresh Windows Server EC2 instance
# Prerequisites: Windows Server 2022, SQL Server installed

$ErrorActionPreference = "Stop"

Write-Host "=== BTMT-X4 Server Setup ===" -ForegroundColor Cyan

# 1. Install prerequisites
Write-Host "[1/6] Installing IIS + ASP.NET Core Hosting Bundle..." -ForegroundColor Yellow
Install-WindowsFeature -Name Web-Server, Web-Asp-Net45, Web-WebSockets -IncludeManagementTools

# Download and install .NET 10 Hosting Bundle (update URL as needed)
$dotnetUrl = "https://download.visualstudio.microsoft.com/download/pr/dotnet-hosting-10.0-win.exe"
$installer = "$env:TEMP\dotnet-hosting.exe"
if (-not (Test-Path "C:\Program Files\dotnet\shared\Microsoft.AspNetCore.App\10.*")) {
    Write-Host "  Downloading .NET Hosting Bundle..."
    Invoke-WebRequest -Uri $dotnetUrl -OutFile $installer
    Start-Process $installer -ArgumentList "/quiet /norestart" -Wait
    Remove-Item $installer
}

# Install Node.js (for building frontend)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing Node.js..."
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -ArgumentList "/i $nodeInstaller /quiet /norestart" -Wait
    Remove-Item $nodeInstaller
    $env:Path += ";C:\Program Files\nodejs"
}

# Install Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing Git..."
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $gitInstaller = "$env:TEMP\git.exe"
    Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
    Start-Process $gitInstaller -ArgumentList "/VERYSILENT /NORESTART" -Wait
    Remove-Item $gitInstaller
    $env:Path += ";C:\Program Files\Git\cmd"
}

# 2. Create directories
Write-Host "[2/6] Creating directories..." -ForegroundColor Yellow
@("C:\Apps", "C:\Apps\publish", "C:\SQLData",
  "C:\inetpub\x4-app", "C:\inetpub\x4-api-core", "C:\inetpub\x4-api-hub", "C:\inetpub\x4-api-shipping"
) | ForEach-Object { New-Item -ItemType Directory -Path $_ -Force | Out-Null }

# 3. Create IIS App Pools (No Managed Code)
Write-Host "[3/6] Creating IIS App Pools..." -ForegroundColor Yellow
Import-Module WebAdministration
@("X4-Core", "X4-Hub", "X4-Shipping") | ForEach-Object {
    if (-not (Test-Path "IIS:\AppPools\$_")) {
        New-WebAppPool -Name $_
    }
    Set-ItemProperty "IIS:\AppPools\$_" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$_" -Name startMode -Value "AlwaysRunning"
}

# 4. Create IIS Sites
Write-Host "[4/6] Creating IIS Sites..." -ForegroundColor Yellow

# Frontend (port 80)
if (-not (Get-Website -Name "X4-App" -ErrorAction SilentlyContinue)) {
    # Remove Default Web Site
    Remove-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    New-Website -Name "X4-App" -PhysicalPath "C:\inetpub\x4-app" -Port 80
}

# API Core (port 4000)
if (-not (Get-Website -Name "X4-API-Core" -ErrorAction SilentlyContinue)) {
    New-Website -Name "X4-API-Core" -PhysicalPath "C:\inetpub\x4-api-core" -Port 4000 -ApplicationPool "X4-Core"
}

# API Hub (port 4002)
if (-not (Get-Website -Name "X4-API-Hub" -ErrorAction SilentlyContinue)) {
    New-Website -Name "X4-API-Hub" -PhysicalPath "C:\inetpub\x4-api-hub" -Port 4002 -ApplicationPool "X4-Hub"
}

# API Shipping (port 4001)
if (-not (Get-Website -Name "X4-API-Shipping" -ErrorAction SilentlyContinue)) {
    New-Website -Name "X4-API-Shipping" -PhysicalPath "C:\inetpub\x4-api-shipping" -Port 4001 -ApplicationPool "X4-Shipping"
}

# 5. Configure URL Rewrite for SPA (React Router)
Write-Host "[5/6] Configuring URL Rewrite for SPA..." -ForegroundColor Yellow
$webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
Set-Content -Path "C:\inetpub\x4-app\web.config" -Value $webConfig

# 6. Open firewall ports
Write-Host "[6/6] Configuring firewall..." -ForegroundColor Yellow
@(80, 443, 4000, 4001, 4002) | ForEach-Object {
    $name = "BTMT-X4 Port $_"
    if (-not (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName $name -Direction Inbound -Protocol TCP -LocalPort $_ -Action Allow
    }
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Configure SQL Server connection in appsettings.json" -ForegroundColor White
Write-Host "  2. Place DB backups in C:\Apps\BTMT-X4\db-backup\" -ForegroundColor White
Write-Host "  3. Run: .\scripts\deploy.ps1" -ForegroundColor White
