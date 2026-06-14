namespace x4_api_shipping.Data.Entities;

public class TxSalesOrderRevision
{
    public int Id { get; set; }
    public string? SoKey { get; set; }
    public string? SoLine { get; set; }
    public int Revision { get; set; }
    public DateTime? RevisionDate { get; set; }
    public string? RevisionType { get; set; }
    public string? ProductKey { get; set; }
    public string? KitKey { get; set; }
    public int Qty { get; set; }
    public DateOnly? SoDate { get; set; }
    public string? CountryName { get; set; }
    public string? ToCity { get; set; }
    public string? Currency { get; set; }
    public string? ProductionPeriod { get; set; }
    public string? CustomerArea { get; set; }
    public string? AgechCode { get; set; }
    public DateTime? SoProcessDate { get; set; }
    public string? SoType { get; set; }
    public string? StockType { get; set; }
    public string? Req1 { get; set; }
    public string? Req2 { get; set; }
    public int QtyBefore { get; set; }
    public int QtyAfter { get; set; }
    public string? ChangedBy { get; set; }
    public string? Remark { get; set; }
}
