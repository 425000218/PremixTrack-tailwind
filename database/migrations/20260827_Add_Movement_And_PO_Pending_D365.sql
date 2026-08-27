-- ============================================================================
-- MIGRATION: 20260827_Add_Movement_And_PO_Pending_D365.sql
-- Nạp Báo Cáo Biến Động Xuất Nhập Tồn (Inventory Movement Report 250826)
-- và Báo Cáo Đơn Hàng Mua Mở (PO Pending Cut-off 06h 250826)
-- ============================================================================

USE [PremixTrackDB];
GO

-- 1. Tạo Bảng Biến Động Tồn Kho & Sản Xuất (fact_Inventory_Movement)
IF OBJECT_ID(N'dbo.fact_Inventory_Movement', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.fact_Inventory_Movement (
        MovementID         NVARCHAR(100)  NOT NULL,
        FactoryCode        NVARCHAR(50)   NOT NULL,
        OrgCode            NVARCHAR(50)   NOT NULL,
        MaterialCode       NVARCHAR(50)   NOT NULL,
        MaterialName       NVARCHAR(250)  NOT NULL,
        UOM                NVARCHAR(20)   NOT NULL DEFAULT N'KG',
        SubInventory       NVARCHAR(50)   NOT NULL DEFAULT N'RAW',
        BeginOnHandKg      DECIMAL(18,2)  NOT NULL DEFAULT 0,
        ReceivedQtyKg      DECIMAL(18,2)  NOT NULL DEFAULT 0,
        WipIssueQtyKg      DECIMAL(18,2)  NOT NULL DEFAULT 0,
        ClosedOnHandKg     DECIMAL(18,2)  NOT NULL DEFAULT 0,
        ReportDate         DATE           NOT NULL DEFAULT '2026-08-25',
        CreatedAt          DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_fact_Inventory_Movement PRIMARY KEY CLUSTERED (MovementID)
    );
    CREATE NONCLUSTERED INDEX IX_InvMovement_Date_Factory ON dbo.fact_Inventory_Movement(ReportDate, FactoryCode, MaterialCode);
    PRINT N'>>> Đã tạo bảng dbo.fact_Inventory_Movement';
END
ELSE
    PRINT N'>>> Bảng dbo.fact_Inventory_Movement đã tồn tại.';
GO

-- 2. Bổ sung các cột mở rộng cho dbo.dim_Material, dbo.fact_PO_Detail và dbo.fact_Purchase_Order nếu chưa có
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.dim_Material') AND name = N'StandardPrice')
    ALTER TABLE dbo.dim_Material ADD StandardPrice DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Purchase_Order') AND name = N'PurchaserName')
    ALTER TABLE dbo.fact_Purchase_Order ADD PurchaserName NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Purchase_Order') AND name = N'PaymentTerms')
    ALTER TABLE dbo.fact_Purchase_Order ADD PaymentTerms NVARCHAR(100) NULL DEFAULT N'Net 30';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Purchase_Order') AND name = N'Incoterm')
    ALTER TABLE dbo.fact_Purchase_Order ADD Incoterm NVARCHAR(50) NULL DEFAULT N'DDP';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Purchase_Order') AND name = N'ContractNumber')
    ALTER TABLE dbo.fact_Purchase_Order ADD ContractNumber NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_Purchase_Order') AND name = N'Currency')
    ALTER TABLE dbo.fact_Purchase_Order ADD Currency NVARCHAR(20) NULL DEFAULT N'VND';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'PendingQtyKg')
    ALTER TABLE dbo.fact_PO_Detail ADD PendingQtyKg DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'ReceivedQtyKg')
    ALTER TABLE dbo.fact_PO_Detail ADD ReceivedQtyKg DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'UnitPriceVND')
    ALTER TABLE dbo.fact_PO_Detail ADD UnitPriceVND DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'LineAmountVND')
    ALTER TABLE dbo.fact_PO_Detail ADD LineAmountVND DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'AmountRemainderVND')
    ALTER TABLE dbo.fact_PO_Detail ADD AmountRemainderVND DECIMAL(18,2) NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'PromisedDeliveryDate')
    ALTER TABLE dbo.fact_PO_Detail ADD PromisedDeliveryDate DATE NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'PAGNumber')
    ALTER TABLE dbo.fact_PO_Detail ADD PAGNumber NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'LineStatus')
    ALTER TABLE dbo.fact_PO_Detail ADD LineStatus NVARCHAR(50) NULL DEFAULT N'Open Order';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'Incoterm')
    ALTER TABLE dbo.fact_PO_Detail ADD Incoterm NVARCHAR(50) NULL DEFAULT N'DDP';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'CountryOfOrigin')
    ALTER TABLE dbo.fact_PO_Detail ADD CountryOfOrigin NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.fact_PO_Detail') AND name = N'Notes')
    ALTER TABLE dbo.fact_PO_Detail ADD Notes NVARCHAR(500) NULL;

PRINT N'>>> Đã bổ sung các cột mở rộng cho dbo.fact_Purchase_Order và dbo.fact_PO_Detail.';
GO

-- 3. Nạp 5 SKUs mới từ PO Pending vào dbo.dim_Material
MERGE INTO dbo.dim_Material AS Target
USING (VALUES
    (N'MAT-3601010', N'3601010', N'Canthaxanthin 10%', N'Canthaxanthin 10% Feed Pigment', N'Vitamins', N'KG', 26.08, 652080.0, N'Talena.Tien', 20, 1),
    (N'MAT-6101603', N'6101603', N'CASSAVA BY-PRODUCT F>20%', N'Cassava By-Product Fiber >20%', N'Grain', N'KG', 0.21, 5200.0, N'Fanny.Phuong', 10, 1),
    (N'MAT-3955010', N'3955010', N'Tilmicosin 20%', N'Tilmicosin 20% Feed Additive', N'Specialty', N'KG', 11.05, 276190.0, N'Argen.Nam', 15, 1),
    (N'MAT-1802027', N'1802027', N'CASSAVE WITH PEEL >67.5%STARCH', N'Cassava with Peel >67.5% Starch', N'Grain', N'KG', 0.19, 4650.0, N'Juliet.Ngoc', 10, 1),
    (N'MAT-6101045', N'6101045', N'Mycocurb Liquid 100%', N'Mycocurb Liquid Mold Inhibitor', N'Specialty', N'KG', 1.68, 42000.0, N'Argen.Nam', 20, 1)
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

PRINT N'>>> Đã cập nhật 5 SKUs mới từ PO Pending vào dbo.dim_Material.';
GO

-- 4. Nạp Nhà Cung Cấp Mới vào dbo.dim_Supplier
MERGE INTO dbo.dim_Supplier AS Target
USING (VALUES
    (N'SUP-1026897', N'1026897', N'Venamti', N'Công Ty TNHH Venamti', N'LOCAL', N'DDP', N'Net 60', 1),
    (N'SUP-1035337', N'1035337', N'Ngọc Thùy', N'Công Ty TNHH MTV Nông Sản Ngọc Thùy', N'LOCAL', N'DDP', N'Net 60', 1),
    (N'SUP-1030162', N'1030162', N'Nông Sản VN', N'Công Ty TNHH Kinh Doanh Nông Sản Việt Nam', N'LOCAL', N'EXW', N'Net 30', 1),
    (N'SUP-1026617', N'1026617', N'Linh Long', N'Công Ty TNHH Phát Triển Linh Long', N'LOCAL', N'DDP', N'Net 60', 1),
    (N'SUP-1035822', N'1035822', N'Hoa Lâm', N'Công Ty TNHH Nhập Khẩu Và Phân Phối Hoa Lâm', N'LOCAL', N'DDP', N'Net 60', 1),
    (N'SUP-1047471', N'1047471', N'Lương Thực MB', N'Chi Nhánh Tây Bắc - Tổng Công Ty Lương Thực Miền Bắc', N'LOCAL', N'DDP', N'Net 30', 1),
    (N'SUP-1045802', N'1045802', N'Hương Kim', N'Công Ty TNHH Thức Ăn Chăn Nuôi Hương Kim', N'LOCAL', N'DDP', N'Net 20', 1),
    (N'SUP-1050186', N'1050186', N'Minh Trang SG', N'Công Ty TNHH XNK Minh Trang SG', N'LOCAL', N'DDP', N'Net 60', 1),
    (N'SUP-1034915', N'1034915', N'Kemin VN', N'Công Ty TNHH Kemin Industries (Việt Nam)', N'LOCAL', N'DDP', N'Net 30', 1),
    (N'SUP-1502675', N'1502675', N'MIVICO', N'CÔNG TY CỔ PHẦN HÓA CHẤT MIVICO', N'LOCAL', N'DDP', N'Net 30', 1)
) AS Source (SupplierID, SupplierCode, ShortName, FullName, SupplierType, Incoterm, PaymentTerms, IsActive)
ON Target.SupplierCode = Source.SupplierCode
WHEN MATCHED THEN
    UPDATE SET 
        ShortName = Source.ShortName,
        FullName = Source.FullName,
        SupplierType = Source.SupplierType,
        Incoterm = Source.Incoterm,
        PaymentTerms = Source.PaymentTerms
WHEN NOT MATCHED THEN
    INSERT (SupplierID, SupplierCode, ShortName, FullName, SupplierType, Incoterm, PaymentTerms, IsActive, CreatedAt)
    VALUES (Source.SupplierID, Source.SupplierCode, Source.ShortName, Source.FullName, Source.SupplierType, Source.Incoterm, Source.PaymentTerms, Source.IsActive, SYSDATETIME());

PRINT N'>>> Đã cập nhật 10 Nhà cung cấp vào dbo.dim_Supplier.';
GO

-- 5. Nạp 15 Dòng Biến Động Xuất Nhập Tồn vào dbo.fact_Inventory_Movement
MERGE INTO dbo.fact_Inventory_Movement AS Target
USING (VALUES
    (N'MOV-DBD-1001010-250826', N'DBD', N'DBD', N'1001010', N'BARLEY', N'Kg', N'RAW', 374904.00, 0.00, 143785.50, 223683.00, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1002010-250826', N'DBD', N'DBD', N'1002010', N'CORN', N'Kg', N'RAW', 1507958.38, 7761920.00, 8124748.60, 1110519.98, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1002101-250826', N'DBD', N'DBD', N'1002101', N'CORN GLUTENFEED >20%CP', N'Kg', N'RAW', 97980.87, 112106.63, 37.50, 210050.00, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1002150-250826', N'DBD', N'DBD', N'1002150', N'CORN GLUTEN MEAL 60%', N'Kg', N'RAW', 67306.60, 51921.53, 54294.25, 64933.88, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1002500-250826', N'DBD', N'DBD', N'1002500', N'CORN STARCH', N'Kg', N'RAW', 1995.60, 0.40, 0.00, 1996.00, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1003010-250826', N'DBD', N'DBD', N'1003010', N'Wheat', N'Kg', N'RAW', 1243630.44, 2144100.00, 2312068.00, 1062664.09, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1003100-250826', N'DBD', N'DBD', N'1003100', N'Vital Wheat Gluten', N'Kg', N'RAW', 375.00, 0.00, 0.00, 375.00, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1003356-250826', N'DBD', N'DBD', N'1003356', N'WHEATBRAN MEAL coarse', N'Kg', N'RAW', 221717.65, 716433.00, 577728.00, 345716.37, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1005010-250826', N'DBD', N'DBD', N'1005010', N'RICEBRAN 12/12/12', N'Kg', N'RAW', 23406.95, 63445.00, 69178.00, 17046.57, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1005100-250826', N'DBD', N'DBD', N'1005100', N'RICE HULLS', N'Kg', N'RAW', 10415.50, 0.00, 4410.50, 5989.50, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1005150-250826', N'DBD', N'DBD', N'1005150', N'RICE BROKEN', N'Kg', N'RAW', 274507.26, 691434.00, 649574.70, 252039.44, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1012106-250826', N'DBD', N'DBD', N'1012106', N'DDGS CORN STANDARD QUALITY US', N'Kg', N'RAW', 273642.89, 460980.00, 515522.75, 207107.88, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1012160-250826', N'DBD', N'DBD', N'1012160', N'DDG CORN/YEAST 40%CP', N'Kg', N'RAW', 302028.22, 0.00, 127138.00, 169819.46, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1012500-250826', N'DBD', N'DBD', N'1012500', N'Rice DDGS', N'Kg', N'RAW', 42.40, 8210.00, 1819.60, 6390.40, CAST('2026-08-25' AS DATE)),
    (N'MOV-DBD-1101018-250826', N'DBD', N'DBD', N'1101018', N'SOYABEANMEAL 48% CP', N'Kg', N'RAW', 158502.90, 3382670.00, 2979015.88, 533170.22, CAST('2026-08-25' AS DATE))
) AS Source (MovementID, FactoryCode, OrgCode, MaterialCode, MaterialName, UOM, SubInventory, BeginOnHandKg, ReceivedQtyKg, WipIssueQtyKg, ClosedOnHandKg, ReportDate)
ON Target.MovementID = Source.MovementID
WHEN MATCHED THEN
    UPDATE SET 
        BeginOnHandKg = Source.BeginOnHandKg,
        ReceivedQtyKg = Source.ReceivedQtyKg,
        WipIssueQtyKg = Source.WipIssueQtyKg,
        ClosedOnHandKg = Source.ClosedOnHandKg,
        ReportDate = Source.ReportDate
WHEN NOT MATCHED THEN
    INSERT (MovementID, FactoryCode, OrgCode, MaterialCode, MaterialName, UOM, SubInventory, BeginOnHandKg, ReceivedQtyKg, WipIssueQtyKg, ClosedOnHandKg, ReportDate, CreatedAt)
    VALUES (Source.MovementID, Source.FactoryCode, Source.OrgCode, Source.MaterialCode, Source.MaterialName, Source.UOM, Source.SubInventory, Source.BeginOnHandKg, Source.ReceivedQtyKg, Source.WipIssueQtyKg, Source.ClosedOnHandKg, Source.ReportDate, SYSDATETIME());

PRINT N'>>> Đã nạp thành công 15 dòng dữ liệu vào dbo.fact_Inventory_Movement.';
GO

-- 6. Nạp PO Pending vào dbo.fact_Purchase_Order và dbo.fact_PO_Detail
MERGE INTO dbo.fact_Purchase_Order AS Target
USING (VALUES
    (N'PO-H-PAG00010895', N'DHV/PAG/00010895', N'1026897', CAST('2026-04-20' AS DATE), N'FAC-DBD', N'Confirmed', N'Talena.Tien', N'VND', 260832.0, N'Net 60', N'DDP', N'DHV/PAG/00010895'),
    (N'PO-H-PAG00012177', N'DHV/PAG/00012177', N'1035337', CAST('2026-08-20' AS DATE), N'FAC-DBD', N'Confirmed', N'Fanny.Phuong', N'VND', 104000.0, N'Net 60', N'DDP', N'DHV/PAG/00012177'),
    (N'PO-H-PAG00012203', N'DHV/PAG/00012203', N'1030162', CAST('2026-08-24' AS DATE), N'FAC-DBD', N'Confirmed', N'Hebe.Quynh', N'VND', 484610.0, N'Net 30', N'EXW', N'DHV/PAG/00012203'),
    (N'PO-H-PO000019632', N'DBD/PO/000019632', N'1026617', CAST('2025-08-05' AS DATE), N'FAC-DBD', N'Confirmed', N'Oliver.Tuong', N'VND', 48160.0, N'Net 60', N'DDP', N'DHV/PAG/00005595'),
    (N'PO-H-PO000019788', N'DBD/PO/000019788', N'1035822', CAST('2025-09-09' AS DATE), N'FAC-DBD', N'Confirmed', N'Argen.Nam', N'VND', 2872.0, N'Net 60', N'DDP', NULL),
    (N'PO-H-PO000019968', N'DBD/PO/000019968', N'1026617', CAST('2025-10-16' AS DATE), N'FAC-DBD', N'Confirmed', N'Oliver.Tuong', N'VND', 64384.0, N'Net 60', N'DDP', N'DHV/PAG/00007562'),
    (N'PO-H-PO000020076', N'DBD/PO/000020076', N'1026617', CAST('2025-11-08' AS DATE), N'FAC-DBD', N'Confirmed', N'Oliver.Tuong', N'VND', 19262.0, N'Net 60', N'DDP', N'DHV/PAG/00005595'),
    (N'PO-H-PO000020270', N'DBD/PO/000020270', N'1047471', CAST('2025-12-15' AS DATE), N'FAC-DBD', N'Confirmed', N'Juliet.Ngoc', N'VND', 93000.0, N'Net 30', N'DDP', N'DHV/PAG/00006821'),
    (N'PO-H-PO000020378', N'DBD/PO/000020378', N'1045802', CAST('2026-01-03' AS DATE), N'FAC-DBD', N'Confirmed', N'Argen.Nam', N'VND', 12672.0, N'Net 20', N'DDP', NULL),
    (N'PO-H-PO000020442', N'DBD/PO/000020442', N'1047471', CAST('2026-01-15' AS DATE), N'FAC-DBD', N'Confirmed', N'Juliet.Ngoc', N'VND', 17949.0, N'Net 30', N'DDP', N'DHV/PAG/00006821'),
    (N'PO-H-PO000020574', N'DBD/PO/000020574', N'1050186', CAST('2026-02-09' AS DATE), N'FAC-DBD', N'Confirmed', N'Russia.Nga', N'VND', 450.0, N'Net 60', N'DDP', N'DHV/PAG/00008109'),
    (N'PO-H-PO000020738', N'DBD/PO/000020738', N'1034915', CAST('2026-03-19' AS DATE), N'FAC-DBD', N'Confirmed', N'Argen.Nam', N'VND', 57120.0, N'Net 30', N'DDP', NULL),
    (N'PO-H-PO000020795', N'DBD/PO/000020795', N'1502675', CAST('2026-03-29' AS DATE), N'FAC-DBD', N'Confirmed', N'Argen.Nam', N'VND', 88800.0, N'Net 30', N'DDP', NULL)
) AS Source (PO_Header_ID, PONumber, SupplierCode, OrderDate, FactoryCode, POStatus, PurchaserName, Currency, TotalAmountUSD, PaymentTerms, Incoterm, ContractNumber)
ON Target.PONumber = Source.PONumber
WHEN MATCHED THEN
    UPDATE SET 
        SupplierCode = Source.SupplierCode,
        OrderDate = Source.OrderDate,
        PurchaserName = Source.PurchaserName,
        TotalAmountUSD = Source.TotalAmountUSD,
        PaymentTerms = Source.PaymentTerms,
        Incoterm = Source.Incoterm,
        ContractNumber = Source.ContractNumber
WHEN NOT MATCHED THEN
    INSERT (PO_Header_ID, PONumber, SupplierCode, OrderDate, FactoryCode, POStatus, PurchaserName, Currency, TotalAmountUSD, PaymentTerms, Incoterm, ContractNumber, CreatedAt)
    VALUES (Source.PO_Header_ID, Source.PONumber, Source.SupplierCode, Source.OrderDate, Source.FactoryCode, Source.POStatus, Source.PurchaserName, Source.Currency, Source.TotalAmountUSD, Source.PaymentTerms, Source.Incoterm, Source.ContractNumber, SYSDATETIME());

-- 6.2 PO Details
MERGE INTO dbo.fact_PO_Detail AS Target
USING (VALUES
    (N'DHV/PAG/00010895', N'3601010', N'FAC-DBD', 10000.0, 8000.0, 26.08, 652080.0, 6520800000.0, 1304160000.0, CAST('2026-04-20' AS DATE), N'DHV/PAG/00010895', N'Effective', N'DDP', N'China', N'10mt-24.7$ Giao tháng 7 và 8'),
    (N'DHV/PAG/00012177', N'6101603', N'FAC-DBD', 500000.0, 0.0, 0.21, 5200.0, 2600000000.0, 2600000000.0, CAST('2026-09-01' AS DATE), N'DHV/PAG/00012177', N'On hold', N'DDP', N'Việt Nam', N'500mt Bã mì @5200 đ/kg ex DN/BD/LA approved 20/08/2026'),
    (N'DHV/PAG/00012203', N'1101018', N'FAC-DBD', 1075000.0, 0.0, 0.46, 11270.0, 12115250000.0, 12115250000.0, CAST('2026-08-21' AS DATE), N'DHV/PAG/00012203', N'On hold', N'EXW', N'Việt Nam', N'6.00289E+18'),
    (N'DBD/PO/000019632', N'1002101', N'FAC-DBD', 280000.0, 180410.0, 0.17, 4300.0, 1204000000.0, 428237000.0, CAST('2025-08-05' AS DATE), N'DHV/PAG/00005595', N'Open Order', N'DDP', N'China', N'DHV/PAG/00005595 Delivery time in Aug'),
    (N'DBD/PO/000019788', N'3955010', N'FAC-DBD', 260.0, 240.0, 11.05, 276190.0, 71809400.0, 5523800.0, CAST('2025-09-09' AS DATE), NULL, N'Open Order', N'DDP', N'Việt Nam', N'15/HĐMH-2023 giao tháng 9/2025'),
    (N'DBD/PO/000019968', N'1002101', N'FAC-DBD', 320000.0, 0.0, 0.20, 5030.0, 1609600000.0, 1609600000.0, CAST('2025-10-16' AS DATE), N'DHV/PAG/00007562', N'Open Order', N'DDP', N'China', N'DHV/PAG/00007562'),
    (N'DBD/PO/000020076', N'1002101', N'FAC-DBD', 111990.0, 0.0, 0.17, 4300.0, 481557000.0, 481557000.0, CAST('2025-11-08' AS DATE), N'DHV/PAG/00005595', N'Open Order', N'DDP', N'China', N'DHV/PAG/00005595 Thay thế DBD/PO/000019632'),
    (N'DBD/PO/000020270', N'1802027', N'FAC-DBD', 500000.0, 171210.0, 0.19, 4650.0, 2325000000.0, 1412623500.0, CAST('2025-12-31' AS DATE), N'DHV/PAG/00006821', N'Open Order', N'DDP', N'Việt Nam', N'tạm đóng 303790 kg'),
    (N'DBD/PO/000020378', N'1005100', N'FAC-DBD', 72000.0, 45156.0, 0.18, 4400.0, 316800000.0, 118113600.0, CAST('2026-01-03' AS DATE), NULL, N'Open Order', N'DDP', N'Việt Nam', N'75/HĐMH-2022 BSD 01 giao T2/26'),
    (N'DBD/PO/000020442', N'1802027', N'FAC-DBD', 96500.0, 0.0, 0.19, 4650.0, 448725000.0, 425475000.0, CAST('2026-01-31' AS DATE), N'DHV/PAG/00006821', N'Open Order', N'DDP', N'Việt Nam', N'Thay thế PO DBD/PO/000019586'),
    (N'DBD/PO/000020574', N'1012500', N'FAC-DBD', 1500.0, 1096.0, 0.30, 7500.0, 11250000.0, 3030000.0, CAST('2026-02-09' AS DATE), N'DHV/PAG/00008109', N'Open Order', N'DDP', N'India', N'DHV/PAG/00008109 PK 02'),
    (N'DBD/PO/000020738', N'6101045', N'FAC-DBD', 34000.0, 19000.0, 1.68, 42000.0, 1428000000.0, 630000000.0, CAST('2026-03-19' AS DATE), NULL, N'Open Order', N'DDP', N'Singapore', N'04/HĐMH-2025 giao từ T3/2026'),
    (N'DBD/PO/000020795', N'3201011', N'FAC-DBD', 120000.0, 59150.0, 0.74, 18500.0, 2220000000.0, 570725000.0, CAST('2026-03-29' AS DATE), NULL, N'Open Order', N'DDP', N'China', N'14/HĐMH-2026 Q2_Nelly cắt 30t sang DDN')
) AS Source (PONumber, MaterialCode, FactoryCode, OrderQtyKg, ReceivedQtyKg, UnitPriceUSD, UnitPriceVND, LineAmountVND, AmountRemainderVND, PromisedDeliveryDate, PAGNumber, LineStatus, Incoterm, CountryOfOrigin, Notes)
ON Target.PONumber = Source.PONumber AND Target.MaterialCode = Source.MaterialCode
WHEN MATCHED THEN
    UPDATE SET 
        OrderQtyKg = Source.OrderQtyKg,
        ReceivedQtyKg = Source.ReceivedQtyKg,
        UnitPriceUSD = Source.UnitPriceUSD,
        UnitPriceVND = Source.UnitPriceVND,
        LineAmountVND = Source.LineAmountVND,
        AmountRemainderVND = Source.AmountRemainderVND,
        PromisedDeliveryDate = Source.PromisedDeliveryDate,
        PAGNumber = Source.PAGNumber,
        LineStatus = Source.LineStatus,
        Incoterm = Source.Incoterm,
        CountryOfOrigin = Source.CountryOfOrigin,
        Notes = Source.Notes
WHEN NOT MATCHED THEN
    INSERT (PONumber, MaterialCode, FactoryCode, OrderQtyKg, ReceivedQtyKg, UnitPriceUSD, UnitPriceVND, LineAmountVND, AmountRemainderVND, PromisedDeliveryDate, PAGNumber, LineStatus, Incoterm, CountryOfOrigin, Notes)
    VALUES (Source.PONumber, Source.MaterialCode, Source.FactoryCode, Source.OrderQtyKg, Source.ReceivedQtyKg, Source.UnitPriceUSD, Source.UnitPriceVND, Source.LineAmountVND, Source.AmountRemainderVND, Source.PromisedDeliveryDate, Source.PAGNumber, Source.LineStatus, Source.Incoterm, Source.CountryOfOrigin, Source.Notes);

PRINT N'>>> Đã nạp thành công 13 dòng PO Detail vào dbo.fact_PO_Detail.';
GO
