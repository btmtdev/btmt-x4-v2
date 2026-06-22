using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_shipping.Data;
using x4_api_shipping.Models;

namespace x4_api_shipping.Controllers;

[ApiController]
[Route("api/sales-orders")]
public class SalesOrdersController(ShippingDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? destination_key, [FromQuery] string? product_key, [FromQuery] string? production_period)
    {
        var q = db.SalesOrders.AsQueryable();
        if (!string.IsNullOrEmpty(destination_key)) q = q.Where(x => x.DestinationKey == destination_key);
        if (!string.IsNullOrEmpty(product_key)) q = q.Where(x => x.ProductKey == product_key);
        if (!string.IsNullOrEmpty(production_period)) q = q.Where(x => x.ProductionPeriod == production_period);
        return Ok(ApiResponse.Success(await q.OrderByDescending(x => x.SoDate).ToListAsync()));
    }

    [HttpGet("{soKey}/{soLine}")]
    public async Task<IActionResult> Get(string soKey, string soLine)
    {
        var so = await db.SalesOrders.FindAsync(soKey, soLine);
        if (so == null) return NotFound();
        var revisions = await db.SalesOrderRevisions.Where(x => x.SoKey == soKey && x.SoLine == soLine).OrderBy(x => x.Revision).ToListAsync();
        return Ok(ApiResponse.Success(new { order = so, revisions }));
    }

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance([FromQuery] string? destination_key, [FromQuery] string? production_period)
    {
        var q = db.SalesOrders.Where(x => x.QtyConfirmed > x.QtyInvoiced).AsQueryable();
        if (!string.IsNullOrEmpty(destination_key)) q = q.Where(x => x.DestinationKey == destination_key);
        if (!string.IsNullOrEmpty(production_period)) q = q.Where(x => x.ProductionPeriod == production_period);
        return Ok(ApiResponse.Success(await q.OrderBy(x => x.SoDate).ToListAsync()));
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import([FromBody] ImportDto dto)
    {
        foreach (var item in dto.Items)
        {
            var so = await db.SalesOrders.FindAsync(item.SoKey, item.SoLine);
            if (so == null)
            {
                so = new() { SoKey = item.SoKey, SoLine = item.SoLine, SoDate = item.SoDate, SoType = item.SoType, DestinationKey = item.DestinationKey, ProductKey = item.ProductKey, KitKey = item.KitKey, QtyConfirmed = item.Qty, ProductionPeriod = item.ProductionPeriod, StockType = item.StockType, Req1 = item.Req1, Req2 = item.Req2 };
                db.SalesOrders.Add(so);
                db.SalesOrderRevisions.Add(new() { SoKey = item.SoKey, SoLine = item.SoLine, Revision = 1, RevisionDate = DateTime.Now, RevisionType = "INITIAL", ProductKey = item.ProductKey, KitKey = item.KitKey, Qty = item.Qty, SoDate = item.SoDate, CountryName = item.CountryName, ToCity = item.ToCity, Currency = item.Currency, ProductionPeriod = item.ProductionPeriod, CustomerArea = item.CustomerArea, AgechCode = item.AgechCode, SoType = item.SoType, StockType = item.StockType, Req1 = item.Req1, Req2 = item.Req2, QtyBefore = 0, QtyAfter = item.Qty, ChangedBy = dto.ChangedBy });
            }
            else
            {
                var oldQty = so.QtyConfirmed;
                so.QtyConfirmed = item.Qty;
                so.ProductionPeriod = item.ProductionPeriod;
                so.StockType = item.StockType;
                so.Req1 = item.Req1;
                so.Req2 = item.Req2;
                if (oldQty != item.Qty)
                {
                    var maxRev = await db.SalesOrderRevisions.Where(x => x.SoKey == item.SoKey && x.SoLine == item.SoLine).MaxAsync(x => (int?)x.Revision) ?? 0;
                    db.SalesOrderRevisions.Add(new() { SoKey = item.SoKey, SoLine = item.SoLine, Revision = maxRev + 1, RevisionDate = DateTime.Now, RevisionType = "IMPORT", ProductKey = item.ProductKey, KitKey = item.KitKey, Qty = item.Qty, SoDate = item.SoDate, CountryName = item.CountryName, ToCity = item.ToCity, Currency = item.Currency, ProductionPeriod = item.ProductionPeriod, CustomerArea = item.CustomerArea, AgechCode = item.AgechCode, SoType = item.SoType, StockType = item.StockType, Req1 = item.Req1, Req2 = item.Req2, QtyBefore = oldQty, QtyAfter = item.Qty, ChangedBy = dto.ChangedBy });
                }
            }
        }
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { count = dto.Items.Length }));
    }

    [HttpPut("{soKey}/{soLine}")]
    public async Task<IActionResult> Update(string soKey, string soLine, [FromBody] UpdateSoDto dto)
    {
        var so = await db.SalesOrders.FindAsync(soKey, soLine);
        if (so == null) return NotFound();
        var oldQty = so.QtyConfirmed;
        so.QtyConfirmed = dto.QtyConfirmed;
        so.ProductionPeriod = dto.ProductionPeriod;
        so.StockType = dto.StockType;
        so.Req1 = dto.Req1;
        so.Req2 = dto.Req2;
        so.Remark = dto.Remark;
        if (oldQty != dto.QtyConfirmed)
        {
            var dest = await db.Destinations.FindAsync(so.DestinationKey);
            var country = dest?.CountryKey != null ? await db.Countries.FindAsync(dest.CountryKey) : null;
            var maxRev = await db.SalesOrderRevisions.Where(x => x.SoKey == soKey && x.SoLine == soLine).MaxAsync(x => (int?)x.Revision) ?? 0;
            db.SalesOrderRevisions.Add(new() { SoKey = soKey, SoLine = soLine, Revision = maxRev + 1, RevisionDate = DateTime.Now, RevisionType = "MANUAL", ProductKey = so.ProductKey, KitKey = so.KitKey, Qty = dto.QtyConfirmed, SoDate = so.SoDate, CountryName = country?.Name, ToCity = dest?.Name, ProductionPeriod = so.ProductionPeriod, CustomerArea = dest?.CustomerArea, AgechCode = dest?.AgechCode, SoType = so.SoType, StockType = so.StockType, Req1 = so.Req1, Req2 = so.Req2, QtyBefore = oldQty, QtyAfter = dto.QtyConfirmed, ChangedBy = dto.ChangedBy });
        }
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(so));
    }
}

public record UpdateSoDto(int QtyConfirmed, string? ProductionPeriod, string? StockType, string? Req1, string? Req2, string? Remark, string? ChangedBy);
public record ImportDto(ImportItemDto[] Items, string? ChangedBy);
public record ImportItemDto(string SoKey, string SoLine, string? ProductKey, string? KitKey, int Qty, DateOnly? SoDate, string? CountryName, string? ToCity, string? Currency, string? ProductionPeriod, string? CustomerArea, string? AgechCode, string? SoType, string? StockType, string? Req1, string? Req2, string? DestinationKey);
