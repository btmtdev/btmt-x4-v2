param([string]$Branch = "master")

$root = "C:\Workspace\BTMT-X4"
$sites = @(
    @{ Name = "x4-api-core"; Project = "x4-api-core"; Path = "C:\inetpub\x4-api-core" },
    @{ Name = "x4-api-shipping"; Project = "x4-api-shipping"; Path = "C:\inetpub\x4-api-shipping" }
)

# Pull latest
Set-Location $root
git fetch origin
git checkout $Branch
git pull origin $Branch

foreach ($site in $sites) {
    Write-Host "Deploying $($site.Name)..." -ForegroundColor Cyan
    $publishPath = "C:\publish\$($site.Project)"

    dotnet publish "$root\$($site.Project)" -c Release -o $publishPath --nologo

    Stop-Website -Name $site.Name -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    robocopy $publishPath $site.Path /MIR /NFL /NDL /NJH /NJS /nc /ns /np
    Start-Website -Name $site.Name
    Write-Host "$($site.Name) deployed." -ForegroundColor Green
}

Write-Host "`nAll deployments complete!" -ForegroundColor Green
