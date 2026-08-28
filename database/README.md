# ??? PremixTrack Enterprise Database Architecture (MS SQL Server 2022)

H? th?ng luu tr? co s? d? li?u quan h? cho **PremixTrack Enterprise** du?c thi?t k? theo mô hình Star Schema chu?n D365 FO, t?i uu cho phân tích chu?i cung ?ng SCM, tính toán ma tr?n v? th?, và di?u ph?i n?i b?.

---

## 1. Th? T? Th?c Thi Kh?i T?o (Execution Order)

Khi thi?t l?p database m?i t? d?u ho?c ch?y t? d?ng qua l?nh `npm run db:migrate`:

```text
1. 01_PremixTrack_Schema_DDL.sql         -> Kh?i t?o Database PremixTrackDB, Schema, Tables, Primary Keys, Foreign Keys, Indexes
2. 02_PremixTrack_Seed_Data.sql          -> N?p d? li?u danh m?c g?c D365 FO (22 nhà máy, NCC, v?t tu, c?u hình h? th?ng)
3. 03_PremixTrack_Stored_Procedures.sql  -> T?o Stored Procedures tính toán cân d?i cung c?u và di?u chuy?n n?i b?
4. database/migrations/*.sql             -> Ch?y tu?n t? các b?n vá migration theo m?c th?i gian
```

---

## 2. Danh M?c B?ng (Table Catalog)

### ?? Dimension Tables (Danh M?c G?c - Master Data)
- `dbo.dim_Region`: Danh m?c vùng mi?n (Mi?n B?c, Mi?n Trung, Mi?n Nam, ÐBSCL).
- `dbo.dim_Factory`: 22 nhà máy s?n xu?t (Th?c an gia súc & Th?y s?n).
- `dbo.dim_Supplier`: Nhà cung c?p nguyên li?u trong nu?c & qu?c t?.
- `dbo.dim_Material`: Danh m?c nguyên li?u Micro, Macro, Premix, Hoá ch?t, Vitamin, Khoáng.
- `dbo.dim_Material_Substitution`: Ma tr?n chuy?n d?i & thay th? nguyên li?u tuong duong (1-to-N).

### ?? Fact Tables (D? Li?u V?n Hành & Giao D?ch)
- `dbo.fact_Forecast_Header` & `dbo.fact_Forecast_Detail`: K? ho?ch nhu c?u s?n xu?t theo t?ng d?t ch?y t? R&D.
- `dbo.fact_Inventory_SOH`: T?n kho th?c t? (Stock On Hand) t?i các nhà máy theo ngày ch?t.
- `dbo.fact_Inventory_Movement`: L?ch s? xu?t/nh?p, tiêu hao s?n xu?t (WIP Issue) và s? li?u MTD.
- `dbo.fact_Purchase_Order` & `dbo.fact_PO_Detail`: Ðon d?t hàng mua, s? lu?ng PO Pending dang trên du?ng v? c?ng/nhà máy.
- `dbo.fact_Inbound_Schedule`: L?ch trình xe giao hàng, cân xe t?i c?ng nhà máy.
- `dbo.fact_Position_Snapshot`: Ma tr?n v? th? cung ?ng h?p nh?t (Position Matrix) ch?t ngày 25 hàng tháng.

### ??? System Tables (Qu?n Tr? H? Th?ng & B?o M?t)
- `dbo.sys_User_Account`: Tài kho?n ngu?i dùng, phân quy?n theo vai trò (RBAC) và ph?m vi nhà máy.
- `dbo.sys_Import_Mapping`: T? di?n ánh x? tiêu d? c?t Excel linh ho?t.
- `dbo.sys_Audit_Log`: Nh?t ký theo dõi thao tác ngu?i dùng.

---

## 3. Danh M?c Stored Procedures
- `dbo.sp_Calculate_Position_Matrix`: Tính toán t? d?ng s? ngày t?n chu?n (DOI), ngày c?n hàng (Stockout Date), và t?ng ngày b?o v? t?i da kèm don hàng PO cho toàn b? 22 nhà máy.

---

## 4. L?nh V?n Hành & Migration
- **T? d?ng Migration qua Node.js**:
  ```bash
  npm run db:migrate
  ```
- **Ch?y th? công qua SSMS**: K?t n?i t?i `192.168.1.202` (Database: `PremixTrackDB`) và th?c thi các file theo th? t? trên.
