namespace x4_api_core.Data.Entities;

public class AppSetting
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; }
}
