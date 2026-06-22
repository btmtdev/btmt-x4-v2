using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using x4_api_shipping.Data;
using x4_api_shipping.Models;

namespace x4_api_shipping.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController(ShippingDbContext db) : ControllerBase
{
    // SAP Export: Tab-delimited shipping delivery file
    // Filename: SAP_SI_{INVOICENO}_{DATETIMESTAMP}.txt
    [HttpGet("sap/{invoiceKey}")]
    public async Task<IActionResult> ExportSap(string invoiceKey)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();

        var packingItems = await db.PackingItems.Where(x => x.InvoiceKey == invoiceKey).OrderBy(x => x.SeqNo).ToListAsync();
        var packings = await db.Packings.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("DONo\tLineNo\tFG\tInvoiceNo\tSeqNo\tItemLineNo\tPlant\tBSJProductCode\tSetCode\tQtyConfirm\tLoadingDate\tProcessingDate");

        var grouped = packingItems.GroupBy(x => x.SeqNo).ToList();
        foreach (var group in grouped)
        {
            var packing = packings.FirstOrDefault(p => p.SeqNo == group.Key);
            var loadingDate = packing?.LoadingDate?.ToString("yyyyMMdd") ?? DateTime.Now.ToString("yyyyMMdd");
            var items = group.ToList();
            int lineNo = 1;

            foreach (var item in items)
            {
                string fg = items.Count > 1 ? "1" : "";
                string itemLineNo = (lineNo * 10).ToString("00");
                sb.AppendLine($"{item.SoKey}\t{item.SoLine}\t{fg}\t{invoiceKey}\t{group.Key:00}\t{itemLineNo}\tBTMT\t{item.ProductKey}\t{item.KitKey}\t{item.Qty}\t{loadingDate}\t{DateTime.Now:yyyyMMdd}");
                lineNo++;
            }
        }

        var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
        var fileName = $"SAP_SI_{invoiceKey}_{timestamp}.txt";
        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/plain", fileName);
    }

    // PSP Header file
    // Filename: PSP_{CUSTOMER}_H_{INVOICE}_{DATETIMESTAMP}.txt
    [HttpGet("psp-h/{invoiceKey}")]
    public async Task<IActionResult> ExportPspHeader(string invoiceKey)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();

        var packings = await db.Packings.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var packingItems = await db.PackingItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var items = await db.InvoiceItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var components = await db.InvoiceItemComponents.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var boms = await db.KittingBoms.Where(b => b.IsActive).ToListAsync();
        var dest = await db.Destinations.FirstOrDefaultAsync(d => d.PortKey == invoice.PortOfDestination);

        // Calculate total measurement from components (applying BOM multiplier for kitting)
        double totalMeasurement = 0;
        foreach (var pi in packingItems)
        {
            var item = items.FirstOrDefault(it => it.SoKey == pi.SoKey && it.SoLine == pi.SoLine);
            if (item == null) continue;
            var itemComps = components.Where(c => c.InvoiceItemNo == item.InvoiceItemNo).ToList();
            foreach (var comp in itemComps)
            {
                var bom = boms.FirstOrDefault(b => b.ProductKey == item.ProductKey && b.KitKey == item.KitKey && b.ComponentType == comp.ComponentType)
                       ?? boms.FirstOrDefault(b => b.ProductKey == item.ProductKey && b.ComponentType == comp.ComponentType);
                int compQty = pi.Qty * (bom?.Quantity ?? 1);
                totalMeasurement += compQty * (comp.UnitVolume ?? 0);
            }
        }

        var sb = new StringBuilder();
        sb.Append((invoiceKey ?? "").PadRight(13)[..13]);
        sb.Append(invoice.InvoiceDate?.ToString("yyyyMMdd") ?? "        ");
        sb.Append(invoice.Etd?.ToString("yyyyMMdd") ?? "        ");
        sb.Append(invoice.Eta?.ToString("yyyyMMdd") ?? "        ");
        sb.Append(packings.Count(p => p.ContainerType == "40F").ToString("000"));
        sb.Append(packings.Count(p => p.ContainerType == "40HC").ToString("000"));
        sb.Append(packings.Count(p => p.ContainerType == "20F").ToString("000"));
        sb.Append((invoice.ShipMark1 ?? "").PadRight(45)[..45]);
        sb.Append((invoice.ShipMark2 ?? "").PadRight(45)[..45]);
        sb.Append((invoice.ShipMark3 ?? "").PadRight(45)[..45]);
        sb.Append((invoice.ShipMark4 ?? "").PadRight(45)[..45]);
        sb.Append((invoice.ShipMark5 ?? "").PadRight(45)[..45]);
        sb.Append("".PadRight(45)); // ShipMark6
        sb.Append("".PadRight(45)); // ShipMark7
        sb.Append((invoice.FeederVessel ?? "").PadRight(30)[..30]);
        sb.Append((invoice.MotherVessel ?? "").PadRight(30)[..30]);
        sb.Append((invoice.EdiShipFrom ?? "").PadRight(30)[..30]);
        sb.Append((dest?.Name ?? "").PadRight(40)[..40]);
        sb.Append((invoice.DescOfGoods1 ?? "").PadRight(237)[..237]);
        sb.Append(packingItems.Count.ToString("000"));
        sb.Append((invoice.VoyageNo ?? "").PadRight(12)[..12]);
        sb.Append((invoice.PortOfDischarge ?? "").PadRight(5)[..5]);
        sb.Append(invoice.ConfirmDate?.ToString("yyyyMMdd") ?? "        ");
        sb.Append(invoice.Etd?.ToString("yyyyMMdd") ?? "        "); // BL Date
        sb.Append((invoice.BlNo ?? "").PadRight(20)[..20]);
        sb.Append(totalMeasurement.ToString("00000.000000").PadRight(12)[..12]);
        sb.Append("".PadRight(12)); // BLFreightCost1
        sb.Append("".PadRight(20)); // BLNO2
        sb.Append("".PadRight(12)); // BLFreightM32
        sb.Append("".PadRight(12)); // BLFreightCost2
        sb.Append("".PadRight(12)); // CollectCharge
        sb.Append(DateTime.Now.ToString("yyyyMMdd"));
        sb.Append((invoice.PortOfLoad ?? "").PadRight(10)[..10]);
        sb.Append("THB".PadRight(3)); // Currency
        sb.AppendLine();

        var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
        var fileName = $"PSP_{invoice.CustomerKey ?? "X"}_H_{invoiceKey}_{timestamp}.txt";
        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/plain", fileName);
    }

    // PSP Detail file — one line per packing item per component type
    // Filename: PSP_{CUSTOMER}_D_{INVOICE}_{DATETIMESTAMP}.txt
    [HttpGet("psp-d/{invoiceKey}")]
    public async Task<IActionResult> ExportPspDetail(string invoiceKey)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();

        var items = await db.InvoiceItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var components = await db.InvoiceItemComponents.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var packings = await db.Packings.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var packingItems = await db.PackingItems.Where(x => x.InvoiceKey == invoiceKey).OrderBy(x => x.SeqNo).ToListAsync();
        var boms = await db.KittingBoms.Where(b => b.IsActive).ToListAsync();

        var sb = new StringBuilder();
        int seq = 1;

        foreach (var pi in packingItems)
        {
            var packing = packings.FirstOrDefault(p => p.SeqNo == pi.SeqNo);
            var item = items.FirstOrDefault(it => it.SoKey == pi.SoKey && it.SoLine == pi.SoLine);
            if (item == null) continue;

            // Get components for this item — for kitting (multiple components), output one line per component
            var itemComps = components.Where(c => c.InvoiceItemNo == item.InvoiceItemNo).ToList();

            if (itemComps.Count == 0)
            {
                // No components — output as single T line
                WritePspDetailLine(sb, invoiceKey, packing, pi, "T", pi.ProductKey, 0, 0, 0, pi.Qty, seq++);
            }
            else
            {
                // For each component type (T, C, F) in kitting — output separate line, order: T, C, F
                // Qty = packing sets × BOM quantity per component
                var typeOrder = new Dictionary<string, int> { ["T"] = 1, ["C"] = 2, ["F"] = 3 };
                foreach (var comp in itemComps.OrderBy(c => typeOrder.GetValueOrDefault(c.ComponentType, 9)))
                {
                    var bom = boms.FirstOrDefault(b => b.ProductKey == item.ProductKey && b.KitKey == item.KitKey && b.ComponentType == comp.ComponentType)
                           ?? boms.FirstOrDefault(b => b.ProductKey == item.ProductKey && b.ComponentType == comp.ComponentType);
                    int compQty = pi.Qty * (bom?.Quantity ?? 1);
                    WritePspDetailLine(sb, invoiceKey, packing, pi, comp.ComponentType, comp.ProductKey,
                        comp.UnitPrice, comp.UnitWeight ?? 0, comp.UnitVolume ?? 0, compQty, seq++);
                }
            }
        }

        var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
        var fileName = $"PSP_{invoice.CustomerKey ?? "X"}_D_{invoiceKey}_{timestamp}.txt";
        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/plain", fileName);
    }

    private static void WritePspDetailLine(StringBuilder sb, string invoiceKey, Data.Entities.TxPacking? packing,
        Data.Entities.TxPackingItem pi, string tcfType, string? productKey,
        int unitPrice, double unitWeight, double unitVolume, int qty, int seq)
    {
        sb.Append((invoiceKey ?? "").PadRight(13)[..13]);
        sb.Append((packing?.ContainerNo ?? "").PadRight(14)[..14]);
        sb.Append("".PadRight(16)[..16]); // SealNo
        sb.Append((pi.SoKey ?? "").PadRight(10)[..10]);
        sb.Append((pi.SoLine ?? "").PadRight(4)[..4]);
        sb.Append((tcfType ?? "T").PadRight(3)[..3]);
        sb.Append(qty.ToString("0000000"));
        var netWeight = qty * unitWeight;
        var grossWeight = netWeight;
        var volume = qty * unitVolume;
        sb.Append(netWeight.ToString("000000.000")[..10]);
        sb.Append(grossWeight.ToString("000000.000")[..10]);
        sb.Append(volume.ToString("000.000000")[..10]);
        sb.Append((productKey ?? "").PadRight(40)[..40]);
        sb.Append("000"); // Irizu
        sb.Append("000"); // Carton
        sb.Append(((decimal)unitPrice).ToString("000000000.00").PadLeft(12)[..12]);
        sb.Append((packing?.ContainerType ?? "").PadRight(3)[..3]);
        sb.Append(seq.ToString("000"));
        sb.AppendLine();
    }

    // Placeholder for print reports
    [HttpGet("pv/{invoiceKey}")] public Task<IActionResult> PrintPV(string invoiceKey, [FromQuery] string type = "TCF", [FromQuery] int coo = 0, [FromQuery] int split = 25, [FromQuery] int allw = 0, [FromQuery] int sumpage = 0) => GeneratePdf(invoiceKey, "PV", type, coo, split, allw, sumpage);
    [HttpGet("iv/{invoiceKey}")] public Task<IActionResult> PrintIV(string invoiceKey, [FromQuery] string type = "TCF", [FromQuery] int coo = 0, [FromQuery] int split = 25, [FromQuery] int allw = 0, [FromQuery] int sumpage = 0) => GeneratePdf(invoiceKey, "IV", type, coo, split, allw, sumpage);
    [HttpGet("pl/{invoiceKey}")] public Task<IActionResult> PrintPL(string invoiceKey, [FromQuery] string type = "TCF", [FromQuery] int coo = 0, [FromQuery] int split = 25, [FromQuery] int allw = 0, [FromQuery] int sumpage = 0) => GeneratePdf(invoiceKey, "PL", type, coo, split, allw, sumpage);
    [HttpGet("dl/{invoiceKey}")] public Task<IActionResult> PrintDL(string invoiceKey, [FromQuery] string type = "TCF", [FromQuery] int coo = 0, [FromQuery] int split = 25, [FromQuery] int allw = 0, [FromQuery] int sumpage = 0) => GeneratePdf(invoiceKey, "DL", type, coo, split, allw, sumpage);

    private async Task<IActionResult> GeneratePdf(string invoiceKey, string form, string type, int coo, int split, int allw, int sumpage)
    {
        var invoice = await db.Invoices.FindAsync(invoiceKey);
        if (invoice == null) return NotFound();

        var items = await db.InvoiceItems.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var components = await db.InvoiceItemComponents.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var packings = await db.Packings.Where(x => x.InvoiceKey == invoiceKey).ToListAsync();
        var packingItems = await db.PackingItems.Where(x => x.InvoiceKey == invoiceKey).OrderBy(x => x.SeqNo).ToListAsync();
        var boms = await db.KittingBoms.Where(b => b.IsActive).ToListAsync();
        var dest = await db.Destinations.FirstOrDefaultAsync(d => d.PortKey == invoice.PortOfDestination);

        // Load product descriptions
        var productKeys = items.Select(i => i.ProductKey).Union(components.Select(c => c.ProductKey)).Where(k => k != null).Distinct().ToList();
        var products = await db.Products.Where(p => productKeys.Contains(p.Key)).ToDictionaryAsync(p => p.Key);

        // Resolve signatory from company_signatory table
        var signatory = await db.CompanySignatories
            .Where(s => s.IsActive && (s.EffectiveFrom == null || s.EffectiveFrom <= (invoice.InvoiceDate ?? DateOnly.FromDateTime(DateTime.Now))))
            .OrderByDescending(s => s.EffectiveFrom)
            .FirstOrDefaultAsync();

        byte[]? stampImage = null, signatureImage = null;
        if (signatory != null)
        {
            using var http = new HttpClient();
            if (!string.IsNullOrEmpty(signatory.StampUrl))
                try { stampImage = await http.GetByteArrayAsync(signatory.StampUrl); } catch { }
            if (!string.IsNullOrEmpty(signatory.SignatureUrl))
                try { signatureImage = await http.GetByteArrayAsync(signatory.SignatureUrl); } catch { }
        }

        var data = new Services.InvoiceReportData(invoice, dest?.Name, items, components, packings, packingItems, boms, products, signatory?.Name ?? "MANAGING DIRECTOR", signatory?.Position ?? "MANAGING DIRECTOR", stampImage, signatureImage);
        var opts = new Services.ReportOptions(type.ToUpper(), coo == 1, allw == 1, sumpage == 1, split);

        byte[] pdf;
        string fileName;
        if (form == "PL")
        {
            pdf = Services.PdfReportService.GeneratePackingList(data, opts);
            fileName = $"PL_{invoiceKey}.pdf";
        }
        else if (form == "DL")
        {
            pdf = Services.PdfReportService.GenerateDeliveryList(data, opts);
            fileName = $"DL_{invoiceKey}.pdf";
        }
        else
        {
            pdf = Services.PdfReportService.GenerateInvoice(data, form, opts);
            fileName = $"{form}_{invoiceKey}.pdf";
        }

        return File(pdf, "application/pdf", fileName);
    }
}
