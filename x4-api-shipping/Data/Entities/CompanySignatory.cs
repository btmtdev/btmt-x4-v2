namespace x4_api_shipping.Data.Entities;

public class CompanySignatory
{
    public int Id { get; set; }
    public string? CompanyKey { get; set; }
    public string? Name { get; set; }
    public string? Position { get; set; }
    public string? SignatureUrl { get; set; }
    public string? StampUrl { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public bool IsActive { get; set; }
}
