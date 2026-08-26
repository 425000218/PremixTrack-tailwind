-- ============================================================================
-- PREMIXTRACK ENTERPRISE SEED DATA (MS SQL SERVER 2022)
-- Dữ liệu mẫu chuẩn hóa: Master Data (18 SKUs, 22 Nhà máy, NCC) & Forecast Runs
-- ============================================================================

USE [PremixTrackDB];
GO

SET NOCOUNT ON;

-- 1. NẠP DANH MỤC KHU VỰC (dim_Region)
MERGE INTO dbo.dim_Region AS Target
USING (VALUES
    (N'REG-SOUTH', N'Miền Đông & Tây Nam Bộ', N'Southern Region'),
    (N'REG-NORTH', N'Miền Bắc & Duyên Hải', N'Northern Region'),
    (N'REG-CENTRAL', N'Miền Trung & Tây Nguyên', N'Central & Highlands'),
    (N'REG-MEKONG', N'Đồng Bằng Sông Cửu Long', N'Mekong Delta Region')
) AS Source (RegionID, RegionName, RegionName_EN)
ON Target.RegionID = Source.RegionID
WHEN MATCHED THEN
    UPDATE SET RegionName = Source.RegionName, RegionName_EN = Source.RegionName_EN
WHEN NOT MATCHED THEN
    INSERT (RegionID, RegionName, RegionName_EN) VALUES (Source.RegionID, Source.RegionName, Source.RegionName_EN);
PRINT N'>>> Đã đồng bộ dữ liệu dbo.dim_Region';
GO

-- 2. NẠP DANH MỤC 22 NHÀ MÁY & RECIPE SITES (dim_Factory)
MERGE INTO dbo.dim_Factory AS Target
USING (VALUES
    (N'FAC-043', N'DBD', N'043 Binh Duong VN', N'Binh Duong Plant', N'Livestock', N'REG-SOUTH', N'KCN Sóng Thần, Dĩ An, Bình Dương', 35000, N'Active'),
    (N'FAC-0432', N'DNA', N'0432 Nghe An VN', N'Nghe An Plant', N'Livestock', N'REG-NORTH', N'KCN VSIP, Hưng Nguyên, Nghệ An', 28000, N'Active'),
    (N'FAC-0434', N'DHG', N'0434 Hau Giang VN', N'Hau Giang Plant', N'Livestock', N'REG-MEKONG', N'KCN Sông Hậu, Châu Thành, Hậu Giang', 25000, N'Active'),
    (N'FAC-0436', N'HPG1', N'0436 Hai Phong 1 PC VN', N'Hai Phong 1 Plant', N'Livestock', N'REG-NORTH', N'KCN Nam Cầu Kiền, Thủy Nguyên, Hải Phòng', 30000, N'Active'),
    (N'FAC-0437', N'PCT', N'0437 Can Tho 1 PC VN', N'Can Tho 1 Plant', N'Livestock', N'REG-MEKONG', N'KCN Trà Nóc 1, Bình Thủy, Cần Thơ', 22000, N'Active'),
    (N'FAC-0438', N'PBD', N'0438 Binh Dinh 1 PC VN', N'Binh Dinh 1 Plant', N'Livestock', N'REG-CENTRAL', N'KCN Phú Tài, Quy Nhơn, Bình Định', 24000, N'Active'),
    (N'FAC-0439', N'DCO', N'0439 Can Tho 2 DH VN', N'Can Tho 2 Aqua Plant', N'Aqua', N'REG-MEKONG', N'KCN Thốt Nốt, Cần Thơ', 18000, N'Active'),
    (N'FAC-044', N'HPG2', N'044 Hai Phong 2 DH VN', N'Hai Phong 2 Aqua Plant', N'Aqua', N'REG-NORTH', N'KCN Đình Vũ, Hải Phòng', 20000, N'Active'),
    (N'FAC-045', N'DVL', N'045 Vinh Long 1 VN', N'Vinh Long 1 Plant', N'Livestock', N'REG-MEKONG', N'KCN Hòa Phú, Long Hồ, Vĩnh Long', 32000, N'Active'),
    (N'FAC-0452', N'DLA', N'0452 Long An VN', N'Long An Plant', N'Livestock', N'REG-SOUTH', N'KCN Đức Hòa 1, Đức Hòa, Long An', 40000, N'Active'),
    (N'FAC-0453', N'DHY', N'0453 Hung Yen VN', N'Hung Yen Plant', N'Livestock', N'REG-NORTH', N'KCN Phố Nối A, Mỹ Hào, Hưng Yên', 36000, N'Active'),
    (N'FAC-0454', N'DVL5', N'0454 Vinh Long 5 VN', N'Vinh Long 5 Aqua Plant', N'Aqua', N'REG-MEKONG', N'KCN Bình Minh, Vĩnh Long', 16000, N'Active'),
    (N'FAC-0455', N'DDN3', N'0455 Dong Nai 3 VN', N'Dong Nai 3 Plant', N'Livestock', N'REG-SOUTH', N'KCN Amata, Biên Hòa, Đồng Nai', 45000, N'Active'),
    (N'FAC-0456', N'DHN', N'0456 Ha Nam Livestock VN', N'Ha Nam Livestock Plant', N'Livestock', N'REG-NORTH', N'KCN Đồng Văn 2, Duy Tiên, Hà Nam', 34000, N'Active'),
    (N'FAC-0457', N'DHNA', N'0457 Ha Nam Aqua VN', N'Ha Nam Aqua Plant', N'Aqua', N'REG-NORTH', N'KCN Đồng Văn 4, Kim Bảng, Hà Nam', 18000, N'Active'),
    (N'FAC-0458', N'DBD3', N'0458 Binh Dinh 3 VN', N'Binh Dinh 3 Plant', N'Livestock', N'REG-CENTRAL', N'KCN Nhơn Hòa, An Nhơn, Bình Định', 26000, N'Active'),
    (N'FAC-046', N'DDN', N'046 Dong Nai 1 DH VN', N'Dong Nai 1 Aqua Plant', N'Aqua', N'REG-SOUTH', N'KCN Biên Hòa 2, Đồng Nai', 22000, N'Active'),
    (N'FAC-0461', N'DSP', N'0461 Dong Nai 2 Premix VN', N'Dong Nai Premix Plant', N'Premix', N'REG-SOUTH', N'KCN Long Thành, Đồng Nai', 15000, N'Active'),
    (N'FAC-047', N'DVP', N'047 Vinh Phuc VN', N'Vinh Phuc Plant', N'Livestock', N'REG-NORTH', N'KCN Khai Quang, Vĩnh Yên, Vĩnh Phúc', 28000, N'Active'),
    (N'FAC-048', N'DBQ', N'048 Binh Dinh 2 DH VN', N'Binh Dinh 2 Aqua Plant', N'Aqua', N'REG-CENTRAL', N'KCN Long Mỹ, Quy Nhơn, Bình Định', 19000, N'Active'),
    (N'FAC-049', N'DVM', N'049 Vinh Long 2 VN', N'Vinh Long 2 Aqua Plant', N'Aqua', N'REG-MEKONG', N'KCN Cổ Chiên, Vĩnh Long', 21000, N'Active'),
    (N'FAC-0512', N'DVL4', N'0512 Vinh Long 4 VN', N'Vinh Long 4 Plant', N'Livestock', N'REG-MEKONG', N'KCN Bình Tân, Vĩnh Long', 25000, N'Active')
) AS Source (FactoryID, InternalCode, FactoryName_VN, FactoryName_EN, Division, RegionID, Address, CapacityTonsPerMonth, ActiveStatus)
ON Target.FactoryID = Source.FactoryID
WHEN MATCHED THEN
    UPDATE SET 
        InternalCode = Source.InternalCode,
        FactoryName_VN = Source.FactoryName_VN,
        FactoryName_EN = Source.FactoryName_EN,
        Division = Source.Division,
        RegionID = Source.RegionID,
        Address = Source.Address,
        CapacityTonsPerMonth = Source.CapacityTonsPerMonth,
        ActiveStatus = Source.ActiveStatus
WHEN NOT MATCHED THEN
    INSERT (FactoryID, InternalCode, FactoryName_VN, FactoryName_EN, Division, RegionID, Address, CapacityTonsPerMonth, ActiveStatus)
    VALUES (Source.FactoryID, Source.InternalCode, Source.FactoryName_VN, Source.FactoryName_EN, Source.Division, Source.RegionID, Source.Address, Source.CapacityTonsPerMonth, Source.ActiveStatus);
PRINT N'>>> Đã đồng bộ dữ liệu dbo.dim_Factory (22 cơ sở)';
GO

-- 3. NẠP DANH MỤC NGUYÊN LIỆU D365 FO (dim_Material / tblITEM - 18 SKUs)
MERGE INTO dbo.dim_Material AS Target
USING (VALUES
    (N'MAT-1001010', N'1001010', N'BARLEY', N'Barley Grain', N'Ngũ cốc', N'KG', 0.2850, N'Austin', 20, 50000, 50.0, 1),
    (N'MAT-1002010', N'1002010', N'CORN', N'Yellow Corn Grain', N'Ngũ cốc', N'KG', 0.2450, N'Austin', 25, 100000, 50.0, 1),
    (N'MAT-1002101', N'1002101', N'CORN GLUTENFEED >20%CP', N'Corn Gluten Feed', N'Đạm thực vật', N'KG', 0.3100, N'Austin', 15, 30000, 50.0, 1),
    (N'MAT-1002150', N'1002150', N'CORN GLUTENMEAL 60%CP', N'Corn Gluten Meal 60%', N'Đạm thực vật', N'KG', 0.7200, N'Austin', 15, 20000, 50.0, 1),
    (N'MAT-1002250', N'1002250', N'CORN GERMS', N'Corn Germs Meal', N'Ngũ cốc', N'KG', 0.3500, N'Austin', 20, 30000, 50.0, 1),
    (N'MAT-1003010', N'1003010', N'WHEAT', N'Feed Wheat Grain', N'Ngũ cốc', N'KG', 0.2950, N'Austin', 20, 50000, 50.0, 1),
    (N'MAT-1003030', N'1003030', N'WHEAT >12%CP', N'High Protein Wheat Grain >12%CP', N'Ngũ cốc', N'KG', 0.3150, N'Austin', 20, 50000, 50.0, 1),
    (N'MAT-1101330', N'1101330', N'SPC SOYTIDE 55%', N'Soy Protein Concentrate 55%', N'Đạm tinh chế', N'KG', 1.1500, N'Fiona', 20, 15000, 25.0, 1),
    (N'MAT-1703010', N'1703010', N'DEXTROSE (GLUCOSE)', N'Dextrose Monohydrate', N'Đường / Năng lượng', N'KG', 0.8500, N'Fiona', 15, 10000, 25.0, 1),
    (N'MAT-2101010', N'2101010', N'WHEY POWDER SWEET', N'Sweet Whey Powder', N'Sữa & Chế phẩm', N'KG', 1.0500, N'Fiona', 20, 15000, 25.0, 1),
    (N'MAT-2302010', N'2302010', N'MONO CALCIUM PHOSPHATE', N'Mono Calcium Phosphate (MCP)', N'Khoáng Đa Lượng', N'KG', 0.6800, N'Fiona', 18, 20000, 25.0, 1),
    (N'MAT-2302020', N'2302020', N'DICALCIUM PHOSPHATE', N'Dicalcium Phosphate (DCP)', N'Khoáng Đa Lượng', N'KG', 0.6200, N'Fiona', 18, 20000, 25.0, 1),
    (N'MAT-2303050', N'2303050', N'NA BICARBONATE', N'Sodium Bicarbonate Feed Grade', N'Đệm pH / Điện giải', N'KG', 0.4200, N'Fiona', 15, 10000, 25.0, 1),
    (N'MAT-2403050', N'2403050', N'ARBOCEL RC', N'Arbocel Crude Fiber Concentrate', N'Chất xơ tinh chế', N'KG', 1.4500, N'Fiona', 25, 5000, 20.0, 1),
    (N'MAT-3201050', N'3201050', N'L-LYSINE HCL 99%', N'L-Lysine Monohydrochloride 98.5%', N'Acid Amin', N'KG', 1.6500, N'Heidi', 20, 20000, 25.0, 1),
    (N'MAT-3202010', N'3202010', N'DL-METHIONINE 99%', N'DL-Methionine 99% Feed Grade', N'Acid Amin', N'KG', 2.8500, N'Heidi', 20, 15000, 25.0, 1),
    (N'MAT-3203010', N'3203010', N'L-THREONINE 98.5%', N'L-Threonine 98.5% Feed Grade', N'Acid Amin', N'KG', 1.8000, N'Heidi', 20, 15000, 25.0, 1),
    (N'MAT-3204010', N'3204010', N'L-TRYPTOPHAN 98%', N'L-Tryptophan 98% Feed Grade', N'Acid Amin', N'KG', 7.5000, N'Nelly', 30, 2000, 25.0, 1),
    (N'MAT-3206010', N'3206010', N'L-VALINE 98%', N'L-Valine 98% Feed Grade', N'Acid Amin', N'KG', 4.2000, N'Nelly', 25, 3000, 25.0, 1),
    (N'MAT-89C8004', N'89C8004', N'CHOLINE CHLORIDE 60%', N'Choline Chloride 60% Corn Cob', N'Vitamin & Tiền chất', N'KG', 0.9200, N'Talena', 20, 10000, 25.0, 1)
) AS Source (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, PIC, SafetyStockDays, MinOrderQty, StandardPackingKg, IsActive)
ON Target.MaterialCode = Source.MaterialCode
WHEN MATCHED THEN
    UPDATE SET 
        Name_VN = Source.Name_VN,
        Name_EN = Source.Name_EN,
        Category = Source.Category,
        Unit = Source.Unit,
        UnitPriceUSD = Source.UnitPriceUSD,
        PIC = Source.PIC,
        SafetyStockDays = Source.SafetyStockDays,
        MinOrderQty = Source.MinOrderQty,
        StandardPackingKg = Source.StandardPackingKg,
        IsActive = Source.IsActive
WHEN NOT MATCHED THEN
    INSERT (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, PIC, SafetyStockDays, MinOrderQty, StandardPackingKg, IsActive)
    VALUES (Source.MaterialID, Source.MaterialCode, Source.Name_VN, Source.Name_EN, Source.Category, Source.Unit, Source.UnitPriceUSD, Source.PIC, Source.SafetyStockDays, Source.MinOrderQty, Source.StandardPackingKg, Source.IsActive);
PRINT N'>>> Đã đồng bộ dữ liệu dbo.dim_Material (18 SKUs)';
GO

-- 4. NẠP DANH MỤC NHÀ CUNG CẤP (dim_Supplier / tblNCC)
MERGE INTO dbo.dim_Supplier AS Target
USING (VALUES
    (N'SUP-1006576', N'1006576', N'Meihua', N'Meihua Group International Trading (Hong Kong) Limited', N'IMPORT', N'_', N'DDP', N'0', N'sales@meihuagroup.com', N'_', NULL, NULL, 1),
    (N'SUP-1025933', N'1025933', N'Adisseo Asia', N'Adisseo Asia Pacific Pte Ltd', N'IMPORT', N'_', N'DDP', N'Net 60', N'orders.apac@adisseo.com', N'_', NULL, NULL, 1),
    (N'SUP-1033752', N'1033752', N'NHU (HongKong)', N'NHU (HongKong) Trading Co., Ltd', N'IMPORT', N'_', N'CIF', N'Net 60', N'contact@nhu-hk.com', N'_', NULL, NULL, 1),
    (N'SUP-1037442', N'1037442', N'Isetara (M)', N'Isetara (M) Sdn Bhd', N'IMPORT', N'_', N'DDP', N'Net 30', N'supply@isetara.com.my', N'_', NULL, NULL, 1),
    (N'SUP-1038683', N'1038683', N'Zhucheng Dongxiao', N'Zhucheng Dongxiao Biotechnology Co., Ltd', N'IMPORT', N'_', N'DDP', N'Net 30', N'export@dongxiaobio.com', N'_', NULL, NULL, 1),
    (N'SUP-1039337', N'1039337', N'Xinjiang Fufeng', N'Xinjiang Fufeng Biotechnologies Co., Ltd', N'IMPORT', N'_', N'DDP', N'Net 30', N'trade@fufengbio.com', N'_', NULL, NULL, 1),
    (N'SUP-1040741', N'1040741', N'Rubamin', N'Rubamin Private Limited', N'IMPORT', N'_', N'DDP', N'0', N'info@rubamin.com', N'_', NULL, NULL, 1),
    (N'SUP-1044462', N'1044462', N'Liaoning Biochem', N'Liaoning Biochem Co., Ltd.', N'IMPORT', N'_', N'DDP', N'Net 30', N'sales@liaoningbiochem.com', N'_', NULL, NULL, 1),
    (N'SUP-1044491', N'1044491', N'Eton Food', N'Eton Food Co., Ltd', N'IMPORT', N'_', N'DDP', N'Net 30', N'contact@etonfood.cn', N'_', NULL, NULL, 1),
    (N'SUP-1044533', N'1044533', N'Heilongjiang Jinxiang', N'Heilongjiang Jinxiang Biochemical Co., Ltd', N'IMPORT', N'_', N'DDP', N'Net 30', N'jinxiang@biochem.cn', N'_', NULL, NULL, 1),
    (N'SUP-1044894', N'1044894', N'Eppen Asia', N'Eppen Asia Pte. Ltd', N'IMPORT', N'_', N'DDP', N'Net 45', N'asia.sales@eppen.com', N'_', NULL, NULL, 1),
    (N'SUP-1030068', N'1030068', N'EVONIK', N'Công Ty TNHH Evonik Việt Nam', N'LOCAL', N'14/HĐMH-2023', N'DDP', N'Net 60', N'tam.luong@evonik.com', N'0309988776', NULL, NULL, 1),
    (N'SUP-1035521', N'1035521', N'NÔNG SẢN VIỆT', N'Công Ty Cổ Phần Nông Sản Việt', N'LOCAL', N'08/HĐMH-2024', N'DDP', N'Net 30', N'contact@nongsanviet.vn', N'0312345678', NULL, NULL, 1)
) AS Source (SupplierID, SupplierCode, ShortName, FullName, SupplierType, ContractNo, Incoterm, PaymentTerms, Email, TaxCode, Note_0, Note_1, IsActive)
ON Target.SupplierCode = Source.SupplierCode
WHEN MATCHED THEN
    UPDATE SET 
        ShortName = Source.ShortName,
        FullName = Source.FullName,
        SupplierType = Source.SupplierType,
        ContractNo = Source.ContractNo,
        Incoterm = Source.Incoterm,
        PaymentTerms = Source.PaymentTerms,
        Email = Source.Email,
        TaxCode = Source.TaxCode,
        IsActive = Source.IsActive
WHEN NOT MATCHED THEN
    INSERT (SupplierID, SupplierCode, ShortName, FullName, SupplierType, ContractNo, Incoterm, PaymentTerms, Email, TaxCode, Note_0, Note_1, IsActive)
    VALUES (Source.SupplierID, Source.SupplierCode, Source.ShortName, Source.FullName, Source.SupplierType, Source.ContractNo, Source.Incoterm, Source.PaymentTerms, Source.Email, Source.TaxCode, Source.Note_0, Source.Note_1, Source.IsActive);
PRINT N'>>> Đã đồng bộ dữ liệu dbo.dim_Supplier';
GO

-- 5. NẠP MA TRẬN NGUYÊN LIỆU THAY THẾ (dim_Material_Substitution)
MERGE INTO dbo.dim_Material_Substitution AS Target
USING (VALUES
    (N'SUB-001', N'2302010', N'2302020', 1.0500, 1, N'Thay thế MCP bằng DCP (tỷ lệ 1:1.05 bù phospho)', '2024-01-01', NULL, 1),
    (N'SUB-002', N'1002010', N'1003010', 1.0000, 1, N'Thay thế Bắp (Corn) bằng Lúa Mì (Wheat) khi giá bắp tăng', '2024-01-01', NULL, 1),
    (N'SUB-003', N'1002010', N'1001010', 1.0200, 2, N'Thay thế Bắp bằng Đại Mạch (Barley)', '2024-01-01', NULL, 1),
    (N'SUB-004', N'1002150', N'1002101', 2.8000, 1, N'Bù đạm bắp CGM 60% bằng CGF >20% (cần tăng tỷ lệ)', '2024-01-01', NULL, 1)
) AS Source (SubID, PrimaryMaterialCode, AltMaterialCode, SubstitutionRatio, PriorityOrder, Notes, ValidFrom, ValidTo, IsActive)
ON Target.SubID = Source.SubID
WHEN MATCHED THEN
    UPDATE SET 
        PrimaryMaterialCode = Source.PrimaryMaterialCode,
        AltMaterialCode = Source.AltMaterialCode,
        SubstitutionRatio = Source.SubstitutionRatio,
        PriorityOrder = Source.PriorityOrder,
        Notes = Source.Notes,
        IsActive = Source.IsActive
WHEN NOT MATCHED THEN
    INSERT (SubID, PrimaryMaterialCode, AltMaterialCode, SubstitutionRatio, PriorityOrder, Notes, ValidFrom, ValidTo, IsActive)
    VALUES (Source.SubID, Source.PrimaryMaterialCode, Source.AltMaterialCode, Source.SubstitutionRatio, Source.PriorityOrder, Source.Notes, Source.ValidFrom, Source.ValidTo, Source.IsActive);
PRINT N'>>> Đã đồng bộ dữ liệu dbo.dim_Material_Substitution';
GO

-- 6. NẠP CÁC ĐỢT FORECAST LỊCH SỬ TỪ R&D (fact_Forecast_Version)
MERGE INTO dbo.fact_Forecast_Version AS Target
USING (VALUES
    (N'FC-2026-08-21', '2026-08-21', N'RD_FC_Matrix_20260821_Official.xlsx', 275547439, 38, 22, '2026-08-21 08:30:00', N'Minh (R&D)', N'RD_FC_Matrix_20260821_Official.xlsx', N'Chạy công thức tuần 34'),
    (N'FC-2026-08-16', '2026-08-16', N'RD_FC_Matrix_20260816_V2.xlsx', 274842662, 38, 22, '2026-08-16 09:15:00', N'Minh (R&D)', N'RD_FC_Matrix_20260816_V2.xlsx', N'Chạy công thức tuần 33'),
    (N'FC-2026-08-11', '2026-08-11', N'RD_FC_Matrix_20260811_Final.xlsx', 274476634, 38, 22, '2026-08-11 14:00:00', N'Linh (Formulator)', N'RD_FC_Matrix_20260811_Final.xlsx', N'Chạy công thức tuần 32'),
    (N'FC-2026-08-07', '2026-08-07', N'RD_FC_Matrix_20260807_Adjusted.xlsx', 272580591, 38, 22, '2026-08-07 10:20:00', N'Minh (R&D)', N'RD_FC_Matrix_20260807_Adjusted.xlsx', N'Chạy công thức tuần 31'),
    (N'FC-2026-07-31', '2026-07-31', N'RD_FC_Matrix_20260731_V1.xlsx', 273809240, 38, 22, '2026-07-31 16:45:00', N'Linh (Formulator)', N'RD_FC_Matrix_20260731_V1.xlsx', N'Chạy công thức cuối tháng 7'),
    (N'FC-2026-07-24', '2026-07-24', N'RD_FC_Matrix_20260724_Baseline.xlsx', 272108404, 38, 22, '2026-07-24 08:00:00', N'Minh (R&D)', N'RD_FC_Matrix_20260724_Baseline.xlsx', N'Đợt chạy cơ sở tháng 7')
) AS Source (VersionID, RunDate, VersionName, TotalForecastQty, SKUCount, PlantCount, UploadedAt, UploadedBy, SourceFileName, Notes)
ON Target.VersionID = Source.VersionID
WHEN MATCHED THEN
    UPDATE SET 
        RunDate = Source.RunDate,
        VersionName = Source.VersionName,
        TotalForecastQty = Source.TotalForecastQty,
        SKUCount = Source.SKUCount,
        PlantCount = Source.PlantCount,
        UploadedAt = Source.UploadedAt,
        UploadedBy = Source.UploadedBy,
        SourceFileName = Source.SourceFileName,
        Notes = Source.Notes
WHEN NOT MATCHED THEN
    INSERT (VersionID, RunDate, VersionName, TotalForecastQty, SKUCount, PlantCount, UploadedAt, UploadedBy, SourceFileName, Notes)
    VALUES (Source.VersionID, Source.RunDate, Source.VersionName, Source.TotalForecastQty, Source.SKUCount, Source.PlantCount, Source.UploadedAt, Source.UploadedBy, Source.SourceFileName, Source.Notes);
PRINT N'>>> Đã đồng bộ dữ liệu dbo.fact_Forecast_Version (6 đợt chạy lịch sử)';
GO

-- 7. NẠP DỮ LIỆU MA TRẬN DỰ BÁO FORECAST CHI TIẾT (fact_Forecast_Detail)
-- (Tái hiện chính xác các dòng số liệu từ file Excel của bạn)
MERGE INTO dbo.fact_Forecast_Detail AS Target
USING (VALUES
    -- 1101330 SPC SOYTIDE 55%
    (N'FC-2026-08-21', '2026-08-21', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1101330', N'SPC SOYTIDE 55%', N'Livestock', 82556.0),
    (N'FC-2026-08-16', '2026-08-16', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1101330', N'SPC SOYTIDE 55%', N'Livestock', 46969.0),
    (N'FC-2026-08-11', '2026-08-11', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1101330', N'SPC SOYTIDE 55%', N'Livestock', 46988.0),
    (N'FC-2026-08-07', '2026-08-07', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1101330', N'SPC SOYTIDE 55%', N'Livestock', 45288.0),
    (N'FC-2026-07-31', '2026-07-31', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1101330', N'SPC SOYTIDE 55%', N'Livestock', 45288.0),
    (N'FC-2026-07-24', '2026-07-24', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1101330', N'SPC SOYTIDE 55%', N'Livestock', 45288.0),

    -- 1703010 DEXTROSE (GLUCOSE)
    (N'FC-2026-08-21', '2026-08-21', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1703010', N'DEXTROSE (GLUCOSE)', N'Livestock', 19970.0),
    (N'FC-2026-08-16', '2026-08-16', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1703010', N'DEXTROSE (GLUCOSE)', N'Livestock', 10430.0),
    (N'FC-2026-08-11', '2026-08-11', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1703010', N'DEXTROSE (GLUCOSE)', N'Livestock', 10430.0),
    (N'FC-2026-08-07', '2026-08-07', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1703010', N'DEXTROSE (GLUCOSE)', N'Livestock', 9663.0),
    (N'FC-2026-07-31', '2026-07-31', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1703010', N'DEXTROSE (GLUCOSE)', N'Livestock', 9663.0),
    (N'FC-2026-07-24', '2026-07-24', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'1703010', N'DEXTROSE (GLUCOSE)', N'Livestock', 9663.0),

    -- 2101010 WHEY POWDER SWEET
    (N'FC-2026-08-21', '2026-08-21', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'2101010', N'WHEY POWDER SWEET', N'Livestock', 23930.0),
    (N'FC-2026-08-16', '2026-08-16', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'2101010', N'WHEY POWDER SWEET', N'Livestock', 6299.0),
    (N'FC-2026-08-11', '2026-08-11', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'2101010', N'WHEY POWDER SWEET', N'Livestock', 6299.0),
    (N'FC-2026-08-07', '2026-08-07', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'2101010', N'WHEY POWDER SWEET', N'Livestock', 6216.0),
    (N'FC-2026-07-31', '2026-07-31', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'2101010', N'WHEY POWDER SWEET', N'Livestock', 6216.0),
    (N'FC-2026-07-24', '2026-07-24', N'DBQ', N'048', N'048 Binh Dinh 2 DH VN', N'2101010', N'WHEY POWDER SWEET', N'Livestock', 6216.0),

    -- 2302010 MONO CALCIUM PHOSPHATE
    (N'FC-2026-08-21', '2026-08-21', N'DNA', N'0432', N'0432 Nghe An VN', N'2302010', N'MONO CALCIUM PHOSPHATE', N'Livestock', 53000.0),
    (N'FC-2026-08-16', '2026-08-16', N'DNA', N'0432', N'0432 Nghe An VN', N'2302010', N'MONO CALCIUM PHOSPHATE', N'Livestock', 42158.0),
    (N'FC-2026-08-11', '2026-08-11', N'DNA', N'0432', N'0432 Nghe An VN', N'2302010', N'MONO CALCIUM PHOSPHATE', N'Livestock', 43815.0),
    (N'FC-2026-08-07', '2026-08-07', N'DNA', N'0432', N'0432 Nghe An VN', N'2302010', N'MONO CALCIUM PHOSPHATE', N'Livestock', 41847.0),
    (N'FC-2026-07-31', '2026-07-31', N'DNA', N'0432', N'0432 Nghe An VN', N'2302010', N'MONO CALCIUM PHOSPHATE', N'Livestock', 41988.0),
    (N'FC-2026-07-24', '2026-07-24', N'DNA', N'0432', N'0432 Nghe An VN', N'2302010', N'MONO CALCIUM PHOSPHATE', N'Livestock', 46581.0),

    -- 2302020 DICALCIUM PHOSPHATE (BỊ CẮT GIẢM SÂU)
    (N'FC-2026-08-21', '2026-08-21', N'DNA', N'0432', N'0432 Nghe An VN', N'2302020', N'DICALCIUM PHOSPHATE', N'Livestock', 820.0),
    (N'FC-2026-08-16', '2026-08-16', N'DNA', N'0432', N'0432 Nghe An VN', N'2302020', N'DICALCIUM PHOSPHATE', N'Livestock', 2302.0),
    (N'FC-2026-08-11', '2026-08-11', N'DNA', N'0432', N'0432 Nghe An VN', N'2302020', N'DICALCIUM PHOSPHATE', N'Livestock', 825.0),
    (N'FC-2026-08-07', '2026-08-07', N'DNA', N'0432', N'0432 Nghe An VN', N'2302020', N'DICALCIUM PHOSPHATE', N'Livestock', 2558.0),
    (N'FC-2026-07-31', '2026-07-31', N'DNA', N'0432', N'0432 Nghe An VN', N'2302020', N'DICALCIUM PHOSPHATE', N'Livestock', 2558.0),
    (N'FC-2026-07-24', '2026-07-24', N'DNA', N'0432', N'0432 Nghe An VN', N'2302020', N'DICALCIUM PHOSPHATE', N'Livestock', 1305.0),

    -- 3202010 DL-METHIONINE 99% (CẮT GIẢM 100% TẠI DVP)
    (N'FC-2026-08-21', '2026-08-21', N'DVP', N'047', N'047 Vinh Phuc VN', N'3202010', N'DL-METHIONINE 99%', N'Livestock', 0.0),
    (N'FC-2026-08-16', '2026-08-16', N'DVP', N'047', N'047 Vinh Phuc VN', N'3202010', N'DL-METHIONINE 99%', N'Livestock', 16500.0),
    (N'FC-2026-08-11', '2026-08-11', N'DVP', N'047', N'047 Vinh Phuc VN', N'3202010', N'DL-METHIONINE 99%', N'Livestock', 15800.0),
    (N'FC-2026-08-07', '2026-08-07', N'DVP', N'047', N'047 Vinh Phuc VN', N'3202010', N'DL-METHIONINE 99%', N'Livestock', 16200.0),
    (N'FC-2026-07-31', '2026-07-31', N'DVP', N'047', N'047 Vinh Phuc VN', N'3202010', N'DL-METHIONINE 99%', N'Livestock', 15900.0),
    (N'FC-2026-07-24', '2026-07-24', N'DVP', N'047', N'047 Vinh Phuc VN', N'3202010', N'DL-METHIONINE 99%', N'Livestock', 16100.0)
) AS Source (VersionID, RunDate, SiteCode, FactoryCode, PlantName, MaterialCode, MaterialName, Division, ForecastQtyKg)
ON Target.VersionID = Source.VersionID AND Target.SiteCode = Source.SiteCode AND Target.MaterialCode = Source.MaterialCode
WHEN MATCHED THEN
    UPDATE SET 
        RunDate = Source.RunDate,
        FactoryCode = Source.FactoryCode,
        PlantName = Source.PlantName,
        MaterialName = Source.MaterialName,
        Division = Source.Division,
        ForecastQtyKg = Source.ForecastQtyKg
WHEN NOT MATCHED THEN
    INSERT (VersionID, RunDate, SiteCode, FactoryCode, PlantName, MaterialCode, MaterialName, Division, ForecastQtyKg)
    VALUES (Source.VersionID, Source.RunDate, Source.SiteCode, Source.FactoryCode, Source.PlantName, Source.MaterialCode, Source.MaterialName, Source.Division, Source.ForecastQtyKg);
PRINT N'>>> Đã đồng bộ dữ liệu dbo.fact_Forecast_Detail';
GO

-- 8. NẠP TỪ ĐIỂN ÁNH XẠ HEADER (sys_Import_Mapping)
MERGE INTO dbo.sys_Import_Mapping AS Target
USING (VALUES
    (N'MAP-M01', N'Material', N'CODE', N'MaterialCode', N'STRING', 1),
    (N'MAP-M02', N'Material', N'Mã Vật Tư', N'MaterialCode', N'STRING', 1),
    (N'MAP-M03', N'Material', N'Item Number', N'MaterialCode', N'STRING', 1),
    (N'MAP-M04', N'Material', N'DESC', N'Name_VN', N'STRING', 1),
    (N'MAP-M05', N'Material', N'Tên Nguyên Liệu', N'Name_VN', N'STRING', 1),
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
PRINT N'>>> Đã đồng bộ dữ liệu dbo.sys_Import_Mapping';
GO

PRINT N'============================================================================';
PRINT N'>>> TẤT CẢ DỮ LIỆU SEED CHO PREMIXTRACK DB ĐÃ ĐƯỢC ĐỒNG BỘ THÀNH CÔNG (F5 OK)!';
PRINT N'============================================================================';
GO
