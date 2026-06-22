namespace x4_api_shipping.Data.Entities;

public class KittingBom
{
    public string Key { get; set; } = null!;
    public string? KitKey { get; set; }
    public string ComponentType { get; set; } = null!;
    public string? ProductKey { get; set; }
    public string? ComponentKey { get; set; }
    public int Quantity { get; set; }
    public int Sorting { get; set; }
    public bool IsActive { get; set; }
}
