import React, { useState, useMemo } from 'react';
import {
  Package,
  Calculator,
  Factory,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  DollarSign,
  TrendingDown,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  Dim_Factory,
  Dim_Material,
  Fact_Inventory_SOH,
  Fact_PO_Detail,
  Formula_BOM,
  Language
} from '../types';
import { explodeBOM } from '../utils/calculationEngine';

interface FormulaCalculatorProps {
  formulas: Formula_BOM[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  inventorySOH: Fact_Inventory_SOH[];
  poDetails: Fact_PO_Detail[];
  language: Language;
  onNavigateTab: (tab: string) => void;
}

export const FormulaCalculator: React.FC<FormulaCalculatorProps> = ({
  formulas,
  factories,
  materials,
  inventorySOH,
  poDetails,
  language,
  onNavigateTab,
}) => {
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(
    formulas[0]?.FormulaID || ''
  );
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    factories[0]?.FactoryID || ''
  );
  const [feedTonnage, setFeedTonnage] = useState<number>(1000); // 1,000 tons of finished feed

  const currentFormula = formulas.find((f) => f.FormulaID === selectedFormulaId) || formulas[0];

  const calculationResult = useMemo(() => {
    if (!currentFormula || !selectedFactoryId) return null;
    return explodeBOM(
      currentFormula,
      feedTonnage,
      selectedFactoryId,
      materials,
      inventorySOH,
      poDetails
    );
  }, [currentFormula, feedTonnage, selectedFactoryId, materials, inventorySOH, poDetails]);

  const selectedFactory = factories.find((f) => f.FactoryID === selectedFactoryId);

  const shortagesCount = calculationResult
    ? calculationResult.ingredients.filter((i) => i.isShortage).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>Tự Động Tính Toán Nhu Cầu Nguyên Liệu Theo Công Thức (Premix MRP &amp; BOM Explosion)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mô phỏng kế hoạch sản xuất thức ăn hoàn chỉnh (Feed Tonnage) và bóc tách định mức nguyên liệu vi lượng, so sánh trực tiếp với tồn kho thực tế của nhà máy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Tỷ lệ trộn Premix trong cám:</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
              {currentFormula?.PremixInclusionRateInFeed}% ({currentFormula?.PremixInclusionRateInFeed * 10} kg/tấn cám)
            </span>
          </div>
        </div>
      </div>

      {/* Input Parameters Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Formula Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            1. Chọn Công Thức Premix (BOM Formula)
          </label>
          <select
            value={selectedFormulaId}
            onChange={(e) => setSelectedFormulaId(e.target.value)}
            className="w-full bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition-colors"
          >
            {formulas.map((f) => (
              <option key={f.FormulaID} value={f.FormulaID}>
                {f.FormulaName} ({f.TargetSpecies})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 mt-1.5 font-mono">
            Mã định danh: {currentFormula?.FormulaCode} • {currentFormula?.Items.length} thành phần vi lượng
          </div>
        </div>

        {/* Factory Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            2. Nhà Máy Dự Kiến Sản Xuất (Site)
          </label>
          <select
            value={selectedFactoryId}
            onChange={(e) => setSelectedFactoryId(e.target.value)}
            className="w-full bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition-colors"
          >
            {factories.map((fac) => (
              <option key={fac.FactoryID} value={fac.FactoryID}>
                {fac.InternalCode} - {fac.FactoryName_VN}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 mt-1.5 font-mono">
            Công suất: {selectedFactory?.CapacityTonsPerMonth.toLocaleString()} tấn/tháng
          </div>
        </div>

        {/* Finished Feed Tonnage Input */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            3. Sản Lượng Cám Cần Sản Xuất (Tấn)
          </label>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="50000"
              step="50"
              value={feedTonnage}
              onChange={(e) => setFeedTonnage(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-50 text-base font-bold font-mono text-blue-600 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">Tấn cám</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">
            Tương đương mẻ trộn Premix:{' '}
            <strong className="text-slate-800 font-mono">
              {calculationResult ? (calculationResult.premixBatchKg / 1000).toLocaleString() : 0} Tấn
            </strong>
          </div>
        </div>
      </div>

      {/* Result Metrics Overview */}
      {calculationResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Khối lượng Premix cần</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {Number(calculationResult.premixBatchKg).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">kg</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {(calculationResult.premixBatchKg / 1000).toFixed(1)} tấn mẻ trộn
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ước tính chi phí vi lượng</div>
            <div className="text-2xl font-black text-blue-600 font-mono mt-1">
              ${calculationResult.totalCostUSD.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ~ ${(calculationResult.totalCostUSD / feedTonnage).toFixed(2)} / tấn cám
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border shadow-sm ${
              shortagesCount > 0
                ? 'bg-white border-red-100 ring-2 ring-red-500/5 text-red-600'
                : 'bg-white border-green-100 ring-2 ring-green-500/5 text-green-700'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              {shortagesCount > 0 ? (
                <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              )}
              <span>Nguyên liệu thiếu hụt</span>
            </div>
            <div className="text-2xl font-black font-mono mt-1">
              {shortagesCount} <span className="text-xs font-normal">thành phần</span>
            </div>
            <div className="text-[11px] mt-0.5 opacity-80 font-medium">
              {shortagesCount > 0 ? 'Cần bổ sung trước khi trộn' : 'Kho đáp ứng 100%'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Khả năng sản xuất tối đa</div>
            <div className="text-2xl font-black text-amber-600 font-mono mt-1">
              {Math.round(calculationResult.maxFeasibleBatches * feedTonnage).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">tấn</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={calculationResult.bottleneckMaterial?.Name_VN}>
              Nghẽn tại: <strong className="text-amber-700 font-mono">{calculationResult.bottleneckMaterial?.MaterialCode}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Detailed BOM Ingredients Table */}
      {calculationResult && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Bảng Phân Rã Nhu Cầu Từng Nguyên Liệu (BOM Requirements vs. Inventory)</span>
            </h3>

            {shortagesCount > 0 && (
              <button
                onClick={() => onNavigateTab('transfers')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Tìm nguồn điều chuyển bù thiếu ({shortagesCount} mã)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4">Tên Nguyên Liệu Premix</th>
                  <th className="py-3 px-4 text-right">Định Mức (kg/tấn Premix)</th>
                  <th className="py-3 px-4 text-right">Nhu Cầu Mẻ Này</th>
                  <th className="py-3 px-4 text-right">Tồn SOH Tại {selectedFactory?.InternalCode}</th>
                  <th className="py-3 px-4 text-right">PO Đang Về</th>
                  <th className="py-3 px-4 text-center">Tình Trạng Kho</th>
                  <th className="py-3 px-4 text-right">Thiếu Hụt (Kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {calculationResult.ingredients.map((item) => (
                  <tr
                    key={item.material.MaterialID}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      item.isShortage ? 'bg-red-50/40 text-red-900' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {item.material.MaterialCode}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.material.Name_VN}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.material.Category}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {currentFormula.Items.find((i) => i.MaterialID === item.material.MaterialID)
                        ?.QtyKgPerTonPremix || 0}{' '}
                      kg
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {Number(item.requiredKg).toLocaleString()} kg
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-800">
                      {Number(item.sohKg).toLocaleString()} kg
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-green-600 font-semibold">
                      {item.openPOKg > 0 ? `+${Number(item.openPOKg).toLocaleString()} kg` : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.isShortage ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          <AlertOctagon className="w-3 h-3" />
                          <span>Thiếu Hàng</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đủ Tồn Kho</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {item.isShortage ? (
                        <span className="text-red-600">-{Number(item.shortageKg).toLocaleString()} kg</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
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
