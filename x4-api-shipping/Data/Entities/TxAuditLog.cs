namespace x4_api_shipping.Data.Entities;

public class TxAuditLog
{
    public long Id { get; set; }
    public string? TableName { get; set; }
    public string? RecordKey { get; set; }
    public string? Action { get; set; }
    public string? ColumnName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
}
