import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  Layers,
  Factory,
  Building2,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  Save,
  FileSpreadsheet,
  Building,
  Warehouse,
  Globe2,
  AlertTriangle,
  PackageCheck,
  UserCheck,
  ArrowRightLeft,
  Sliders,
  Scale,
  Mail,
  FileText,
  Ship,
  Truck,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ArrowUpToLine,
  ArrowDownToLine,
  FileDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Dim_Factory,
  Dim_Material,
  Dim_Supplier,
  SupplierType,
  Dim_Material_Substitution,
  SubstitutionType,
  Sys_Import_Mapping,
  ImportDataType,
  Language,
  MaterialCategory,
  MaterialStatus,
  FactoryDivision,
  Fact_Inventory_SOH,
  Fact_Forecast_Detail,
  Fact_Production_Usage,
  Fact_Inbound_Schedule,
  Fact_PurchaseOrder,
  Fact_PO_Detail,
  Formula_BOM,
} from '../types';
import {
  systemFieldsByType,
  extractMappedRowData,
  SystemFieldDefinition,
} from '../utils/excelParser';

interface DependencyCheckResult {
  canDelete: boolean;
  reasons: string[];
  summary: string;
}

interface MasterDataManagementProps {
  initialSubTab?: 'materials' | 'factories' | 'suppliers' | 'substitutions' | 'mappings';
  factories: Dim_Factory[];
  materials: Dim_Material[];
  suppliers: Dim_Supplier[];
  formulas?: Formula_BOM[];
  substitutions?: Dim_Material_Substitution[];
  learnedMappings: Sys_Import_Mapping[];
  inventorySOH?: Fact_Inventory_SOH[];
  forecastDetails?: Fact_Forecast_Detail[];
  usageLogs?: Fact_Production_Usage[];
  inboundSchedules?: Fact_Inbound_Schedule[];
  poHeaders?: Fact_PurchaseOrder[];
  poDetails?: Fact_PO_Detail[];
  onUpdateMaterials: (updated: Dim_Material[]) => void;
  onDeleteMaterial?: (materialId: string) => void;
  onUpdateFactories?: (updated: Dim_Factory[]) => void;
  onDeleteFactory?: (factoryId: string) => void;
  onUpdateSuppliers?: (updated: Dim_Supplier[]) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onUpdateSubstitutions?: (updated: Dim_Material_Substitution[]) => void;
  onSaveMapping?: (mapping: Sys_Import_Mapping) => void;
  onDeleteMapping: (mappingId: string) => void;
  language: Language;
}

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Carriers_Minerals',
  'Amino_Acids',
  'Trace_Minerals',
  'Vitamins',
  'Acidifiers',
  'Enzymes',
  'Toxin_Binders',
  'Medicinals',
];

const MATERIAL_STATUSES: MaterialStatus[] = ['Active', 'Stop_Usage', 'Phase_Out', 'Testing'];
const TAX_GROUP_OPTIONS = ['NonVAT', 'VAT10-Non', 'VAT5-Non', 'VAT10', 'VAT5'];
const PACKING_GROUP_OPTIONS = ['Bags', 'Bulk', 'Drums', 'Totes', 'Cartons'];
const PIC_OPTIONS = ['Fiona', 'Austin', 'Nelly', 'Talena', 'Heidi', 'Victoria', 'Vivian', 'Other'];

const SUBSTITUTION_TYPE_LABELS: Record<SubstitutionType, { label: string; bg: string; text: string }> = {
  Direct_1_to_1: {
    label: 'Thay Ngang 1:1 (Direct)',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
  },
  Ratio_Adjusted: {
    label: 'Thay Theo Hệ Số Tỉ Lệ (Ratio)',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
  },
  Formula_Rework: {
    label: 'Cần Chạy Lại Công Thức (Rework)',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
  },
};

const REGION_OPTIONS = [
  { id: 'SOUTH', label: 'SOUTH (Miền Nam)' },
  { id: 'NORTH', label: 'NORTH (Miền Bắc)' },
  { id: 'CENTRAL', label: 'CENTRAL (Miền Trung)' },
  { id: 'MEKONG', label: 'MEKONG (Đồng Bằng SCL)' },
];

const DIVISION_OPTIONS: FactoryDivision[] = ['Livestock', 'Aqua', 'Premix', 'Other'];
const SITE_OPTIONS = [
  { id: 'dhv', label: 'dhv (De Heus Vietnam)' },
  { id: 'pbh', label: 'pbh (Premix Center Biên Hòa)' },
  { id: 'php', label: 'php (Premix Center Hải Phòng)' },
];

const INCOTERM_OPTIONS = ['DDP', 'CIF', 'FOB', 'EXW', 'CFR', 'CIP'];

const IMPORT_TYPE_METADATA: Record<
  ImportDataType,
  { label_VN: string; group: 'MasterData' | 'Fact'; badgeColor: string }
> = {
  Material: { label_VN: 'Nguyên Liệu (tblITEM)', group: 'MasterData', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  Factory: { label_VN: 'Nhà Máy (tblFACTORY)', group: 'MasterData', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  Supplier: { label_VN: 'Nhà Cung Cấp (tblNCC)', group: 'MasterData', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Substitution: { label_VN: 'Ma Trận Thay Thế (tblItemSub)', group: 'MasterData', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  Forecast: { label_VN: 'Dự Báo Kế Hoạch (Forecast)', group: 'Fact', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  SOH: { label_VN: 'Tồn Kho Thực Tế (SOH)', group: 'Fact', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  Usage: { label_VN: 'Tiêu Hao Sản Xuất (Usage)', group: 'Fact', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  PO_Inbound: { label_VN: 'Đơn Đặt Hàng Mua (PO Inbound)', group: 'Fact', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
};

function Field({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {helper && <p className="text-[10px] text-slate-400">{helper}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium text-slate-900';

// Sticky Table Header helper class
const stickyThCls =
  'sticky top-0 z-20 bg-slate-50 border-b border-slate-200 py-3 px-4 text-slate-500 uppercase text-[10px] font-bold tracking-wider';

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT HELPER: Export array of objects to Excel with custom headers & filename
// ─────────────────────────────────────────────────────────────────────────────
function exportToExcel<T extends Record<string, any>>(data: T[], fileNamePrefix: string, sheetName: string = 'Data') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// BALLOON HOME / END FLOATING BUTTONS COMPONENT (Dành cho data >= 20 dòng)
// ─────────────────────────────────────────────────────────────────────────────
function FloatingHomeEndButtons({
  containerRef,
  rowCount,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rowCount: number;
}) {
  if (rowCount < 20) return null;

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="absolute right-4 bottom-4 z-30 flex flex-col items-center gap-2 animate-fade-in pointer-events-auto">
      {/* Balloon Home Button */}
      <button
        onClick={scrollToTop}
        className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-900/85 hover:bg-blue-600 text-white shadow-xl backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        title="Về đầu trang (Home / Top)"
      >
        <ArrowUpToLine className="w-4 h-4" />
        <span className="absolute right-full mr-2.5 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Về đầu bảng (Home)
        </span>
      </button>

      {/* Row counter pill */}
      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900/75 text-blue-200 backdrop-blur-md border border-white/10 shadow-sm">
        {rowCount} dòng
      </span>

      {/* Balloon End Button */}
      <button
        onClick={scrollToBottom}
        className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-900/85 hover:bg-blue-600 text-white shadow-xl backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        title="Xuống cuối trang (End / Bottom)"
      >
        <ArrowDownToLine className="w-4 h-4" />
        <span className="absolute right-full mr-2.5 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Xuống cuối bảng (End)
        </span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK: DYNAMIC POSITION-INDEPENDENT EXCEL UPLOAD WITH HEADER MAPPING
// ─────────────────────────────────────────────────────────────────────────────
function useExcelUpload<T>(
  importType: ImportDataType,
  templateHeaders: string[],
  learnedMappings: Sys_Import_Mapping[],
  onSuccess: (items: T[]) => void,
) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target!.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          setUploadMsg('File Excel không có dữ liệu dòng nào.');
          return;
        }

        let ignoredColumnsOverall: Set<string> = new Set();
        const validItems: T[] = [];

        rows.forEach((row) => {
          const { mappedData, mappedFieldCount, ignoredColumns } = extractMappedRowData<T>(
            row,
            importType,
            learnedMappings
          );
          ignoredColumns.forEach((col) => ignoredColumnsOverall.add(col));

          if (mappedFieldCount > 0) {
            validItems.push(mappedData);
          }
        });

        if (validItems.length === 0) {
          setUploadMsg('Không tìm thấy dòng hợp lệ nào. Vui lòng kiểm tra lại Header các cột.');
        } else {
          onSuccess(validItems);
          const ignoredStr =
            ignoredColumnsOverall.size > 0
              ? ` (đã tự động bỏ qua ${ignoredColumnsOverall.size} cột thừa: ${Array.from(ignoredColumnsOverall).slice(0, 3).join(', ')}${ignoredColumnsOverall.size > 3 ? '...' : ''})`
              : '';
          setUploadMsg(
            `Đã ánh xạ & nạp ${validItems.length} dòng thành công theo chuẩn từ điển header${ignoredStr}!`
          );
        }
      } catch {
        setUploadMsg('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
      }
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setUploadMsg(null), 5000);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_${importType}_${Date.now()}.xlsx`);
  };

  const trigger = () => fileRef.current?.click();

  return { fileRef, handleFile, downloadTemplate, trigger, uploadMsg };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL QUẢN LÝ TỪ ĐIỂN ÁNH XẠ (MAPPING MODAL - THÊM & SỬA)
// ─────────────────────────────────────────────────────────────────────────────
function MappingModal({
  item,
  onSave,
  onClose,
}: {
  item: Sys_Import_Mapping | null;
  onSave: (m: Sys_Import_Mapping) => void;
  onClose: () => void;
}) {
  const isNew = item === null;
  const blank: Sys_Import_Mapping = {
    MappingID: `MAP-${Date.now().toString(36).toUpperCase()}`,
    ImportType: 'Material',
    ExcelHeaderName: '',
    SystemFieldName: '',
    Description: '',
    CreatedAt: new Date().toISOString().split('T')[0],
  };

  const [form, setForm] = useState<Sys_Import_Mapping>(item ?? blank);
  const set = (k: keyof Sys_Import_Mapping, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const availableFields: SystemFieldDefinition[] = systemFieldsByType[form.ImportType] || [];

  useEffect(() => {
    if (!availableFields.some((f) => f.field === form.SystemFieldName)) {
      if (availableFields.length > 0) {
        setForm((prev) => ({ ...prev, SystemFieldName: availableFields[0].field }));
      }
    }
  }, [form.ImportType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ExcelHeaderName.trim() || !form.SystemFieldName.trim()) {
      alert('Vui lòng nhập Tên Cột Trong File Excel và chọn Trường Hệ Thống tương ứng.');
      return;
    }
    onSave({
      ...form,
      ExcelHeaderName: form.ExcelHeaderName.trim(),
      SystemFieldName: form.SystemFieldName.trim(),
      Description: form.Description?.trim() || '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              {isNew ? 'Thêm Quy Tắc Ánh Xạ Header Mới' : `Chỉnh Sửa Ánh Xạ: ${form.ExcelHeaderName}`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ghi nhớ quy tắc khớp cột Excel linh hoạt, không phụ thuộc vào thứ tự cột khi upload
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <Field label="Loại Dữ Liệu Import (Module) (*)" helper="Chọn nghiệp vụ Master Data hoặc Fact Data">
            <select
              className={inputCls}
              value={form.ImportType}
              onChange={(e) => set('ImportType', e.target.value as ImportDataType)}
              required
            >
              <optgroup label="Danh Mục Gốc (Master Data)">
                <option value="Material">Nguyên Liệu (tblITEM)</option>
                <option value="Factory">Nhà Máy (tblFACTORY)</option>
                <option value="Supplier">Nhà Cung Cấp (tblNCC / tblVendor)</option>
                <option value="Substitution">Ma Trận Chuyển Đổi (tblItemSubstitution)</option>
              </optgroup>
              <optgroup label="Dữ Liệu Vận Hành (Fact Data)">
                <option value="Forecast">Kế Hoạch Dự Báo (Forecast)</option>
                <option value="SOH">Tồn Kho Thực Tế (SOH)</option>
                <option value="Usage">Tiêu Hao Sản Xuất (Usage)</option>
                <option value="PO_Inbound">Đơn Mua Hàng &amp; Inbound (PO Inbound)</option>
              </optgroup>
            </select>
          </Field>

          <Field
            label="Tên Cột Header Trong File Excel (*)"
            helper="Nhập chính xác hoặc gần đúng tên cột xuất hiện trong file Excel D365 / ERP của bạn"
          >
            <input
              className={`${inputCls} font-mono font-bold text-blue-700`}
              value={form.ExcelHeaderName}
              onChange={(e) => set('ExcelHeaderName', e.target.value)}
              placeholder="Ví dụ: Mã Nhà Máy D365, Tên NCC, Item sales tax group..."
              required
            />
          </Field>

          <Field
            label="Trường Dữ Liệu Hệ Thống Tương Ứng (*)"
            helper="Chọn trường đích trong cơ sở dữ liệu PremixTrack"
          >
            <select
              className={`${inputCls} font-bold`}
              value={form.SystemFieldName}
              onChange={(e) => set('SystemFieldName', e.target.value)}
              required
            >
              {availableFields.map((f) => (
                <option key={f.field} value={f.field}>
                  {f.field} — {f.label_VN} {f.required ? '(* Bắt buộc)' : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mô Tả / Ý Nghĩa Quy Tắc">
            <input
              className={inputCls}
              value={form.Description || ''}
              onChange={(e) => set('Description', e.target.value)}
              placeholder="Ví dụ: Tương thích với báo cáo xuất kho từ SAP / D365 FO..."
            />
          </Field>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Cơ Chế Khớp Linh Hoạt (Fuzzy &amp; Normalized Match)</span>
            </div>
            <p className="text-blue-700">
              Hệ thống tự động loại bỏ dấu tiếng Việt, khoảng trắng thừa và ký tự đặc biệt khi so khớp, giúp template Excel luôn nạp đúng bất kể thứ tự trước sau hay định dạng viết hoa/thường.
            </p>
          </div>

          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 mt-6 rounded-b-3xl flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isNew ? 'Thêm Mới' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL QUẢN LÝ QUY TẮC THAY THẾ TOÀN CỤC (SUBSTITUTION MODAL)
// ─────────────────────────────────────────────────────────────────────────────
function SubstitutionModal({
  item,
  allMaterials,
  onSave,
  onClose,
}: {
  item: Dim_Material_Substitution | null;
  allMaterials: Dim_Material[];
  onSave: (sub: Dim_Material_Substitution) => void;
  onClose: () => void;
}) {
  const isNew = item === null;
  const blank: Dim_Material_Substitution = {
    SubstitutionID: `SUB-${Date.now().toString(36)}`,
    OriginalMaterialCode: allMaterials[0]?.MaterialCode || '',
    OriginalMaterialName: allMaterials[0]?.Name_VN || '',
    SubstituteMaterialCode: allMaterials[1]?.MaterialCode || '',
    SubstituteMaterialName: allMaterials[1]?.Name_VN || '',
    ConversionRatio: 1.0,
    SubstitutionType: 'Ratio_Adjusted',
    Priority: 1,
    DivisionScope: 'ALL',
    IsBiDirectional: false,
    Status: 'Active',
    ApprovedBy: 'Nelly',
    EffectiveDate: new Date().toISOString().split('T')[0],
    Note: '',
  };

  const [form, setForm] = useState<Dim_Material_Substitution>(item ?? blank);
  const set = (k: keyof Dim_Material_Substitution, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleOriginalChange = (code: string) => {
    const origMat = allMaterials.find((m) => m.MaterialCode === code);
    setForm((prev) => ({
      ...prev,
      OriginalMaterialCode: code,
      OriginalMaterialName: origMat?.Name_VN || code,
    }));
  };

  const handleSubstituteChange = (code: string) => {
    const subMat = allMaterials.find((m) => m.MaterialCode === code);
    setForm((prev) => ({
      ...prev,
      SubstituteMaterialCode: code,
      SubstituteMaterialName: subMat?.Name_VN || code,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.OriginalMaterialCode || !form.SubstituteMaterialCode) {
      alert('Vui lòng chọn cả mã nguyên liệu gốc và mã nguyên liệu thay thế.');
      return;
    }
    if (form.OriginalMaterialCode === form.SubstituteMaterialCode) {
      alert('Mã nguyên liệu thay thế không được trùng với mã gốc.');
      return;
    }
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              {isNew ? 'Thêm Quy Tắc Thay Thế Nguyên Liệu Mới' : `Chỉnh Sửa Quy Tắc: ${form.OriginalMaterialCode} ➔ ${form.SubstituteMaterialCode}`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cấu hình chuyển đổi đa nguồn 1-to-N có kèm hệ số quy đổi &amp; độ ưu tiên
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mã Nguyên Liệu Gốc (*)" helper="Chọn nguyên liệu cần tìm nguồn thay thế">
              <select
                className={inputCls}
                value={form.OriginalMaterialCode}
                onChange={(e) => handleOriginalChange(e.target.value)}
                required
              >
                <option value="">-- Chọn mã gốc --</option>
                {allMaterials.map((m) => (
                  <option key={m.MaterialID} value={m.MaterialCode}>
                    {m.MaterialCode} - {m.Name_VN}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Mã Nguyên Liệu Thay Thế (*)" helper="Chọn nguyên liệu thay thế tương đương">
              <select
                className={inputCls}
                value={form.SubstituteMaterialCode}
                onChange={(e) => handleSubstituteChange(e.target.value)}
                required
              >
                <option value="">-- Chọn mã thay thế --</option>
                {allMaterials
                  .filter((m) => m.MaterialCode !== form.OriginalMaterialCode)
                  .map((m) => (
                    <option key={m.MaterialID} value={m.MaterialCode}>
                      {m.MaterialCode} - {m.Name_VN}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Hệ Số Quy Đổi (Conversion Ratio) (*)"
              helper={`1 kg [${form.OriginalMaterialCode || 'Gốc'}] = ${form.ConversionRatio || 1} kg [${form.SubstituteMaterialCode || 'Thay thế'}]`}
            >
              <div className="relative">
                <input
                  className={`${inputCls} font-mono font-bold text-blue-700`}
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={form.ConversionRatio}
                  onChange={(e) => set('ConversionRatio', Number(e.target.value))}
                  required
                />
                <Scale className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </Field>

            <Field label="Loại Chuyển Đổi (Substitution Type)">
              <select
                className={inputCls}
                value={form.SubstitutionType}
                onChange={(e) => set('SubstitutionType', e.target.value as SubstitutionType)}
              >
                <option value="Direct_1_to_1">Thay Ngang 1:1 (Direct)</option>
                <option value="Ratio_Adjusted">Thay Theo Tỉ Lệ Hoạt Tính (Ratio)</option>
                <option value="Formula_Rework">Cần Chạy Lại Công Thức (Rework)</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Thứ Tự Ưu Tiên">
              <select
                className={inputCls}
                value={form.Priority}
                onChange={(e) => set('Priority', Number(e.target.value))}
              >
                <option value={1}>Ưu tiên 1 (Cao nhất)</option>
                <option value={2}>Ưu tiên 2</option>
                <option value={3}>Ưu tiên 3</option>
                <option value={4}>Ưu tiên 4</option>
                <option value={5}>Ưu tiên 5 (Khẩn cấp)</option>
              </select>
            </Field>

            <Field label="Phạm Vi Ngành">
              <select
                className={inputCls}
                value={form.DivisionScope}
                onChange={(e) => set('DivisionScope', e.target.value as any)}
              >
                <option value="ALL">ALL (Toàn quốc)</option>
                <option value="Livestock">Livestock (Gia súc)</option>
                <option value="Aqua">Aqua (Thủy sản)</option>
              </select>
            </Field>

            <Field label="Người Duyệt">
              <input
                className={inputCls}
                value={form.ApprovedBy}
                onChange={(e) => set('ApprovedBy', e.target.value)}
                placeholder="Nelly / Fiona"
              />
            </Field>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.IsBiDirectional}
                  onChange={(e) => set('IsBiDirectional', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Chuyển Đổi 2 Chiều</span>
              </label>
            </div>
          </div>

          <Field label="Ghi Chú Kỹ Thuật Dinh Dưỡng / Ràng Buộc Formulator">
            <input
              className={inputCls}
              value={form.Note || ''}
              onChange={(e) => set('Note', e.target.value)}
              placeholder="Ví dụ: Hàm lượng Lysine tinh khiết 78.8% vs 55.0%. Cần giảm chất mang CaCO3 tương ứng..."
            />
          </Field>

          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 mt-6 rounded-b-3xl flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isNew ? 'Thêm Mới' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL EDIT/ADD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function MaterialModal({
  item,
  allMaterials,
  allSubstitutions = [],
  onSave,
  onDelete,
  onSaveSubstitution,
  onDeleteSubstitution,
  checkDependencies,
  onClose,
}: {
  item: Dim_Material | null;
  allMaterials: Dim_Material[];
  allSubstitutions?: Dim_Material_Substitution[];
  onSave: (m: Dim_Material) => void;
  onDelete?: (materialId: string) => void;
  onSaveSubstitution?: (sub: Dim_Material_Substitution) => void;
  onDeleteSubstitution?: (subId: string) => void;
  checkDependencies?: (m: Dim_Material) => DependencyCheckResult;
  onClose: () => void;
}) {
  const isNew = item === null;
  const blank: Dim_Material = {
    MaterialID: `MAT-NEW-${Date.now()}`,
    MaterialCode: '',
    Name_VN: '',
    Name_EN: '',
    PIC: 'Fiona',
    TaxGroup: 'NonVAT',
    OverdeliveryPct: 0,
    PackingGroup: 'Bags',
    CountryOfOrigin: 'Việt Nam',
    Category: 'Carriers_Minerals',
    Unit: 'kg',
    SafetyStockDays: 14,
    UnitPriceUSD: 1.0,
    Status: 'Active',
    ReplacementMaterialID: null,
    ReplacementMaterialCode: null,
    ReplacementMaterialName: null,
  };
  const [form, setForm] = useState<Dim_Material>(item ?? blank);
  const [deleteWarning, setDeleteWarning] = useState<DependencyCheckResult | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  const [isAddingSub, setIsAddingSub] = useState<boolean>(false);
  const [newSubCode, setNewSubCode] = useState<string>('');
  const [newSubRatio, setNewSubRatio] = useState<number>(1.0);
  const [newSubType, setNewSubType] = useState<SubstitutionType>('Ratio_Adjusted');
  const [newSubPriority, setNewSubPriority] = useState<number>(1);
  const [newSubDivision, setNewSubDivision] = useState<'ALL' | 'Livestock' | 'Aqua'>('ALL');
  const [newSubBiDirectional, setNewSubBiDirectional] = useState<boolean>(false);
  const [newSubApprovedBy, setNewSubApprovedBy] = useState<string>('Nelly');
  const [newSubNote, setNewSubNote] = useState<string>('');

  const set = (k: keyof Dim_Material, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const currentMaterialSubstitutions = item
    ? allSubstitutions.filter(
        (s) =>
          s.OriginalMaterialCode === item.MaterialCode ||
          (s.IsBiDirectional && s.SubstituteMaterialCode === item.MaterialCode)
      )
    : [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.MaterialCode.trim() || !form.Name_VN.trim()) {
      alert('Vui lòng nhập đủ CODE (Mã nguyên liệu) và DESC (Tên nguyên liệu).');
      return;
    }
    const toSave: Dim_Material = {
      ...form,
      MaterialCode: form.MaterialCode.trim(),
      Name_VN: form.Name_VN.trim(),
      Name_EN: form.Name_EN.trim() || form.Name_VN.trim(),
      PIC: form.PIC.trim() || 'Fiona',
      TaxGroup: form.TaxGroup || 'NonVAT',
      PackingGroup: form.PackingGroup || 'Bags',
      CountryOfOrigin: form.CountryOfOrigin.trim() || 'Việt Nam',
    };
    onSave(toSave);
  };

  const handleDeleteClick = () => {
    if (!item) return;
    if (checkDependencies) {
      const check = checkDependencies(item);
      if (!check.canDelete) {
        setDeleteWarning(check);
        setIsConfirmingDelete(false);
        return;
      }
    }
    setDeleteWarning(null);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!item || !onDelete) return;
    onDelete(item.MaterialID);
    onClose();
  };

  const handleAddSubstitutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !newSubCode) {
      alert('Vui lòng chọn mã nguyên liệu thay thế.');
      return;
    }
    if (newSubCode === item.MaterialCode) {
      alert('Mã nguyên liệu thay thế không được trùng với mã gốc.');
      return;
    }
    const subMat = allMaterials.find((m) => m.MaterialCode === newSubCode);
    const newRule: Dim_Material_Substitution = {
      SubstitutionID: `SUB-${item.MaterialCode}-${Date.now().toString(36)}`,
      OriginalMaterialCode: item.MaterialCode,
      OriginalMaterialName: item.Name_VN,
      SubstituteMaterialCode: newSubCode,
      SubstituteMaterialName: subMat?.Name_VN || newSubCode,
      ConversionRatio: Number(newSubRatio) || 1.0,
      SubstitutionType: newSubType,
      Priority: Number(newSubPriority) || 1,
      DivisionScope: newSubDivision,
      IsBiDirectional: newSubBiDirectional,
      Status: 'Active',
      ApprovedBy: newSubApprovedBy || 'Nelly',
      EffectiveDate: new Date().toISOString().split('T')[0],
      Note: newSubNote.trim(),
    };
    onSaveSubstitution?.(newRule);
    setIsAddingSub(false);
    setNewSubCode('');
    setNewSubRatio(1.0);
    setNewSubNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              {isNew
                ? 'Thêm Nguyên Liệu Mới (tblItem)'
                : `Chỉnh Sửa Nguyên Liệu: ${item.MaterialCode} - ${item.Name_VN}`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cấu trúc trường dữ liệu chuẩn hóa D365 FO &amp; Ma trận chuyển đổi đa nguồn 1-to-N
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {deleteWarning && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-900 flex items-center justify-between">
                <span>⛔ Không Thể Xóa Nguyên Liệu {item?.MaterialCode} ({item?.Name_VN})</span>
                <button
                  type="button"
                  onClick={() => setDeleteWarning(null)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1 text-slate-700 font-medium">
                Cơ sở dữ liệu phát hiện nguyên liệu này đang có ràng buộc dữ liệu hoạt động:
              </p>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-red-700 font-bold">
                {deleteWarning.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className="mt-2.5 p-2 bg-white/90 rounded-lg text-[11px] text-slate-600 border border-red-100">
                💡 <strong>Khuyến nghị</strong>: Thay vì xóa vật lý gây đứt gãy công thức BOM và tồn kho lịch sử, bạn nên đổi trạng thái sang <strong>Stop_Usage</strong> hoặc <strong>Phase_Out</strong>.
              </div>
            </div>
          </div>
        )}

        {isConfirmingDelete && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900">
                Xác nhận xóa vĩnh viễn nguyên liệu {item?.MaterialCode} - {item?.Name_VN}?
              </div>
              <p className="mt-1 text-amber-800">
                Mặt hàng này hiện chưa phát sinh tồn kho SOH, công thức BOM hay đơn hàng PO liên quan. Hành động xóa sẽ loại bỏ hoàn toàn mã khỏi hệ thống.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Đồng Ý Xóa Vĩnh Viễn
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy Thao Tác
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <form onSubmit={handleSave} id="material-form" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="CODE (Mã Vật Tư D365) (*)" helper="Ví dụ: 2302020, 2303010, 3201050...">
                <input
                  className={`${inputCls} font-mono font-bold`}
                  value={form.MaterialCode}
                  onChange={(e) => set('MaterialCode', e.target.value)}
                  required
                  placeholder="2302020"
                />
              </Field>

              <Field label="PIC (Chuyên Viên Mua Hàng)" helper="Fiona, Austin, Nelly, Talena, Heidi...">
                <select
                  className={inputCls}
                  value={form.PIC || 'Fiona'}
                  onChange={(e) => set('PIC', e.target.value)}
                >
                  {PIC_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Phân Nhóm (Category)">
                <select
                  className={inputCls}
                  value={form.Category}
                  onChange={(e) => set('Category', e.target.value as MaterialCategory)}
                >
                  {MATERIAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="DESC (Tên Nguyên Liệu Chuẩn D365) (*)">
                <input
                  className={inputCls}
                  value={form.Name_VN}
                  onChange={(e) => set('Name_VN', e.target.value)}
                  required
                  placeholder="DICALCIUM PHOSPHATE_DCP"
                />
              </Field>
              <Field label="Tên Tiếng Anh (English Description)">
                <input
                  className={inputCls}
                  value={form.Name_EN}
                  onChange={(e) => set('Name_EN', e.target.value)}
                  placeholder="Dicalcium Phosphate Feed Grade"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Thuế (Tax Group)" helper="NonVAT, VAT10-Non...">
                <select
                  className={inputCls}
                  value={form.TaxGroup || 'NonVAT'}
                  onChange={(e) => set('TaxGroup', e.target.value)}
                >
                  {TAX_GROUP_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Dung Sai Giao (%)" helper="Overdelivery: 0% hoặc 10%">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  max={100}
                  value={form.OverdeliveryPct}
                  onChange={(e) => set('OverdeliveryPct', Number(e.target.value))}
                />
              </Field>

              <Field label="Quy Cách (Packing)" helper="Bags, Bulk...">
                <select
                  className={inputCls}
                  value={form.PackingGroup || 'Bags'}
                  onChange={(e) => set('PackingGroup', e.target.value)}
                >
                  {PACKING_GROUP_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nước Xuất Xứ (Origin)" helper="Việt Nam, China, India...">
                <input
                  className={inputCls}
                  value={form.CountryOfOrigin || 'Việt Nam'}
                  onChange={(e) => set('CountryOfOrigin', e.target.value)}
                  placeholder="Việt Nam"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Đơn Vị Tính (Unit)">
                <input
                  className={inputCls}
                  value={form.Unit}
                  onChange={(e) => set('Unit', e.target.value)}
                  placeholder="kg"
                />
              </Field>
              <Field label="Định Mức AT (ngày)">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={form.SafetyStockDays}
                  onChange={(e) => set('SafetyStockDays', Number(e.target.value))}
                />
              </Field>
              <Field label="Đơn Giá (USD/kg)">
                <input
                  className={inputCls}
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.UnitPriceUSD}
                  onChange={(e) => set('UnitPriceUSD', Number(e.target.value))}
                />
              </Field>
              <Field label="Trạng Thái D365">
                <select
                  className={inputCls}
                  value={form.Status}
                  onChange={(e) => set('Status', e.target.value as MaterialStatus)}
                >
                  {MATERIAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </form>

          {!isNew && (
            <div className="border border-slate-200 rounded-2xl bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    <span>Ma Trận Chuyển Đổi &amp; Thay Thế Đa Nguồn ({currentMaterialSubstitutions.length} mã tương đương)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Cấu hình chuyển đổi linh hoạt qua lại giữa 4–5 mã nguyên liệu có kèm hệ số quy đổi &amp; thứ tự ưu tiên.
                  </p>
                </div>

                {!isAddingSub && (
                  <button
                    type="button"
                    onClick={() => setIsAddingSub(true)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Mã Thay Thế</span>
                  </button>
                )}
              </div>

              {isAddingSub && (
                <form
                  onSubmit={handleAddSubstitutionSubmit}
                  className="bg-white border border-blue-200 rounded-2xl p-3.5 shadow-sm space-y-3 animate-fade-in"
                >
                  <div className="font-bold text-xs text-blue-900 flex items-center justify-between">
                    <span>Thêm Mã Chuyển Đổi Mới Cho SKU {item.MaterialCode}</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingSub(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Mã Thay Thế (Substitute Item) (*)">
                      <select
                        className={inputCls}
                        value={newSubCode}
                        onChange={(e) => setNewSubCode(e.target.value)}
                        required
                      >
                        <option value="">-- Chọn mã thay thế --</option>
                        {allMaterials
                          .filter((m) => m.MaterialCode !== item.MaterialCode)
                          .map((m) => (
                            <option key={m.MaterialID} value={m.MaterialCode}>
                              {m.MaterialCode} - {m.Name_VN} ({m.Category})
                            </option>
                          ))}
                      </select>
                    </Field>

                    <Field
                      label="Hệ Số Quy Đổi (Conversion Ratio) (*)"
                      helper={`1 kg [${item.MaterialCode}] = ${newSubRatio || 1} kg [Mã thay thế]`}
                    >
                      <div className="relative">
                        <input
                          className={`${inputCls} font-mono font-bold text-blue-700`}
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={newSubRatio}
                          onChange={(e) => setNewSubRatio(Number(e.target.value))}
                          required
                        />
                        <Scale className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                    </Field>

                    <Field label="Loại Thay Thế (Type)">
                      <select
                        className={inputCls}
                        value={newSubType}
                        onChange={(e) => setNewSubType(e.target.value as SubstitutionType)}
                      >
                        <option value="Direct_1_to_1">Thay Ngang 1:1 (Direct)</option>
                        <option value="Ratio_Adjusted">Thay Theo Tỉ Lệ Hoạt Tính (Ratio)</option>
                        <option value="Formula_Rework">Cần Chạy Lại Công Thức (Rework)</option>
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Thứ Tự Ưu Tiên (Priority)">
                      <select
                        className={inputCls}
                        value={newSubPriority}
                        onChange={(e) => setNewSubPriority(Number(e.target.value))}
                      >
                        <option value={1}>Ưu tiên 1 (Cao nhất)</option>
                        <option value={2}>Ưu tiên 2</option>
                        <option value={3}>Ưu tiên 3</option>
                        <option value={4}>Ưu tiên 4</option>
                        <option value={5}>Ưu tiên 5 (Khẩn cấp)</option>
                      </select>
                    </Field>

                    <Field label="Phạm Vi Ngành (Scope)">
                      <select
                        className={inputCls}
                        value={newSubDivision}
                        onChange={(e) => setNewSubDivision(e.target.value as any)}
                      >
                        <option value="ALL">ALL (Tất cả nhà máy)</option>
                        <option value="Livestock">Livestock (Gia súc)</option>
                        <option value="Aqua">Aqua (Thủy sản)</option>
                      </select>
                    </Field>

                    <Field label="Người Duyệt (Approved By)">
                      <input
                        className={inputCls}
                        value={newSubApprovedBy}
                        onChange={(e) => setNewSubApprovedBy(e.target.value)}
                        placeholder="Nelly / Fiona"
                      />
                    </Field>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={newSubBiDirectional}
                          onChange={(e) => setNewSubBiDirectional(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Chuyển Đổi 2 Chiều</span>
                      </label>
                    </div>
                  </div>

                  <Field label="Ghi Chú Kỹ Thuật Dinh Dưỡng / Ràng Buộc Formulator">
                    <input
                      className={inputCls}
                      value={newSubNote}
                      onChange={(e) => setNewSubNote(e.target.value)}
                      placeholder="Ví dụ: Hàm lượng Lysine tinh khiết 78.8% vs 55.0%. Cần giảm chất mang CaCO3 tương ứng..."
                    />
                  </Field>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingSub(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Lưu Quy Tắc</span>
                    </button>
                  </div>
                </form>
              )}

              {currentMaterialSubstitutions.length > 0 ? (
                <div className="space-y-2">
                  {currentMaterialSubstitutions.map((sub) => {
                    const isDirect = sub.OriginalMaterialCode === item.MaterialCode;
                    const counterpartCode = isDirect
                      ? sub.SubstituteMaterialCode
                      : sub.OriginalMaterialCode;
                    const counterpartMat = allMaterials.find(
                      (m) => m.MaterialCode === counterpartCode
                    );
                    const typeCfg =
                      SUBSTITUTION_TYPE_LABELS[sub.SubstitutionType] ||
                      SUBSTITUTION_TYPE_LABELS.Direct_1_to_1;

                    return (
                      <div
                        key={sub.SubstitutionID}
                        className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between gap-3 shadow-2xs hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                            Ưu tiên #{sub.Priority}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-blue-700">
                                {counterpartCode}
                              </span>
                              <span className="font-bold text-slate-900 truncate">
                                {counterpartMat?.Name_VN || sub.SubstituteMaterialName}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded font-semibold text-[10px] border ${typeCfg.bg} ${typeCfg.text}`}
                              >
                                {typeCfg.label}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                              <span>
                                Hệ số quy đổi:{' '}
                                <strong className="font-mono text-slate-800">
                                  {sub.ConversionRatio}x
                                </strong>{' '}
                                <span className="text-[10px] text-slate-400">
                                  (1 kg {item.MaterialCode} = {sub.ConversionRatio} kg{' '}
                                  {counterpartCode})
                                </span>
                              </span>
                              <span>• Phạm vi: <strong>{sub.DivisionScope}</strong></span>
                              <span>• Duyệt: <strong>{sub.ApprovedBy}</strong></span>
                            </div>

                            {sub.Note && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">
                                📝 {sub.Note}
                              </div>
                            )}
                          </div>
                        </div>

                        {onDeleteSubstitution && (
                          <button
                            type="button"
                            onClick={() => onDeleteSubstitution(sub.SubstitutionID)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa quy tắc thay thế này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Chưa có mã thay thế nào được liên kết. Bấm <strong>"+ Thêm Mã Thay Thế"</strong> để thiết lập ma trận chuyển đổi.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-2">
          {!isNew && onDelete ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Kiểm tra ràng buộc và xóa nguyên liệu khỏi hệ thống"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Nguyên Liệu</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="material-form"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isNew ? 'Thêm Mới' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY EDIT/ADD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FactoryModal({
  item,
  onSave,
  onDelete,
  checkDependencies,
  onClose,
}: {
  item: Dim_Factory | null;
  onSave: (f: Dim_Factory) => void;
  onDelete?: (factoryId: string) => void;
  checkDependencies?: (fac: Dim_Factory) => DependencyCheckResult;
  onClose: () => void;
}) {
  const isNew = item === null;
  const blank: Dim_Factory = {
    FactoryID: `FAC-NEW-${Date.now()}`,
    InternalCode: '',
    FactoryName_VN: '',
    FactoryName_EN: '',
    RegionID: 'SOUTH',
    Division: 'Livestock',
    WarehouseCode: '',
    CustomerVendorRef: '',
    SiteCode: 'dhv',
    ForecastHeaderCode: '',
    Address: '',
    CapacityTonsPerMonth: 25000,
  };
  const [form, setForm] = useState<Dim_Factory>(item ?? blank);
  const [deleteWarning, setDeleteWarning] = useState<DependencyCheckResult | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  const set = (k: keyof Dim_Factory, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.InternalCode.trim() || !form.FactoryName_VN.trim()) {
      alert('Vui lòng nhập đủ FACTORY (Mã nhà máy) và DESC (Tên nhà máy).');
      return;
    }
    const toSave: Dim_Factory = {
      ...form,
      InternalCode: form.InternalCode.trim().toUpperCase(),
      WarehouseCode: form.WarehouseCode.trim().toUpperCase() || form.InternalCode.trim().toUpperCase(),
      ForecastHeaderCode: form.ForecastHeaderCode.trim() || form.InternalCode.trim().toUpperCase(),
      CustomerVendorRef: form.CustomerVendorRef.trim().toUpperCase(),
      SiteCode: form.SiteCode.trim().toLowerCase(),
    };
    onSave(toSave);
  };

  const handleDeleteClick = () => {
    if (!item) return;
    if (checkDependencies) {
      const check = checkDependencies(item);
      if (!check.canDelete) {
        setDeleteWarning(check);
        setIsConfirmingDelete(false);
        return;
      }
    }
    setDeleteWarning(null);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!item || !onDelete) return;
    onDelete(item.FactoryID);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-600" />
              {isNew ? 'Thêm Nhà Máy Mới (tblFactory)' : `Chỉnh Sửa Nhà Máy: ${item.InternalCode} - ${item.FactoryName_VN}`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cấu trúc trường dữ liệu chuẩn hóa 100% theo D365 FO (tblFACTORY)
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {deleteWarning && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-900 flex items-center justify-between">
                <span>⛔ Không Thể Xóa Nhà Máy {item?.InternalCode} ({item?.FactoryName_VN})</span>
                <button
                  type="button"
                  onClick={() => setDeleteWarning(null)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1 text-slate-700 font-medium">
                Cơ sở dữ liệu phát hiện các ràng buộc nghiệp vụ đang liên kết trực tiếp với nhà máy này:
              </p>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-red-700 font-bold">
                {deleteWarning.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className="mt-2.5 p-2 bg-white/90 rounded-lg text-[11px] text-slate-600 border border-red-100">
                💡 <strong>Giải pháp</strong>: Vui lòng điều chuyển / xuất hết tồn kho SOH, hoàn tất các lịch giao hàng hoặc phân bổ lại kế hoạch Forecast trước khi thực hiện xóa.
              </div>
            </div>
          </div>
        )}

        {isConfirmingDelete && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900">
                Xác nhận xóa vĩnh viễn nhà máy {item?.InternalCode} - {item?.FactoryName_VN}?
              </div>
              <p className="mt-1 text-amber-800">
                Nhà máy này hiện không có dữ liệu tồn kho SOH hay phát sinh giao dịch ràng buộc. Hành động xóa sẽ loại bỏ hoàn toàn cơ sở này khỏi hệ thống.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Đồng Ý Xóa Vĩnh Viễn
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy Thao Tác
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="FACTORY (Mã Nhà Máy D365) (*)" helper="Ví dụ: BHA, DBD, DDN, DNA, DVP, HPG2...">
              <input
                className={`${inputCls} font-mono font-bold uppercase`}
                value={form.InternalCode}
                onChange={(e) => set('InternalCode', e.target.value)}
                required
                placeholder="DBD"
              />
            </Field>
            <Field label="DESC (Tên Nhà Máy / Mô Tả) (*)" helper="Ví dụ: PC Biên Hòa, DH Bình Dương, Vĩnh Long 2...">
              <input
                className={inputCls}
                value={form.FactoryName_VN}
                onChange={(e) => set('FactoryName_VN', e.target.value)}
                required
                placeholder="DH Bình Dương"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="REGION (Vùng Miền)" helper="SOUTH: Miền Nam, NORTH: Miền Bắc">
              <select
                className={inputCls}
                value={form.RegionID.replace('REG-', '')}
                onChange={(e) => set('RegionID', e.target.value)}
              >
                {REGION_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Division (Ngành Sản Xuất)" helper="Livestock (Gia súc), Aqua (Thủy sản)">
              <select
                className={inputCls}
                value={form.Division || 'Livestock'}
                onChange={(e) => set('Division', e.target.value as FactoryDivision)}
              >
                {DIVISION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="WAREHOUSE (Mã Điểm Kho)" helper="Ví dụ: DBD, PBQ (với PBD), DNAN (với DNA)...">
              <input
                className={`${inputCls} font-mono uppercase`}
                value={form.WarehouseCode || form.InternalCode}
                onChange={(e) => set('WarehouseCode', e.target.value)}
                placeholder="DBD"
              />
            </Field>
            <Field label="Customer or vendor reference" helper="Mã tham chiếu đối tác D365 (VD: DH036, DH002...)">
              <input
                className={`${inputCls} font-mono uppercase`}
                value={form.CustomerVendorRef || ''}
                onChange={(e) => set('CustomerVendorRef', e.target.value)}
                placeholder="DH002"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Site (Mã Pháp Nhân / Site D365)" helper="pbh: Premix BH, dhv: De Heus VN, php: Premix HP">
              <select
                className={`${inputCls} font-mono`}
                value={form.SiteCode || 'dhv'}
                onChange={(e) => set('SiteCode', e.target.value)}
              >
                {SITE_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Công Suất (Tấn/Tháng)" helper="Định mức công suất tối đa của nhà máy">
              <input
                className={inputCls}
                type="number"
                min={0}
                value={form.CapacityTonsPerMonth}
                onChange={(e) => set('CapacityTonsPerMonth', Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Địa Chỉ / Vị Trí Nhà Máy (Address)" helper="Tùy chọn ghi chú vị trí khu công nghiệp">
            <input
              className={inputCls}
              value={form.Address}
              onChange={(e) => set('Address', e.target.value)}
              placeholder="KCN VSIP II, TX. Tân Uyên, Bình Dương"
            />
          </Field>
        </form>

        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-2">
          {!isNew && onDelete ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Kiểm tra ràng buộc và xóa nhà máy khỏi hệ thống"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Nhà Máy</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isNew ? 'Thêm Mới' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER EDIT/ADD MODAL (tblNCC / D365 VENDORS)
// ─────────────────────────────────────────────────────────────────────────────
function SupplierModal({
  item,
  onSave,
  onDelete,
  checkDependencies,
  onClose,
}: {
  item: Dim_Supplier | null;
  onSave: (s: Dim_Supplier) => void;
  onDelete?: (supplierId: string) => void;
  checkDependencies?: (sup: Dim_Supplier) => DependencyCheckResult;
  onClose: () => void;
}) {
  const isNew = item === null;
  const blank: Dim_Supplier = {
    SupplierID: `SUP-NEW-${Date.now()}`,
    SupplierType: 'LOCAL',
    ShortName: '',
    SupplierCode: '',
    SupplierName: '',
    ContractNo: '_',
    Incoterm: 'DDP',
    PaymentTerms: 'Net 30',
    Email: '',
    Note_0: '',
    Note_1: '',
    Country: 'Việt Nam',
    LeadTimeDays: 7,
    Rating: 4.8,
  };

  const [form, setForm] = useState<Dim_Supplier>(item ?? blank);
  const [deleteWarning, setDeleteWarning] = useState<DependencyCheckResult | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  const set = (k: keyof Dim_Supplier, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.SupplierCode.trim() || !form.SupplierName.trim() || !form.ShortName.trim()) {
      alert('Vui lòng nhập đủ NCC (Short Name), CODE và DESC (Tên công ty).');
      return;
    }
    const toSave: Dim_Supplier = {
      ...form,
      ShortName: form.ShortName.trim(),
      SupplierCode: form.SupplierCode.trim(),
      SupplierName: form.SupplierName.trim(),
      ContractNo: form.ContractNo?.trim() || '_',
      Incoterm: form.Incoterm?.trim() || 'DDP',
      PaymentTerms: form.PaymentTerms?.trim() || 'Net 30',
      Email: form.Email?.trim() || '',
      Note_0: form.Note_0?.trim() || '',
      Note_1: form.Note_1?.trim() || '',
    };
    onSave(toSave);
  };

  const handleDeleteClick = () => {
    if (!item) return;
    if (checkDependencies) {
      const check = checkDependencies(item);
      if (!check.canDelete) {
        setDeleteWarning(check);
        setIsConfirmingDelete(false);
        return;
      }
    }
    setDeleteWarning(null);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!item || !onDelete) return;
    onDelete(item.SupplierID);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              {isNew ? 'Thêm Nhà Cung Cấp Mới (tblNCC)' : `Chỉnh Sửa NCC: ${item.ShortName} (${item.SupplierCode})`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cấu trúc trường dữ liệu chuẩn hóa D365 FO (tblNCC / tblVendor)
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {deleteWarning && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-900 flex items-center justify-between">
                <span>⛔ Không Thể Xóa Nhà Cung Cấp {item?.ShortName} ({item?.SupplierCode})</span>
                <button
                  type="button"
                  onClick={() => setDeleteWarning(null)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1 text-slate-700 font-medium">
                Cơ sở dữ liệu phát hiện các ràng buộc nghiệp vụ đang liên kết trực tiếp:
              </p>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-red-700 font-bold">
                {deleteWarning.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {isConfirmingDelete && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900">
                Xác nhận xóa vĩnh viễn nhà cung cấp {item?.ShortName} - {item?.SupplierCode}?
              </div>
              <p className="mt-1 text-amber-800">
                Nhà cung cấp này hiện chưa có đơn đặt hàng PO nào liên kết. Hành động xóa sẽ loại bỏ hoàn toàn đối tác này khỏi danh mục.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Đồng Ý Xóa Vĩnh Viễn
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy Thao Tác
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Nguồn Cung Ứng (*)" helper="IMPORT: Nhập khẩu, LOCAL: Nội địa">
              <select
                className={inputCls}
                value={form.SupplierType || 'LOCAL'}
                onChange={(e) => set('SupplierType', e.target.value as SupplierType)}
              >
                <option value="IMPORT">IMPORT (Nhập khẩu)</option>
                <option value="LOCAL">LOCAL (Nội địa)</option>
              </select>
            </Field>

            <Field label="NCC (Short Name) (*)" helper="Ví dụ: EVONIK, Meihua, ĐỨC GIANG...">
              <input
                className={`${inputCls} font-bold`}
                value={form.ShortName}
                onChange={(e) => set('ShortName', e.target.value)}
                required
                placeholder="EVONIK"
              />
            </Field>

            <Field label="CODE (Mã NCC D365) (*)" helper="Ví dụ: 1006576, 1030068...">
              <input
                className={`${inputCls} font-mono font-bold text-blue-700`}
                value={form.SupplierCode}
                onChange={(e) => set('SupplierCode', e.target.value)}
                required
                placeholder="1030068"
              />
            </Field>
          </div>

          <Field label="DESC (Tên Đầy Đủ Công Ty Nhà Cung Cấp) (*)">
            <input
              className={inputCls}
              value={form.SupplierName}
              onChange={(e) => set('SupplierName', e.target.value)}
              required
              placeholder="Công Ty TNHH Evonik Việt Nam"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="HĐNT (Số Hợp Đồng)" helper="Ví dụ: 14/HĐMH-2023 hoặc _">
              <input
                className={`${inputCls} font-mono`}
                value={form.ContractNo || '_'}
                onChange={(e) => set('ContractNo', e.target.value)}
                placeholder="14/HĐMH-2023"
              />
            </Field>

            <Field label="Incoterm">
              <select
                className={`${inputCls} font-mono`}
                value={form.Incoterm || 'DDP'}
                onChange={(e) => set('Incoterm', e.target.value)}
              >
                {INCOTERM_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Terms of payment">
              <input
                className={inputCls}
                value={form.PaymentTerms || 'Net 30'}
                onChange={(e) => set('PaymentTerms', e.target.value)}
                placeholder="Net 30"
              />
            </Field>
          </div>

          <Field label="MAIL (Email Liên Hệ / Kế Toán Công Nợ)" helper="Email nhận PO hoặc đối chiếu công nợ">
            <input
              className={inputCls}
              type="email"
              value={form.Email || ''}
              onChange={(e) => set('Email', e.target.value)}
              placeholder="tam.luong@evonik.com"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ghi Chú 1 (Note_0)">
              <input
                className={inputCls}
                value={form.Note_0 || ''}
                onChange={(e) => set('Note_0', e.target.value)}
                placeholder="Ghi chú điều khoản giao hàng..."
              />
            </Field>
            <Field label="Ghi Chú 2 (Note_1)">
              <input
                className={inputCls}
                value={form.Note_1 || ''}
                onChange={(e) => set('Note_1', e.target.value)}
                placeholder="Ghi chú khác..."
              />
            </Field>
          </div>
        </form>

        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-2">
          {!isNew && onDelete ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Kiểm tra ràng buộc và xóa nhà cung cấp khỏi hệ thống"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Nhà Cung Cấp</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isNew ? 'Thêm Mới' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  initialSubTab = 'materials',
  factories,
  materials,
  suppliers,
  formulas = [],
  substitutions = [],
  learnedMappings,
  inventorySOH = [],
  forecastDetails = [],
  usageLogs = [],
  inboundSchedules = [],
  poHeaders = [],
  poDetails = [],
  onUpdateMaterials,
  onDeleteMaterial,
  onUpdateFactories,
  onDeleteFactory,
  onUpdateSuppliers,
  onDeleteSupplier,
  onUpdateSubstitutions,
  onSaveMapping,
  onDeleteMapping,
  language,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'materials' | 'factories' | 'suppliers' | 'substitutions' | 'mappings'
  >(initialSubTab);
  const [isHeaderSummaryExpanded, setIsHeaderSummaryExpanded] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('ALL');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedPICFilter, setSelectedPICFilter] = useState<string>('ALL');
  const [selectedSubTypeFilter, setSelectedSubTypeFilter] = useState<string>('ALL');
  const [selectedSupplierTypeFilter, setSelectedSupplierTypeFilter] = useState<string>('ALL');
  const [selectedIncotermFilter, setSelectedIncotermFilter] = useState<string>('ALL');
  const [selectedMappingTypeFilter, setSelectedMappingTypeFilter] = useState<string>('ALL');
  const [isAliasReferenceOpen, setIsAliasReferenceOpen] = useState<boolean>(false);

  // Refs for sticky table scroll containers (used by floating Home / End navigation buttons)
  const matTableRef = useRef<HTMLDivElement>(null);
  const subTableRef = useRef<HTMLDivElement>(null);
  const facTableRef = useRef<HTMLDivElement>(null);
  const supTableRef = useRef<HTMLDivElement>(null);
  const mapTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [matModal, setMatModal] = useState<{ open: boolean; item: Dim_Material | null }>({
    open: false,
    item: null,
  });
  const [facModal, setFacModal] = useState<{ open: boolean; item: Dim_Factory | null }>({
    open: false,
    item: null,
  });
  const [supModal, setSupModal] = useState<{ open: boolean; item: Dim_Supplier | null }>({
    open: false,
    item: null,
  });
  const [subModal, setSubModal] = useState<{
    open: boolean;
    item: Dim_Material_Substitution | null;
  }>({
    open: false,
    item: null,
  });
  const [mappingModal, setMappingModal] = useState<{
    open: boolean;
    item: Sys_Import_Mapping | null;
  }>({
    open: false,
    item: null,
  });

  const checkMaterialDependencies = (mat: Dim_Material): DependencyCheckResult => {
    const matId = mat.MaterialID;
    const matCode = mat.MaterialCode;
    const matchMat = (id?: string) => id === matId || id === matCode;

    const sohCount = (inventorySOH || []).filter((s) => matchMat(s.MaterialID)).length;
    const fcCount = (forecastDetails || []).filter((f) => matchMat(f.MaterialID)).length;
    const usageCount = (usageLogs || []).filter((u) => matchMat(u.MaterialID)).length;
    const bomCount = (formulas || []).filter((b) =>
      (b.Items || []).some((item) => matchMat(item.MaterialID))
    ).length;
    const poCount = (poDetails || []).filter((p) => matchMat(p.MaterialID)).length;
    const subCount = (substitutions || []).filter(
      (s) => s.OriginalMaterialCode === matCode || s.SubstituteMaterialCode === matCode
    ).length;

    const reasons: string[] = [];
    if (sohCount > 0) reasons.push(`${sohCount} bản ghi Tồn kho thực tế (SOH) tại các nhà máy`);
    if (fcCount > 0) reasons.push(`${fcCount} dòng Dự báo nhu cầu kế hoạch (Forecast)`);
    if (bomCount > 0) reasons.push(`${bomCount} Công thức sản xuất (Formula BOM) đang sử dụng`);
    if (usageCount > 0) reasons.push(`${usageCount} nhật ký Tiêu hao sản xuất (Usage Logs)`);
    if (poCount > 0) reasons.push(`${poCount} Đơn đặt hàng mua (PO Details)`);
    if (subCount > 0)
      reasons.push(`${subCount} quy tắc trong Ma Trận Thay Thế Nguyên Liệu (Substitution Rules)`);

    return {
      canDelete: reasons.length === 0,
      reasons,
      summary: reasons.join(', '),
    };
  };

  const checkFactoryDependencies = (fac: Dim_Factory): DependencyCheckResult => {
    const facId = fac.FactoryID;
    const intCode = fac.InternalCode.toUpperCase();
    const match = (id?: string) =>
      id === facId || id === `FAC-${intCode}` || (id && id.toUpperCase() === intCode);

    const sohCount = (inventorySOH || []).filter((s) => match(s.FactoryID)).length;
    const fcCount = (forecastDetails || []).filter((f) => match(f.FactoryID)).length;
    const usageCount = (usageLogs || []).filter((u) => match(u.FactoryID)).length;
    const inboundCount = (inboundSchedules || []).filter((i) => match(i.FactoryID)).length;
    const poCount = (poHeaders || []).filter((p) => match(p.DestinationFactoryID)).length;

    const reasons: string[] = [];
    if (sohCount > 0) reasons.push(`${sohCount} bản ghi Tồn kho thực tế (SOH)`);
    if (fcCount > 0) reasons.push(`${fcCount} dòng Dự báo nhu cầu (Forecast Details)`);
    if (usageCount > 0) reasons.push(`${usageCount} nhật ký Tiêu hao sản xuất (Usage Logs)`);
    if (inboundCount > 0) reasons.push(`${inboundCount} lịch Giao hàng / Cân xe (Inbound Schedules)`);
    if (poCount > 0) reasons.push(`${poCount} Đơn đặt hàng liên quan (Purchase Orders)`);

    return {
      canDelete: reasons.length === 0,
      reasons,
      summary: reasons.join(', '),
    };
  };

  const checkSupplierDependencies = (sup: Dim_Supplier): DependencyCheckResult => {
    const supId = sup.SupplierID;
    const supCode = sup.SupplierCode;
    const poCount = (poHeaders || []).filter(
      (p) => p.SupplierID === supId || p.SupplierID === supCode || p.SupplierID === `SUP-${supCode}`
    ).length;

    const reasons: string[] = [];
    if (poCount > 0) reasons.push(`${poCount} Đơn đặt hàng mua (Purchase Orders) liên kết`);

    return {
      canDelete: reasons.length === 0,
      reasons,
      summary: reasons.join(', '),
    };
  };

  // ── Dynamic Excel Upload Hooks with Header Matcher & Unmapped Stripping ────
  const matHeaders = [
    'CODE',
    'DESC',
    'PIC',
    'Item sales tax group',
    'Overdelivery (%)',
    'Packing group',
    'CountryOfOrigin',
    'Category',
    'Unit',
    'SafetyStockDays',
    'UnitPriceUSD',
    'Status',
  ];
  const matUpload = useExcelUpload<Dim_Material>(
    'Material',
    matHeaders,
    learnedMappings,
    (rows) => {
      const existingMap = new Map<string, Dim_Material>(
        materials.map((m) => [m.MaterialCode.toUpperCase(), m])
      );
      rows.forEach((r) => {
        if (!r.MaterialCode) return;
        const codeUpper = r.MaterialCode.toUpperCase();
        const prev = existingMap.get(codeUpper);
        const itemToSave: Dim_Material = {
          MaterialID: prev?.MaterialID || `MAT-${r.MaterialCode}`,
          MaterialCode: r.MaterialCode,
          Name_VN: r.Name_VN || r.MaterialCode,
          Name_EN: r.Name_EN || r.Name_VN || r.MaterialCode,
          PIC: r.PIC || prev?.PIC || 'Fiona',
          TaxGroup: r.TaxGroup || prev?.TaxGroup || 'NonVAT',
          OverdeliveryPct: Number(r.OverdeliveryPct ?? prev?.OverdeliveryPct ?? 0),
          PackingGroup: r.PackingGroup || prev?.PackingGroup || 'Bags',
          CountryOfOrigin: r.CountryOfOrigin || prev?.CountryOfOrigin || 'Việt Nam',
          Category: (r.Category as MaterialCategory) || prev?.Category || 'Carriers_Minerals',
          Unit: r.Unit || prev?.Unit || 'kg',
          SafetyStockDays: Number(r.SafetyStockDays ?? prev?.SafetyStockDays ?? 14),
          UnitPriceUSD: Number(r.UnitPriceUSD ?? prev?.UnitPriceUSD ?? 1.0),
          Status: (r.Status as MaterialStatus) || prev?.Status || 'Active',
        };
        existingMap.set(codeUpper, itemToSave);
      });
      onUpdateMaterials(Array.from(existingMap.values()));
    }
  );

  const facHeaders = [
    'FACTORY',
    'DESC',
    'REGION',
    'Division',
    'WAREHOUSE',
    'Customer or vendor reference',
    'Site',
    'CapacityTonsPerMonth',
    'Address',
  ];
  const facUpload = useExcelUpload<Dim_Factory>(
    'Factory',
    facHeaders,
    learnedMappings,
    (rows) => {
      const existingMap = new Map<string, Dim_Factory>(
        factories.map((f) => [f.InternalCode.toUpperCase(), f])
      );
      rows.forEach((r) => {
        if (!r.InternalCode) return;
        const codeUpper = r.InternalCode.toUpperCase();
        const prev = existingMap.get(codeUpper);
        const facToSave: Dim_Factory = {
          FactoryID: prev?.FactoryID || `FAC-${r.InternalCode.toUpperCase()}`,
          InternalCode: r.InternalCode.toUpperCase(),
          FactoryName_VN: r.FactoryName_VN || r.InternalCode,
          FactoryName_EN: r.FactoryName_EN || r.FactoryName_VN || r.InternalCode,
          RegionID: (r.RegionID || prev?.RegionID || 'SOUTH').toUpperCase().replace('REG-', ''),
          Division: (r.Division as FactoryDivision) || prev?.Division || 'Livestock',
          WarehouseCode: (r.WarehouseCode || r.InternalCode).toUpperCase(),
          CustomerVendorRef: (r.CustomerVendorRef || prev?.CustomerVendorRef || '').toUpperCase(),
          SiteCode: (r.SiteCode || prev?.SiteCode || 'dhv').toLowerCase(),
          ForecastHeaderCode: r.InternalCode.toUpperCase(),
          Address: r.Address || prev?.Address || '',
          CapacityTonsPerMonth: Number(r.CapacityTonsPerMonth ?? prev?.CapacityTonsPerMonth ?? 25000),
        };
        existingMap.set(codeUpper, facToSave);
      });
      onUpdateFactories?.(Array.from(existingMap.values()));
    }
  );

  const supHeaders = [
    'NCC (short name)',
    'CODE',
    'DESC',
    'HĐNT',
    'Incoterm',
    'Terms of payment',
    'MAIL',
    'Note_0',
    'Note_1',
    'SupplierType',
  ];
  const supUpload = useExcelUpload<Dim_Supplier>(
    'Supplier',
    supHeaders,
    learnedMappings,
    (rows) => {
      const existingMap = new Map<string, Dim_Supplier>(
        suppliers.map((s) => [s.SupplierCode.toUpperCase(), s])
      );
      rows.forEach((r) => {
        if (!r.SupplierCode) return;
        const codeUpper = r.SupplierCode.toUpperCase();
        const prev = existingMap.get(codeUpper);
        const supToSave: Dim_Supplier = {
          SupplierID: prev?.SupplierID || `SUP-${r.SupplierCode}`,
          SupplierType: (String(r.SupplierType || '').toUpperCase() === 'IMPORT' ? 'IMPORT' : 'LOCAL') as SupplierType,
          ShortName: r.ShortName || r.SupplierCode,
          SupplierCode: r.SupplierCode,
          SupplierName: r.SupplierName || r.ShortName || r.SupplierCode,
          ContractNo: r.ContractNo || prev?.ContractNo || '_',
          Incoterm: r.Incoterm || prev?.Incoterm || 'DDP',
          PaymentTerms: r.PaymentTerms || prev?.PaymentTerms || 'Net 30',
          Email: r.Email || prev?.Email || '',
          Note_0: r.Note_0 || prev?.Note_0 || '',
          Note_1: r.Note_1 || prev?.Note_1 || '',
          Country: r.SupplierType === 'IMPORT' ? 'Quốc Tế' : 'Việt Nam',
          LeadTimeDays: r.SupplierType === 'IMPORT' ? 30 : 7,
          Rating: 4.8,
        };
        existingMap.set(codeUpper, supToSave);
      });
      onUpdateSuppliers?.(Array.from(existingMap.values()));
    }
  );

  const subHeaders = [
    'OriginalMaterialCode',
    'SubstituteMaterialCode',
    'ConversionRatio',
    'SubstitutionType',
    'Priority',
    'DivisionScope',
    'IsBiDirectional',
    'ApprovedBy',
    'Note',
  ];
  const subUpload = useExcelUpload<Dim_Material_Substitution>(
    'Substitution',
    subHeaders,
    learnedMappings,
    (rows) => {
      const validRows = rows
        .filter((r) => r.OriginalMaterialCode && r.SubstituteMaterialCode)
        .map((r) => {
          const origMat = materials.find((m) => m.MaterialCode === r.OriginalMaterialCode);
          const subMat = materials.find((m) => m.MaterialCode === r.SubstituteMaterialCode);
          return {
            SubstitutionID: `SUB-${r.OriginalMaterialCode}-${r.SubstituteMaterialCode}-${Date.now().toString(36)}`,
            OriginalMaterialCode: r.OriginalMaterialCode,
            OriginalMaterialName: origMat?.Name_VN || r.OriginalMaterialCode,
            SubstituteMaterialCode: r.SubstituteMaterialCode,
            SubstituteMaterialName: subMat?.Name_VN || r.SubstituteMaterialCode,
            ConversionRatio: Number(r.ConversionRatio) || 1.0,
            SubstitutionType: (r.SubstitutionType as SubstitutionType) || 'Ratio_Adjusted',
            Priority: Number(r.Priority) || 1,
            DivisionScope: (r.DivisionScope || 'ALL') as 'ALL' | 'Livestock' | 'Aqua',
            IsBiDirectional: Boolean(r.IsBiDirectional),
            Status: 'Active' as const,
            ApprovedBy: r.ApprovedBy || 'Nelly',
            EffectiveDate: new Date().toISOString().split('T')[0],
            Note: r.Note || '',
          };
        });
      onUpdateSubstitutions?.([...substitutions, ...validRows]);
    }
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const saveMaterial = (m: Dim_Material) => {
    const exists = materials.some(
      (x) => x.MaterialID === m.MaterialID || x.MaterialCode === m.MaterialCode
    );
    if (exists) {
      onUpdateMaterials(
        materials.map((x) =>
          x.MaterialID === m.MaterialID || x.MaterialCode === m.MaterialCode ? m : x
        )
      );
    } else {
      onUpdateMaterials([...materials, m]);
    }
    setMatModal({ open: false, item: null });
  };

  const saveFactory = (f: Dim_Factory) => {
    const exists = factories.some((x) => x.FactoryID === f.FactoryID || x.InternalCode === f.InternalCode);
    if (exists) {
      onUpdateFactories?.(
        factories.map((x) =>
          x.FactoryID === f.FactoryID || x.InternalCode === f.InternalCode ? f : x
        )
      );
    } else {
      onUpdateFactories?.([...factories, f]);
    }
    setFacModal({ open: false, item: null });
  };

  const saveSupplier = (s: Dim_Supplier) => {
    const exists = suppliers.some((x) => x.SupplierID === s.SupplierID || x.SupplierCode === s.SupplierCode);
    if (exists) {
      onUpdateSuppliers?.(
        suppliers.map((x) =>
          x.SupplierID === s.SupplierID || x.SupplierCode === s.SupplierCode ? s : x
        )
      );
    } else {
      onUpdateSuppliers?.([...suppliers, s]);
    }
    setSupModal({ open: false, item: null });
  };

  const saveSubstitution = (sub: Dim_Material_Substitution) => {
    const exists = substitutions.some((s) => s.SubstitutionID === sub.SubstitutionID);
    let next: Dim_Material_Substitution[];
    if (exists) {
      next = substitutions.map((s) => (s.SubstitutionID === sub.SubstitutionID ? sub : s));
    } else {
      next = [...substitutions, sub];
    }
    onUpdateSubstitutions?.(next);
  };

  const deleteSubstitution = (subId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quy tắc thay thế nguyên liệu này?')) {
      const next = substitutions.filter((s) => s.SubstitutionID !== subId);
      onUpdateSubstitutions?.(next);
    }
  };

  const toggleMaterialStatus = (materialId: string) => {
    const updated = materials.map((m) => {
      if (m.MaterialID === materialId) {
        const nextStatus: MaterialStatus = m.Status === 'Active' ? 'Stop_Usage' : 'Active';
        return { ...m, Status: nextStatus };
      }
      return m;
    });
    onUpdateMaterials(updated);
  };

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.Name_VN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.MaterialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.PIC && m.PIC.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.CountryOfOrigin && m.CountryOfOrigin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.Category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'ALL' || m.Category === selectedCategoryFilter;

    const matchesPIC = selectedPICFilter === 'ALL' || m.PIC === selectedPICFilter;

    return matchesSearch && matchesCategory && matchesPIC;
  });

  const filteredFactories = factories.filter((f) => {
    const matchesSearch =
      !searchTerm ||
      f.InternalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.FactoryName_VN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.WarehouseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.CustomerVendorRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.SiteCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDivision =
      selectedDivisionFilter === 'ALL' || f.Division === selectedDivisionFilter;

    const matchesRegion =
      selectedRegionFilter === 'ALL' ||
      f.RegionID.replace('REG-', '') === selectedRegionFilter;

    return matchesSearch && matchesDivision && matchesRegion;
  });

  const filteredSubstitutions = substitutions.filter((s) => {
    const origMat = materials.find((m) => m.MaterialCode === s.OriginalMaterialCode);
    const subMat = materials.find((m) => m.MaterialCode === s.SubstituteMaterialCode);

    const matchesSearch =
      !searchTerm ||
      s.OriginalMaterialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.SubstituteMaterialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (origMat?.Name_VN && origMat.Name_VN.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subMat?.Name_VN && subMat.Name_VN.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.ApprovedBy && s.ApprovedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.Note && s.Note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedSubTypeFilter === 'ALL' || s.SubstitutionType === selectedSubTypeFilter;

    return matchesSearch && matchesType;
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.SupplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ShortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.SupplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.ContractNo && s.ContractNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.Email && s.Email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedSupplierTypeFilter === 'ALL' || s.SupplierType === selectedSupplierTypeFilter;

    const matchesIncoterm =
      selectedIncotermFilter === 'ALL' || s.Incoterm === selectedIncotermFilter;

    return matchesSearch && matchesType && matchesIncoterm;
  });

  const filteredMappings = learnedMappings.filter((m) => {
    const matchesType =
      selectedMappingTypeFilter === 'ALL' || m.ImportType === selectedMappingTypeFilter;
    const matchesSearch =
      !searchTerm ||
      m.ExcelHeaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.SystemFieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.Description && m.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.ImportType.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  // ── Data Export Handlers (Tải Data Excel) ──────────────────────────────────
  const handleExportMaterials = () => {
    const exportData = filteredMaterials.map((m) => {
      const subs = substitutions.filter(
        (s) => s.OriginalMaterialCode === m.MaterialCode || (s.IsBiDirectional && s.SubstituteMaterialCode === m.MaterialCode)
      );
      const subCodes = subs
        .map((s) => (s.OriginalMaterialCode === m.MaterialCode ? s.SubstituteMaterialCode : s.OriginalMaterialCode))
        .join('; ');

      return {
        'CODE': m.MaterialCode,
        'DESC': m.Name_VN,
        'Tên Tiếng Anh': m.Name_EN || '',
        'PIC': m.PIC || 'Fiona',
        'Item sales tax group': m.TaxGroup || 'NonVAT',
        'Overdelivery (%)': m.OverdeliveryPct ?? 0,
        'Packing group': m.PackingGroup || 'Bags',
        'CountryOfOrigin': m.CountryOfOrigin || 'Việt Nam',
        'Phân Nhóm': m.Category,
        'Mã Thay Thế (1-N)': subCodes || 'Không có',
        'Đơn Vị Tính': m.Unit || 'kg',
        'Định Mức AT (ngày)': m.SafetyStockDays || 14,
        'Đơn Giá (USD/kg)': m.UnitPriceUSD || 0,
        'Trạng Thái': m.Status || 'Active',
      };
    });
    exportToExcel(exportData, 'D365_tblITEM_Data', 'tblITEM');
  };

  const handleExportSubstitutions = () => {
    const exportData = filteredSubstitutions.map((s) => {
      const origMat = materials.find((m) => m.MaterialCode === s.OriginalMaterialCode);
      const subMat = materials.find((m) => m.MaterialCode === s.SubstituteMaterialCode);
      return {
        'OriginalMaterialCode': s.OriginalMaterialCode,
        'Tên Nguyên Liệu Gốc': origMat?.Name_VN || s.OriginalMaterialName,
        'SubstituteMaterialCode': s.SubstituteMaterialCode,
        'Tên Nguyên Liệu Thay Thế': subMat?.Name_VN || s.SubstituteMaterialName,
        'ConversionRatio': s.ConversionRatio,
        'SubstitutionType': s.SubstitutionType,
        'Priority': s.Priority,
        'DivisionScope': s.DivisionScope,
        'Chuyển Đổi 2 Chiều': s.IsBiDirectional ? 'CÓ' : 'KHÔNG',
        'ApprovedBy': s.ApprovedBy,
        'Ngày Hiệu Lực': s.EffectiveDate,
        'Ghi Chú': s.Note || '',
      };
    });
    exportToExcel(exportData, 'D365_tblItemSubstitution_Data', 'tblItemSubstitution');
  };

  const handleExportFactories = () => {
    const exportData = filteredFactories.map((f) => ({
      'FACTORY': f.InternalCode,
      'DESC': f.FactoryName_VN,
      'REGION': f.RegionID.replace('REG-', ''),
      'Division': f.Division || 'Livestock',
      'WAREHOUSE': f.WarehouseCode || f.InternalCode,
      'Customer or vendor reference': f.CustomerVendorRef || '',
      'Site': f.SiteCode || 'dhv',
      'Công Suất (Tấn/Tháng)': f.CapacityTonsPerMonth || 0,
      'Địa Chỉ': f.Address || '',
    }));
    exportToExcel(exportData, 'D365_tblFACTORY_Data', 'tblFACTORY');
  };

  const handleExportSuppliers = () => {
    const exportData = filteredSuppliers.map((s) => ({
      'NCC (short name)': s.ShortName || s.SupplierCode,
      'CODE': s.SupplierCode,
      'DESC': s.SupplierName,
      'HĐNT': s.ContractNo || '_',
      'Incoterm': s.Incoterm || 'DDP',
      'Terms of payment': s.PaymentTerms || 'Net 30',
      'MAIL': s.Email || '',
      'SupplierType': s.SupplierType || 'LOCAL',
      'Note_0': s.Note_0 || '',
      'Note_1': s.Note_1 || '',
    }));
    exportToExcel(exportData, 'D365_tblNCC_Data', 'tblNCC');
  };

  const handleExportMappings = () => {
    const exportData = filteredMappings.map((m) => ({
      'Loại Dữ Liệu (ImportType)': m.ImportType,
      'Tên Cột Header Trong File Excel': m.ExcelHeaderName,
      'Trường Hệ Thống PremixTrack': m.SystemFieldName,
      'Mô Tả / Ý Nghĩa': m.Description || '',
      'Ngày Học': m.CreatedAt || '',
    }));
    exportToExcel(exportData, 'Sys_Import_Mappings_Data', 'Sys_Import_Mappings');
  };

  // KPI stats
  const bagsCount = materials.filter((m) => m.PackingGroup === 'Bags').length;
  const uniquePICs = Array.from(new Set(materials.map((m) => m.PIC).filter(Boolean)));
  const directCount = substitutions.filter((s) => s.SubstitutionType === 'Direct_1_to_1').length;
  const ratioCount = substitutions.filter((s) => s.SubstitutionType === 'Ratio_Adjusted').length;
  const reworkCount = substitutions.filter((s) => s.SubstitutionType === 'Formula_Rework').length;
  const livestockCount = factories.filter((f) => f.Division === 'Livestock').length;
  const aquaCount = factories.filter((f) => f.Division === 'Aqua').length;
  const southCount = factories.filter((f) => f.RegionID.includes('SOUTH') || f.RegionID.includes('MEKONG')).length;
  const northCount = factories.filter((f) => f.RegionID.includes('NORTH')).length;
  const importCount = suppliers.filter((s) => s.SupplierType === 'IMPORT').length;
  const localCount = suppliers.filter((s) => s.SupplierType === 'LOCAL').length;
  const contractCount = suppliers.filter((s) => s.ContractNo && s.ContractNo !== '_').length;

  const masterDataMappingsCount = learnedMappings.filter((m) =>
    ['Material', 'Factory', 'Supplier', 'Substitution'].includes(m.ImportType)
  ).length;
  const factMappingsCount = learnedMappings.filter((m) =>
    ['Forecast', 'SOH', 'Usage', 'PO_Inbound'].includes(m.ImportType)
  ).length;

  const uploadMsg =
    matUpload.uploadMsg || facUpload.uploadMsg || supUpload.uploadMsg || subUpload.uploadMsg;

  return (
    <div className="space-y-4">
      {/* ── 1. Module Header & Sub-Tabs Bar (Collapsible for Max Screen Space) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Quản Lý Dữ Liệu Danh Mục Gốc D365 FO (Master Data &amp; Mappings)
              </h2>
              {isHeaderSummaryExpanded && (
                <p className="text-[11px] text-slate-500 mt-0.5 animate-fade-in">
                  Quản trị danh mục gốc D365 FO (tblITEM, tblFACTORY, tblNCC), Ma trận thay thế đa nguồn 1-to-N và Từ điển Header linh hoạt.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHeaderSummaryExpanded(!isHeaderSummaryExpanded)}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title={isHeaderSummaryExpanded ? 'Thu gọn tiêu đề & thẻ KPI' : 'Mở rộng tiêu đề & thẻ KPI'}
            >
              {isHeaderSummaryExpanded ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Thu Gọn Header</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mở Rộng Header</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs flex-wrap border border-slate-200/60">
          {[
            { id: 'materials' as const, label: `Nguyên Liệu tblItem (${materials.length})`, icon: Layers },
            { id: 'substitutions' as const, label: `Ma Trận Thay Thế (${substitutions.length})`, icon: ArrowRightLeft },
            { id: 'factories' as const, label: `Nhà Máy tblFactory (${factories.length})`, icon: Factory },
            { id: 'suppliers' as const, label: `Nhà Cung Cấp tblNCC (${suppliers.length})`, icon: Building2 },
            { id: 'mappings' as const, label: `Từ Điển Header (${learnedMappings.length})`, icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {uploadMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-green-600" />
          <span>{uploadMsg}</span>
        </div>
      )}

      {/* ── 2. Collapsible KPI Stat Bar ────────────────────────────────────────── */}
      {isHeaderSummaryExpanded && (
        <div className="animate-fade-in">
          {activeSubTab === 'materials' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tổng SKUs tblItem</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {materials.length} <span className="text-xs font-normal text-slate-400 font-sans">mặt hàng</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quy Cách Đóng Gói</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {bagsCount} <span className="text-xs font-normal text-slate-400 font-sans">Bags (Bao bì)</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quy Tắc Thay Thế 1-N</span>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                  {substitutions.length} <span className="text-xs font-normal text-slate-400 font-sans">quy tắc hoạt động</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Đội Ngũ PIC Mua Hàng</span>
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1.5 flex flex-wrap items-center gap-1">
                  {uniquePICs.slice(0, 4).map((pic) => (
                    <span key={pic} className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                      {pic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'substitutions' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tổng Quy Tắc Chuyển Đổi</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {substitutions.length} <span className="text-xs font-normal text-slate-400 font-sans">quy tắc</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Thay Ngang 1:1</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {directCount} <span className="text-xs font-normal text-slate-400 font-sans">quy tắc (Direct)</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thay Theo Hệ Số (Ratio)</span>
                </div>
                <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                  {ratioCount} <span className="text-xs font-normal text-slate-400 font-sans">quy tắc (Adjusted)</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cần Chạy Lại Công Thức</span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-700 mt-1">
                  {reworkCount} <span className="text-xs font-normal text-slate-400 font-sans">Formula Rework</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'factories' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tổng Nhà Máy / Điểm Kho</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {factories.length} <span className="text-xs font-normal text-slate-400 font-sans">cơ sở</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ngành Thức Ăn Gia Súc</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {livestockCount} <span className="text-xs font-normal text-slate-400 font-sans">Livestock Mills</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Ngành Thủy Sản (Aqua)</span>
                </div>
                <div className="text-xl font-bold font-mono text-cyan-700 mt-1">
                  {aquaCount} <span className="text-xs font-normal text-slate-400 font-sans">Aqua Mills</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Phân Bố Khu Vực</span>
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1.5 flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">SOUTH: {southCount}</span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono">NORTH: {northCount}</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'suppliers' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tổng Nhà Cung Cấp tblNCC</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {suppliers.length} <span className="text-xs font-normal text-slate-400 font-sans">đối tác</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nguồn Nhập Khẩu (IMPORT)</span>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                  {importCount} <span className="text-xs font-normal text-slate-400 font-sans">NCC Quốc Tế</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nguồn Nội Địa (LOCAL)</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {localCount} <span className="text-xs font-normal text-slate-400 font-sans">NCC Trong Nước</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hợp Đồng Nguyên Tắc (HĐNT)</span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-700 mt-1">
                  {contractCount} <span className="text-xs font-normal text-slate-400 font-sans">HĐNT hiệu lực</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'mappings' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tổng Quy Tắc Ánh Xạ</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {learnedMappings.length} <span className="text-xs font-normal text-slate-400 font-sans">quy tắc</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ánh Xạ Master Data</span>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                  {masterDataMappingsCount} <span className="text-xs font-normal text-slate-400 font-sans">quy tắc gốc</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ánh Xạ Fact Data</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {factMappingsCount} <span className="text-xs font-normal text-slate-400 font-sans">quy tắc vận hành</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>Độ Phủ Cột Tự Động</span>
                </div>
                <div className="text-xs font-bold text-purple-700 mt-1.5">
                  Không phụ thuộc thứ tự cột • Tự động lọc bỏ cột thừa
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. DATA TABLES WITH STICKY TABLE HEADERS & HOME/END BALLOONS ── */}

      {/* ─── SUBTAB 1: MATERIALS (tblITEM D365 FO) ─────────────────────────── */}
      {activeSubTab === 'materials' && (
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Danh Mục Nguyên Liệu D365 FO (tblITEM - {materials.length} SKUs)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tự động khớp theo Header từ điển, không phụ thuộc thứ tự cột, tự động bỏ qua cột thừa.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm CODE, DESC, PIC, Xuất xứ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors w-48"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả Phân Nhóm</option>
                {MATERIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedPICFilter}
                onChange={(e) => setSelectedPICFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả PIC</option>
                {uniquePICs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* Nút Tải Template */}
              <button
                onClick={matUpload.downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Tải template Excel tblITEM chuẩn D365 FO (mẫu trống)"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải Template</span>
              </button>

              {/* Nút Tải Data Excel Hiện Tại */}
              <button
                onClick={handleExportMaterials}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Tải toàn bộ dữ liệu tblITEM thực tế ra file Excel"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Data Excel ({filteredMaterials.length})</span>
              </button>

              <input
                ref={matUpload.fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={matUpload.handleFile}
              />
              <button
                onClick={matUpload.trigger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Upload file Excel danh sách tblITEM"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </button>

              <button
                onClick={() => setMatModal({ open: true, item: null })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Nguyên Liệu</span>
              </button>
            </div>
          </div>

          {/* Sticky Table Body Container with Balloon Home/End */}
          <div ref={matTableRef} className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto relative scroll-smooth">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className={stickyThCls}>CODE</th>
                  <th className={stickyThCls}>DESC (Tên Nguyên Liệu D365)</th>
                  <th className={`${stickyThCls} text-center`}>PIC</th>
                  <th className={`${stickyThCls} text-center`}>Thuế Sales Tax</th>
                  <th className={`${stickyThCls} text-center`}>Dung Sai</th>
                  <th className={`${stickyThCls} text-center`}>Quy Cách</th>
                  <th className={stickyThCls}>Xuất Xứ (Origin)</th>
                  <th className={`${stickyThCls} text-center`}>Mã Thay Thế (1-N)</th>
                  <th className={`${stickyThCls} text-right`}>Đơn Giá ($)</th>
                  <th className={`${stickyThCls} text-center`}>Trạng Thái</th>
                  <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredMaterials.map((mat, idx) => {
                  const matSubs = substitutions.filter(
                    (s) =>
                      s.OriginalMaterialCode === mat.MaterialCode ||
                      (s.IsBiDirectional && s.SubstituteMaterialCode === mat.MaterialCode)
                  );

                  return (
                    <tr key={mat.MaterialID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                          {mat.MaterialCode}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{mat.Name_VN}</div>
                        <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            {mat.Category}
                          </span>
                          {mat.SpecDescription && (
                            <span className="truncate max-w-xs">{mat.SpecDescription}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200 text-[11px]">
                          {mat.PIC || 'Fiona'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            mat.TaxGroup === 'NonVAT'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {mat.TaxGroup || 'NonVAT'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {mat.OverdeliveryPct ?? 0}%
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          {mat.PackingGroup || 'Bags'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {mat.CountryOfOrigin === '#N/A' ? (
                          <span className="text-slate-400 font-mono">#N/A</span>
                        ) : (
                          <span className="text-slate-800">{mat.CountryOfOrigin || 'Việt Nam'}</span>
                        )}
                      </td>

                      {/* Mã Thay Thế (1-N Badge với Bong Bóng Mờ Hover Tinh Gọn) */}
                      <td className="py-3 px-4 text-center">
                        {matSubs.length > 0 ? (
                          <div className="relative inline-block group">
                            <button
                              type="button"
                              onClick={() => setMatModal({ open: true, item: mat })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px] cursor-pointer transition-colors shadow-2xs"
                              title="Bấm để xem và sửa chi tiết ma trận thay thế của SKU này"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>{matSubs.length} mã tương đương</span>
                            </button>

                            {/* Bong Bóng Mờ (Frosted Glass Bubble) */}
                            <div
                              className={`hidden group-hover:block absolute z-50 left-1/2 -translate-x-1/2 min-w-[220px] max-w-xs bg-slate-900/85 backdrop-blur-md text-white rounded-2xl p-2.5 shadow-2xl border border-white/20 text-left pointer-events-none animate-fade-in ${
                                idx === 0 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                              }`}
                            >
                              <div className="text-[10px] uppercase font-bold text-blue-300 tracking-wider pb-1.5 border-b border-white/10 flex items-center justify-between">
                                <span>Mã Thay Thế ({matSubs.length})</span>
                                <span className="text-[9px] text-slate-400 font-normal lowercase">chạm để xem tỉ lệ</span>
                              </div>

                              <div className="space-y-1.5 mt-1.5 max-h-48 overflow-y-auto">
                                {matSubs.map((sub, sIdx) => {
                                  const isDirect = sub.OriginalMaterialCode === mat.MaterialCode;
                                  const counterpartCode = isDirect
                                    ? sub.SubstituteMaterialCode
                                    : sub.OriginalMaterialCode;
                                  const counterpartMat = materials.find(
                                    (m) => m.MaterialCode === counterpartCode
                                  );

                                  return (
                                    <div
                                      key={sub.SubstitutionID || sIdx}
                                      className="flex items-center gap-1.5 text-[11px] leading-tight py-0.5"
                                    >
                                      <span className="font-mono font-bold text-amber-300 bg-white/10 px-1.5 py-0.2 rounded text-[10px] shrink-0">
                                        {counterpartCode}
                                      </span>
                                      <span className="font-medium text-slate-100 truncate">
                                        {counterpartMat?.Name_VN || sub.SubstituteMaterialName}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-green-700">
                        ${mat.UnitPriceUSD.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleMaterialStatus(mat.MaterialID)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            mat.Status === 'Active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                          title="Bấm để chuyển đổi trạng thái Active / Stop_Usage"
                        >
                          {mat.Status}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setMatModal({ open: true, item: mat })}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa hoặc xóa nguyên liệu & cấu hình mã thay thế"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400 font-medium text-xs">
                      Không có nguyên liệu nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Balloon Home / End Buttons (Active when data >= 20 rows) */}
          <FloatingHomeEndButtons containerRef={matTableRef} rowCount={filteredMaterials.length} />
        </div>
      )}

      {/* ─── SUBTAB 2: SUBSTITUTION MATRIX ─────────────────────────────────── */}
      {activeSubTab === 'substitutions' && (
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <span>Ma Trận Chuyển Đổi &amp; Thay Thế Nguyên Liệu Đa Nguồn (tblItemSubstitution)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Thêm mới, chỉnh sửa và quản lý các điều kiện chuyển đổi qua lại giữa 4–5 mã nguyên liệu có hệ số quy đổi &amp; độ ưu tiên.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã gốc, mã thay thế, người duyệt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors w-52"
                />
              </div>

              <select
                value={selectedSubTypeFilter}
                onChange={(e) => setSelectedSubTypeFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả Loại Thay Thế</option>
                <option value="Direct_1_to_1">Thay Ngang 1:1 (Direct)</option>
                <option value="Ratio_Adjusted">Thay Theo Tỉ Lệ (Ratio)</option>
                <option value="Formula_Rework">Cần Chạy Lại Công Thức (Rework)</option>
              </select>

              {/* Nút Tải Template */}
              <button
                onClick={subUpload.downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Tải template Excel ma trận thay thế (mẫu trống)"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải Template</span>
              </button>

              {/* Nút Tải Data Excel Hiện Tại */}
              <button
                onClick={handleExportSubstitutions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Tải toàn bộ dữ liệu ma trận thay thế ra file Excel"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Data Excel ({filteredSubstitutions.length})</span>
              </button>

              <input
                ref={subUpload.fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={subUpload.handleFile}
              />
              <button
                onClick={subUpload.trigger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </button>

              <button
                onClick={() => setSubModal({ open: true, item: null })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Quy Tắc</span>
              </button>
            </div>
          </div>

          {/* Sticky Table Body Container with Balloon Home/End */}
          <div ref={subTableRef} className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto relative scroll-smooth">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className={stickyThCls}>Mã Gốc (Original)</th>
                  <th className={stickyThCls}>Tên Nguyên Liệu Gốc</th>
                  <th className={`${stickyThCls} text-center`}>Chuyển Đổi</th>
                  <th className={stickyThCls}>Mã Thay Thế (Substitute)</th>
                  <th className={stickyThCls}>Tên Nguyên Liệu Thay Thế</th>
                  <th className={`${stickyThCls} text-center`}>Hệ Số Quy Đổi (Ratio)</th>
                  <th className={`${stickyThCls} text-center`}>Loại Thay Thế</th>
                  <th className={`${stickyThCls} text-center`}>Ưu Tiên</th>
                  <th className={`${stickyThCls} text-center`}>Phạm Vi</th>
                  <th className={`${stickyThCls} text-center`}>Người Duyệt</th>
                  <th className={stickyThCls}>Ghi Chú Kỹ Thuật</th>
                  <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredSubstitutions.map((sub) => {
                  const origMat = materials.find((m) => m.MaterialCode === sub.OriginalMaterialCode);
                  const subMat = materials.find((m) => m.MaterialCode === sub.SubstituteMaterialCode);
                  const typeCfg =
                    SUBSTITUTION_TYPE_LABELS[sub.SubstitutionType] ||
                    SUBSTITUTION_TYPE_LABELS.Direct_1_to_1;

                    return (
                      <tr key={sub.SubstitutionID} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 bg-blue-50/50">
                          {sub.OriginalMaterialCode}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {origMat?.Name_VN || sub.OriginalMaterialName}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {sub.IsBiDirectional ? (
                            <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200">
                              ⇄ 2 chiều
                            </span>
                          ) : (
                            <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                              ➔ 1 chiều
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-purple-700 bg-purple-50/50">
                          {sub.SubstituteMaterialCode}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {subMat?.Name_VN || sub.SubstituteMaterialName}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700 bg-indigo-50/30">
                          {sub.ConversionRatio}x
                          <div className="text-[9px] text-slate-400 font-normal">
                            1kg = {sub.ConversionRatio}kg
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${typeCfg.bg} ${typeCfg.text}`}
                          >
                            {typeCfg.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            #{sub.Priority}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {sub.DivisionScope}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {sub.ApprovedBy || 'Nelly'}
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                          {sub.Note || '-'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSubModal({ open: true, item: sub })}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Chỉnh sửa quy tắc chuyển đổi này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSubstitution(sub.SubstitutionID)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Xóa quy tắc chuyển đổi này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {filteredSubstitutions.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-slate-400 font-medium text-xs">
                      Không tìm thấy quy tắc thay thế nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Balloon Home / End Buttons (Active when data >= 20 rows) */}
          <FloatingHomeEndButtons containerRef={subTableRef} rowCount={filteredSubstitutions.length} />
        </div>
      )}

      {/* ─── SUBTAB 3: FACTORIES (tblFACTORY D365 FO) ───────────────────────── */}
      {activeSubTab === 'factories' && (
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Factory className="w-4 h-4 text-blue-600" />
                <span>Danh Mục Nhà Máy D365 FO (tblFACTORY - {factories.length} Đơn Vị)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bắt theo Header từ điển, không phụ thuộc thứ tự cột, tự động loại bỏ cột thừa.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm FACTORY, DESC, Site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors w-48"
                />
              </div>

              <select
                value={selectedDivisionFilter}
                onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả Ngành</option>
                <option value="Livestock">Livestock</option>
                <option value="Aqua">Aqua</option>
              </select>

              <select
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả Vùng</option>
                <option value="SOUTH">SOUTH</option>
                <option value="NORTH">NORTH</option>
              </select>

              {/* Nút Tải Template */}
              <button
                onClick={facUpload.downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Tải file mẫu tblFACTORY chuẩn D365 FO (mẫu trống)"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải Template</span>
              </button>

              {/* Nút Tải Data Excel Hiện Tại */}
              <button
                onClick={handleExportFactories}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Tải toàn bộ dữ liệu tblFACTORY thực tế ra file Excel"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Data Excel ({filteredFactories.length})</span>
              </button>

              <input
                ref={facUpload.fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={facUpload.handleFile}
              />
              <button
                onClick={facUpload.trigger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Upload file Excel danh sách tblFACTORY"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </button>

              <button
                onClick={() => setFacModal({ open: true, item: null })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Nhà Máy</span>
              </button>
            </div>
          </div>

          {/* Sticky Table Body Container with Balloon Home/End */}
          <div ref={facTableRef} className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto relative scroll-smooth">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className={stickyThCls}>FACTORY</th>
                  <th className={stickyThCls}>DESC (Tên Nhà Máy)</th>
                  <th className={`${stickyThCls} text-center`}>REGION</th>
                  <th className={`${stickyThCls} text-center`}>Division</th>
                  <th className={`${stickyThCls} text-center`}>WAREHOUSE</th>
                  <th className={`${stickyThCls} text-center`}>Customer / Vendor Ref</th>
                  <th className={`${stickyThCls} text-center`}>Site</th>
                  <th className={`${stickyThCls} text-right`}>Công Suất (Tấn/Tháng)</th>
                  <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredFactories.map((fac) => (
                  <tr key={fac.FactoryID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {fac.InternalCode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{fac.FactoryName_VN}</div>
                      {fac.Address && (
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                          {fac.Address}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          fac.RegionID.includes('SOUTH')
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {fac.RegionID.replace('REG-', '')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          fac.Division === 'Aqua'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {fac.Division || 'Livestock'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {fac.WarehouseCode || fac.InternalCode}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-700 bg-amber-50/50">
                      {fac.CustomerVendorRef || '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] uppercase">
                        {fac.SiteCode || 'dhv'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {fac.CapacityTonsPerMonth ? `${fac.CapacityTonsPerMonth.toLocaleString()} tấn` : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setFacModal({ open: true, item: fac })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Chỉnh sửa hoặc xóa thông tin nhà máy"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredFactories.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-medium text-xs">
                      Không tìm thấy nhà máy nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Balloon Home / End Buttons (Active when data >= 20 rows) */}
          <FloatingHomeEndButtons containerRef={facTableRef} rowCount={filteredFactories.length} />
        </div>
      )}

      {/* ─── SUBTAB 4: SUPPLIERS (tblNCC / D365 FO VENDORS) ──────────────────── */}
      {activeSubTab === 'suppliers' && (
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Danh Mục Nhà Cung Cấp D365 FO (tblNCC / tblVendor - {suppliers.length} Đối Tác)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bao gồm NCC (short name), CODE, DESC, HĐNT, Incoterm, Điều khoản thanh toán &amp; Email.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm short name, CODE, DESC, HĐNT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors w-52"
                />
              </div>

              <select
                value={selectedSupplierTypeFilter}
                onChange={(e) => setSelectedSupplierTypeFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả Nguồn (IMPORT / LOCAL)</option>
                <option value="IMPORT">IMPORT (Nhập khẩu)</option>
                <option value="LOCAL">LOCAL (Nội địa)</option>
              </select>

              <select
                value={selectedIncotermFilter}
                onChange={(e) => setSelectedIncotermFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả Incoterm</option>
                {INCOTERM_OPTIONS.map((inc) => (
                  <option key={inc} value={inc}>
                    {inc}
                  </option>
                ))}
              </select>

              {/* Nút Tải Template */}
              <button
                onClick={supUpload.downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Tải template Excel tblNCC chuẩn D365 FO (mẫu trống)"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải Template</span>
              </button>

              {/* Nút Tải Data Excel Hiện Tại */}
              <button
                onClick={handleExportSuppliers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Tải toàn bộ dữ liệu tblNCC thực tế ra file Excel"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Data Excel ({filteredSuppliers.length})</span>
              </button>

              <input
                ref={supUpload.fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={supUpload.handleFile}
              />
              <button
                onClick={supUpload.trigger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Upload file Excel danh sách tblNCC"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </button>

              <button
                onClick={() => setSupModal({ open: true, item: null })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Nhà Cung Cấp</span>
              </button>
            </div>
          </div>

          {/* Sticky Table Body Container with Balloon Home/End */}
          <div ref={supTableRef} className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto relative scroll-smooth">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className={stickyThCls}>Phân Loại</th>
                  <th className={stickyThCls}>NCC (Short Name)</th>
                  <th className={stickyThCls}>CODE (Mã D365)</th>
                  <th className={stickyThCls}>DESC (Tên Đầy Đủ Công Ty)</th>
                  <th className={stickyThCls}>HĐNT (Số Hợp Đồng)</th>
                  <th className={`${stickyThCls} text-center`}>Incoterm</th>
                  <th className={`${stickyThCls} text-center`}>Terms of Payment</th>
                  <th className={stickyThCls}>MAIL (Email Liên Hệ)</th>
                  <th className={stickyThCls}>Ghi Chú</th>
                  <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.SupplierID} className="hover:bg-slate-50/80 transition-colors">
                    {/* Phân Loại */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          sup.SupplierType === 'IMPORT'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {sup.SupplierType || 'LOCAL'}
                      </span>
                    </td>

                    {/* NCC (short name) */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {sup.ShortName || sup.SupplierCode}
                      </span>
                    </td>

                    {/* CODE */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {sup.SupplierCode}
                      </span>
                    </td>

                    {/* DESC */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{sup.SupplierName}</div>
                    </td>

                    {/* HĐNT */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {sup.ContractNo && sup.ContractNo !== '_' ? (
                        <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {sup.ContractNo}
                        </span>
                      ) : (
                        <span className="text-slate-300">_</span>
                      )}
                    </td>

                    {/* Incoterm */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {sup.Incoterm || 'DDP'}
                    </td>

                    {/* Terms of payment */}
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {sup.PaymentTerms || '0'}
                      </span>
                    </td>

                    {/* MAIL */}
                    <td className="py-3 px-4 text-slate-600">
                      {sup.Email ? (
                        <a
                          href={`mailto:${sup.Email}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-mono text-[11px]"
                          title={sup.Email}
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-xs">{sup.Email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 font-mono">-</span>
                      )}
                    </td>

                    {/* Note_0 & Note_1 */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {[sup.Note_0, sup.Note_1].filter(Boolean).join(' • ') || '-'}
                    </td>

                    {/* Thao Tác */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSupModal({ open: true, item: sup })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Chỉnh sửa hoặc xóa thông tin nhà cung cấp"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 font-medium text-xs">
                      Không tìm thấy nhà cung cấp nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Balloon Home / End Buttons (Active when data >= 20 rows) */}
          <FloatingHomeEndButtons containerRef={supTableRef} rowCount={filteredSuppliers.length} />
        </div>
      )}

      {/* ─── SUBTAB 5: LEARNED HEADER MAPPINGS & ALIASES DICTIONARY ──────────── */}
      {activeSubTab === 'mappings' && (
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Từ Điển Ánh Xạ Header Linh Hoạt Đã Học (Sys_Import_Mappings)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tất cả template Excel khi upload sẽ tự động nhận diện theo tên cột Header (không phụ thuộc thứ tự), các cột không khớp sẽ được tự động bỏ qua.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên cột, trường hệ thống..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors w-52"
                />
              </div>

              <select
                value={selectedMappingTypeFilter}
                onChange={(e) => setSelectedMappingTypeFilter(e.target.value)}
                className="bg-white text-xs text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">Tất cả Loại Nghiệp Vụ ({learnedMappings.length})</option>
                <optgroup label="Danh Mục Gốc (Master Data)">
                  <option value="Material">Nguyên Liệu (tblITEM)</option>
                  <option value="Factory">Nhà Máy (tblFACTORY)</option>
                  <option value="Supplier">Nhà Cung Cấp (tblNCC)</option>
                  <option value="Substitution">Ma Trận Chuyển Đổi (tblItemSub)</option>
                </optgroup>
                <optgroup label="Dữ Liệu Vận Hành (Fact Data)">
                  <option value="Forecast">Dự Báo Kế Hoạch (Forecast)</option>
                  <option value="SOH">Tồn Kho Thực Tế (SOH)</option>
                  <option value="Usage">Tiêu Hao Sản Xuất (Usage)</option>
                  <option value="PO_Inbound">Đơn Mua Hàng (PO Inbound)</option>
                </optgroup>
              </select>

              <button
                onClick={() => setIsAliasReferenceOpen(!isAliasReferenceOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Xem các từ khóa bí danh (aliases) mặc định hệ thống tự nhận diện"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Tra Cứu Bí Danh Tự Động</span>
                {isAliasReferenceOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Nút Tải Data Excel Hiện Tại */}
              <button
                onClick={handleExportMappings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Tải toàn bộ danh sách quy tắc ánh xạ ra file Excel"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Data Excel ({filteredMappings.length})</span>
              </button>

              <button
                onClick={() => setMappingModal({ open: true, item: null })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Quy Tắc Ánh Xạ</span>
              </button>
            </div>
          </div>

          {/* Collapsible Reference Dictionary */}
          {isAliasReferenceOpen && (
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Bộ Từ Điển Trường Hệ Thống &amp; Bí Danh Chuẩn Hóa Mặc Định (Built-in Aliases)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  File Excel có tên cột trùng với bất kỳ bí danh nào dưới đây đều được tự động nhận diện 100%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(systemFieldsByType).map(([type, fieldDefs]) => {
                  const meta = IMPORT_TYPE_METADATA[type as ImportDataType];
                  return (
                    <div
                      key={type}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2"
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta?.badgeColor}`}>
                          {meta?.label_VN || type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {fieldDefs.length} fields
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {fieldDefs.map((fd) => (
                          <div key={fd.field} className="text-[11px] leading-snug">
                            <div className="font-mono font-bold text-blue-700 flex items-center justify-between">
                              <span>{fd.field}</span>
                              <span className="text-[9px] font-sans font-semibold text-slate-500">
                                {fd.type}
                                {fd.required ? ' *' : ''}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 font-medium">
                              {fd.label_VN}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono italic truncate">
                              aliases: {fd.aliases.slice(0, 4).join(', ')}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sticky Table Body Container with Balloon Home/End */}
          <div ref={mapTableRef} className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto relative scroll-smooth">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className={stickyThCls}>Loại Dữ Liệu (Module)</th>
                  <th className={stickyThCls}>Tên Cột Header Trong File Excel</th>
                  <th className={stickyThCls}>Trường Hệ Thống PremixTrack</th>
                  <th className={stickyThCls}>Mô Tả / Ý Nghĩa</th>
                  <th className={`${stickyThCls} text-center`}>Ngày Học</th>
                  <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredMappings.map((m) => {
                  const meta = IMPORT_TYPE_METADATA[m.ImportType];
                  return (
                    <tr key={m.MappingID} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            meta?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {meta?.label_VN || m.ImportType}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 bg-slate-50/50">
                        {m.ExcelHeaderName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                          ➔ {m.SystemFieldName}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{m.Description || '-'}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{m.CreatedAt}</td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setMappingModal({ open: true, item: m })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa quy tắc ánh xạ này"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteMapping(m.MappingID)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa quy tắc ánh xạ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredMappings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 font-medium text-xs">
                      Không có quy tắc ánh xạ nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Balloon Home / End Buttons (Active when data >= 20 rows) */}
          <FloatingHomeEndButtons containerRef={mapTableRef} rowCount={filteredMappings.length} />
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {matModal.open && (
        <MaterialModal
          item={matModal.item}
          allMaterials={materials}
          allSubstitutions={substitutions}
          onSave={saveMaterial}
          onDelete={onDeleteMaterial}
          onSaveSubstitution={saveSubstitution}
          onDeleteSubstitution={deleteSubstitution}
          checkDependencies={checkMaterialDependencies}
          onClose={() => setMatModal({ open: false, item: null })}
        />
      )}
      {facModal.open && (
        <FactoryModal
          item={facModal.item}
          onSave={saveFactory}
          onDelete={onDeleteFactory}
          checkDependencies={checkFactoryDependencies}
          onClose={() => setFacModal({ open: false, item: null })}
        />
      )}
      {supModal.open && (
        <SupplierModal
          item={supModal.item}
          onSave={saveSupplier}
          onDelete={onDeleteSupplier}
          checkDependencies={checkSupplierDependencies}
          onClose={() => setSupModal({ open: false, item: null })}
        />
      )}
      {subModal.open && (
        <SubstitutionModal
          item={subModal.item}
          allMaterials={materials}
          onSave={saveSubstitution}
          onClose={() => setSubModal({ open: false, item: null })}
        />
      )}
      {mappingModal.open && (
        <MappingModal
          item={mappingModal.item}
          onSave={(m) => {
            onSaveMapping?.(m);
            setMappingModal({ open: false, item: null });
          }}
          onClose={() => setMappingModal({ open: false, item: null })}
        />
      )}
    </div>
  );
};
