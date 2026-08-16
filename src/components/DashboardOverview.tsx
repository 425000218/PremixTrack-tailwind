import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Truck,
  ArrowLeftRight,
  Package,
  Clock,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  CalculatedMaterialMetric,
  Dim_Factory,
  Dim_Material,
  Fact_Inbound_Schedule,
  InterFactoryTransferSuggestion,
  Language
} from '../types';

interface DashboardOverviewProps {
  metrics: CalculatedMaterialMetric[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  inboundSchedules: Fact_Inbound_Schedule[];
  transferSuggestions: InterFactoryTransferSuggestion[];
  selectedFactoryId: string;
  onSelectFactory: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  language: Language;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  factories,
  materials,
  inboundSchedules,
  transferSuggestions,
  selectedFactoryId,
  onSelectFactory,
  onNavigateTab,
  language,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter metrics according to global factory selection
  const scopedMetrics = metrics.filter(
    (m) => selectedFactoryId === 'ALL' || m.FactoryID === selectedFactoryId
  );

  // Filter by category or search
  const filteredMetrics = scopedMetrics.filter((m) => {
    if (filterSeverity === 'CRITICAL' && m.Severity !== 'CRITICAL') return false;
    if (filterSeverity === 'WARNING' && m.Severity !== 'WARNING' && m.Severity !== 'CRITICAL') return false;
    if (filterSeverity === 'OVERSTOCK' && m.Severity !== 'OVERSTOCK') return false;
    if (filterSeverity === 'STOP_USAGE' && m.Severity !== 'STOP_USAGE_WARNING') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.MaterialName_VN.toLowerCase().includes(q) ||
        m.MaterialCode.toLowerCase().includes(q) ||
        m.FactoryCode.toLowerCase().includes(q) ||
        m.Category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate high-level KPIs
  const criticalCount = scopedMetrics.filter((m) => m.Severity === 'CRITICAL').length;
  const warningCount = scopedMetrics.filter((m) => m.Severity === 'WARNING').length;
  const balancedCount = scopedMetrics.filter((m) => m.Severity === 'BALANCED').length;
  const overstockCount = scopedMetrics.filter((m) => m.Severity === 'OVERSTOCK').length;
  const stopUsageCount = scopedMetrics.filter((m) => m.Severity === 'STOP_USAGE_WARNING').length;

  const totalSOHKg = scopedMetrics.reduce((sum, m) => sum + m.SOHQty, 0);
  const totalSOHTons = Math.round(totalSOHKg / 1000);
  const totalForecastMonthlyKg = scopedMetrics.reduce((sum, m) => sum + m.ForecastQty, 0);

  // Overstock Capital tied up (USD)
  const overstockCapitalUSD = scopedMetrics
    .filter((m) => m.Severity === 'OVERSTOCK')
    .reduce((sum, m) => {
      const mat = materials.find((item) => item.MaterialID === m.MaterialID);
      const excessKg = Math.max(0, m.SOHQty - m.DailyUsage * (m.SafetyStockDays * 2));
      return sum + excessKg * (mat?.UnitPriceUSD || 2.0);
    }, 0);

  const activeInboundTrucksCount = inboundSchedules.filter(
    (s) => s.Status === 'In_Transit' || s.Status === 'Scheduled'
  ).length;

  const topCriticalItems = scopedMetrics
    .filter((m) => m.Severity === 'CRITICAL')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Sleek KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total SOH */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === 'vi' ? 'Tổng Tồn Kho SOH' : 'Avg SOH (All Factories)'}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {totalSOHTons.toLocaleString()} <span className="text-sm font-normal text-slate-500">Tấn (MT)</span>
            </p>
          </div>
          <div className="mt-3 text-xs text-green-600 font-medium flex items-center gap-1">
            <span>↑ 4.2% so với tuần trước</span>
          </div>
        </div>

        {/* KPI 2: Active Forecasts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === 'vi' ? 'Phiên Bản Forecast' : 'Active Forecasts'}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {scopedMetrics.length} <span className="text-sm font-normal text-slate-500">SKUs Active</span>
            </p>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            Tháng 08/2026 • 28 Ngày làm việc
          </div>
        </div>

        {/* KPI 3: Critical Shortages - Sleek Red Accent */}
        <div
          onClick={() => setFilterSeverity('CRITICAL')}
          className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm ring-2 ring-red-500/5 cursor-pointer hover:ring-red-500/20 transition-all flex flex-col justify-between"
        >
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
              {language === 'vi' ? 'Nguy Cơ Dừng Máy (Khẩn)' : 'Critical Shortages'}
            </p>
            <p className="text-2xl font-bold text-red-600">
              {criticalCount < 10 ? `0${criticalCount}` : criticalCount}{' '}
              <span className="text-sm font-normal text-red-400">Vật tư nguy cấp</span>
            </p>
          </div>
          <div className="mt-3 text-xs text-red-500 font-medium">
            DOI &lt; 7.0 Ngày • Cần điều chuyển
          </div>
        </div>

        {/* KPI 4: Inter-factory & Inbound Fleet Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === 'vi' ? 'Tiến Độ Điều Phối' : 'Import & Dispatch Health'}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {transferSuggestions.length}{' '}
              <span className="text-sm font-normal text-slate-500">Đề xuất điều chuyển</span>
            </p>
          </div>
          <div
            onClick={() => onNavigateTab('transfers')}
            className="mt-3 text-xs text-blue-600 font-medium hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Xem chi tiết lộ trình vận tải</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Section Split: Table Queue + Right Column Alerts & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 8: Live Import & Inventory Matrix Queue */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Header toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <span>Ma Trận Tồn Kho &amp; Cảnh Báo Thiếu Hụt D365</span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {filteredMetrics.length} mã
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tính toán thời gian cạn kho (Stockout Date) và số ngày che phủ (DOI = [SOH + PO] / Usage_Day)
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã, tên nguyên liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Severity Filter Chips */}
          <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            {[
              { id: 'ALL', label: 'Tất cả trạng thái', count: scopedMetrics.length },
              { id: 'CRITICAL', label: 'Cực kỳ thiếu (< 7d)', count: criticalCount, color: 'text-red-600' },
              { id: 'WARNING', label: 'Cảnh báo thiếu', count: warningCount, color: 'text-amber-600' },
              { id: 'OVERSTOCK', label: 'Tồn vượt mức (> 35d)', count: overstockCount, color: 'text-blue-600' },
              { id: 'STOP_USAGE', label: 'Stop Usage', count: stopUsageCount, color: 'text-purple-600' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setFilterSeverity(pill.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-xs font-semibold ${
                  filterSeverity === pill.id
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className={pill.color || ''}>{pill.label}</span>
                <span className="ml-1 text-[10px] text-slate-400 font-mono">({pill.count})</span>
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto max-h-[440px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-widest sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">Nhà Máy</th>
                  <th className="px-4 py-3.5">Mã &amp; Tên Vật Tư</th>
                  <th className="px-4 py-3.5 text-right">Tồn SOH (Kg)</th>
                  <th className="px-4 py-3.5 text-right">PO Đang Về</th>
                  <th className="px-4 py-3.5 text-right">Tiêu Hao/Ngày</th>
                  <th className="px-4 py-3.5 text-center">DOI Tổng</th>
                  <th className="px-4 py-3.5 text-center">Cạn Kho</th>
                  <th className="px-4 py-3.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                {filteredMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Không có nguyên liệu nào thỏa mãn tiêu chí lọc.
                    </td>
                  </tr>
                ) : (
                  filteredMetrics.map((item, idx) => {
                    const isCritical = item.Severity === 'CRITICAL';
                    const isWarning = item.Severity === 'WARNING';
                    const isOverstock = item.Severity === 'OVERSTOCK';
                    const isStopUsage = item.Severity === 'STOP_USAGE_WARNING';

                    return (
                      <tr
                        key={`${item.FactoryID}-${item.MaterialID}-${idx}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCritical ? 'bg-red-50/40' : isWarning ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {item.FactoryCode}
                          </span>
                        </td>

                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="font-bold text-slate-900 truncate" title={item.MaterialName_VN}>
                            {item.MaterialName_VN}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span>Mã: {item.MaterialCode}</span>
                            {item.Status === 'Stop_Usage' && (
                              <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                STOP USAGE
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                          {Number(item.SOHQty).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right font-mono">
                          {item.OpenPOQty > 0 ? (
                            <span className="text-green-600 font-bold">
                              +{Number(item.OpenPOQty).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {Math.round(item.DailyUsage).toLocaleString()} kg/d
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                              isCritical
                                ? 'bg-red-100 text-red-700 animate-pulse'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800'
                                : isOverstock
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {item.DOI_Total >= 999 ? '> 90d' : `${item.DOI_Total.toFixed(1)} ngày`}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center text-xs font-mono">
                          {isCritical ? (
                            <span className="text-red-600 font-bold">{item.StockoutDate}</span>
                          ) : (
                            <span className="text-slate-500">{item.CoverageTillDate}</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {isCritical ? (
                            <button
                              onClick={() => onNavigateTab('transfers')}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-xs transition-colors cursor-pointer"
                            >
                              Điều chuyển
                            </button>
                          ) : (
                            <button
                              onClick={() => onNavigateTab('matrix')}
                              className="text-blue-600 hover:underline text-xs font-semibold cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Đang hiển thị {filteredMetrics.length} / {scopedMetrics.length} mã nguyên liệu
            </span>
            <button
              onClick={() => onNavigateTab('matrix')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              MỞ MA TRẬN TỒN KHO 2D TOÀN QUỐC →
            </button>
          </div>
        </div>

        {/* Col 4: Dark Accent Shortage Alerts + AI Strategy Cards */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Dark Accent Card: Real-time Shortage Alerts */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex-1 relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Real-time Shortage Alerts
                </h3>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              </div>

              <div className="space-y-3.5">
                {topCriticalItems.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-4">
                    Không có cảnh báo khẩn cấp nào tại cụm nhà máy này.
                  </div>
                ) : (
                  topCriticalItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="w-1 h-11 bg-red-500 rounded-full shrink-0 mt-0.5"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-red-400 mb-0.5 flex items-center justify-between">
                          <span>CRITICAL: {item.DOI_Total.toFixed(1)} Days DOI</span>
                          <span className="font-mono text-[10px] text-slate-400">{item.FactoryCode}</span>
                        </p>
                        <p className="text-xs font-semibold text-white truncate">
                          {item.MaterialName_VN} ({item.MaterialCode})
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tồn: {Number(item.SOHQty).toLocaleString()} kg | Nhu cầu: {Math.round(item.DailyUsage)} kg/ngày
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Background SVG decorative element */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between z-10">
              <span className="text-[11px] text-slate-400">Tự động quét theo chu kỳ D365</span>
              <button
                onClick={() => onNavigateTab('transfers')}
                className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Cứu viện ngay →
              </button>
            </div>
          </div>

          {/* White Card: Supply Strategy AI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Supply Strategy AI
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded border border-blue-100">
                  Gemini 3.7
                </span>
              </div>

              <div className="space-y-3">
                {transferSuggestions.slice(0, 2).map((sug, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs"
                  >
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium mb-0.5">Suggested Transfer</p>
                      <p className="text-xs font-bold text-slate-900 font-mono">
                        {sug.SourceFactoryCode} → {sug.TargetFactoryCode} ({Number(sug.RecommendedTransferKg).toLocaleString()} kg)
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[170px]">{sug.MaterialName}</p>
                    </div>
                    <button
                      onClick={() => onNavigateTab('transfers')}
                      className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      XỬ LÝ
                    </button>
                  </div>
                ))}

                <p className="text-[11px] text-slate-400 leading-relaxed text-center italic pt-1">
                  Thuật toán điều phối liên nhà máy tự động phát hiện dư thừa &amp; cân bằng tồn kho để bảo toàn tiến độ sản xuất.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('ai-advisor')}
              className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Mở Trợ Lý AI Advisor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
