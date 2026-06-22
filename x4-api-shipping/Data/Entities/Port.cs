namespace x4_api_shipping.Data.Entities;

public class Port
{
    public string Key { get; set; } = null!;
    public string? Name { get; set; }
    public string? CountryKey { get; set; }
    public bool IsDestination { get; set; }
    public bool IsDischarge { get; set; }
    public bool IsActive { get; set; }
}
