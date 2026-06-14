namespace x4_api_shipping.Data.Entities;

public class PortOfLoad
{
    public string Key { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string EdiName { get; set; } = null!;
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
}
