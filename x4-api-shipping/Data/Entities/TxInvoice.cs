namespace x4_api_shipping.Data.Entities;

public class TxInvoice
{
    public string InvoiceKey { get; set; } = "";
    public DateOnly? InvoiceDate { get; set; }
    public string? CustomerKey { get; set; }
    public DateOnly? Etd { get; set; }
    public DateOnly? Eta { get; set; }
    public string? CountryCode { get; set; }
    public string? PortOfDestination { get; set; }
    public string? PortOfDischarge { get; set; }
    public string? EdiShipTo { get; set; }
    public string? PortOfLoad { get; set; }
    public string? PortOfLoadName { get; set; }
    public string? EdiShipFrom { get; set; }
    public string? ConsignedTo1 { get; set; }
    public string? ConsignedTo2 { get; set; }
    public string? ConsignedTo3 { get; set; }
    public string? TermOfPay1 { get; set; }
    public string? TermOfPay2 { get; set; }
    public string? TermOfPay3 { get; set; }
    public string? TradeTerm { get; set; }
    public string? FeederVessel { get; set; }
    public string? MotherVessel { get; set; }
    public string? ContractNo { get; set; }
    public string? LcNo { get; set; }
    public DateOnly? LcDate { get; set; }
    public string? DescOfGoods1 { get; set; }
    public string? DescOfGoods2 { get; set; }
    public string? ShipMark1 { get; set; }
    public string? ShipMark2 { get; set; }
    public string? ShipMark3 { get; set; }
    public string? ShipMark4 { get; set; }
    public string? ShipMark5 { get; set; }
    public string? CarrierKey { get; set; }
    public string? ShipingRemark1 { get; set; }
    public string? ShipingRemark2 { get; set; }
    public string? VoyageNo { get; set; }
    public DateOnly? ConfirmDate { get; set; }
    public string? BlNo { get; set; }
    public string? BookingNo { get; set; }
    public DateTime? Schedule { get; set; }
    public int Revision { get; set; }
    public string Status { get; set; } = "draft";
}
