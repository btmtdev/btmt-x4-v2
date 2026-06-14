# BTMT-X4 Deployment Guide

## Architecture

```
[Browser] → :80 (IIS - React SPA)
         → :4000 (IIS - x4-api-core)    → SQL Server [BTMT-X4]
         → :4001 (IIS - x4-api-shipping) → SQL Server [BTMT-X4-SHIPPING]
         → :4002 (IIS - x4-api-hub)      → SignalR WebSocket
```

## Server Requirements

- AWS EC2 Windows Server 2022
- SQL Server 2019+ (Express or Standard)
- .NET 10 Runtime + ASP.NET Core Hosting Bundle
- IIS with URL Rewrite module
- Node.js 20+ (build only)
- Git

## Repository Structure

```
BTMT-X4/
├── x4-app/              # React frontend (Vite)
├── x4-api-core/         # Auth, Users, Settings API (:4000)
├── x4-api-hub/          # SignalR presence hub (:4002)
├── x4-api-shipping/     # Shipping/Invoice API (:4001)
├── db-backup/           # SQL Server .bak files (gitignored in prod)
│   ├── BTMT-X4.bak
│   └── BTMT-X4-SHIPPING.bak
├── scripts/
│   ├── setup-server.ps1 # One-time server setup
│   ├── deploy.ps1       # Deployment script
│   ├── rundev.ps1       # Local dev runner
│   └── *.sql            # DB migration scripts
└── docs/
```

## First-Time Setup (New Server)

### 1. Connect to EC2 via RDP

### 2. Install SQL Server
- Download and install SQL Server Express/Standard
- Enable SQL auth, set `sa` password
- Create data folder: `C:\SQLData\`

### 3. Run setup script
```powershell
# Clone repo first
git clone https://github.com/YOUR_ORG/BTMT-X4.git C:\Apps\BTMT-X4
cd C:\Apps\BTMT-X4

# Run setup (installs IIS, .NET, Node, creates sites)
powershell -ExecutionPolicy Bypass -File .\scripts\setup-server.ps1
```

### 4. Configure connection strings
Edit each `appsettings.json` in the publish folders:
```
C:\inetpub\x4-api-core\appsettings.json
C:\inetpub\x4-api-shipping\appsettings.json
```
Update `Server=`, `User Id=`, `Password=` to match your SQL Server.

### 5. Place database backups
Copy `.bak` files to `C:\Apps\BTMT-X4\db-backup\`

### 6. Deploy
```powershell
cd C:\Apps\BTMT-X4
.\scripts\deploy.ps1
```

## Subsequent Deployments

```powershell
cd C:\Apps\BTMT-X4
.\scripts\deploy.ps1 -SkipDb
```

This pulls latest code, rebuilds, and restarts IIS — without touching the database.

## Using Kiro CLI on the Server

After RDP into the server:
```powershell
cd C:\Apps\BTMT-X4
kiro chat
```

Then tell Kiro:
> deploy the latest code

Or for DB migrations:
> run the deploy script with database restore

## IIS Site Mapping

| Site Name | Port | App Pool | Physical Path |
|-----------|------|----------|--------------|
| X4-App | 80 | DefaultAppPool | C:\inetpub\x4-app |
| X4-API-Core | 4000 | X4-Core | C:\inetpub\x4-api-core |
| X4-API-Shipping | 4001 | X4-Shipping | C:\inetpub\x4-api-shipping |
| X4-API-Hub | 4002 | X4-Hub | C:\inetpub\x4-api-hub |

## Frontend Environment

The built frontend uses environment variables baked at build time. 
Create `.env.production` in `x4-app/` before building:

```
VITE_API_URL=http://YOUR_SERVER_IP:4000
VITE_SHIPPING_API_URL=http://YOUR_SERVER_IP:4001
VITE_HUB_URL=http://YOUR_SERVER_IP:4002
```

## Database Backup (for GitHub)

To export DB backups for inclusion in the repo:
```sql
BACKUP DATABASE [BTMT-X4] TO DISK = 'C:\Apps\BTMT-X4\db-backup\BTMT-X4.bak' WITH INIT
BACKUP DATABASE [BTMT-X4-SHIPPING] TO DISK = 'C:\Apps\BTMT-X4\db-backup\BTMT-X4-SHIPPING.bak' WITH INIT
```

> Note: Add `db-backup/*.bak` to `.gitignore` if backups are too large. Use Git LFS or S3 for large backups.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Check app pool is started, check Event Viewer |
| API returns 500 | Check `C:\inetpub\x4-api-*\logs\` |
| DB connection failed | Verify SQL Server is running, check connection string |
| WebSocket fails | Ensure IIS WebSockets feature is enabled |
| SPA routes return 404 | Ensure URL Rewrite module installed + web.config present |
