namespace x4_api_shipping.Data.Entities;

public class Product
{
    public string Key { get; set; } = null!;
    public string? Description { get; set; }
    public string? Group { get; set; }
    public string? Type { get; set; }
    public string? Brand { get; set; }
    public string? CooKey { get; set; }
    public decimal NetWeight { get; set; }
    public decimal Volume { get; set; }
    public double Rubber { get; set; }
    public bool IsActive { get; set; }
}
