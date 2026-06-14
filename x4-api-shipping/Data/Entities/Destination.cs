namespace x4_api_shipping.Data.Entities;

public class Destination
{
    public string Key { get; set; } = null!;
    public string? CustomerKey { get; set; }
    public string? CustomerArea { get; set; }
    public string? AgechCode { get; set; }
    public string? Name { get; set; }
    public string? CountryKey { get; set; }
    public string? PortKey { get; set; }
    public bool IsActive { get; set; }
}
