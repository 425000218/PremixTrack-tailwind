-- ============================================================================
-- MIGRATION: 20260827_Add_Position_Snapshot_Engine.sql
-- Khởi tạo Bảng Position Snapshot & Engine Tính Toán Chuỗi Cung Ứng Toàn Diện
-- (Tự động tính toán Usage/Day, DOI SOH, Stockout Date, Arrange More, PO Cover)
-- ============================================================================

USE [PremixTrackDB];
GO

-- 1. Tạo Bảng fact_Position_Snapshot nếu chưa có
IF OBJECT_ID(N'dbo.fact_Position_Snapshot', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.fact_Position_Snapshot (
        PositionID                    NVARCHAR(100)  NOT NULL,
        SnapshotDate                  DATE           NOT NULL, -- Ngày mốc (ví dụ: 2026-08-25)
        CutoffWorkingDays             INT            NOT NULL DEFAULT 22, -- Số ngày chạy thực tế MTD
        StandardMonthDays             INT            NOT NULL DEFAULT 28, -- Chu kỳ ngày chuẩn của tháng
        
        -- Phân loại & Tổ chức
        Region                        NVARCHAR(50)   NOT NULL, -- SOUTH / NORTH / CENTRAL
        RMGroup                       NVARCHAR(50)   NOT NULL DEFAULT N'Macro', -- Macro / Micro
        Division                      NVARCHAR(50)   NOT NULL DEFAULT N'Livestock', -- Livestock / AQUA
        FactoryCode                   NVARCHAR(50)   NOT NULL, -- DBD, DBQ, DDN, DNA, DVP, HPG2...
        MaterialCode                  NVARCHAR(50)   NOT NULL, -- 2579, 1001010...
        MaterialName                  NVARCHAR(250)  NOT NULL, -- CORN NGMO GELATINIZED, Barley...
        PIC                           NVARCHAR(100)  NOT NULL DEFAULT N'Mina', -- Vincent, Rose, Mina...
        
        -- Số liệu Tồn kho & Sản xuất
        SOHQtyKg                      DECIMAL(18,2)  NOT NULL DEFAULT 0,
        MTD_Production_PrevMonth_Kg   DECIMAL(18,2)  NOT NULL DEFAULT 0, -- Tháng 7/2026
        MTD_Production_CurrMonth_Kg   DECIMAL(18,2)  NOT NULL DEFAULT 0, -- Tháng 8/2026 (WIP MTD)
        MonthlyUsageForecastKg        DECIMAL(18,2)  NOT NULL DEFAULT 0, -- Forecast nhu cầu tháng
        
        -- Các chỉ số tính toán tự động
        PctUsedUsage                  DECIMAL(18,4)  NULL, -- MTD Curr / Monthly Forecast
        DailyStandardUsageKg          DECIMAL(18,2)  NULL, -- Monthly Forecast / 28
        DOI_Standard_Days             DECIMAL(18,1)  NULL, -- SOH / Daily Standard
        DOI_Actual_MTD_Days           DECIMAL(18,1)  NULL, -- SOH / (MTD Curr / CutoffDays)
        StockoutDateSOH               DATE           NULL, -- SnapshotDate + DOI_Standard_Days
        
        -- Thuật toán Buffer & Đơn hàng PO Inbound
        EmergencyBufferQtyKg          DECIMAL(18,2)  NULL, -- Arrange More
        DOI_AfterBuffer_Days          DECIMAL(18,1)  NULL, -- (SOH + Buffer) / Daily Standard
        PO_PendingInboundKg           DECIMAL(18,2)  NOT NULL DEFAULT 0, -- Khối lượng PO pending
        TotalPipeline_DOI_Days        DECIMAL(18,1)  NULL, -- (SOH + PO Pending) / Daily Standard
        MaxProtectedDate              DATE           NULL, -- SnapshotDate + TotalPipeline_DOI
        
        CreatedAt                     DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_fact_Position_Snapshot PRIMARY KEY CLUSTERED (PositionID)
    );
    CREATE NONCLUSTERED INDEX IX_Position_Date_Fac_Mat ON dbo.fact_Position_Snapshot(SnapshotDate, FactoryCode, MaterialCode);
    PRINT N'>>> Đã tạo bảng dbo.fact_Position_Snapshot';
END
ELSE
    PRINT N'>>> Bảng dbo.fact_Position_Snapshot đã tồn tại.';
GO

-- 2. Stored Procedure Tự Động Tính Toán và Cập Nhật Ma Trận Position
CREATE OR ALTER PROCEDURE dbo.sp_Calculate_Position_Matrix
    @SnapshotDate DATE = '2026-08-25',
    @CutoffWorkingDays INT = 22,
    @StandardMonthDays INT = 28
AS
BEGIN
    SET NOCOUNT ON;

    -- Cập nhật toàn bộ các công thức toán học chuẩn
    UPDATE dbo.fact_Position_Snapshot
    SET
        DailyStandardUsageKg = CASE 
            WHEN MonthlyUsageForecastKg > 0 THEN ROUND(MonthlyUsageForecastKg / CAST(@StandardMonthDays AS DECIMAL(18,2)), 2)
            ELSE 0 
        END,
        PctUsedUsage = CASE 
            WHEN MonthlyUsageForecastKg > 0 THEN ROUND(MTD_Production_CurrMonth_Kg / MonthlyUsageForecastKg, 4)
            ELSE 0 
        END,
        DOI_Standard_Days = CASE 
            WHEN MonthlyUsageForecastKg > 0 AND (MonthlyUsageForecastKg / @StandardMonthDays) > 0 
            THEN ROUND(SOHQtyKg / (MonthlyUsageForecastKg / CAST(@StandardMonthDays AS DECIMAL(18,2))), 1)
            ELSE 999.0 
        END,
        DOI_Actual_MTD_Days = CASE 
            WHEN MTD_Production_CurrMonth_Kg > 0 AND (MTD_Production_CurrMonth_Kg / @CutoffWorkingDays) > 0 
            THEN ROUND(SOHQtyKg / (MTD_Production_CurrMonth_Kg / CAST(@CutoffWorkingDays AS DECIMAL(18,2))), 1)
            ELSE 999.0 
        END
    WHERE SnapshotDate = @SnapshotDate;

    -- Cập nhật Ngày Stockout SOH & Thuật toán Arrange More
    UPDATE dbo.fact_Position_Snapshot
    SET
        StockoutDateSOH = DATEADD(day, 
            CASE 
                WHEN DOI_Standard_Days >= 999.0 THEN 365
                ELSE CAST(ROUND(DOI_Standard_Days, 0) AS INT) 
            END, 
            SnapshotDate
        ),
        EmergencyBufferQtyKg = CASE 
            WHEN DOI_Standard_Days < 7.0 THEN ROUND(DailyStandardUsageKg * 10.0, 0)
            WHEN DOI_Standard_Days <= 15.0 THEN ROUND(DailyStandardUsageKg * 8.0, 0)
            ELSE 0.0 
        END
    WHERE SnapshotDate = @SnapshotDate;

    -- Cập nhật DOI Sau Bù Đắp, Tổng DOI Pipeline và Ngày Bảo Vệ Tối Đa
    UPDATE dbo.fact_Position_Snapshot
    SET
        DOI_AfterBuffer_Days = CASE 
            WHEN DailyStandardUsageKg > 0 
            THEN ROUND((SOHQtyKg + ISNULL(EmergencyBufferQtyKg, 0)) / DailyStandardUsageKg, 1)
            ELSE DOI_Standard_Days 
        END,
        TotalPipeline_DOI_Days = CASE 
            WHEN DailyStandardUsageKg > 0 
            THEN ROUND((SOHQtyKg + ISNULL(PO_PendingInboundKg, 0)) / DailyStandardUsageKg, 1)
            ELSE DOI_Standard_Days 
        END
    WHERE SnapshotDate = @SnapshotDate;

    UPDATE dbo.fact_Position_Snapshot
    SET
        MaxProtectedDate = DATEADD(day, 
            CASE 
                WHEN TotalPipeline_DOI_Days >= 999.0 THEN 365
                ELSE CAST(ROUND(TotalPipeline_DOI_Days, 0) AS INT) 
            END, 
            SnapshotDate
        )
    WHERE SnapshotDate = @SnapshotDate;

    PRINT N'>>> Đã tính toán hoàn tất ma trận Position cho ngày: ' + CAST(@SnapshotDate AS NVARCHAR(20));
END;
GO

-- 3. Nạp Dữ Liệu Mẫu Position Cut-off 25/08/2026 từ File Excel của User
MERGE INTO dbo.fact_Position_Snapshot AS Target
USING (VALUES
    (N'POS-20260825-DBD-2579', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DBD', N'2579', N'CORN NGMO GELATINIZED', N'Vincent', 12918.0, 689185.0, 521189.0, 705079.0, 0.0),
    (N'POS-20260825-DBQ-2579', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DBQ', N'2579', N'CORN NGMO GELATINIZED', N'Vincent', 38409.0, 199279.0, 170200.0, 262701.0, 95880.0),
    (N'POS-20260825-DDN-2579', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DDN', N'2579', N'CORN NGMO GELATINIZED', N'Vincent', 10744.0, 130427.0, 84331.0, 135725.0, 0.0),
    (N'POS-20260825-DNA-2579', CAST('2026-08-25' AS DATE), 22, 28, N'NORTH', N'Macro', N'Livestock', N'DNA', N'2579', N'CORN NGMO GELATINIZED', N'Rose', 31321.0, 136994.0, 138674.0, 173630.0, 13497.0),
    (N'POS-20260825-DVP-2579', CAST('2026-08-25' AS DATE), 22, 28, N'NORTH', N'Macro', N'Livestock', N'DVP', N'2579', N'CORN NGMO GELATINIZED', N'Rose', 36940.0, 380757.0, 278843.0, 351248.0, 46750.0),
    (N'POS-20260825-HPG2-2579', CAST('2026-08-25' AS DATE), 22, 28, N'NORTH', N'Macro', N'Livestock', N'HPG2', N'2579', N'CORN NGMO GELATINIZED', N'Rose', 66425.0, 132066.0, 145551.0, 142461.0, 0.0),

    (N'POS-20260825-DBD-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DBD', N'1001010', N'Barley', N'Mina', 223683.0, 197326.0, 143786.0, 208737.0, 0.0),
    (N'POS-20260825-DBQ-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DBQ', N'1001010', N'Barley', N'Mina', 121304.0, 108296.0, 56505.0, 36976.0, 130560.0),
    (N'POS-20260825-DDN-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DDN', N'1001010', N'Barley', N'Mina', 162376.0, 329634.0, 198940.0, 156608.0, 0.0),
    (N'POS-20260825-DHG-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DHG', N'1001010', N'Barley', N'Mina', 83335.0, 93849.0, 43778.0, 10026.0, 77770.0),
    (N'POS-20260825-DNA-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'NORTH', N'Macro', N'Livestock', N'DNA', N'1001010', N'Barley', N'Mina', 474926.0, 260911.0, 145393.0, 220820.0, 0.0),
    (N'POS-20260825-DVL-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'AQUA', N'DVL', N'1001010', N'Barley', N'Mina', 0.0, 0.0, 0.0, 0.0, 9738840.0),
    (N'POS-20260825-DVM-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'SOUTH', N'Macro', N'Livestock', N'DVM', N'1001010', N'Barley', N'Mina', 0.0, 89029.0, 34131.0, 23354.0, 0.0),
    (N'POS-20260825-DVP-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'NORTH', N'Macro', N'Livestock', N'DVP', N'1001010', N'Barley', N'Mina', 270354.0, 191562.0, 82972.0, 78263.0, 0.0),
    (N'POS-20260825-HPG2-1001010', CAST('2026-08-25' AS DATE), 22, 28, N'NORTH', N'Macro', N'Livestock', N'HPG2', N'1001010', N'Barley', N'Mina', 163295.0, 196225.0, 60489.0, 62380.0, 0.0)
) AS Source (PositionID, SnapshotDate, CutoffWorkingDays, StandardMonthDays, Region, RMGroup, Division, FactoryCode, MaterialCode, MaterialName, PIC, SOHQtyKg, MTD_Production_PrevMonth_Kg, MTD_Production_CurrMonth_Kg, MonthlyUsageForecastKg, PO_PendingInboundKg)
ON Target.PositionID = Source.PositionID
WHEN MATCHED THEN
    UPDATE SET 
        SOHQtyKg = Source.SOHQtyKg,
        MTD_Production_PrevMonth_Kg = Source.MTD_Production_PrevMonth_Kg,
        MTD_Production_CurrMonth_Kg = Source.MTD_Production_CurrMonth_Kg,
        MonthlyUsageForecastKg = Source.MonthlyUsageForecastKg,
        PO_PendingInboundKg = Source.PO_PendingInboundKg
WHEN NOT MATCHED THEN
    INSERT (PositionID, SnapshotDate, CutoffWorkingDays, StandardMonthDays, Region, RMGroup, Division, FactoryCode, MaterialCode, MaterialName, PIC, SOHQtyKg, MTD_Production_PrevMonth_Kg, MTD_Production_CurrMonth_Kg, MonthlyUsageForecastKg, PO_PendingInboundKg, CreatedAt)
    VALUES (Source.PositionID, Source.SnapshotDate, Source.CutoffWorkingDays, Source.StandardMonthDays, Source.Region, Source.RMGroup, Source.Division, Source.FactoryCode, Source.MaterialCode, Source.MaterialName, Source.PIC, Source.SOHQtyKg, Source.MTD_Production_PrevMonth_Kg, Source.MTD_Production_CurrMonth_Kg, Source.MonthlyUsageForecastKg, Source.PO_PendingInboundKg, SYSDATETIME());

-- Thực thi Stored Procedure để tính toán toàn bộ các cột
EXEC dbo.sp_Calculate_Position_Matrix @SnapshotDate = '2026-08-25', @CutoffWorkingDays = 22, @StandardMonthDays = 28;
PRINT N'>>> Đã nạp và tính toán thành công dữ liệu Position Snapshot ngày 25/08/2026.';
GO
