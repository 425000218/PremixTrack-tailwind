-- ============================================================================
-- MIGRATION: 20260826_Fix_CK_User_Role_Constraint.sql
-- Gỡ bỏ ràng buộc hạn chế CK_User_Role để cho phép cập nhật mọi vai trò (RBAC)
-- ============================================================================

USE [PremixTrackDB];
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_User_Role')
BEGIN
    ALTER TABLE dbo.sys_User_Account DROP CONSTRAINT CK_User_Role;
    PRINT N'>>> Đã gỡ bỏ ràng buộc CK_User_Role để hỗ trợ đầy đủ các vai trò linh hoạt.';
END
GO
