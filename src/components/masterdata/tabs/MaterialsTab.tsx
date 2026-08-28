import React, { useState, useRef, useMemo } from 'react';
import {
  Layers,
  Search,
  Download,
  FileSpreadsheet,
  FileDown,
  Plus,
  ArrowRightLeft,
  Edit2,
  AlertTriangle,
  X,
  Save,
  PackageCheck,
  Tag,
  Scale,
  Trash2,
} from 'lucide-react';
import {
  Dim_Material,
  Dim_Material_Substitution,
  Sys_Import_Mapping,
  Language,
  MaterialCategory,
  MaterialStatus,
  Fact_Inventory_SOH,
  Fact_Forecast_Detail,
  Fact_Production_Usage,
  Fact_PO_Detail,
  Formula_BOM,
  SubstitutionType,
} from '../../../types';
import {
  DependencyCheckResult,
  MATERIAL_CATEGORIES,
  MATERIAL_STATUSES,
  TAX_GROUP_OPTIONS,
  PACKING_GROUP_OPTIONS,
  PIC_OPTIONS,
  SUBSTITUTION_TYPE_LABELS,
  Field,
  inputCls,
  stickyThCls,
  exportToExcel,
  FloatingHomeEndButtons,
  useExcelUpload,
} from '../types';

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
                                Note: {sub.Note}
                              </div>
                            )}
                          </div>
                        </div> {onDeleteSubstitution && (
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

export interface MaterialsTabProps {
  materials: Dim_Material[];
  substitutions?: Dim_Material_Substitution[];
  learnedMappings: Sys_Import_Mapping[];
  inventorySOH?: Fact_Inventory_SOH[];
  forecastDetails?: Fact_Forecast_Detail[];
  usageLogs?: Fact_Production_Usage[];
  poDetails?: Fact_PO_Detail[];
  formulas?: Formula_BOM[];
  onUpdateMaterials: (updated: Dim_Material[]) => void;
  onDeleteMaterial?: (materialId: string) => void;
  onUpdateSubstitutions?: (updated: Dim_Material_Substitution[]) => void;
  language: Language;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  materials,
  substitutions = [],
  learnedMappings,
  inventorySOH,
  forecastDetails,
  usageLogs,
  poDetails,
  formulas,
  onUpdateMaterials,
  onDeleteMaterial,
  onUpdateSubstitutions,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedPICFilter, setSelectedPICFilter] = useState<string>('ALL');
  const [matModal, setMatModal] = useState<{ open: boolean; item: Dim_Material | null }>({
    open: false,
    item: null,
  });

  const matTableRef = useRef<HTMLDivElement>(null);

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
    if (sohCount > 0) reasons.push(`${sohCount} b?n ghi T?n kho th?c t? (SOH) t?i c�c nh� m�y`);
    if (fcCount > 0) reasons.push(`${fcCount} d�ng D? b�o nhu c?u k? ho?ch (Forecast)`);
    if (bomCount > 0) reasons.push(`${bomCount} C�ng th?c s?n xu?t (Formula BOM) dang s? d?ng`);
    if (usageCount > 0) reasons.push(`${usageCount} nh?t k� Ti�u hao s?n xu?t (Usage Logs)`);
    if (poCount > 0) reasons.push(`${poCount} �on d?t h�ng mua (PO Details)`);
    if (subCount > 0)
      reasons.push(`${subCount} quy t?c trong Ma Tr?n Thay Th? Nguy�n Li?u (Substitution Rules)`);

    return {
      canDelete: reasons.length === 0,
      reasons,
      summary: reasons.join(', '),
    };
  };

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
          CountryOfOrigin: r.CountryOfOrigin || prev?.CountryOfOrigin || 'Vi?t Nam',
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

  const uniquePICs = useMemo(() => {
    const s = new Set<string>();
    materials.forEach((m) => {
      if (m.PIC) s.add(m.PIC);
    });
    return Array.from(s);
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (
        selectedCategoryFilter !== 'ALL' &&
        m.Category !== selectedCategoryFilter
      ) {
        return false;
      }
      if (selectedPICFilter !== 'ALL' && m.PIC !== selectedPICFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        m.MaterialCode.toLowerCase().includes(q) ||
        m.Name_VN.toLowerCase().includes(q) ||
        m.Name_EN.toLowerCase().includes(q) ||
        (m.PIC && m.PIC.toLowerCase().includes(q)) ||
        (m.CountryOfOrigin && m.CountryOfOrigin.toLowerCase().includes(q))
      );
    });
  }, [materials, searchTerm, selectedCategoryFilter, selectedPICFilter]);

  const handleSaveMaterial = (item: Dim_Material) => {
    const existingIdx = materials.findIndex(
      (m) => m.MaterialID === item.MaterialID || m.MaterialCode.toUpperCase() === item.MaterialCode.toUpperCase()
    );
    let updated: Dim_Material[];
    if (existingIdx >= 0) {
      updated = [...materials];
      updated[existingIdx] = item;
    } else {
      updated = [item, ...materials];
    }
    onUpdateMaterials(updated);
    setMatModal({ open: false, item: null });
  };

  const toggleMaterialStatus = (id: string) => {
    const updated = materials.map((m) => {
      if (m.MaterialID === id) {
        const nextStatus: MaterialStatus = m.Status === 'Active' ? 'Stop_Usage' : 'Active';
        return { ...m, Status: nextStatus };
      }
      return m;
    });
    onUpdateMaterials(updated);
  };

  const handleSaveSubstitutionFromMatModal = (sub: Dim_Material_Substitution) => {
    if (!onUpdateSubstitutions) return;
    const existingIdx = substitutions.findIndex((s) => s.SubstitutionID === sub.SubstitutionID);
    let updated: Dim_Material_Substitution[];
    if (existingIdx >= 0) {
      updated = [...substitutions];
      updated[existingIdx] = sub;
    } else {
      updated = [sub, ...substitutions];
    }
    onUpdateSubstitutions(updated);
  };

  const handleDeleteSubstitutionFromMatModal = (subId: string) => {
    if (!onUpdateSubstitutions) return;
    onUpdateSubstitutions(substitutions.filter((s) => s.SubstitutionID !== subId));
  };

  const handleExportMaterials = () => {
    const exportData = filteredMaterials.map((m) => ({
      CODE: m.MaterialCode,
      DESC: m.Name_VN,
      PIC: m.PIC || 'Fiona',
      'Item sales tax group': m.TaxGroup || 'NonVAT',
      'Overdelivery (%)': m.OverdeliveryPct ?? 0,
      'Packing group': m.PackingGroup || 'Bags',
      CountryOfOrigin: m.CountryOfOrigin || 'Vi?t Nam',
      Category: m.Category,
      Unit: m.Unit || 'kg',
      SafetyStockDays: m.SafetyStockDays,
      UnitPriceUSD: m.UnitPriceUSD,
      Status: m.Status,
      SpecDescription: m.SpecDescription || '',
    }));
    exportToExcel(exportData, 'Danh_Muc_Nguyen_Lieu_tblITEM');
  };

  return (
    <div className="space-y-4">
      {matUpload.uploadMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <PackageCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{matUpload.uploadMsg}</span>
        </div>
      )}

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

      {matModal.open && (
        <MaterialModal
          item={matModal.item}
          allMaterials={materials}
          allSubstitutions={substitutions}
          onSave={handleSaveMaterial}
          onDelete={onDeleteMaterial}
          onSaveSubstitution={handleSaveSubstitutionFromMatModal}
          onDeleteSubstitution={handleDeleteSubstitutionFromMatModal}
          checkDependencies={checkMaterialDependencies}
          onClose={() => setMatModal({ open: false, item: null })}
        />
      )}
    </div>
  );
};
