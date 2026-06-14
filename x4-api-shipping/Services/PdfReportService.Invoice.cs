using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace x4_api_shipping.Services;

public static partial class PdfReportService
{
    public static byte[] GenerateInvoice(InvoiceReportData data, string form, ReportOptions opts)
    {
        bool showPrice = form == "IV";
        string title = form == "PV" ? "PROFORMA INVOICE" : "INVOICE";
        var lines = BuildInvoiceLines(data, opts);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginVertical(20);
                page.MarginHorizontal(25);
                page.DefaultTextStyle(x => x.FontFamily("BridgestoneType").FontSize(9));
                page.Header().Element(c => PageHeader(c, title));
                page.Footer().AlignRight().Text(t => { t.Span("Page ").FontSize(7); t.CurrentPageNumber().FontSize(7); t.Span(" / ").FontSize(7); t.TotalPages().FontSize(7); });
                page.Content().Column(col =>
                {
                    IvFields(col, data, opts);
                    IvTable(col, lines, showPrice);
                    IvTotals(col, lines, data, showPrice);
                    Signatory(col, data);
                });
            });
        });
        return ToPdf(doc);
    }

    static void IvFields(ColumnDescriptor col, InvoiceReportData data, ReportOptions opts)
    {
        var inv = data.Invoice;
        col.Item().PaddingTop(8).Row(row =>
        {
            row.RelativeItem(110).Column(left =>
            {
                LR(left, 95, "CONSIGNED TO", inv.ConsignedTo1 ?? "", true);
                LR(left, 95, "", inv.ConsignedTo2 ?? "");
                LR(left, 95, "", inv.ConsignedTo3 ?? "");
                left.Item().PaddingTop(6);
                LR(left, 95, "PORT OF LOADING", inv.EdiShipFrom ?? inv.PortOfLoadName ?? "");
                LR(left, 95, "DESTINATION", data.DestinationName ?? "");
                left.Item().PaddingTop(6);
                LR(left, 95, "VESSEL NAME", inv.FeederVessel ?? "");
                LR(left, 95, "", inv.MotherVessel ?? "");
                left.Item().PaddingTop(6);
                LR(left, 95, "ETD", FormatDate(inv.Etd));
                LR(left, 95, "ETA", FormatDate(inv.Eta));
            });
            row.RelativeItem(80).Column(right =>
            {
                LR(right, 80, "INVOICE NO", inv.InvoiceKey, false, 12);
                right.Item().PaddingTop(8);
                LR(right, 80, "ISSUE DATE", FormatDate(inv.InvoiceDate));
                right.Item().PaddingTop(8);
                LR(right, 80, "BOOKING NO", inv.BookingNo ?? "");
                LR(right, 80, "B/L NO.", inv.BlNo ?? "");
                right.Item().PaddingTop(4);
                LR(right, 80, "L/C NO.", inv.LcNo ?? "");
                LR(right, 80, "L/C DATE", FormatDate(inv.LcDate));
                right.Item().PaddingTop(4);
                LR(right, 80, "INCOTERM", inv.TradeTerm ?? "");
                LR(right, 80, "PAYMENT TERM", "");
                right.Item().PaddingLeft(80).Text(inv.TermOfPay1 ?? "").FontSize(8);
                right.Item().PaddingLeft(80).Text($"{inv.TermOfPay2 ?? ""} {inv.TermOfPay3 ?? ""}".Trim()).FontSize(8);
            });
        });
        col.Item().PaddingTop(6).Row(row =>
        {
            row.RelativeItem(110).Column(left =>
            {
                left.Item().Text("DESCRIPTION OF GOODS").Bold();
                left.Item().PaddingTop(2).Text(inv.DescOfGoods1 ?? "");
                left.Item().Text((inv.DescOfGoods2 ?? "").ToUpper());
            });
            row.RelativeItem(80).Column(right =>
            {
                right.Item().Text("MARKS & NOS").Bold();
                right.Item().PaddingTop(2).Text(inv.ShipMark1 ?? "");
                right.Item().Text(inv.ShipMark2 ?? "");
                right.Item().Text(inv.ShipMark3 ?? "");
                right.Item().Text(inv.ShipMark4 ?? "");
                right.Item().Text(inv.ShipMark5 ?? "");
            });
        });
        col.Item().PaddingTop(3).Row(r =>
        {
            r.ConstantItem(95).Text("COUNTRY OF ORIGIN").Bold();
            r.RelativeItem().Text(opts.ShowCoo ? "[L]: Thailand   [K]: Korea   [V]: Vietnam" : "MADE IN THAILAND");
        });
    }

    static void IvTable(ColumnDescriptor col, List<IvLine> lines, bool showPrice)
    {
        col.Item().PaddingTop(4).LineHorizontal(0.5f);
        col.Item().PaddingVertical(3).Row(row =>
        {
            row.RelativeItem(25).Text("D/O NO.").Bold();
            row.RelativeItem(18).Text("LINE NO.").Bold();
            row.RelativeItem(27).Text("PRODUCT CODE").Bold();
            row.RelativeItem(45).Text("DESCRIPTION").Bold();
            row.RelativeItem(20).AlignCenter().Text("QTY").Bold();
            row.RelativeItem(5).Text("");
            if (showPrice) { row.RelativeItem(25).AlignRight().Text("UNIT PRICE").Bold(); row.RelativeItem(25).AlignRight().Text("AMOUNT").Bold(); }
        });
        if (showPrice)
        {
            col.Item().PaddingBottom(2).Row(row =>
            {
                row.RelativeItem(25 + 18 + 27 + 45 + 20 + 5).Text("");
                row.RelativeItem(25).AlignRight().Text("(THB)").FontSize(8);
                row.RelativeItem(25).AlignRight().Text("(THB)").FontSize(8);
            });
        }
        col.Item().LineHorizontal(0.5f);
        foreach (var ln in lines)
        {
            col.Item().PaddingTop(3).Row(row =>
            {
                row.RelativeItem(25).Text(ln.SoKey);
                row.RelativeItem(18).Text(ln.SoLine);
                row.RelativeItem(27).Text(ln.ProductCode).Bold();
                row.RelativeItem(45).Text(ln.CooSign + ln.Description).FontSize(8);
                row.RelativeItem(20).AlignRight().Text(ln.Qty.ToString("N0"));
                row.RelativeItem(5).Text(ln.TcfType);
                if (showPrice) { row.RelativeItem(25).AlignRight().Text(ln.UnitPrice.ToString("N2")); row.RelativeItem(25).AlignRight().Text(ln.Amount.ToString("N2")); }
            });
        }
    }

    static void IvTotals(ColumnDescriptor col, List<IvLine> lines, InvoiceReportData data, bool showPrice)
    {
        col.Item().PaddingTop(6).LineHorizontal(0.5f);
        col.Item().PaddingTop(4);
        var tcf = lines.GroupBy(l => l.TcfType).Where(g => g.Sum(x => x.Qty) > 0).ToList();
        decimal totalAmt = lines.Sum(l => l.Amount);
        double totalNw = 0, totalM3 = 0;
        foreach (var item in data.Items)
            foreach (var c in data.Components.Where(c => c.InvoiceItemNo == item.InvoiceItemNo))
            {
                int q = item.Qty * (FindBom(data, item, c.ComponentType)?.Quantity ?? 1);
                totalNw += q * (c.UnitWeight ?? 0);
                totalM3 += q * (c.UnitVolume ?? 0);
            }

        bool first = true;
        foreach (var g in tcf)
        {
            col.Item().Row(row =>
            {
                row.RelativeItem(115).AlignCenter().Text(first ? "TOTAL" : "").Bold();
                row.RelativeItem(20).AlignRight().Text(g.Sum(x => x.Qty).ToString("N0")).Bold();
                row.RelativeItem(5).Text(g.Key).Bold();
                if (showPrice) { row.RelativeItem(25).Text(""); row.RelativeItem(25).AlignRight().Text(first ? totalAmt.ToString("N2") : "").Bold(); }
            });
            first = false;
        }
        col.Item().PaddingTop(3).LineHorizontal(0.5f);
        col.Item().PaddingTop(6);
        col.Item().Row(r => { r.ConstantItem(110).Text("TOTAL NET WEIGHT").Bold(); r.ConstantItem(60).AlignRight().Text(totalNw.ToString("N2")); r.ConstantItem(30).PaddingLeft(3).Text("KGS").Bold(); });
        col.Item().Row(r => { r.ConstantItem(110).Text("TOTAL GROSS WEIGHT").Bold(); r.ConstantItem(60).AlignRight().Text(totalNw.ToString("N2")); r.ConstantItem(30).PaddingLeft(3).Text("KGS").Bold(); });
        col.Item().Row(r => { r.ConstantItem(110).Text("TOTAL MEASUREMENT").Bold(); r.ConstantItem(60).AlignRight().Text(totalM3.ToString("N3")); r.ConstantItem(30).PaddingLeft(3).Text("M3").Bold(); });
        col.Item().PaddingTop(6);
        col.Item().Text("NOTE: T = TIRE(S), C = TUBE(S), F = FLAP(S)").FontSize(7);
        col.Item().Text("         TC = TIRE(S) AND TUBE(S)").FontSize(7);
        col.Item().Text("         TF = TIRE(S) AND FLAP(S)").FontSize(7);
        col.Item().Text("         TCF = TIRE(S), TUBE(S) AND FLAP(S)").FontSize(7);
    }
}
