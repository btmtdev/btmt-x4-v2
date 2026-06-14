using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_shipping.Data;
using x4_api_shipping.Data.Entities;
using x4_api_shipping.Models;

namespace x4_api_shipping.Controllers;

[ApiController]
[Route("api/masters")]
public class MastersController(ShippingDbContext db) : ControllerBase
{
    [HttpGet("carriers")] public async Task<IActionResult> GetCarriers() => Ok(ApiResponse.Success(await db.Carriers.Where(x => x.IsActive).ToListAsync()));
    [HttpGet("companies")] public async Task<IActionResult> GetCompanies() => Ok(ApiResponse.Success(await db.Companies.Where(x => x.IsActive).ToListAsync()));
    [HttpGet("signatories")] public async Task<IActionResult> GetSignatories() => Ok(ApiResponse.Success(await db.CompanySignatories.Where(x => x.IsActive).ToListAsync()));
    [HttpPost("signatories")] public async Task<IActionResult> CreateSignatory([FromBody] CompanySignatory dto) { dto.IsActive = true; db.CompanySignatories.Add(dto); await db.SaveChangesAsync(); return Ok(ApiResponse.Success(dto)); }
    [HttpPut("signatories/{id}")] public async Task<IActionResult> UpdateSignatory(int id, [FromBody] CompanySignatory dto) { var e = await db.CompanySignatories.FindAsync(id); if (e == null) return NotFound(); e.CompanyKey = dto.CompanyKey; e.Name = dto.Name; e.Position = dto.Position; e.SignatureUrl = dto.SignatureUrl; e.StampUrl = dto.StampUrl; e.EffectiveFrom = dto.EffectiveFrom; await db.SaveChangesAsync(); return Ok(ApiResponse.Success(e)); }
    [HttpDelete("signatories/{id}")] public async Task<IActionResult> DeleteSignatory(int id) { var e = await db.CompanySignatories.FindAsync(id); if (e == null) return NotFound(); e.IsActive = false; await db.SaveChangesAsync(); return Ok(ApiResponse.Success()); }
    [HttpGet("containers")] public async Task<IActionResult> GetContainers() => Ok(ApiResponse.Success(await db.Containers.Where(x => x.IsActive).ToListAsync()));
    [HttpGet("countries")] public async Task<IActionResult> GetCountries() => Ok(ApiResponse.Success(await db.Countries.Where(x => x.IsActive).ToListAsync()));
    [HttpGet("countries-of-origin")] public async Task<IActionResult> GetCoo() => Ok(ApiResponse.Success(await db.CountryOfOrigins.ToListAsync()));
    [HttpGet("ports")] public async Task<IActionResult> GetPorts() => Ok(ApiResponse.Success(await db.Ports.Where(x => x.IsActive).ToListAsync()));
    [HttpGet("products")] public async Task<IActionResult> GetProducts() => Ok(ApiResponse.Success(await db.Products.Where(x => x.IsActive).ToListAsync()));
    [HttpGet("products/{key}")] public async Task<IActionResult> GetProduct(string key) => Ok(ApiResponse.Success(await db.Products.FindAsync(key)));
    [HttpGet("customers")] public async Task<IActionResult> GetCustomers() => Ok(ApiResponse.Success(await db.Customers.ToListAsync()));
    [HttpGet("destinations")] public async Task<IActionResult> GetDestinations([FromQuery] string? customer_key) {
        var q = db.Destinations.Where(x => x.IsActive).AsQueryable();
        if (!string.IsNullOrEmpty(customer_key)) q = q.Where(x => x.CustomerKey == customer_key);
        return Ok(ApiResponse.Success(await q.ToListAsync()));
    }
    [HttpGet("kitting-boms")] public async Task<IActionResult> GetKittingBoms([FromQuery] string? product_key) {
        var q = db.KittingBoms.Where(x => x.IsActive).AsQueryable();
        if (!string.IsNullOrEmpty(product_key)) q = q.Where(x => x.ProductKey == product_key);
        return Ok(ApiResponse.Success(await q.ToListAsync()));
    }
    [HttpGet("product-prices")] public async Task<IActionResult> GetProductPrices([FromQuery] string? product_key) {
        var q = db.ProductPrices.Where(x => x.IsActive).AsQueryable();
        if (!string.IsNullOrEmpty(product_key)) q = q.Where(x => x.ProductKey == product_key);
        return Ok(ApiResponse.Success(await q.OrderByDescending(x => x.EffectiveFrom).ToListAsync()));
    }
    [HttpGet("ports-of-load")] public async Task<IActionResult> GetPortsOfLoad() => Ok(ApiResponse.Success(await db.PortOfLoads.Where(x => x.IsActive).ToListAsync()));
}
