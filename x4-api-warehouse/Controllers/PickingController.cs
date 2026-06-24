using System.Data.Odbc;
using Microsoft.AspNetCore.Mvc;
using x4_api_warehouse.Data;
using x4_api_warehouse.Models;

namespace x4_api_warehouse.Controllers;

[Route("api/picking")]
[ApiController]
public class PickingController : ControllerBase
{
    private readonly WarehouseDb _db;

    public PickingController(WarehouseDb db) => _db = db;

    /// <summary>Get pending delivery items available for picking (from Pre_GCOS)</summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingItems([FromQuery] string? whCode)
    {
        var items = new List<Dictionary<string, object?>>();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT p.WH_Code, p.Document_Type, p.Document_No, p.GT_Code, p.CT_Flag, p.KK_Flag, 
            p.Grade, p.Normal_Tyre_Flag, p.Order_Qty, p.Load_Qty, 
            (p.Order_Qty - p.Load_Qty) AS Remain_Qty, p.Customer_Code, p.GCOS_No,
            p.StockType, p.Req1, p.Req2
            FROM Pre_GCOS p
            WHERE (p.Order_Qty - p.Load_Qty) > 0 AND (p.GCOS_No IS NULL OR p.GCOS_No = '')
            ORDER BY p.Document_No, p.GT_Code";
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            items.Add(row);
        }
        return Ok(new ApiResponse<List<Dictionary<string, object?>>>(true, items));
    }

    /// <summary>Get existing picking documents</summary>
    [HttpGet]
    public async Task<IActionResult> GetPickingList([FromQuery] string? whCode)
    {
        var items = new List<Dictionary<string, object?>>();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT TOP 100 GCOS_No, WH_Code, Sales_Id, Delivery_Date, 
            GCOS_Status, Truck_Plate_No, Total_Order_Qty, Total_Load_Qty, Issued_By, Update_Date
            FROM GCOS_Head ORDER BY Update_Date DESC";
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            items.Add(row);
        }
        return Ok(new ApiResponse<List<Dictionary<string, object?>>>(true, items));
    }

    /// <summary>Create picking doc from selected delivery items</summary>
    [HttpPost]
    public async Task<IActionResult> CreatePicking([FromBody] CreatePickingRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
            return BadRequest(new ApiResponse<object>(false, null, new { error_code = "NO_ITEMS" }));

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var gcosNo = $"G{DateTime.Now:yyyyMMddHHmmss}";
        var totalQty = req.Items.Sum(x => x.OrderQty);
        var totalWeight = req.Items.Sum(x => x.StdWeight);

        // Insert GCOS_Head
        await using var cmdHead = conn.CreateCommand();
        cmdHead.CommandText = @"INSERT INTO GCOS_Head 
            (WH_Code, GCOS_No, Sales_Id, Delivery_Date, GCOS_Status, GCOS_Hold_Flag,
             Truck_Plate_No, Transport_Company_Code, Driver_Code, Normal_Cancel_Status,
             Delivery_Place_Line_1, Total_Order_Qty, Total_Load_Qty, Total_STD_Weight,
             Issued_By, Update_User, Update_Date, TransportType)
            VALUES (?, ?, ?, ?, '01', 'F', ?, ?, ?, 'N', ?, ?, 0, ?, ?, ?, GETDATE(), ?)";
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.WhCode ?? "TW" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = gcosNo });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.SalesId ?? "" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.DeliveryDate ?? DateTime.Today });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.TruckPlateNo ?? "" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.TransportCompanyCode ?? "" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.DriverCode ?? "" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.DeliveryPlace ?? "" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = totalQty });
        cmdHead.Parameters.Add(new OdbcParameter { Value = totalWeight });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.IssuedBy ?? "SYSTEM" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.IssuedBy ?? "SYSTEM" });
        cmdHead.Parameters.Add(new OdbcParameter { Value = req.TransportType ?? "" });
        await cmdHead.ExecuteNonQueryAsync();

        // Insert GCOS_Detail and update Pre_GCOS
        foreach (var item in req.Items)
        {
            await using var cmdDetail = conn.CreateCommand();
            cmdDetail.CommandText = @"INSERT INTO GCOS_Detail
                (WH_Code, GCOS_No, GT_Code, CT_Flag, KK_Flag, Grade, Normal_Tyre_Flag,
                 Order_Qty, Load_Qty, STD_Weight, Normal_Cancel_Status, Update_User, Update_Date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'N', ?, GETDATE())";
            cmdDetail.Parameters.Add(new OdbcParameter { Value = req.WhCode ?? "TW" });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = gcosNo });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = item.GtCode ?? "" });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = item.CtFlag ?? "" });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = item.KkFlag ?? "" });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = item.Grade ?? "" });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = item.NormalTyreFlag ?? "T" });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = item.OrderQty });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = item.StdWeight });
            cmdDetail.Parameters.Add(new OdbcParameter { Value = req.IssuedBy ?? "SYSTEM" });
            await cmdDetail.ExecuteNonQueryAsync();

            // Update Pre_GCOS: set Load_Qty and GCOS_No
            await using var cmdUpdate = conn.CreateCommand();
            cmdUpdate.CommandText = @"UPDATE Pre_GCOS SET Load_Qty = Load_Qty + ?, GCOS_No = ?, 
                Update_User = ?, Update_Date = GETDATE()
                WHERE WH_Code = ? AND Document_Type = ? AND Document_No = ? 
                AND GT_Code = ? AND CT_Flag = ? AND Grade = ?";
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = item.OrderQty });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = gcosNo });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = req.IssuedBy ?? "SYSTEM" });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = req.WhCode ?? "TW" });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = item.DocumentType ?? "" });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = item.DocumentNo ?? "" });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = item.GtCode ?? "" });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = item.CtFlag ?? "" });
            cmdUpdate.Parameters.Add(new OdbcParameter { Value = item.Grade ?? "" });
            await cmdUpdate.ExecuteNonQueryAsync();
        }

        return Ok(new ApiResponse<object>(true, new { gcos_no = gcosNo }));
    }

    /// <summary>Allocate inventory for selected items - find stock at address level</summary>
    [HttpPost("allocate")]
    public async Task<IActionResult> AllocateInventory([FromBody] List<AllocateRequest> items)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var allocations = new List<Dictionary<string, object?>>();
        foreach (var item in items)
        {
            await using var cmd = conn.CreateCommand();
            var sql = @"SELECT Zone_Code, Lot_Code, Address_Code, GT_Code, CT_Flag, KK_Flag, Grade,
                SUM(Total_Qty_Balance) AS Total_Qty_Balance, SUM(Available_Quantity) AS Available_Quantity,
                MIN(First_In_Date) AS First_In_Date,
                DATEDIFF(month, MIN(First_In_Date), GETDATE()) AS Age_Months
                FROM Address_By_Size_Head
                WHERE GT_Code = ? AND Grade = ? AND Total_Qty_Balance > 0 AND Address_Hold_Flag = 'F'";
            cmd.Parameters.Add(new OdbcParameter { Value = item.GtCode ?? "" });
            cmd.Parameters.Add(new OdbcParameter { Value = item.Grade ?? "" });

            if (!string.IsNullOrWhiteSpace(item.CtFlag))
            {
                sql += " AND CT_Flag = ?";
                cmd.Parameters.Add(new OdbcParameter { Value = item.CtFlag });
            }
            if (!string.IsNullOrWhiteSpace(item.KkFlag))
            {
                sql += " AND KK_Flag = ?";
                cmd.Parameters.Add(new OdbcParameter { Value = item.KkFlag });
            }

            sql += " GROUP BY Zone_Code, Lot_Code, Address_Code, GT_Code, CT_Flag, KK_Flag, Grade ORDER BY MIN(First_In_Date) ASC";
            cmd.CommandText = sql;
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var row = new Dictionary<string, object?>();
                for (int i = 0; i < reader.FieldCount; i++)
                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                allocations.Add(row);
            }
        }

        return Ok(new ApiResponse<List<Dictionary<string, object?>>>(true, allocations));
    }

    /// <summary>Print picking document</summary>
    [HttpGet("{gcosNo}/print")]
    public async Task<IActionResult> PrintPicking(string gcosNo)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT h.GCOS_No, h.Delivery_Date, h.Truck_Plate_No, h.Delivery_Place_Line_1,
            h.Total_Order_Qty, h.Issued_By,
            d.GT_Code, d.CT_Flag, d.Grade, d.Order_Qty, d.STD_Weight
            FROM GCOS_Head h
            JOIN GCOS_Detail d ON d.GCOS_No = h.GCOS_No AND d.WH_Code = h.WH_Code
            WHERE h.GCOS_No = ?";
        cmd.Parameters.Add(new OdbcParameter { Value = gcosNo });

        var rows = new List<Dictionary<string, object?>>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            rows.Add(row);
        }

        return Ok(new ApiResponse<List<Dictionary<string, object?>>>(true, rows));
    }
}
