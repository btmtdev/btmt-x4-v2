namespace x4_api_core.Data.Entities;

public class UserTicket
{
    public string Key { get; set; } = "";
    public string Category { get; set; } = "";
    public string Topic { get; set; } = "";
    public string? Description { get; set; }
    public string Priority { get; set; } = "";
    public string Status { get; set; } = "";
    public string? AssignedTo { get; set; }
    public string? Path { get; set; }
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool? IsDeleted { get; set; }
}
