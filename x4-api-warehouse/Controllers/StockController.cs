using Microsoft.AspNetCore.Mvc;
using x4_api_warehouse.Services;

namespace x4_api_warehouse.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StockController(OdbcService db) : ControllerBase
{
    [HttpGet("test")]
    public async Task<IActionResult> TestConnection()
    {
        var result = await db.QueryAsync("SELECT 1 AS ok");
        return Ok(new { status = "connected", data = result });
    }
}
