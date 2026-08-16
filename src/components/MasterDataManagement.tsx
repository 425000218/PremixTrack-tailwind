import React, { useState } from 'react';
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
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  Dim_Factory,
  Dim_Material,
  Dim_Supplier,
  Sys_Import_Mapping,
  Language
} from '../types';

interface MasterDataManagementProps {
  factories: Dim_Factory[];
  materials: Dim_Material[];
  suppliers: Dim_Supplier[];
  learnedMappings: Sys_Import_Mapping[];
  onUpdateMaterials: (updated: Dim_Material[]) => void;
  onDeleteMapping: (mappingId: string) => void;
  language: Language;
}

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  factories,
  materials,
  suppliers,
  learnedMappings,
  onUpdateMaterials,
  onDeleteMapping,
  language,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'factories' | 'suppliers' | 'mappings'>('materials');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleMaterialStatus = (materialId: string) => {
    const updated = materials.map((m) => {
      if (m.MaterialID === materialId) {
        const nextStatus: 'Active' | 'Stop_Usage' = m.Status === 'Active' ? 'Stop_Usage' : 'Active';
        return { ...m, Status: nextStatus };
      }
      return m;
    });
    onUpdateMaterials(updated);
  };

  const filteredMaterials = materials.filter((m) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      m.Name_VN.toLowerCase().includes(q) ||
      m.MaterialCode.toLowerCase().includes(q) ||
      m.Category.toLowerCase().includes(q)
    );
  });

  const filteredMappings = learnedMappings.filter((m) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      m.ExcelHeaderName.toLowerCase().includes(q) ||
      m.SystemFieldName.toLowerCase().includes(q) ||
      m.ImportType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>Quản Lý Dữ Liệu Danh Mục Gốc &amp; Từ Điển Ánh Xạ Header (Master Data &amp; Mappings)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị mô hình dữ liệu hình sao (Star Schema Dim/Fact), lộ trình thay thế mã vật tư (Planned Substitution) và quy tắc học ánh xạ cột Excel từ D365.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs">
          {[
            { id: 'materials' as const, label: 'Nguyên Liệu (Dim_Materials)' },
            { id: 'factories' as const, label: 'Nhà Máy (Dim_Factories)' },
            { id: 'suppliers' as const, label: 'Nhà Cung Cấp (Dim_Suppliers)' },
            { id: 'mappings' as const, label: `Từ Điển Header (${learnedMappings.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: Materials */}
      {activeSubTab === 'materials' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Danh Mục Nguyên Liệu Premix Thức Ăn Gia Súc ({materials.length} SKUs)</span>
            </h3>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên nguyên liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4">Tên Nguyên Liệu (VN / EN)</th>
                  <th className="py-3 px-4">Phân Nhóm</th>
                  <th className="py-3 px-4 text-center">ĐVT</th>
                  <th className="py-3 px-4 text-right">Định Mức An Toàn</th>
                  <th className="py-3 px-4 text-right">Đơn Giá ($/Kg)</th>
                  <th className="py-3 px-4 text-center">Trạng Thái D365</th>
                  <th className="py-3 px-4">Mã Thay Thế Khi Dừng</th>
                  <th className="py-3 px-4 text-center">Chuyển Đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredMaterials.map((mat) => (
                  <tr key={mat.MaterialID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {mat.MaterialCode}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{mat.Name_VN}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{mat.Name_EN}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                        {mat.Category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">{mat.Unit}</td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {mat.SafetyStockDays} ngày
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-green-700">
                      ${mat.UnitPriceUSD.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mat.Status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {mat.Status === 'Active' ? 'Active' : 'Stop_Usage'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {mat.ReplacementMaterialCode ? (
                        <span className="text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold">
                          ➔ {mat.ReplacementMaterialCode}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleMaterialStatus(mat.MaterialID)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Đổi trạng thái
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Factories */}
      {activeSubTab === 'factories' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-600" />
              <span>Hệ Thống 8 Nhà Máy Sản Xuất Thức Ăn Thức Ăn Gia Súc Toàn Quốc (Dim_Factories)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã Nội Bộ</th>
                  <th className="py-3 px-4">Tên Nhà Máy</th>
                  <th className="py-3 px-4">Mã Header D365 Forecast (043, 0432...)</th>
                  <th className="py-3 px-4">Khu Vực</th>
                  <th className="py-3 px-4 text-right">Công Suất (Tấn/Tháng)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {factories.map((fac) => (
                  <tr key={fac.FactoryID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 text-sm">
                      {fac.InternalCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{fac.FactoryName_VN}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 bg-slate-50">
                      {fac.ForecastHeaderCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {fac.RegionID === 'REG-SOUTH'
                        ? 'Miền Nam (Đông Nam Bộ)'
                        : fac.RegionID === 'REG-NORTH'
                        ? 'Miền Bắc & Duyên Hải'
                        : fac.RegionID === 'REG-MEKONG'
                        ? 'Đồng Bằng Sông Cửu Long'
                        : fac.RegionID === 'REG-CENTRAL'
                        ? 'Miền Trung & Tây Nguyên'
                        : fac.RegionID || 'Toàn quốc'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-green-700">
                      {fac.CapacityTonsPerMonth.toLocaleString()} tấn
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Suppliers */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Danh Mục Nhà Cung Cấp Chiến Lược (Dim_Suppliers)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã Nhà Cung Cấp</th>
                  <th className="py-3 px-4">Tên Công Ty</th>
                  <th className="py-3 px-4">Quốc Gia</th>
                  <th className="py-3 px-4 text-center">Điều Khoản Giao (Incoterm)</th>
                  <th className="py-3 px-4 text-right">Thời Gian Giao (Lead Time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {suppliers.map((sup) => (
                  <tr key={sup.SupplierID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{sup.SupplierCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sup.SupplierName}</td>
                    <td className="py-3 px-4">{sup.Country}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{sup.Incoterm}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-green-700">
                      {sup.LeadTimeDays} ngày
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Learned Header Mappings */}
      {activeSubTab === 'mappings' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Từ Điển Ánh Xạ Header Linh Hoạt Đã Học (Sys_Import_Mappings)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các quy tắc ghi nhớ khi người dùng import file Excel từ D365 FO để lần sau tự động khớp 100%.
              </p>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm quy tắc ánh xạ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Loại Nghiệp Vụ</th>
                  <th className="py-3 px-4">Tên Cột Excel Trong File</th>
                  <th className="py-3 px-4">Trường Hệ Thống PremixTrack</th>
                  <th className="py-3 px-4">Ghi Chú</th>
                  <th className="py-3 px-4 text-center">Ngày Học</th>
                  <th className="py-3 px-4 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredMappings.map((m) => (
                  <tr key={m.MappingID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                        {m.ImportType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.ExcelHeaderName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">➔ {m.SystemFieldName}</td>
                    <td className="py-3 px-4 text-slate-500">{m.Description}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{m.CreatedAt}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteMapping(m.MappingID)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Xóa quy tắc này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
