namespace x4_api_core.Data.Entities;

public class UserPermissionOverride
{
    public int Id { get; set; }
    public string UserKey { get; set; } = "";
    public string Type { get; set; } = "";
    public string? PermKey { get; set; }
}
