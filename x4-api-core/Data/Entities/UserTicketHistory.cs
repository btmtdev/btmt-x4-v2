namespace x4_api_core.Data.Entities;

public class UserTicketHistory
{
    public int Id { get; set; }
    public string TicketKey { get; set; } = "";
    public string UpdatedBy { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
    public string Action { get; set; } = "";
    public string? Comment { get; set; }
    public bool? IsDeleted { get; set; }
}
