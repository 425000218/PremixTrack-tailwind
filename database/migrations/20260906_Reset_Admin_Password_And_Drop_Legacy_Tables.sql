
-- MIGRATION: 20260906_Reset_Admin_Password_And_Drop_Legacy_Tables.sql
-- 1. Reset m?t kh?u c?a tài kho?n Admin thành: 123456
-- 2. Xóa các b?ng cu không còn s? d?ng trong h? th?ng m?i.
-- ============================================================================

-- 1. Reset Admin Password to '123456'
UPDATE dbo.sys_User_Account
SET PasswordHash = N'\$2b\$10\$zyvdh0oYZmA0VE5H4a3nAew83WdKusGeNoo9JP.1Dyxc3BA50.c5q'
WHERE Username = N'admin';

PRINT N'>>> Ðã reset m?t kh?u c?a admin v? 123456';

-- 2. Drop Legacy Tables (if they exist)
IF OBJECT_ID(N'dbo.Fact_Forecast_Header', N'U') IS NOT NULL 
    DROP TABLE dbo.Fact_Forecast_Header;

IF OBJECT_ID(N'dbo.Dim_PIC', N'U') IS NOT NULL 
    DROP TABLE dbo.Dim_PIC;

IF OBJECT_ID(N'dbo.Fact_InterFactory_Transfer', N'U') IS NOT NULL 
    DROP TABLE dbo.Fact_InterFactory_Transfer;

IF OBJECT_ID(N'dbo.Fact_PurchaseOrder', N'U') IS NOT NULL 
    DROP TABLE dbo.Fact_PurchaseOrder;

IF OBJECT_ID(N'dbo.Formula_BOM', N'U') IS NOT NULL 
    DROP TABLE dbo.Formula_BOM;

IF OBJECT_ID(N'dbo.Formula_BOM_Item', N'U') IS NOT NULL 
    DROP TABLE dbo.Formula_BOM_Item;

PRINT N'>>> Ðã d?n d?p các b?ng D365 cu không còn s? d?ng.';
GO

