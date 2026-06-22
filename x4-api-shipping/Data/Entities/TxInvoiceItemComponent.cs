namespace x4_api_shipping.Data.Entities;

public class TxInvoiceItemComponent
{
    public string InvoiceKey { get; set; } = null!;
    public int InvoiceItemNo { get; set; }
    public string ComponentType { get; set; } = null!;
    public string? ProductKey { get; set; }
    public int UnitPrice { get; set; }
    public double? UnitWeight { get; set; }
    public double? UnitVolume { get; set; }
}
