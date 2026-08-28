import React, { useRef, useState } from 'react';
import { ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
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
} from '../../types';
import { extractMappedRowData } from '../../utils/excelParser';

export interface DependencyCheckResult {
  canDelete: boolean;
  reasons: string[];
  summary: string;
}

export interface MasterDataManagementProps {
  initialSubTab?: 'materials' | 'factories' | 'suppliers' | 'substitutions' | 'mappings';
  canEditMasterData?: boolean;
  currentUserRoleName?: string;
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

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Carriers_Minerals',
  'Amino_Acids',
  'Trace_Minerals',
  'Vitamins',
  'Acidifiers',
  'Enzymes',
  'Toxin_Binders',
  'Medicinals',
];

export const MATERIAL_STATUSES: MaterialStatus[] = ['Active', 'Stop_Usage', 'Phase_Out', 'Testing'];
export const TAX_GROUP_OPTIONS = ['NonVAT', 'VAT10-Non', 'VAT5-Non', 'VAT10', 'VAT5'];
export const PACKING_GROUP_OPTIONS = ['Bags', 'Bulk', 'Drums', 'Totes', 'Cartons'];
export const PIC_OPTIONS = ['Fiona', 'Austin', 'Nelly', 'Talena', 'Heidi', 'Victoria', 'Vivian', 'Other'];

export const SUBSTITUTION_TYPE_LABELS: Record<SubstitutionType, { label: string; bg: string; text: string }> = {
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

export const REGION_OPTIONS = [
  { id: 'SOUTH', label: 'SOUTH (Miền Nam)' },
  { id: 'NORTH', label: 'NORTH (Miền Bắc)' },
  { id: 'CENTRAL', label: 'CENTRAL (Miền Trung)' },
  { id: 'MEKONG', label: 'MEKONG (Đồng Bằng SCL)' },
];

export const DIVISION_OPTIONS: FactoryDivision[] = ['Livestock', 'Aqua', 'Premix', 'Other'];
export const SITE_OPTIONS = [
  { id: 'dhv', label: 'dhv (De Heus Vietnam)' },
  { id: 'pbh', label: 'pbh (Premix Center Biên Hòa)' },
  { id: 'php', label: 'php (Premix Center Hải Phòng)' },
];

export const INCOTERM_OPTIONS = ['DDP', 'CIF', 'FOB', 'EXW', 'CFR', 'CIP'];

export const IMPORT_TYPE_METADATA: Record<
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

export function Field({
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

export const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium text-slate-900';

export const stickyThCls =
  'sticky top-0 z-20 bg-slate-50 border-b border-slate-200 py-3 px-4 text-slate-500 uppercase text-[10px] font-bold tracking-wider';

export function exportToExcel<T extends Record<string, any>>(data: T[], fileNamePrefix: string, sheetName: string = 'Data') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.xlsx`);
}

export function FloatingHomeEndButtons({
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

      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900/75 text-blue-200 backdrop-blur-md border border-white/10 shadow-sm">
        {rowCount} dòng
      </span>

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

export function useExcelUpload<T>(
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
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `template_${importType}_${dateStr}.xlsx`);
  };

  const trigger = () => fileRef.current?.click();

  return { fileRef, handleFile, downloadTemplate, trigger, uploadMsg };
}
