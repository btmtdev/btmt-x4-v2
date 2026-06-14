namespace x4_api_shipping.Data.Entities;

public class Company
{
    public string Key { get; set; } = null!;
    public string? Name { get; set; }
    public string? TaxId { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? StateProvince { get; set; }
    public string? PostalCode { get; set; }
    public string? CountryKey { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
}
