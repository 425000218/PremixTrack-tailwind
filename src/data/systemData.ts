import {
  Sys_Import_Mapping,
  AppUser,
  UserRole,
  UserPermission,
} from '../types';

export const initialImportMappings: Sys_Import_Mapping[] = [
  // ── Master Data: tblITEM Mappings ─────────────────────────────────────────
  { MappingID: 'MAP-M01', ImportType: 'Material', ExcelHeaderName: 'CODE', SystemFieldName: 'MaterialCode', Description: 'Mã nguyên vật liệu chuẩn D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M02', ImportType: 'Material', ExcelHeaderName: 'Mã Vật Tư', SystemFieldName: 'MaterialCode', Description: 'Mã vật tư nội bộ', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M03', ImportType: 'Material', ExcelHeaderName: 'Item Number', SystemFieldName: 'MaterialCode', Description: 'Item number D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M04', ImportType: 'Material', ExcelHeaderName: 'DESC', SystemFieldName: 'Name_VN', Description: 'Tên nguyên liệu / mô tả D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M05', ImportType: 'Material', ExcelHeaderName: 'Tên Nguyên Liệu', SystemFieldName: 'Name_VN', Description: 'Tên tiếng Việt của nguyên liệu', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M06', ImportType: 'Material', ExcelHeaderName: 'PIC', SystemFieldName: 'PIC', Description: 'Chuyên viên mua hàng phụ trách', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M07', ImportType: 'Material', ExcelHeaderName: 'Item sales tax group', SystemFieldName: 'TaxGroup', Description: 'Nhóm thuế bán hàng (NonVAT, VAT10-Non)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M08', ImportType: 'Material', ExcelHeaderName: 'Overdelivery (%)', SystemFieldName: 'OverdeliveryPct', Description: 'Dung sai giao hàng quá mức (%)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M09', ImportType: 'Material', ExcelHeaderName: 'Packing group', SystemFieldName: 'PackingGroup', Description: 'Quy cách đóng gói (Bags, Bulk)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M10', ImportType: 'Material', ExcelHeaderName: 'CountryOfOrigin', SystemFieldName: 'CountryOfOrigin', Description: 'Quốc gia / Nước xuất xứ', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M11', ImportType: 'Material', ExcelHeaderName: 'Xuất Xứ', SystemFieldName: 'CountryOfOrigin', Description: 'Nước sản xuất', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-M12', ImportType: 'Material', ExcelHeaderName: 'Material code', SystemFieldName: 'MaterialCode', Description: 'Mã nguyên liệu từ file Recipe / Forecast RD', CreatedAt: '2026-08-26' },
  { MappingID: 'MAP-M13', ImportType: 'Material', ExcelHeaderName: 'Material description', SystemFieldName: 'Name_VN', Description: 'Tên mô tả nguyên liệu từ file Recipe / Forecast RD', CreatedAt: '2026-08-26' },

  // ── Master Data: tblFACTORY Mappings ──────────────────────────────────────
  { MappingID: 'MAP-F01', ImportType: 'Factory', ExcelHeaderName: 'FACTORY', SystemFieldName: 'InternalCode', Description: 'Mã viết tắt nhà máy D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-F02', ImportType: 'Factory', ExcelHeaderName: 'Mã Nhà Máy', SystemFieldName: 'InternalCode', Description: 'Mã nhà máy nội bộ', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-F03', ImportType: 'Factory', ExcelHeaderName: 'DESC', SystemFieldName: 'FactoryName_VN', Description: 'Tên đầy đủ cơ sở nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-F04', ImportType: 'Factory', ExcelHeaderName: 'REGION', SystemFieldName: 'RegionID', Description: 'Vùng miền (SOUTH, NORTH...)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-F05', ImportType: 'Factory', ExcelHeaderName: 'Division', SystemFieldName: 'Division', Description: 'Phân nhánh ngành (Livestock, Aqua)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-F06', ImportType: 'Factory', ExcelHeaderName: 'WAREHOUSE', SystemFieldName: 'WarehouseCode', Description: 'Mã kho gắn với nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-F07', ImportType: 'Factory', ExcelHeaderName: 'Customer or vendor reference', SystemFieldName: 'CustomerVendorRef', Description: 'Mã tham chiếu đối tác D365 (e.g. DH036)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-F08', ImportType: 'Factory', ExcelHeaderName: 'Site', SystemFieldName: 'SiteCode', Description: 'Mã pháp nhân site (dhv, pbh, php)', CreatedAt: '2026-08-01' },

  // ── Master Data: tblNCC Mappings ──────────────────────────────────────────
  { MappingID: 'MAP-S01', ImportType: 'Supplier', ExcelHeaderName: 'NCC (short name)', SystemFieldName: 'ShortName', Description: 'Tên ngắn viết tắt nhà cung cấp', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S02', ImportType: 'Supplier', ExcelHeaderName: 'CODE', SystemFieldName: 'SupplierCode', Description: 'Mã nhà cung cấp D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S03', ImportType: 'Supplier', ExcelHeaderName: 'Mã NCC', SystemFieldName: 'SupplierCode', Description: 'Mã đối tác cung cấp', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S04', ImportType: 'Supplier', ExcelHeaderName: 'DESC', SystemFieldName: 'SupplierName', Description: 'Tên đầy đủ công ty / pháp nhân', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S05', ImportType: 'Supplier', ExcelHeaderName: 'Tên Công Ty', SystemFieldName: 'SupplierName', Description: 'Tên doanh nghiệp nhà cung cấp', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S06', ImportType: 'Supplier', ExcelHeaderName: 'HĐNT', SystemFieldName: 'ContractNo', Description: 'Số hợp đồng nguyên tắc / mua hàng', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S07', ImportType: 'Supplier', ExcelHeaderName: 'Incoterm', SystemFieldName: 'Incoterm', Description: 'Điều kiện giao hàng Incoterm', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S08', ImportType: 'Supplier', ExcelHeaderName: 'Terms of payment', SystemFieldName: 'PaymentTerms', Description: 'Điều khoản thanh toán công nợ', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-S09', ImportType: 'Supplier', ExcelHeaderName: 'MAIL', SystemFieldName: 'Email', Description: 'Email liên hệ nhận PO & đối soát', CreatedAt: '2026-08-01' },

  // ── Master Data: tblItemSubstitution Mappings ─────────────────────────────
  { MappingID: 'MAP-SUB01', ImportType: 'Substitution', ExcelHeaderName: 'OriginalMaterialCode', SystemFieldName: 'OriginalMaterialCode', Description: 'Mã nguyên liệu gốc', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-SUB02', ImportType: 'Substitution', ExcelHeaderName: 'Mã Gốc', SystemFieldName: 'OriginalMaterialCode', Description: 'Mã SKU gốc cần chuyển đổi', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-SUB03', ImportType: 'Substitution', ExcelHeaderName: 'SubstituteMaterialCode', SystemFieldName: 'SubstituteMaterialCode', Description: 'Mã nguyên liệu thay thế', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-SUB04', ImportType: 'Substitution', ExcelHeaderName: 'Mã Thay Thế', SystemFieldName: 'SubstituteMaterialCode', Description: 'Mã SKU thay thế tương đương', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-SUB05', ImportType: 'Substitution', ExcelHeaderName: 'ConversionRatio', SystemFieldName: 'ConversionRatio', Description: 'Hệ số quy đổi hoạt tính dinh dưỡng', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-SUB06', ImportType: 'Substitution', ExcelHeaderName: 'Hệ Số Quy Đổi', SystemFieldName: 'ConversionRatio', Description: 'Tỉ lệ nhân quy đổi', CreatedAt: '2026-08-01' },

  // ── Operational Fact: Forecast Mappings ───────────────────────────────────
  { MappingID: 'MAP-01', ImportType: 'Forecast', ExcelHeaderName: 'Site', SystemFieldName: 'FactoryCode', Description: 'Mã nhà máy / Chi nhánh D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-02', ImportType: 'Forecast', ExcelHeaderName: 'NM', SystemFieldName: 'FactoryCode', Description: 'Tên viết tắt nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-03', ImportType: 'Forecast', ExcelHeaderName: 'PlantCode', SystemFieldName: 'FactoryCode', Description: 'D365 Plant ID (e.g. 043, 0432)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-04', ImportType: 'Forecast', ExcelHeaderName: 'Item Number', SystemFieldName: 'MaterialCode', Description: 'Mã nguyên vật liệu D365', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-05', ImportType: 'Forecast', ExcelHeaderName: 'Mã Hàng', SystemFieldName: 'MaterialCode', Description: 'Mã hàng vật tư', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-06', ImportType: 'Forecast', ExcelHeaderName: 'ItemId', SystemFieldName: 'MaterialCode', Description: 'Item ID ERP', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-06A', ImportType: 'Forecast', ExcelHeaderName: 'Material code', SystemFieldName: 'MaterialCode', Description: 'Mã nguyên vật liệu từ Recipe Site matrix', CreatedAt: '2026-08-26' },
  { MappingID: 'MAP-06B', ImportType: 'Forecast', ExcelHeaderName: 'Material description', SystemFieldName: 'MaterialName', Description: 'Tên nguyên vật liệu từ Recipe Site matrix', CreatedAt: '2026-08-26' },
  { MappingID: 'MAP-07', ImportType: 'Forecast', ExcelHeaderName: 'Forecast Qty', SystemFieldName: 'ForecastQty', Description: 'Nhu cầu dự báo tháng (kg)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-08', ImportType: 'Forecast', ExcelHeaderName: 'Monthly Usage', SystemFieldName: 'ForecastQty', Description: 'Nhu cầu sử dụng tháng', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-09', ImportType: 'Forecast', ExcelHeaderName: 'Nhu Cầu Tháng', SystemFieldName: 'ForecastQty', Description: 'Sản lượng dự báo kg', CreatedAt: '2026-08-01' },

  // ── Operational Fact: SOH Mappings ────────────────────────────────────────
  { MappingID: 'MAP-10', ImportType: 'SOH', ExcelHeaderName: 'InventLocationId', SystemFieldName: 'FactoryCode', Description: 'Kho D365 tương ứng nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-11', ImportType: 'SOH', ExcelHeaderName: 'Nhà Máy', SystemFieldName: 'FactoryCode', Description: 'Tên nhà máy', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-12', ImportType: 'SOH', ExcelHeaderName: 'AvailPhysical', SystemFieldName: 'Quantity', Description: 'Tồn kho khả dụng thực tế (kg)', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-13', ImportType: 'SOH', ExcelHeaderName: 'SOH', SystemFieldName: 'Quantity', Description: 'Stock on hand', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-14', ImportType: 'SOH', ExcelHeaderName: 'Tồn Kho (Kg)', SystemFieldName: 'Quantity', Description: 'Khối lượng tồn kho', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-15', ImportType: 'SOH', ExcelHeaderName: 'Physical Inventory', SystemFieldName: 'Quantity', Description: 'Kiểm kê vật lý', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-16', ImportType: 'SOH', ExcelHeaderName: 'Batch', SystemFieldName: 'BatchNumber', Description: 'Số lô sản xuất', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-17', ImportType: 'SOH', ExcelHeaderName: 'Expiry', SystemFieldName: 'ExpiryDate', Description: 'Hạn dùng nguyên liệu', CreatedAt: '2026-08-01' },

  // ── Operational Fact: Consumption / Usage Mappings ─────────────────────────
  { MappingID: 'MAP-18', ImportType: 'Usage', ExcelHeaderName: 'Actual Consumption', SystemFieldName: 'ActualQty', Description: 'Số lượng thực xuất sản xuất', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-19', ImportType: 'Usage', ExcelHeaderName: 'Thực Xuất (Kg)', SystemFieldName: 'ActualQty', Description: 'Tiêu hao thực tế', CreatedAt: '2026-08-01' },
  { MappingID: 'MAP-20', ImportType: 'Usage', ExcelHeaderName: 'TransDate', SystemFieldName: 'LogDate', Description: 'Ngày giao dịch', CreatedAt: '2026-08-01' },
];

// Premix Formulas / Feed BOM Master

export const mockInitialMappings = initialImportMappings;

export function getRolePermissions(role: UserRole, factoryId: string = 'ALL'): UserPermission {
  switch (role) {
    case 'System_Admin':
      return {
        canImportExcel: true,
        canApproveTransfer: true,
        canCreateTransfer: true,
        canReceiveShipment: true,
        canEditMasterData: true,
        canUseAiAdvisor: true,
        canManageUsers: true,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
    case 'Supply_Chain_Manager':
      return {
        canImportExcel: true,
        canApproveTransfer: true,
        canCreateTransfer: true,
        canReceiveShipment: false,
        canEditMasterData: true,
        canUseAiAdvisor: true,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
    case 'Factory_Planner':
      return {
        canImportExcel: false,
        canApproveTransfer: false,
        canCreateTransfer: true,
        canReceiveShipment: false,
        canEditMasterData: false,
        canUseAiAdvisor: true,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: [factoryId || 'FAC-DBD'],
      };
    case 'Logistics_Officer':
      return {
        canImportExcel: false,
        canApproveTransfer: false,
        canCreateTransfer: false,
        canReceiveShipment: true,
        canEditMasterData: false,
        canUseAiAdvisor: false,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
    case 'Viewer':
    default:
      return {
        canImportExcel: false,
        canApproveTransfer: false,
        canCreateTransfer: false,
        canReceiveShipment: false,
        canEditMasterData: false,
        canUseAiAdvisor: false,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
  }
}

// Initial Mock Users representing 5 key enterprise roles
export const mockUsers: AppUser[] = [
  {
    id: 'USR-001',
    username: 'admin',
    email: 'nam.dang@premixtrack.vn',
    fullName: 'Nam Đặng',
    role: 'System_Admin',
    roleNameVN: 'Quản Trị Viên Hệ Thống',
    department: 'Ban Giám Đốc & Quản Trị Hệ Thống',
    phone: '0378 047 778',
    avatarBg: 'bg-rose-600',
    assignedFactoryId: 'ALL',
    assignedFactoryName: 'Toàn quốc (22 Cơ sở)',
    permissions: getRolePermissions('System_Admin', 'ALL'),
    lastLogin: 'Vừa mới đây',
  },
  {
    id: 'USR-002',
    username: 'scm_lead',
    email: 'nam.le@premixtrack.vn',
    fullName: 'Lê Hoàng Nam',
    role: 'Supply_Chain_Manager',
    roleNameVN: 'Trưởng Phòng Chuỗi Cung Ứng (S&OP)',
    department: 'Phòng Kế Hoạch Chuỗi Cung Ứng & S&OP',
    phone: '0903 112 233',
    avatarBg: 'bg-blue-600',
    assignedFactoryId: 'ALL',
    assignedFactoryName: 'Toàn quốc (8 Nhà máy)',
    permissions: getRolePermissions('Supply_Chain_Manager', 'ALL'),
    lastLogin: 'Hôm nay, 09:15',
  },
  {
    id: 'USR-003',
    username: 'planner_dbd',
    email: 'ha.tran@premixtrack.vn',
    fullName: 'Trần Thị Thu Hà',
    role: 'Factory_Planner',
    roleNameVN: 'Kỹ Sư Điều Phối Nhà Máy Bình Dương',
    department: 'Bộ Phận Kỹ Thuật & Kế Hoạch Sản Xuất DBD',
    phone: '0988 765 432',
    avatarBg: 'bg-amber-600',
    assignedFactoryId: 'FAC-DBD',
    assignedFactoryName: 'Nhà máy Bình Dương (DBD)',
    permissions: getRolePermissions('Factory_Planner', 'FAC-DBD'),
    lastLogin: 'Hôm qua, 16:40',
  },
  {
    id: 'USR-004',
    username: 'logistics_lead',
    email: 'thang.pham@premixtrack.vn',
    fullName: 'Phạm Đức Thắng',
    role: 'Logistics_Officer',
    roleNameVN: 'Trưởng Bộ Phận Inbound & Tiếp Nhận Cân',
    department: 'Bộ Phận Logistics Cảng & Kho Vận',
    phone: '0977 889 900',
    avatarBg: 'bg-emerald-600',
    assignedFactoryId: 'ALL',
    assignedFactoryName: 'Toàn quốc (Khu vực Cảng & Kho)',
    permissions: getRolePermissions('Logistics_Officer', 'ALL'),
    lastLogin: 'Hôm nay, 07:50',
  },
  {
    id: 'USR-005',
    username: 'viewer_auditor',
    email: 'an.do@premixtrack.vn',
    fullName: 'Đỗ Hoài An',
    role: 'Viewer',
    roleNameVN: 'Kiểm Toán Viên & Xem Báo Cáo',
    department: 'Ban Kiểm Soát Nội Bộ & QA',
    phone: '0934 556 778',
    avatarBg: 'bg-slate-600',
    assignedFactoryId: 'ALL',
    assignedFactoryName: 'Toàn quốc (Chế độ xem)',
    permissions: getRolePermissions('Viewer', 'ALL'),
    lastLogin: '24/08/2026',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MA TRẬN CHUYỂN ĐỔI & THAY THẾ NGUYÊN LIỆU ĐA NGUỒN (1-to-N Substitution Rules)
// ─────────────────────────────────────────────────────────────────────────────
