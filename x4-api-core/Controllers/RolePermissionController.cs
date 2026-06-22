using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_core.Data;
using x4_api_core.Data.Entities;
using x4_api_core.Models;
using x4_api_core.Services;

namespace x4_api_core.Controllers;

[ApiController]
[Route("api")]
public class RolePermissionController(AppDbContext db, GatewayService gateway) : ControllerBase
{
    // === USERS ===

    [HttpGet("users/gateway-profile/{identifier}")]
    public async Task<IActionResult> LookupGatewayProfile(string identifier)
    {
        var adp = await gateway.GetAdProfileAsync(identifier);
        var empCode = adp?.EmpCode ?? (identifier.All(char.IsDigit) ? identifier : null);
        GatewayHrProfileData? hr = null;
        if (empCode != null) hr = await gateway.GetHrProfileAsync(empCode);
        if (hr == null && adp == null) return BadRequest(ApiResponse.Error("NOT_FOUND"));
        return Ok(ApiResponse.Success(new
        {
            emp_code = hr?.EmpCode ?? empCode,
            ad_username = adp?.AdUsername?.ToLower(),
            display_name_th = hr?.DisplayNameTh,
            display_name_en = hr?.DisplayNameEn,
            dept_code = hr?.OrgCode,
            dept_name = hr?.OrgName,
            position = hr?.PositionName,
            work_status = hr?.WorkStatus,
            email = adp?.Email,
            company = "BTMT",
        }));
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await db.Users.OrderBy(u => u.CreatedAt)
            .Select(u => new { u.Key, u.AuthMode, u.Status, u.IsActive, u.IsLocked, u.IsPending, u.IsDeleted, u.DisplayNameTh, u.DisplayNameEn, u.AdUsername, u.EmpCode, u.DeptName, u.Email, u.FailedLoginCount, u.LockedUntil, u.LastLoggedIn, u.CreatedAt })
            .ToListAsync();
        return Ok(ApiResponse.Success(users));
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Key == dto.Key);
        if (existing != null)
        {
            if (existing.IsDeleted)
            {
                existing.Status = "active"; existing.IsActive = true; existing.IsDeleted = false;
                existing.AuthMode = dto.AuthMode;
                existing.DisplayNameTh = dto.DisplayNameTh; existing.DisplayNameEn = dto.DisplayNameEn;
                existing.AdUsername = dto.AdUsername; existing.EmpCode = dto.EmpCode;
                existing.Position = dto.Position; existing.DeptCode = dto.DeptCode;
                existing.DeptName = dto.DeptName; existing.Email = dto.Email;
                existing.Mobile = dto.Mobile; existing.Company = dto.Company;
                existing.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
                return Ok(ApiResponse.Success(new { key = dto.Key, restored = true }));
            }
            return Conflict(ApiResponse.Error("USER_EXISTS"));
        }
        db.Users.Add(new User
        {
            Key = dto.Key, PasswordHash = dto.Password, AuthMode = dto.AuthMode, Status = "active",
            IsActive = true,
            DisplayNameTh = dto.DisplayNameTh, DisplayNameEn = dto.DisplayNameEn,
            AdUsername = dto.AdUsername, EmpCode = dto.EmpCode, Position = dto.Position,
            DeptCode = dto.DeptCode, DeptName = dto.DeptName, Email = dto.Email,
            Mobile = dto.Mobile, Company = dto.AuthMode == "gateway" ? "BTMT" : dto.Company,
            ProfileUpdatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { key = dto.Key }));
    }

    [HttpPut("users/{key}/status")]
    public async Task<IActionResult> UpdateUserStatus(string key, [FromBody] UserStatusDto dto)
    {
        var user = await db.Users.FindAsync(key);
        if (user == null) return NotFound();
        user.Status = dto.Status;
        user.IsActive = dto.Status == "active";
        user.IsLocked = dto.Status == "disabled";
        user.IsPending = dto.Status == "pending";
        user.IsDeleted = dto.Status == "deleted";
        if (dto.Status == "active") { user.FailedLoginCount = 0; user.LockedUntil = null; }
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPut("users/{key}/profile")]
    public async Task<IActionResult> UpdateUserProfile(string key, [FromBody] UpdateUserDto dto)
    {
        var user = await db.Users.FindAsync(key);
        if (user == null) return NotFound();
        if (dto.DisplayNameTh != null) user.DisplayNameTh = dto.DisplayNameTh;
        if (dto.DisplayNameEn != null) user.DisplayNameEn = dto.DisplayNameEn;
        if (dto.Password != null) { user.PasswordHash = dto.Password; user.PasswordChangedAt = DateTime.UtcNow; }
        if (dto.Position != null) user.Position = dto.Position;
        if (dto.DeptCode != null) user.DeptCode = dto.DeptCode;
        if (dto.DeptName != null) user.DeptName = dto.DeptName;
        if (dto.Email != null) user.Email = dto.Email;
        if (dto.Mobile != null) user.Mobile = dto.Mobile;
        if (dto.Company != null) user.Company = dto.Company;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpDelete("users/{key}")]
    public async Task<IActionResult> DeleteUser(string key)
    {
        var user = await db.Users.FindAsync(key);
        if (user == null) return NotFound();
        user.Status = "deleted"; user.IsDeleted = true; user.IsActive = false; user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpDelete("users/{key}/hard")]
    public async Task<IActionResult> HardDeleteUser(string key)
    {
        await db.UserSettings.Where(x => x.UserKey == key).ExecuteDeleteAsync();
        await db.UserPermissionOverrides.Where(x => x.UserKey == key).ExecuteDeleteAsync();
        await db.UserRoles.Where(x => x.UserKey == key).ExecuteDeleteAsync();
        await db.UserSessions.Where(x => x.UserKey == key).ExecuteDeleteAsync();
        await db.UserLoginHistories.Where(x => x.UserKey == key).ExecuteDeleteAsync();
        await db.Users.Where(x => x.Key == key).ExecuteDeleteAsync();
        return Ok(ApiResponse.Success());
    }

    // === PERMISSIONS ===

    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        var all = await db.AppPermissions.OrderBy(p => p.Sorting).ToListAsync();
        var tree = all.Where(p => p.ParentKey == null || p.ParentKey == "0").Select(p => BuildNode(p, all));
        return Ok(ApiResponse.Success(tree));
    }

    [HttpGet("permissions/flat")]
    public async Task<IActionResult> GetPermissionsFlat([FromQuery] int? max_level)
    {
        var q = db.AppPermissions.AsQueryable();
        if (max_level.HasValue) q = q.Where(p => p.Level <= max_level.Value);
        return Ok(ApiResponse.Success(await q.OrderBy(p => p.Level).ThenBy(p => p.Sorting).ToListAsync()));
    }

    [HttpPost("permissions")]
    public async Task<IActionResult> CreatePermission([FromBody] PermissionDto dto)
    {
        db.AppPermissions.Add(new AppPermission
        {
            Key = dto.Key, NameTh = dto.NameTh, NameEn = dto.NameEn, Path = dto.Path,
            ParentKey = dto.ParentKey, Level = dto.Level, IsDivider = dto.IsDivider,
            Sorting = dto.Sorting, Icon = dto.Icon, IsAuthorized = dto.IsAuthorized, IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { key = dto.Key }));
    }

    [HttpPut("permissions/{permKey}")]
    public async Task<IActionResult> UpdatePermission(string permKey, [FromBody] PermissionDto dto)
    {
        var p = await db.AppPermissions.FindAsync(permKey);
        if (p == null) return NotFound();
        p.NameTh = dto.NameTh; p.NameEn = dto.NameEn; p.Path = dto.Path;
        p.ParentKey = dto.ParentKey; p.Level = dto.Level; p.IsDivider = dto.IsDivider;
        p.Sorting = dto.Sorting; p.Icon = dto.Icon;
        p.IsAuthorized = dto.IsAuthorized; p.IsActive = dto.IsActive;
        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpDelete("permissions/{permKey}")]
    public async Task<IActionResult> DeletePermission(string permKey)
    {
        var ids = await GetPermTreeKeys(permKey);
        await db.AppRolePermissions.Where(x => ids.Contains(x.PermKey)).ExecuteDeleteAsync();
        await db.UserPermissionOverrides.Where(x => x.PermKey != null && ids.Contains(x.PermKey)).ExecuteDeleteAsync();
        await db.AppPermissions.Where(x => ids.Contains(x.Key)).ExecuteDeleteAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPost("permissions/reorder")]
    public async Task<IActionResult> ReorderPermissions([FromBody] ReorderDto[] items)
    {
        foreach (var item in items)
        {
            var p = await db.AppPermissions.FindAsync(item.Key);
            if (p != null) p.Sorting = item.Sorting;
        }
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    // === ROLES ===

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await db.AppRoles.OrderBy(r => r.Name).ToListAsync();
        var rps = await db.AppRolePermissions.ToListAsync();
        var result = roles.Select(r => new
        {
            r.Key, r.Name, r.Description, r.IsActive,
            permission_keys = rps.Where(rp => rp.RoleKey == r.Key).Select(rp => rp.PermKey).ToArray()
        });
        return Ok(ApiResponse.Success(result));
    }

    [HttpPost("roles")]
    public async Task<IActionResult> CreateRole([FromBody] RoleDto dto)
    {
        db.AppRoles.Add(new AppRole { Key = dto.Key, Name = dto.Name, Description = dto.Description, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        if (dto.PermissionKeys?.Length > 0)
            db.AppRolePermissions.AddRange(dto.PermissionKeys.Select(pk => new AppRolePermission { RoleKey = dto.Key, PermKey = pk }));
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { key = dto.Key }));
    }

    [HttpPut("roles/{roleKey}")]
    public async Task<IActionResult> UpdateRole(string roleKey, [FromBody] RoleDto dto)
    {
        var role = await db.AppRoles.FindAsync(roleKey);
        if (role == null) return NotFound();
        role.Name = dto.Name; role.Description = dto.Description; role.UpdatedAt = DateTime.UtcNow;
        await db.AppRolePermissions.Where(x => x.RoleKey == roleKey).ExecuteDeleteAsync();
        if (dto.PermissionKeys?.Length > 0)
            db.AppRolePermissions.AddRange(dto.PermissionKeys.Select(pk => new AppRolePermission { RoleKey = roleKey, PermKey = pk }));
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpDelete("roles/{roleKey}")]
    public async Task<IActionResult> DeleteRole(string roleKey)
    {
        await db.AppRolePermissions.Where(x => x.RoleKey == roleKey).ExecuteDeleteAsync();
        await db.UserRoles.Where(x => x.RoleKey == roleKey).ExecuteDeleteAsync();
        await db.AppRoles.Where(x => x.Key == roleKey).ExecuteDeleteAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpGet("roles/{roleKey}/users")]
    public async Task<IActionResult> GetRoleUsers(string roleKey)
    {
        var users = await db.UserRoles.Where(ur => ur.RoleKey == roleKey)
            .Join(db.Users.Where(u => u.Status != "deleted"), ur => ur.UserKey, u => u.Key,
                (_, u) => new { u.Key, u.DisplayNameTh, u.DisplayNameEn, u.EmpCode })
            .ToListAsync();
        return Ok(ApiResponse.Success(users));
    }

    [HttpPost("roles/{roleKey}/users/{userKey}")]
    public async Task<IActionResult> AddUserToRole(string roleKey, string userKey)
    {
        if (!await db.UserRoles.AnyAsync(x => x.UserKey == userKey && x.RoleKey == roleKey))
        { db.UserRoles.Add(new UserRole { UserKey = userKey, RoleKey = roleKey }); await db.SaveChangesAsync(); }
        return Ok(ApiResponse.Success());
    }

    [HttpDelete("roles/{roleKey}/users/{userKey}")]
    public async Task<IActionResult> RemoveUserFromRole(string roleKey, string userKey)
    {
        await db.UserRoles.Where(x => x.UserKey == userKey && x.RoleKey == roleKey).ExecuteDeleteAsync();
        return Ok(ApiResponse.Success());
    }

    // === USER ROLES & OVERRIDES ===

    [HttpGet("users/{key}/roles")]
    public async Task<IActionResult> GetUserRoles(string key)
    {
        var roles = await db.UserRoles.Where(x => x.UserKey == key).Select(x => x.RoleKey).ToListAsync();
        var overrides = await db.UserPermissionOverrides.Where(x => x.UserKey == key)
            .Select(x => new { x.PermKey, x.Type }).ToListAsync();
        return Ok(ApiResponse.Success(new { roles, overrides }));
    }

    [HttpPost("users/{key}/roles")]
    public async Task<IActionResult> SetUserRoles(string key, [FromBody] UserRolesDto dto)
    {
        await db.UserRoles.Where(x => x.UserKey == key).ExecuteDeleteAsync();
        if (dto.RoleKeys?.Length > 0)
            db.UserRoles.AddRange(dto.RoleKeys.Select(r => new UserRole { UserKey = key, RoleKey = r }));
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPost("users/{key}/overrides")]
    public async Task<IActionResult> SetUserOverrides(string key, [FromBody] UserOverridesDto dto)
    {
        await db.UserPermissionOverrides.Where(x => x.UserKey == key).ExecuteDeleteAsync();
        if (dto.Overrides?.Length > 0)
            db.UserPermissionOverrides.AddRange(dto.Overrides.Select(o => new UserPermissionOverride { UserKey = key, PermKey = o.PermKey, Type = o.Type }));
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpGet("users/{key}/permissions")]
    public async Task<IActionResult> GetEffectivePermissions(string key)
    {
        var roleKeys = await db.UserRoles.Where(x => x.UserKey == key).Select(x => x.RoleKey).ToListAsync();
        var permKeys = await db.AppRolePermissions.Where(x => roleKeys.Contains(x.RoleKey)).Select(x => x.PermKey).Distinct().ToListAsync();
        var overrides = await db.UserPermissionOverrides.Where(x => x.UserKey == key && x.PermKey != null).ToListAsync();
        var effective = permKeys.ToHashSet();
        foreach (var o in overrides)
        {
            if (o.Type == "deny") effective.Remove(o.PermKey!);
            else if (o.Type == "grant") effective.Add(o.PermKey!);
        }
        if (effective.Count == 0) return Ok(ApiResponse.Success(Array.Empty<object>()));
        var perms = await db.AppPermissions.Where(p => effective.Contains(p.Key)).OrderBy(p => p.Sorting).ToListAsync();
        return Ok(ApiResponse.Success(perms));
    }

    private async Task<List<string>> GetPermTreeKeys(string rootKey)
    {
        var all = await db.AppPermissions.Select(p => new { p.Key, p.ParentKey }).ToListAsync();
        var result = new List<string>();
        var queue = new Queue<string>();
        queue.Enqueue(rootKey);
        while (queue.Count > 0)
        {
            var k = queue.Dequeue();
            result.Add(k);
            foreach (var child in all.Where(p => p.ParentKey == k)) queue.Enqueue(child.Key);
        }
        return result;
    }

    private static object BuildNode(AppPermission p, List<AppPermission> all) => new
    {
        p.Key, p.NameTh, p.NameEn, p.Path, p.ParentKey, p.Level, p.IsDivider, p.Sorting, p.Icon, p.IsAuthorized, p.IsActive,
        children = all.Where(c => c.ParentKey == p.Key).OrderBy(c => c.Sorting).Select(c => BuildNode(c, all))
    };
}
