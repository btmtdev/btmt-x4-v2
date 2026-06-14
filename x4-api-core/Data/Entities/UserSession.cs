namespace x4_api_core.Data.Entities;

public class UserSession
{
    public int Id { get; set; }
    public string UserKey { get; set; } = "";
    public string? IpAddress { get; set; }
    public string Token { get; set; } = "";
    public string? DeviceId { get; set; }
    public string? DeviceName { get; set; }
    public string? DeviceOs { get; set; }
    public string? Browser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActiveAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public bool IsRevoked { get; set; }
}
