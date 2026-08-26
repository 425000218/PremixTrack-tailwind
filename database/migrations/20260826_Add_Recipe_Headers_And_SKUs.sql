-- ============================================================================
-- MIGRATION: 20260826_Add_Recipe_Headers_And_SKUs.sql
-- Thêm 2 headers ánh xạ mới: 'Material code', 'Material description'
-- Thêm 2 mã nguyên liệu mới: 1002250 (CORN GERMS), 1003030 (WHEAT >12%CP)
-- ============================================================================

USE [PremixTrackDB];
GO

-- 1. Bổ sung 2 nguyên liệu mới vào dim_Material
MERGE INTO dbo.dim_Material AS Target
USING (VALUES
    (N'MAT-1002250', N'1002250', N'CORN GERMS', N'Corn Germs Meal', N'Ngũ cốc', N'KG', 0.3500, N'Austin', 20, 30000, 50.0, 1),
    (N'MAT-1003030', N'1003030', N'WHEAT >12%CP', N'High Protein Wheat Grain >12%CP', N'Ngũ cốc', N'KG', 0.3150, N'Austin', 20, 50000, 50.0, 1)
) AS Source (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, PIC, SafetyStockDays, MinOrderQty, StandardPackingKg, IsActive)
ON Target.MaterialCode = Source.MaterialCode
WHEN MATCHED THEN
    UPDATE SET Name_VN = Source.Name_VN, Name_EN = Source.Name_EN, Category = Source.Category, Unit = Source.Unit, UnitPriceUSD = Source.UnitPriceUSD, PIC = Source.PIC, IsActive = Source.IsActive
WHEN NOT MATCHED THEN
    INSERT (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, PIC, SafetyStockDays, MinOrderQty, StandardPackingKg, IsActive)
    VALUES (Source.MaterialID, Source.MaterialCode, Source.Name_VN, Source.Name_EN, Source.Category, Source.Unit, Source.UnitPriceUSD, Source.PIC, Source.SafetyStockDays, Source.MinOrderQty, Source.StandardPackingKg, Source.IsActive);
PRINT N'>>> Đã cập nhật 2 mã SKU mới vào dbo.dim_Material (1002250, 1003030)';
GO

-- 2. Bổ sung 2 header ánh xạ mới vào sys_Import_Mapping
MERGE INTO dbo.sys_Import_Mapping AS Target
USING (VALUES
    (N'MAP-M12', N'Material', N'Material code', N'MaterialCode', N'STRING', 1),
    (N'MAP-M13', N'Material', N'Material description', N'Name_VN', N'STRING', 1),
    (N'MAP-FC01', N'FORECAST', N'Material code', N'MaterialCode', N'STRING', 1),
    (N'MAP-FC02', N'FORECAST', N'Material description', N'MaterialName', N'STRING', 1)
) AS Source (MappingID, TemplateType, SourceColumnHeader, TargetDbField, DataType, IsRequired)
ON Target.TemplateType = Source.TemplateType AND Target.SourceColumnHeader = Source.SourceColumnHeader
WHEN MATCHED THEN
    UPDATE SET TargetDbField = Source.TargetDbField, DataType = Source.DataType, IsRequired = Source.IsRequired, LastUsedAt = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (MappingID, TemplateType, SourceColumnHeader, TargetDbField, DataType, IsRequired, LastUsedAt)
    VALUES (Source.MappingID, Source.TemplateType, Source.SourceColumnHeader, Source.TargetDbField, Source.DataType, Source.IsRequired, SYSDATETIME());
PRINT N'>>> Đã bổ sung 2 Header ánh xạ mới: Material code & Material description vào dbo.sys_Import_Mapping';
GO
