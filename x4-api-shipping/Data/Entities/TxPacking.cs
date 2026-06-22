namespace x4_api_shipping.Data.Entities;

public class TxPacking
{
    public string InvoiceKey { get; set; } = null!;
    public int SeqNo { get; set; }
    public string? ContainerNo { get; set; }
    public string? ContainerType { get; set; }
    public DateOnly? LoadingDate { get; set; }
    public string? LoadingTimePeriod { get; set; }
    public string? Remark { get; set; }
}
