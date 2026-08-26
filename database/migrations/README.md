# THƯ MỤC CHỨA CÁC BẢN CẬP NHẬT MIGRATION SQL (SSMS)

Mỗi khi hệ thống PremixTrack phát triển thêm tính năng mới, thay đổi cấu trúc bảng hoặc bổ sung Stored Procedure, file `.sql` tương ứng sẽ được lưu tại đây với quy tắc đặt tên:

```
database/migrations/YYYYMMDD_Update_[Ten_Tinh_Nang].sql
```

## Cách Chạy Trên SSMS:
1. Mở phần mềm **SQL Server Management Studio (SSMS)**.
2. Kết nối tới server: `192.168.1.202` (User: `sa`).
3. Chọn database: **`PremixTrackDB`**.
4. Kéo thả file migration vào SSMS và bấm **Execute (F5)**.
