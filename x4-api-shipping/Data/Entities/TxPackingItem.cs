namespace x4_api_shipping.Data.Entities;

public class TxPackingItem
{
    public string InvoiceKey { get; set; } = null!;
    public int SeqNo { get; set; }
    public string SoKey { get; set; } = null!;
    public string SoLine { get; set; } = null!;
    public string? ProductKey { get; set; }
    public string? KitKey { get; set; }
    public string? Description { get; set; }
    public int Qty { get; set; }
    public double Volume { get; set; }
}
