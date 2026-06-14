namespace x4_api_shipping.Data.Entities;

public class TxSalesOrder
{
    public string SoKey { get; set; } = null!;
    public string SoLine { get; set; } = null!;
    public DateOnly? SoDate { get; set; }
    public string? SoType { get; set; }
    public string? DestinationKey { get; set; }
    public string? ProductKey { get; set; }
    public string? KitKey { get; set; }
    public int QtyConfirmed { get; set; }
    public int QtyInvoiced { get; set; }
    public int QtyPacked { get; set; }
    public string? ProductionPeriod { get; set; }
    public string? StockType { get; set; }
    public string? Req1 { get; set; }
    public string? Req2 { get; set; }
    public string? Remark { get; set; }
}
