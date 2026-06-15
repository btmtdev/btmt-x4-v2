using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_shipping.Data;
using x4_api_shipping.Data.Entities;
using x4_api_shipping.Models;

namespace x4_api_shipping.Controllers;

[ApiController]
[Route("api/invoices")]
public class InvoicesController(ShippingDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? month, [FromQuery] string? so_key, [FromQuery] string? so_line)
    {
        // If querying by SO, return invoices containing that SO line
        if (!string.IsNullOrEmpty(so_key))
        {
            var items = await db.InvoiceItems.Where(x => x.SoKey == so_key && (so_line == null || x.SoLine == so_line)).ToListAsync();
            var keys = items.Select(x => x.InvoiceKey).Distinct().ToList();
            var soInvoices = await db.Invoices.Where(x => keys.Contains(x.InvoiceKey)).ToListAsync();
            var dests = await db.Destinations.ToListAsync();
            var result = items.Select(it => {
                var inv = soInvoices.FirstOrDefault(x => x.InvoiceKey == it.InvoiceKey);
                var dest = dests.FirstOrDefault(d => d.PortKey == inv?.PortOfDestination);
                return new { it.InvoiceKey, inv?.Status, inv?.Etd, inv?.PortOfDestination, it.ProductKey, it.KitKey, destination_key = dest?.Key, destination_name = dest?.Name, it.Qty };
            }).ToList();
            return Ok(ApiResponse.Success(result));
        }
        var query = db.Invoices.AsQueryable();
        if (!string.IsNullOrEmpty(month) && month.Length == 7)
        {
            var year = int.Parse(month[..4]);
            var mon = int.Parse(month[5..]);
            var start = new DateOnly(year, mon, 1);
            var end = start.AddMonths(1).AddDays(-1);
            query = query.Where(x => x.Etd >= start && x.Etd <= end);
        }
        var invoices = await query.OrderByDescending(x => x.Etd).ToListAsync();
        var invoiceKeys = invoices.Select(x => x.InvoiceKey).ToList();
        var itemCounts = await db.InvoiceItems.Where(x => invoiceKeys.Contains(x.InvoiceKey)).GroupBy(x => x.InvoiceKey).Select(g => new { g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.Count);
        var list = invoices.Select(x => new { x.InvoiceKey, x.InvoiceDate, x.CustomerKey, x.Etd, x.Eta, x.PortOfDestination, x.EdiShipTo, x.BookingNo, x.Status, x.CountryCode, item_count = itemCounts.GetValueOrDefault(x.InvoiceKey, 0) });
        return Ok(ApiResponse.Success(list));
    }

    // GET api/invoices/next-number?etd=2026-06-14 — calculates next number (no reservation)
    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextNumber([FromQuery] DateOnly? etd)
    {
        var date = etd ?? DateOnly.FromDateTime(DateTime.Now);
        int year = date.Year;
        int month = date.Month;

        string yearChar = (year % 10) == 0 ? "X" : (year % 10).ToString();
        string monthChar = month switch { 10 => "X", 11 => "Y", 12 => "0", _ => month.ToString() };
        int decadeIdx = (year / 10 % 10) - 1;
        if (decadeIdx < 0) decadeIdx = 0;
        string decadeChar = ((char)('A' + decadeIdx)).ToString();
        string prefix = $"{yearChar}T{monthChar}{decadeChar}";

        var last = await db.Invoices
            .Where(x => x.InvoiceKey.StartsWith(prefix))
            .OrderByDescending(x => x.InvoiceKey)
            .Select(x => x.InvoiceKey)
            .FirstOrDefaultAsync();

        int nextRun = 1;
        if (last != null && last.Length >= 6)
        {
            string runPart = last.Substring(4, last.Length - 4);
            nextRun = DecodeBase36(runPart) + 1;
        }

        string nextKey = prefix + EncodeBase36(nextRun);
        return Ok(ApiResponse.Success(new { invoice_key = nextKey, prefix, running = nextRun }));
    }

    private static string EncodeBase36(int value)
    {
        const string digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var encoded = "";
        do { encoded = digits[value % 36] + encoded; } while ((value /= 36) != 0);
        return encoded.PadLeft(2, '0');
    }

    private static int DecodeBase36(string value)
    {
        const string digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        int decoded = 0;
        for (int i = 0; i < value.Length; i++)
            decoded += digits.IndexOf(char.ToUpper(value[i])) * (int)Math.Pow(36, value.Length - i - 1);
        return decoded;
    }

    [HttpGet("{invoiceKey}")]
    public async Task<IActionResult> Get(string invoiceKey)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();
        var items = await db.InvoiceItems.Where(x => x.InvoiceKey == invoiceKey).OrderBy(x => x.InvoiceItemNo).ToListAsync();
        var soKeys = items.Select(i => new { i.SoKey, i.SoLine }).ToList();
        var sos = await db.SalesOrders.Where(s => soKeys.Select(k => k.SoKey).Contains(s.SoKey)).ToListAsync();
        var itemsWithDest = items.Select(i => { var so = sos.FirstOrDefault(s => s.SoKey == i.SoKey && s.SoLine == i.SoLine); return new { i.InvoiceKey, i.InvoiceItemNo, i.SoKey, i.SoLine, i.ProductKey, i.KitKey, i.ProductType, i.Description, i.Qty, i.QtyPacked, i.StockType, i.Req1, i.Req2, destination_key = so?.DestinationKey }; }).ToList();
        var components = await db.InvoiceItemComponents.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var packing = await db.Packings.Where(x => x.InvoiceKey == invoiceKey).OrderBy(x => x.SeqNo).ToListAsync();
        var packingItems = await db.PackingItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        return Ok(ApiResponse.Success(new { invoice, items = itemsWithDest, components, packing, packing_items = packingItems }));
    }

    // POST api/invoices — create invoice header + items
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InvoiceSaveRequest req)
    {
        if (string.IsNullOrEmpty(req.InvoiceKey))
            return BadRequest(ApiResponse.Error("MISSING_INVOICE_KEY"));

        var existing = await db.Invoices.FindAsync(req.InvoiceKey);
        if (existing != null)
            return BadRequest(ApiResponse.Error("DUPLICATE", "Invoice already exists. Please Gen again."));

        var inv = new TxInvoice { InvoiceKey = req.InvoiceKey };
        inv.InvoiceDate = req.InvoiceDate;
        inv.Etd = req.Etd;
        inv.Eta = req.Eta;
        inv.PortOfDestination = req.PortOfDestination;
        inv.CarrierKey = req.CarrierKey;
        inv.CustomerKey = req.CustomerKey;

        // Auto-fill from customer
        if (!string.IsNullOrEmpty(req.CustomerKey))
        {
            var cust = await db.Customers.FirstOrDefaultAsync(x => x.Key == req.CustomerKey);
            if (cust != null)
            {
                inv.ConsignedTo1 = string.IsNullOrEmpty(req.ConsignedTo1) ? cust.Name : req.ConsignedTo1;
                inv.ConsignedTo2 = string.IsNullOrEmpty(req.ConsignedTo2) ? cust.Address1 : req.ConsignedTo2;
                inv.ConsignedTo3 = string.IsNullOrEmpty(req.ConsignedTo3) ? cust.Address2 : req.ConsignedTo3;
                inv.TermOfPay1 = string.IsNullOrEmpty(req.TermOfPay1) ? cust.TermOfPay1 : req.TermOfPay1;
                inv.TermOfPay2 = string.IsNullOrEmpty(req.TermOfPay2) ? cust.TermOfPay2 : req.TermOfPay2;
                inv.TermOfPay3 = string.IsNullOrEmpty(req.TermOfPay3) ? cust.TermOfPay3 : req.TermOfPay3;
                inv.TradeTerm = string.IsNullOrEmpty(req.TradeTerm) ? cust.TradeTerm : req.TradeTerm;
                inv.EdiShipFrom = string.IsNullOrEmpty(req.EdiShipFrom) ? cust.ShipFrom : req.EdiShipFrom;
                inv.PortOfLoad = string.IsNullOrEmpty(req.PortOfLoad) ? cust.EdiPort : req.PortOfLoad;
                inv.PortOfLoadName = string.IsNullOrEmpty(req.PortOfLoadName) ? cust.ShipFrom : req.PortOfLoadName;
                inv.ShipMark1 = string.IsNullOrEmpty(req.ShipMark1) ? cust.ShipMark1 : req.ShipMark1;
                inv.ShipMark2 = string.IsNullOrEmpty(req.ShipMark2) ? cust.ShipMark2 : req.ShipMark2;
                inv.ShipMark3 = string.IsNullOrEmpty(req.ShipMark3) ? cust.ShipMark3 : req.ShipMark3;
                inv.ShipMark4 = string.IsNullOrEmpty(req.ShipMark4) ? cust.ShipMark4 : req.ShipMark4;
                inv.ShipMark5 = string.IsNullOrEmpty(req.ShipMark5) ? cust.ShipMark5 : req.ShipMark5;
            }
        }

        // Auto-fill from port: port_of_discharge = country_code + port_code, country_code, port_name
        if (!string.IsNullOrEmpty(req.PortOfDestination))
        {
            var port = await db.Ports.FirstOrDefaultAsync(x => x.Key == req.PortOfDestination);
            if (port != null)
            {
                inv.CountryCode = req.CountryCode ?? port.CountryKey;
                inv.PortOfDischarge = req.PortOfDischarge ?? (port.CountryKey + port.Key);
                inv.EdiShipTo = req.EdiShipTo ?? port.Name;
            }
        }

        inv.PortOfLoadName = inv.PortOfLoadName ?? req.PortOfLoadName;
        inv.FeederVessel = req.FeederVessel;
        inv.MotherVessel = req.MotherVessel;
        inv.ContractNo = req.ContractNo;
        inv.LcNo = req.LcNo;
        inv.LcDate = req.LcDate;
        inv.DescOfGoods1 = req.DescOfGoods1;
        inv.DescOfGoods2 = req.DescOfGoods2;
        inv.ShipingRemark1 = req.ShipingRemark1;
        inv.ShipingRemark2 = req.ShipingRemark2;
        inv.VoyageNo = req.VoyageNo;
        inv.BlNo = req.BlNo;
        inv.BookingNo = req.BookingNo;
        inv.Schedule = req.Schedule;
        inv.EdiShipTo = req.EdiShipTo;
        inv.Revision = 0;
        inv.Status = "draft";
        db.Invoices.Add(inv);

        // Save items
        if (req.Items != null)
        {
            int itemNo = 1;
            foreach (var it in req.Items)
            {
                var prod = !string.IsNullOrEmpty(it.ProductKey) ? await db.Products.FindAsync(it.ProductKey) : null;
                db.InvoiceItems.Add(new TxInvoiceItem
                {
                    InvoiceKey = req.InvoiceKey,
                    InvoiceItemNo = it.InvoiceItemNo ?? itemNo,
                    SoKey = it.SoKey,
                    SoLine = it.SoLine,
                    ProductKey = it.ProductKey,
                    KitKey = it.KitKey,
                    ProductType = it.ProductType ?? prod?.Type,
                    Description = it.Description,
                    Qty = it.Qty,
                    QtyPacked = 0,
                    StockType = it.StockType,
                    Req1 = it.Req1,
                    Req2 = it.Req2,
                });
                // Generate components from kitting_bom
                var so2 = await db.SalesOrders.FirstOrDefaultAsync(x => x.SoKey == it.SoKey && x.SoLine == it.SoLine);
                // Generate components: if kit_key has BOM, use it; otherwise product itself for T/C/F
                DateOnly ppDate = default;
                if (so2 != null && !string.IsNullOrEmpty(so2.ProductionPeriod) && so2.ProductionPeriod.Length >= 6)
                    ppDate = new DateOnly(int.Parse(so2.ProductionPeriod[..4]), int.Parse(so2.ProductionPeriod[4..6]), 1);

                var boms = await db.KittingBoms.Where(b => b.ProductKey == it.ProductKey && b.KitKey == it.KitKey && b.IsActive).ToListAsync();
                if (boms.Count == 0 && !string.IsNullOrEmpty(it.KitKey))
                    boms = await db.KittingBoms.Where(b => b.ProductKey == it.ProductKey && b.IsActive).ToListAsync();

                if (boms.Count > 0)
                {
                    foreach (var bom in boms)
                    {
                        var compProd = !string.IsNullOrEmpty(bom.ComponentKey) ? await db.Products.FindAsync(bom.ComponentKey) : null;
                        int unitPrice = 0;
                        if (ppDate != default)
                        {
                            var price = await db.ProductPrices.FirstOrDefaultAsync(pp => pp.ProductKey == bom.ComponentKey && pp.SoType == so2!.SoType && pp.IsActive && pp.EffectiveFrom <= ppDate && pp.EffectiveTo >= ppDate);
                            if (price != null) unitPrice = (int)price.Price;
                        }
                        db.InvoiceItemComponents.Add(new TxInvoiceItemComponent
                        {
                            InvoiceKey = req.InvoiceKey, InvoiceItemNo = it.InvoiceItemNo ?? itemNo,
                            ComponentType = bom.ComponentType, ProductKey = bom.ComponentKey,
                            UnitPrice = unitPrice, UnitWeight = compProd != null ? (double)compProd.NetWeight : 0, UnitVolume = compProd != null ? (double)compProd.Volume : 0,
                        });
                    }
                }
                else
                {
                    var prodType = prod?.Type?.ToUpper();
                    if (prodType == "T" || prodType == "C" || prodType == "F")
                    {
                        int unitPrice = 0;
                        if (ppDate != default)
                        {
                            var price = await db.ProductPrices.FirstOrDefaultAsync(pp => pp.ProductKey == it.ProductKey && pp.SoType == so2!.SoType && pp.IsActive && pp.EffectiveFrom <= ppDate && pp.EffectiveTo >= ppDate);
                            if (price != null) unitPrice = (int)price.Price;
                        }
                        db.InvoiceItemComponents.Add(new TxInvoiceItemComponent
                        {
                            InvoiceKey = req.InvoiceKey, InvoiceItemNo = it.InvoiceItemNo ?? itemNo,
                            ComponentType = prodType, ProductKey = it.ProductKey,
                            UnitPrice = unitPrice, UnitWeight = (double?)prod?.NetWeight ?? 0, UnitVolume = (double?)prod?.Volume ?? 0,
                        });
                    }
                }
                // Deduct from SO
                var so = await db.SalesOrders.FirstOrDefaultAsync(x => x.SoKey == it.SoKey && x.SoLine == it.SoLine);
                if (so != null) so.QtyInvoiced += it.Qty;
                itemNo++;
            }
        }

        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { inv.InvoiceKey, inv.Status }));
    }

    // PUT api/invoices/{invoiceKey} — update header + items
    [HttpPut("{invoiceKey}")]
    public async Task<IActionResult> Update(string invoiceKey, [FromBody] InvoiceSaveRequest req)
    {
        var inv = await db.Invoices.FindAsync(invoiceKey);
        if (inv == null) return NotFound();

        // Update header fields
        inv.InvoiceDate = req.InvoiceDate ?? inv.InvoiceDate;
        inv.Etd = req.Etd ?? inv.Etd;
        inv.Eta = req.Eta ?? inv.Eta;
        inv.PortOfDestination = req.PortOfDestination ?? inv.PortOfDestination;
        inv.PortOfDischarge = req.PortOfDischarge ?? inv.PortOfDischarge;
        inv.PortOfLoad = req.PortOfLoad ?? inv.PortOfLoad;
        inv.PortOfLoadName = req.PortOfLoadName ?? inv.PortOfLoadName;
        inv.ConsignedTo1 = req.ConsignedTo1 ?? inv.ConsignedTo1;
        inv.ConsignedTo2 = req.ConsignedTo2 ?? inv.ConsignedTo2;
        inv.ConsignedTo3 = req.ConsignedTo3 ?? inv.ConsignedTo3;
        inv.FeederVessel = req.FeederVessel ?? inv.FeederVessel;
        inv.MotherVessel = req.MotherVessel ?? inv.MotherVessel;
        inv.ContractNo = req.ContractNo ?? inv.ContractNo;
        inv.LcNo = req.LcNo ?? inv.LcNo;
        inv.LcDate = req.LcDate ?? inv.LcDate;
        inv.TermOfPay1 = req.TermOfPay1 ?? inv.TermOfPay1;
        inv.TermOfPay2 = req.TermOfPay2 ?? inv.TermOfPay2;
        inv.TermOfPay3 = req.TermOfPay3 ?? inv.TermOfPay3;
        inv.TradeTerm = req.TradeTerm ?? inv.TradeTerm;
        inv.DescOfGoods1 = req.DescOfGoods1 ?? inv.DescOfGoods1;
        inv.DescOfGoods2 = req.DescOfGoods2 ?? inv.DescOfGoods2;
        inv.ShipMark1 = req.ShipMark1 ?? inv.ShipMark1;
        inv.ShipMark2 = req.ShipMark2 ?? inv.ShipMark2;
        inv.ShipMark3 = req.ShipMark3 ?? inv.ShipMark3;
        inv.ShipMark4 = req.ShipMark4 ?? inv.ShipMark4;
        inv.ShipMark5 = req.ShipMark5 ?? inv.ShipMark5;
        inv.ShipingRemark1 = req.ShipingRemark1 ?? inv.ShipingRemark1;
        inv.ShipingRemark2 = req.ShipingRemark2 ?? inv.ShipingRemark2;
        inv.VoyageNo = req.VoyageNo ?? inv.VoyageNo;
        inv.BlNo = req.BlNo ?? inv.BlNo;
        inv.CountryCode = req.CountryCode ?? inv.CountryCode;
        inv.BookingNo = req.BookingNo ?? inv.BookingNo;
        inv.Schedule = req.Schedule ?? inv.Schedule;
        inv.EdiShipFrom = req.EdiShipFrom ?? inv.EdiShipFrom;
        inv.EdiShipTo = req.EdiShipTo ?? inv.EdiShipTo;
        inv.CarrierKey = req.CarrierKey ?? inv.CarrierKey;
        inv.CustomerKey = req.CustomerKey ?? inv.CustomerKey;
        // Auto-resolve customer_key from consigned_to_1
        if (string.IsNullOrEmpty(inv.CustomerKey) && !string.IsNullOrEmpty(inv.ConsignedTo1))
        {
            var cust = await db.Customers.FirstOrDefaultAsync(x => x.Name == inv.ConsignedTo1);
            if (cust != null) inv.CustomerKey = cust.Key;
        }

        // Replace items if provided
        if (req.Items != null)
        {
            var oldItems = await db.InvoiceItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
            // Reverse SO qty
            foreach (var old in oldItems)
            {
                var so = await db.SalesOrders.FirstOrDefaultAsync(x => x.SoKey == old.SoKey && x.SoLine == old.SoLine);
                if (so != null) so.QtyInvoiced -= old.Qty;
            }
            db.InvoiceItems.RemoveRange(oldItems);
            var oldComps = await db.InvoiceItemComponents.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
            db.InvoiceItemComponents.RemoveRange(oldComps);

            int itemNo = 1;
            foreach (var it in req.Items)
            {
                var prod = !string.IsNullOrEmpty(it.ProductKey) ? await db.Products.FindAsync(it.ProductKey) : null;
                db.InvoiceItems.Add(new TxInvoiceItem
                {
                    InvoiceKey = invoiceKey,
                    InvoiceItemNo = it.InvoiceItemNo ?? itemNo,
                    SoKey = it.SoKey, SoLine = it.SoLine,
                    ProductKey = it.ProductKey, KitKey = it.KitKey,
                    ProductType = it.ProductType ?? prod?.Type, Description = it.Description,
                    Qty = it.Qty, QtyPacked = 0,
                    StockType = it.StockType, Req1 = it.Req1, Req2 = it.Req2,
                });
                // Lookup SO for component pricing
                var so = await db.SalesOrders.FirstOrDefaultAsync(x => x.SoKey == it.SoKey && x.SoLine == it.SoLine);
                // Generate components: if kit_key has BOM, use it; otherwise product itself for T/C/F
                DateOnly ppDate = default;
                if (so != null && !string.IsNullOrEmpty(so.ProductionPeriod) && so.ProductionPeriod.Length >= 6)
                    ppDate = new DateOnly(int.Parse(so.ProductionPeriod[..4]), int.Parse(so.ProductionPeriod[4..6]), 1);

                var boms = await db.KittingBoms.Where(b => b.ProductKey == it.ProductKey && b.KitKey == it.KitKey && b.IsActive).ToListAsync();
                if (boms.Count == 0 && !string.IsNullOrEmpty(it.KitKey))
                    boms = await db.KittingBoms.Where(b => b.ProductKey == it.ProductKey && b.IsActive).ToListAsync();

                if (boms.Count > 0)
                {
                    foreach (var bom in boms)
                    {
                        var compProd = !string.IsNullOrEmpty(bom.ComponentKey) ? await db.Products.FindAsync(bom.ComponentKey) : null;
                        int unitPrice = 0;
                        if (ppDate != default)
                        {
                            var price = await db.ProductPrices.FirstOrDefaultAsync(pp => pp.ProductKey == bom.ComponentKey && pp.SoType == so!.SoType && pp.IsActive && pp.EffectiveFrom <= ppDate && pp.EffectiveTo >= ppDate);
                            if (price != null) unitPrice = (int)price.Price;
                        }
                        db.InvoiceItemComponents.Add(new TxInvoiceItemComponent
                        {
                            InvoiceKey = invoiceKey, InvoiceItemNo = it.InvoiceItemNo ?? itemNo,
                            ComponentType = bom.ComponentType, ProductKey = bom.ComponentKey,
                            UnitPrice = unitPrice, UnitWeight = compProd != null ? (double)compProd.NetWeight : 0, UnitVolume = compProd != null ? (double)compProd.Volume : 0,
                        });
                    }
                }
                else
                {
                    var prodType = prod?.Type?.ToUpper();
                    if (prodType == "T" || prodType == "C" || prodType == "F")
                    {
                        int unitPrice = 0;
                        if (ppDate != default)
                        {
                            var price = await db.ProductPrices.FirstOrDefaultAsync(pp => pp.ProductKey == it.ProductKey && pp.SoType == so!.SoType && pp.IsActive && pp.EffectiveFrom <= ppDate && pp.EffectiveTo >= ppDate);
                            if (price != null) unitPrice = (int)price.Price;
                        }
                        db.InvoiceItemComponents.Add(new TxInvoiceItemComponent
                        {
                            InvoiceKey = invoiceKey, InvoiceItemNo = it.InvoiceItemNo ?? itemNo,
                            ComponentType = prodType, ProductKey = it.ProductKey,
                            UnitPrice = unitPrice, UnitWeight = (double?)prod?.NetWeight ?? 0, UnitVolume = (double?)prod?.Volume ?? 0,
                        });
                    }
                }
                if (so != null) so.QtyInvoiced += it.Qty;
                itemNo++;
            }
        }

        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { inv.InvoiceKey, inv.Status }));
    }

    // POST api/invoices/{invoiceKey}/packing/auto-gen — auto-generate packing by volume
    [HttpPost("{invoiceKey}/packing/auto-gen")]
    public async Task<IActionResult> AutoGenPacking(string invoiceKey, [FromBody] PackingAutoGenRequest req)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();
        if (invoice.Status != "draft")
            return BadRequest(ApiResponse.Error("NOT_DRAFT", "Can only generate packing in draft"));

        var items = await db.InvoiceItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        if (items.Count == 0)
            return BadRequest(ApiResponse.Error("NO_ITEMS", "No invoice items to pack"));

        // Get container max volume
        var container = await db.Containers.FirstOrDefaultAsync(x => x.Key == req.ContainerType);
        double maxVol = container?.VolumeMax ?? req.MaxVolume ?? 67.0;

        // Get product volumes
        var productKeys = items.Select(x => x.ProductKey).Distinct().ToList();
        var products = await db.Products.Where(x => productKeys.Contains(x.Key)).ToDictionaryAsync(x => x.Key, x => x);

        // Remove existing packing for unlocked sequences only
        var existingPacking = await db.Packings.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var existingPackItems = await db.PackingItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();

        // Keep locked sequences
        var lockedSeqs = req.LockedSeqs ?? new List<int>();
        var lockedPackItems = existingPackItems.Where(x => lockedSeqs.Contains(x.SeqNo)).ToList();
        var lockedHeaders = existingPacking.Where(x => lockedSeqs.Contains(x.SeqNo)).ToList();

        // Calculate remaining qty to pack (subtract locked packed qty)
        var lockedQtyByItem = lockedPackItems
            .GroupBy(x => new { x.SoKey, x.SoLine })
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Qty));

        // Build items to pack
        var toPack = new List<(TxInvoiceItem item, int qty, double unitVol)>();
        foreach (var item in items)
        {
            int alreadyLocked = lockedQtyByItem.GetValueOrDefault(new { item.SoKey, item.SoLine });
            int remaining = item.Qty - alreadyLocked;
            if (remaining <= 0) continue;
            double unitVol = (double)(products.GetValueOrDefault(item.ProductKey ?? "")?.Volume ?? 0.001m);
            toPack.Add((item, remaining, unitVol));
        }

        // Bin-packing: first-fit decreasing
        var containers = new List<(int seqNo, double usedVol, List<(TxInvoiceItem item, int qty)> packed)>();
        int nextSeq = (lockedSeqs.Count > 0 ? lockedSeqs.Max() : 0) + 1;

        // Sort by total volume desc for better packing
        toPack.Sort((a, b) => (b.qty * b.unitVol).CompareTo(a.qty * a.unitVol));

        foreach (var (item, qty, unitVol) in toPack)
        {
            int remaining = qty;
            while (remaining > 0)
            {
                // Try fit into existing container
                bool placed = false;
                foreach (var c in containers)
                {
                    double space = maxVol - c.usedVol;
                    int canFit = unitVol > 0 ? (int)(space / unitVol) : remaining;
                    if (canFit <= 0) continue;
                    int toPlace = Math.Min(canFit, remaining);
                    c.packed.Add((item, toPlace));
                    containers[containers.IndexOf(c)] = (c.seqNo, c.usedVol + toPlace * unitVol, c.packed);
                    remaining -= toPlace;
                    placed = true;
                    break;
                }
                if (!placed)
                {
                    // New container
                    int canFit = unitVol > 0 ? (int)(maxVol / unitVol) : remaining;
                    int toPlace = Math.Min(Math.Max(canFit, 1), remaining);
                    var packed = new List<(TxInvoiceItem item, int qty)> { (item, toPlace) };
                    containers.Add((nextSeq++, toPlace * unitVol, packed));
                    remaining -= toPlace;
                }
            }
        }

        // Return result without saving to DB
        var resultPacking = new List<object>();
        var resultPackItems = new List<object>();
        // Include locked
        foreach (var lh in lockedHeaders)
            resultPacking.Add(new { seq_no = lh.SeqNo, container_type = lh.ContainerType, container_no = lh.ContainerNo, loading_date = lh.LoadingDate, loading_time_period = lh.LoadingTimePeriod });
        foreach (var li in lockedPackItems)
            resultPackItems.Add(new { seq_no = li.SeqNo, so_key = li.SoKey, so_line = li.SoLine, product_key = li.ProductKey, kit_key = li.KitKey, description = li.Description, qty = li.Qty, volume = li.Volume });
        // Include generated
        foreach (var (seqNo, usedVol, packed) in containers)
        {
            resultPacking.Add(new { seq_no = seqNo, container_type = req.ContainerType, container_no = (string?)null, loading_date = (DateOnly?)null, loading_time_period = (string?)null });
            foreach (var (item, pQty) in packed)
            {
                double unitVol = (double)(products.GetValueOrDefault(item.ProductKey ?? "")?.Volume ?? 0.001m);
                resultPackItems.Add(new { seq_no = seqNo, so_key = item.SoKey, so_line = item.SoLine, product_key = item.ProductKey, kit_key = item.KitKey, description = item.Description, qty = pQty, volume = Math.Round(pQty * unitVol, 4) });
            }
        }

        return Ok(ApiResponse.Success(new { packing = resultPacking, packing_items = resultPackItems, containers_generated = containers.Count }));
    }

    [HttpDelete("{invoiceKey}")]
    public async Task<IActionResult> Delete(string invoiceKey)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();
        var hasItems = await db.InvoiceItems.AnyAsync(x => x.InvoiceKey == invoiceKey);
        if (hasItems) return BadRequest(ApiResponse.Error("HAS_ITEMS", "Cannot delete invoice with items"));
        db.Invoices.Remove(invoice);
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success("OK"));
    }

    // PUT api/invoices/{invoiceKey}/packing — manual save packing (for manual edits)
    [HttpPut("{invoiceKey}/packing")]
    public async Task<IActionResult> SavePacking(string invoiceKey, [FromBody] PackingSaveRequest req)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();

        // Replace all packing
        var oldP = await db.Packings.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var oldPI = await db.PackingItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        db.Packings.RemoveRange(oldP);
        db.PackingItems.RemoveRange(oldPI);

        if (req.Packing != null)
        {
            foreach (var p in req.Packing)
            {
                db.Packings.Add(new TxPacking
                {
                    InvoiceKey = invoiceKey, SeqNo = p.SeqNo,
                    ContainerNo = p.ContainerNo, ContainerType = p.ContainerType,
                    LoadingDate = p.LoadingDate, LoadingTimePeriod = p.LoadingTimePeriod, Remark = p.Remark,
                });
                if (p.Items != null)
                {
                    foreach (var pi in p.Items)
                    {
                        db.PackingItems.Add(new TxPackingItem
                        {
                            InvoiceKey = invoiceKey, SeqNo = p.SeqNo,
                            SoKey = pi.SoKey, SoLine = pi.SoLine,
                            ProductKey = pi.ProductKey, KitKey = pi.KitKey,
                            Description = pi.Description, Qty = pi.Qty, Volume = pi.Volume,
                        });
                    }
                }
            }
        }

        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success("OK"));
    }
}

// --- Request DTOs ---

public record InvoiceSaveRequest
{
    public string? InvoiceKey { get; init; }
    public DateOnly? InvoiceDate { get; init; }
    public DateOnly? Etd { get; init; }
    public DateOnly? Eta { get; init; }
    public string? PortOfDestination { get; init; }
    public string? PortOfDischarge { get; init; }
    public string? PortOfLoad { get; init; }
    public string? PortOfLoadName { get; init; }
    public string? ConsignedTo1 { get; init; }
    public string? ConsignedTo2 { get; init; }
    public string? ConsignedTo3 { get; init; }
    public string? FeederVessel { get; init; }
    public string? MotherVessel { get; init; }
    public string? ContractNo { get; init; }
    public string? LcNo { get; init; }
    public DateOnly? LcDate { get; init; }
    public string? TermOfPay1 { get; init; }
    public string? TermOfPay2 { get; init; }
    public string? TermOfPay3 { get; init; }
    public string? TradeTerm { get; init; }
    public string? DescOfGoods1 { get; init; }
    public string? DescOfGoods2 { get; init; }
    public string? ShipMark1 { get; init; }
    public string? ShipMark2 { get; init; }
    public string? ShipMark3 { get; init; }
    public string? ShipMark4 { get; init; }
    public string? ShipMark5 { get; init; }
    public string? ShipingRemark1 { get; init; }
    public string? ShipingRemark2 { get; init; }
    public string? VoyageNo { get; init; }
    public string? BlNo { get; init; }
    public string? CountryCode { get; init; }
    public string? BookingNo { get; init; }
    public DateTime? Schedule { get; init; }
    public string? EdiShipFrom { get; init; }
    public string? EdiShipTo { get; init; }
    public string? CarrierKey { get; init; }
    public string? CustomerKey { get; init; }
    public List<InvoiceItemDto>? Items { get; init; }
}

public record InvoiceItemDto
{
    public int? InvoiceItemNo { get; init; }
    public string? SoKey { get; init; }
    public string? SoLine { get; init; }
    public string? ProductKey { get; init; }
    public string? KitKey { get; init; }
    public string? ProductType { get; init; }
    public string? Description { get; init; }
    public int Qty { get; init; }
    public string? StockType { get; init; }
    public string? Req1 { get; init; }
    public string? Req2 { get; init; }
}

public record PackingAutoGenRequest
{
    public string? ContainerType { get; init; }
    public double? MaxVolume { get; init; }
    public DateOnly? LoadingDate { get; init; }
    public List<int>? LockedSeqs { get; init; } // container seqs to keep as-is
}

public record PackingSaveRequest
{
    public List<PackingDto>? Packing { get; init; }
}

public record PackingDto
{
    public int SeqNo { get; init; }
    public string? ContainerNo { get; init; }
    public string? ContainerType { get; init; }
    public DateOnly? LoadingDate { get; init; }
    public string? LoadingTimePeriod { get; init; }
    public string? Remark { get; init; }
    public List<PackingItemDto>? Items { get; init; }
}

public record PackingItemDto
{
    public string SoKey { get; init; } = null!;
    public string SoLine { get; init; } = null!;
    public string? ProductKey { get; init; }
    public string? KitKey { get; init; }
    public string? Description { get; init; }
    public int Qty { get; init; }
    public double Volume { get; init; }
}
