using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data.Odbc;
using x4_api_quality.Data;
using x4_api_quality.Data.Entities;

namespace x4_api_quality.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlacklistController(QualityDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        await using var conn = new OdbcConnection(config.GetConnectionString("WarehouseOdbc"));
        await conn.OpenAsync();
        await using var cmd = new OdbcCommand("SELECT DISTINCT GT_Code FROM Size_Table ORDER BY GT_Code", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        var list = new List<string>();
        while (await reader.ReadAsync()) list.Add(reader.GetString(0).Trim());
        return Ok(list);
    }

    [HttpGet("inventory-search")]
    public async Task<IActionResult> InventorySearch([FromQuery] string? product, [FromQuery] string? date_from, [FromQuery] string? date_to, [FromQuery] string? tag_no)
    {
        if (string.IsNullOrEmpty(product) && string.IsNullOrEmpty(date_from) && string.IsNullOrEmpty(tag_no))
            return BadRequest(new { error = "At least one filter required" });

        var conditions = new List<string>();
        var parameters = new List<OdbcParameter>();

        if (!string.IsNullOrEmpty(product))
        {
            conditions.Add("a.GT_Code = ?");
            parameters.Add(new OdbcParameter { Value = product });
        }
        if (!string.IsNullOrEmpty(date_from))
        {
            conditions.Add("a.Received_Date >= ?");
            parameters.Add(new OdbcParameter { Value = DateTime.Parse(date_from) });
        }
        if (!string.IsNullOrEmpty(date_to))
        {
            conditions.Add("a.Received_Date <= ?");
            parameters.Add(new OdbcParameter { Value = DateTime.Parse(date_to).AddDays(1).AddSeconds(-1) });
        }
        if (!string.IsNullOrEmpty(tag_no))
        {
            conditions.Add("a.Tag_No LIKE ?");
            parameters.Add(new OdbcParameter { Value = $"%{tag_no}%" });
        }

        var where = string.Join(" AND ", conditions);
        var sql = $@"SELECT TOP 100 a.GT_Code, a.Tag_No, a.Quantity, a.Received_Date, a.Address_Code, a.Zone_Code, a.Tag_Hold_Flag, s.BSTL_Code, s.Pattern
            FROM Address_By_Size_Detail a
            INNER JOIN Size_Table s ON a.GT_Code = s.GT_Code AND a.CT_Flag = s.CT_Flag AND a.KK_Flag = s.KK_Flag
            WHERE {where} ORDER BY a.Received_Date DESC";

        await using var conn = new OdbcConnection(config.GetConnectionString("WarehouseOdbc"));
        await conn.OpenAsync();
        await using var cmd = new OdbcCommand(sql, conn);
        foreach (var p in parameters) cmd.Parameters.Add(p);
        await using var reader = await cmd.ExecuteReaderAsync();

        var results = new List<object>();
        while (await reader.ReadAsync())
        {
            results.Add(new
            {
                product_code = reader["GT_Code"]?.ToString()?.Trim(),
                barcode = reader["Tag_No"]?.ToString()?.Trim(),
                qty = reader["Quantity"],
                received_date = reader["Received_Date"],
                location = reader["Address_Code"]?.ToString()?.Trim(),
                zone = reader["Zone_Code"]?.ToString()?.Trim(),
                is_hold = reader["Tag_Hold_Flag"]?.ToString()?.Trim() == "T",
                bstl_code = reader["BSTL_Code"]?.ToString()?.Trim(),
                pattern = reader["Pattern"]?.ToString()?.Trim()
            });
        }
        return Ok(results);
    }
    [HttpGet]
    public async Task<IActionResult> GetRequests([FromQuery] string? status)
    {
        var query = db.BlacklistRequests.AsNoTracking().Include(x => x.Items).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(x => x.Status == status);
        var list = await query.OrderByDescending(x => x.RequestedDate).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRequest(int id)
    {
        var req = await db.BlacklistRequests.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        return req is null ? NotFound() : Ok(req);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRequest([FromBody] CreateBlacklistDto dto)
    {
        var reqNo = $"BL-{DateTime.Now:yyyyMMdd}-{DateTime.Now:HHmmss}";
        var request = new BlacklistRequest
        {
            RequestNo = reqNo,
            RequestedBy = dto.RequestedBy,
            Reason = dto.Reason,
            Items = dto.Items.Select(i => new BlacklistItem
            {
                Barcode = i.Barcode,
                ProductCode = i.ProductCode,
                ProductName = i.ProductName,
                ReceivedDate = i.ReceivedDate,
                Qty = i.Qty,
                Location = i.Location
            }).ToList()
        };
        db.BlacklistRequests.Add(request);
        await db.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveDto dto)
    {
        var req = await db.BlacklistRequests.FindAsync(id);
        if (req is null) return NotFound();
        req.Status = "Approved";
        req.ApprovedBy = dto.ApprovedBy;
        req.ApprovedDate = DateTime.Now;
        req.Remark = dto.Remark;
        await db.SaveChangesAsync();
        return Ok(req);
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ApproveDto dto)
    {
        var req = await db.BlacklistRequests.FindAsync(id);
        if (req is null) return NotFound();
        req.Status = "Rejected";
        req.ApprovedBy = dto.ApprovedBy;
        req.ApprovedDate = DateTime.Now;
        req.Remark = dto.Remark;
        await db.SaveChangesAsync();
        return Ok(req);
    }
}

public record CreateBlacklistDto(string RequestedBy, string Reason, List<BlacklistItemDto> Items);
public record BlacklistItemDto(string Barcode, string ProductCode, string? ProductName, DateTime? ReceivedDate, decimal Qty, string? Location);
public record ApproveDto(string ApprovedBy, string? Remark);
