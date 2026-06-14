using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace x4_api_shipping.Services;

public static partial class PdfReportService
{
    public static byte[] GeneratePackingList(InvoiceReportData data, ReportOptions opts)
    {
        var doc = Document.Create(container =>
        {
            var packings = data.Packings.OrderBy(p => p.SeqNo).ToList();
            double runNet = 0, runGross = 0, runMeas = 0; int runQty = 0;

            for (int i = 0; i < packings.Count; i++)
            {
                var pk = packings[i];
                var piItems = data.PackingItems.Where(x => x.SeqNo == pk.SeqNo).OrderBy(x => x.SoKey).ThenBy(x => x.SoLine).ToList();
                var lines = BuildPlLines(data, piItems, opts);
                var tot = CalcPlTotals(lines);
                runNet += tot.netWeight; runGross += tot.grossWeight; runMeas += tot.measurement; runQty += tot.qty;
                bool isLast = i == packings.Count - 1;

                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginVertical(20);
                    page.MarginHorizontal(25);
                    page.DefaultTextStyle(x => x.FontFamily("BridgestoneType").FontSize(9));
                    page.Header().Element(c => PageHeader(c, "PACKING LIST"));
                    page.Footer().AlignRight().Text(t => { t.Span("Page ").FontSize(7); t.CurrentPageNumber().FontSize(7); t.Span(" / ").FontSize(7); t.TotalPages().FontSize(7); });
                    page.Content().Column(col =>
                    {
                        PlFields(col, data, pk, opts);
                        PlTable(col, lines);
                        PlTotals(col, lines, tot, opts, isLast, runQty, runNet, runGross, runMeas);
                        Signatory(col, data);
                    });
                });
            }
        });
        return ToPdf(doc);
    }

    static void PlFields(ColumnDescriptor col, InvoiceReportData data, Data.Entities.TxPacking pk, ReportOptions opts)
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
            });
            row.RelativeItem(80).Column(right =>
            {
                LR(right, 80, "INVOICE NO", inv.InvoiceKey, false, 12);
                right.Item().PaddingTop(6);
                LR(right, 80, "ISSUE DATE", FormatDate(inv.InvoiceDate));
                right.Item().PaddingTop(6);
                LR(right, 80, "PACKING NO.", $"{inv.InvoiceKey}-{pk.SeqNo:00}");
                LR(right, 80, "CONTAINER NO.", pk.ContainerNo ?? "");
                LR(right, 80, "SEAL NO.", "");
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

    static void PlTable(ColumnDescriptor col, List<PlLine> lines)
    {
        col.Item().PaddingTop(4).LineHorizontal(0.5f);
        col.Item().PaddingVertical(3).Row(row =>
        {
            row.RelativeItem(25).Text("D/O NO.").Bold().FontSize(8);
            row.RelativeItem(18).Text("LINE NO.").Bold().FontSize(8);
            row.RelativeItem(33).Text("PRODUCT CODE").Bold().FontSize(8);
            row.RelativeItem(20).AlignCenter().Text("QTY").Bold().FontSize(8);
            row.RelativeItem(10).Text("").FontSize(8);
            row.RelativeItem(25).AlignRight().Text("NET WT.").Bold().FontSize(8);
            row.RelativeItem(25).AlignRight().Text("GROSS WT.").Bold().FontSize(8);
            row.RelativeItem(25).AlignRight().Text("CBM").Bold().FontSize(8);
        });
        col.Item().PaddingBottom(1).Row(row =>
        {
            row.RelativeItem(25 + 18 + 33 + 20 + 10).Text("");
            row.RelativeItem(25).AlignRight().Text("(KGS)").FontSize(7);
            row.RelativeItem(25).AlignRight().Text("(KGS)").FontSize(7);
            row.RelativeItem(25).AlignRight().Text("(M3)").FontSize(7);
        });
        col.Item().LineHorizontal(0.5f);

        foreach (var ln in lines)
        {
            double nw = ln.Qty * ln.UnitWeight;
            double vol = ln.Qty * ln.UnitVolume;
            col.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem(25).Text(ln.SoKey);
                row.RelativeItem(18).Text(ln.SoLine);
                row.RelativeItem(33).Text(ln.ProductCode).Bold();
                row.RelativeItem(20).AlignRight().Text(ln.Qty.ToString("N0"));
                row.RelativeItem(10).PaddingLeft(2).Text(ln.TcfType);
                row.RelativeItem(25).AlignRight().Text(ln.UnitWeight.ToString("N2"));
                row.RelativeItem(25).AlignRight().Text(ln.UnitWeight.ToString("N2"));
                row.RelativeItem(25).AlignRight().Text(ln.UnitVolume.ToString("N3"));
            });
            col.Item().PaddingTop(1).Row(row =>
            {
                row.RelativeItem(25 + 18).Text("");
                row.RelativeItem(33).Text(ln.CooSign + ln.Description).FontSize(7);
                row.RelativeItem(20 + 10).AlignRight().Text("SUBTOTAL").Bold().FontSize(6);
                row.RelativeItem(25).AlignRight().Text(nw.ToString("N2")).Bold();
                row.RelativeItem(25).AlignRight().Text(nw.ToString("N2")).Bold();
                row.RelativeItem(25).AlignRight().Text(vol.ToString("N3")).Bold();
            });
            col.Item().PaddingTop(2).LineHorizontal(0.3f).LineColor(Colors.Grey.Lighten2);
        }
    }

    static void PlTotals(ColumnDescriptor col, List<PlLine> lines, (int qty, double netWeight, double grossWeight, double measurement) tot, ReportOptions opts, bool isLast, int grandQty, double grandNet, double grandGross, double grandMeas)
    {
        col.Item().PaddingTop(4).LineHorizontal(0.5f);
        col.Item().PaddingTop(4);
        var tcf = lines.GroupBy(l => l.TcfType).Where(g => g.Sum(x => x.Qty) > 0).ToList();
        bool first = true;
        foreach (var g in tcf)
        {
            col.Item().Row(row =>
            {
                row.RelativeItem(76).AlignCenter().Text(first ? "TOTAL" : "").Bold();
                row.RelativeItem(20).AlignRight().Text(g.Sum(x => x.Qty).ToString("N0")).Bold();
                row.RelativeItem(10).PaddingLeft(2).Text(g.Key).Bold();
                if (first)
                {
                    row.RelativeItem(25).AlignRight().Text(tot.netWeight.ToString("N2")).Bold().Underline();
                    row.RelativeItem(25).AlignRight().Text(tot.grossWeight.ToString("N2")).Bold().Underline();
                    row.RelativeItem(25).AlignRight().Text(tot.measurement.ToString("N3")).Bold().Underline();
                }
                else row.RelativeItem(75).Text("");
            });
            first = false;
        }

        if (isLast && opts.ShowGrandTotal)
        {
            col.Item().PaddingTop(2).LineHorizontal(0.5f);
            col.Item().PaddingTop(3).Row(row =>
            {
                row.RelativeItem(76).AlignCenter().Text("GRAND TOTAL").Bold();
                row.RelativeItem(20).AlignRight().Text(grandQty.ToString("N0")).Bold();
                row.RelativeItem(10).Text("");
                row.RelativeItem(25).AlignRight().Text(grandNet.ToString("N2")).Bold().Underline();
                row.RelativeItem(25).AlignRight().Text(grandGross.ToString("N2")).Bold().Underline();
                row.RelativeItem(25).AlignRight().Text(grandMeas.ToString("N3")).Bold().Underline();
            });
        }
        col.Item().PaddingTop(6);
        col.Item().Text("NOTE: T = TIRE(S), C = TUBE(S), F = FLAP(S)").FontSize(7);
        col.Item().Text("         TC = TIRE(S) AND TUBE(S)").FontSize(7);
        col.Item().Text("         TF = TIRE(S) AND FLAP(S)").FontSize(7);
        col.Item().Text("         TCF = TIRE(S), TUBE(S) AND FLAP(S)").FontSize(7);
    }
}
