# BTMT-X4-SHIPPING Database Documentation

## Overview

| Property | Value |
|----------|-------|
| Server | localhost (SQL Server) |
| Database | BTMT-X4-SHIPPING |
| FK Strategy | Soft FK only (no enforced constraints) |
| Purpose | Shipping & invoicing management (master data + transactions) |

## Naming Convention

- `key_` for primary key columns that are reserved words
- `_key` suffix for soft FK references
- `tx_` prefix for transaction tables
- `is_` prefix for boolean flags

## Tables — Master Data (12)

### carrier

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(40) | No | Carrier code |
| name | nvarchar(100) | No | Carrier name |
| transport_mode | nvarchar(50) | Yes | Transport mode |
| is_active | bit | Yes | Active flag |

### company

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(40) | No | Company code |
| name | nvarchar(200) | No | Company name |
| tax_id | nvarchar(50) | Yes | Tax ID |
| address | nvarchar(500) | Yes | Address |
| city | nvarchar(100) | Yes | City |
| state_province | nvarchar(100) | Yes | State/Province |
| postal_code | nvarchar(20) | Yes | Postal code |
| country_key | nvarchar(10) | Yes | → country.key_ |
| phone | nvarchar(50) | Yes | Phone |
| fax | nvarchar(50) | Yes | Fax |
| email | nvarchar(200) | Yes | Email |
| is_active | bit | Yes | Active flag |

### company_signatory

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **id** (PK, Identity) | int | No | Auto-increment ID |
| company_key | nvarchar(40) | No | → company.key_ |
| name | nvarchar(200) | No | Signatory name |
| position | nvarchar(100) | Yes | Position/title |
| signature_url | nvarchar(500) | Yes | Signature image URL |
| effective_from | date | Yes | Effective from date |
| is_active | bit | Yes | Active flag |

### container

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(20) | No | Container type code |
| description | nvarchar(50) | Yes | Description |
| volume_max | float | Yes | Max volume capacity |
| is_active | bit | Yes | Active flag |

### country

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(20) | No | Country code |
| name | nvarchar(200) | No | Country name |
| region | nvarchar(100) | Yes | Region/continent |
| is_active | bit | Yes | Active flag |

### country_of_origin

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(2) | No | COO code (2-char) |
| name | nvarchar(100) | No | Country name |
| country_key | nvarchar(20) | Yes | → country.key_ |

### kitting_bom

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(120) | No | Composite key |
| product_key | nvarchar(100) | No | → product.key_ (parent) |
| component_key | nvarchar(100) | No | → product.key_ (component) |
| component_type | nvarchar(2) | No | Component type code |
| quantity | int | No | Quantity per kit |
| sorting | int | No | Display order |
| is_active | bit | Yes | Active flag |

### port

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(40) | No | Port code |
| name | nvarchar(200) | No | Port name |
| country_key | nvarchar(10) | Yes | → country.key_ |
| is_destination | bit | No | Is destination port |
| is_discharge | bit | No | Is discharge port |
| is_active | bit | Yes | Active flag |

### product

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(100) | No | Product code |
| description | nvarchar(300) | No | Product description |
| group_ | nvarchar(50) | Yes | Product group |
| type | nvarchar(50) | Yes | Product type |
| brand | nvarchar(10) | Yes | Brand code |
| coo_key | nvarchar(10) | Yes | → country_of_origin.key_ |
| net_weight | decimal | Yes | Net weight (kg) |
| volume | decimal | Yes | Volume (m³) |
| rubber | float | Yes | Rubber content |
| is_active | bit | Yes | Active flag |

### product_price

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **id** (PK, Identity) | int | No | Auto-increment ID |
| product_key | nvarchar(50) | No | → product.key_ |
| so_type | nvarchar(2) | No | Sales order type |
| price | decimal | No | Unit price |
| effective_from | date | No | Price effective from |
| effective_to | date | No | Price effective to |
| is_active | bit | Yes | Active flag |

### ship_to

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(60) | No | Ship-to code |
| sold_to_key | nvarchar(60) | No | → sold_to.key_ |
| sold_to_area | nvarchar(20) | No | Sales area |
| agech_code | nvarchar(20) | No | Agent/channel code |
| name | nvarchar(100) | Yes | Ship-to name |
| country_key | nvarchar(10) | Yes | → country.key_ |
| is_default | bit | Yes | Default ship-to |
| is_active | bit | Yes | Active flag |

### sold_to

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **key_** (PK) | nvarchar(60) | No | Sold-to code |
| sap_id | nvarchar(30) | No | SAP customer ID |
| so_type | nvarchar(2) | Yes | Sales order type |
| consigned_to_1 | nvarchar(140) | Yes | Consignee line 1 |
| consigned_to_2 | nvarchar(140) | Yes | Consignee line 2 |
| consigned_to_3 | nvarchar(140) | Yes | Consignee line 3 |
| term_of_pay_1 | nvarchar(140) | Yes | Payment term line 1 |
| term_of_pay_2 | nvarchar(140) | Yes | Payment term line 2 |
| term_of_pay_3 | nvarchar(140) | Yes | Payment term line 3 |
| trade_term | nvarchar(20) | Yes | Trade term (Incoterm) |
| ship_from | nvarchar(140) | Yes | Ship from location |
| edi_port | nvarchar(10) | Yes | EDI port code |
| ship_mark_1 | nvarchar(140) | Yes | Shipping mark line 1 |
| ship_mark_2 | nvarchar(140) | Yes | Shipping mark line 2 |
| ship_mark_3 | nvarchar(140) | Yes | Shipping mark line 3 |
| ship_mark_4 | nvarchar(140) | Yes | Shipping mark line 4 |
| ship_mark_5 | nvarchar(140) | Yes | Shipping mark line 5 |

## Tables — Transactions (7)

### tx_audit_log

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** (PK, Identity) | bigint | No | — | Auto-increment ID |
| table_name | nvarchar(60) | No | — | Affected table |
| record_key | nvarchar(255) | No | — | Record primary key |
| action | nvarchar(10) | No | — | INSERT/UPDATE/DELETE |
| column_name | nvarchar(60) | Yes | — | Changed column |
| old_value | nvarchar(max) | Yes | — | Previous value |
| new_value | nvarchar(max) | Yes | — | New value |
| changed_by | nvarchar(200) | No | — | User who made change |
| changed_at | datetime2 | No | sysdatetime() | Change timestamp |

### tx_invoice

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **invoice_key** (PK) | nvarchar(26) | No | Invoice number |
| invoice_date | date | Yes | Invoice date |
| etd | date | Yes | Estimated departure |
| eta | date | Yes | Estimated arrival |
| port_key | nvarchar(3) | Yes | → port.key_ |
| port_of_discharge | nvarchar(5) | Yes | Discharge port code |
| port_of_load | nvarchar(5) | Yes | Loading port code |
| port_of_load_name | nvarchar(30) | Yes | Loading port name |
| consigned_to_1 | nvarchar(50) | Yes | Consignee line 1 |
| consigned_to_2 | nvarchar(50) | Yes | Consignee line 2 |
| consigned_to_3 | nvarchar(50) | Yes | Consignee line 3 |
| feeder_vessel | nvarchar(50) | Yes | Feeder vessel name |
| mother_vessel | nvarchar(50) | Yes | Mother vessel name |
| contract_no | nvarchar(50) | Yes | Contract number |
| lc_no | nvarchar(50) | Yes | Letter of credit no. |
| lc_date | date | Yes | LC date |
| term_of_pay_1 | nvarchar(50) | Yes | Payment term line 1 |
| term_of_pay_2 | nvarchar(50) | Yes | Payment term line 2 |
| term_of_pay_3 | nvarchar(50) | Yes | Payment term line 3 |
| trade_term | nvarchar(30) | Yes | Trade term |
| desc_of_goods_1 | nvarchar(100) | Yes | Goods description 1 |
| desc_of_goods_2 | nvarchar(100) | Yes | Goods description 2 |
| ship_mark_1 | nvarchar(182) | Yes | Shipping mark line 1 |
| ship_mark_2 | nvarchar(182) | Yes | Shipping mark line 2 |
| ship_mark_3 | nvarchar(182) | Yes | Shipping mark line 3 |
| ship_mark_4 | nvarchar(182) | Yes | Shipping mark line 4 |
| ship_mark_5 | nvarchar(182) | Yes | Shipping mark line 5 |
| shiping_remark_1 | nvarchar(182) | Yes | Shipping remark 1 |
| shiping_remark_2 | nvarchar(182) | Yes | Shipping remark 2 |
| voyage_no | nvarchar(50) | Yes | Voyage number |
| confirm_date | date | Yes | Confirmation date |
| bl_no | nvarchar(50) | Yes | Bill of lading no. |
| currency | nvarchar(3) | Yes | Currency code |
| country_code | nvarchar(2) | Yes | Country code |
| booking_no | nvarchar(15) | Yes | Booking number |
| schedule | date | Yes | Schedule date |
| ship_from | nvarchar(255) | Yes | Ship from |
| ship_to | nvarchar(255) | Yes | Ship to |
| carrier_key | nvarchar(40) | Yes | → carrier.key_ |

### tx_invoice_item

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **invoice_key** (PK) | nvarchar(26) | No | → tx_invoice.invoice_key |
| **invoice_item_no** (PK) | int | No | Line item number |
| so_key | nvarchar(20) | No | Sales order key |
| so_line | nvarchar(8) | No | Sales order line |
| product_key | nvarchar(16) | No | → product.key_ |
| kit_key | nvarchar(6) | Yes | Kit identifier |
| product_type | nvarchar(6) | Yes | Product type code |
| description | nvarchar(100) | Yes | Item description |
| qty | int | Yes | Quantity |
| qty_packed | int | Yes | Quantity packed |
| stock_type | nvarchar(4) | Yes | Stock type |
| req1 | nvarchar(6) | Yes | Requirement 1 |
| req2 | nvarchar(6) | Yes | Requirement 2 |

### tx_invoice_item_component

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **invoice_key** (PK) | nvarchar(26) | No | → tx_invoice.invoice_key |
| **invoice_item_no** (PK) | int | No | → tx_invoice_item.invoice_item_no |
| **product_key** (PK) | nvarchar(16) | No | Component product key |
| **component_type** (PK) | nvarchar(2) | No | Component type |
| unit_price | int | Yes | Unit price |
| unit_weight | float | Yes | Unit weight |
| unit_volume | float | Yes | Unit volume |

### tx_packing

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **invoice_key** (PK) | nvarchar(26) | No | → tx_invoice.invoice_key |
| **seq_no** (PK) | int | No | Container sequence |
| container_no | nvarchar(100) | Yes | Container number |
| container_type | nvarchar(100) | Yes | Container type |
| loading_date | date | Yes | Loading date |
| loading_time_period | nvarchar(100) | Yes | Time period |
| remark | nvarchar(max) | Yes | Remarks |

### tx_packing_item

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **invoice_key** (PK) | nvarchar(26) | No | → tx_packing.invoice_key |
| **seq_no** (PK) | int | No | → tx_packing.seq_no |
| **so_key** (PK) | nvarchar(20) | No | Sales order key |
| **so_line** (PK) | nvarchar(8) | No | Sales order line |
| product_key | nvarchar(100) | No | → product.key_ |
| kit_key | nvarchar(6) | Yes | Kit identifier |
| description | nvarchar(100) | Yes | Item description |
| qty | int | Yes | Quantity packed |
| volume | float | Yes | Volume |

### tx_sales_order

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| **so_key** (PK) | nvarchar(20) | No | Sales order number |
| **so_line** (PK) | nvarchar(8) | No | Line item number |
| so_date | date | Yes | Order date |
| so_type | nvarchar(2) | Yes | Order type |
| ship_to_key | nvarchar(60) | Yes | → ship_to.key_ |
| product_key | nvarchar(8) | No | → product.key_ |
| kit_key | nvarchar(3) | Yes | Kit identifier |
| qty_confirmed | int | Yes | Confirmed quantity |
| qty_invoiced | int | Yes | Invoiced quantity |
| qty_packed | int | Yes | Packed quantity |
| production_period | nvarchar(6) | Yes | Production period |
| stock_type | nvarchar(2) | Yes | Stock type |
| req1 | nvarchar(3) | Yes | Requirement 1 |
| req2 | nvarchar(3) | Yes | Requirement 2 |
| remark | nvarchar(max) | Yes | Remarks |

### tx_sales_order_revision

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** (PK, Identity) | int | No | — | Auto-increment ID |
| so_key | nvarchar(20) | No | — | → tx_sales_order.so_key |
| so_line | nvarchar(8) | No | — | → tx_sales_order.so_line |
| revision | int | No | — | Revision number |
| revision_date | datetime2 | No | sysdatetime() | Revision timestamp |
| revision_type | nvarchar(10) | No | — | Type (add/change/cancel) |
| product_key | nvarchar(16) | Yes | — | Product key |
| kit_key | nvarchar(6) | Yes | — | Kit identifier |
| qty | int | No | — | Quantity |
| so_date | date | Yes | — | Order date |
| country_name | nvarchar(200) | Yes | — | Country name |
| to_city | nvarchar(200) | Yes | — | Destination city |
| currency | nvarchar(6) | Yes | — | Currency code |
| production_period | nvarchar(12) | Yes | — | Production period |
| sold_to_area | nvarchar(10) | Yes | — | Sales area |
| agech_code | nvarchar(10) | Yes | — | Agent/channel code |
| so_process_date | datetime2 | Yes | — | Process date |
| so_type | nvarchar(2) | Yes | — | Order type |
| stock_type | nvarchar(4) | Yes | — | Stock type |
| req1 | nvarchar(6) | Yes | — | Requirement 1 |
| req2 | nvarchar(6) | Yes | — | Requirement 2 |
| qty_before | int | No | 0 | Quantity before change |
| qty_after | int | No | 0 | Quantity after change |
| changed_by | nvarchar(200) | Yes | — | Changed by user |
| remark | nvarchar(500) | Yes | — | Remarks |

## Indexes

| Table | Index | Columns | Unique | Filter |
|-------|-------|---------|--------|--------|
| company_signatory | IX_signatory_company | company_key | — | is_active=1 |
| kitting_bom | IX_kitting_bom_product | product_key | — | is_active=1 |
| port | IX_port_country | country_key | — | is_active=1 |
| product | IX_product_group | group_ | — | is_active=1 |
| product | IX_product_type | type | — | is_active=1 |
| product_price | IX_product_price_lookup | product_key, so_type, effective_from | — | is_active=1 |
| ship_to | IX_ship_to_area | sold_to_area | — | — |
| ship_to | IX_ship_to_sold_to | sold_to_key | — | — |
| tx_audit_log | IX_audit_changed_at | changed_at | — | — |
| tx_audit_log | IX_audit_changed_by | changed_by, changed_at | — | — |
| tx_audit_log | IX_audit_table_record | table_name, record_key, changed_at | — | — |
| tx_invoice | IX_tx_inv_date | invoice_date | — | — |
| tx_invoice_item | IX_tx_inv_item_product | product_key | — | — |
| tx_invoice_item | IX_tx_inv_item_so | so_key, so_line | — | — |
| tx_invoice_item_component | IX_tx_inv_item_comp_product | product_key | — | — |
| tx_sales_order | IX_tx_so_date | so_date | — | — |
| tx_sales_order | IX_tx_so_period | production_period | — | — |
| tx_sales_order | IX_tx_so_product_kit | product_key, kit_key | — | — |
| tx_sales_order | IX_tx_so_ship_to | ship_to_key | — | — |
| tx_sales_order_revision | IX_tx_so_rev_date | revision_date | — | — |
| tx_sales_order_revision | UX_tx_so_rev | so_key, so_line, revision | ✓ | — |

## Relationships (Soft FK)

```
company.key_ ←── company_signatory.company_key

country.key_ ←── company.country_key
country.key_ ←── port.country_key
country.key_ ←── ship_to.country_key
country.key_ ←── country_of_origin.country_key

country_of_origin.key_ ←── product.coo_key

product.key_ ←── kitting_bom.product_key
product.key_ ←── kitting_bom.component_key
product.key_ ←── product_price.product_key
product.key_ ←── tx_invoice_item.product_key
product.key_ ←── tx_invoice_item_component.product_key
product.key_ ←── tx_packing_item.product_key
product.key_ ←── tx_sales_order.product_key

sold_to.key_ ←── ship_to.sold_to_key

ship_to.key_ ←── tx_sales_order.ship_to_key

carrier.key_ ←── tx_invoice.carrier_key

port.key_ ←── tx_invoice.port_key

tx_invoice.invoice_key ←── tx_invoice_item.invoice_key
tx_invoice.invoice_key ←── tx_invoice_item_component.invoice_key
tx_invoice.invoice_key ←── tx_packing.invoice_key
tx_invoice.invoice_key ←── tx_packing_item.invoice_key

tx_packing.(invoice_key, seq_no) ←── tx_packing_item.(invoice_key, seq_no)

tx_sales_order.(so_key, so_line) ←── tx_sales_order_revision.(so_key, so_line)
tx_sales_order.(so_key, so_line) ←── tx_invoice_item.(so_key, so_line)
```

## Design Notes

- **Soft FK** — No enforced constraints. App handles integrity.
- **Filtered Indexes** — Master data tables use `WHERE is_active=1`.
- **Audit** — `tx_audit_log` provides field-level change tracking for all master data.
- **Kitting BOM** — Composite key pattern: `product_key + component_key + component_type`.
- **Sales Order Revisions** — Full snapshot of SO line at each revision point with qty_before/qty_after delta tracking.
- **Column Sizing** — nvarchar max_length in SQL Server is bytes (÷2 for character count).
