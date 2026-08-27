-- ============================================================================
-- PREMIXTRACK ENTERPRISE DATABASE SCHEMA (MS SQL SERVER 2022)
-- Dự án: Quản Lý Phân Phối & Dự Báo Nguyên Liệu Premix & TACN (D365 FO & RD)
-- Tác giả: Chuyên Gia Cơ Sở Dữ Liệu PremixTrack
-- Môi trường: MS SQL Server 2022 (LXC 102 - 192.168.1.202:1433)
-- Database: PremixTrackDB
-- ============================================================================

-- 1. KHỞI TẠO DATABASE (NẾU CHƯA TỒN TẠI)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'PremixTrackDB')
BEGIN
    CREATE DATABASE [PremixTrackDB]
    COLLATE Vietnamese_CI_AS;
    PRINT N'>>> Đã khởi tạo cơ sở dữ liệu PremixTrackDB thành công.';
END
GO

USE [PremixTrackDB];
GO

-- ============================================================================
-- PHẦN 0: DỌN DẸP TOÀN BỘ KHÓA NGOẠI CŨ & BẢNG CŨ (CLEAN RESET)
-- ============================================================================
DECLARE @sqlDropFK NVARCHAR(MAX) = N'';
SELECT @sqlDropFK += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N'.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
                     N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(13)
FROM sys.foreign_keys;
IF LEN(@sqlDropFK) > 0
BEGIN
    EXEC sp_executesql @sqlDropFK;
    PRINT N'>>> Đã gỡ bỏ toàn bộ Khóa ngoại (FK) cũ an toàn.';
END
GO

-- Xóa bảng theo đúng chuẩn
IF OBJECT_ID(N'dbo.stg_Raw_Forecast_Matrix', N'U') IS NOT NULL DROP TABLE dbo.stg_Raw_Forecast_Matrix;
IF OBJECT_ID(N'dbo.sys_Audit_Log', N'U') IS NOT NULL DROP TABLE dbo.sys_Audit_Log;
IF OBJECT_ID(N'dbo.fact_Production_Usage', N'U') IS NOT NULL DROP TABLE dbo.fact_Production_Usage;
IF OBJECT_ID(N'dbo.fact_Inbound_Schedule', N'U') IS NOT NULL DROP TABLE dbo.fact_Inbound_Schedule;
IF OBJECT_ID(N'dbo.fact_PO_Detail', N'U') IS NOT NULL DROP TABLE dbo.fact_PO_Detail;
IF OBJECT_ID(N'dbo.fact_Purchase_Order', N'U') IS NOT NULL DROP TABLE dbo.fact_Purchase_Order;
IF OBJECT_ID(N'dbo.fact_Inventory_SOH', N'U') IS NOT NULL DROP TABLE dbo.fact_Inventory_SOH;
IF OBJECT_ID(N'dbo.fact_Forecast_Detail', N'U') IS NOT NULL DROP TABLE dbo.fact_Forecast_Detail;
IF OBJECT_ID(N'dbo.fact_Forecast_Version', N'U') IS NOT NULL DROP TABLE dbo.fact_Forecast_Version;
IF OBJECT_ID(N'dbo.sys_Import_Mapping', N'U') IS NOT NULL DROP TABLE dbo.sys_Import_Mapping;
IF OBJECT_ID(N'dbo.sys_User_Account', N'U') IS NOT NULL DROP TABLE dbo.sys_User_Account;
IF OBJECT_ID(N'dbo.dim_Formula_Item', N'U') IS NOT NULL DROP TABLE dbo.dim_Formula_Item;
IF OBJECT_ID(N'dbo.dim_Formula_BOM', N'U') IS NOT NULL DROP TABLE dbo.dim_Formula_BOM;
IF OBJECT_ID(N'dbo.dim_Material_Substitution', N'U') IS NOT NULL DROP TABLE dbo.dim_Material_Substitution;
IF OBJECT_ID(N'dbo.dim_Supplier', N'U') IS NOT NULL DROP TABLE dbo.dim_Supplier;
IF OBJECT_ID(N'dbo.dim_Material', N'U') IS NOT NULL DROP TABLE dbo.dim_Material;
IF OBJECT_ID(N'dbo.dim_Factory', N'U') IS NOT NULL DROP TABLE dbo.dim_Factory;
IF OBJECT_ID(N'dbo.dim_Region', N'U') IS NOT NULL DROP TABLE dbo.dim_Region;
GO

-- ============================================================================
-- PHẦN 1: TẦNG BẢNG DANH MỤC MASTER DATA (DIMENSION TABLES - dim_*)
-- ============================================================================

-- 1.1. Bảng Danh Mục Khu Vực (dim_Region)
CREATE TABLE dbo.dim_Region (
    RegionID       NVARCHAR(50)   NOT NULL,
    RegionName     NVARCHAR(200)  NOT NULL,
    RegionName_EN  NVARCHAR(200)  NULL,
    CreatedAt      DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_dim_Region PRIMARY KEY CLUSTERED (RegionID)
);
PRINT N'>>> Đã tạo bảng dbo.dim_Region';
GO

-- 1.2. Bảng Danh Mục Nhà Máy & Recipe Sites (dim_Factory / tblFACTORY)
CREATE TABLE dbo.dim_Factory (
    FactoryID             NVARCHAR(50)   NOT NULL,
    InternalCode          NVARCHAR(50)   NOT NULL,
    FactoryName_VN        NVARCHAR(250)  NOT NULL,
    FactoryName_EN        NVARCHAR(250)  NULL,
    Division              NVARCHAR(50)   NOT NULL, -- 'Livestock', 'Aqua', 'Premix'
    RegionID              NVARCHAR(50)   NOT NULL,
    Address               NVARCHAR(500)  NULL,
    CapacityTonsPerMonth  DECIMAL(18,2)  NOT NULL DEFAULT 0,
    ActiveStatus          NVARCHAR(50)   NOT NULL DEFAULT N'Active',
    CreatedAt             DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_dim_Factory PRIMARY KEY CLUSTERED (FactoryID),
    CONSTRAINT FK_dim_Factory_Region FOREIGN KEY (RegionID) REFERENCES dbo.dim_Region(RegionID),
    CONSTRAINT CK_dim_Factory_Division CHECK (Division IN (N'Livestock', N'Aqua', N'Premix')),
    CONSTRAINT CK_dim_Factory_Status CHECK (ActiveStatus IN (N'Active', N'Inactive', N'Maintenance'))
);
CREATE UNIQUE NONCLUSTERED INDEX UX_dim_Factory_InternalCode ON dbo.dim_Factory(InternalCode);
PRINT N'>>> Đã tạo bảng dbo.dim_Factory';
GO

-- 1.3. Bảng Danh Mục Nguyên Liệu D365 FO (dim_Material / tblITEM - 18 SKUs)
CREATE TABLE dbo.dim_Material (
    MaterialID          NVARCHAR(50)   NOT NULL,
    MaterialCode        NVARCHAR(50)   NOT NULL,
    Name_VN             NVARCHAR(250)  NOT NULL,
    Name_EN             NVARCHAR(250)  NULL,
    Category            NVARCHAR(100)  NOT NULL,
    Unit                NVARCHAR(20)   NOT NULL DEFAULT N'KG',
    UnitPriceUSD        DECIMAL(18,4)  NOT NULL DEFAULT 0,
    PIC                 NVARCHAR(100)  NOT NULL DEFAULT N'Fiona',
    SafetyStockDays     INT            NOT NULL DEFAULT 15,
    MinOrderQty         DECIMAL(18,2)  NOT NULL DEFAULT 0,
    StandardPackingKg   DECIMAL(18,2)  NOT NULL DEFAULT 25.0,
    IsActive            BIT            NOT NULL DEFAULT 1,
    CreatedDate         DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_dim_Material PRIMARY KEY CLUSTERED (MaterialID),
    CONSTRAINT CK_dim_Material_UnitPrice CHECK (UnitPriceUSD >= 0),
    CONSTRAINT CK_dim_Material_SafetyStock CHECK (SafetyStockDays >= 0)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_dim_Material_Code ON dbo.dim_Material(MaterialCode);
PRINT N'>>> Đã tạo bảng dbo.dim_Material';
GO

-- 1.4. Bảng Danh Mục Nhà Cung Cấp (dim_Supplier / tblNCC - Import & Local)
CREATE TABLE dbo.dim_Supplier (
    SupplierID      NVARCHAR(50)   NOT NULL,
    SupplierCode    NVARCHAR(50)   NOT NULL,
    ShortName       NVARCHAR(150)  NOT NULL,
    FullName        NVARCHAR(350)  NOT NULL,
    SupplierType    NVARCHAR(50)   NOT NULL DEFAULT N'IMPORT',
    ContractNo      NVARCHAR(100)  NULL,
    Incoterm        NVARCHAR(50)   NOT NULL DEFAULT N'DDP',
    PaymentTerms    NVARCHAR(100)  NOT NULL DEFAULT N'Net 30',
    Email           NVARCHAR(250)  NULL,
    TaxCode         NVARCHAR(50)   NULL,
    Note_0          NVARCHAR(500)  NULL,
    Note_1          NVARCHAR(500)  NULL,
    IsActive        BIT            NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_dim_Supplier PRIMARY KEY CLUSTERED (SupplierID),
    CONSTRAINT CK_dim_Supplier_Type CHECK (SupplierType IN (N'IMPORT', N'LOCAL'))
);
CREATE UNIQUE NONCLUSTERED INDEX UX_dim_Supplier_Code ON dbo.dim_Supplier(SupplierCode);
PRINT N'>>> Đã tạo bảng dbo.dim_Supplier';
GO

-- 1.5. Bảng Ma Trận Nguyên Liệu Thay Thế Đa Nguồn (dim_Material_Substitution)
CREATE TABLE dbo.dim_Material_Substitution (
    SubID                NVARCHAR(50)   NOT NULL,
    PrimaryMaterialCode  NVARCHAR(50)   NOT NULL,
    AltMaterialCode      NVARCHAR(50)   NOT NULL,
    SubstitutionRatio    DECIMAL(8,4)   NOT NULL DEFAULT 1.0000,
    PriorityOrder        INT            NOT NULL DEFAULT 1,
    Notes                NVARCHAR(500)  NULL,
    ValidFrom            DATE           NOT NULL DEFAULT '2020-01-01',
    ValidTo              DATE           NULL,
    IsActive             BIT            NOT NULL DEFAULT 1,
    CreatedAt            DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_dim_Material_Substitution PRIMARY KEY CLUSTERED (SubID),
    CONSTRAINT CK_Sub_Ratio CHECK (SubstitutionRatio > 0),
    CONSTRAINT CK_Sub_NotSame CHECK (PrimaryMaterialCode <> AltMaterialCode)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_Substitution_Pair ON dbo.dim_Material_Substitution(PrimaryMaterialCode, AltMaterialCode);
PRINT N'>>> Đã tạo bảng dbo.dim_Material_Substitution';
GO

-- 1.6. Bảng Định Mức Công Thức BOM (dim_Formula_BOM & dim_Formula_Item)
CREATE TABLE dbo.dim_Formula_BOM (
    FormulaID      NVARCHAR(50)   NOT NULL,
    FormulaCode    NVARCHAR(50)   NOT NULL,
    FormulaName    NVARCHAR(250)  NOT NULL,
    Division       NVARCHAR(50)   NOT NULL,
    Revision       NVARCHAR(20)   NOT NULL DEFAULT N'1.0',
    EffectiveDate  DATE           NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    IsActive       BIT            NOT NULL DEFAULT 1,
    CreatedAt      DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_dim_Formula_BOM PRIMARY KEY CLUSTERED (FormulaID),
    CONSTRAINT CK_Formula_Division CHECK (Division IN (N'Livestock', N'Aqua', N'Premix'))
);
CREATE UNIQUE NONCLUSTERED INDEX UX_dim_Formula_Code ON dbo.dim_Formula_BOM(FormulaCode);
PRINT N'>>> Đã tạo bảng dbo.dim_Formula_BOM';
GO

CREATE TABLE dbo.dim_Formula_Item (
    FormulaItemID     INT IDENTITY(1,1) NOT NULL,
    FormulaCode       NVARCHAR(50)      NOT NULL,
    MaterialCode      NVARCHAR(50)      NOT NULL,
    InclusionRatePct  DECIMAL(8,4)      NOT NULL,
    Priority          INT               NOT NULL DEFAULT 1,
    Notes             NVARCHAR(250)     NULL,
    CONSTRAINT PK_dim_Formula_Item PRIMARY KEY CLUSTERED (FormulaItemID),
    CONSTRAINT CK_Formula_InclusionRate CHECK (InclusionRatePct > 0 AND InclusionRatePct <= 100)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_Formula_Material ON dbo.dim_Formula_Item(FormulaCode, MaterialCode);
PRINT N'>>> Đã tạo bảng dbo.dim_Formula_Item';
GO

-- 1.7. Bảng Từ Điển Ánh Xạ Header Linh Hoạt (sys_Import_Mapping)
CREATE TABLE dbo.sys_Import_Mapping (
    MappingID           NVARCHAR(50)   NOT NULL,
    TemplateType        NVARCHAR(50)   NOT NULL,
    SourceColumnHeader  NVARCHAR(200)  NOT NULL,
    TargetDbField       NVARCHAR(100)  NOT NULL,
    DataType            NVARCHAR(50)   NOT NULL DEFAULT N'STRING',
    IsRequired          BIT            NOT NULL DEFAULT 0,
    LastUsedAt          DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_sys_Import_Mapping PRIMARY KEY CLUSTERED (MappingID)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_Mapping_Header ON dbo.sys_Import_Mapping(TemplateType, SourceColumnHeader);
PRINT N'>>> Đã tạo bảng dbo.sys_Import_Mapping';
GO

-- 1.8. Bảng Tài Khoản & Phân Quyền Người Dùng (sys_User_Account)
CREATE TABLE dbo.sys_User_Account (
    UserID                NVARCHAR(50)   NOT NULL,
    Username              NVARCHAR(100)  NOT NULL,
    PasswordHash          NVARCHAR(255)  NOT NULL,
    PlainPasswordPreview  NVARCHAR(100)  NULL,
    FullName              NVARCHAR(200)  NOT NULL,
    Email                 NVARCHAR(200)  NOT NULL,
    Phone                 NVARCHAR(50)   NULL,
    Department            NVARCHAR(200)  NULL,
    Role                  NVARCHAR(50)   NOT NULL DEFAULT N'viewer',
    FactoryAccess         NVARCHAR(MAX)  NULL,
    IsActive              BIT            NOT NULL DEFAULT 1,
    CreatedAt             DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt             DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_sys_User_Account PRIMARY KEY CLUSTERED (UserID)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_sys_User_Username ON dbo.sys_User_Account(Username);
PRINT N'>>> Đã tạo bảng dbo.sys_User_Account';
GO

-- ============================================================================
-- PHẦN 2: TẦNG DỮ LIỆU HOẠT ĐỘNG & GIAO DỊCH (FACT TABLES - fact_*)
-- ============================================================================

-- 2.1. Bảng Quản Lý Phiên Bản Đợt Nạp Forecast (fact_Forecast_Version)
CREATE TABLE dbo.fact_Forecast_Version (
    VersionID         NVARCHAR(100)  NOT NULL,
    RunDate           DATE           NOT NULL,
    VersionName       NVARCHAR(250)  NOT NULL,
    TotalForecastQty  DECIMAL(18,2)  NOT NULL DEFAULT 0,
    SKUCount          INT            NOT NULL DEFAULT 0,
    PlantCount        INT            NOT NULL DEFAULT 0,
    UploadedAt        DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    UploadedBy        NVARCHAR(100)  NOT NULL DEFAULT N'System',
    SourceFileName    NVARCHAR(255)  NULL,
    Notes             NVARCHAR(500)  NULL,
    CONSTRAINT PK_fact_Forecast_Version PRIMARY KEY CLUSTERED (VersionID)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_Forecast_RunVersion ON dbo.fact_Forecast_Version(RunDate, VersionName);
PRINT N'>>> Đã tạo bảng dbo.fact_Forecast_Version';
GO

-- 2.2. Bảng Chi Tiết Nhu Cầu Dự Báo Forecast Theo Site (fact_Forecast_Detail)
CREATE TABLE dbo.fact_Forecast_Detail (
    DetailID        BIGINT IDENTITY(1,1) NOT NULL,
    VersionID       NVARCHAR(100)        NOT NULL,
    RunDate         DATE                 NOT NULL,
    SiteCode        NVARCHAR(50)         NOT NULL,
    FactoryCode     NVARCHAR(50)         NOT NULL,
    PlantName       NVARCHAR(250)        NOT NULL,
    MaterialCode    NVARCHAR(50)         NOT NULL,
    MaterialName    NVARCHAR(250)        NOT NULL,
    Division        NVARCHAR(50)         NOT NULL DEFAULT N'Livestock',
    ForecastQtyKg   DECIMAL(18,2)        NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2(0)         NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_fact_Forecast_Detail PRIMARY KEY CLUSTERED (DetailID),
    CONSTRAINT FK_ForecastDetail_Version FOREIGN KEY (VersionID) REFERENCES dbo.fact_Forecast_Version(VersionID) ON DELETE CASCADE,
    CONSTRAINT CK_ForecastDetail_Qty CHECK (ForecastQtyKg >= 0)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_Forecast_Site_Material ON dbo.fact_Forecast_Detail(VersionID, SiteCode, MaterialCode);
CREATE NONCLUSTERED INDEX IX_Forecast_RunDate_Material ON dbo.fact_Forecast_Detail(RunDate, MaterialCode) INCLUDE (ForecastQtyKg);
PRINT N'>>> Đã tạo bảng dbo.fact_Forecast_Detail';
GO

-- 2.3. Bảng Tồn Kho Thực Tế Theo Snapshot Ngày (fact_Inventory_SOH)
CREATE TABLE dbo.fact_Inventory_SOH (
    SOH_ID         NVARCHAR(100) NOT NULL,
    FactoryID      NVARCHAR(50)  NULL,
    MaterialCode   NVARCHAR(50)  NOT NULL,
    SOHQtyKg       DECIMAL(18,2) NOT NULL DEFAULT 0,
    Region         NVARCHAR(50)  NULL,
    WarehouseCode  NVARCHAR(50)  NULL,
    OrgCode        NVARCHAR(50)  NULL,
    SubInventory   NVARCHAR(50)  NULL DEFAULT N'RAW',
    AveragePrice   DECIMAL(18,2) NULL DEFAULT 0,
    SnapshotDate   DATE          NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    AllocatedKg    DECIMAL(18,2) NOT NULL DEFAULT 0,
    AvailableKg    AS (SOHQtyKg - AllocatedKg),
    LotNumber      NVARCHAR(100) NOT NULL DEFAULT N'DEFAULT_LOT',
    ExpiryDate     DATE          NULL,
    QualityStatus  NVARCHAR(50)  NOT NULL DEFAULT N'Available',
    LastUpdated    DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_fact_Inventory_SOH PRIMARY KEY CLUSTERED (SOH_ID),
    CONSTRAINT CK_Inventory_OnHand CHECK (SOHQtyKg >= 0)
);
CREATE NONCLUSTERED INDEX IX_Inventory_Snapshot ON dbo.fact_Inventory_SOH(SnapshotDate, WarehouseCode, MaterialCode) INCLUDE (SOHQtyKg, AveragePrice);
PRINT N'>>> Đã tạo bảng dbo.fact_Inventory_SOH';
GO

-- 2.3b. Bảng Biến Động Tồn Kho Xuất Nhập Tồn & Lượng Dùng Sản Xuất (fact_Inventory_Movement)
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
    ReportDate         DATE           NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    CreatedAt          DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_fact_Inventory_Movement PRIMARY KEY CLUSTERED (MovementID)
);
CREATE NONCLUSTERED INDEX IX_InvMovement_Date_Factory ON dbo.fact_Inventory_Movement(ReportDate, FactoryCode, MaterialCode);
PRINT N'>>> Đã tạo bảng dbo.fact_Inventory_Movement';
GO

-- 2.4. Bảng Đơn Hàng Mua Mở D365 FO (fact_Purchase_Order & fact_PO_Detail)
CREATE TABLE dbo.fact_Purchase_Order (
    PO_Header_ID          NVARCHAR(50)   NOT NULL,
    PONumber              NVARCHAR(50)   NOT NULL,
    SupplierCode          NVARCHAR(50)   NOT NULL,
    OrderDate             DATE           NOT NULL,
    ExpectedDeliveryDate  DATE           NULL,
    FactoryCode           NVARCHAR(50)   NOT NULL,
    TotalAmountUSD        DECIMAL(18,2)  NOT NULL DEFAULT 0,
    POStatus              NVARCHAR(50)   NOT NULL DEFAULT N'Confirmed',
    CreatedAt             DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_fact_Purchase_Order PRIMARY KEY CLUSTERED (PO_Header_ID),
    CONSTRAINT CK_PO_Status CHECK (POStatus IN (N'Draft', N'Confirmed', N'In_Transit', N'Partially_Received', N'Completed', N'Cancelled'))
);
CREATE UNIQUE NONCLUSTERED INDEX UX_PO_Number ON dbo.fact_Purchase_Order(PONumber);
PRINT N'>>> Đã tạo bảng dbo.fact_Purchase_Order';
GO

CREATE TABLE dbo.fact_PO_Detail (
    PO_Detail_ID   BIGINT IDENTITY(1,1) NOT NULL,
    PONumber       NVARCHAR(50)         NOT NULL,
    MaterialCode   NVARCHAR(50)         NOT NULL,
    FactoryCode    NVARCHAR(50)         NOT NULL,
    OrderQtyKg     DECIMAL(18,2)        NOT NULL DEFAULT 0,
    ReceivedQtyKg  DECIMAL(18,2)        NOT NULL DEFAULT 0,
    PendingQtyKg   AS (OrderQtyKg - ReceivedQtyKg) PERSISTED,
    UnitPriceUSD   DECIMAL(18,4)        NOT NULL DEFAULT 0,
    ETA_Date       DATE                 NULL,
    Status         NVARCHAR(50)         NOT NULL DEFAULT N'Pending',
    CONSTRAINT PK_fact_PO_Detail PRIMARY KEY CLUSTERED (PO_Detail_ID),
    CONSTRAINT FK_PODetail_Header FOREIGN KEY (PONumber) REFERENCES dbo.fact_Purchase_Order(PONumber) ON DELETE CASCADE,
    CONSTRAINT CK_PODetail_OrderQty CHECK (OrderQtyKg >= 0),
    CONSTRAINT CK_PODetail_ReceivedQty CHECK (ReceivedQtyKg >= 0)
);
CREATE UNIQUE NONCLUSTERED INDEX UX_PODetail_Item ON dbo.fact_PO_Detail(PONumber, MaterialCode, FactoryCode);
PRINT N'>>> Đã tạo bảng dbo.fact_PO_Detail';
GO

-- 2.5. Bảng Lịch Trình Tàu Hàng Về Cảng / Nhà Máy (fact_Inbound_Schedule)
CREATE TABLE dbo.fact_Inbound_Schedule (
    ScheduleID          NVARCHAR(50)   NOT NULL,
    PONumber            NVARCHAR(50)   NOT NULL,
    MaterialCode        NVARCHAR(50)   NOT NULL,
    FactoryCode         NVARCHAR(50)   NOT NULL,
    SupplierCode        NVARCHAR(50)   NOT NULL,
    ExpectedArrivalDate DATE           NOT NULL,
    ScheduledQtyKg      DECIMAL(18,2)  NOT NULL DEFAULT 0,
    ContainerNo         NVARCHAR(50)   NULL,
    ShippingLine        NVARCHAR(150)  NULL,
    Status              NVARCHAR(50)   NOT NULL DEFAULT N'Scheduled',
    ActualArrivalDate   DATE           NULL,
    ReceivedAt          DATETIME2(0)   NULL,
    CreatedAt           DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_fact_Inbound_Schedule PRIMARY KEY CLUSTERED (ScheduleID),
    CONSTRAINT CK_Inbound_Status CHECK (Status IN (N'Scheduled', N'On_Vessel', N'Customs_Hold', N'Arrived_Port', N'Received', N'Delayed'))
);
PRINT N'>>> Đã tạo bảng dbo.fact_Inbound_Schedule';
GO

-- 2.6. Bảng Nhật Ký Tiêu Hao Thực Tế Sản Xuất (fact_Production_Usage)
CREATE TABLE dbo.fact_Production_Usage (
    UsageID         BIGINT IDENTITY(1,1) NOT NULL,
    UsageDate       DATE                 NOT NULL,
    FactoryCode     NVARCHAR(50)         NOT NULL,
    MaterialCode    NVARCHAR(50)         NOT NULL,
    BatchNumber     NVARCHAR(100)        NOT NULL,
    FormulaCode     NVARCHAR(50)         NULL,
    ActualUsageKg   DECIMAL(18,2)        NOT NULL DEFAULT 0,
    RecordedBy      NVARCHAR(100)        NOT NULL DEFAULT N'Operator',
    CreatedAt       DATETIME2(0)         NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_fact_Production_Usage PRIMARY KEY CLUSTERED (UsageID),
    CONSTRAINT CK_Usage_ActualUsage CHECK (ActualUsageKg >= 0)
);
PRINT N'>>> Đã tạo bảng dbo.fact_Production_Usage';
GO

-- ============================================================================
-- PHẦN 3: TẦNG BẢNG TẠM NHẬP LIỆU (STAGING TABLES - stg_*)
-- ============================================================================

CREATE TABLE dbo.stg_Raw_Forecast_Matrix (
    StagingID      BIGINT IDENTITY(1,1) NOT NULL,
    BatchID        NVARCHAR(100)        NOT NULL,
    RunDate        DATE                 NOT NULL,
    VersionName    NVARCHAR(250)        NOT NULL,
    MaterialCode   NVARCHAR(50)         NOT NULL,
    MaterialDesc   NVARCHAR(250)        NULL,
    SiteHeader     NVARCHAR(100)        NOT NULL,
    ForecastQtyKg  DECIMAL(18,2)        NOT NULL DEFAULT 0,
    CreatedAt      DATETIME2(0)         NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_stg_Raw_Forecast_Matrix PRIMARY KEY CLUSTERED (StagingID)
);
PRINT N'>>> Đã tạo bảng dbo.stg_Raw_Forecast_Matrix';
GO

-- 3.1. Bảng Ghi Vết Lịch Sử Thay Đổi Dữ Liệu (sys_Audit_Log)
CREATE TABLE dbo.sys_Audit_Log (
    LogID          BIGINT IDENTITY(1,1) NOT NULL,
    ActionType     NVARCHAR(50)         NOT NULL,
    TableName      NVARCHAR(100)        NOT NULL,
    RecordKey      NVARCHAR(200)        NOT NULL,
    PerformedBy    NVARCHAR(100)        NOT NULL DEFAULT N'System',
    PerformedAt    DATETIME2(0)         NOT NULL DEFAULT SYSDATETIME(),
    OldValuesJSON  NVARCHAR(MAX)        NULL,
    NewValuesJSON  NVARCHAR(MAX)        NULL,
    Notes          NVARCHAR(500)        NULL,
    CONSTRAINT PK_sys_Audit_Log PRIMARY KEY CLUSTERED (LogID)
);
PRINT N'>>> Đã tạo bảng dbo.sys_Audit_Log';
GO

-- 3.2. Bảng Ma Trận Position Toàn Diện Chuỗi Cung Ứng (fact_Position_Snapshot)
CREATE TABLE dbo.fact_Position_Snapshot (
    PositionID                    NVARCHAR(100)  NOT NULL,
    SnapshotDate                  DATE           NOT NULL,
    CutoffWorkingDays             INT            NOT NULL DEFAULT 22,
    StandardMonthDays             INT            NOT NULL DEFAULT 28,
    Region                        NVARCHAR(50)   NOT NULL,
    RMGroup                       NVARCHAR(50)   NOT NULL DEFAULT N'Macro',
    Division                      NVARCHAR(50)   NOT NULL DEFAULT N'Livestock',
    FactoryCode                   NVARCHAR(50)   NOT NULL,
    MaterialCode                  NVARCHAR(50)   NOT NULL,
    MaterialName                  NVARCHAR(250)  NOT NULL,
    PIC                           NVARCHAR(100)  NOT NULL DEFAULT N'Mina',
    SOHQtyKg                      DECIMAL(18,2)  NOT NULL DEFAULT 0,
    MTD_Production_PrevMonth_Kg   DECIMAL(18,2)  NOT NULL DEFAULT 0,
    MTD_Production_CurrMonth_Kg   DECIMAL(18,2)  NOT NULL DEFAULT 0,
    MonthlyUsageForecastKg        DECIMAL(18,2)  NOT NULL DEFAULT 0,
    PctUsedUsage                  DECIMAL(18,4)  NULL,
    DailyStandardUsageKg          DECIMAL(18,2)  NULL,
    DOI_Standard_Days             DECIMAL(18,1)  NULL,
    DOI_Actual_MTD_Days           DECIMAL(18,1)  NULL,
    StockoutDateSOH               DATE           NULL,
    EmergencyBufferQtyKg          DECIMAL(18,2)  NULL,
    DOI_AfterBuffer_Days          DECIMAL(18,1)  NULL,
    PO_PendingInboundKg           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    TotalPipeline_DOI_Days        DECIMAL(18,1)  NULL,
    MaxProtectedDate              DATE           NULL,
    CreatedAt                     DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_fact_Position_Snapshot PRIMARY KEY CLUSTERED (PositionID)
);
CREATE NONCLUSTERED INDEX IX_Position_Date_Fac_Mat ON dbo.fact_Position_Snapshot(SnapshotDate, FactoryCode, MaterialCode);
PRINT N'>>> Đã tạo bảng dbo.fact_Position_Snapshot';
GO

PRINT N'============================================================================';
PRINT N'>>> TẤT CẢ CÁC BẢNG TRONG PREMIXTRACK DB ĐÃ ĐƯỢC TẠO HOÀN CHỈNH VÀ CHẶT CHẼ!';
PRINT N'============================================================================';
GO
