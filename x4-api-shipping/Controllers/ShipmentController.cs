using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_shipping.Data;
using x4_api_shipping.Data.Entities;
using x4_api_shipping.Models;

namespace x4_api_shipping.Controllers;

[ApiController]
[Route("api/shipments")]
public class ShipmentController(ShippingDbContext db) : ControllerBase
{
    // GET api/shipments/{invoiceKey}/events — full activity history
    [HttpGet("{invoiceKey}/events")]
    public async Task<IActionResult> GetEvents(string invoiceKey)
    {
        var events = await db.ShipmentEvents
            .Where(x => x.InvoiceKey == invoiceKey)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
        return Ok(ApiResponse.Success(events));
    }

    // POST api/shipments/release — release invoice to warehouse
    [HttpPost("release")]
    public async Task<IActionResult> Release([FromBody] ShipmentActionRequest req)
    {
        var invoice = await db.Invoices.FindAsync(req.InvoiceKey);
        if (invoice == null) return NotFound(ApiResponse.Error("Invoice not found"));
        if (invoice.Status == "released")
            return BadRequest(ApiResponse.Error("Already released"));

        invoice.Status = "released";
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { invoice.InvoiceKey, invoice.Revision, invoice.Status }));
    }

    // POST api/shipments/pullback — shipping user pulls back from WH (no WH approval needed)
    [HttpPost("pullback")]
    public async Task<IActionResult> PullBack([FromBody] ShipmentActionRequest req)
    {
        var invoice = await db.Invoices.FindAsync(req.InvoiceKey);
        if (invoice == null) return NotFound(ApiResponse.Error("Invoice not found"));
        if (invoice.Status == "draft")
            return BadRequest(ApiResponse.Error("Already in draft"));

        invoice.Status = "draft";
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { invoice.InvoiceKey, invoice.Revision, invoice.Status }));
    }

    // POST api/shipments/confirm — WH confirms with possible qty changes
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ShipmentConfirmRequest req)
    {
        var invoice = await db.Invoices.FindAsync(req.InvoiceKey);
        if (invoice == null) return NotFound(ApiResponse.Error("Invoice not found"));
        if (invoice.Status != "released")
            return BadRequest(ApiResponse.Error($"Cannot confirm: status is '{invoice.Status}'"));

        // Apply qty adjustments if any
        var changes = new List<object>();
        if (req.Items != null)
        {
            foreach (var adj in req.Items)
            {
                var item = await db.InvoiceItems
                    .FirstOrDefaultAsync(x => x.InvoiceKey == req.InvoiceKey && x.InvoiceItemNo == adj.InvoiceItemNo);
                if (item == null) continue;

                var oldQty = item.Qty;
                if (adj.QtyConfirmed != oldQty)
                {
                    item.Qty = adj.QtyConfirmed;
                    changes.Add(new { adj.InvoiceItemNo, qty_before = oldQty, qty_after = adj.QtyConfirmed });

                    // Update packing items for this SO line
                    var packItems = await db.PackingItems
                        .Where(x => x.InvoiceKey == req.InvoiceKey && x.SoKey == item.SoKey && x.SoLine == item.SoLine)
                        .ToListAsync();
                    var remaining = adj.QtyConfirmed;
                    foreach (var pi in packItems)
                    {
                        pi.Qty = Math.Min(pi.Qty, remaining);
                        remaining -= pi.Qty;
                        if (remaining <= 0) remaining = 0;
                    }

                    // Update sales order qty
                    if (item.SoKey != null && item.SoLine != null)
                    {
                        var so = await db.SalesOrders
                            .FirstOrDefaultAsync(x => x.SoKey == item.SoKey && x.SoLine == item.SoLine);
                        if (so != null)
                        {
                            so.QtyInvoiced += (adj.QtyConfirmed - oldQty);
                        }
                    }
                }
            }
        }

        invoice.Status = changes.Count > 0 ? "draft" : "picking";

        db.ShipmentEvents.Add(new TxShipmentEvent
        {
            InvoiceKey = invoice.InvoiceKey,
            Revision = invoice.Revision,
            EventType = "wh_confirm",
            EventData = JsonSerializer.Serialize(new { req.Remark, changes }),
            CreatedBy = req.UserId,
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { invoice.InvoiceKey, invoice.Revision, invoice.Status, changes }));
    }
}

// Request models
public record ShipmentActionRequest
{
    public string InvoiceKey { get; init; } = null!;
    public string UserId { get; init; } = null!;
    public string? Remark { get; init; }
}

public record ShipmentConfirmRequest
{
    public string InvoiceKey { get; init; } = null!;
    public string UserId { get; init; } = null!;
    public string? Remark { get; init; }
    public List<ConfirmItemAdjustment>? Items { get; init; }
}

public record ConfirmItemAdjustment
{
    public int InvoiceItemNo { get; init; }
    public int QtyConfirmed { get; init; }
}
