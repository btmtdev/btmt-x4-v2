# BTMT-X4 Deployment Script for Windows Server (IIS + SQL Server)
# Run as Administrator on the target EC2 instance
# Usage: .\deploy.ps1 [-SkipDb] [-Branch main]

param(
    [switch]$SkipDb,
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$ROOT = "C:\Apps\BTMT-X4"
$REPO = "https://github.com/YOUR_ORG/BTMT-X4.git"
$SQL_SERVER = "localhost"
$SQL_USER = "sa"
$SQL_PASS = "Root##000"

Write-Host "=== BTMT-X4 Deployment ===" -ForegroundColor Cyan

# 1. Pull latest code
if (Test-Path $ROOT) {
    Write-Host "[1/7] Pulling latest code..." -ForegroundColor Yellow
    Set-Location $ROOT
    git fetch origin
    git checkout $Branch
    git pull origin $Branch
} else {
    Write-Host "[1/7] Cloning repository..." -ForegroundColor Yellow
    git clone $REPO $ROOT
    Set-Location $ROOT
    git checkout $Branch
}

# 2. Restore DB from backup (if not skipped)
if (-not $SkipDb) {
    Write-Host "[2/7] Restoring databases..." -ForegroundColor Yellow
    $backupDir = "$ROOT\db-backup"
    if (Test-Path "$backupDir\BTMT-X4.bak") {
        sqlcmd -S $SQL_SERVER -U $SQL_USER -P $SQL_PASS -Q "RESTORE DATABASE [BTMT-X4] FROM DISK='$backupDir\BTMT-X4.bak' WITH REPLACE, MOVE 'BTMT-X4' TO 'C:\SQLData\BTMT-X4.mdf', MOVE 'BTMT-X4_log' TO 'C:\SQLData\BTMT-X4_log.ldf'"
    }
    if (Test-Path "$backupDir\BTMT-X4-SHIPPING.bak") {
        sqlcmd -S $SQL_SERVER -U $SQL_USER -P $SQL_PASS -Q "RESTORE DATABASE [BTMT-X4-SHIPPING] FROM DISK='$backupDir\BTMT-X4-SHIPPING.bak' WITH REPLACE, MOVE 'BTMT-X4-SHIPPING' TO 'C:\SQLData\BTMT-X4-SHIPPING.mdf', MOVE 'BTMT-X4-SHIPPING_log' TO 'C:\SQLData\BTMT-X4-SHIPPING_log.ldf'"
    }
    # Run migration scripts
    Get-ChildItem "$ROOT\scripts\*.sql" | Sort-Object Name | ForEach-Object {
        Write-Host "  Running $($_.Name)..."
        sqlcmd -S $SQL_SERVER -U $SQL_USER -P $SQL_PASS -d "BTMT-X4-SHIPPING" -i $_.FullName
    }
} else {
    Write-Host "[2/7] Skipping database restore." -ForegroundColor Gray
}

# 3. Build .NET APIs
Write-Host "[3/7] Publishing .NET APIs..." -ForegroundColor Yellow
dotnet publish "$ROOT\x4-api-core" -c Release -o "C:\Apps\publish\x4-api-core"
dotnet publish "$ROOT\x4-api-hub" -c Release -o "C:\Apps\publish\x4-api-hub"
dotnet publish "$ROOT\x4-api-shipping" -c Release -o "C:\Apps\publish\x4-api-shipping"

# 4. Build frontend
Write-Host "[4/7] Building frontend..." -ForegroundColor Yellow
Set-Location "$ROOT\x4-app"
npm ci
npm run build

# 5. Deploy to IIS
Write-Host "[5/7] Deploying to IIS..." -ForegroundColor Yellow

# Stop existing sites
Get-WebAppPoolState -Name "X4-Core" -ErrorAction SilentlyContinue | Where-Object { $_.Value -eq "Started" } | ForEach-Object { Stop-WebAppPool "X4-Core" }
Get-WebAppPoolState -Name "X4-Hub" -ErrorAction SilentlyContinue | Where-Object { $_.Value -eq "Started" } | ForEach-Object { Stop-WebAppPool "X4-Hub" }
Get-WebAppPoolState -Name "X4-Shipping" -ErrorAction SilentlyContinue | Where-Object { $_.Value -eq "Started" } | ForEach-Object { Stop-WebAppPool "X4-Shipping" }
Start-Sleep -Seconds 2

# Copy published files
Copy-Item "C:\Apps\publish\x4-api-core\*" "C:\inetpub\x4-api-core\" -Recurse -Force
Copy-Item "C:\Apps\publish\x4-api-hub\*" "C:\inetpub\x4-api-hub\" -Recurse -Force
Copy-Item "C:\Apps\publish\x4-api-shipping\*" "C:\inetpub\x4-api-shipping\" -Recurse -Force
Copy-Item "$ROOT\x4-app\dist\*" "C:\inetpub\x4-app\" -Recurse -Force

# 6. Start app pools
Write-Host "[6/7] Starting IIS app pools..." -ForegroundColor Yellow
Start-WebAppPool "X4-Core"
Start-WebAppPool "X4-Hub"
Start-WebAppPool "X4-Shipping"

# 7. Verify
Write-Host "[7/7] Verifying services..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$endpoints = @(
    @{ Name = "Core API"; Url = "http://localhost:4000/api/auth/validate" },
    @{ Name = "Hub"; Url = "http://localhost:4002/health" },
    @{ Name = "Shipping API"; Url = "http://localhost:4001/api/invoices" },
    @{ Name = "Frontend"; Url = "http://localhost:80" }
)
foreach ($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri $ep.Url -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  $($ep.Name): OK ($($r.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  $($ep.Name): FAILED" -ForegroundColor Red
    }
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
