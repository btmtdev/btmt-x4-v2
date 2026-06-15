using Microsoft.EntityFrameworkCore;
using x4_api_core.Data.Entities;

namespace x4_api_core.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<UserSession> UserSessions { get; set; }
    public DbSet<UserLoginHistory> UserLoginHistories { get; set; }
    public DbSet<AppRole> AppRoles { get; set; }
    public DbSet<AppPermission> AppPermissions { get; set; }
    public DbSet<AppRolePermission> AppRolePermissions { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<UserPermissionOverride> UserPermissionOverrides { get; set; }
    public DbSet<UserSetting> UserSettings { get; set; }
    public DbSet<AppSetting> AppSettings { get; set; }
    public DbSet<UserTicket> UserTickets { get; set; }
    public DbSet<UserTicketHistory> UserTicketHistories { get; set; }
    public DbSet<AppReleaseHistory> AppReleaseHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.ToTable("user");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasColumnName("key_");
            e.Property(x => x.PasswordHash).HasColumnName("password_hash");
            e.Property(x => x.AuthMode).HasColumnName("auth_mode");
            e.Property(x => x.Status).HasColumnName("status");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.IsLocked).HasColumnName("is_locked");
            e.Property(x => x.IsPending).HasColumnName("is_pending");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DisplayNameTh).HasColumnName("display_name_th");
            e.Property(x => x.DisplayNameEn).HasColumnName("display_name_en");
            e.Property(x => x.AdUsername).HasColumnName("ad_username");
            e.Property(x => x.EmpCode).HasColumnName("emp_code");
            e.Property(x => x.Position).HasColumnName("position");
            e.Property(x => x.DeptCode).HasColumnName("dept_code");
            e.Property(x => x.DeptName).HasColumnName("dept_name");
            e.Property(x => x.Email).HasColumnName("email");
            e.Property(x => x.Mobile).HasColumnName("mobile");
            e.Property(x => x.Company).HasColumnName("company");
            e.Property(x => x.LastLoggedIn).HasColumnName("last_logged_in");
            e.Property(x => x.ProfileUpdatedAt).HasColumnName("profile_updated_at");
            e.Property(x => x.PasswordChangedAt).HasColumnName("password_changed_at");
            e.Property(x => x.FailedLoginCount).HasColumnName("failed_login_count");
            e.Property(x => x.LockedUntil).HasColumnName("locked_until");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        mb.Entity<UserSession>(e =>
        {
            e.ToTable("user_session");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserKey).HasColumnName("user_key");
            e.Property(x => x.IpAddress).HasColumnName("ip_address");
            e.Property(x => x.Token).HasColumnName("token");
            e.Property(x => x.DeviceId).HasColumnName("device_id");
            e.Property(x => x.DeviceName).HasColumnName("device_name");
            e.Property(x => x.DeviceOs).HasColumnName("device_os");
            e.Property(x => x.Browser).HasColumnName("browser");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.LastActiveAt).HasColumnName("last_active_at");
            e.Property(x => x.ExpiredAt).HasColumnName("expired_at");
            e.Property(x => x.IsRevoked).HasColumnName("is_revoked");
        });

        mb.Entity<UserLoginHistory>(e =>
        {
            e.ToTable("user_login_history");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserKey).HasColumnName("user_key");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IpAddress).HasColumnName("ip_address");
            e.Property(x => x.Device).HasColumnName("device");
            e.Property(x => x.IsSuccess).HasColumnName("is_success");
            e.Property(x => x.FailureReason).HasColumnName("failure_reason");
        });

        mb.Entity<AppRole>(e =>
        {
            e.ToTable("app_role");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasColumnName("key_");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        mb.Entity<AppPermission>(e =>
        {
            e.ToTable("app_permission");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasColumnName("key_");
            e.Property(x => x.NameTh).HasColumnName("name_th");
            e.Property(x => x.NameEn).HasColumnName("name_en");
            e.Property(x => x.Path).HasColumnName("path");
            e.Property(x => x.Level).HasColumnName("level");
            e.Property(x => x.IsDivider).HasColumnName("is_divider");
            e.Property(x => x.Sorting).HasColumnName("sorting");
            e.Property(x => x.Icon).HasColumnName("icon");
            e.Property(x => x.IsAuthorized).HasColumnName("is_authorized");
            e.Property(x => x.ParentKey).HasColumnName("parent_key");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        mb.Entity<AppRolePermission>(e =>
        {
            e.ToTable("app_role_permission");
            e.HasKey(x => new { x.RoleKey, x.PermKey });
            e.Property(x => x.RoleKey).HasColumnName("role_key");
            e.Property(x => x.PermKey).HasColumnName("perm_key");
        });

        mb.Entity<UserRole>(e =>
        {
            e.ToTable("user_role");
            e.HasKey(x => new { x.UserKey, x.RoleKey });
            e.Property(x => x.UserKey).HasColumnName("user_key");
            e.Property(x => x.RoleKey).HasColumnName("role_key");
        });

        mb.Entity<UserPermissionOverride>(e =>
        {
            e.ToTable("user_permission_override");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserKey).HasColumnName("user_key");
            e.Property(x => x.Type).HasColumnName("type");
            e.Property(x => x.PermKey).HasColumnName("perm_key");
        });

        mb.Entity<UserSetting>(e =>
        {
            e.ToTable("user_setting");
            e.HasKey(x => new { x.UserKey, x.Key });
            e.Property(x => x.UserKey).HasColumnName("user_key");
            e.Property(x => x.Key).HasColumnName("key_");
            e.Property(x => x.Value).HasColumnName("value");
        });

        mb.Entity<AppSetting>(e =>
        {
            e.ToTable("app_setting");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasColumnName("key_");
            e.Property(x => x.Value).HasColumnName("value");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        mb.Entity<UserTicket>(e =>
        {
            e.ToTable("user_ticket");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasColumnName("key_");
            e.Property(x => x.Category).HasColumnName("category");
            e.Property(x => x.Topic).HasColumnName("topic");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.Priority).HasColumnName("priority");
            e.Property(x => x.Status).HasColumnName("status");
            e.Property(x => x.AssignedTo).HasColumnName("assigned_to");
            e.Property(x => x.Path).HasColumnName("path");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        mb.Entity<UserTicketHistory>(e =>
        {
            e.ToTable("user_ticket_activity");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.TicketKey).HasColumnName("ticket_key");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.Action).HasColumnName("action");
            e.Property(x => x.Comment).HasColumnName("comment");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        mb.Entity<AppReleaseHistory>(e =>
        {
            e.ToTable("app_release_history");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Version).HasColumnName("version");
            e.Property(x => x.Title).HasColumnName("title");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.ReleasedAt).HasColumnName("released_at");
        });
    }
}
