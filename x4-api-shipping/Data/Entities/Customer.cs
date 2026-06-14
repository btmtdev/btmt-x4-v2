namespace x4_api_shipping.Data.Entities;

public class Customer
{
    public string Key { get; set; } = "";
    public string? SapId { get; set; }
    public string? SoType { get; set; }
    public string? Name { get; set; }
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public string? TermOfPay1 { get; set; }
    public string? TermOfPay2 { get; set; }
    public string? TermOfPay3 { get; set; }
    public string? TradeTerm { get; set; }
    public string? ShipFrom { get; set; }
    public string? EdiPort { get; set; }
    public string? ShipMark1 { get; set; }
    public string? ShipMark2 { get; set; }
    public string? ShipMark3 { get; set; }
    public string? ShipMark4 { get; set; }
    public string? ShipMark5 { get; set; }
}
