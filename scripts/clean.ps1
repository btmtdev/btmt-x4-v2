$root = Split-Path $PSScriptRoot
$dirs = @('node_modules', 'bin', 'obj', 'dist', '.nuget')

Get-ChildItem $root -Directory -Recurse -Include $dirs | ForEach-Object {
    Write-Host "Removing $($_.FullName)" -ForegroundColor DarkGray
    Remove-Item $_.FullName -Recurse -Force
}

Write-Host "Clean complete." -ForegroundColor Green
