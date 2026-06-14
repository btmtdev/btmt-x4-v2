param([Parameter(Position=0)][ValidateSet('start','stop')][string]$Action = 'start')

$root = Split-Path $PSScriptRoot

switch ($Action) {
    'start' {
        Start-Process dotnet -ArgumentList "run" -WorkingDirectory "$root\x4-api-core" -WindowStyle Hidden
        Start-Process dotnet -ArgumentList "run" -WorkingDirectory "$root\x4-api-hub" -WindowStyle Hidden
        Start-Process dotnet -ArgumentList "run" -WorkingDirectory "$root\x4-api-shipping" -WindowStyle Hidden
        Start-Process node -ArgumentList "$root\x4-app\node_modules\vite\bin\vite.js" -WorkingDirectory "$root\x4-app" -WindowStyle Hidden
        Write-Host "All services started in background." -ForegroundColor Green
    }
    'stop' {
        Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Host "All services stopped." -ForegroundColor Yellow
    }
}
