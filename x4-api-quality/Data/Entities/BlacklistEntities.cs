using System.ComponentModel.DataAnnotations.Schema;

namespace x4_api_quality.Data.Entities;

[Table("blacklist_request")]
public class BlacklistRequest
{
    [Column("id")] public int Id { get; set; }
    [Column("request_no")] public string RequestNo { get; set; } = "";
    [Column("requested_by")] public string RequestedBy { get; set; } = "";
    [Column("requested_date")] public DateTime RequestedDate { get; set; } = DateTime.Now;
    [Column("reason")] public string Reason { get; set; } = "";
    [Column("status")] public string Status { get; set; } = "Pending";
    [Column("approved_by")] public string? ApprovedBy { get; set; }
    [Column("approved_date")] public DateTime? ApprovedDate { get; set; }
    [Column("remark")] public string? Remark { get; set; }
    public List<BlacklistItem> Items { get; set; } = [];
}

[Table("blacklist_item")]
public class BlacklistItem
{
    [Column("id")] public int Id { get; set; }
    [Column("request_id")] public int RequestId { get; set; }
    [Column("barcode")] public string Barcode { get; set; } = "";
    [Column("product_code")] public string ProductCode { get; set; } = "";
    [Column("product_name")] public string? ProductName { get; set; }
    [Column("received_date")] public DateTime? ReceivedDate { get; set; }
    [Column("qty")] public decimal Qty { get; set; } = 1;
    [Column("location")] public string? Location { get; set; }
    public BlacklistRequest Request { get; set; } = null!;
}
