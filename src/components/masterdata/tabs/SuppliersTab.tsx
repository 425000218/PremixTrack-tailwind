import React, { useState, useRef, useMemo } from 'react';
import {
  Building2,
  Search,
  Download,
  FileSpreadsheet,
  FileDown,
  Plus,
  Edit2,
  AlertTriangle,
  X,
  Save,
  PackageCheck,
  Globe2,
  Building,
  Ship,
  Truck,
  Trash2,
  FileText,
  Mail,
} from 'lucide-react';
import {
  Dim_Supplier,
  SupplierType,
  Sys_Import_Mapping,
  Language,
  Fact_PurchaseOrder,
} from '../../../types';
import {
  DependencyCheckResult,
  INCOTERM_OPTIONS,
  Field,
  inputCls,
  stickyThCls,
  exportToExcel,
  FloatingHomeEndButtons,
  useExcelUpload,
} from '../types';

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

export interface SuppliersTabProps {
  suppliers: Dim_Supplier[];
  learnedMappings: Sys_Import_Mapping[];
  poHeaders?: Fact_PurchaseOrder[];
  onUpdateSuppliers?: (updated: Dim_Supplier[]) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  language: Language;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({
  suppliers,
  learnedMappings,
  poHeaders,
  onUpdateSuppliers,
  onDeleteSupplier,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupplierTypeFilter, setSelectedSupplierTypeFilter] = useState<string>('ALL');
  const [selectedIncotermFilter, setSelectedIncotermFilter] = useState<string>('ALL');
  const [supModal, setSupModal] = useState<{ open: boolean; item: Dim_Supplier | null }>({
    open: false,
    item: null,
  });

  const supTableRef = useRef<HTMLDivElement>(null);

  const importCount = useMemo(
    () => (suppliers || []).filter((s) => s.SupplierType === 'IMPORT').length,
    [suppliers]
  );
  const localCount = useMemo(
    () => (suppliers || []).filter((s) => s.SupplierType === 'LOCAL').length,
    [suppliers]
  );
  const contractCount = useMemo(
    () => (suppliers || []).filter((s) => s.ContractNo && s.ContractNo !== '_').length,
    [suppliers]
  );

  const checkSupplierDependencies = (sup: Dim_Supplier): DependencyCheckResult => {
    const supId = sup.SupplierID;
    const supCode = sup.SupplierCode;
    const poCount = (poHeaders || []).filter(
      (p) => p.SupplierID === supId || p.SupplierID === supCode || p.SupplierID === `SUP-${supCode}`
    ).length;

    const reasons: string[] = [];
    if (poCount > 0) reasons.push(`${poCount} đơn đặt hàng mua (Purchase Orders) liên kết`);

    return {
      canDelete: reasons.length === 0,
      reasons,
      summary: reasons.join(', '),
    };
  };

  const supHeaders = [
    'NCC',
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
      if (!onUpdateSuppliers) return;
      const existingMap = new Map<string, Dim_Supplier>(
        suppliers.map((s) => [s.SupplierCode.toUpperCase(), s])
      );
      rows.forEach((r) => {
        if (!r.SupplierCode) return;
        const codeUpper = r.SupplierCode.toUpperCase();
        const prev = existingMap.get(codeUpper);
        const itemToSave: Dim_Supplier = {
          SupplierID: prev?.SupplierID || `SUP-${r.SupplierCode}`,
          SupplierCode: r.SupplierCode.toUpperCase(),
          ShortName: r.ShortName || prev?.ShortName || r.SupplierCode,
          SupplierName: r.SupplierName || prev?.SupplierName || r.SupplierCode,
          SupplierType: (r.SupplierType as SupplierType) || prev?.SupplierType || 'IMPORT',
          ContractNo: r.ContractNo || prev?.ContractNo || '_',
          Incoterm: r.Incoterm || prev?.Incoterm || 'DDP',
          PaymentTerms: r.PaymentTerms || prev?.PaymentTerms || 'Net 30',
          Email: r.Email || prev?.Email || '',
          Note_0: r.Note_0 || prev?.Note_0 || '',
          Note_1: r.Note_1 || prev?.Note_1 || '',
          Country: r.Country || prev?.Country || 'Việt Nam',
          LeadTimeDays: Number(r.LeadTimeDays ?? prev?.LeadTimeDays ?? 7),
          Rating: Number(r.Rating ?? prev?.Rating ?? 4.8),
        };
        existingMap.set(codeUpper, itemToSave);
      });
      onUpdateSuppliers(Array.from(existingMap.values()));
    }
  );

  const filteredSuppliers = useMemo(() => {
    return (suppliers || []).filter((s) => {
      if (selectedSupplierTypeFilter !== 'ALL' && s.SupplierType !== selectedSupplierTypeFilter) {
        return false;
      }
      if (selectedIncotermFilter !== 'ALL' && s.Incoterm !== selectedIncotermFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.SupplierCode.toLowerCase().includes(q) ||
        s.SupplierName.toLowerCase().includes(q) ||
        (s.ShortName && s.ShortName.toLowerCase().includes(q)) ||
        (s.ContractNo && s.ContractNo.toLowerCase().includes(q)) ||
        (s.Email && s.Email.toLowerCase().includes(q)) ||
        (s.Country && s.Country.toLowerCase().includes(q))
      );
    });
  }, [suppliers, searchTerm, selectedSupplierTypeFilter, selectedIncotermFilter]);

  const handleSaveSupplier = (item: Dim_Supplier) => {
    if (!onUpdateSuppliers) return;
    const existingIdx = suppliers.findIndex(
      (s) =>
        s.SupplierID === item.SupplierID ||
        s.SupplierCode.toUpperCase() === item.SupplierCode.toUpperCase()
    );
    let updated: Dim_Supplier[];
    if (existingIdx >= 0) {
      updated = [...suppliers];
      updated[existingIdx] = item;
    } else {
      updated = [item, ...suppliers];
    }
    onUpdateSuppliers(updated);
    setSupModal({ open: false, item: null });
  };

  const handleExportSuppliers = () => {
    const exportData = filteredSuppliers.map((s) => ({
      'Phân Loại': s.SupplierType,
      'NCC': s.ShortName,
      'CODE': s.SupplierCode,
      'DESC': s.SupplierName,
      'HĐNT': s.ContractNo || '_',
      'Incoterm': s.Incoterm,
      'Terms of payment': s.PaymentTerms,
      'MAIL': s.Email || '',
      'Note_0': s.Note_0 || '',
      'Note_1': s.Note_1 || '',
    }));
    exportToExcel(exportData, 'Danh_Muc_Nha_Cung_Cap_tblNCC');
  };

  return (
    <div className="space-y-4">
      {supUpload.uploadMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <PackageCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{supUpload.uploadMsg}</span>
        </div>
      )}

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

      {supModal.open && (
        <SupplierModal
          item={supModal.item}
          onSave={handleSaveSupplier}
          onDelete={onDeleteSupplier}
          checkDependencies={checkSupplierDependencies}
          onClose={() => setSupModal({ open: false, item: null })}
        />
      )}
    </div>
  );
};
