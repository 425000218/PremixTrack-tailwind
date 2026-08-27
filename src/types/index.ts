export type Language = 'vi' | 'en';

export interface Dim_Region {
  RegionID: string;
  RegionName: string;
  RegionName_EN: string;
}

export type FactoryDivision = 'Livestock' | 'Aqua' | 'Premix' | 'Other';

export interface Dim_Factory {
  FactoryID: string;
  InternalCode: string;          // FACTORY column: BHA, DBD, DDN, DVM, DHG, DBQ, PBD, DVL, PCT
  FactoryName_VN: string;        // DESC column: PC Biên Hòa, DH Bình Dương, etc.
  FactoryName_EN: string;
  RegionID: string;              // REGION column: SOUTH, NORTH, CENTRAL, MEKONG
  Division: FactoryDivision;     // Division column: Livestock, Aqua
  WarehouseCode: string;         // WAREHOUSE column: BHA, DBD, DDN, PBQ, etc.
  CustomerVendorRef: string;     // Customer or vendor reference: DH036, DH002, etc.
  SiteCode: string;              // Site column: pbh, dhv
  ForecastHeaderCode: string;    // D365 FO forecast site code: 043, 0432, etc.
  Address: string;
  CapacityTonsPerMonth: number;
}

export interface Dim_PIC {
  PIC_ID: string;
  FullName: string;
  Email: string;
  Phone: string;
  Department: string;
}

export type SupplierType = 'IMPORT' | 'LOCAL';

export interface Dim_Supplier {
  SupplierID: string;
  SupplierType: SupplierType;                // IMPORT | LOCAL
  ShortName: string;                         // NCC (short name): Meihua, EVONIK, ĐỨC GIANG...
  SupplierCode: string;                      // CODE column: 1006576, 1030068...
  SupplierName: string;                      // DESC column: Meihua Group..., Công Ty TNHH Evonik Việt Nam...
  ContractNo?: string;                       // HĐNT column: 14/HĐMH-2023, 81/HĐMH-2022  BSD Số 1...
  Incoterm: string;                          // Incoterm column: DDP, CIF, FOB, EXW, CFR
  PaymentTerms: string;                      // Terms of payment column: 0, Net 30, Net 45, Net 60
  Email?: string;                            // MAIL column: tam.luong@evonik.com...
  Note_0?: string;                           // Note_0 column
  Note_1?: string;                           // Note_1 column
  Country?: string;                          // Backward compat
  LeadTimeDays?: number;                     // Lead time days
  Rating?: number;                           // Supplier rating (1-5)
}

export type MaterialCategory = 
  | 'Amino_Acids'
  | 'Vitamins'
  | 'Trace_Minerals'
  | 'Enzymes'
  | 'Toxin_Binders'
  | 'Acidifiers'
  | 'Medicinals'
  | 'Carriers_Minerals';

export type MaterialStatus = 'Active' | 'Stop_Usage' | 'Phase_Out' | 'Testing';

export interface Dim_Material {
  MaterialID: string;
  MaterialCode: string;                      // CODE column: e.g., 2302020, 2303010, 3201050
  Name_VN: string;                           // DESC column: DICALCIUM PHOSPHATE_DCP, SALT VACUUM...
  Name_EN: string;
  PIC: string;                               // PIC column: Fiona, Austin, Talena, Heidi, Nelly...
  PIC_ID?: string;
  TaxGroup: string;                          // Item sales tax group: NonVAT, VAT10-Non
  OverdeliveryPct: number;                   // Overdelivery (%): 0, 10
  PackingGroup: string;                      // Packing group: Bags, Bulk
  CountryOfOrigin: string;                   // CountryOfOrigin: Việt Nam, China, India...
  Category: MaterialCategory;
  Unit: string;                              // 'kg', 'Bags', 'tấn'
  ReplacementMaterialID?: string | null;      // Self-reference for Planned Substitution
  ReplacementMaterialCode?: string | null;    // Display code of replacement material
  ReplacementMaterialName?: string | null;    // Display name of replacement material
  SafetyStockDays: number;                   // e.g., 14 to 30 days
  UnitPriceUSD: number;
  Status: MaterialStatus;
  SpecDescription?: string;
}

export type SubstitutionType =
  | 'Direct_1_to_1'    // Thay ngang cùng tỉ lệ (Hệ số = 1.0)
  | 'Ratio_Adjusted'   // Thay khác tỉ lệ (Hệ số != 1.0, cần quy đổi công thức)
  | 'Formula_Rework';  // Cần Formulator chạy lại công thức tối ưu hóa chi phí

export interface Dim_Material_Substitution {
  SubstitutionID: string;         // e.g., 'SUB-3201050-01'
  OriginalMaterialCode: string;   // Mã vật tư gốc (e.g., '3201050' - L-Lysine HCl 99%)
  OriginalMaterialName?: string;
  SubstituteMaterialCode: string; // Mã vật tư thay thế (e.g., '3201011' - L-Lysine Sulfate 70%)
  SubstituteMaterialName?: string;
  ConversionRatio: number;        // Hệ số quy đổi (e.g., 1.414: Cần 1.414 kg mã thay thế cho 1 kg mã gốc)
  SubstitutionType: SubstitutionType;
  Priority: number;               // Thứ tự ưu tiên (1 = Ưu tiên cao nhất, 2, 3, 4, 5...)
  DivisionScope: 'ALL' | 'Livestock' | 'Aqua'; // Giới hạn ngành áp dụng
  IsBiDirectional: boolean;       // Có cho phép chuyển đổi 2 chiều ngược lại không?
  Status: 'Active' | 'Under_Review' | 'Inactive';
  ApprovedBy: string;             // Chuyên viên Formulator / QC phê duyệt (e.g., 'Nelly', 'Fiona')
  EffectiveDate?: string;         // Ngày bắt đầu có hiệu lực
  ExpiryDate?: string;            // Ngày hết hạn quy tắc
  Note?: string;                  // Ghi chú kỹ thuật dinh dưỡng (e.g., 'Bù trừ chất mang CaCO3 khi dùng Sulfate')
}

export interface Fact_Forecast_Header {
  VersionID: string;
  VersionName: string; // e.g., W28_2026, W29_Formula_Update
  ExportDate: string;
  IsActive: boolean;
  Note?: string;
  WorkingDaysInMonth: number; // default 28
}

export interface ForecastRunVersion {
  VersionID: string;
  RunDate: string; // e.g., '2026-08-21', '2026-08-16', '2026-08-11', '2026-08-07', '2026-07-31', '2026-07-24'
  VersionName: string;
  TotalForecastQty: number;
  SKUCount: number;
  PlantCount: number;
  UploadedAt: string;
  UploadedBy: string;
  SourceFileName: string;
  Notes?: string;
}

export interface Fact_Forecast_Detail {
  ID: string;
  VersionID: string;
  RunDate?: string;
  FactoryID: string;
  FactoryCode?: string;
  SiteCode?: string;
  PlantName?: string;
  MaterialID: string;
  MaterialCode?: string;
  MaterialName?: string;
  Division?: FactoryDivision;
  ForecastQty: number; // kg/month
}

export interface ForecastCompareRow {
  MaterialCode: string;
  MaterialName: string;
  Division: FactoryDivision;
  SiteCode: string;
  FactoryCode: string;
  FactoryName: string;
  RunQuantities: Record<string, number>; // RunDate -> Qty
  SparklineData: number[];
  LatestQty: number;
  PreviousQty: number;
  ComparePct: number;
  QtyDiff: number;
}

export interface Fact_Inventory_SOH {
  SOH_ID: string;
  FactoryID: string;
  MaterialID: string;
  Quantity: number; // kg on hand
  WarehouseLocation?: string;
  BatchNumber?: string;
  ExpiryDate?: string;
  UpdateDate?: string;
  Region?: string;
  WarehouseCode?: string;
  OrgCode?: string;
  SubInventory?: string;
  AveragePrice?: number;
  SnapshotDate?: string;
}

export interface Fact_Inventory_Movement {
  MovementID: string;
  FactoryCode: string;
  OrgCode: string;
  MaterialCode: string;
  MaterialName: string;
  UOM: string;
  SubInventory: string;
  BeginOnHandKg: number;
  ReceivedQtyKg: number;
  WipIssueQtyKg: number;
  ClosedOnHandKg: number;
  ReportDate: string;
}

export interface Fact_Production_Usage {
  UsageID: string;
  FactoryID: string;
  MaterialID: string;
  ActualQty: number; // kg consumed
  LogDate: string;
  RecipeCode?: string;
}

export interface Fact_PurchaseOrder {
  POID: string;
  PONumber: string;
  SupplierID: string;
  SupplierName?: string;
  OrderDate: string;
  Status: 'Draft' | 'Confirmed' | 'Shipped' | 'Partially_Received' | 'Completed' | 'Cancelled' | 'Open';
  TotalAmountUSD?: number;
  TotalAmountVND?: number;
  PaymentTerms?: string;
  Incoterm?: string;
  PurchaserName?: string;
  ContractNumber?: string;
}

export interface Fact_PO_Detail {
  PODetailID: string;
  POID: string;
  FactoryID: string;
  MaterialID: string;
  MaterialCode?: string;
  MaterialName?: string;
  OrderQty: number; // kg
  ReceivedQty: number; // kg
  RemainQty: number; // OrderQty - ReceivedQty (Deliver remainder)
  UnitPriceUSD?: number;
  UnitPriceVND?: number;
  LineAmountVND?: number;
  AmountRemainderVND?: number;
  DeliveryDate?: string;
  PromisedDeliveryDate?: string;
  LineStatus?: string;
  TaxGroup?: string;
  Incoterm?: string;
  CountryOfOrigin?: string;
  Notes?: string;
  PAGNumber?: string;
  SupplierName?: string;
  CoverDays?: number;
  CoverDate?: string;
}

export interface Fact_Inbound_Schedule {
  ScheduleID: string;
  PODetailID: string;
  ExpectedDate: string; // ETA
  PlannedQty: number;
  TruckPlate: string;
  DriverName: string;
  DriverPhone: string;
  Status: 'Scheduled' | 'In_Transit' | 'Arrived' | 'Delayed' | 'Unloaded';
  ContainerNo?: string;
  PortOfDischarge?: string;
}

export type ImportDataType =
  | 'Material'
  | 'Factory'
  | 'Supplier'
  | 'Substitution'
  | 'Forecast'
  | 'SOH'
  | 'Usage'
  | 'PO_Inbound';

export interface Sys_Import_Mapping {
  MappingID: string;
  ImportType: ImportDataType;
  ExcelHeaderName: string;
  SystemFieldName: string;
  Description?: string;
  CreatedAt: string;
}

export interface Formula_BOM_Item {
  MaterialID: string;
  QtyKgPerTonPremix: number; // kg of raw material per 1000kg of premix
  InclusionPercent: number; // % in premix
}

export interface Formula_BOM {
  FormulaID: string;
  FormulaCode: string;
  FormulaName: string;
  TargetSpecies: string; // Heo con, Heo vỗ béo, Gà thịt, Tôm, Cá tra
  PremixInclusionRateInFeed: number; // e.g. 4% premix per ton finished feed
  StandardBatchSizeKg: number;
  Items: Formula_BOM_Item[];
  EffectiveDate: string;
  Status: 'Active' | 'Draft' | 'Archived';
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'BALANCED' | 'OVERSTOCK' | 'STOP_USAGE_WARNING' | 'SUBSTITUTED';

export interface CalculatedMaterialMetric {
  FactoryID: string;
  FactoryCode: string;
  FactoryName: string;
  MaterialID: string;
  MaterialCode: string;
  MaterialName_VN: string;
  MaterialName_EN: string;
  Category: MaterialCategory;
  Unit: string;
  SafetyStockDays: number;
  ForecastQty: number; // kg/month
  DailyUsage: number; // ForecastQty / 28
  SOHQty: number; // kg on hand
  OpenPOQty: number; // kg in inbound / remain PO
  TotalAvailable: number; // SOH + OpenPO
  DOI_SOH: number; // SOH / DailyUsage (days)
  DOI_Total: number; // (SOH + OpenPO) / DailyUsage (days)
  CoverageTillDate: string;
  StockoutDate: string;
  MTDActualUsage: number;
  MTDPerformancePercent: number;
  Severity: AlertSeverity;
  SuggestedReorderQty: number;
  ReplacementMaterialID?: string | null;
  ReplacementMaterialCode?: string | null;
  ReplacementMaterialName?: string | null;
  Substitutions?: Dim_Material_Substitution[];
  VirtualAvailableQty?: number;  // SOH + sum(SubstituteSOH / Ratio)
  VirtualDOI?: number;           // VirtualAvailableQty / DailyUsage
  Status: MaterialStatus;
}

export interface InterFactoryTransferSuggestion {
  id: string;
  MaterialID: string;
  MaterialCode: string;
  MaterialName: string;
  SourceFactoryID: string;
  SourceFactoryCode: string;
  SourceDOI: number;
  SourceSurplusKg: number;
  TargetFactoryID: string;
  TargetFactoryCode: string;
  TargetDOI: number;
  TargetDeficitKg: number;
  RecommendedTransferKg: number;
  EstimatedDistanceKm: number;
  EstimatedTransitHours: number;
  Urgency: 'URGENT' | 'HIGH' | 'MEDIUM';
  Reason: string;
  Status: 'Pending' | 'Approved' | 'Dispatched';
}

export interface ValidationErrorItem {
  rowNumber: number;
  column: string;
  value: any;
  layer: 'Type' | 'MasterData' | 'BusinessLogic';
  message: string;
  severity: 'Error' | 'Warning';
}

export interface ImportPreviewResult {
  importType: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound';
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  headers: string[];
  mappedColumns: Record<string, string>; // ExcelHeader -> SystemField
  unmappedHeaders: string[];
  parsedData: any[];
  errors: ValidationErrorItem[];
  dryRunPassed: boolean;
}

// ==========================================
// USER AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================

export type UserRole =
  | 'System_Admin'
  | 'Supply_Chain_Manager'
  | 'Factory_Planner'
  | 'Logistics_Officer'
  | 'Viewer';

export interface UserPermission {
  canImportExcel: boolean;
  canApproveTransfer: boolean;
  canCreateTransfer: boolean;
  canReceiveShipment: boolean;
  canEditMasterData: boolean;
  canUseAiAdvisor: boolean;
  canManageUsers: boolean;
  canExportReports: boolean;
  allowedFactoryIds: string[]; // ['ALL'] or specific factory IDs
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleNameVN: string;
  department: string;
  phone: string;
  avatarBg: string;
  assignedFactoryId: string; // 'ALL' or specific FactoryID
  assignedFactoryName: string;
  permissions: UserPermission;
  lastLogin?: string;
}

