import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Layers,
  Search,
  Filter,
  Download,
  Info,
  X,
  Package,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Tag
} from 'lucide-react';
import {
  CalculatedMaterialMetric,
  Dim_Factory,
  Dim_Material,
  Fact_Inventory_SOH,
  Fact_PO_Detail,
  Language
} from '../types';

interface InventoryMatrixProps {
  metrics: CalculatedMaterialMetric[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  inventorySOH: Fact_Inventory_SOH[];
  poDetails: Fact_PO_Detail[];
  language: Language;
  onNavigateTab: (tab: string) => void;
}

export const InventoryMatrix: React.FC<InventoryMatrixProps> = ({
  metrics,
  factories,
  materials,
  inventorySOH,
  poDetails,
  language,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCell, setSelectedCell] = useState<{
    factory: Dim_Factory;
    material: Dim_Material;
    metric?: CalculatedMaterialMetric;
    sohList: Fact_Inventory_SOH[];
    poList: Fact_PO_Detail[];
  } | null>(null);

  const categories = [
    { id: 'ALL', label: 'Tất cả nhóm nguyên liệu' },
    { id: 'Amino_Acids', label: 'Amino Acids' },
    { id: 'Vitamins', label: 'Vitamins' },
    { id: 'Trace_Minerals', label: 'Khoáng vi lượng (Minerals)' },
    { id: 'Enzymes', label: 'Enzymes sinh học' },
    { id: 'Toxin_Binders', label: 'Hút độc tố (Toxin Binders)' },
    { id: 'Carriers_Minerals', label: 'Chất mang & Khoáng đa lượng' },
  ];

  const filteredMaterials = materials.filter((mat) => {
    if (selectedCategory !== 'ALL' && mat.Category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        mat.Name_VN.toLowerCase().includes(q) ||
        mat.MaterialCode.toLowerCase().includes(q) ||
        mat.Name_EN.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCellClick = (factory: Dim_Factory, material: Dim_Material) => {
    const metric = metrics.find(
      (m) => m.FactoryID === factory.FactoryID && m.MaterialID === material.MaterialID
    );
    const sohList = inventorySOH.filter(
      (s) => s.FactoryID === factory.FactoryID && s.MaterialID === material.MaterialID
    );
    const poList = poDetails.filter(
      (p) => p.FactoryID === factory.FactoryID && p.MaterialID === material.MaterialID
    );

    setSelectedCell({
      factory,
      material,
      metric,
      sohList,
      poList,
    });
  };

  const handleExportMatrixExcel = () => {
    const headers = [
      'Mã Nguyên Liệu',
      'Tên Nguyên Liệu',
      'Nhóm Hàng',
      'ĐVT',
      'Định Mức An Toàn (Ngày)',
      ...factories.map((f) => `${f.InternalCode} - Tồn SOH (kg)`),
      ...factories.map((f) => `${f.InternalCode} - DOI (Ngày)`),
    ];

    const rows = filteredMaterials.map((mat) => {
      const rowData: any[] = [
        mat.MaterialCode,
        mat.Name_VN,
        mat.Category,
        mat.Unit,
        mat.SafetyStockDays,
      ];

      // Add SOH for each factory
      factories.forEach((f) => {
        const metric = metrics.find(
          (m) => m.FactoryID === f.FactoryID && m.MaterialID === mat.MaterialID
        );
        rowData.push(metric ? metric.SOHQty : 0);
      });

      // Add DOI for each factory
      factories.forEach((f) => {
        const metric = metrics.find(
          (m) => m.FactoryID === f.FactoryID && m.MaterialID === mat.MaterialID
        );
        rowData.push(metric ? Math.round(metric.DOI_Total * 10) / 10 : 0);
      });

      return rowData;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Matrix');
    XLSX.writeFile(workbook, `PremixTrack_Stock_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Ma Trận Tồn Kho &amp; Ngày Che Phủ Đa Nhà Máy (Stock &amp; DOI Matrix)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem toàn cảnh mức tồn kho và ngày che phủ (DOI) của từng nguyên liệu qua 8 nhà máy trên toàn quốc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên nguyên liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white w-56 transition-colors"
            />
          </div>

          {/* Export button */}
          <button
            onClick={handleExportMatrixExcel}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Xuất Excel Ma Trận</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium text-xs ${
                selectedCategory === c.id
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 shadow-xs">
          <span className="font-bold text-slate-400">Chú giải DOI:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> &lt; 7 ngày (Nguy cấp)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> &lt; Định mức an toàn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Đạt chuẩn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> &gt; 35 ngày (Dư thừa)
          </span>
        </div>
      </div>

      {/* 2D Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-20">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[240px] sticky left-0 bg-slate-50 z-30 border-r border-slate-200 uppercase text-[10px] tracking-wider text-slate-500">
                  Mã &amp; Tên Nguyên Liệu Premix
                </th>
                <th className="py-3.5 px-3 font-bold text-center w-20 border-r border-slate-200 uppercase text-[10px] tracking-wider text-slate-500">
                  Định Mức
                </th>
                {factories.map((fac) => (
                  <th
                    key={fac.FactoryID}
                    className="py-3 px-3 font-bold text-center min-w-[130px] border-r border-slate-200"
                  >
                    <div className="font-mono text-blue-600 text-xs font-bold">{fac.InternalCode}</div>
                    <div className="text-[10px] text-slate-500 font-normal truncate max-w-[120px]">
                      {fac.FactoryName_VN.replace('Nhà máy ', '').split('(')[0]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat) => (
                <tr key={mat.MaterialID} className="hover:bg-slate-50/70 transition-colors">
                  {/* Fixed Material Info Header */}
                  <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{mat.Name_VN}</span>
                      {mat.Status === 'Stop_Usage' && (
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1 rounded">
                          Stop
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                      <span className="text-blue-600 font-semibold">SKU: {mat.MaterialCode}</span>
                      <span>•</span>
                      <span>{mat.Unit}</span>
                    </div>
                  </td>

                  {/* Safety Stock Days */}
                  <td className="py-3 px-3 text-center border-r border-slate-100 font-mono text-slate-500 font-medium">
                    {mat.SafetyStockDays}d
                  </td>

                  {/* Factory Columns */}
                  {factories.map((fac) => {
                    const metric = metrics.find(
                      (m) => m.FactoryID === fac.FactoryID && m.MaterialID === mat.MaterialID
                    );

                    if (!metric || (metric.SOHQty === 0 && metric.ForecastQty === 0 && metric.OpenPOQty === 0)) {
                      return (
                        <td
                          key={fac.FactoryID}
                          onClick={() => handleCellClick(fac, mat)}
                          className="py-3 px-3 text-center border-r border-slate-100 text-slate-300 hover:bg-slate-100 cursor-pointer"
                        >
                          <span className="text-xs font-mono">-</span>
                        </td>
                      );
                    }

                    const isCritical = metric.Severity === 'CRITICAL';
                    const isWarning = metric.Severity === 'WARNING';
                    const isOverstock = metric.Severity === 'OVERSTOCK';

                    return (
                      <td
                        key={fac.FactoryID}
                        onClick={() => handleCellClick(fac, mat)}
                        className={`py-3 px-3 text-center border-r border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors ${
                          isCritical
                            ? 'bg-red-50/50'
                            : isWarning
                            ? 'bg-amber-50/40'
                            : isOverstock
                            ? 'bg-blue-50/30'
                            : ''
                        }`}
                      >
                        <div className="font-mono font-bold text-slate-900">
                          {Number(metric.SOHQty).toLocaleString()} <span className="text-[9px] font-normal text-slate-400">kg</span>
                        </div>

                        <div className="mt-1 flex items-center justify-center gap-1">
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                              isCritical
                                ? 'bg-red-100 text-red-700 animate-pulse'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800'
                                : isOverstock
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {metric.DOI_Total >= 999 ? '> 90d' : `${metric.DOI_Total.toFixed(1)}d`}
                          </span>

                          {metric.OpenPOQty > 0 && (
                            <span
                              title={`Có ${Number(metric.OpenPOQty).toLocaleString()} kg PO đang về`}
                              className="text-[9px] font-mono text-green-700 bg-green-100 px-1 rounded font-bold"
                            >
                              +PO
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Detail Modal for Clicked Cell */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs">
                    {selectedCell.factory.InternalCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedCell.material.Name_VN}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCell.factory.FactoryName_VN} • Mã vật tư: {selectedCell.material.MaterialCode}
                </p>
              </div>

              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Metric Breakdown Cards */}
              {selectedCell.metric && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500">Tồn kho SOH</div>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {Number(selectedCell.metric.SOHQty).toLocaleString()} kg
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500">Nhu cầu/ngày</div>
                    <div className="text-base font-bold text-slate-700 font-mono mt-0.5">
                      {Math.round(selectedCell.metric.DailyUsage).toLocaleString()} kg/d
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500">DOI che phủ</div>
                    <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
                      {selectedCell.metric.DOI_Total.toFixed(1)} ngày
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500">Ngày hết hàng</div>
                    <div className="text-base font-bold text-red-600 font-mono mt-0.5">
                      {selectedCell.metric.StockoutDate}
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Inventory Batch Records */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chi tiết các lô hàng thực tế trong kho (Fact_Inventory_SOH):</span>
                </h4>
                {selectedCell.sohList.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-center">
                    Hiện chưa có số liệu lô hàng nào trong kho.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Số Lô (Batch)</th>
                          <th className="py-2 px-3">Vị Trí Kho</th>
                          <th className="py-2 px-3">Hạn Dùng</th>
                          <th className="py-2 px-3 text-right">Khối Lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedCell.sohList.map((s) => (
                          <tr key={s.SOH_ID}>
                            <td className="py-2 px-3 font-mono text-blue-600 font-bold">{s.BatchNumber}</td>
                            <td className="py-2 px-3">{s.WarehouseLocation}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{s.ExpiryDate}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {Number(s.Quantity).toLocaleString()} kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Open Inbound POs */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đơn mua hàng đang về (Fact_PO_Details):</span>
                </h4>
                {selectedCell.poList.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-center">
                    Không có đơn mua hàng PO nào đang mở cho vật tư này.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Mã PO</th>
                          <th className="py-2 px-3 text-right">Số Lượng Đặt</th>
                          <th className="py-2 px-3 text-right">Đã Nhận</th>
                          <th className="py-2 px-3 text-right">Còn Lại (Inbound)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedCell.poList.map((p) => (
                          <tr key={p.PODetailID}>
                            <td className="py-2 px-3 font-mono text-blue-600 font-bold">{p.POID}</td>
                            <td className="py-2 px-3 text-right font-mono">{Number(p.OrderQty).toLocaleString()} kg</td>
                            <td className="py-2 px-3 text-right font-mono">{Number(p.ReceivedQty).toLocaleString()} kg</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-green-600">
                              {Number(p.RemainQty).toLocaleString()} kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Planned Substitution Guidance if Stop Usage */}
              {selectedCell.material.Status === 'Stop_Usage' && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-purple-700">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Lộ trình chuyển đổi nguyên liệu (Planned Substitution):</span>
                  </div>
                  <p className="text-purple-700 text-xs">
                    Mã <strong>{selectedCell.material.MaterialCode}</strong> đang xả nốt lượng tồn kho. Khi DOI về 0, hệ thống tự động chuyển đổi sang mã thay thế mới.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedCell(null);
                  onNavigateTab('transfers');
                }}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Kiểm tra điều chuyển nội bộ →
              </button>

              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
