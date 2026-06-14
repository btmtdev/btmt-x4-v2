# Database Backups

Place SQL Server .bak files here for deployment:

- `BTMT-X4.bak` — Core database (auth, users, tickets, settings)
- `BTMT-X4-SHIPPING.bak` — Shipping database (invoices, sales orders, masters)

## How to create backups

```sql
BACKUP DATABASE [BTMT-X4] TO DISK = 'C:\Apps\BTMT-X4\db-backup\BTMT-X4.bak' WITH INIT
BACKUP DATABASE [BTMT-X4-SHIPPING] TO DISK = 'C:\Apps\BTMT-X4\db-backup\BTMT-X4-SHIPPING.bak' WITH INIT
```

## Note
If .bak files are too large for GitHub, use Git LFS:
```
git lfs track "db-backup/*.bak"
```
