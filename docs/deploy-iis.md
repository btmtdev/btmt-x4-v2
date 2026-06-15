# Deploy Instruction for Kiro AI (IIS Server 43.210.181.81)

## Overview
Deploy x4-api-core and x4-api-shipping to IIS via Web Deploy on Windows Server.

## Prerequisites (one-time)
1. Install .NET 10 Hosting Bundle: https://dotnet.microsoft.com/download/dotnet/10.0
2. Install Web Deploy (MSDeploy): https://www.iis.net/downloads/microsoft/web-deploy
3. Enable IIS with ASP.NET Core Module (ANCM)
4. Create IIS Application Pools (No Managed Code, Integrated pipeline)
5. Create IIS Sites:
   - `x4-api-core` → `C:\inetpub\x4-api-core` (port 4000)
   - `x4-api-shipping` → `C:\inetpub\x4-api-shipping` (port 4200)
6. Set environment variable `ASPNETCORE_ENVIRONMENT=Production` on each site

## Deploy Commands

### x4-api-core
```powershell
cd C:\Workspace\BTMT-X4\x4-api-core
dotnet publish -c Release -o C:\publish\x4-api-core

# Web Deploy to IIS
msdeploy -verb:sync -source:contentPath="C:\publish\x4-api-core" -dest:contentPath="x4-api-core",computerName="localhost" -allowUntrusted
```

### x4-api-shipping
```powershell
cd C:\Workspace\BTMT-X4\x4-api-shipping
dotnet publish -c Release -o C:\publish\x4-api-shipping

msdeploy -verb:sync -source:contentPath="C:\publish\x4-api-shipping" -dest:contentPath="x4-api-shipping",computerName="localhost" -allowUntrusted
```

## Full Deploy Script (run on server)
```powershell
param([string]$Branch = "master")

$root = "C:\Workspace\BTMT-X4"

# Pull latest
cd $root
git fetch origin
git checkout $Branch
git pull origin $Branch

# Publish and deploy x4-api-core
dotnet publish "$root\x4-api-core" -c Release -o "C:\publish\x4-api-core"
Stop-Website -Name "x4-api-core"
msdeploy -verb:sync -source:contentPath="C:\publish\x4-api-core" -dest:contentPath="C:\inetpub\x4-api-core"
Start-Website -Name "x4-api-core"

# Publish and deploy x4-api-shipping
dotnet publish "$root\x4-api-shipping" -c Release -o "C:\publish\x4-api-shipping"
Stop-Website -Name "x4-api-shipping"
msdeploy -verb:sync -source:contentPath="C:\publish\x4-api-shipping" -dest:contentPath="C:\inetpub\x4-api-shipping"
Start-Website -Name "x4-api-shipping"

Write-Host "Deploy complete!" -ForegroundColor Green
```

## Usage with Kiro AI
Tell Kiro on the server:
```
deploy branch feature/app-release-history
```
Or:
```
deploy branch master
```

Kiro should:
1. `git fetch && git checkout <branch> && git pull`
2. `dotnet publish` each API project
3. Stop IIS site → copy files → Start IIS site

## Connection Strings
- Production uses `appsettings.Production.json` with `Server=localhost` (SQL Server is local to this machine)

## IIS Site Config (web.config auto-generated)
Each published API already includes a `web.config` with:
```xml
<aspNetCore processPath="dotnet" arguments=".\x4-api-core.dll" hostingModel="inprocessv2" />
```
