namespace x4_api_shipping.Data.Entities;

public class Container
{
    public string Key { get; set; } = null!;
    public string? Description { get; set; }
    public double VolumeMax { get; set; }
    public bool IsActive { get; set; }
}
