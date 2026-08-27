-- ============================================================================
-- MIGRATION: 20260827_Add_OnHand_SOH_Cutoff_250826_And_SKUs.sql
-- Nạp 18 SKUs Master Data, Bảng giá bình quân Price Average,
-- và Snapshot Tồn kho thực tế SOH Cut-off 06:00 25/08/2026 (Kho DBD - Bình Dương)
-- ============================================================================

USE [PremixTrackDB];
GO

-- 1. Bổ sung các cột mở rộng cho dbo.dim_Material và dbo.fact_Inventory_SOH nếu chưa có
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.dim_Material') AND name = N'StandardPrice')
    ALTER TABLE dbo.dim_Material ADD StandardPrice DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Inventory_SOH') AND name = N'Region')
    ALTER TABLE dbo.fact_Inventory_SOH ADD Region NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Inventory_SOH') AND name = N'WarehouseCode')
    ALTER TABLE dbo.fact_Inventory_SOH ADD WarehouseCode NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Inventory_SOH') AND name = N'OrgCode')
    ALTER TABLE dbo.fact_Inventory_SOH ADD OrgCode NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Inventory_SOH') AND name = N'SubInventory')
    ALTER TABLE dbo.fact_Inventory_SOH ADD SubInventory NVARCHAR(50) NULL DEFAULT N'RAW';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Inventory_SOH') AND name = N'AveragePrice')
    ALTER TABLE dbo.fact_Inventory_SOH ADD AveragePrice DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Inventory_SOH') AND name = N'SnapshotDate')
    ALTER TABLE dbo.fact_Inventory_SOH ADD SnapshotDate DATE NULL DEFAULT '2026-08-25';

PRINT N'>>> Đã bổ sung đầy đủ các cột mở rộng cho dbo.dim_Material và dbo.fact_Inventory_SOH.';
GO

-- 2. Nạp và Chuẩn Hóa 18 SKUs vào dbo.dim_Material
MERGE INTO dbo.dim_Material AS Target
USING (VALUES
    (N'MAT-1001010', N'1001010', N'BARLEY', N'Barley Feed Grain', N'Grain', N'KG', 0.34, 8450.0, N'Austin', 14, 1),
    (N'MAT-1002010', N'1002010', N'CORN', N'Yellow Corn Grain', N'Grain', N'KG', 0.29, 7181.0, N'Austin', 10, 1),
    (N'MAT-1002101', N'1002101', N'CORN GLUTENFEED >20%CP', N'Corn Gluten Feed >20% CP', N'Protein', N'KG', 0.27, 6799.0, N'Austin', 14, 1),
    (N'MAT-1002150', N'1002150', N'CORN GLUTEN MEAL 60%', N'Corn Gluten Meal 60% CP', N'Protein', N'KG', 0.73, 18265.0, N'Fiona', 14, 1),
    (N'MAT-1002500', N'1002500', N'CORN STARCH', N'Corn Starch Food/Feed Grade', N'Grain', N'KG', 0.48, 11988.0, N'Austin', 10, 1),
    (N'MAT-1003010', N'1003010', N'Wheat', N'Feed Wheat Grain', N'Grain', N'KG', 0.30, 7447.0, N'Austin', 10, 1),
    (N'MAT-1003100', N'1003100', N'Vital Wheat Gluten', N'Vital Wheat Gluten 75-80% CP', N'Protein', N'KG', 1.55, 38800.0, N'Fiona', 14, 1),
    (N'MAT-1003356', N'1003356', N'WHEATBRAN MEAL coarse', N'Coarse Wheat Bran Meal', N'Grain', N'KG', 0.25, 6372.0, N'Austin', 10, 1),
    (N'MAT-1005010', N'1005010', N'RICEBRAN 12/12/12', N'Defatted Rice Bran 12/12/12', N'Grain', N'KG', 0.30, 7600.0, N'Austin', 10, 1),
    (N'MAT-1005100', N'1005100', N'RICE HULLS', N'Ground Rice Hulls / Carrier', N'Carriers_Minerals', N'KG', 0.18, 4400.0, N'Austin', 7, 1),
    (N'MAT-1005150', N'1005150', N'RICE BROKEN', N'Broken Rice Grain', N'Grain', N'KG', 0.33, 8350.0, N'Austin', 10, 1),
    (N'MAT-1012106', N'1012106', N'DDGS CORN STANDARD QUALITY US', N'Corn Distillers Dried Grains with Solubles US', N'Protein', N'KG', 0.29, 7200.0, N'Austin', 14, 1),
    (N'MAT-1012160', N'1012160', N'DDG CORN/YEAST 40%CP', N'Corn Yeast Distillers Grains 40% CP', N'Protein', N'KG', 0.40, 9954.0, N'Fiona', 14, 1),
    (N'MAT-1012500', N'1012500', N'Rice DDGS', N'Rice Distillers Dried Grains', N'Protein', N'KG', 0.30, 7500.0, N'Austin', 14, 1),
    (N'1101018', N'1101018', N'SOYABEANMEAL 48% CP', N'Soybean Meal Dehulled 48% CP', N'Protein', N'KG', 0.46, 11543.0, N'Austin', 10, 1),
    (N'1101107', N'1101107', N'SOY HULLS', N'Pelleted Soybean Hulls', N'Grain', N'KG', 0.21, 5365.0, N'Austin', 10, 1),
    (N'1101330', N'1101330', N'SPC SOYTIDE 55%', N'Fermented Soy Protein Concentrate SPC 55%', N'Protein', N'KG', 0.83, 20866.0, N'Fiona', 20, 1),
    (N'1102002', N'1102002', N'RSM 00 > 38%CP GMO', N'Rapeseed Meal Canola 00 > 38% CP GMO', N'Protein', N'KG', 0.34, 8390.0, N'Austin', 14, 1)
) AS Source (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, StandardPrice, PIC, SafetyStockDays, IsActive)
ON Target.MaterialCode = Source.MaterialCode
WHEN MATCHED THEN
    UPDATE SET 
        Name_VN = Source.Name_VN,
        Name_EN = Source.Name_EN,
        Category = Source.Category,
        StandardPrice = Source.StandardPrice,
        UnitPriceUSD = Source.UnitPriceUSD,
        PIC = Source.PIC,
        SafetyStockDays = Source.SafetyStockDays,
        IsActive = Source.IsActive
WHEN NOT MATCHED THEN
    INSERT (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, StandardPrice, PIC, SafetyStockDays, IsActive, CreatedDate)
    VALUES (Source.MaterialID, Source.MaterialCode, Source.Name_VN, Source.Name_EN, Source.Category, Source.Unit, Source.UnitPriceUSD, Source.StandardPrice, Source.PIC, Source.SafetyStockDays, Source.IsActive, SYSDATETIME());

PRINT N'>>> Đã đồng bộ thành công 18 SKUs vào dbo.dim_Material.';
GO

-- 3. Nạp Snapshot Tồn Kho SOH Cut-off 06:00 25/08/2026 (Kho DBD)
MERGE INTO dbo.fact_Inventory_SOH AS Target
USING (VALUES
    (N'SOH-DBD-1001010', N'FAC-DBD', N'1001010', 223683.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 8450.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1002010', N'FAC-DBD', N'1002010', 1110520.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 7181.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1002101', N'FAC-DBD', N'1002101', 210050.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 6799.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1002150', N'FAC-DBD', N'1002150', 64934.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 18265.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1002500', N'FAC-DBD', N'1002500', 1996.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 11988.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1003010', N'FAC-DBD', N'1003010', 1062664.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 7447.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1003100', N'FAC-DBD', N'1003100', 375.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 38800.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1003356', N'FAC-DBD', N'1003356', 345716.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 6372.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1005010', N'FAC-DBD', N'1005010', 17047.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 7600.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1005100', N'FAC-DBD', N'1005100', 5990.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 4400.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1005150', N'FAC-DBD', N'1005150', 252039.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 8350.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1012106', N'FAC-DBD', N'1012106', 207108.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 7200.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1012160', N'FAC-DBD', N'1012160', 169819.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 9954.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1012500', N'FAC-DBD', N'1012500', 6390.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 7500.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1101018', N'FAC-DBD', N'1101018', 533170.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 11543.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1101107', N'FAC-DBD', N'1101107', 229883.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 5365.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1101330', N'FAC-DBD', N'1101330', 48275.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 20866.0, CAST('2026-08-25' AS DATE)),
    (N'SOH-DBD-1102002', N'FAC-DBD', N'1102002', 358441.0, N'SOUTH', N'DBD', N'DBD', N'RAW', 8390.0, CAST('2026-08-25' AS DATE))
) AS Source (SOH_ID, FactoryID, MaterialCode, SOHQtyKg, Region, WarehouseCode, OrgCode, SubInventory, AveragePrice, SnapshotDate)
ON Target.SOH_ID = Source.SOH_ID
WHEN MATCHED THEN
    UPDATE SET 
        SOHQtyKg = Source.SOHQtyKg,
        Region = Source.Region,
        WarehouseCode = Source.WarehouseCode,
        OrgCode = Source.OrgCode,
        SubInventory = Source.SubInventory,
        AveragePrice = Source.AveragePrice,
        SnapshotDate = Source.SnapshotDate,
        LastUpdated = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (SOH_ID, FactoryID, MaterialCode, SOHQtyKg, Region, WarehouseCode, OrgCode, SubInventory, AveragePrice, SnapshotDate, LastUpdated)
    VALUES (Source.SOH_ID, Source.FactoryID, Source.MaterialCode, Source.SOHQtyKg, Source.Region, Source.WarehouseCode, Source.OrgCode, Source.SubInventory, Source.AveragePrice, Source.SnapshotDate, SYSDATETIME());

PRINT N'>>> Đã nạp thành công dữ liệu tồn kho SOH cut-off 06:00 25/08/2026 (Kho DBD) vào dbo.fact_Inventory_SOH.';
GO

-- 4. Bổ sung Ánh Xạ Header Từ Điển D365 FO (sys_Import_Mapping)
MERGE INTO dbo.sys_Import_Mapping AS Target
USING (VALUES
    (N'MAP-OH-01', N'ON_HAND', N'REGION', N'Region', N'STRING', 0),
    (N'MAP-OH-02', N'ON_HAND', N'WAREHOUSE', N'WarehouseCode', N'STRING', 1),
    (N'MAP-OH-03', N'ON_HAND', N'ORG CODE', N'OrgCode', N'STRING', 0),
    (N'MAP-OH-04', N'ON_HAND', N'SUB INV', N'SubInventory', N'STRING', 0),
    (N'MAP-OH-05', N'ON_HAND', N'ITEM CODE', N'MaterialCode', N'STRING', 1),
    (N'MAP-OH-06', N'ON_HAND', N'ITEM NAME', N'MaterialName', N'STRING', 1),
    (N'MAP-OH-07', N'ON_HAND', N'SOH', N'SOHQtyKg', N'DECIMAL', 1),
    (N'MAP-OH-08', N'ON_HAND', N'Price Average', N'AveragePrice', N'DECIMAL', 0)
) AS Source (MappingID, TemplateType, SourceColumnHeader, TargetDbField, DataType, IsRequired)
ON Target.TemplateType = Source.TemplateType AND Target.SourceColumnHeader = Source.SourceColumnHeader
WHEN MATCHED THEN
    UPDATE SET TargetDbField = Source.TargetDbField, DataType = Source.DataType, IsRequired = Source.IsRequired, LastUsedAt = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (MappingID, TemplateType, SourceColumnHeader, TargetDbField, DataType, IsRequired, LastUsedAt)
    VALUES (Source.MappingID, Source.TemplateType, Source.SourceColumnHeader, Source.TargetDbField, Source.DataType, Source.IsRequired, SYSDATETIME());

PRINT N'>>> Đã bổ sung 8 quy tắc ánh xạ Header On Hand D365 FO vào dbo.sys_Import_Mapping.';
GO
