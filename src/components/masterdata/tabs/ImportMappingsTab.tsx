import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Info,
  Layers,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import {
  Sys_Import_Mapping,
  ImportDataType,
  Language,
} from '../../../types';
import {
  systemFieldsByType,
  SystemFieldDefinition,
} from '../../../utils/excelParser';
import {
  IMPORT_TYPE_METADATA,
  Field,
  inputCls,
  stickyThCls,
  FloatingHomeEndButtons,
  exportToExcel,
} from '../types';

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

export interface ImportMappingsTabProps {
  learnedMappings: Sys_Import_Mapping[];
  onSaveMapping?: (mapping: Sys_Import_Mapping) => void;
  onDeleteMapping: (mappingId: string) => void;
  language: Language;
}

export const ImportMappingsTab: React.FC<ImportMappingsTabProps> = ({
  learnedMappings,
  onSaveMapping,
  onDeleteMapping,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [mappingModal, setMappingModal] = useState<{
    open: boolean;
    item: Sys_Import_Mapping | null;
  }>({
    open: false,
    item: null,
  });

  const mapTableRef = useRef<HTMLDivElement>(null);

  const filteredMappings = useMemo(() => {
    return learnedMappings.filter((m) => {
      if (selectedModuleFilter !== 'ALL' && m.ImportType !== selectedModuleFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        m.ExcelHeaderName.toLowerCase().includes(q) ||
        m.SystemFieldName.toLowerCase().includes(q) ||
        (m.Description && m.Description.toLowerCase().includes(q))
      );
    });
  }, [learnedMappings, searchTerm, selectedModuleFilter]);

  const handleSaveMappingInternal = (item: Sys_Import_Mapping) => {
    if (!onSaveMapping) return;
    onSaveMapping(item);
    setMappingModal({ open: false, item: null });
  };

  const handleDeleteMappingInternal = (id: string) => {
    if (confirm('X�c nh?n x�a quy t?c �nh x? ti�u d? c?t n�y?')) {
      onDeleteMapping(id);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* ── 3. DATA TABLES WITH STICKY TABLE HEADERS & HOME/END BALLOONS ── */}


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

          <FloatingHomeEndButtons containerRef={mapTableRef} rowCount={filteredMappings.length} />
        </div>

      {mappingModal.open && (
        <MappingModal
          item={mappingModal.item}
          onSave={handleSaveMappingInternal}
          onClose={() => setMappingModal({ open: false, item: null })}
        />
      )}
    </div>
  );
};
