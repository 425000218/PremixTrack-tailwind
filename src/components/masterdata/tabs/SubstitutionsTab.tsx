import React, { useState, useRef, useMemo } from 'react';
import {
  ArrowRightLeft,
  Search,
  Download,
  FileSpreadsheet,
  FileDown,
  Plus,
  Edit2,
  Trash2,
  PackageCheck,
  X,
  Save,
  Scale,
  Check,
  Sliders,
} from 'lucide-react';
import {
  Dim_Material,
  Dim_Material_Substitution,
  Sys_Import_Mapping,
  Language,
  SubstitutionType,
  FactoryDivision,
} from '../../../types';
import {
  SUBSTITUTION_TYPE_LABELS,
  DIVISION_OPTIONS,
  Field,
  inputCls,
  stickyThCls,
  exportToExcel,
  FloatingHomeEndButtons,
  useExcelUpload,
} from '../types';

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

export interface SubstitutionsTabProps {
  substitutions?: Dim_Material_Substitution[];
  materials: Dim_Material[];
  learnedMappings: Sys_Import_Mapping[];
  onUpdateSubstitutions?: (updated: Dim_Material_Substitution[]) => void;
  language: Language;
}

export const SubstitutionsTab: React.FC<SubstitutionsTabProps> = ({
  substitutions = [],
  materials,
  learnedMappings,
  onUpdateSubstitutions,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('ALL');
  const [selectedSubTypeFilter, setSelectedSubTypeFilter] = useState<string>('ALL');
  const [subModal, setSubModal] = useState<{
    open: boolean;
    item: Dim_Material_Substitution | null;
  }>({
    open: false,
    item: null,
  });

  const subTableRef = useRef<HTMLDivElement>(null);

  const directCount = useMemo(
    () => (substitutions || []).filter((s) => s.SubstitutionType === 'Direct_1_to_1').length,
    [substitutions]
  );
  const ratioCount = useMemo(
    () => (substitutions || []).filter((s) => s.SubstitutionType === 'Ratio_Adjusted').length,
    [substitutions]
  );
  const reworkCount = useMemo(
    () => (substitutions || []).filter((s) => s.SubstitutionType === 'Formula_Rework').length,
    [substitutions]
  );

  const subHeaders = [
    'OriginalMaterialCode',
    'OriginalMaterialName',
    'SubstituteMaterialCode',
    'SubstituteMaterialName',
    'ConversionRatio',
    'SubstitutionType',
    'Priority',
    'DivisionScope',
    'IsBiDirectional',
    'Status',
    'ApprovedBy',
    'EffectiveDate',
    'Note',
  ];

  const subUpload = useExcelUpload<Dim_Material_Substitution>(
    'Substitution',
    subHeaders,
    learnedMappings,
    (rows) => {
      if (!onUpdateSubstitutions) return;
      const existingMap = new Map<string, Dim_Material_Substitution>(
        substitutions.map((s) => [s.SubstitutionID, s])
      );
      rows.forEach((r) => {
        if (!r.OriginalMaterialCode || !r.SubstituteMaterialCode) return;
        const id =
          r.SubstitutionID ||
          `SUB-${r.OriginalMaterialCode}-${r.SubstituteMaterialCode}-${Date.now().toString(36)}`;
        const origMat = materials.find((m) => m.MaterialCode === r.OriginalMaterialCode);
        const subMat = materials.find((m) => m.MaterialCode === r.SubstituteMaterialCode);

        existingMap.set(id, {
          SubstitutionID: id,
          OriginalMaterialCode: r.OriginalMaterialCode,
          OriginalMaterialName: r.OriginalMaterialName || origMat?.Name_VN || r.OriginalMaterialCode,
          SubstituteMaterialCode: r.SubstituteMaterialCode,
          SubstituteMaterialName:
            r.SubstituteMaterialName || subMat?.Name_VN || r.SubstituteMaterialCode,
          ConversionRatio: Number(r.ConversionRatio) || 1.0,
          SubstitutionType: (r.SubstitutionType as SubstitutionType) || 'Ratio_Adjusted',
          Priority: Number(r.Priority) || 1,
          DivisionScope: (r.DivisionScope as any) || 'ALL',
          IsBiDirectional: Boolean(r.IsBiDirectional),
          Status: (r.Status as any) || 'Active',
          ApprovedBy: r.ApprovedBy || 'Nelly',
          EffectiveDate: r.EffectiveDate || new Date().toISOString().split('T')[0],
          Note: r.Note || '',
        });
      });
      onUpdateSubstitutions(Array.from(existingMap.values()));
    }
  );

  const filteredSubstitutions = useMemo(() => {
    return substitutions.filter((s) => {
      if (selectedDivisionFilter !== 'ALL' && s.DivisionScope !== selectedDivisionFilter && s.DivisionScope !== 'ALL') {
        return false;
      }
      if (selectedSubTypeFilter !== 'ALL' && s.SubstitutionType !== selectedSubTypeFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.OriginalMaterialCode.toLowerCase().includes(q) ||
        s.OriginalMaterialName?.toLowerCase().includes(q) ||
        s.SubstituteMaterialCode.toLowerCase().includes(q) ||
        s.SubstituteMaterialName?.toLowerCase().includes(q) ||
        (s.ApprovedBy && s.ApprovedBy.toLowerCase().includes(q)) ||
        (s.Note && s.Note.toLowerCase().includes(q))
      );
    });
  }, [substitutions, searchTerm, selectedDivisionFilter, selectedSubTypeFilter]);

  const handleSaveSubstitution = (item: Dim_Material_Substitution) => {
    if (!onUpdateSubstitutions) return;
    const existingIdx = substitutions.findIndex((s) => s.SubstitutionID === item.SubstitutionID);
    let updated: Dim_Material_Substitution[];
    if (existingIdx >= 0) {
      updated = [...substitutions];
      updated[existingIdx] = item;
    } else {
      updated = [item, ...substitutions];
    }
    onUpdateSubstitutions(updated);
    setSubModal({ open: false, item: null });
  };

  const handleDeleteSubstitution = (id: string) => {
    if (!onUpdateSubstitutions) return;
    if (confirm('Xác nhận xóa quy tắc thay thế này?')) {
      onUpdateSubstitutions(substitutions.filter((s) => s.SubstitutionID !== id));
    }
  };

  const handleExportSubstitutions = () => {
    const exportData = filteredSubstitutions.map((s) => ({
      'OriginalMaterialCode': s.OriginalMaterialCode,
      'OriginalMaterialName': s.OriginalMaterialName,
      'SubstituteMaterialCode': s.SubstituteMaterialCode,
      'SubstituteMaterialName': s.SubstituteMaterialName,
      'ConversionRatio': s.ConversionRatio,
      'SubstitutionType': s.SubstitutionType,
      'Priority': s.Priority,
      'DivisionScope': s.DivisionScope,
      'IsBiDirectional': s.IsBiDirectional ? 'YES' : 'NO',
      'Status': s.Status,
      'ApprovedBy': s.ApprovedBy,
      'Note': s.Note || '',
    }));
    exportToExcel(exportData, 'Ma_Tran_Thay_The_Nguyen_Lieu');
  };

  return (
    <div className="space-y-4">
      {subUpload.uploadMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <PackageCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{subUpload.uploadMsg}</span>
        </div>
      )}

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
                              onClick={() => handleDeleteSubstitution(sub.SubstitutionID)}
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

      {subModal.open && (
        <SubstitutionModal
          item={subModal.item}
          allMaterials={materials}
          onSave={handleSaveSubstitution}
          onClose={() => setSubModal({ open: false, item: null })}
        />
      )}
    </div>
  );
};
