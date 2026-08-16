export type Language = 'vi' | 'en';

export interface Dim_Region {
  RegionID: string;
  RegionName: string;
  RegionName_EN: string;
}

export interface Dim_Factory {
  FactoryID: string;
  InternalCode: string; // e.g., DBD, DDN, DHY, DVL, DBN, DTI
  ForecastHeaderCode: string; // e.g., 043, 0432, 0435 from D365 FO
  FactoryName_VN: string;
  FactoryName_EN: string;
  RegionID: string;
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

export interface Dim_Supplier {
  SupplierID: string;
  SupplierCode: string;
  SupplierName: string;
  Country: string;
  Incoterm: 'CIF' | 'FOB' | 'DDP' | 'EXW' | 'CFR';
  PaymentTerms: string;
  LeadTimeDays: number;
  Rating: number;
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
  MaterialCode: string; // e.g., 2580001
  Name_VN: string;
  Name_EN: string;
  Category: MaterialCategory;
  Unit: string; // 'kg', 'bao 25kg', 'tấn'
  PIC_ID: string;
  ReplacementMaterialID?: string | null; // Self-reference for Planned Substitution
  SafetyStockDays: number; // e.g., 14 to 30 days
  UnitPriceUSD: number;
  Status: MaterialStatus;
  SpecDescription?: string;
}

export interface Fact_Forecast_Header {
  VersionID: string;
  VersionName: string; // e.g., W28_2026, W29_Formula_Update
  ExportDate: string;
  IsActive: boolean;
  Note?: string;
  WorkingDaysInMonth: number; // default 28
}

export interface Fact_Forecast_Detail {
  ID: string;
  VersionID: string;
  FactoryID: string;
  MaterialID: string;
  ForecastQty: number; // kg/month
}

export interface Fact_Inventory_SOH {
  SOH_ID: string;
  FactoryID: string;
  MaterialID: string;
  Quantity: number; // kg on hand
  WarehouseLocation: string;
  BatchNumber: string;
  ExpiryDate: string;
  UpdateDate: string;
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
  OrderDate: string;
  Status: 'Draft' | 'Confirmed' | 'Shipped' | 'Partially_Received' | 'Completed' | 'Cancelled';
  TotalAmountUSD: number;
}

export interface Fact_PO_Detail {
  PODetailID: string;
  POID: string;
  FactoryID: string;
  MaterialID: string;
  OrderQty: number; // kg
  ReceivedQty: number; // kg
  RemainQty: number; // OrderQty - ReceivedQty
  UnitPriceUSD: number;
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

export interface Sys_Import_Mapping {
  MappingID: string;
  ImportType: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound';
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
