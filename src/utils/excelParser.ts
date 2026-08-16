import * as XLSX from 'xlsx';
import {
  Dim_Factory,
  Dim_Material,
  Sys_Import_Mapping,
  ValidationErrorItem,
  ImportPreviewResult
} from '../types';

export interface SystemFieldDefinition {
  field: string;
  label_VN: string;
  label_EN: string;
  required: boolean;
  type: 'string' | 'number' | 'date';
  aliases: string[];
}

export const systemFieldsByType: Record<string, SystemFieldDefinition[]> = {
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
  SOH: [
    {
      field: 'FactoryCode',
      label_VN: 'Mã Nhà Máy / Kho D365',
      label_EN: 'Factory / Warehouse Code',
      required: true,
      type: 'string',
      aliases: ['inventlocationid', 'site', 'nm', 'nhà máy', 'kho', 'factory', 'plant', 'warehouse', 'mã kho']
    },
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu',
      label_EN: 'Material Code',
      required: true,
      type: 'string',
      aliases: ['item number', 'mã hàng', 'mã nl', 'materialcode', 'itemid', 'item_id', 'vật tư', 'sku']
    },
    {
      field: 'Quantity',
      label_VN: 'Tồn Kho Thực Tế (Kg)',
      label_EN: 'Stock On Hand / Avail Physical (Kg)',
      required: true,
      type: 'number',
      aliases: ['availphysical', 'soh', 'tồn kho', 'tồn thực tế', 'tồn kho (kg)', 'physical inventory', 'quantity', 'khả dụng', 'số lượng tồn', 'on hand']
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
  Usage: [
    {
      field: 'FactoryCode',
      label_VN: 'Mã Nhà Máy',
      label_EN: 'Factory Code',
      required: true,
      type: 'string',
      aliases: ['site', 'nm', 'nhà máy', 'factory', 'plant']
    },
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu',
      label_EN: 'Material Code',
      required: true,
      type: 'string',
      aliases: ['item number', 'mã hàng', 'mã nl', 'materialcode', 'itemid']
    },
    {
      field: 'ActualQty',
      label_VN: 'Số Lượng Tiêu Hao (Kg)',
      label_EN: 'Actual Consumed Qty (Kg)',
      required: true,
      type: 'number',
      aliases: ['actual consumption', 'thực xuất', 'tiêu hao (kg)', 'actualqty', 'actual qty', 'lượng dùng (kg)', 'consumed', 'xuất kho']
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
  PO_Inbound: [
    {
      field: 'PONumber',
      label_VN: 'Mã Đơn Mua Hàng (PO Number)',
      label_EN: 'Purchase Order Number',
      required: true,
      type: 'string',
      aliases: ['po number', 'ponumber', 'số po', 'mã po', 'purchid', 'đơn hàng']
    },
    {
      field: 'FactoryCode',
      label_VN: 'Nhà Máy Nhận Hàng',
      label_EN: 'Receiving Factory Code',
      required: true,
      type: 'string',
      aliases: ['site', 'nm', 'nhà máy', 'destination', 'receiving plant', 'kho đích']
    },
    {
      field: 'MaterialCode',
      label_VN: 'Mã Nguyên Liệu',
      label_EN: 'Material Code',
      required: true,
      type: 'string',
      aliases: ['item number', 'mã hàng', 'mã nl', 'materialcode', 'itemid']
    },
    {
      field: 'OrderQty',
      label_VN: 'Khối Lượng Đặt (Kg)',
      label_EN: 'Order Qty (Kg)',
      required: true,
      type: 'number',
      aliases: ['order qty', 'số lượng đặt', 'orderqty', 'purchqty', 'khối lượng đặt (kg)']
    },
    {
      field: 'ExpectedDate',
      label_VN: 'Ngày Dự Kiến Về (ETA)',
      label_EN: 'Expected Arrival Date (ETA)',
      required: true,
      type: 'date',
      aliases: ['eta', 'expected date', 'ngày về dự kiến', 'deliverydate', 'hạn giao hàng', 'confirmeddate']
    },
    {
      field: 'TruckPlate',
      label_VN: 'Biển Số Xe / Container',
      label_EN: 'Truck Plate / Container No',
      required: false,
      type: 'string',
      aliases: ['truck plate', 'biển số xe', 'xe tải', 'container', 'số xe', 'containerno']
    }
  ]
};

// Normalize string for fuzzy matching
function normalizeHeader(str: string): string {
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
  importType: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound',
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
    const learned = learnedMappings.find(
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
