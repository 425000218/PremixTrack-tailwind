import * as XLSX from 'xlsx';
import {
  Dim_Factory,
  Dim_Material,
  Dim_Supplier,
  Dim_Material_Substitution,
  Sys_Import_Mapping,
  ImportDataType,
  ValidationErrorItem,
  ImportPreviewResult
} from '../types';

export interface SystemFieldDefinition {
  field: string;
  label_VN: string;
  label_EN: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean';
  aliases: string[];
}

export const systemFieldsByType: Record<ImportDataType, SystemFieldDefinition[]> = {
  // ── Master Data: tblITEM ──────────────────────────────────────────────────
  Material: [
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu / CODE',
      label_EN: 'Material Code / Item Number',
      required: true,
      type: 'string',
      aliases: ['code', 'mã vật tư', 'mã nguyên liệu', 'item number', 'item id', 'mã sku', 'mã sp', 'sku', 'materialcode', 'itemid']
    },
    {
      field: 'Name_VN',
      label_VN: 'Tên Nguyên Liệu / DESC',
      label_EN: 'Material Name (VN)',
      required: true,
      type: 'string',
      aliases: ['desc', 'tên nguyên liệu', 'tên vật tư', 'mô tả', 'description', 'material name', 'tên hàng', 'item name', 'name_vn', 'item description']
    },
    {
      field: 'PIC',
      label_VN: 'Chuyên Viên Mua Hàng / PIC',
      label_EN: 'Person In Charge (PIC)',
      required: false,
      type: 'string',
      aliases: ['pic', 'người phụ trách', 'purchaser', 'buyer', 'chuyên viên mua hàng', 'chuyên viên', 'pic_id']
    },
    {
      field: 'TaxGroup',
      label_VN: 'Nhóm Thuế / Item sales tax group',
      label_EN: 'Item Sales Tax Group',
      required: false,
      type: 'string',
      aliases: ['item sales tax group', 'tax group', 'thuế', 'nhóm thuế', 'tax', 'sales tax group', 'taxgroup']
    },
    {
      field: 'OverdeliveryPct',
      label_VN: 'Dung Sai Giao Hàng (%) / Overdelivery (%)',
      label_EN: 'Overdelivery Percentage (%)',
      required: false,
      type: 'number',
      aliases: ['overdelivery (%)', 'overdelivery', 'dung sai', 'dung sai giao hàng', 'dung sai (%)', 'overdeliverypct']
    },
    {
      field: 'PackingGroup',
      label_VN: 'Quy Cách Đóng Gói / Packing group',
      label_EN: 'Packing Group',
      required: false,
      type: 'string',
      aliases: ['packing group', 'packing', 'quy cách', 'đóng gói', 'bao bì', 'quy cách đóng gói', 'packinggroup']
    },
    {
      field: 'CountryOfOrigin',
      label_VN: 'Xuất Xứ / CountryOfOrigin',
      label_EN: 'Country of Origin',
      required: false,
      type: 'string',
      aliases: ['countryoforigin', 'origin', 'xuất xứ', 'nước xuất xứ', 'quốc gia', 'country']
    },
    {
      field: 'Category',
      label_VN: 'Phân Nhóm Nguyên Liệu / Category',
      label_EN: 'Material Category',
      required: false,
      type: 'string',
      aliases: ['category', 'phân nhóm', 'nhóm vật tư', 'nhóm hàng', 'chủng loại']
    },
    {
      field: 'Unit',
      label_VN: 'Đơn Vị Tính / Unit',
      label_EN: 'Unit of Measure',
      required: false,
      type: 'string',
      aliases: ['unit', 'đvt', 'đơn vị tính', 'đơn vị', 'uom']
    },
    {
      field: 'SafetyStockDays',
      label_VN: 'Định Mức Tồn An Toàn (Ngày)',
      label_EN: 'Safety Stock Days',
      required: false,
      type: 'number',
      aliases: ['safetystockdays', 'định mức an toàn', 'tồn an toàn (ngày)', 'safety days', 'định mức at', 'min stock days']
    },
    {
      field: 'UnitPriceUSD',
      label_VN: 'Đơn Giá Mua (USD/kg)',
      label_EN: 'Unit Price (USD)',
      required: false,
      type: 'number',
      aliases: ['unitpriceusd', 'đơn giá', 'giá usd', 'unit price', 'giá mua', 'price usd', 'đơn giá ($)']
    },
    {
      field: 'Status',
      label_VN: 'Trạng Thái / Status',
      label_EN: 'Status (Active/Stop_Usage)',
      required: false,
      type: 'string',
      aliases: ['status', 'trạng thái', 'tình trạng', 'trạng thái d365']
    }
  ],

  // ── Master Data: tblFACTORY ───────────────────────────────────────────────
  Factory: [
    {
      field: 'InternalCode',
      label_VN: 'Mã Nhà Máy / FACTORY',
      label_EN: 'Factory Code / Internal Code',
      required: true,
      type: 'string',
      aliases: ['factory', 'mã nhà máy', 'mã nm', 'plant', 'internalcode', 'site', 'factory code', 'mã cơ sở']
    },
    {
      field: 'FactoryName_VN',
      label_VN: 'Tên Nhà Máy / DESC',
      label_EN: 'Factory Name (VN)',
      required: true,
      type: 'string',
      aliases: ['desc', 'tên nhà máy', 'tên cơ sở', 'mô tả', 'factory name', 'plant name', 'factoryname_vn']
    },
    {
      field: 'RegionID',
      label_VN: 'Vùng Miền / REGION',
      label_EN: 'Region (SOUTH/NORTH/CENTRAL)',
      required: false,
      type: 'string',
      aliases: ['region', 'vùng miền', 'vùng', 'khu vực', 'regionid', 'region id']
    },
    {
      field: 'Division',
      label_VN: 'Ngành Sản Xuất / Division',
      label_EN: 'Division (Livestock/Aqua)',
      required: false,
      type: 'string',
      aliases: ['division', 'phân nhánh', 'ngành', 'ngành hàng', 'mảng sản xuất', 'ngành sản xuất']
    },
    {
      field: 'WarehouseCode',
      label_VN: 'Mã Điểm Kho / WAREHOUSE',
      label_EN: 'Warehouse Code',
      required: false,
      type: 'string',
      aliases: ['warehouse', 'mã kho', 'kho', 'điểm kho', 'warehousecode', 'inventlocationid']
    },
    {
      field: 'CustomerVendorRef',
      label_VN: 'Mã Tham Chiếu Đối Tác / Ref',
      label_EN: 'Customer or Vendor Reference',
      required: false,
      type: 'string',
      aliases: ['customer or vendor reference', 'customer/vendor ref', 'mã tham chiếu', 'customer reference', 'vendor reference', 'customervendorref', 'mã khách hàng/ncc']
    },
    {
      field: 'SiteCode',
      label_VN: 'Mã Site D365 / Site',
      label_EN: 'Site Code (dhv/pbh/php)',
      required: false,
      type: 'string',
      aliases: ['site', 'mã site', 'pháp nhân', 'sitecode', 'dataareaid']
    },
    {
      field: 'CapacityTonsPerMonth',
      label_VN: 'Công Suất (Tấn/Tháng)',
      label_EN: 'Capacity (Tons/Month)',
      required: false,
      type: 'number',
      aliases: ['capacitytonspermonth', 'công suất', 'công suất tháng', 'capacity', 'tấn/tháng']
    },
    {
      field: 'Address',
      label_VN: 'Địa Chỉ Nhà Máy',
      label_EN: 'Factory Address',
      required: false,
      type: 'string',
      aliases: ['address', 'địa chỉ', 'vị trí', 'địa chỉ nhà máy']
    }
  ],

  // ── Master Data: tblNCC / tblVendor ───────────────────────────────────────
  Supplier: [
    {
      field: 'ShortName',
      label_VN: 'Tên Ngắn / NCC (short name)',
      label_EN: 'Supplier Short Name',
      required: true,
      type: 'string',
      aliases: ['ncc (short name)', 'ncc', 'tên ngắn', 'short name', 'tên viết tắt', 'nhà cung cấp (tên ngắn)', 'shortname']
    },
    {
      field: 'SupplierCode',
      label_VN: 'Mã Nhà Cung Cấp / CODE',
      label_EN: 'Supplier Code / Vendor Account',
      required: true,
      type: 'string',
      aliases: ['code', 'mã ncc', 'mã nhà cung cấp', 'vendor code', 'vendor id', 'supplier code', 'suppliercode', 'accountnum']
    },
    {
      field: 'SupplierName',
      label_VN: 'Tên Đầy Đủ Công Ty / DESC',
      label_EN: 'Supplier Full Name / Company Name',
      required: true,
      type: 'string',
      aliases: ['desc', 'tên nhà cung cấp', 'tên công ty', 'tên đầy đủ', 'supplier name', 'vendor name', 'suppliername', 'mô tả']
    },
    {
      field: 'ContractNo',
      label_VN: 'Số Hợp Đồng / HĐNT',
      label_EN: 'Principle Contract No (HĐNT)',
      required: false,
      type: 'string',
      aliases: ['hđnt', 'số hợp đồng', 'hợp đồng', 'số hđ', 'contract no', 'contract', 'contractno', 'hđmh']
    },
    {
      field: 'Incoterm',
      label_VN: 'Điều Kiện Incoterm',
      label_EN: 'Incoterm (DDP/CIF/FOB)',
      required: false,
      type: 'string',
      aliases: ['incoterm', 'điều kiện giao hàng', 'incoterms', 'delivery terms']
    },
    {
      field: 'PaymentTerms',
      label_VN: 'Điều Khoản Thanh Toán / Terms of payment',
      label_EN: 'Payment Terms (Net 30/Net 60)',
      required: false,
      type: 'string',
      aliases: ['terms of payment', 'điều khoản thanh toán', 'payment terms', 'thanh toán', 'terms', 'paymentterms']
    },
    {
      field: 'Email',
      label_VN: 'Email Liên Hệ / MAIL',
      label_EN: 'Contact / Accounting Email',
      required: false,
      type: 'string',
      aliases: ['mail', 'email', 'thư điện tử', 'email liên hệ', 'contact email']
    },
    {
      field: 'Note_0',
      label_VN: 'Ghi Chú 1 (Note_0)',
      label_EN: 'Note 0',
      required: false,
      type: 'string',
      aliases: ['note_0', 'ghi chú 1', 'ghi chú', 'note 0', 'note']
    },
    {
      field: 'Note_1',
      label_VN: 'Ghi Chú 2 (Note_1)',
      label_EN: 'Note 1',
      required: false,
      type: 'string',
      aliases: ['note_1', 'ghi chú 2', 'note 1', 'ghi chú thêm']
    },
    {
      field: 'SupplierType',
      label_VN: 'Phân Loại Nguồn (IMPORT/LOCAL)',
      label_EN: 'Supplier Type',
      required: false,
      type: 'string',
      aliases: ['suppliertype', 'loại ncc', 'nguồn', 'phân loại', 'loại nguồn', 'nguồn cung ứng']
    }
  ],

  // ── Master Data: tblItemSubstitution ──────────────────────────────────────
  Substitution: [
    {
      field: 'OriginalMaterialCode',
      label_VN: 'Mã Nguyên Liệu Gốc',
      label_EN: 'Original Material Code',
      required: true,
      type: 'string',
      aliases: ['originalmaterialcode', 'mã gốc', 'mã nguyên liệu gốc', 'mã sku gốc', 'original code', 'mã ban đầu']
    },
    {
      field: 'SubstituteMaterialCode',
      label_VN: 'Mã Nguyên Liệu Thay Thế',
      label_EN: 'Substitute Material Code',
      required: true,
      type: 'string',
      aliases: ['substitutematerialcode', 'mã thay thế', 'mã tương đương', 'mã vật tư thay thế', 'substitute code', 'mã thay']
    },
    {
      field: 'ConversionRatio',
      label_VN: 'Hệ Số Quy Đổi (Ratio)',
      label_EN: 'Conversion Ratio',
      required: true,
      type: 'number',
      aliases: ['conversionratio', 'hệ số quy đổi', 'hệ số', 'tỉ lệ', 'tỉ lệ chuyển đổi', 'ratio']
    },
    {
      field: 'SubstitutionType',
      label_VN: 'Loại Thay Thế (Direct/Ratio/Rework)',
      label_EN: 'Substitution Type',
      required: false,
      type: 'string',
      aliases: ['substitutiontype', 'loại thay thế', 'loại chuyển đổi', 'hình thức thay thế', 'type']
    },
    {
      field: 'Priority',
      label_VN: 'Thứ Tự Ưu Tiên (1, 2, 3...)',
      label_EN: 'Priority Level',
      required: false,
      type: 'number',
      aliases: ['priority', 'độ ưu tiên', 'thứ tự ưu tiên', 'ưu tiên', 'level']
    },
    {
      field: 'DivisionScope',
      label_VN: 'Phạm Vi Ngành (ALL/Livestock/Aqua)',
      label_EN: 'Division Scope',
      required: false,
      type: 'string',
      aliases: ['divisionscope', 'phạm vi', 'ngành áp dụng', 'scope', 'phạm vi ngành']
    },
    {
      field: 'IsBiDirectional',
      label_VN: 'Chuyển Đổi 2 Chiều (True/False)',
      label_EN: 'Is Bi-Directional',
      required: false,
      type: 'boolean',
      aliases: ['isbidirectional', 'chuyển đổi 2 chiều', '2 chiều', 'hai chiều', 'bidirectional']
    },
    {
      field: 'ApprovedBy',
      label_VN: 'Người Duyệt (Formulator/QC)',
      label_EN: 'Approved By',
      required: false,
      type: 'string',
      aliases: ['approvedby', 'người duyệt', 'chuyên viên duyệt', 'approver', 'formulator']
    },
    {
      field: 'Note',
      label_VN: 'Ghi Chú Kỹ Thuật Dinh Dưỡng',
      label_EN: 'Technical Note',
      required: false,
      type: 'string',
      aliases: ['note', 'ghi chú', 'ghi chú kỹ thuật', 'ràng buộc', 'lưu ý']
    }
  ],

  // ── Operational Fact: Forecast ────────────────────────────────────────────
  Forecast: [
    {
      field: 'FactoryCode',
      label_VN: 'Mã Nhà Máy / Site D365',
      label_EN: 'Factory / Site Code',
      required: true,
      type: 'string',
      aliases: ['site', 'nm', 'nhà máy', 'factory', 'plant', 'plantcode', 'internalcode', 'dataareaid', 'forecastheadercode', 'mã nm', 'chi nhánh']
    },
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu / Item Number',
      label_EN: 'Material / Item Number',
      required: true,
      type: 'string',
      aliases: ['item number', 'mã hàng', 'mã nl', 'materialcode', 'itemid', 'item_id', 'mã nguyên liệu', 'vật tư', 'product code', 'sku']
    },
    {
      field: 'ForecastQty',
      label_VN: 'Nhu Cầu Dự Báo (Kg/Tháng)',
      label_EN: 'Forecast Quantity (Kg/Month)',
      required: true,
      type: 'number',
      aliases: ['forecast qty', 'forecast', 'monthly usage', 'nhu cầu tháng', 'dự báo', 'forecast_qty', 'usage/month', 'khối lượng kg', 'kế hoạch (kg)', 'nhu cầu (kg)']
    },
    {
      field: 'VersionName',
      label_VN: 'Phiên Bản / Version',
      label_EN: 'Version Name',
      required: false,
      type: 'string',
      aliases: ['version', 'phiên bản', 'versionid', 'version name', 'đợt forecast', 'tuần', 'week']
    }
  ],

  // ── Operational Fact: SOH ─────────────────────────────────────────────────
  SOH: [
    {
      field: 'FactoryCode',
      label_VN: 'Mã Nhà Máy / Kho D365 / WAREHOUSE',
      label_EN: 'Factory / Warehouse Code',
      required: true,
      type: 'string',
      aliases: ['warehouse', 'org code', 'inventlocationid', 'site', 'nm', 'nhà máy', 'kho', 'factory', 'plant', 'mã kho']
    },
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu / ITEM CODE',
      label_EN: 'Material Code / Item Code',
      required: true,
      type: 'string',
      aliases: ['item code', 'item number', 'mã hàng', 'mã nl', 'materialcode', 'itemid', 'item_id', 'vật tư', 'sku', 'material code']
    },
    {
      field: 'Quantity',
      label_VN: 'Tồn Kho Thực Tế / SOH (Kg)',
      label_EN: 'Stock On Hand / Avail Physical (Kg)',
      required: true,
      type: 'number',
      aliases: ['soh', 'availphysical', 'tồn kho', 'tồn thực tế', 'tồn kho (kg)', 'physical inventory', 'quantity', 'khả dụng', 'số lượng tồn', 'on hand']
    },
    {
      field: 'AveragePrice',
      label_VN: 'Đơn Giá Bình Quân / Price Average (VNĐ/kg)',
      label_EN: 'Average Price (VND/kg)',
      required: false,
      type: 'number',
      aliases: ['price average', 'average price', 'đơn giá', 'giá bình quân', 'đơn giá bq', 'price', 'averageprice']
    },
    {
      field: 'MaterialName',
      label_VN: 'Tên Vật Tư / ITEM NAME',
      label_EN: 'Material Name / Item Name',
      required: false,
      type: 'string',
      aliases: ['item name', 'material name', 'tên hàng', 'tên nguyên liệu', 'item description', 'material description', 'tên vật tư']
    },
    {
      field: 'Region',
      label_VN: 'Khu Vực / REGION',
      label_EN: 'Region (SOUTH/NORTH/CENTRAL)',
      required: false,
      type: 'string',
      aliases: ['region', 'vùng', 'khu vực', 'vùng miền']
    },
    {
      field: 'SubInventory',
      label_VN: 'Kho Con / SUB INV',
      label_EN: 'Sub Inventory',
      required: false,
      type: 'string',
      aliases: ['sub inv', 'subinv', 'sub inventory', 'loại kho', 'kho con']
    },
    {
      field: 'BatchNumber',
      label_VN: 'Số Lô / Batch Number',
      label_EN: 'Batch Number',
      required: false,
      type: 'string',
      aliases: ['batch', 'lô', 'số lô', 'batch number', 'inventbatchid', 'lot', 'lot number']
    },
    {
      field: 'ExpiryDate',
      label_VN: 'Hạn Sử Dụng / Expiry Date',
      label_EN: 'Expiry Date',
      required: false,
      type: 'date',
      aliases: ['expiry', 'hạn dùng', 'hsd', 'exp date', 'expirydate', 'hạn sử dụng', 'ngày hết hạn']
    }
  ],

  // ── Operational Fact: Usage & Movement ───────────────────────────────────
  Usage: [
    {
      field: 'FactoryCode',
      label_VN: 'Mã Nhà Máy / OU / Site',
      label_EN: 'Factory Code / OU',
      required: true,
      type: 'string',
      aliases: ['ou', 'org code', 'site', 'nm', 'nhà máy', 'factory', 'plant', 'warehouse']
    },
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu / ITEM CODE',
      label_EN: 'Material Code / Item Code',
      required: true,
      type: 'string',
      aliases: ['item code', 'item number', 'mã hàng', 'mã nl', 'materialcode', 'itemid']
    },
    {
      field: 'MaterialName',
      label_VN: 'Tên Nguyên Liệu / ITEM NAME',
      label_EN: 'Material Name',
      required: false,
      type: 'string',
      aliases: ['item name', 'tên hàng', 'tên nguyên liệu', 'item description']
    },
    {
      field: 'ActualQty',
      label_VN: 'Lượng Dùng Sản Xuất (WIP Issue Qty)',
      label_EN: 'WIP Issue Qty (Kg)',
      required: true,
      type: 'number',
      aliases: ['wip issue qty', 'wip issue', 'lượng dùng sx', 'actual consumption', 'thực xuất', 'tiêu hao (kg)', 'actualqty', 'actual qty', 'lượng dùng (kg)', 'consumed', 'xuất kho']
    },
    {
      field: 'BeginOnHandKg',
      label_VN: 'Tồn Đầu Kỳ (Begin Onhand Qty)',
      label_EN: 'Begin Onhand Qty (Kg)',
      required: false,
      type: 'number',
      aliases: ['begin onhand qty', 'tồn đầu', 'begin onhand', 'tồn đầu kỳ']
    },
    {
      field: 'ReceivedQtyKg',
      label_VN: 'Nhập Trong Kỳ (Qty Receive)',
      label_EN: 'Qty Receive (Kg)',
      required: false,
      type: 'number',
      aliases: ['qty receive', 'nhập kho', 'lượng nhập', 'qty received']
    },
    {
      field: 'ClosedOnHandKg',
      label_VN: 'Tồn Cuối Kỳ (Closed Onhand Qty)',
      label_EN: 'Closed Onhand Qty (Kg)',
      required: false,
      type: 'number',
      aliases: ['closed onhand qty', 'tồn cuối', 'closed onhand', 'tồn cuối kỳ']
    },
    {
      field: 'LogDate',
      label_VN: 'Ngày Ghi Nhận',
      label_EN: 'Log / Transaction Date',
      required: false,
      type: 'date',
      aliases: ['transdate', 'ngày', 'logdate', 'date', 'ngày xuất', 'posting date']
    }
  ],

  // ── Operational Fact: PO_Inbound & Pending ────────────────────────────────
  PO_Inbound: [
    {
      field: 'PONumber',
      label_VN: 'Mã Đơn Mua Hàng / Purchase order/PAG',
      label_EN: 'Purchase Order / PAG Number',
      required: true,
      type: 'string',
      aliases: ['purchase order/pag', 'purchase order', 'po number', 'ponumber', 'số po', 'mã po', 'purchid', 'đơn hàng']
    },
    {
      field: 'FactoryCode',
      label_VN: 'Nhà Máy / Điểm Kho (Site / Warehouse)',
      label_EN: 'Receiving Site / Warehouse',
      required: true,
      type: 'string',
      aliases: ['site', 'warehouse', 'nm', 'nhà máy', 'destination', 'receiving plant', 'kho đích']
    },
    {
      field: 'SupplierCode',
      label_VN: 'Mã Nhà Cung Cấp / Vendor account',
      label_EN: 'Vendor Account',
      required: false,
      type: 'string',
      aliases: ['vendor account', 'mã ncc', 'vendor', 'mã nhà cung cấp', 'vendoraccount']
    },
    {
      field: 'SupplierName',
      label_VN: 'Tên Nhà Cung Cấp / VENDOR_NAME',
      label_EN: 'Vendor Name',
      required: false,
      type: 'string',
      aliases: ['vendor_name', 'vendor name', 'tên nhà cung cấp', 'tên ncc', 'supplier name']
    },
    {
      field: 'PurchaserName',
      label_VN: 'Người Tạo PO / Created by',
      label_EN: 'Created By / Purchaser',
      required: false,
      type: 'string',
      aliases: ['created by', 'pic', 'purchaser', 'người tạo', 'chuyên viên']
    },
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu / Item number',
      label_EN: 'Item Number / Material Code',
      required: true,
      type: 'string',
      aliases: ['item number', 'item code', 'mã hàng', 'mã nl', 'materialcode', 'itemid']
    },
    {
      field: 'MaterialName',
      label_VN: 'Tên Nguyên Liệu / Item Name',
      label_EN: 'Item Name',
      required: false,
      type: 'string',
      aliases: ['item name', 'tên hàng', 'tên nguyên liệu']
    },
    {
      field: 'UnitPriceVND',
      label_VN: 'Đơn Giá Mua / Unit price (VNĐ)',
      label_EN: 'Unit Price (VND)',
      required: false,
      type: 'number',
      aliases: ['unit price', 'đơn giá', 'giá mua', 'đơn giá vnd', 'unitprice']
    },
    {
      field: 'OrderQty',
      label_VN: 'Tổng Lượng Đặt / Quantity (Kg)',
      label_EN: 'Order Quantity (Kg)',
      required: true,
      type: 'number',
      aliases: ['quantity', 'order qty', 'số lượng đặt', 'orderqty', 'purchqty', 'khối lượng đặt (kg)']
    },
    {
      field: 'ReceivedQty',
      label_VN: 'Đã Giao / Received/Release (Kg)',
      label_EN: 'Received / Released Qty (Kg)',
      required: false,
      type: 'number',
      aliases: ['received/release', 'received', 'đã nhận', 'đã giao', 'received qty']
    },
    {
      field: 'PendingQty',
      label_VN: 'Lượng Pending Còn Lại (Deliver remainder)',
      label_EN: 'Deliver Remainder / Pending Qty (Kg)',
      required: false,
      type: 'number',
      aliases: ['deliver remainder', 'lượng pending', 'còn lại', 'pending qty', 'lượng chưa về', 'deliverremainder']
    },
    {
      field: 'ExpectedDate',
      label_VN: 'Ngày Giao Dự Kiến / Delivery date',
      label_EN: 'Delivery Date / ETA',
      required: true,
      type: 'date',
      aliases: ['delivery date', 'deliverydate', 'eta', 'expected date', 'ngày về dự kiến', 'hạn giao hàng', 'confirmeddate']
    },
    {
      field: 'TermsOfPayment',
      label_VN: 'Điều Khoản Thanh Toán / Terms of payment',
      label_EN: 'Terms of Payment',
      required: false,
      type: 'string',
      aliases: ['terms of payment', 'điều khoản thanh toán', 'payment terms', 'terms']
    },
    {
      field: 'Incoterm',
      label_VN: 'Điều Kiện Thương Mại / Incoterm',
      label_EN: 'Incoterm (DDP/EXW/FOB)',
      required: false,
      type: 'string',
      aliases: ['incoterm', 'điều kiện giao hàng']
    },
    {
      field: 'PAGNumber',
      label_VN: 'Hợp Đồng Khung / Purchase agreement number',
      label_EN: 'Purchase Agreement Number',
      required: false,
      type: 'string',
      aliases: ['purchase agreement number', 'pag', 'số hợp đồng', 'hợp đồng khung']
    },
    {
      field: 'Notes',
      label_VN: 'Ghi Chú Đơn Hàng / Note(PO-HD)',
      label_EN: 'PO Notes / Remarks',
      required: false,
      type: 'string',
      aliases: ['note(po-hd)', 'po notes', 'ghi chú', 'notes', 'ghi chú po']
    }
  ]
};

// Normalize string for fuzzy matching
export function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_\-–—\(\)\[\]\/]+/g, ' ')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd');
}

export function autoMapHeaders(
  excelHeaders: string[],
  importType: ImportDataType,
  learnedMappings: Sys_Import_Mapping[]
): {
  mapped: Record<string, string>; // ExcelHeader -> SystemField
  unmapped: string[];
} {
  const fields = systemFieldsByType[importType] || [];
  const mapped: Record<string, string> = {};
  const unmapped: string[] = [];

  const matchedSystemFields = new Set<string>();

  excelHeaders.forEach((rawHeader) => {
    const norm = normalizeHeader(rawHeader);

    // 1. Check learned mappings first
    const learned = (learnedMappings || []).find(
      (m) =>
        m.ImportType === importType &&
        normalizeHeader(m.ExcelHeaderName) === norm
    );

    if (learned && !matchedSystemFields.has(learned.SystemFieldName)) {
      mapped[rawHeader] = learned.SystemFieldName;
      matchedSystemFields.add(learned.SystemFieldName);
      return;
    }

    // 2. Check predefined aliases
    let matchedField: string | null = null;

    for (const fieldDef of fields) {
      if (matchedSystemFields.has(fieldDef.field)) continue;

      const normField = normalizeHeader(fieldDef.field);
      if (norm === normField) {
        matchedField = fieldDef.field;
        break;
      }

      for (const alias of fieldDef.aliases) {
        const normAlias = normalizeHeader(alias);
        if (norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)) {
          matchedField = fieldDef.field;
          break;
        }
      }

      if (matchedField) break;
    }

    if (matchedField) {
      mapped[rawHeader] = matchedField;
      matchedSystemFields.add(matchedField);
    } else {
      unmapped.push(rawHeader);
    }
  });

  return { mapped, unmapped };
}

/**
 * Extracts and maps raw Excel row object to typed system fields.
 * - Position-independent: matches columns by mapped header name/alias.
 * - Strict filtering: completely ignores unmapped columns/fields to optimize data size & prevent garbage injection.
 */
export function extractMappedRowData<T = Record<string, any>>(
  rawRow: Record<string, any>,
  importType: ImportDataType,
  learnedMappings: Sys_Import_Mapping[]
): {
  mappedData: T;
  mappedFieldCount: number;
  ignoredColumns: string[];
} {
  const fields = systemFieldsByType[importType] || [];
  const rawHeaders = Object.keys(rawRow);
  const { mapped } = autoMapHeaders(rawHeaders, importType, learnedMappings);

  const mappedData: any = {};
  const ignoredColumns: string[] = [];
  let mappedFieldCount = 0;

  // Invert mapped: SystemField -> rawHeader
  const sysToRaw: Record<string, string> = {};
  Object.entries(mapped).forEach(([rawH, sysF]) => {
    if (sysF && sysF !== '__IGNORE__') {
      sysToRaw[sysF] = rawH;
    }
  });

  // Track which raw headers were mapped
  const mappedRawHeaders = new Set(Object.keys(mapped));
  rawHeaders.forEach((h) => {
    if (!mappedRawHeaders.has(h) || mapped[h] === '__IGNORE__') {
      ignoredColumns.push(h);
    }
  });

  // Populate only registered system fields with type conversion
  fields.forEach((fDef) => {
    const rawH = sysToRaw[fDef.field];
    if (!rawH || rawRow[rawH] === undefined || rawRow[rawH] === null || String(rawRow[rawH]).trim() === '') {
      return;
    }
    const val = rawRow[rawH];
    mappedFieldCount++;

    if (fDef.type === 'number') {
      const num = Number(String(val).replace(/,/g, '').trim());
      mappedData[fDef.field] = isNaN(num) ? 0 : num;
    } else if (fDef.type === 'boolean') {
      const str = String(val).trim().toLowerCase();
      mappedData[fDef.field] =
        str === 'true' || str === '1' || str === 'yes' || str === 'có' || str === 'y' || str === '2 chiều';
    } else {
      mappedData[fDef.field] = String(val).trim();
    }
  });

  return {
    mappedData: mappedData as T,
    mappedFieldCount,
    ignoredColumns,
  };
}


// 3-Layer Validation function
export function validateImportData(
  rawData: any[],
  mapping: Record<string, string>, // ExcelHeader -> SystemField
  importType: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound',
  factories: Dim_Factory[],
  materials: Dim_Material[]
): {
  parsedData: any[];
  errors: ValidationErrorItem[];
  validRowsCount: number;
  errorRowsCount: number;
  warningRowsCount: number;
} {
  const fields = systemFieldsByType[importType] || [];
  const errors: ValidationErrorItem[] = [];
  const parsedData: any[] = [];

  const rowErrorSet = new Set<number>();
  const rowWarningSet = new Set<number>();

  // Inverted mapping: SystemField -> ExcelHeader
  const sysToExcel: Record<string, string> = {};
  Object.entries(mapping).forEach(([excelH, sysF]) => {
    if (sysF && sysF !== '__IGNORE__') {
      sysToExcel[sysF] = excelH;
    }
  });

  rawData.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row numbering (1 is header)
    const normalizedItem: Record<string, any> = { _rowNumber: rowNumber, _raw: row };
    let hasError = false;

    // Check required fields
    fields.forEach((fieldDef) => {
      const excelHeader = sysToExcel[fieldDef.field];
      let val = excelHeader ? row[excelHeader] : undefined;

      // Handle null/empty
      if (val === undefined || val === null || String(val).trim() === '') {
        if (fieldDef.required) {
          errors.push({
            rowNumber,
            column: excelHeader || fieldDef.field,
            value: '(Trống / Empty)',
            layer: 'Type',
            message: `Trường bắt buộc "${fieldDef.label_VN}" không được để trống`,
            severity: 'Error'
          });
          hasError = true;
        }
        normalizedItem[fieldDef.field] = null;
        return;
      }

      val = String(val).trim();

      // Layer 1: Data Type Validation
      if (fieldDef.type === 'number') {
        const cleanNum = Number(String(val).replace(/,/g, ''));
        if (isNaN(cleanNum)) {
          errors.push({
            rowNumber,
            column: excelHeader,
            value: val,
            layer: 'Type',
            message: `Giá trị "${val}" không phải là số hợp lệ`,
            severity: 'Error'
          });
          hasError = true;
          normalizedItem[fieldDef.field] = null;
        } else if (cleanNum < 0) {
          // Layer 3: Business logic check (Negative numbers)
          errors.push({
            rowNumber,
            column: excelHeader,
            value: val,
            layer: 'BusinessLogic',
            message: `Số lượng không được âm (${cleanNum} < 0)`,
            severity: 'Error'
          });
          hasError = true;
          normalizedItem[fieldDef.field] = cleanNum;
        } else {
          normalizedItem[fieldDef.field] = cleanNum;
        }
      } else if (fieldDef.type === 'date') {
        // Parse date
        normalizedItem[fieldDef.field] = String(val);
      } else {
        normalizedItem[fieldDef.field] = String(val);
      }
    });

    // Layer 2: Master Data Lookup Validation
    const rawFactoryCode = normalizedItem.FactoryCode;
    if (rawFactoryCode) {
      const cleanFactory = String(rawFactoryCode).trim().toUpperCase();
      const matchedFactory = factories.find(
        (f) =>
          f.InternalCode.toUpperCase() === cleanFactory ||
          f.ForecastHeaderCode === cleanFactory ||
          f.FactoryID.toUpperCase() === cleanFactory ||
          f.FactoryName_VN.toLowerCase().includes(cleanFactory.toLowerCase())
      );

      if (!matchedFactory) {
        errors.push({
          rowNumber,
          column: sysToExcel['FactoryCode'] || 'FactoryCode',
          value: rawFactoryCode,
          layer: 'MasterData',
          message: `Mã nhà máy "${rawFactoryCode}" không tồn tại trong danh mục Dim_Factories`,
          severity: 'Error'
        });
        hasError = true;
      } else {
        normalizedItem.ResolvedFactoryID = matchedFactory.FactoryID;
        normalizedItem.ResolvedFactoryCode = matchedFactory.InternalCode;
        normalizedItem.ResolvedFactoryName = matchedFactory.FactoryName_VN;
      }
    }

    const rawMaterialCode = normalizedItem.MaterialCode;
    if (rawMaterialCode) {
      const cleanMaterial = String(rawMaterialCode).trim();
      const matchedMaterial = materials.find(
        (m) =>
          m.MaterialCode === cleanMaterial ||
          m.MaterialID === cleanMaterial ||
          m.Name_VN.toLowerCase().includes(cleanMaterial.toLowerCase())
      );

      if (!matchedMaterial) {
        errors.push({
          rowNumber,
          column: sysToExcel['MaterialCode'] || 'MaterialCode',
          value: rawMaterialCode,
          layer: 'MasterData',
          message: `Mã nguyên liệu "${rawMaterialCode}" không tồn tại trong danh mục Dim_Materials`,
          severity: 'Error'
        });
        hasError = true;
      } else {
        normalizedItem.ResolvedMaterialID = matchedMaterial.MaterialID;
        normalizedItem.ResolvedMaterialCode = matchedMaterial.MaterialCode;
        normalizedItem.ResolvedMaterialName = matchedMaterial.Name_VN;

        // Layer 3: Business Logic Validation
        if (matchedMaterial.Status === 'Stop_Usage') {
          const rep = materials.find((m) => m.MaterialID === matchedMaterial.ReplacementMaterialID);
          errors.push({
            rowNumber,
            column: sysToExcel['MaterialCode'] || 'MaterialCode',
            value: rawMaterialCode,
            layer: 'BusinessLogic',
            message: `Cảnh báo: Mã [${matchedMaterial.MaterialCode}] đang thuộc diện 'Stop Usage' (Đã ngưng dùng). Đề nghị chuyển sang mã thay thế [${rep?.MaterialCode || 'N/A'}] - ${rep?.Name_VN || ''}.`,
            severity: 'Warning'
          });
          rowWarningSet.add(rowNumber);
        }
      }
    }

    if (hasError) {
      rowErrorSet.add(rowNumber);
      normalizedItem._status = 'Error';
    } else if (rowWarningSet.has(rowNumber)) {
      normalizedItem._status = 'Warning';
    } else {
      normalizedItem._status = 'Valid';
    }

    parsedData.push(normalizedItem);
  });

  const totalRows = rawData.length;
  const errorRowsCount = rowErrorSet.size;
  const warningRowsCount = rowWarningSet.size;
  const validRowsCount = totalRows - errorRowsCount;

  return {
    parsedData,
    errors,
    validRowsCount,
    errorRowsCount,
    warningRowsCount
  };
}

// Generate Sample D365 FO Excel Files
export function generateSampleExcel(importType: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound'): void {
  let headers: string[] = [];
  let sampleRows: any[] = [];
  let fileName = `PremixTrack_Template_${importType}.xlsx`;

  if (importType === 'Forecast') {
    headers = ['Site', 'Item Number', 'Material Description', 'Forecast Qty (Kg)', 'Monthly Usage Note'];
    sampleRows = [
      ['DBD', '2580001', 'DL-Methionine 99% Feed Grade', 48000, 'D365 Formula W30 Update'],
      ['DDN', '2580001', 'DL-Methionine 99% Feed Grade', 39500, 'Regular Pig & Broiler Demand'],
      ['DBD', '2580002', 'L-Lysine HCl 98.5%', 98000, 'D365 Formula W30 Update'],
      ['DDN', '2580003', 'L-Threonine 98.5% Min', 29000, 'High inclusion starter'],
      ['DVL', '2580007', 'Vitamin C Phosphate 35% Stable', 12500, 'Aqua season peak demand'],
      ['DHY', '2580008', 'Phytase 5000 FTU/g Thermostable', 3800, 'Enzyme replacement batch'],
      ['043', '2580006', 'Vitamin AD3E Plus Bio-Stab (Mới)', 8900, 'Plant 043 D365 FO Code']
    ];
  } else if (importType === 'SOH') {
    headers = ['InventLocationId', 'Item Number', 'AvailPhysical', 'Batch', 'Expiry Date', 'Warehouse Location'];
    sampleRows = [
      ['DBD', '2580001', 58000, 'LOT-MET-2608', '2027-08-30', 'KHO-PREMIX-A1'],
      ['DDN', '2580003', 4200, 'LOT-THR-2608', '2027-08-15', 'KHO-DN-03'],
      ['DDN', '2580008', 650, 'LOT-PHY-2607', '2027-07-20', 'KHO-DN-06'],
      ['DVL', '2580007', 2200, 'LOT-VITC-2607', '2027-07-15', 'KHO-VL-03'],
      ['DHY', '2580002', 65000, 'LOT-LYS-2607', '2027-09-10', 'KHO-HY-02'],
      ['0432', '2580009', 185000, 'LOT-MCP-2607', '2028-08-01', 'SILO-DN-01']
    ];
  } else if (importType === 'Usage') {
    headers = ['Site', 'Item Number', 'Actual Consumption', 'TransDate', 'Recipe Code'];
    sampleRows = [
      ['DBD', '2580001', 25400, '2026-08-15', 'PRM-PIG-401'],
      ['DBD', '2580002', 52100, '2026-08-15', 'PRM-BRO-251'],
      ['DDN', '2580003', 15800, '2026-08-15', 'PRM-PIG-401'],
      ['DVL', '2580007', 4800, '2026-08-15', 'PRM-AQU-051']
    ];
  } else {
    headers = ['PO Number', 'Site', 'Item Number', 'Order Qty', 'Expected Date (ETA)', 'Truck Plate'];
    sampleRows = [
      ['PO-D365-88910', 'DDN', '2580003', 20000, '2026-08-17', '51D-894.22'],
      ['PO-D365-88911', 'DDN', '2580008', 5000, '2026-08-18', '60C-672.15'],
      ['PO-D365-88912', 'DVL', '2580007', 8000, '2026-08-19', '64C-112.89'],
      ['PO-D365-88913', 'DBD', '2580009', 50000, '2026-08-20', '61C-445.88']
    ];
  }

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Auto column width
  worksheet['!cols'] = headers.map(() => ({ wch: 22 }));

  XLSX.writeFile(workbook, fileName);
}
