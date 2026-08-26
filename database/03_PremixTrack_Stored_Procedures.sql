-- ============================================================================
-- PREMIXTRACK STORED PROCEDURES & HEAVY COMPUTATION ENGINE
-- Các thủ tục lưu trữ tính toán nặng, import giao dịch và so sánh biến động
-- ============================================================================

USE [PremixTrackDB];
GO

-- 1. STORED PROCEDURE: NẠP MA TRẬN DỰ BÁO TỪ STAGING VÀO BẢNG CHÍNH (ACID TRANSACTION)
CREATE OR ALTER PROCEDURE dbo.sp_Import_Forecast_From_Staging
    @BatchID          NVARCHAR(100),
    @RunDate          DATE,
    @VersionName      NVARCHAR(250),
    @UploadedBy       NVARCHAR(100) = N'System',
    @SourceFileName   NVARCHAR(255) = NULL,
    @Notes            NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @VersionID NVARCHAR(100) = N'FC-' + CONVERT(VARCHAR(10), @RunDate, 120);
    DECLARE @TotalQty DECIMAL(18,2) = 0;
    DECLARE @SKUCount INT = 0;
    DECLARE @PlantCount INT = 0;
    DECLARE @ErrorMessage NVARCHAR(4000);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1.1. Tự động bổ sung mã nguyên liệu mới vào dim_Material nếu chưa có (Tránh lỗi FK)
        INSERT INTO dbo.dim_Material (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, PIC, SafetyStockDays, MinOrderQty, StandardPackingKg, IsActive)
        SELECT DISTINCT 
            N'MAT-' + s.MaterialCode,
            s.MaterialCode,
            ISNULL(s.MaterialDesc, s.MaterialCode),
            ISNULL(s.MaterialDesc, s.MaterialCode),
            N'Chưa phân loại',
            N'KG',
            0,
            N'Fiona',
            15,
            0,
            25.0,
            1
        FROM dbo.stg_Raw_Forecast_Matrix s
        WHERE s.BatchID = @BatchID
          AND NOT EXISTS (SELECT 1 FROM dbo.dim_Material m WHERE m.MaterialCode = s.MaterialCode);

        -- 1.2. Tạo hoặc cập nhật Header phiên bản đợt nạp (fact_Forecast_Version)
        IF EXISTS (SELECT 1 FROM dbo.fact_Forecast_Version WHERE VersionID = @VersionID)
        BEGIN
            UPDATE dbo.fact_Forecast_Version
            SET VersionName = @VersionName,
                UploadedAt = SYSDATETIME(),
                UploadedBy = @UploadedBy,
                SourceFileName = @SourceFileName,
                Notes = @Notes
            WHERE VersionID = @VersionID;

            -- Xóa các chi tiết cũ của đợt này để nạp lại sạch sẽ
            DELETE FROM dbo.fact_Forecast_Detail WHERE VersionID = @VersionID;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.fact_Forecast_Version (VersionID, RunDate, VersionName, TotalForecastQty, SKUCount, PlantCount, UploadedAt, UploadedBy, SourceFileName, Notes)
            VALUES (@VersionID, @RunDate, @VersionName, 0, 0, 0, SYSDATETIME(), @UploadedBy, @SourceFileName, @Notes);
        END

        -- 1.3. Bóc tách dữ liệu từ Staging nạp vào fact_Forecast_Detail và Map với Danh mục Nhà máy
        INSERT INTO dbo.fact_Forecast_Detail (
            VersionID,
            RunDate,
            SiteCode,
            FactoryCode,
            PlantName,
            MaterialCode,
            MaterialName,
            Division,
            ForecastQtyKg
        )
        SELECT 
            @VersionID,
            @RunDate,
            ISNULL(f.InternalCode, LTRIM(RTRIM(SUBSTRING(s.SiteHeader, 1, 4)))),
            ISNULL(f.InternalCode, LTRIM(RTRIM(SUBSTRING(s.SiteHeader, 1, 4)))),
            s.SiteHeader,
            s.MaterialCode,
            ISNULL(m.Name_VN, s.MaterialDesc),
            ISNULL(f.Division, N'Livestock'),
            s.ForecastQtyKg
        FROM dbo.stg_Raw_Forecast_Matrix s
        LEFT JOIN dbo.dim_Material m ON s.MaterialCode = m.MaterialCode
        LEFT JOIN dbo.dim_Factory f ON s.SiteHeader LIKE N'%' + f.InternalCode + N'%' 
                                    OR s.SiteHeader LIKE N'%' + f.FactoryName_VN + N'%'
                                    OR s.SiteHeader LIKE f.FactoryID + N'%'
        WHERE s.BatchID = @BatchID
          AND s.ForecastQtyKg > 0;

        -- 1.4. Tính toán tổng hợp số liệu để cập nhật lại Header
        SELECT 
            @TotalQty = ISNULL(SUM(ForecastQtyKg), 0),
            @SKUCount = COUNT(DISTINCT MaterialCode),
            @PlantCount = COUNT(DISTINCT SiteCode)
        FROM dbo.fact_Forecast_Detail
        WHERE VersionID = @VersionID;

        UPDATE dbo.fact_Forecast_Version
        SET TotalForecastQty = @TotalQty,
            SKUCount = @SKUCount,
            PlantCount = @PlantCount
        WHERE VersionID = @VersionID;

        -- 1.5. Dọn dẹp sạch bảng Staging sau khi nạp thành công (Tránh phình DB)
        DELETE FROM dbo.stg_Raw_Forecast_Matrix WHERE BatchID = @BatchID;

        -- 1.6. Ghi Audit Log
        INSERT INTO dbo.sys_Audit_Log (ActionType, TableName, RecordKey, PerformedBy, Notes)
        VALUES (N'IMPORT_FORECAST', N'fact_Forecast_Version', @VersionID, @UploadedBy, 
                CONCAT(N'Nạp thành công đợt Forecast: ', @VersionName, N', Tổng SL: ', @TotalQty, N' kg, SKUs: ', @SKUCount));

        COMMIT TRANSACTION;

        SELECT 
            1 AS Success, 
            N'Nạp dữ liệu Forecast thành công!' AS Message,
            @VersionID AS VersionID,
            @TotalQty AS TotalQtyKg,
            @SKUCount AS SKUCount,
            @PlantCount AS PlantCount;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ErrorMessage = ERROR_MESSAGE();
        
        INSERT INTO dbo.sys_Audit_Log (ActionType, TableName, RecordKey, PerformedBy, Notes)
        VALUES (N'IMPORT_ERROR', N'stg_Raw_Forecast_Matrix', @BatchID, @UploadedBy, @ErrorMessage);

        SELECT 
            0 AS Success, 
            CONCAT(N'Lỗi nạp Forecast: ', @ErrorMessage) AS Message,
            NULL AS VersionID, 0 AS TotalQtyKg, 0 AS SKUCount, 0 AS PlantCount;
    END CATCH
END
GO
PRINT N'>>> Đã tạo Stored Procedure dbo.sp_Import_Forecast_From_Staging';
GO

-- 2. STORED PROCEDURE: SO SÁNH ĐA KỲ & TÍNH BIẾN ĐỘNG (FORECAST VOLATILITY & SPARKLINE)
CREATE OR ALTER PROCEDURE dbo.sp_Calculate_Forecast_Volatility
    @TargetDate    DATE,
    @BaseDate      DATE,
    @Division      NVARCHAR(50) = NULL,
    @PIC           NVARCHAR(100) = NULL,
    @SiteCode      NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TargetVersionID NVARCHAR(100) = N'FC-' + CONVERT(VARCHAR(10), @TargetDate, 120);
    DECLARE @BaseVersionID NVARCHAR(100) = N'FC-' + CONVERT(VARCHAR(10), @BaseDate, 120);

    -- Lấy danh sách Material x Site xuất hiện ở một trong 2 kỳ
    ;WITH BaseList AS (
        SELECT DISTINCT 
            d.MaterialCode,
            d.SiteCode,
            d.PlantName,
            d.Division
        FROM dbo.fact_Forecast_Detail d
        WHERE d.VersionID IN (@TargetVersionID, @BaseVersionID)
    ),
    CompareComputed AS (
        SELECT 
            b.MaterialCode,
            m.Name_VN AS MaterialName,
            ISNULL(m.PIC, N'Fiona') AS PIC,
            b.Division,
            b.SiteCode,
            b.PlantName AS FactoryName,
            ISNULL(t.ForecastQtyKg, 0) AS TargetQty,
            ISNULL(bs.ForecastQtyKg, 0) AS BaseQty,
            (ISNULL(t.ForecastQtyKg, 0) - ISNULL(bs.ForecastQtyKg, 0)) AS QtyDiff,
            CASE 
                WHEN ISNULL(bs.ForecastQtyKg, 0) > 0 
                    THEN ((ISNULL(t.ForecastQtyKg, 0) - bs.ForecastQtyKg) / bs.ForecastQtyKg) * 100.0
                WHEN ISNULL(t.ForecastQtyKg, 0) > 0 AND ISNULL(bs.ForecastQtyKg, 0) = 0 
                    THEN 100.0
                WHEN ISNULL(t.ForecastQtyKg, 0) = 0 AND ISNULL(bs.ForecastQtyKg, 0) > 0 
                    THEN -100.0
                ELSE 0.0
            END AS ComparePct
        FROM BaseList b
        JOIN dbo.dim_Material m ON b.MaterialCode = m.MaterialCode
        LEFT JOIN dbo.fact_Forecast_Detail t ON b.MaterialCode = t.MaterialCode AND b.SiteCode = t.SiteCode AND t.VersionID = @TargetVersionID
        LEFT JOIN dbo.fact_Forecast_Detail bs ON b.MaterialCode = bs.MaterialCode AND b.SiteCode = bs.SiteCode AND bs.VersionID = @BaseVersionID
    )
    SELECT 
        c.MaterialCode,
        c.MaterialName,
        c.PIC,
        c.Division,
        c.SiteCode,
        c.FactoryName,
        c.TargetQty,
        c.BaseQty,
        c.QtyDiff,
        ROUND(c.ComparePct, 2) AS ComparePct,
        CASE WHEN c.ComparePct <= -99.9 THEN 1 ELSE 0 END AS IsSevereCut,
        CASE WHEN c.ComparePct >= 50.0 THEN 1 ELSE 0 END AS IsHighSurge,
        CASE WHEN c.ComparePct >= 99.9 THEN 1 ELSE 0 END AS IsSurge100
    FROM CompareComputed c
    WHERE (@Division IS NULL OR c.Division = @Division)
      AND (@PIC IS NULL OR c.PIC = @PIC)
      AND (@SiteCode IS NULL OR c.SiteCode = @SiteCode)
    ORDER BY c.MaterialCode, c.SiteCode;
END
GO
PRINT N'>>> Đã tạo Stored Procedure dbo.sp_Calculate_Forecast_Volatility';
GO

PRINT N'============================================================================';
PRINT N'>>> CÁC STORED PROCEDURES ĐÃ SẴN SÀNG HOẠT ĐỘNG TRÊN PREMIXTRACK DB!';
PRINT N'============================================================================';
GO
