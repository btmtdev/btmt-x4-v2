using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace x4_api_shipping.Services;

public static partial class PdfReportService
{
    public static byte[] GenerateDeliveryList(InvoiceReportData data, ReportOptions opts)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.MarginVertical(15);
                page.MarginHorizontal(20);
                page.DefaultTextStyle(x => x.FontFamily("BridgestoneType").FontSize(9));
                page.Header().Element(c => PageHeader(c, "DELIVERY LIST"));
                page.Footer().Column(fc =>
                {
                    var r1 = data.Invoice.ShipingRemark1; var r2 = data.Invoice.ShipingRemark2;
                    if (!string.IsNullOrEmpty(r1) || !string.IsNullOrEmpty(r2))
                        fc.Item().Text($"REMARK: {r1 ?? ""}  {r2 ?? ""}".Trim()).FontSize(8);
                    fc.Item().PaddingTop(2).AlignRight().Text(t => { t.Span("Page ").FontSize(7); t.CurrentPageNumber().FontSize(7); t.Span(" / ").FontSize(7); t.TotalPages().FontSize(7); });
                });
                page.Content().Column(col =>
                {
                    var inv = data.Invoice;
                    col.Item().PaddingTop(5).Row(row =>
                    {
                        row.RelativeItem().Column(left =>
                        {
                            LR(left, 80, "INVOICE NO", inv.InvoiceKey, true, 12);
                            LR(left, 80, "CUSTOMER", inv.CustomerKey ?? "");
                            LR(left, 80, "DESTINATION", data.DestinationName ?? "");
                        });
                        row.RelativeItem().Column(right =>
                        {
                            LR(right, 80, "ISSUE DATE", FormatDate(inv.InvoiceDate));
                            LR(right, 80, "ETD", FormatDate(inv.Etd));
                        });
                    });
                    col.Item().PaddingTop(5).LineHorizontal(0.5f);
                    col.Item().PaddingVertical(3).Row(row =>
                    {
                        row.RelativeItem(5).Text("SEQ").Bold().FontSize(8);
                        row.RelativeItem(16).Text("D/O NO.").Bold().FontSize(8);
                        row.RelativeItem(7).Text("LINE").Bold().FontSize(8);
                        row.RelativeItem(20).Text("PRODUCT CODE").Bold().FontSize(8);
                        row.RelativeItem(7).Text("SET").Bold().FontSize(8);
                        row.RelativeItem(8).AlignRight().Text("QTY").Bold().FontSize(8);
                        row.RelativeItem(8).AlignCenter().Text("STOCK").Bold().FontSize(8);
                        row.RelativeItem(13).Text("REQ1").Bold().FontSize(8);
                        row.RelativeItem(13).Text("REQ2").Bold().FontSize(8);
                        row.RelativeItem(11).Text("LOAD DATE").Bold().FontSize(8);
                        row.RelativeItem(9).Text("PERIOD").Bold().FontSize(8);
                        row.RelativeItem(14).Text("CONTAINER").Bold().FontSize(8);
                    });
                    col.Item().LineHorizontal(0.5f);

                    int totalQty = 0;
                    foreach (var pk in data.Packings.OrderBy(p => p.SeqNo))
                    {
                        var piItems = data.PackingItems.Where(x => x.SeqNo == pk.SeqNo).OrderBy(x => x.SoKey).ThenBy(x => x.SoLine).ToList();
                        int subTotal = 0; bool first = true;
                        foreach (var pi in piItems)
                        {
                            var item = data.Items.FirstOrDefault(it => it.SoKey == pi.SoKey && it.SoLine == pi.SoLine);
                            totalQty += pi.Qty; subTotal += pi.Qty;
                            col.Item().PaddingTop(2).Row(row =>
                            {
                                row.RelativeItem(5).Text(pk.SeqNo.ToString("00")).FontSize(8);
                                row.RelativeItem(16).Text(pi.SoKey);
                                row.RelativeItem(7).Text(pi.SoLine);
                                row.RelativeItem(20).Text(pi.ProductKey ?? "").Bold();
                                row.RelativeItem(7).Text(pi.KitKey ?? "");
                                row.RelativeItem(8).AlignRight().Text(pi.Qty.ToString("N0"));
                                row.RelativeItem(8).AlignCenter().Text(item?.StockType ?? "");
                                row.RelativeItem(13).Text(item?.Req1 ?? "").FontSize(8);
                                row.RelativeItem(13).Text(item?.Req2 ?? "").FontSize(8);
                                row.RelativeItem(11).Text(first ? (pk.LoadingDate?.ToString("dd-MMM-yy")?.ToUpper() ?? "") : "").FontSize(8);
                                row.RelativeItem(9).Text(first ? (pk.LoadingTimePeriod ?? "") : "").FontSize(8);
                                row.RelativeItem(14).Text(first ? (pk.ContainerNo ?? pk.ContainerType ?? "") : "").FontSize(8);
                            });
                            first = false;
                        }
                        col.Item().PaddingTop(2).Row(row =>
                        {
                            row.RelativeItem(55).AlignRight().Text($"Subtotal ({pk.ContainerNo ?? "SEQ " + pk.SeqNo.ToString("00")})").Bold().FontSize(7);
                            row.RelativeItem(8).AlignRight().Text(subTotal.ToString("N0")).Bold();
                            row.RelativeItem(68).Text("");
                        });
                        col.Item().PaddingTop(2).LineHorizontal(0.3f).LineColor(Colors.Grey.Lighten1);
                    }
                    col.Item().PaddingTop(4).LineHorizontal(0.5f);
                    col.Item().PaddingTop(3).Row(row =>
                    {
                        row.RelativeItem(55).AlignRight().Text("GRAND TOTAL").Bold();
                        row.RelativeItem(8).AlignRight().Text(totalQty.ToString("N0")).Bold();
                        row.RelativeItem(68).Text("");
                    });
                });
            });
        });
        return ToPdf(doc);
    }
}
