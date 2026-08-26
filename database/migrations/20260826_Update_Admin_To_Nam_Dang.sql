-- ============================================================================
-- MIGRATION: 20260826_Update_Admin_To_Nam_Dang.sql
-- Cập nhật chính thức thông tin tài khoản Admin sang "Nam Đặng"
-- và bảo toàn dữ liệu chỉnh sửa người dùng không bị ghi đè bởi migrate sau này
-- ============================================================================

USE [PremixTrackDB];
GO

UPDATE dbo.sys_User_Account
SET FullName = N'Nam Đặng',
    Email = N'nam.dang@premixtrack.vn',
    Phone = N'0378 047 778',
    Department = N'Ban Giám Đốc & Quản Trị Hệ Thống'
WHERE Username = 'admin';

PRINT N'>>> Đã cập nhật thành công thông tin Admin sang: Nam Đặng (nam.dang@premixtrack.vn)';
GO
