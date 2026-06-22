param([Parameter(Position=0)][ValidateSet('start','stop')][string]$Action = 'start')

$root = Split-Path $PSScriptRoot
$dotnet = "C:\Users\Nattawut-C\AppData\Local\Microsoft\dotnet\dotnet.exe"
if (Get-Command dotnet -ErrorAction SilentlyContinue) { $dotnet = "dotnet" }

switch ($Action) {
    'start' {
        $env:ASPNETCORE_ENVIRONMENT = "Development"
        Start-Process $dotnet -ArgumentList "run --urls http://localhost:4000" -WorkingDirectory "$root\x4-api-core" -WindowStyle Hidden
        Start-Process $dotnet -ArgumentList "run --urls http://localhost:4001" -WorkingDirectory "$root\x4-api-shipping" -WindowStyle Hidden
        Start-Process node -ArgumentList "$root\x4-app\node_modules\vite\bin\vite.js --port 3000" -WorkingDirectory "$root\x4-app" -WindowStyle Hidden
        Write-Host "All services started in background." -ForegroundColor Green
        Write-Host "  x4-api-core     => http://localhost:4000" -ForegroundColor DarkGray
        Write-Host "  x4-api-shipping => http://localhost:4001" -ForegroundColor DarkGray
        Write-Host "  x4-app          => http://localhost:3000" -ForegroundColor DarkGray
    }
    'stop' {
        Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Host "All services stopped." -ForegroundColor Yellow
    }
}
