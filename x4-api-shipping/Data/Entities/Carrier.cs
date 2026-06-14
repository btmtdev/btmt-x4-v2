namespace x4_api_shipping.Data.Entities;

public class Carrier
{
    public string Key { get; set; } = null!;
    public string? Name { get; set; }
    public string? TransportMode { get; set; }
    public bool IsActive { get; set; }
}
