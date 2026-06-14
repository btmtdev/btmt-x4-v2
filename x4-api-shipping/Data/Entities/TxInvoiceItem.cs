namespace x4_api_shipping.Data.Entities;

public class TxInvoiceItem
{
    public string InvoiceKey { get; set; } = null!;
    public int InvoiceItemNo { get; set; }
    public string? SoKey { get; set; }
    public string? SoLine { get; set; }
    public string? ProductKey { get; set; }
    public string? KitKey { get; set; }
    public string? ProductType { get; set; }
    public string? Description { get; set; }
    public int Qty { get; set; }
    public int QtyPacked { get; set; }
    public string? StockType { get; set; }
    public string? Req1 { get; set; }
    public string? Req2 { get; set; }
}
