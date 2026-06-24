namespace x4_api_warehouse.Models;

public class CreatePickingRequest
{
    public string? WhCode { get; set; }
    public string? SalesId { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public string? TruckPlateNo { get; set; }
    public string? TransportCompanyCode { get; set; }
    public string? DriverCode { get; set; }
    public string? DeliveryPlace { get; set; }
    public string? TransportType { get; set; }
    public string? IssuedBy { get; set; }
    public List<PickingItem> Items { get; set; } = [];
}

public class PickingItem
{
    public string? DocumentNo { get; set; }
    public string? DocumentType { get; set; }
    public string? GtCode { get; set; }
    public string? CtFlag { get; set; }
    public string? KkFlag { get; set; }
    public string? Grade { get; set; }
    public string? NormalTyreFlag { get; set; }
    public int OrderQty { get; set; }
    public decimal StdWeight { get; set; }
    public string? CustomerCode { get; set; }
    public string? StockType { get; set; }
    public string? Req1 { get; set; }
    public string? Req2 { get; set; }
}

public class AllocateRequest
{
    public string? GtCode { get; set; }
    public string? CtFlag { get; set; }
    public string? KkFlag { get; set; }
    public string? Grade { get; set; }
    public int Qty { get; set; }
}
