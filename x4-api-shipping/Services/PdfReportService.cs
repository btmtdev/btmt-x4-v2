using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using x4_api_shipping.Data.Entities;

namespace x4_api_shipping.Services;

public record ReportOptions(string Type = "TCF", bool ShowCoo = false, bool ShowGrandTotal = false, bool ShowSummaryPage = false, int LinesPerPage = 25);

public record InvoiceReportData(
    TxInvoice Invoice,
    string? DestinationName,
    List<TxInvoiceItem> Items,
    List<TxInvoiceItemComponent> Components,
    List<TxPacking> Packings,
    List<TxPackingItem> PackingItems,
    List<KittingBom> Boms,
    Dictionary<string, Product> Products,
    string SignatoryName = "MANAGING DIRECTOR",
    string SignatoryPosition = "MANAGING DIRECTOR",
    byte[]? StampImage = null,
    byte[]? SignatureImage = null
);

public static partial class PdfReportService
{
    static readonly byte[] LogoBytes;
    static PdfReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var asm = typeof(PdfReportService).Assembly;
        using var logoStream = asm.GetManifestResourceStream("x4_api_shipping.Assets.logo.png")!;
        using var ms = new MemoryStream();
        logoStream.CopyTo(ms);
        LogoBytes = ms.ToArray();
        using var regularFont = asm.GetManifestResourceStream("x4_api_shipping.Assets.Bridgestone-Regular.ttf")!;
        using var boldFont = asm.GetManifestResourceStream("x4_api_shipping.Assets.Bridgestone-Bold.ttf")!;
        FontManager.RegisterFontWithCustomName("BridgestoneType", regularFont);
        FontManager.RegisterFontWithCustomName("BridgestoneType", boldFont);
    }

    // Shared page header
    static void PageHeader(IContainer container, string title)
    {
        container.PaddingBottom(5).Column(col =>
        {
            col.Item().Row(row =>
            {
                row.ConstantItem(40).Image(LogoBytes);
                row.RelativeItem().PaddingLeft(5).Column(c =>
                {
                    c.Item().Text("BRIDGESTONE TIRE MANUFACTURING (THAILAND) CO., LTD.").Bold().FontSize(8);
                    c.Item().Text("700/622 M. 4 Tambol Bankao, Amphur Panthong, Chonburi 20160 Thailand").FontSize(7);
                    c.Item().Text("Phone No +66 3893 0300, Fax +66 3893 0302").FontSize(7);
                    c.Item().Text("Head Office, Tax Identification No. 0105543030249").FontSize(7);
                });
                row.ConstantItem(120).AlignCenter().AlignMiddle().Text(title).Bold().FontSize(14);
            });
            col.Item().PaddingTop(3).LineHorizontal(0.5f);
        });
    }

    // Shared signatory block
    static void Signatory(ColumnDescriptor col, InvoiceReportData data)
    {
        col.Item().PaddingTop(8).AlignRight().Width(220).Column(right =>
        {
            right.Item().AlignCenter().Text("BRIDGESTONE TIRE MANUFACTURING (THAILAND) CO., LTD.").Bold().FontSize(8);
            if (data.StampImage != null || data.SignatureImage != null)
            {
                right.Item().PaddingTop(5).Height(70).Row(img =>
                {
                    if (data.StampImage != null) img.RelativeItem().AlignCenter().Image(data.StampImage).FitArea();
                    if (data.SignatureImage != null) img.RelativeItem().AlignCenter().Image(data.SignatureImage).FitArea();
                });
            }
            else
            {
                right.Item().Height(40).Text("");
            }
            right.Item().AlignCenter().Text(data.SignatoryName).FontSize(8);
            right.Item().AlignCenter().Text(data.SignatoryPosition).FontSize(8);
        });
    }

    // Helpers
    static void LR(ColumnDescriptor col, float labelWidth, string label, string value, bool boldValue = false, float valueFontSize = 9)
    {
        col.Item().Row(r =>
        {
            if (!string.IsNullOrEmpty(label)) r.ConstantItem(labelWidth).Text(label).Bold();
            else r.ConstantItem(labelWidth).Text("");
            var txt = r.RelativeItem().Text(value).FontSize(valueFontSize);
            if (boldValue) txt.Bold();
        });
    }

    record IvLine(string SoKey, string SoLine, string ProductCode, string Description, string TcfType, int Qty, int UnitPrice, decimal Amount, string CooSign);
    record PlLine(string SoKey, string SoLine, string ProductCode, string Description, string TcfType, int Qty, double UnitWeight, double UnitVolume, string CooSign);

    static KittingBom? FindBom(InvoiceReportData data, TxInvoiceItem item, string ct) =>
        data.Boms.FirstOrDefault(b => b.ProductKey == item.ProductKey && b.KitKey == item.KitKey && b.ComponentType == ct)
        ?? data.Boms.FirstOrDefault(b => b.ProductKey == item.ProductKey && b.ComponentType == ct);

    static string GetDesc(InvoiceReportData data, string? k) => !string.IsNullOrEmpty(k) && data.Products.TryGetValue(k, out var p) ? p.Description ?? "" : "";
    static string GetCoo(ReportOptions opts, string? k) { if (!opts.ShowCoo || string.IsNullOrEmpty(k) || k.Length < 5) return ""; char c = k[4]; return c is 'V' or 'K' ? $"[{c}] " : "[L] "; }
    static int TcfOrder(string t) => t switch { "T" => 1, "C" => 2, "F" => 3, _ => 9 };
    static string KitTcf(List<TxInvoiceItemComponent> c) { bool t = c.Any(x => x.ComponentType == "T"), cb = c.Any(x => x.ComponentType == "C"), f = c.Any(x => x.ComponentType == "F"); return (t, cb, f) switch { (true, true, true) => "TCF", (true, true, _) => "TC", (true, _, true) => "TF", (true, _, _) => "T", (_, true, _) => "C", _ => "F" }; }
    static string FormatDate(DateOnly? d) => d?.ToString("dd-MMM-yyyy")?.ToUpper() ?? "";
    static (int qty, double netWeight, double grossWeight, double measurement) CalcPlTotals(List<PlLine> lines) => (lines.Sum(l => l.Qty), lines.Sum(l => l.Qty * l.UnitWeight), lines.Sum(l => l.Qty * l.UnitWeight), lines.Sum(l => l.Qty * l.UnitVolume));
    static byte[] ToPdf(Document doc) { using var ms = new MemoryStream(); doc.GeneratePdf(ms); return ms.ToArray(); }

    static List<IvLine> BuildInvoiceLines(InvoiceReportData data, ReportOptions opts)
    {
        var lines = new List<IvLine>();
        foreach (var item in data.Items.OrderBy(x => x.SoKey).ThenBy(x => x.SoLine))
        {
            var comps = data.Components.Where(c => c.InvoiceItemNo == item.InvoiceItemNo).ToList();
            if (opts.Type == "T" && comps.Count > 1)
            {
                foreach (var comp in comps.OrderBy(c => TcfOrder(c.ComponentType)))
                {
                    int q = item.Qty * (FindBom(data, item, comp.ComponentType)?.Quantity ?? 1);
                    lines.Add(new IvLine(item.SoKey ?? "", item.SoLine ?? "", comp.ProductKey ?? "", GetDesc(data, comp.ProductKey), comp.ComponentType, q, comp.UnitPrice, (decimal)comp.UnitPrice * q, GetCoo(opts, comp.ProductKey)));
                }
            }
            else
            {
                string code = item.ProductKey ?? "";
                if (!string.IsNullOrEmpty(item.KitKey) && item.KitKey.Length > 1) code += item.KitKey;
                var comp = comps.FirstOrDefault();
                string tcf = comps.Count <= 1 ? (comp?.ComponentType ?? "T") : KitTcf(comps);
                decimal amt = comps.Count <= 1 ? (decimal)(comp?.UnitPrice ?? 0) * item.Qty : comps.Sum(c => (decimal)c.UnitPrice) * item.Qty;
                lines.Add(new IvLine(item.SoKey ?? "", item.SoLine ?? "", code, GetDesc(data, item.ProductKey), tcf, item.Qty, comp?.UnitPrice ?? 0, amt, GetCoo(opts, item.ProductKey)));
            }
        }
        return lines;
    }

    static List<PlLine> BuildPlLines(InvoiceReportData data, List<TxPackingItem> piItems, ReportOptions opts)
    {
        var lines = new List<PlLine>();
        foreach (var pi in piItems)
        {
            var item = data.Items.FirstOrDefault(it => it.SoKey == pi.SoKey && it.SoLine == pi.SoLine);
            if (item == null) continue;
            var comps = data.Components.Where(c => c.InvoiceItemNo == item.InvoiceItemNo).ToList();
            if (opts.Type == "T" && comps.Count > 1)
            {
                foreach (var comp in comps.OrderBy(c => TcfOrder(c.ComponentType)))
                {
                    int q = pi.Qty * (FindBom(data, item, comp.ComponentType)?.Quantity ?? 1);
                    lines.Add(new PlLine(pi.SoKey, pi.SoLine, comp.ProductKey ?? "", GetDesc(data, comp.ProductKey), comp.ComponentType, q, comp.UnitWeight ?? 0, comp.UnitVolume ?? 0, GetCoo(opts, comp.ProductKey)));
                }
            }
            else
            {
                string code = item.ProductKey ?? "";
                if (!string.IsNullOrEmpty(item.KitKey) && item.KitKey.Length > 1) code += item.KitKey;
                var comp = comps.FirstOrDefault();
                string tcf = comps.Count <= 1 ? (comp?.ComponentType ?? "T") : KitTcf(comps);
                double w = comps.Count <= 1 ? (comp?.UnitWeight ?? 0) : comps.Sum(c => c.UnitWeight ?? 0);
                lines.Add(new PlLine(pi.SoKey, pi.SoLine, code, GetDesc(data, item.ProductKey), tcf, pi.Qty, w, comp?.UnitVolume ?? 0, GetCoo(opts, item.ProductKey)));
            }
        }
        return lines;
    }
}
