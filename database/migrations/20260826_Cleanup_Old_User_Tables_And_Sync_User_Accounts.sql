-- ============================================================================
-- MIGRATION: 20260826_Cleanup_Old_User_Tables_And_Sync_User_Accounts.sql
-- Xóa bảng cũ Sys_User và chuẩn hóa dbo.sys_User_Account
-- Nạp đầy đủ 5 tài khoản mẫu và phân quyền Admin quản lý toàn diện
-- ============================================================================

USE [PremixTrackDB];
GO

-- 1. Xóa bảng cũ Sys_User nếu còn tồn tại
IF OBJECT_ID(N'dbo.Sys_User', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Sys_User;
    PRINT N'>>> Đã xóa bảng thừa dbo.Sys_User.';
END
GO

-- 2. Đảm bảo dbo.sys_User_Account có đầy đủ các cột thông tin
IF OBJECT_ID(N'dbo.sys_User_Account', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sys_User_Account (
        UserID                NVARCHAR(50)   NOT NULL,
        Username              NVARCHAR(100)  NOT NULL,
        PasswordHash          NVARCHAR(255)  NOT NULL,
        PlainPasswordPreview  NVARCHAR(100)  NULL, -- Cho phép Admin xem/sửa mật khẩu trực quan
        FullName              NVARCHAR(200)  NOT NULL,
        Email                 NVARCHAR(200)  NOT NULL,
        Phone                 NVARCHAR(50)   NULL,
        Department            NVARCHAR(200)  NULL,
        Role                  NVARCHAR(50)   NOT NULL DEFAULT N'viewer',
        FactoryAccess         NVARCHAR(MAX)  NULL, -- JSON array mã nhà máy được phân quyền (ví dụ '["ALL"]' hoặc '["FAC-DBD","FAC-DDN"]')
        IsActive              BIT            NOT NULL DEFAULT 1,
        CreatedAt             DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt             DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_sys_User_Account PRIMARY KEY CLUSTERED (UserID)
    );
    CREATE UNIQUE NONCLUSTERED INDEX UX_sys_User_Username ON dbo.sys_User_Account(Username);
    PRINT N'>>> Đã tạo mới bảng dbo.sys_User_Account.';
END
ELSE
BEGIN
    -- Bổ sung cột nếu thiếu
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.sys_User_Account') AND name = N'PlainPasswordPreview')
        ALTER TABLE dbo.sys_User_Account ADD PlainPasswordPreview NVARCHAR(100) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.sys_User_Account') AND name = N'Phone')
        ALTER TABLE dbo.sys_User_Account ADD Phone NVARCHAR(50) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.sys_User_Account') AND name = N'Department')
        ALTER TABLE dbo.sys_User_Account ADD Department NVARCHAR(200) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.sys_User_Account') AND name = N'UpdatedAt')
        ALTER TABLE dbo.sys_User_Account ADD UpdatedAt DATETIME2(0) NOT NULL DEFAULT SYSDATETIME();

    PRINT N'>>> Đã cập nhật đầy đủ các cột cho dbo.sys_User_Account.';
END
GO

-- 3. Nạp và đồng bộ 5 tài khoản người dùng theo các vai trò phân quyền
MERGE INTO dbo.sys_User_Account AS Target
USING (VALUES
    (N'USR-001', N'admin', N'$2a$12$eXampleHashedPasswordForAdmin..', N'admin@123', N'Nam Đặng', N'nam.dang@premixtrack.vn', N'0378 047 778', N'Ban Giám Đốc & Quản Trị Hệ Thống', N'admin', N'["ALL"]', 1),
    (N'USR-002', N'scm_lead', N'$2a$12$eXampleHashedPasswordForSCM..', N'scm@123', N'Lê Hoàng Nam', N'nam.le@premixtrack.vn', N'0903 112 233', N'Phòng Kế Hoạch Chuỗi Cung Ứng & S&OP', N'planner', N'["ALL"]', 1),
    (N'USR-003', N'planner_dbd', N'$2a$12$eXampleHashedPasswordForPlanner..', N'planner@123', N'Trần Thị Thu Hà', N'ha.tran@premixtrack.vn', N'0988 765 432', N'Bộ Phận Kỹ Thuật & Kế Hoạch Sản Xuất DBD', N'factory_manager', N'["FAC-DBD","FAC-DDN"]', 1),
    (N'USR-004', N'logistics_lead', N'$2a$12$eXampleHashedPasswordForLogistics..', N'logistics@123', N'Phạm Đức Thắng', N'thang.pham@premixtrack.vn', N'0977 889 900', N'Bộ Phận Logistics Cảng & Kho Vận', N'buyer', N'["ALL"]', 1),
    (N'USR-005', N'viewer_auditor', N'$2a$12$eXampleHashedPasswordForViewer..', N'viewer@123', N'Đỗ Hoài An', N'an.do@premixtrack.vn', N'0934 556 778', N'Ban Kiểm Soát Nội Bộ & QA', N'viewer', N'["ALL"]', 1)
) AS Source (UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive)
ON Target.UserID = Source.UserID OR Target.Username = Source.Username
WHEN NOT MATCHED THEN
    INSERT (UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive, CreatedAt, UpdatedAt)
    VALUES (Source.UserID, Source.Username, Source.PasswordHash, Source.PlainPasswordPreview, Source.FullName, Source.Email, Source.Phone, Source.Department, Source.Role, Source.FactoryAccess, Source.IsActive, SYSDATETIME(), SYSDATETIME());
PRINT N'>>> Đã đồng bộ thành công các tài khoản người dùng vào dbo.sys_User_Account';
GO
