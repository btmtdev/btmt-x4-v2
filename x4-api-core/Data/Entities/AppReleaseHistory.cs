namespace x4_api_core.Data.Entities;

public class AppReleaseHistory
{
    public int Id { get; set; }
    public string Version { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public DateTime ReleasedAt { get; set; }
}
