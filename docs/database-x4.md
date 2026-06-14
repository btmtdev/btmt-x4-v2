# BTMT-X4 Database Documentation

## Overview

| Property | Value |
|----------|-------|
| Server | localhost (SQL Server) |
| Database | BTMT-X4 |
| Recovery Model | SIMPLE |
| FK Strategy | Soft FK only (no enforced constraints) |
| Purpose | Authentication, Authorization & App Settings for x4-app |

## Naming Convention

- No table-name prefix on columns (table context is implicit)
- `key_` for primary key columns that are reserved words
- `is_` prefix for boolean flags
- `_at` suffix for timestamps
- `_key` suffix for soft FK references

## Tables (12)

### user

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **key_** (PK) | varchar(255) | No | — | Unique user identifier |
| password_hash | varchar(255) | Yes | — | Hashed password |
| auth_mode | varchar(50) | Yes | — | local, gateway |
| status | varchar(50) | Yes | — | active, pending, disabled, deleted |
| display_name_th | nvarchar(255) | Yes | — | Display name (Thai) |
| display_name_en | nvarchar(255) | Yes | — | Display name (English) |
| ad_username | varchar(255) | Yes | — | Active Directory username |
| emp_code | varchar(50) | Yes | — | Employee code |
| position | nvarchar(255) | Yes | — | Job position |
| dept_code | nvarchar(255) | Yes | — | Department code |
| dept_name | nvarchar(255) | Yes | — | Department name |
| email | varchar(255) | Yes | — | Email address |
| mobile | varchar(50) | Yes | — | Mobile number |
| company | varchar(50) | Yes | — | Company code |
| last_logged_in | datetime2 | Yes | — | Last successful login |
| password_changed_at | datetime2 | Yes | — | Last password change |
| failed_login_count | int | No | 0 | Consecutive failed logins |
| locked_until | datetime2 | Yes | — | Account locked until |
| created_at | datetime2 | No | sysdatetime() | Record created |
| updated_at | datetime2 | No | sysdatetime() | Record last updated |
| profile_updated_at | datetime2 | Yes | — | Last gateway profile refresh |

### user_session

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** (PK, Identity) | int | No | — | Auto-increment ID |
| user_key | varchar(255) | No | — | → user.key_ |
| ip_address | varchar(255) | Yes | — | Client IP |
| token | varchar(255) | No | — | Session token (UNIQUE) |
| device_id | varchar(255) | Yes | — | Device identifier |
| device_name | nvarchar(255) | Yes | — | Device name |
| device_os | nvarchar(255) | Yes | — | Device OS |
| browser | nvarchar(255) | Yes | — | Browser info |
| created_at | datetime2 | No | getutcdate() | Session start |
| last_active_at | datetime2 | No | getutcdate() | Last activity |
| is_revoked | bit | No | 0 | Revoked flag |
| expired_at | datetime2 | Yes | — | Expiration time |

### user_login_history

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** (PK, Identity) | int | No | — | Auto-increment ID |
| user_key | varchar(255) | No | — | → user.key_ |
| created_at | datetime2 | No | sysdatetime() | Attempt timestamp |
| ip_address | varchar(45) | Yes | — | Client IP |
| device | nvarchar(255) | Yes | — | Device/browser info |
| is_success | bit | No | — | Success or failure |
| failure_reason | varchar(100) | Yes | — | Reason if failed |

### app_role

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **key_** (PK) | varchar(255) | No | — | Role identifier |
| name | nvarchar(255) | No | — | Role display name |
| description | nvarchar(255) | Yes | — | Role description |
| created_at | datetime2 | No | sysdatetime() | Record created |
| updated_at | datetime2 | No | sysdatetime() | Record last updated |
| is_active | bit | No | 1 | Active flag |

### app_permission

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **key_** (PK) | varchar(255) | No | — | Permission identifier |
| name_th | nvarchar(255) | No | — | Name (Thai) |
| name_en | nvarchar(255) | No | — | Name (English) |
| path | varchar(255) | Yes | — | Route/URL path |
| level | int | No | 1 | Menu hierarchy level |
| is_divider | bit | No | 0 | Is divider item |
| layout | varchar(255) | No | 'desktop' | Layout template |
| sorting | int | No | 10 | Display order |
| icon | varchar(255) | Yes | — | Icon identifier |
| is_authorized | bit | Yes | 1 | Requires authorization |
| parent_key | varchar(255) | Yes | — | → app_permission.key_ (self-ref) |
| is_active | bit | Yes | 1 | Active flag |
| created_at | datetime2 | No | sysdatetime() | Record created |
| updated_at | datetime2 | No | sysdatetime() | Record last updated |

### app_role_permission

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **role_key** (PK) | varchar(255) | No | — | → app_role.key_ |
| **perm_key** (PK) | varchar(255) | No | — | → app_permission.key_ |

### user_role

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **user_key** (PK) | varchar(255) | No | — | → user.key_ |
| **role_key** (PK) | varchar(255) | No | — | → app_role.key_ |

### user_permission_override

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** (PK, Identity) | int | No | — | Auto-increment ID |
| user_key | varchar(255) | No | — | → user.key_ |
| type | varchar(50) | No | 'grant' | grant / deny |
| perm_key | varchar(255) | Yes | — | → app_permission.key_ |

### user_setting

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **user_key** (PK) | varchar(255) | No | — | → user.key_ |
| **key_** (PK) | varchar(255) | No | — | Setting key |
| value | nvarchar(max) | No | — | Setting value |

### app_setting

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **key_** (PK) | varchar(255) | No | — | Setting key |
| value | nvarchar(max) | No | — | Setting value |
| description | nvarchar(255) | Yes | — | Description |
| updated_at | datetime2 | No | sysdatetime() | Last modified |

### user_ticket

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **key_** (PK) | varchar(255) | No | — | Ticket number (e.g. TK-00001) |
| category | nvarchar(255) | No | — | Category |
| topic | nvarchar(255) | No | — | Subject |
| description | nvarchar(max) | Yes | — | Detail |
| priority | varchar(50) | No | 'medium' | Priority level |
| status | varchar(50) | No | 'open' | Current status |
| assigned_to | varchar(255) | Yes | — | → user.key_ (assignee) |
| path | varchar(255) | Yes | — | Related path/URL |
| created_by | varchar(255) | No | — | → user.key_ (creator) |
| created_at | datetime2 | No | getutcdate() | Created timestamp |
| updated_at | datetime2 | No | getutcdate() | Last updated |
| is_deleted | bit | Yes | 0 | Soft delete flag |

### user_ticket_activity

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** (PK, Identity) | int | No | — | Auto-increment ID |
| ticket_key | varchar(255) | No | — | → user_ticket.key_ |
| updated_by | varchar(255) | No | — | → user.key_ |
| updated_at | datetime2 | No | getutcdate() | Action timestamp |
| action | varchar(50) | No | — | Action type |
| comment | nvarchar(max) | Yes | — | Comment |
| is_deleted | bit | Yes | 0 | Soft delete flag |

## Indexes

| Table | Index | Columns | Unique | Filter |
|-------|-------|---------|--------|--------|
| app_permission | IX_app_permission_level_sort | level, sorting | — | — |
| app_permission | IX_app_permission_parent | parent_key | — | — |
| app_role_permission | IX_app_role_permission_perm | perm_key | — | — |
| user | IX_user_ad | ad_username | — | ad_username IS NOT NULL |
| user | IX_user_empcode | emp_code | — | emp_code IS NOT NULL |
| user | IX_user_status | status | — | — |
| user_login_history | IX_user_login_history_ip | ip_address, created_at | — | is_success=0 |
| user_login_history | IX_user_login_history_user | user_key, created_at | — | — |
| user_permission_override | IX_user_perm_override_user | user_key, type | — | — |
| user_role | IX_user_role_role | role_key | — | — |
| user_session | IX_user_session_user | user_key, last_active_at | — | — |
| user_session | UX_user_session_token | token | ✓ | — |
| user_ticket | IX_user_ticket_assigned | assigned_to, status | — | is_deleted=0 |
| user_ticket | IX_user_ticket_created_by | created_by, created_at | — | — |
| user_ticket | IX_user_ticket_status | status, created_at | — | is_deleted=0 |
| user_ticket_activity | IX_user_ticket_history_ticket | ticket_key, updated_at | — | is_deleted=0 |

## Relationships (Soft FK)

```
user.key_ ←── user_role.user_key
user.key_ ←── user_session.user_key
user.key_ ←── user_setting.user_key
user.key_ ←── user_permission_override.user_key
user.key_ ←── user_login_history.user_key
user.key_ ←── user_ticket.created_by
user.key_ ←── user_ticket.assigned_to
user.key_ ←── user_ticket_activity.updated_by

app_role.key_ ←── user_role.role_key
app_role.key_ ←── app_role_permission.role_key

app_permission.key_ ←── app_role_permission.perm_key
app_permission.key_ ←── user_permission_override.perm_key
app_permission.key_ ←── app_permission.parent_key (self-ref)

user_ticket.key_ ←── user_ticket_activity.ticket_key
```

## Design Notes

- **Soft FK** — No enforced constraints. App handles integrity.
- **Filtered Indexes** — Ticket tables use `WHERE is_deleted=0`; user lookups use `WHERE NOT NULL`.
- **Bilingual** — Thai/English name variants via nvarchar.
- **Security** — `failed_login_count` + `locked_until` for brute-force protection. `user_login_history` for audit.
- **Gateway Profile** — Refreshed once per day (`profile_updated_at`). Data from external API gateway.
