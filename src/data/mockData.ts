import {
  Dim_Region,
  Dim_Factory,
  Dim_PIC,
  Dim_Supplier,
  Dim_Material,
  Fact_Forecast_Header,
  Fact_Forecast_Detail,
  Fact_Inventory_SOH,
  Fact_Production_Usage,
  Fact_PurchaseOrder,
  Fact_PO_Detail,
  Fact_Inbound_Schedule,
  Sys_Import_Mapping,
  Formula_BOM
} from '../types';

export const initialRegions: Dim_Region[] = [
  { RegionID: 'REG-SOUTH', RegionName: 'Miền Đông & Tây Nam Bộ', RegionName_EN: 'Southern Region' },
  { RegionID: 'REG-NORTH', RegionName: 'Miền Bắc & Duyên Hải', RegionName_EN: 'Northern Region' },
  { RegionID: 'REG-CENTRAL', RegionName: 'Miền Trung & Tây Nguyên', RegionName_EN: 'Central & Highlands' },
  { RegionID: 'REG-MEKONG', RegionName: 'Đồng Bằng Sông Cửu Long', RegionName_EN: 'Mekong Delta Region' },
];

export const initialFactories: Dim_Factory[] = [
  {
    FactoryID: 'FAC-DBD',
    InternalCode: 'DBD',
    ForecastHeaderCode: '043',
    FactoryName_VN: 'Nhà máy Bình Dương (Feed & Premix Plant)',
    FactoryName_EN: 'Binh Duong Feed & Premix Mill',
    RegionID: 'REG-SOUTH',
    Address: 'KCN VSIP II, TX. Tân Uyên, Bình Dương',
    CapacityTonsPerMonth: 45000,
  },
  {
    FactoryID: 'FAC-DDN',
    InternalCode: 'DDN',
    ForecastHeaderCode: '0432',
    FactoryName_VN: 'Nhà máy Đồng Nai (Biên Hòa)',
    FactoryName_EN: 'Dong Nai Feed Mill',
    RegionID: 'REG-SOUTH',
    Address: 'KCN Amata, TP. Biên Hòa, Đồng Nai',
    CapacityTonsPerMonth: 38000,
  },
  {
    FactoryID: 'FAC-DHY',
    InternalCode: 'DHY',
    ForecastHeaderCode: '0435',
    FactoryName_VN: 'Nhà máy Hưng Yên (Phố Nối)',
    FactoryName_EN: 'Hung Yen Feed Mill',
    RegionID: 'REG-NORTH',
    Address: 'KCN Phố Nối A, Yên Mỹ, Hưng Yên',
    CapacityTonsPerMonth: 35000,
  },
  {
    FactoryID: 'FAC-DVL',
    InternalCode: 'DVL',
    ForecastHeaderCode: '0438',
    FactoryName_VN: 'Nhà máy Vĩnh Long (Thủy Sản & Gia Súc)',
    FactoryName_EN: 'Vinh Long Aqua & Feed Mill',
    RegionID: 'REG-MEKONG',
    Address: 'KCN Hòa Phú, Huyện Long Hồ, Vĩnh Long',
    CapacityTonsPerMonth: 30000,
  },
  {
    FactoryID: 'FAC-DBN',
    InternalCode: 'DBN',
    ForecastHeaderCode: '0439',
    FactoryName_VN: 'Nhà máy Bắc Ninh (Quế Võ)',
    FactoryName_EN: 'Bac Ninh Feed Mill',
    RegionID: 'REG-NORTH',
    Address: 'KCN Quế Võ, TP. Bắc Ninh',
    CapacityTonsPerMonth: 28000,
  },
  {
    FactoryID: 'FAC-DTI',
    InternalCode: 'DTI',
    ForecastHeaderCode: '0441',
    FactoryName_VN: 'Nhà máy Tiền Giang (Mỹ Tho)',
    FactoryName_EN: 'Tien Giang Feed Mill',
    RegionID: 'REG-MEKONG',
    Address: 'KCN Mỹ Tho, TP. Mỹ Tho, Tiền Giang',
    CapacityTonsPerMonth: 25000,
  },
  {
    FactoryID: 'FAC-DHP',
    InternalCode: 'DHP',
    ForecastHeaderCode: '0442',
    FactoryName_VN: 'Nhà máy Hải Phòng (Đình Vũ)',
    FactoryName_EN: 'Hai Phong Feed Mill',
    RegionID: 'REG-NORTH',
    Address: 'KCN Đình Vũ, Hải An, Hải Phòng',
    CapacityTonsPerMonth: 22000,
  },
  {
    FactoryID: 'FAC-DGL',
    InternalCode: 'DGL',
    ForecastHeaderCode: '0445',
    FactoryName_VN: 'Nhà máy Gia Lai (Tây Nguyên)',
    FactoryName_EN: 'Gia Lai Feed Mill',
    RegionID: 'REG-CENTRAL',
    Address: 'KCN Trà Đa, TP. Pleiku, Gia Lai',
    CapacityTonsPerMonth: 18000,
  },
];

export const initialPICs: Dim_PIC[] = [
  { PIC_ID: 'PIC-01', FullName: 'Nguyễn Văn Minh', Email: 'minh.nguyen@deheus.com.vn', Phone: '0912 345 678', Department: 'Procurement - Amino & Vitamins' },
  { PIC_ID: 'PIC-02', FullName: 'Trần Thị Thu Hà', Email: 'ha.tran@deheus.com.vn', Phone: '0988 765 432', Department: 'Premix Formulator & QC' },
  { PIC_ID: 'PIC-03', FullName: 'Lê Hoàng Nam', Email: 'nam.le@deheus.com.vn', Phone: '0903 112 233', Department: 'Supply Chain & S&OP' },
  { PIC_ID: 'PIC-04', FullName: 'Phạm Đức Thắng', Email: 'thang.pham@deheus.com.vn', Phone: '0977 889 900', Department: 'Inbound Logistics & Customs' },
];

export const initialSuppliers: Dim_Supplier[] = [
  { SupplierID: 'SUP-01', SupplierCode: 'SUP-EVONIK', SupplierName: 'Evonik Nutrition Specialties', Country: 'Germany', Incoterm: 'CIF', PaymentTerms: 'LC 60 Days', LeadTimeDays: 35, Rating: 4.9 },
  { SupplierID: 'SUP-02', SupplierCode: 'SUP-DSM', SupplierName: 'dsm-firmenich Animal Health', Country: 'Switzerland', Incoterm: 'CIF', PaymentTerms: 'TT 45 Days', LeadTimeDays: 30, Rating: 4.8 },
  { SupplierID: 'SUP-03', SupplierCode: 'SUP-ADISSEO', SupplierName: 'Adisseo Asia Pacific', Country: 'France', Incoterm: 'CIF', PaymentTerms: 'LC 90 Days', LeadTimeDays: 40, Rating: 4.7 },
  { SupplierID: 'SUP-04', SupplierCode: 'SUP-AJINOMOTO', SupplierName: 'Ajinomoto Animal Nutrition', Country: 'Japan', Incoterm: 'CIF', PaymentTerms: 'TT 30 Days', LeadTimeDays: 25, Rating: 4.9 },
  { SupplierID: 'SUP-05', SupplierCode: 'SUP-CJ', SupplierName: 'CJ CheilJedang Bio Corp', Country: 'Korea', Incoterm: 'FOB', PaymentTerms: 'TT 30 Days', LeadTimeDays: 20, Rating: 4.6 },
  { SupplierID: 'SUP-06', SupplierCode: 'SUP-KEMIN', SupplierName: 'Kemin Industries Vietnam', Country: 'USA / VN', Incoterm: 'DDP', PaymentTerms: 'TT 15 Days', LeadTimeDays: 5, Rating: 4.8 },
];

export const initialMaterials: Dim_Material[] = [
  {
    MaterialID: 'MAT-01',
    MaterialCode: '2580001',
    Name_VN: 'DL-Methionine 99% Feed Grade',
    Name_EN: 'DL-Methionine 99% Purity',
    Category: 'Amino_Acids',
    Unit: 'kg',
    PIC_ID: 'PIC-01',
    ReplacementMaterialID: null,
    SafetyStockDays: 21,
    UnitPriceUSD: 2.85,
    Status: 'Active',
    SpecDescription: 'Độ tinh khiết >= 99.0%, dạng tinh thể trắng min, tan tốt trong Premix'
  },
  {
    MaterialID: 'MAT-02',
    MaterialCode: '2580002',
    Name_VN: 'L-Lysine HCl 98.5% (Feed Grade)',
    Name_EN: 'L-Lysine Hydrochloride 98.5%',
    Category: 'Amino_Acids',
    Unit: 'kg',
    PIC_ID: 'PIC-01',
    ReplacementMaterialID: null,
    SafetyStockDays: 25,
    UnitPriceUSD: 1.65,
    Status: 'Active',
    SpecDescription: 'Dạng bột hoặc hạt màu nâu nhạt, hoạt chất Lysine tinh khiết >= 78.8%'
  },
  {
    MaterialID: 'MAT-03',
    MaterialCode: '2580003',
    Name_VN: 'L-Threonine 98.5% Min',
    Name_EN: 'L-Threonine 98.5% Feed Grade',
    Category: 'Amino_Acids',
    Unit: 'kg',
    PIC_ID: 'PIC-01',
    ReplacementMaterialID: null,
    SafetyStockDays: 21,
    UnitPriceUSD: 1.95,
    Status: 'Active',
    SpecDescription: 'Amino acid thiết yếu cho tăng trưởng gia cầm & heo con'
  },
  {
    MaterialID: 'MAT-04',
    MaterialCode: '2580004',
    Name_VN: 'Choline Chloride 60% Corn Cob Carrier',
    Name_EN: 'Choline Chloride 60% on Corn Cob',
    Category: 'Vitamins',
    Unit: 'kg',
    PIC_ID: 'PIC-01',
    ReplacementMaterialID: null,
    SafetyStockDays: 18,
    UnitPriceUSD: 0.88,
    Status: 'Active',
    SpecDescription: 'Chống ẩm tốt, chất mang bắp lõi bắp nghiền đồng nhất'
  },
  {
    MaterialID: 'MAT-05',
    MaterialCode: '2580005',
    Name_VN: 'Vitamin AD3E 500/100/100 Micro-encapsulated (Cũ)',
    Name_EN: 'Vitamin AD3E Premix Standard (Old Code)',
    Category: 'Vitamins',
    Unit: 'kg',
    PIC_ID: 'PIC-02',
    ReplacementMaterialID: 'MAT-06', // Planned substitution to MAT-06
    SafetyStockDays: 14,
    UnitPriceUSD: 14.20,
    Status: 'Stop_Usage',
    SpecDescription: 'Mã công thức cũ đang xả tồn, thay thế hoàn toàn bằng mã 2580006'
  },
  {
    MaterialID: 'MAT-06',
    MaterialCode: '2580006',
    Name_VN: 'Vitamin AD3E Plus Bio-Stab 500/100/120 (Mới)',
    Name_EN: 'Vitamin AD3E Plus Bio-Stab (Replacement)',
    Category: 'Vitamins',
    Unit: 'kg',
    PIC_ID: 'PIC-02',
    ReplacementMaterialID: null,
    SafetyStockDays: 21,
    UnitPriceUSD: 15.10,
    Status: 'Active',
    SpecDescription: 'Bọc vi nang thế hệ mới chống oxy hóa cao, chịu nhiệt ép viên 95°C'
  },
  {
    MaterialID: 'MAT-07',
    MaterialCode: '2580007',
    Name_VN: 'Vitamin C Phosphate 35% Stable (Aqua & Piglet)',
    Name_EN: 'L-Ascorbyl-2-Phosphate 35% Stable',
    Category: 'Vitamins',
    Unit: 'kg',
    PIC_ID: 'PIC-02',
    ReplacementMaterialID: null,
    SafetyStockDays: 28,
    UnitPriceUSD: 6.70,
    Status: 'Active',
    SpecDescription: 'Vitamin C photphat hóa chống phân hủy trong nước và nhiệt độ'
  },
  {
    MaterialID: 'MAT-08',
    MaterialCode: '2580008',
    Name_VN: 'Phytase 5,000 FTU/g Thermostable (Enzyme)',
    Name_EN: '6-Phytase 5000 FTU/g Granulate',
    Category: 'Enzymes',
    Unit: 'kg',
    PIC_ID: 'PIC-02',
    ReplacementMaterialID: null,
    SafetyStockDays: 21,
    UnitPriceUSD: 4.80,
    Status: 'Active',
    SpecDescription: 'Giải phóng Photpho hữu cơ từ Phytate, giảm chi phí MCP/DCP'
  },
  {
    MaterialID: 'MAT-09',
    MaterialCode: '2580009',
    Name_VN: 'Monocalcium Phosphate 22% P (MCP)',
    Name_EN: 'Monocalcium Phosphate 22% P Feed Grade',
    Category: 'Carriers_Minerals',
    Unit: 'kg',
    PIC_ID: 'PIC-03',
    ReplacementMaterialID: null,
    SafetyStockDays: 14,
    UnitPriceUSD: 0.72,
    Status: 'Active',
    SpecDescription: 'Khoáng vi lượng P tiêu hóa cao 85%+'
  },
  {
    MaterialID: 'MAT-10',
    MaterialCode: '2580010',
    Name_VN: 'Zinc Oxide 75% Micro-pellet (Kẽm Oxit)',
    Name_EN: 'Zinc Oxide 75% Purity Feed Grade',
    Category: 'Trace_Minerals',
    Unit: 'kg',
    PIC_ID: 'PIC-03',
    ReplacementMaterialID: null,
    SafetyStockDays: 20,
    UnitPriceUSD: 2.10,
    Status: 'Active',
    SpecDescription: 'Đặc trị tiêu chảy heo con và bổ sung khoáng kẽm'
  },
  {
    MaterialID: 'MAT-11',
    MaterialCode: '2580011',
    Name_VN: 'Copper Sulfate Pentahydrate 25% Cu',
    Name_EN: 'Copper Sulfate 25% Cu Crystals',
    Category: 'Trace_Minerals',
    Unit: 'kg',
    PIC_ID: 'PIC-03',
    ReplacementMaterialID: null,
    SafetyStockDays: 20,
    UnitPriceUSD: 2.45,
    Status: 'Active',
    SpecDescription: 'Kích thích tăng trọng và kháng khuẩn tự nhiên'
  },
  {
    MaterialID: 'MAT-12',
    MaterialCode: '2580012',
    Name_VN: 'Toxin Binder Beta-Glucan + Yeast Cell Wall',
    Name_EN: 'Mycotoxin Binder Multi-Action',
    Category: 'Toxin_Binders',
    Unit: 'kg',
    PIC_ID: 'PIC-02',
    ReplacementMaterialID: null,
    SafetyStockDays: 25,
    UnitPriceUSD: 3.40,
    Status: 'Active',
    SpecDescription: 'Hấp phụ Aflatoxin, Ochratoxin, Zearalenone trong bắp cám'
  },
  {
    MaterialID: 'MAT-13',
    MaterialCode: '2580013',
    Name_VN: 'L-Tryptophan 98% Min Feed Grade',
    Name_EN: 'L-Tryptophan 98% Pure',
    Category: 'Amino_Acids',
    Unit: 'kg',
    PIC_ID: 'PIC-01',
    ReplacementMaterialID: null,
    SafetyStockDays: 30,
    UnitPriceUSD: 11.50,
    Status: 'Active',
    SpecDescription: 'Amino acid thiết yếu giảm stress và kích thích thèm ăn'
  },
  {
    MaterialID: 'MAT-14',
    MaterialCode: '2580014',
    Name_VN: 'Organic Selenium Yeast 2000 ppm',
    Name_EN: 'Organic Selenium Yeast 0.2%',
    Category: 'Trace_Minerals',
    Unit: 'kg',
    PIC_ID: 'PIC-02',
    ReplacementMaterialID: null,
    SafetyStockDays: 35,
    UnitPriceUSD: 8.90,
    Status: 'Active',
    SpecDescription: 'Selen hữu cơ tăng cường miễn dịch và chất lượng quầy thịt'
  },
  {
    MaterialID: 'MAT-15',
    MaterialCode: '2580015',
    Name_VN: 'Calcium Carbonate Filler / Carrier (CaCO3)',
    Name_EN: 'Calcium Carbonate Feed Carrier 38% Ca',
    Category: 'Carriers_Minerals',
    Unit: 'kg',
    PIC_ID: 'PIC-03',
    ReplacementMaterialID: null,
    SafetyStockDays: 10,
    UnitPriceUSD: 0.12,
    Status: 'Active',
    SpecDescription: 'Chất mang trơ bột đá siêu mịn 250 mesh cho dây chuyền Premix'
  }
];

export const initialForecastHeader: Fact_Forecast_Header = {
  VersionID: 'FC-W29-2026',
  VersionName: 'Forecast W29 2026 (D365 FO Formula Matrix V4)',
  ExportDate: '2026-08-10',
  IsActive: true,
  Note: 'Nhu cầu nguyên liệu dự báo tháng 8-9/2026 cho 8 nhà máy sản xuất thức ăn',
  WorkingDaysInMonth: 28,
};

// Seed Forecast data across factories and materials (in kg/month)
export const initialForecastDetails: Fact_Forecast_Detail[] = [
  // Factory DBD (Bình Dương)
  { ID: 'FCD-001', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-01', ForecastQty: 45000 },
  { ID: 'FCD-002', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-02', ForecastQty: 95000 },
  { ID: 'FCD-003', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-03', ForecastQty: 32000 },
  { ID: 'FCD-004', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-04', ForecastQty: 52000 },
  { ID: 'FCD-005', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-05', ForecastQty: 0 }, // Stop usage
  { ID: 'FCD-006', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-06', ForecastQty: 8500 },
  { ID: 'FCD-007', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-07', ForecastQty: 6200 },
  { ID: 'FCD-008', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-08', ForecastQty: 4200 },
  { ID: 'FCD-009', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-09', ForecastQty: 180000 },
  { ID: 'FCD-010', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBD', MaterialID: 'MAT-10', ForecastQty: 14500 },

  // Factory DDN (Đồng Nai)
  { ID: 'FCD-011', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-01', ForecastQty: 38000 },
  { ID: 'FCD-012', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-02', ForecastQty: 82000 },
  { ID: 'FCD-013', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-03', ForecastQty: 28000 },
  { ID: 'FCD-014', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-04', ForecastQty: 44000 },
  { ID: 'FCD-015', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-05', ForecastQty: 0 },
  { ID: 'FCD-016', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-06', ForecastQty: 7200 },
  { ID: 'FCD-017', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-07', ForecastQty: 4800 },
  { ID: 'FCD-018', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-08', ForecastQty: 3600 },
  { ID: 'FCD-019', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-09', ForecastQty: 150000 },
  { ID: 'FCD-020', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DDN', MaterialID: 'MAT-10', ForecastQty: 12000 },

  // Factory DHY (Hưng Yên)
  { ID: 'FCD-021', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-01', ForecastQty: 34000 },
  { ID: 'FCD-022', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-02', ForecastQty: 74000 },
  { ID: 'FCD-023', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-03', ForecastQty: 24000 },
  { ID: 'FCD-024', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-04', ForecastQty: 38000 },
  { ID: 'FCD-025', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-06', ForecastQty: 6500 },
  { ID: 'FCD-026', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-07', ForecastQty: 3200 },
  { ID: 'FCD-027', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-08', ForecastQty: 3100 },
  { ID: 'FCD-028', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DHY', MaterialID: 'MAT-09', ForecastQty: 130000 },

  // Factory DVL (Vĩnh Long)
  { ID: 'FCD-029', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DVL', MaterialID: 'MAT-01', ForecastQty: 29000 },
  { ID: 'FCD-030', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DVL', MaterialID: 'MAT-02', ForecastQty: 62000 },
  { ID: 'FCD-031', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DVL', MaterialID: 'MAT-07', ForecastQty: 11000 }, // High Vitamin C for Aqua
  { ID: 'FCD-032', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DVL', MaterialID: 'MAT-09', ForecastQty: 120000 },
  { ID: 'FCD-033', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DVL', MaterialID: 'MAT-12', ForecastQty: 9500 },

  // Factory DBN (Bắc Ninh)
  { ID: 'FCD-034', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBN', MaterialID: 'MAT-01', ForecastQty: 26000 },
  { ID: 'FCD-035', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBN', MaterialID: 'MAT-02', ForecastQty: 58000 },
  { ID: 'FCD-036', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBN', MaterialID: 'MAT-03', ForecastQty: 19000 },
  { ID: 'FCD-037', VersionID: 'FC-W29-2026', FactoryID: 'FAC-DBN', MaterialID: 'MAT-06', ForecastQty: 4800 },
];

// Current SOH inventory across factories (creating realistic shortages, surpluses, and transitions)
export const initialInventorySOH: Fact_Inventory_SOH[] = [
  // Factory DBD (Bình Dương) - Well stocked in Methionine, surplus in Threonine
  { SOH_ID: 'SOH-001', FactoryID: 'FAC-DBD', MaterialID: 'MAT-01', Quantity: 58000, WarehouseLocation: 'KHO-PREMIX-A1', BatchNumber: 'LOT-MET-2607', ExpiryDate: '2027-06-30', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-002', FactoryID: 'FAC-DBD', MaterialID: 'MAT-02', Quantity: 110000, WarehouseLocation: 'KHO-AMINO-B2', BatchNumber: 'LOT-LYS-2608', ExpiryDate: '2027-08-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-003', FactoryID: 'FAC-DBD', MaterialID: 'MAT-03', Quantity: 54000, WarehouseLocation: 'KHO-AMINO-B3', BatchNumber: 'LOT-THR-2605', ExpiryDate: '2027-05-20', UpdateDate: '2026-08-15' }, // SURPLUS DOI ~ 47 days!
  { SOH_ID: 'SOH-004', FactoryID: 'FAC-DBD', MaterialID: 'MAT-04', Quantity: 42000, WarehouseLocation: 'KHO-VIT-C1', BatchNumber: 'LOT-CHO-2607', ExpiryDate: '2027-01-10', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-005', FactoryID: 'FAC-DBD', MaterialID: 'MAT-05', Quantity: 1200, WarehouseLocation: 'KHO-VIT-C2', BatchNumber: 'LOT-AD3E-OLD', ExpiryDate: '2026-10-30', UpdateDate: '2026-08-15' }, // Depleting stop usage
  { SOH_ID: 'SOH-006', FactoryID: 'FAC-DBD', MaterialID: 'MAT-06', Quantity: 9800, WarehouseLocation: 'KHO-VIT-C3', BatchNumber: 'LOT-AD3E-NEW', ExpiryDate: '2028-02-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-007', FactoryID: 'FAC-DBD', MaterialID: 'MAT-07', Quantity: 7500, WarehouseLocation: 'KHO-VIT-C4', BatchNumber: 'LOT-VITC-2606', ExpiryDate: '2027-11-20', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-008', FactoryID: 'FAC-DBD', MaterialID: 'MAT-08', Quantity: 5100, WarehouseLocation: 'KHO-ENZ-D1', BatchNumber: 'LOT-PHY-2604', ExpiryDate: '2027-04-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-009', FactoryID: 'FAC-DBD', MaterialID: 'MAT-09', Quantity: 92000, WarehouseLocation: 'SILO-MCP-01', BatchNumber: 'LOT-MCP-2608', ExpiryDate: '2028-08-01', UpdateDate: '2026-08-15' }, // CRITICAL SHORTAGE in MCP! DOI ~ 14.3d
  { SOH_ID: 'SOH-010', FactoryID: 'FAC-DBD', MaterialID: 'MAT-10', Quantity: 18500, WarehouseLocation: 'KHO-MIN-E1', BatchNumber: 'LOT-ZNO-2606', ExpiryDate: '2028-05-15', UpdateDate: '2026-08-15' },

  // Factory DDN (Đồng Nai) - CRITICAL SHORTAGE in Threonine and Phytase!
  { SOH_ID: 'SOH-011', FactoryID: 'FAC-DDN', MaterialID: 'MAT-01', Quantity: 32000, WarehouseLocation: 'KHO-DN-01', BatchNumber: 'LOT-MET-2608', ExpiryDate: '2027-07-20', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-012', FactoryID: 'FAC-DDN', MaterialID: 'MAT-02', Quantity: 68000, WarehouseLocation: 'KHO-DN-02', BatchNumber: 'LOT-LYS-2607', ExpiryDate: '2027-06-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-013', FactoryID: 'FAC-DDN', MaterialID: 'MAT-03', Quantity: 4200, WarehouseLocation: 'KHO-DN-03', BatchNumber: 'LOT-THR-2608', ExpiryDate: '2027-08-01', UpdateDate: '2026-08-15' }, // CRITICAL! Usage = 1000kg/day -> DOI = 4.2 days!
  { SOH_ID: 'SOH-014', FactoryID: 'FAC-DDN', MaterialID: 'MAT-04', Quantity: 36000, WarehouseLocation: 'KHO-DN-04', BatchNumber: 'LOT-CHO-2606', ExpiryDate: '2027-03-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-015', FactoryID: 'FAC-DDN', MaterialID: 'MAT-06', Quantity: 6200, WarehouseLocation: 'KHO-DN-05', BatchNumber: 'LOT-AD3E-NEW', ExpiryDate: '2028-01-20', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-016', FactoryID: 'FAC-DDN', MaterialID: 'MAT-08', Quantity: 650, WarehouseLocation: 'KHO-DN-06', BatchNumber: 'LOT-PHY-2607', ExpiryDate: '2027-07-10', UpdateDate: '2026-08-15' }, // CRITICAL! DOI = 5.0 days!
  { SOH_ID: 'SOH-017', FactoryID: 'FAC-DDN', MaterialID: 'MAT-09', Quantity: 185000, WarehouseLocation: 'SILO-DN-01', BatchNumber: 'LOT-MCP-2607', ExpiryDate: '2028-07-15', UpdateDate: '2026-08-15' }, // SURPLUS in MCP! DOI = 34.5d

  // Factory DHY (Hưng Yên) - Balanced stock
  { SOH_ID: 'SOH-018', FactoryID: 'FAC-DHY', MaterialID: 'MAT-01', Quantity: 28000, WarehouseLocation: 'KHO-HY-01', BatchNumber: 'LOT-MET-2607', ExpiryDate: '2027-06-25', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-019', FactoryID: 'FAC-DHY', MaterialID: 'MAT-02', Quantity: 65000, WarehouseLocation: 'KHO-HY-02', BatchNumber: 'LOT-LYS-2607', ExpiryDate: '2027-07-10', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-020', FactoryID: 'FAC-DHY', MaterialID: 'MAT-03', Quantity: 18000, WarehouseLocation: 'KHO-HY-03', BatchNumber: 'LOT-THR-2606', ExpiryDate: '2027-05-30', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-021', FactoryID: 'FAC-DHY', MaterialID: 'MAT-06', Quantity: 4900, WarehouseLocation: 'KHO-HY-04', BatchNumber: 'LOT-AD3E-NEW', ExpiryDate: '2028-02-10', UpdateDate: '2026-08-15' },

  // Factory DVL (Vĩnh Long) - Shortage in Vitamin C
  { SOH_ID: 'SOH-022', FactoryID: 'FAC-DVL', MaterialID: 'MAT-01', Quantity: 24000, WarehouseLocation: 'KHO-VL-01', BatchNumber: 'LOT-MET-2608', ExpiryDate: '2027-08-01', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-023', FactoryID: 'FAC-DVL', MaterialID: 'MAT-02', Quantity: 55000, WarehouseLocation: 'KHO-VL-02', BatchNumber: 'LOT-LYS-2608', ExpiryDate: '2027-08-10', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-024', FactoryID: 'FAC-DVL', MaterialID: 'MAT-07', Quantity: 2200, WarehouseLocation: 'KHO-VL-03', BatchNumber: 'LOT-VITC-2607', ExpiryDate: '2027-07-15', UpdateDate: '2026-08-15' }, // Shortage! Usage 392kg/d -> DOI = 5.6d
  { SOH_ID: 'SOH-025', FactoryID: 'FAC-DVL', MaterialID: 'MAT-09', Quantity: 96000, WarehouseLocation: 'SILO-VL-01', BatchNumber: 'LOT-MCP-2607', ExpiryDate: '2028-07-20', UpdateDate: '2026-08-15' },

  // Factory DBN (Bắc Ninh)
  { SOH_ID: 'SOH-026', FactoryID: 'FAC-DBN', MaterialID: 'MAT-01', Quantity: 21000, WarehouseLocation: 'KHO-BN-01', BatchNumber: 'LOT-MET-2607', ExpiryDate: '2027-06-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-027', FactoryID: 'FAC-DBN', MaterialID: 'MAT-02', Quantity: 49000, WarehouseLocation: 'KHO-BN-02', BatchNumber: 'LOT-LYS-2606', ExpiryDate: '2027-06-20', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-028', FactoryID: 'FAC-DBN', MaterialID: 'MAT-03', Quantity: 15500, WarehouseLocation: 'KHO-BN-03', BatchNumber: 'LOT-THR-2607', ExpiryDate: '2027-07-15', UpdateDate: '2026-08-15' },
];

export const initialPurchaseOrders: Fact_PurchaseOrder[] = [
  { POID: 'PO-2026-0801', PONumber: 'PO-D365-88901', SupplierID: 'SUP-01', OrderDate: '2026-08-02', Status: 'Shipped', TotalAmountUSD: 285000 },
  { POID: 'PO-2026-0802', PONumber: 'PO-D365-88902', SupplierID: 'SUP-04', OrderDate: '2026-08-05', Status: 'Partially_Received', TotalAmountUSD: 165000 },
  { POID: 'PO-2026-0803', PONumber: 'PO-D365-88903', SupplierID: 'SUP-02', OrderDate: '2026-08-08', Status: 'Confirmed', TotalAmountUSD: 151000 },
  { POID: 'PO-2026-0804', PONumber: 'PO-D365-88904', SupplierID: 'SUP-03', OrderDate: '2026-08-10', Status: 'Confirmed', TotalAmountUSD: 98000 },
  { POID: 'PO-2026-0805', PONumber: 'PO-D365-88905', SupplierID: 'SUP-06', OrderDate: '2026-08-12', Status: 'Shipped', TotalAmountUSD: 68000 },
];

export const initialPODetails: Fact_PO_Detail[] = [
  { PODetailID: 'POD-01', POID: 'PO-2026-0801', FactoryID: 'FAC-DBD', MaterialID: 'MAT-01', OrderQty: 40000, ReceivedQty: 0, RemainQty: 40000, UnitPriceUSD: 2.85 },
  { PODetailID: 'POD-02', POID: 'PO-2026-0801', FactoryID: 'FAC-DDN', MaterialID: 'MAT-01', OrderQty: 30000, ReceivedQty: 0, RemainQty: 30000, UnitPriceUSD: 2.85 },
  { PODetailID: 'POD-03', POID: 'PO-2026-0802', FactoryID: 'FAC-DBD', MaterialID: 'MAT-02', OrderQty: 60000, ReceivedQty: 30000, RemainQty: 30000, UnitPriceUSD: 1.65 },
  { PODetailID: 'POD-04', POID: 'PO-2026-0802', FactoryID: 'FAC-DDN', MaterialID: 'MAT-02', OrderQty: 40000, ReceivedQty: 20000, RemainQty: 20000, UnitPriceUSD: 1.65 },
  { PODetailID: 'POD-05', POID: 'PO-2026-0803', FactoryID: 'FAC-DDN', MaterialID: 'MAT-03', OrderQty: 20000, ReceivedQty: 0, RemainQty: 20000, UnitPriceUSD: 1.95 },
  { PODetailID: 'POD-06', POID: 'PO-2026-0803', FactoryID: 'FAC-DBD', MaterialID: 'MAT-06', OrderQty: 10000, ReceivedQty: 0, RemainQty: 10000, UnitPriceUSD: 15.10 },
  { PODetailID: 'POD-07', POID: 'PO-2026-0804', FactoryID: 'FAC-DDN', MaterialID: 'MAT-08', OrderQty: 5000, ReceivedQty: 0, RemainQty: 5000, UnitPriceUSD: 4.80 },
  { PODetailID: 'POD-08', POID: 'PO-2026-0805', FactoryID: 'FAC-DVL', MaterialID: 'MAT-07', OrderQty: 8000, ReceivedQty: 0, RemainQty: 8000, UnitPriceUSD: 6.70 },
  { PODetailID: 'POD-09', POID: 'PO-2026-0805', FactoryID: 'FAC-DBD', MaterialID: 'MAT-09', OrderQty: 100000, ReceivedQty: 0, RemainQty: 100000, UnitPriceUSD: 0.72 },
];

export const initialInboundSchedules: Fact_Inbound_Schedule[] = [
  {
    ScheduleID: 'INB-001',
    PODetailID: 'POD-05', // L-Threonine for DDN (Critical shortage item)
    ExpectedDate: '2026-08-17', // Arriving in 2 days!
    PlannedQty: 10000,
    TruckPlate: '51D-894.22',
    DriverName: 'Võ Minh Tuấn',
    DriverPhone: '0908 456 789',
    Status: 'In_Transit',
    ContainerNo: 'CMAU-8874120',
    PortOfDischarge: 'Cảng Cát Lái - TP.HCM'
  },
  {
    ScheduleID: 'INB-002',
    PODetailID: 'POD-07', // Phytase for DDN
    ExpectedDate: '2026-08-18',
    PlannedQty: 5000,
    TruckPlate: '60C-672.15',
    DriverName: 'Nguyễn Văn Đạt',
    DriverPhone: '0933 221 100',
    Status: 'In_Transit',
    ContainerNo: 'MSKU-4521098',
    PortOfDischarge: 'Cảng Tân Cảng Cái Mép'
  },
  {
    ScheduleID: 'INB-003',
    PODetailID: 'POD-08', // Vitamin C for DVL
    ExpectedDate: '2026-08-19',
    PlannedQty: 8000,
    TruckPlate: '64C-112.89',
    DriverName: 'Lê Tấn Phát',
    DriverPhone: '0917 889 001',
    Status: 'Scheduled',
    ContainerNo: 'HLBU-9023411',
    PortOfDischarge: 'Cảng Tân Cảng Cát Lái'
  },
  {
    ScheduleID: 'INB-004',
    PODetailID: 'POD-09', // MCP for DBD
    ExpectedDate: '2026-08-20',
    PlannedQty: 50000,
    TruckPlate: '61C-445.88',
    DriverName: 'Trịnh Quốc Hùng',
    DriverPhone: '0982 334 455',
    Status: 'Scheduled',
    ContainerNo: 'TGHU-3419082',
    PortOfDischarge: 'Cảng SP-SSA Quốc tế Cái Mép'
  }
];

// Production consumption logs to calculate MTD
export const initialProductionUsages: Fact_Production_Usage[] = [
  { UsageID: 'USG-001', FactoryID: 'FAC-DBD', MaterialID: 'MAT-01', ActualQty: 24500, LogDate: '2026-08-14', RecipeCode: 'BOM-PIGLET-4%' },
  { UsageID: 'USG-002', FactoryID: 'FAC-DBD', MaterialID: 'MAT-02', ActualQty: 51200, LogDate: '2026-08-14', RecipeCode: 'BOM-BROILER-2.5%' },
  { UsageID: 'USG-003', FactoryID: 'FAC-DBD', MaterialID: 'MAT-03', ActualQty: 16800, LogDate: '2026-08-14', RecipeCode: 'BOM-SWINE-1%' },
  { UsageID: 'USG-004', FactoryID: 'FAC-DBD', MaterialID: 'MAT-06', ActualQty: 4600, LogDate: '2026-08-14', RecipeCode: 'BOM-PIGLET-4%' },
  { UsageID: 'USG-005', FactoryID: 'FAC-DDN', MaterialID: 'MAT-01', ActualQty: 21000, LogDate: '2026-08-14', RecipeCode: 'BOM-BROILER-2.5%' },
  { UsageID: 'USG-006', FactoryID: 'FAC-DDN', MaterialID: 'MAT-02', ActualQty: 44000, LogDate: '2026-08-14', RecipeCode: 'BOM-SWINE-1%' },
  { UsageID: 'USG-007', FactoryID: 'FAC-DDN', MaterialID: 'MAT-03', ActualQty: 15200, LogDate: '2026-08-14', RecipeCode: 'BOM-PIGLET-4%' },
];

// Dynamic Mapping Dictionary for D365 FO & ERP Excel import
export const initialImportMappings: Sys_Import_Mapping[] = [
  // Forecast Mappings
  { MappingID: 'MAP-01', ImportType: 'Forecast', ExcelHeaderName: 'Site', SystemFieldName: 'FactoryCode', Description: 'Mã nhà máy / Chi nhánh D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-02', ImportType: 'Forecast', ExcelHeaderName: 'NM', SystemFieldName: 'FactoryCode', Description: 'Tên viết tắt nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-03', ImportType: 'Forecast', ExcelHeaderName: 'PlantCode', SystemFieldName: 'FactoryCode', Description: 'D365 Plant ID (e.g. 043, 0432)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-04', ImportType: 'Forecast', ExcelHeaderName: 'Item Number', SystemFieldName: 'MaterialCode', Description: 'Mã nguyên vật liệu D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-05', ImportType: 'Forecast', ExcelHeaderName: 'Mã Hàng', SystemFieldName: 'MaterialCode', Description: 'Mã hàng vật tư', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-06', ImportType: 'Forecast', ExcelHeaderName: 'ItemId', SystemFieldName: 'MaterialCode', Description: 'Item ID ERP', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-07', ImportType: 'Forecast', ExcelHeaderName: 'Forecast Qty', SystemFieldName: 'ForecastQty', Description: 'Nhu cầu dự báo tháng (kg)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-08', ImportType: 'Forecast', ExcelHeaderName: 'Monthly Usage', SystemFieldName: 'ForecastQty', Description: 'Nhu cầu sử dụng tháng', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-09', ImportType: 'Forecast', ExcelHeaderName: 'Nhu Cầu Tháng', SystemFieldName: 'ForecastQty', Description: 'Sản lượng dự báo kg', CreatedAt: '2026-08-01' },

  // SOH Mappings
  { MappingID: 'MAP-10', ImportType: 'SOH', ExcelHeaderName: 'InventLocationId', SystemFieldName: 'FactoryCode', Description: 'Kho D365 tương ứng nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-11', ImportType: 'SOH', ExcelHeaderName: 'Nhà Máy', SystemFieldName: 'FactoryCode', Description: 'Tên nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-12', ImportType: 'SOH', ExcelHeaderName: 'AvailPhysical', SystemFieldName: 'Quantity', Description: 'Tồn kho khả dụng thực tế (kg)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-13', ImportType: 'SOH', ExcelHeaderName: 'SOH', SystemFieldName: 'Quantity', Description: 'Stock on hand', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-14', ImportType: 'SOH', ExcelHeaderName: 'Tồn Kho (Kg)', SystemFieldName: 'Quantity', Description: 'Khối lượng tồn kho', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-15', ImportType: 'SOH', ExcelHeaderName: 'Physical Inventory', SystemFieldName: 'Quantity', Description: 'Kiểm kê vật lý', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-16', ImportType: 'SOH', ExcelHeaderName: 'Batch', SystemFieldName: 'BatchNumber', Description: 'Số lô sản xuất', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-17', ImportType: 'SOH', ExcelHeaderName: 'Expiry', SystemFieldName: 'ExpiryDate', Description: 'Hạn dùng nguyên liệu', CreatedAt: '2026-08-01' },

  // Consumption / Usage Mappings
  { MappingID: 'MAP-18', ImportType: 'Usage', ExcelHeaderName: 'Actual Consumption', SystemFieldName: 'ActualQty', Description: 'Số lượng thực xuất sản xuất', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-19', ImportType: 'Usage', ExcelHeaderName: 'Thực Xuất (Kg)', SystemFieldName: 'ActualQty', Description: 'Tiêu hao thực tế', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-20', ImportType: 'Usage', ExcelHeaderName: 'TransDate', SystemFieldName: 'LogDate', Description: 'Ngày giao dịch', CreatedAt: '2026-08-01' },
];

// Premix Formulas / Feed BOM Master
export const initialFormulas: Formula_BOM[] = [
  {
    FormulaID: 'BOM-PIGLET-4%',
    FormulaCode: 'PRM-PIG-401',
    FormulaName: 'Premix Heo Con Siêu Đậm Đặc 4% (Piglet Starter Premix)',
    TargetSpecies: 'Heo con (Piglet)',
    PremixInclusionRateInFeed: 4.0, // 40kg premix per 1000kg finished feed
    StandardBatchSizeKg: 1000,
    EffectiveDate: '2026-07-01',
    Status: 'Active',
    Items: [
      { MaterialID: 'MAT-02', QtyKgPerTonPremix: 280, InclusionPercent: 28.0 }, // L-Lysine
      { MaterialID: 'MAT-01', QtyKgPerTonPremix: 150, InclusionPercent: 15.0 }, // DL-Methionine
      { MaterialID: 'MAT-03', QtyKgPerTonPremix: 110, InclusionPercent: 11.0 }, // L-Threonine
      { MaterialID: 'MAT-13', QtyKgPerTonPremix: 25, InclusionPercent: 2.5 },  // L-Tryptophan
      { MaterialID: 'MAT-04', QtyKgPerTonPremix: 80, InclusionPercent: 8.0 },  // Choline Chloride
      { MaterialID: 'MAT-06', QtyKgPerTonPremix: 35, InclusionPercent: 3.5 },  // Vitamin AD3E New
      { MaterialID: 'MAT-07', QtyKgPerTonPremix: 20, InclusionPercent: 2.0 },  // Vitamin C
      { MaterialID: 'MAT-08', QtyKgPerTonPremix: 15, InclusionPercent: 1.5 },  // Phytase
      { MaterialID: 'MAT-10', QtyKgPerTonPremix: 65, InclusionPercent: 6.5 },  // Zinc Oxide 75%
      { MaterialID: 'MAT-12', QtyKgPerTonPremix: 40, InclusionPercent: 4.0 },  // Toxin Binder
      { MaterialID: 'MAT-15', QtyKgPerTonPremix: 180, InclusionPercent: 18.0 }, // Carrier CaCO3
    ]
  },
  {
    FormulaID: 'BOM-BROILER-2.5%',
    FormulaCode: 'PRM-BRO-251',
    FormulaName: 'Premix Gà Thịt Xuất Chuồng 2.5% (Broiler Finisher Premix)',
    TargetSpecies: 'Gà thịt (Broiler)',
    PremixInclusionRateInFeed: 2.5, // 25kg premix per 1000kg finished feed
    StandardBatchSizeKg: 1000,
    EffectiveDate: '2026-06-15',
    Status: 'Active',
    Items: [
      { MaterialID: 'MAT-01', QtyKgPerTonPremix: 310, InclusionPercent: 31.0 }, // DL-Methionine
      { MaterialID: 'MAT-02', QtyKgPerTonPremix: 240, InclusionPercent: 24.0 }, // L-Lysine
      { MaterialID: 'MAT-03', QtyKgPerTonPremix: 95, InclusionPercent: 9.5 },   // L-Threonine
      { MaterialID: 'MAT-04', QtyKgPerTonPremix: 110, InclusionPercent: 11.0 }, // Choline Chloride
      { MaterialID: 'MAT-06', QtyKgPerTonPremix: 25, InclusionPercent: 2.5 },  // Vitamin AD3E
      { MaterialID: 'MAT-08', QtyKgPerTonPremix: 20, InclusionPercent: 2.0 },  // Phytase
      { MaterialID: 'MAT-11', QtyKgPerTonPremix: 15, InclusionPercent: 1.5 },  // Copper Sulfate
      { MaterialID: 'MAT-14', QtyKgPerTonPremix: 5, InclusionPercent: 0.5 },   // Organic Selenium
      { MaterialID: 'MAT-15', QtyKgPerTonPremix: 180, InclusionPercent: 18.0 }, // Carrier
    ]
  },
  {
    FormulaID: 'BOM-SWINE-1%',
    FormulaCode: 'PRM-SWN-101',
    FormulaName: 'Premix Heo Thịt Tăng Trọng 1% (Swine Grower Premix)',
    TargetSpecies: 'Heo thịt (Swine)',
    PremixInclusionRateInFeed: 1.0, // 10kg premix per 1000kg finished feed
    StandardBatchSizeKg: 1000,
    EffectiveDate: '2026-07-20',
    Status: 'Active',
    Items: [
      { MaterialID: 'MAT-02', QtyKgPerTonPremix: 380, InclusionPercent: 38.0 }, // L-Lysine
      { MaterialID: 'MAT-03', QtyKgPerTonPremix: 140, InclusionPercent: 14.0 }, // L-Threonine
      { MaterialID: 'MAT-01', QtyKgPerTonPremix: 80, InclusionPercent: 8.0 },   // DL-Methionine
      { MaterialID: 'MAT-04', QtyKgPerTonPremix: 90, InclusionPercent: 9.0 },   // Choline Chloride
      { MaterialID: 'MAT-06', QtyKgPerTonPremix: 20, InclusionPercent: 2.0 },  // Vitamin AD3E
      { MaterialID: 'MAT-08', QtyKgPerTonPremix: 20, InclusionPercent: 2.0 },  // Phytase
      { MaterialID: 'MAT-15', QtyKgPerTonPremix: 270, InclusionPercent: 27.0 }, // Carrier
    ]
  },
  {
    FormulaID: 'BOM-AQUA-0.5%',
    FormulaCode: 'PRM-AQU-051',
    FormulaName: 'Premix Cá Tra & Rô Phi Kháng Bệnh 0.5% (Aquaculture Premix)',
    TargetSpecies: 'Cá tra (Pangasius)',
    PremixInclusionRateInFeed: 0.5,
    StandardBatchSizeKg: 1000,
    EffectiveDate: '2026-08-01',
    Status: 'Active',
    Items: [
      { MaterialID: 'MAT-07', QtyKgPerTonPremix: 250, InclusionPercent: 25.0 }, // Vitamin C 35%
      { MaterialID: 'MAT-04', QtyKgPerTonPremix: 180, InclusionPercent: 18.0 }, // Choline Chloride
      { MaterialID: 'MAT-01', QtyKgPerTonPremix: 120, InclusionPercent: 12.0 }, // DL-Methionine
      { MaterialID: 'MAT-12', QtyKgPerTonPremix: 90, InclusionPercent: 9.0 },   // Toxin Binder
      { MaterialID: 'MAT-14', QtyKgPerTonPremix: 10, InclusionPercent: 1.0 },   // Organic Selenium
      { MaterialID: 'MAT-06', QtyKgPerTonPremix: 30, InclusionPercent: 3.0 },   // Vitamin AD3E
      { MaterialID: 'MAT-15', QtyKgPerTonPremix: 320, InclusionPercent: 32.0 }, // Carrier
    ]
  }
];

// Aliases for convenient importing
export const mockFactories = initialFactories;
export const mockMaterials = initialMaterials;
export const mockSuppliers = initialSuppliers;
export const mockPICs = initialPICs;
export const mockRegions = initialRegions;
export const mockForecastHeaders = [initialForecastHeader];
export const mockForecastDetails = initialForecastDetails;
export const mockInventorySOH = initialInventorySOH;
export const mockProductionUsages = initialProductionUsages;
export const mockUsageLogs = initialProductionUsages;
export const mockPOHeaders = initialPurchaseOrders;
export const mockPurchaseOrders = initialPurchaseOrders;
export const mockPODetails = initialPODetails;
export const mockInboundSchedules = initialInboundSchedules;
export const mockFormulas = initialFormulas;
export const mockInitialMappings = initialImportMappings;
