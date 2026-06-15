-- Add Warehouse Management main menu to app_permission
-- L1: Warehouse (key=3000, sorting=30, between Shipping(20) and Support(80))
-- L2: Inventory (key=3100)
-- L3: Stock Overview (key=3101)

INSERT INTO app_permission (key_, name_th, name_en, path, level, is_divider, sorting, icon, is_authorized, parent_key, is_active, created_at, updated_at)
VALUES
('3000', N'คลังสินค้า', 'Warehouse', NULL, 1, 0, 30, 'warehouse', 1, NULL, 1, GETUTCDATE(), GETUTCDATE()),
('3100', N'สินค้าคงคลัง', 'Inventory', NULL, 2, 0, 10, NULL, 1, '3000', 1, GETUTCDATE(), GETUTCDATE()),
('3101', N'ภาพรวมสต็อก', 'Stock Overview', '/warehouse/stock', 3, 0, 10, NULL, 1, '3100', 1, GETUTCDATE(), GETUTCDATE());
