namespace x4_api_core.Data.Entities;

public class User
{
    public string Key { get; set; } = "";
    public string? PasswordHash { get; set; }
    public string? AuthMode { get; set; }
    public string? Status { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; }
    public bool IsPending { get; set; }
    public bool IsDeleted { get; set; }
    public string? DisplayNameTh { get; set; }
    public string? DisplayNameEn { get; set; }
    public string? AdUsername { get; set; }
    public string? EmpCode { get; set; }
    public string? Position { get; set; }
    public string? DeptCode { get; set; }
    public string? DeptName { get; set; }
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string? Company { get; set; }
    public DateTime? LastLoggedIn { get; set; }
    public DateTime? ProfileUpdatedAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTime? LockedUntil { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
