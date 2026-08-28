import {
  Fact_Inventory_SOH,
  Fact_Inventory_Movement,
  Fact_Production_Usage,
} from '../types';

export const initialInventorySOH: Fact_Inventory_SOH[] = [
  // ── Factory DBD (Bình Dương) - Snapshot Cut-off 06h 25/08/2026 (D365 FO) ──
  { SOH_ID: 'SOH-DBD-1001010', FactoryID: 'FAC-DBD', MaterialID: '1001010', Quantity: 223683, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 8450, WarehouseLocation: 'KHO-RAW-A1', BatchNumber: 'LOT-BAR-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1002010', FactoryID: 'FAC-DBD', MaterialID: '1002010', Quantity: 1110520, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 7181, WarehouseLocation: 'SILO-CORN-01', BatchNumber: 'LOT-CRN-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1002101', FactoryID: 'FAC-DBD', MaterialID: '1002101', Quantity: 210050, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 6799, WarehouseLocation: 'KHO-RAW-B1', BatchNumber: 'LOT-CGF-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1002150', FactoryID: 'FAC-DBD', MaterialID: '1002150', Quantity: 64934, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 18265, WarehouseLocation: 'KHO-RAW-B2', BatchNumber: 'LOT-CGM-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1002500', FactoryID: 'FAC-DBD', MaterialID: '1002500', Quantity: 1996, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 11988, WarehouseLocation: 'KHO-RAW-C1', BatchNumber: 'LOT-CST-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1003010', FactoryID: 'FAC-DBD', MaterialID: '1003010', Quantity: 1062664, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 7447, WarehouseLocation: 'SILO-WHT-01', BatchNumber: 'LOT-WHT-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1003100', FactoryID: 'FAC-DBD', MaterialID: '1003100', Quantity: 375, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 38800, WarehouseLocation: 'KHO-RAW-C2', BatchNumber: 'LOT-VWG-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1003356', FactoryID: 'FAC-DBD', MaterialID: '1003356', Quantity: 345716, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 6372, WarehouseLocation: 'KHO-RAW-D1', BatchNumber: 'LOT-WBM-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1005010', FactoryID: 'FAC-DBD', MaterialID: '1005010', Quantity: 17047, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 7600, WarehouseLocation: 'KHO-RAW-D2', BatchNumber: 'LOT-RBN-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1005100', FactoryID: 'FAC-DBD', MaterialID: '1005100', Quantity: 5990, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 4400, WarehouseLocation: 'KHO-RAW-D3', BatchNumber: 'LOT-RHL-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1005150', FactoryID: 'FAC-DBD', MaterialID: '1005150', Quantity: 252039, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 8350, WarehouseLocation: 'KHO-RAW-E1', BatchNumber: 'LOT-RBK-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1012106', FactoryID: 'FAC-DBD', MaterialID: '1012106', Quantity: 207108, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 7200, WarehouseLocation: 'KHO-RAW-E2', BatchNumber: 'LOT-DDG-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1012160', FactoryID: 'FAC-DBD', MaterialID: '1012160', Quantity: 169819, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 9954, WarehouseLocation: 'KHO-RAW-E3', BatchNumber: 'LOT-DCY-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1012500', FactoryID: 'FAC-DBD', MaterialID: '1012500', Quantity: 6390, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 7500, WarehouseLocation: 'KHO-RAW-E4', BatchNumber: 'LOT-RDD-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1101018', FactoryID: 'FAC-DBD', MaterialID: '1101018', Quantity: 533170, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 11543, WarehouseLocation: 'SILO-SBM-01', BatchNumber: 'LOT-SBM-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1101107', FactoryID: 'FAC-DBD', MaterialID: '1101107', Quantity: 229883, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 5365, WarehouseLocation: 'KHO-RAW-F1', BatchNumber: 'LOT-SHL-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1101330', FactoryID: 'FAC-DBD', MaterialID: '1101330', Quantity: 48275, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 20866, WarehouseLocation: 'KHO-RAW-F2', BatchNumber: 'LOT-SPC-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },
  { SOH_ID: 'SOH-DBD-1102002', FactoryID: 'FAC-DBD', MaterialID: '1102002', Quantity: 358441, Region: 'SOUTH', WarehouseCode: 'DBD', OrgCode: 'DBD', SubInventory: 'RAW', AveragePrice: 8390, WarehouseLocation: 'KHO-RAW-F3', BatchNumber: 'LOT-RSM-2608', ExpiryDate: '2027-08-25', UpdateDate: '2026-08-25' },

  // ── Existing Premix Items for DBD ─────────────────────────────────────────
  { SOH_ID: 'SOH-001', FactoryID: 'FAC-DBD', MaterialID: 'MAT-01', Quantity: 58000, WarehouseLocation: 'KHO-PREMIX-A1', BatchNumber: 'LOT-MET-2607', ExpiryDate: '2027-06-30', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-002', FactoryID: 'FAC-DBD', MaterialID: 'MAT-02', Quantity: 110000, WarehouseLocation: 'KHO-AMINO-B2', BatchNumber: 'LOT-LYS-2608', ExpiryDate: '2027-08-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-003', FactoryID: 'FAC-DBD', MaterialID: 'MAT-03', Quantity: 54000, WarehouseLocation: 'KHO-AMINO-B3', BatchNumber: 'LOT-THR-2605', ExpiryDate: '2027-05-20', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-004', FactoryID: 'FAC-DBD', MaterialID: 'MAT-04', Quantity: 42000, WarehouseLocation: 'KHO-VIT-C1', BatchNumber: 'LOT-CHO-2607', ExpiryDate: '2027-01-10', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-005', FactoryID: 'FAC-DBD', MaterialID: 'MAT-05', Quantity: 1200, WarehouseLocation: 'KHO-VIT-C2', BatchNumber: 'LOT-AD3E-OLD', ExpiryDate: '2026-10-30', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-006', FactoryID: 'FAC-DBD', MaterialID: 'MAT-06', Quantity: 9800, WarehouseLocation: 'KHO-VIT-C3', BatchNumber: 'LOT-AD3E-NEW', ExpiryDate: '2028-02-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-007', FactoryID: 'FAC-DBD', MaterialID: 'MAT-07', Quantity: 7500, WarehouseLocation: 'KHO-VIT-C4', BatchNumber: 'LOT-VITC-2606', ExpiryDate: '2027-11-20', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-008', FactoryID: 'FAC-DBD', MaterialID: 'MAT-08', Quantity: 5100, WarehouseLocation: 'KHO-ENZ-D1', BatchNumber: 'LOT-PHY-2604', ExpiryDate: '2027-04-15', UpdateDate: '2026-08-15' },
  { SOH_ID: 'SOH-009', FactoryID: 'FAC-DBD', MaterialID: 'MAT-09', Quantity: 92000, WarehouseLocation: 'SILO-MCP-01', BatchNumber: 'LOT-MCP-2608', ExpiryDate: '2028-08-01', UpdateDate: '2026-08-15' },
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


export const initialInventoryMovements: Fact_Inventory_Movement[] = [
  { MovementID: 'MOV-DBD-1001010-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1001010', MaterialName: 'BARLEY', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 374904.00, ReceivedQtyKg: 0.00, WipIssueQtyKg: 143785.50, ClosedOnHandKg: 223683.00, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1002010-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1002010', MaterialName: 'CORN', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 1507958.38, ReceivedQtyKg: 7761920.00, WipIssueQtyKg: 8124748.60, ClosedOnHandKg: 1110519.98, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1002101-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1002101', MaterialName: 'CORN GLUTENFEED >20%CP', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 97980.87, ReceivedQtyKg: 112106.63, WipIssueQtyKg: 37.50, ClosedOnHandKg: 210050.00, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1002150-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1002150', MaterialName: 'CORN GLUTEN MEAL 60%', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 67306.60, ReceivedQtyKg: 51921.53, WipIssueQtyKg: 54294.25, ClosedOnHandKg: 64933.88, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1002500-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1002500', MaterialName: 'CORN STARCH', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 1995.60, ReceivedQtyKg: 0.40, WipIssueQtyKg: 0.00, ClosedOnHandKg: 1996.00, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1003010-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1003010', MaterialName: 'Wheat', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 1243630.44, ReceivedQtyKg: 2144100.00, WipIssueQtyKg: 2312068.00, ClosedOnHandKg: 1062664.09, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1003100-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1003100', MaterialName: 'Vital Wheat Gluten', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 375.00, ReceivedQtyKg: 0.00, WipIssueQtyKg: 0.00, ClosedOnHandKg: 375.00, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1003356-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1003356', MaterialName: 'WHEATBRAN MEAL coarse', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 221717.65, ReceivedQtyKg: 716433.00, WipIssueQtyKg: 577728.00, ClosedOnHandKg: 345716.37, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1005010-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1005010', MaterialName: 'RICEBRAN 12/12/12', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 23406.95, ReceivedQtyKg: 63445.00, WipIssueQtyKg: 69178.00, ClosedOnHandKg: 17046.57, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1005100-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1005100', MaterialName: 'RICE HULLS', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 10415.50, ReceivedQtyKg: 0.00, WipIssueQtyKg: 4410.50, ClosedOnHandKg: 5989.50, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1005150-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1005150', MaterialName: 'RICE BROKEN', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 274507.26, ReceivedQtyKg: 691434.00, WipIssueQtyKg: 649574.70, ClosedOnHandKg: 252039.44, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1012106-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1012106', MaterialName: 'DDGS CORN STANDARD QUALITY US', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 273642.89, ReceivedQtyKg: 460980.00, WipIssueQtyKg: 515522.75, ClosedOnHandKg: 207107.88, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1012160-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1012160', MaterialName: 'DDG CORN/YEAST 40%CP', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 302028.22, ReceivedQtyKg: 0.00, WipIssueQtyKg: 127138.00, ClosedOnHandKg: 169819.46, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1012500-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1012500', MaterialName: 'Rice DDGS', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 42.40, ReceivedQtyKg: 8210.00, WipIssueQtyKg: 1819.60, ClosedOnHandKg: 6390.40, ReportDate: '2026-08-25' },
  { MovementID: 'MOV-DBD-1101018-250826', FactoryCode: 'DBD', OrgCode: 'DBD', MaterialCode: '1101018', MaterialName: 'SOYABEANMEAL 48% CP', UOM: 'Kg', SubInventory: 'RAW', BeginOnHandKg: 158502.90, ReceivedQtyKg: 3382670.00, WipIssueQtyKg: 2979015.88, ClosedOnHandKg: 533170.22, ReportDate: '2026-08-25' }
];


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

export const mockInventorySOH = initialInventorySOH;
export const mockProductionUsages = initialProductionUsages;
export const mockUsageLogs = initialProductionUsages;
