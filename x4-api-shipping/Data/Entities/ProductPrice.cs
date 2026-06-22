namespace x4_api_shipping.Data.Entities;

public class ProductPrice
{
    public int Id { get; set; }
    public string? ProductKey { get; set; }
    public string? SoType { get; set; }
    public decimal Price { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
}
