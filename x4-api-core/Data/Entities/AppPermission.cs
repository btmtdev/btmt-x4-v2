namespace x4_api_core.Data.Entities;

public class AppPermission
{
    public string Key { get; set; } = "";
    public string NameTh { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? Path { get; set; }
    public int Level { get; set; }
    public bool IsDivider { get; set; }
    public int Sorting { get; set; }
    public string? Icon { get; set; }
    public bool? IsAuthorized { get; set; }
    public string? ParentKey { get; set; }
    public bool? IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
