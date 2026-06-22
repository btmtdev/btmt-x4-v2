namespace x4_api_shipping.Data.Entities;

public class Country
{
    public string Key { get; set; } = null!;
    public string? Name { get; set; }
    public string? Region { get; set; }
    public bool IsActive { get; set; }
}
