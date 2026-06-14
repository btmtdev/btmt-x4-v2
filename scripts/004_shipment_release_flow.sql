-- ============================================================
-- 004: Shipment Release Flow - revision/status + event log
-- Database: BTMT-X4-SHIPPING
-- ============================================================

-- 1. Add revision & status to tx_invoice
ALTER TABLE tx_invoice ADD
    revision  int          NOT NULL DEFAULT 0,
    status    nvarchar(20) NOT NULL DEFAULT 'draft';
GO

-- 2. Event-sourced shipment activity log (tracks ALL actions)
CREATE TABLE tx_shipment_event (
    id            bigint IDENTITY(1,1) PRIMARY KEY,
    invoice_key   nvarchar(26)  NOT NULL,
    revision      int           NOT NULL,
    event_type    nvarchar(20)  NOT NULL,  -- release | pullback | send_to_wh | wh_confirm
    event_data    nvarchar(max) NULL,      -- JSON payload (qty changes, remarks, etc.)
    created_by    nvarchar(200) NOT NULL,
    created_at    datetime2     NOT NULL DEFAULT sysdatetime()
);
GO

CREATE INDEX IX_shipment_event_invoice ON tx_shipment_event(invoice_key, revision);
CREATE INDEX IX_shipment_event_type    ON tx_shipment_event(event_type, created_at);
GO
