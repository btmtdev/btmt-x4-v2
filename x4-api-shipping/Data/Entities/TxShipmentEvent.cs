namespace x4_api_shipping.Data.Entities;

public class TxShipmentEvent
{
    public long Id { get; set; }
    public string InvoiceKey { get; set; } = null!;
    public int Revision { get; set; }
    public string EventType { get; set; } = null!; // release, pullback, send_to_wh, wh_confirm
    public string? EventData { get; set; }         // JSON payload
    public string CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
