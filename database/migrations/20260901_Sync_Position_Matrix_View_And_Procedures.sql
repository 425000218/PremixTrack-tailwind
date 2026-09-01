-- ============================================================================
-- MIGRATION: 20260901_Sync_Position_Matrix_View_And_Procedures.sql
-- Đồng bộ hóa View vw_Supply_Position_Matrix và Stored Procedure tính toán
-- ============================================================================

USE [PremixTrackDB];
GO

-- 1. Tạo VIEW dbo.vw_Supply_Position_Matrix ánh xạ từ fact_Position_Snapshot
CREATE OR ALTER VIEW dbo.vw_Supply_Position_Matrix AS
SELECT 
    PositionID AS RecordID,
    SnapshotDate,
    Region,
    RMGroup,
    Division,
    FactoryCode,
    MaterialCode,
    MaterialName,
    PIC,
    SOHQtyKg,
    MTD_Production_PrevMonth_Kg,
    MTD_Production_CurrMonth_Kg,
    MonthlyUsageForecastKg,
    PctUsedUsage,
    DailyStandardUsageKg,
    DOI_Standard_Days,
    DOI_Actual_MTD_Days,
    StockoutDateSOH,
    EmergencyBufferQtyKg,
    DOI_AfterBuffer_Days,
    PO_PendingInboundKg,
    TotalPipeline_DOI_Days,
    MaxProtectedDate,
    CASE 
        WHEN DOI_Standard_Days < 7.0 THEN N'CRITICAL'
        WHEN DOI_Standard_Days <= 15.0 THEN N'WARNING'
        WHEN DOI_Standard_Days > 35.0 THEN N'OVERSTOCK'
        ELSE N'BALANCED'
    END AS SeverityLevel,
    CASE 
        WHEN DOI_Standard_Days < 7.0 THEN N'Khẩn cấp: Điều chuyển nội bộ hoặc mua gấp'
        WHEN DOI_Standard_Days <= 15.0 THEN N'Theo dõi sát tiến độ PO Inbound'
        WHEN DOI_Standard_Days > 35.0 THEN N'Tạm hoãn PO mới, ưu tiên điều chuyển đi'
        ELSE N'Tồn kho cân bằng tối ưu'
    END AS ActionSuggested,
    CreatedAt AS UpdatedAt
FROM dbo.fact_Position_Snapshot;
GO

PRINT N'>>> Đã tạo VIEW dbo.vw_Supply_Position_Matrix thành công!';
GO

-- 2. Tạo Procedure Alias sp_Calculate_Supply_Position_Daily gọi sp_Calculate_Position_Matrix
CREATE OR ALTER PROCEDURE dbo.sp_Calculate_Supply_Position_Daily
    @SnapshotDate DATE = '2026-08-25',
    @CutoffWorkingDays INT = 22,
    @StandardMonthDays INT = 28
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_Calculate_Position_Matrix 
        @SnapshotDate = @SnapshotDate, 
        @CutoffWorkingDays = @CutoffWorkingDays, 
        @StandardMonthDays = @StandardMonthDays;
END;
GO

PRINT N'>>> Đã tạo Stored Procedure dbo.sp_Calculate_Supply_Position_Daily thành công!';
GO
