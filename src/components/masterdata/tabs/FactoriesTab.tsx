import React, { useState, useRef, useMemo } from 'react';
import {
  Factory,
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
  Building,
  Trash2,
  Warehouse,
  Globe2,
} from 'lucide-react';
import {
  Dim_Factory,
  Sys_Import_Mapping,
  Language,
  FactoryDivision,
  Fact_Inventory_SOH,
  Fact_Forecast_Detail,
  Fact_Production_Usage,
  Fact_Inbound_Schedule,
  Fact_PurchaseOrder,
} from '../../../types';
import {
  DependencyCheckResult,
  REGION_OPTIONS,
  DIVISION_OPTIONS,
  SITE_OPTIONS,
  Field,
  inputCls,
  stickyThCls,
  exportToExcel,
  FloatingHomeEndButtons,
  useExcelUpload,
} from '../types';

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

export interface FactoriesTabProps {
  factories: Dim_Factory[];
  learnedMappings: Sys_Import_Mapping[];
  inventorySOH?: Fact_Inventory_SOH[];
  forecastDetails?: Fact_Forecast_Detail[];
  usageLogs?: Fact_Production_Usage[];
  inboundSchedules?: Fact_Inbound_Schedule[];
  poHeaders?: Fact_PurchaseOrder[];
  onUpdateFactories?: (updated: Dim_Factory[]) => void;
  onDeleteFactory?: (factoryId: string) => void;
  language: Language;
}

export const FactoriesTab: React.FC<FactoriesTabProps> = ({
  factories,
  learnedMappings,
  inventorySOH,
  forecastDetails,
  usageLogs,
  inboundSchedules,
  poHeaders,
  onUpdateFactories,
  onDeleteFactory,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('ALL');
  const [facModal, setFacModal] = useState<{ open: boolean; item: Dim_Factory | null }>({
    open: false,
    item: null,
  });

  const facTableRef = useRef<HTMLDivElement>(null);

  const livestockCount = useMemo(
    () => (factories || []).filter((f) => f.Division === 'Livestock').length,
    [factories]
  );
  const aquaCount = useMemo(
    () => (factories || []).filter((f) => f.Division === 'Aqua').length,
    [factories]
  );
  const southCount = useMemo(
    () => (factories || []).filter((f) => f.RegionID === 'SOUTH').length,
    [factories]
  );
  const northCount = useMemo(
    () => (factories || []).filter((f) => f.RegionID === 'NORTH').length,
    [factories]
  );

  const checkFactoryDependencies = (fac: Dim_Factory): DependencyCheckResult => {
    const facId = fac.FactoryID;
    const intCode = fac.InternalCode.toUpperCase();
    const match = (id?: string) =>
      id === facId || id === `FAC-${intCode}` || (id && id.toUpperCase() === intCode);

    const sohCount = (inventorySOH || []).filter((s) => match(s.FactoryID)).length;
    const fcCount = (forecastDetails || []).filter((f) => match(f.FactoryID)).length;
    const usageCount = (usageLogs || []).filter((u) => match(u.FactoryID)).length;
    const inboundCount = (inboundSchedules || []).filter((i) => match(i.FactoryCode) || match(i.FactoryName)).length;

    const reasons: string[] = [];
    if (sohCount > 0) reasons.push(`${sohCount} bản ghi Tồn kho thực tế (SOH)`);
    if (fcCount > 0) reasons.push(`${fcCount} dòng Dự báo nhu cầu (Forecast Details)`);
    if (usageCount > 0) reasons.push(`${usageCount} nhật ký Tiêu hao sản xuất (Usage Logs)`);
    if (inboundCount > 0) reasons.push(`${inboundCount} lịch Giao hàng / Cân xe (Inbound Schedules)`);

    return {
      canDelete: reasons.length === 0,
      reasons,
      summary: reasons.join(', '),
    };
  };

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
      if (!onUpdateFactories) return;
      const existingMap = new Map<string, Dim_Factory>(
        factories.map((f) => [f.InternalCode.toUpperCase(), f])
      );
      rows.forEach((r) => {
        if (!r.InternalCode) return;
        const codeUpper = r.InternalCode.toUpperCase();
        const prev = existingMap.get(codeUpper);
        const itemToSave: Dim_Factory = {
          FactoryID: prev?.FactoryID || `FAC-${r.InternalCode}`,
          InternalCode: r.InternalCode.toUpperCase(),
          FactoryName_VN: r.FactoryName_VN || r.InternalCode,
          FactoryName_EN: r.FactoryName_EN || r.FactoryName_VN || r.InternalCode,
          RegionID: r.RegionID ? (r.RegionID.startsWith('REG-') ? r.RegionID : `REG-${r.RegionID}`) : prev?.RegionID || 'REG-SOUTH',
          Division: (r.Division as FactoryDivision) || prev?.Division || 'Livestock',
          WarehouseCode: r.WarehouseCode || prev?.WarehouseCode || r.InternalCode,
          CustomerVendorRef: r.CustomerVendorRef || prev?.CustomerVendorRef || '',
          SiteCode: r.SiteCode || prev?.SiteCode || 'dhv',
          ForecastHeaderCode: r.ForecastHeaderCode || prev?.ForecastHeaderCode || r.InternalCode,
          Address: r.Address || prev?.Address || '',
          CapacityTonsPerMonth: Number(r.CapacityTonsPerMonth ?? prev?.CapacityTonsPerMonth ?? 25000),
        };
        existingMap.set(codeUpper, itemToSave);
      });
      onUpdateFactories(Array.from(existingMap.values()));
    }
  );

  const filteredFactories = useMemo(() => {
    return factories.filter((f) => {
      if (selectedRegionFilter !== 'ALL') {
        const cleanReg = f.RegionID.replace('REG-', '');
        if (cleanReg !== selectedRegionFilter) return false;
      }
      if (selectedDivisionFilter !== 'ALL' && f.Division !== selectedDivisionFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        f.InternalCode.toLowerCase().includes(q) ||
        f.FactoryName_VN.toLowerCase().includes(q) ||
        f.WarehouseCode?.toLowerCase().includes(q) ||
        f.CustomerVendorRef?.toLowerCase().includes(q) ||
        f.SiteCode?.toLowerCase().includes(q) ||
        f.Address?.toLowerCase().includes(q)
      );
    });
  }, [factories, searchTerm, selectedRegionFilter, selectedDivisionFilter]);

  const handleSaveFactory = (item: Dim_Factory) => {
    if (!onUpdateFactories) return;
    const existingIdx = factories.findIndex(
      (f) =>
        f.FactoryID === item.FactoryID ||
        f.InternalCode.toUpperCase() === item.InternalCode.toUpperCase()
    );
    let updated: Dim_Factory[];
    if (existingIdx >= 0) {
      updated = [...factories];
      updated[existingIdx] = item;
    } else {
      updated = [item, ...factories];
    }
    onUpdateFactories(updated);
    setFacModal({ open: false, item: null });
  };

  const handleExportFactories = () => {
    const exportData = filteredFactories.map((f) => ({
      FACTORY: f.InternalCode,
      DESC: f.FactoryName_VN,
      REGION: f.RegionID.replace('REG-', ''),
      Division: f.Division,
      WAREHOUSE: f.WarehouseCode || f.InternalCode,
      'Customer or vendor reference': f.CustomerVendorRef || '',
      Site: f.SiteCode || 'dhv',
      CapacityTonsPerMonth: f.CapacityTonsPerMonth,
      Address: f.Address || '',
    }));
    exportToExcel(exportData, 'Danh_Muc_Nha_May_tblFACTORY');
  };

  return (
    <div className="space-y-4">
      {facUpload.uploadMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <PackageCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{facUpload.uploadMsg}</span>
        </div>
      )}

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

      {facModal.open && (
        <FactoryModal
          item={facModal.item}
          onSave={handleSaveFactory}
          onDelete={onDeleteFactory}
          checkDependencies={checkFactoryDependencies}
          onClose={() => setFacModal({ open: false, item: null })}
        />
      )}
    </div>
  );
};
