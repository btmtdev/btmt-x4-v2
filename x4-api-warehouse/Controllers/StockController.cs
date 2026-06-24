using System.Data.Odbc;
using Microsoft.AspNetCore.Mvc;
using x4_api_warehouse.Data;
using x4_api_warehouse.Models;

namespace x4_api_warehouse.Controllers;

[Route("api/stock")]
[ApiController]
public class StockController : ControllerBase
{
    private readonly WarehouseDb _db;

    public StockController(WarehouseDb db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetStock()
    {
        var items = new List<Dictionary<string, object?>>();

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM Stock";

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            items.Add(row);
        }

        return Ok(new ApiResponse<List<Dictionary<string, object?>>>(true, items));
    }
}
