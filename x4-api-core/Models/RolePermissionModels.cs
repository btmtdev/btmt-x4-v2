using System.Text.Json.Serialization;

namespace x4_api_core.Models;

public record PermissionDto(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("name_th")] string NameTh,
    [property: JsonPropertyName("name_en")] string NameEn,
    [property: JsonPropertyName("path")] string? Path,
    [property: JsonPropertyName("parent_key")] string? ParentKey,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("is_divider")] bool IsDivider,
    [property: JsonPropertyName("sorting")] int Sorting,
    [property: JsonPropertyName("icon")] string? Icon,
    [property: JsonPropertyName("is_authorized")] bool? IsAuthorized,
    [property: JsonPropertyName("is_active")] bool? IsActive);

public record ReorderDto(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("sorting")] int Sorting);

public record RoleDto(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("permission_keys")] string[]? PermissionKeys);

public record CreateUserDto(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("auth_mode")] string AuthMode,
    [property: JsonPropertyName("password")] string? Password,
    [property: JsonPropertyName("display_name_th")] string? DisplayNameTh,
    [property: JsonPropertyName("display_name_en")] string? DisplayNameEn,
    [property: JsonPropertyName("ad_username")] string? AdUsername,
    [property: JsonPropertyName("emp_code")] string? EmpCode,
    [property: JsonPropertyName("position")] string? Position,
    [property: JsonPropertyName("dept_code")] string? DeptCode,
    [property: JsonPropertyName("dept_name")] string? DeptName,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("mobile")] string? Mobile,
    [property: JsonPropertyName("company")] string? Company);

public record UpdateUserDto(
    [property: JsonPropertyName("display_name_th")] string? DisplayNameTh,
    [property: JsonPropertyName("display_name_en")] string? DisplayNameEn,
    [property: JsonPropertyName("password")] string? Password,
    [property: JsonPropertyName("position")] string? Position,
    [property: JsonPropertyName("dept_code")] string? DeptCode,
    [property: JsonPropertyName("dept_name")] string? DeptName,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("mobile")] string? Mobile,
    [property: JsonPropertyName("company")] string? Company);

public record UserStatusDto([property: JsonPropertyName("status")] string Status);

public record UserRolesDto([property: JsonPropertyName("role_keys")] string[] RoleKeys);

public record UserOverridesDto([property: JsonPropertyName("overrides")] OverrideItem[] Overrides);

public record OverrideItem(
    [property: JsonPropertyName("perm_key")] string PermKey,
    [property: JsonPropertyName("type")] string Type);
