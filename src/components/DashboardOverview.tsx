import React, { useState, useMemo } from 'react';
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
  RefreshCw,
  Boxes,
  Flame,
  ArrowUpRight,
  ArrowRight,
  Layers,
  Building2,
  Activity,
  Zap,
} from 'lucide-react';
import {
  CalculatedMaterialMetric,
  Dim_Factory,
  Dim_Material,
  Fact_Inbound_Schedule,
  InterFactoryTransferSuggestion,
  Language,
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
  const [sortField, setSortField] = useState<'DOI' | 'SOH' | 'NAME' | 'FACTORY'>('DOI');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Filter metrics according to global factory selection
  const scopedMetrics = useMemo(() => {
    return metrics.filter(
      (m) => selectedFactoryId === 'ALL' || m.FactoryID === selectedFactoryId
    );
  }, [metrics, selectedFactoryId]);

  // High-level KPI Computations
  const stats = useMemo(() => {
    const critical = scopedMetrics.filter((m) => m.Severity === 'CRITICAL');
    const warning = scopedMetrics.filter((m) => m.Severity === 'WARNING');
    const balanced = scopedMetrics.filter((m) => m.Severity === 'BALANCED');
    const overstock = scopedMetrics.filter((m) => m.Severity === 'OVERSTOCK');
    const stopUsage = scopedMetrics.filter((m) => m.Severity === 'STOP_USAGE_WARNING');

    const totalSOHKg = scopedMetrics.reduce((sum, m) => sum + (m.SOHQty || 0), 0);
    const totalSOHTons = Math.round(totalSOHKg / 1000);
    const totalDailyUsageKg = scopedMetrics.reduce((sum, m) => sum + (m.DailyUsage || 0), 0);
    const avgDOI = totalDailyUsageKg > 0 ? (totalSOHKg / totalDailyUsageKg) : 0;

    // Overstock Capital tied up (USD)
    const overstockCapitalUSD = overstock.reduce((sum, m) => {
      const mat = materials.find((item) => item.MaterialID === m.MaterialID);
      const excessKg = Math.max(0, m.SOHQty - m.DailyUsage * (m.SafetyStockDays * 2));
      return sum + excessKg * (mat?.UnitPriceUSD || 2.0);
    }, 0);

    const activeInboundTrucks = inboundSchedules.filter(
      (s) => s.Status === 'In_Transit' || s.Status === 'Scheduled'
    );

    return {
      criticalCount: critical.length,
      warningCount: warning.length,
      balancedCount: balanced.length,
      overstockCount: overstock.length,
      stopUsageCount: stopUsage.length,
      totalSOHTons,
      totalSOHKg,
      avgDOI,
      overstockCapitalUSD,
      activeTrucksCount: activeInboundTrucks.length,
      criticalItems: critical,
    };
  }, [scopedMetrics, materials, inboundSchedules]);

  // Filtered and Sorted Table Data
  const filteredMetrics = useMemo(() => {
    let list = scopedMetrics.filter((m) => {
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

    list.sort((a, b) => {
      let comp = 0;
      if (sortField === 'DOI') comp = a.DOI_Total - b.DOI_Total;
      else if (sortField === 'SOH') comp = a.SOHQty - b.SOHQty;
      else if (sortField === 'NAME') comp = a.MaterialName_VN.localeCompare(b.MaterialName_VN);
      else if (sortField === 'FACTORY') comp = a.FactoryCode.localeCompare(b.FactoryCode);

      return sortOrder === 'ASC' ? comp : -comp;
    });

    return list;
  }, [scopedMetrics, filterSeverity, searchTerm, sortField, sortOrder]);

  const handleSort = (field: 'DOI' | 'SOH' | 'NAME' | 'FACTORY') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. EXECUTIVE MISSION HUD (HEADS-UP DISPLAY) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* HUD Card 1: Total SOH Volume */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-400" />
                {language === 'vi' ? 'Tổng Tồn Kho SOH' : 'Total Inventory SOH'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight font-mono tabular-nums text-white">
                  {stats.totalSOHTons.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase">Tấn (MT)</span>
              </div>
            </div>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              DOI TB: <strong className="text-blue-400">{stats.avgDOI.toFixed(1)} ngày</strong>
            </span>
            <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +4.2% tuần này
            </span>
          </div>
          {/* Subtle background glow */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* HUD Card 2: Active SKUs & Coverage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                {language === 'vi' ? 'Danh Mục Dự Báo' : 'Active Catalog'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight font-mono tabular-nums text-slate-900">
                  {scopedMetrics.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">Mặt Hàng (SKUs)</span>
              </div>
            </div>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Package className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kỳ D365: <strong>08/2026</strong></span>
            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
              28 ngày SX
            </span>
          </div>
        </div>

        {/* HUD Card 3: Critical Shortage Emergencies (High Urgency) */}
        <div
          onClick={() => setFilterSeverity('CRITICAL')}
          className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
            stats.criticalCount > 0
              ? 'bg-rose-50/80 border-rose-200 hover:border-rose-300 ring-2 ring-rose-500/10'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                {language === 'vi' ? 'Nguy Cơ Cạn Kho' : 'Stockout Risk'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight font-mono tabular-nums text-rose-600">
                  {stats.criticalCount < 10 ? `0${stats.criticalCount}` : stats.criticalCount}
                </span>
                <span className="text-xs font-semibold text-rose-600/80">Mã Khẩn Cấp</span>
              </div>
            </div>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">DOI &lt; 7.0 ngày</span>
            <span className="font-bold text-rose-600 hover:underline flex items-center gap-0.5">
              Xử lý gấp <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* HUD Card 4: Inter-Factory Transfer & Logistics Pulse */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                {language === 'vi' ? 'Điều Phối Vận Tải' : 'Fleet & Dispatch'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight font-mono tabular-nums text-slate-900">
                  {transferSuggestions.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">Tuyến Đề Xuất</span>
              </div>
            </div>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <ArrowLeftRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              Inbound: <strong>{stats.activeTrucksCount} chuyến xe</strong>
            </span>
            <button
              onClick={() => onNavigateTab('transfers')}
              className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Lộ trình <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ── 2. MAIN BATTLEGROUND: TACTICAL MATRIX + CRITICAL ALERTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Operational Stock & DOI Data Matrix */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Header Action Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Ma Trận Giám Sát Cung Ứng &amp; Tồn Kho Thực Tế</span>
                <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {filteredMetrics.length} / {scopedMetrics.length} SKUs
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ số DOI phản ánh chính xác số ngày sản xuất an toàn dựa trên tồn kho SOH và đơn hàng PO đang về.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã SKU, tên NL, nhà máy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Severity Filter Slicers */}
          <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Lọc Vị Thế:
            </span>

            {[
              { id: 'ALL', label: 'Tất Cả', count: scopedMetrics.length, cls: 'border-slate-200 text-slate-700 hover:bg-slate-100' },
              { id: 'CRITICAL', label: '⛔ Khẩn Cấp (< 7d)', count: stats.criticalCount, cls: 'border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100' },
              { id: 'WARNING', label: '⚠️ Cảnh Báo (7-14d)', count: stats.warningCount, cls: 'border-amber-200 text-amber-700 bg-amber-50/60 hover:bg-amber-100' },
              { id: 'OVERSTOCK', label: '📦 Tồn Dư (> 35d)', count: stats.overstockCount, cls: 'border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100' },
              { id: 'STOP_USAGE', label: '🚫 Stop Usage', count: stats.stopUsageCount, cls: 'border-purple-200 text-purple-700 bg-purple-50/60 hover:bg-purple-100' },
            ].map((pill) => {
              const isSelected = filterSeverity === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setFilterSeverity(pill.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : pill.cls
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-700 text-slate-200' : 'bg-white/80 text-slate-600 border border-slate-200'}`}>
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* High-density Data Table */}
          <div className="flex-1 overflow-x-auto max-h-[520px] divide-y divide-slate-100">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 backdrop-blur-xs text-slate-500 uppercase text-[10px] font-mono tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th onClick={() => handleSort('FACTORY')} className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors">
                    Nhà Máy {sortField === 'FACTORY' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('NAME')} className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors">
                    Mã &amp; Tên Nguyên Liệu {sortField === 'NAME' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('SOH')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    Tồn SOH (kg) {sortField === 'SOH' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-right">Đang Về (PO)</th>
                  <th className="px-4 py-3 text-right">Tiêu Hao/Ngày</th>
                  <th onClick={() => handleSort('DOI')} className="px-4 py-3 text-center cursor-pointer hover:text-slate-900 transition-colors">
                    DOI An Toàn {sortField === 'DOI' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-center">Dự Kiến Cạn</th>
                  <th className="px-4 py-3 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                {filteredMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      Không có nguyên liệu nào thỏa mãn tiêu chí tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredMetrics.map((item, idx) => {
                    const isCritical = item.Severity === 'CRITICAL';
                    const isWarning = item.Severity === 'WARNING';
                    const isOverstock = item.Severity === 'OVERSTOCK';

                    return (
                      <tr
                        key={`${item.FactoryID}-${item.MaterialID}-${idx}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCritical
                            ? 'bg-rose-50/30'
                            : isWarning
                            ? 'bg-amber-50/20'
                            : ''
                        }`}
                      >
                        {/* Factory Code */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200">
                            {item.FactoryCode}
                          </span>
                        </td>

                        {/* Material Info */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="font-bold text-slate-900 truncate" title={item.MaterialName_VN}>
                            {item.MaterialName_VN}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span>#{item.MaterialCode}</span>
                            {item.Status === 'Stop_Usage' && (
                              <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                STOP USAGE
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SOH (kg) */}
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                          {Number(item.SOHQty).toLocaleString()}
                        </td>

                        {/* Open PO */}
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {item.OpenPOQty > 0 ? (
                            <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              +{Number(item.OpenPOQty).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Daily Usage */}
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                          {Math.round(item.DailyUsage).toLocaleString()} <span className="text-[10px]">kg/d</span>
                        </td>

                        {/* DOI Badge with Health Bar */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : isOverstock
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {item.DOI_Total >= 999 ? '> 90 ngày' : `${item.DOI_Total.toFixed(1)} ngày`}
                            </span>
                          </div>
                        </td>

                        {/* Stockout Date */}
                        <td className="px-4 py-3 text-center whitespace-nowrap font-mono text-[11px]">
                          {isCritical ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                              {item.StockoutDate}
                            </span>
                          ) : (
                            <span className="text-slate-500">{item.CoverageTillDate}</span>
                          )}
                        </td>

                        {/* Quick Action */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isCritical ? (
                            <button
                              onClick={() => onNavigateTab('transfers')}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-xs transition-all cursor-pointer hover:shadow-sm"
                            >
                              Điều chuyển
                            </button>
                          ) : (
                            <button
                              onClick={() => onNavigateTab('matrix')}
                              className="text-blue-600 hover:text-blue-800 text-xs font-semibold hover:underline cursor-pointer"
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

          {/* Footer Bar */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Hiển thị <strong className="text-slate-800">{filteredMetrics.length}</strong> / {scopedMetrics.length} dòng
            </span>
            <button
              onClick={() => onNavigateTab('position-matrix')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Ma Trận Vị Thế Cung Ứng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Urgent Shortage Command Radar + AI S&OP Strategy */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Tactical Emergency Card: Shortage Radar */}
          <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                    Cảnh Báo Cạn Kho Thời Gian Thực
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {stats.criticalCount} Điểm Nóng
                </span>
              </div>

              <div className="space-y-3">
                {stats.criticalItems.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-6 text-center">
                    ✅ Toàn bộ nhà máy đang trong ngưỡng tồn kho an toàn.
                  </div>
                ) : (
                  stats.criticalItems.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/90 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-rose-400">
                          {item.FactoryCode} • DOI {item.DOI_Total.toFixed(1)}d
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Cạn: {item.StockoutDate}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        {item.MaterialName_VN}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
                        <span>Tồn: {Number(item.SOHQty).toLocaleString()} kg</span>
                        <span className="text-rose-300">Dùng: {Math.round(item.DailyUsage)} kg/d</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">D365 FO Live Sync</span>
              <button
                onClick={() => onNavigateTab('transfers')}
                className="text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem phương án cứu viện</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* S&OP Dispatch & Transfer Recommendation Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                    Đề Xuất Điều Phối Nội Bộ
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                  {transferSuggestions.length} Đề Xuất
                </span>
              </div>

              <div className="space-y-3 mt-3">
                {transferSuggestions.slice(0, 2).map((sug, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                        <span>{sug.SourceFactoryCode}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-blue-700">{sug.TargetFactoryCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                        {sug.MaterialName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Khối lượng: <strong className="text-slate-800">{Number(sug.RecommendedTransferKg).toLocaleString()} kg</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab('transfers')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      XỬ LÝ
                    </button>
                  </div>
                ))}

                {transferSuggestions.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Hiện chưa có đề xuất điều chuyển nào cần thực hiện.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('ai-advisor')}
              className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Phân Tích Với Trợ Lý Chuỗi Cung Ứng AI</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
