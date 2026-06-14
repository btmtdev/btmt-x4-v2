namespace x4_api_core.Data.Entities;

public class UserLoginHistory
{
    public int Id { get; set; }
    public string UserKey { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? Device { get; set; }
    public bool IsSuccess { get; set; }
    public string? FailureReason { get; set; }
}
