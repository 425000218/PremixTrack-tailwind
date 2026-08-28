import {
  Fact_PurchaseOrder,
  Fact_PO_Detail,
  Fact_Inbound_Schedule,
} from '../types';

export const initialPurchaseOrders: Fact_PurchaseOrder[] = [
  { POID: 'PO-2026-0801', PONumber: 'PO-D365-88901', SupplierID: 'SUP-01', OrderDate: '2026-08-02', Status: 'Shipped', TotalAmountUSD: 285000 },
  { POID: 'PO-2026-0802', PONumber: 'PO-D365-88902', SupplierID: 'SUP-04', OrderDate: '2026-08-05', Status: 'Partially_Received', TotalAmountUSD: 165000 },
  { POID: 'PO-2026-0803', PONumber: 'PO-D365-88903', SupplierID: 'SUP-02', OrderDate: '2026-08-08', Status: 'Confirmed', TotalAmountUSD: 151000 },
  { POID: 'PO-2026-0804', PONumber: 'PO-D365-88904', SupplierID: 'SUP-03', OrderDate: '2026-08-10', Status: 'Confirmed', TotalAmountUSD: 98000 },
  { POID: 'PO-2026-0805', PONumber: 'PO-D365-88905', SupplierID: 'SUP-06', OrderDate: '2026-08-12', Status: 'Shipped', TotalAmountUSD: 68000 },
];


export const initialPODetails: Fact_PO_Detail[] = [
  // ── D365 FO Inbound Pending POs (Cut-off 06h 250826) ─────────────────────
  { PODetailID: 'POD-0010895', POID: 'DHV/PAG/00010895', FactoryID: 'FAC-DBD', MaterialID: 'MAT-3601010', MaterialCode: '3601010', MaterialName: 'Canthaxanthin 10%', OrderQty: 10000, ReceivedQty: 8000, RemainQty: 2000, UnitPriceVND: 652080, LineAmountVND: 6520800000, AmountRemainderVND: 1304160000, DeliveryDate: '2026-04-20', PAGNumber: 'DHV/PAG/00010895', LineStatus: 'Effective', Incoterm: 'DDP', CountryOfOrigin: 'China', Notes: '10mt-24.7$ Giao tháng 7 và 8', SupplierName: 'Công Ty TNHH Venamti' },
  { PODetailID: 'POD-0012177', POID: 'DHV/PAG/00012177', FactoryID: 'FAC-DBD', MaterialID: 'MAT-6101603', MaterialCode: '6101603', MaterialName: 'CASSAVA BY-PRODUCT F>20%', OrderQty: 500000, ReceivedQty: 0, RemainQty: 500000, UnitPriceVND: 5200, LineAmountVND: 2600000000, AmountRemainderVND: 2600000000, DeliveryDate: '2026-09-01', PAGNumber: 'DHV/PAG/00012177', LineStatus: 'On hold', Incoterm: 'DDP', CountryOfOrigin: 'Việt Nam', Notes: '500mt Bã mì @5200 đ/kg ex DN/BD/LA approved 20/08/2026', SupplierName: 'Công Ty TNHH MTV Nông Sản Ngọc Thùy' },
  { PODetailID: 'POD-0012203', POID: 'DHV/PAG/00012203', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1101018', MaterialCode: '1101018', MaterialName: 'SOYABEANMEAL 48% CP', OrderQty: 1075000, ReceivedQty: 0, RemainQty: 1075000, UnitPriceVND: 11270, LineAmountVND: 12115250000, AmountRemainderVND: 12115250000, DeliveryDate: '2026-08-21', PAGNumber: 'DHV/PAG/00012203', LineStatus: 'On hold', Incoterm: 'EXW', CountryOfOrigin: 'Việt Nam', Notes: '6.00289E+18', SupplierName: 'Công Ty TNHH Kinh Doanh Nông Sản Việt Nam' },
  { PODetailID: 'POD-00019632', POID: 'DBD/PO/000019632', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1002101', MaterialCode: '1002101', MaterialName: 'CORN GLUTENFEED >20%CP', OrderQty: 280000, ReceivedQty: 180410, RemainQty: 99590, UnitPriceVND: 4300, LineAmountVND: 1204000000, AmountRemainderVND: 428237000, DeliveryDate: '2025-08-05', PAGNumber: 'DHV/PAG/00005595', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'China', Notes: 'DHV/PAG/00005595 Delivery time in Aug', SupplierName: 'Công Ty TNHH Phát Triển Linh Long' },
  { PODetailID: 'POD-00019788', POID: 'DBD/PO/000019788', FactoryID: 'FAC-DBD', MaterialID: 'MAT-3955010', MaterialCode: '3955010', MaterialName: 'Tilmicosin 20%', OrderQty: 260, ReceivedQty: 240, RemainQty: 20, UnitPriceVND: 276190, LineAmountVND: 71809400, AmountRemainderVND: 5523800, DeliveryDate: '2025-09-09', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'Việt Nam', Notes: '15/HĐMH-2023 giao tháng 9/2025', SupplierName: 'Công Ty TNHH Nhập Khẩu Và Phân Phối Hoa Lâm' },
  { PODetailID: 'POD-00019968', POID: 'DBD/PO/000019968', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1002101', MaterialCode: '1002101', MaterialName: 'CORN GLUTENFEED >20%CP', OrderQty: 320000, ReceivedQty: 0, RemainQty: 320000, UnitPriceVND: 5030, LineAmountVND: 1609600000, AmountRemainderVND: 1609600000, DeliveryDate: '2025-10-16', PAGNumber: 'DHV/PAG/00007562', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'China', Notes: 'DHV/PAG/00007562', SupplierName: 'Công Ty TNHH Phát Triển Linh Long' },
  { PODetailID: 'POD-00020076', POID: 'DBD/PO/000020076', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1002101', MaterialCode: '1002101', MaterialName: 'CORN GLUTENFEED >20%CP', OrderQty: 111990, ReceivedQty: 0, RemainQty: 111990, UnitPriceVND: 4300, LineAmountVND: 481557000, AmountRemainderVND: 481557000, DeliveryDate: '2025-11-08', PAGNumber: 'DHV/PAG/00005595', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'China', Notes: 'DHV/PAG/00005595 Thay thế DBD/PO/000019632', SupplierName: 'Công Ty TNHH Phát Triển Linh Long' },
  { PODetailID: 'POD-00020270', POID: 'DBD/PO/000020270', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1802027', MaterialCode: '1802027', MaterialName: 'CASSAVE WITH PEEL >67.5%STARCH', OrderQty: 500000, ReceivedQty: 171210, RemainQty: 303790, UnitPriceVND: 4650, LineAmountVND: 2325000000, AmountRemainderVND: 1412623500, DeliveryDate: '2025-12-31', PAGNumber: 'DHV/PAG/00006821', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'Việt Nam', Notes: 'tạm đóng 303790 kg', SupplierName: 'Chi Nhánh Tây Bắc - Tổng Công Ty Lương Thực Miền Bắc' },
  { PODetailID: 'POD-00020378', POID: 'DBD/PO/000020378', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1005100', MaterialCode: '1005100', MaterialName: 'RICE HULLS', OrderQty: 72000, ReceivedQty: 45156, RemainQty: 26844, UnitPriceVND: 4400, LineAmountVND: 316800000, AmountRemainderVND: 118113600, DeliveryDate: '2026-01-03', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'Việt Nam', Notes: '75/HĐMH-2022 BSD 01 giao T2/26', SupplierName: 'Công Ty TNHH Thức Ăn Chăn Nuôi Hương Kim' },
  { PODetailID: 'POD-00020442', POID: 'DBD/PO/000020442', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1802027', MaterialCode: '1802027', MaterialName: 'CASSAVE WITH PEEL >67.5%STARCH', OrderQty: 96500, ReceivedQty: 0, RemainQty: 91500, UnitPriceVND: 4650, LineAmountVND: 448725000, AmountRemainderVND: 425475000, DeliveryDate: '2026-01-31', PAGNumber: 'DHV/PAG/00006821', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'Việt Nam', Notes: 'Thay thế PO DBD/PO/000019586', SupplierName: 'Chi Nhánh Tây Bắc - Tổng Công Ty Lương Thực Miền Bắc' },
  { PODetailID: 'POD-00020574', POID: 'DBD/PO/000020574', FactoryID: 'FAC-DBD', MaterialID: 'MAT-1012500', MaterialCode: '1012500', MaterialName: 'Rice DDGS', OrderQty: 1500, ReceivedQty: 1096, RemainQty: 404, UnitPriceVND: 7500, LineAmountVND: 11250000, AmountRemainderVND: 3030000, DeliveryDate: '2026-02-09', PAGNumber: 'DHV/PAG/00008109', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'India', Notes: 'DHV/PAG/00008109 PK 02', SupplierName: 'Công Ty TNHH XNK Minh Trang SG' },
  { PODetailID: 'POD-00020738', POID: 'DBD/PO/000020738', FactoryID: 'FAC-DBD', MaterialID: 'MAT-6101045', MaterialCode: '6101045', MaterialName: 'Mycocurb Liquid 100%', OrderQty: 34000, ReceivedQty: 19000, RemainQty: 15000, UnitPriceVND: 42000, LineAmountVND: 1428000000, AmountRemainderVND: 630000000, DeliveryDate: '2026-03-19', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'Singapore', Notes: '04/HĐMH-2025 giao từ T3/2026', SupplierName: 'Công Ty TNHH Kemin Industries (Việt Nam)' },
  { PODetailID: 'POD-00020795', POID: 'DBD/PO/000020795', FactoryID: 'FAC-DBD', MaterialID: 'MAT-3201011', MaterialCode: '3201011', MaterialName: 'L-LYSINE SULPHATE 70%', OrderQty: 120000, ReceivedQty: 59150, RemainQty: 30850, UnitPriceVND: 18500, LineAmountVND: 2220000000, AmountRemainderVND: 570725000, DeliveryDate: '2026-03-29', LineStatus: 'Open Order', Incoterm: 'DDP', CountryOfOrigin: 'China', Notes: '14/HĐMH-2026 Q2_Nelly cắt 30t sang DDN', SupplierName: 'CÔNG TY CỔ PHẦN HÓA CHẤT MIVICO' },

  // ── Existing Premix Orders ───────────────────────────────────────────────
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

export const mockPOHeaders = initialPurchaseOrders;
export const mockPurchaseOrders = initialPurchaseOrders;
export const mockPODetails = initialPODetails;
export const mockInboundSchedules = initialInboundSchedules;
