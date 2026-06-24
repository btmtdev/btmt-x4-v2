using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using x4_api_tsg_shipment.Services;

namespace x4_api_tsg_shipment.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShipmentController(OracleService db) : ControllerBase
{
    [HttpGet("test")]
    public async Task<IActionResult> TestConnection()
    {
        var result = await db.QueryAsync("SELECT 1 AS ok FROM DUAL");
        return Ok(new { status = "connected", data = result });
    }

    [HttpGet("columns")]
    public async Task<IActionResult> GetColumns()
    {
        var result = await db.QueryAsync("SELECT COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'CURE_INS' ORDER BY COLUMN_ID");
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchBarcode([FromQuery] string? barcode, [FromQuery] string? product, [FromQuery] string? date_from, [FromQuery] string? date_to)
    {
        if (string.IsNullOrEmpty(barcode) && string.IsNullOrEmpty(product) && string.IsNullOrEmpty(date_from))
            return BadRequest(new { error = "At least one filter required" });

        var conditions = new List<string> { "SHIPMENT_COMP != 1" };
        var parameters = new List<OracleParameter>();

        if (!string.IsNullOrEmpty(barcode))
        {
            conditions.Add("BARCODE LIKE :barcode");
            parameters.Add(new OracleParameter("barcode", $"%{barcode}%"));
        }
        if (!string.IsNullOrEmpty(product))
        {
            conditions.Add("BARCODE LIKE :product");
            parameters.Add(new OracleParameter("product", $"{product}%"));
        }
        if (!string.IsNullOrEmpty(date_from))
        {
            conditions.Add("AGENT_DATE >= TO_DATE(:date_from, 'YYYY-MM-DD')");
            parameters.Add(new OracleParameter("date_from", date_from));
        }
        if (!string.IsNullOrEmpty(date_to))
        {
            conditions.Add("AGENT_DATE < TO_DATE(:date_to, 'YYYY-MM-DD') + 1");
            parameters.Add(new OracleParameter("date_to", date_to));
        }

        var where = string.Join(" AND ", conditions);
        var sql = $"SELECT BARCODE, MACHINENO, RECEIVE_DATE, AGENT_DATE, SORT_JUDGE, TSG_CONDITION FROM CURE_INS WHERE {where} AND ROWNUM <= 100 ORDER BY AGENT_DATE DESC";

        var result = await db.QueryAsync(sql, parameters.ToArray());
        return Ok(result);
    }
}
