import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Truck,
  ArrowLeftRight,
  Package,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  Boxes,
  Flame,
  ArrowUpRight,
  ArrowRight,
  Layers,
  Activity,
  Zap,
  X,
  Bot,
  MessageSquareText,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CalculatedMaterialMetric,
  Dim_Factory,
  Dim_Material,
  Fact_Inbound_Schedule,
  InterFactoryTransferSuggestion,
  Language,
} from '../types';
import { DashboardFactorySlicer } from './DashboardFactorySlicer';

interface DashboardOverviewProps {
  metrics: CalculatedMaterialMetric[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  inboundSchedules: Fact_Inbound_Schedule[];
  transferSuggestions: InterFactoryTransferSuggestion[];
  selectedFactoryId?: string;
  selectedFactoryIds?: string[];
  onSelectFactory?: (id: string) => void;
  onSelectFactoryIds?: (ids: string[]) => void;
  onNavigateTab: (tab: string) => void;
  language: Language;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  factories,
  materials,
  inboundSchedules,
  transferSuggestions,
  selectedFactoryId = 'ALL',
  selectedFactoryIds,
  onSelectFactory,
  onSelectFactoryIds,
  onNavigateTab,
  language,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<'DOI' | 'SOH' | 'NAME' | 'FACTORY'>('DOI');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Floating Bubbles State: 'NONE' | 'TRANSFERS' | 'AI'
  const [activeBubble, setActiveBubble] = useState<'NONE' | 'TRANSFERS' | 'AI'>('NONE');

  // Filter metrics according to global multi-factory selection
  const scopedMetrics = useMemo(() => {
    if (selectedFactoryIds !== undefined) {
      if (selectedFactoryIds.includes('ALL')) return metrics;
      if (selectedFactoryIds.length === 0) return [];
      return metrics.filter(
        (m) =>
          selectedFactoryIds.includes(m.FactoryID) ||
          selectedFactoryIds.includes(m.FactoryCode)
      );
    }
    return metrics.filter(
      (m) => selectedFactoryId === 'ALL' || m.FactoryID === selectedFactoryId
    );
  }, [metrics, selectedFactoryId, selectedFactoryIds]);

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
      activeTrucksCount: activeInboundTrucks.length,
      criticalItems: critical,
    };
  }, [scopedMetrics, inboundSchedules]);

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
    <div className="space-y-6 relative pb-12">
      {/* ── 0. DASHBOARD-LEVEL INLINE FACTORY SLICER (SOLUTION 2) ── */}
      <DashboardFactorySlicer
        factories={factories}
        selectedFactoryIds={selectedFactoryIds || (selectedFactoryId ? [selectedFactoryId] : ['ALL'])}
        onChange={(ids) => {
          if (onSelectFactoryIds) {
            onSelectFactoryIds(ids);
          } else if (onSelectFactory) {
            onSelectFactory(ids.length === 1 ? ids[0] : (ids.includes('ALL') ? 'ALL' : ids[0]));
          }
        }}
        language={language}
      />
      
      {/* ── 1. EXECUTIVE MISSION HUD (4 CARDS HARMONIOUS & SUBTLE TINT ON SOH) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* HUD Card 1: Total SOH Volume (Soft Subtle Tint: Không quá trắng, không tối) */}
        <div className="bg-slate-100/70 border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between group hover:border-slate-300 hover:bg-slate-100 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-700" />
                {language === 'vi' ? 'Tổng Tồn Kho SOH' : 'Total Inventory SOH'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight font-mono tabular-nums text-slate-900">
                  {stats.totalSOHTons.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">Tấn (MT)</span>
              </div>
            </div>
            <span className="p-2 rounded-xl bg-white text-blue-700 border border-slate-200 shadow-2xs">
              <Activity className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-mono">
              DOI TB: <strong className="text-blue-800 font-bold">{stats.avgDOI.toFixed(1)} ngày</strong>
            </span>
            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +4.2% tuần này
            </span>
          </div>
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
            <span>Kỳ D365: <strong className="text-slate-800">08/2026</strong></span>
            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
              28 ngày SX
            </span>
          </div>
        </div>

        {/* HUD Card 3: Critical Shortage Emergencies */}
        <div
          onClick={() => setFilterSeverity('CRITICAL')}
          className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
            stats.criticalCount > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300 shadow-xs'
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
            <span className="text-rose-700 font-medium font-mono">DOI &lt; 7.0 ngày</span>
            <span className="font-bold text-rose-600 hover:underline flex items-center gap-0.5">
              Xử lý gấp <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* HUD Card 4: Inter-Factory Transfer & Fleet */}
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
              Inbound: <strong className="text-slate-800">{stats.activeTrucksCount} xe tải</strong>
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

      {/* ── 2. FULL-WIDTH OPERATIONAL DATA MATRIX (100% WIDTH) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden w-full">
        
        {/* Header Action Bar with Clean Title Alignment */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Ma Trận Tồn Kho &amp; Cảnh Báo Thiếu Hụt D365</span>
              </h3>
              <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full shrink-0">
                {filteredMetrics.length} / {scopedMetrics.length} SKUs
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tính toán thời gian cạn kho (Stockout Date) và số ngày che phủ (DOI = [SOH + PO] / Tiêu_Hao_Ngày).
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80 shrink-0">
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

        {/* High-density Data Table (Spacious Full Width) */}
        <div className="flex-1 overflow-x-auto max-h-[560px] divide-y divide-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono tracking-wider sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th onClick={() => handleSort('FACTORY')} className="px-5 py-3.5 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap">
                  Nhà Máy {sortField === 'FACTORY' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('NAME')} className="px-5 py-3.5 cursor-pointer hover:text-slate-900 transition-colors min-w-[240px]">
                  Mã &amp; Tên Nguyên Liệu {sortField === 'NAME' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('SOH')} className="px-5 py-3.5 text-right cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap">
                  Tồn SOH (kg) {sortField === 'SOH' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Đang Về (PO)</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Tiêu Hao/Ngày</th>
                <th onClick={() => handleSort('DOI')} className="px-5 py-3.5 text-center cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap">
                  DOI An Toàn {sortField === 'DOI' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Dự Kiến Cạn Kho</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 italic">
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
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                          {item.FactoryCode}
                        </span>
                      </td>

                      {/* Material Info */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.MaterialName_VN}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>Mã: #{item.MaterialCode}</span>
                          {item.Status === 'Stop_Usage' && (
                            <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                              STOP USAGE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SOH (kg) */}
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-sm tabular-nums text-slate-900 whitespace-nowrap">
                        {Number(item.SOHQty).toLocaleString()}
                      </td>

                      {/* Open PO */}
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                        {item.OpenPOQty > 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{Number(item.OpenPOQty).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Daily Usage */}
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {Math.round(item.DailyUsage).toLocaleString()} <span className="text-[10px]">kg/d</span>
                      </td>

                      {/* DOI Badge */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tabular-nums inline-block ${
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
                      </td>

                      {/* Stockout Date */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap font-mono text-xs">
                        {isCritical ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                            {item.StockoutDate}
                          </span>
                        ) : (
                          <span className="text-slate-500">{item.CoverageTillDate}</span>
                        )}
                      </td>

                      {/* Quick Action */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {isCritical ? (
                          <button
                            onClick={() => onNavigateTab('transfers')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all cursor-pointer hover:shadow-sm"
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
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-800">{filteredMetrics.length}</strong> / {scopedMetrics.length} mã nguyên liệu
          </span>
          <button
            onClick={() => onNavigateTab('position-matrix')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Mở Ma Trận Vị Thế Cung Ứng</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3. FLOATING BUBBLES DOCK (BÊN PHẢI MÀN HÌNH) ── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Floating Bubble Popover: ĐỀ XUẤT ĐIỀU PHỐI */}
        {activeBubble === 'TRANSFERS' && (
          <div className="pointer-events-auto w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl p-5 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Đề Xuất Điều Phối Nội Bộ
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {transferSuggestions.length} Tuyến Đề Xuất
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveBubble('NONE')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
              {transferSuggestions.slice(0, 5).map((sug, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{sug.SourceFactoryCode}</span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{sug.TargetFactoryCode}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-semibold truncate mt-1">
                      {sug.MaterialName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Khối lượng: <strong className="text-slate-800">{Number(sug.RecommendedTransferKg).toLocaleString()} kg</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveBubble('NONE');
                      onNavigateTab('transfers');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    XỬ LÝ
                  </button>
                </div>
              ))}

              {transferSuggestions.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Hiện chưa có đề xuất điều chuyển nào cần xử lý.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">Tự động cân bằng tồn kho</span>
              <button
                onClick={() => {
                  setActiveBubble('NONE');
                  onNavigateTab('transfers');
                }}
                className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
              >
                <span>Mở Toàn Bộ Tuyến</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Bubble Popover: TRỢ LÝ AI CHUỖI CUNG ỨNG */}
        {activeBubble === 'AI' && (
          <div className="pointer-events-auto w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl p-5 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Trợ Lý AI Chuỗi Cung Ứng
                  </h4>
                  <span className="text-[10px] text-blue-600 font-semibold font-mono">
                    PremixTrack S&amp;OP Engine
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveBubble('NONE')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Trợ lý AI sẵn sàng phân tích nhanh các điểm nghẽn chuỗi cung ứng, dự báo nhu cầu nguyên liệu và đề xuất phương án điều chuyển tối ưu chi phí.
            </p>

            <button
              onClick={() => {
                setActiveBubble('NONE');
                onNavigateTab('ai-advisor');
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Bắt Đầu Phân Tích Với AI</span>
            </button>
          </div>
        )}

        {/* Ultra-Compact Floating Action Bubbles (Bottom Right) */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl p-1 rounded-full border border-slate-800 shadow-xl">
          
          {/* Mini Bubble 1: Đề Xuất Điều Phối */}
          <button
            onClick={() => setActiveBubble(prev => prev === 'TRANSFERS' ? 'NONE' : 'TRANSFERS')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeBubble === 'TRANSFERS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
            title={`Xem ${transferSuggestions.length} đề xuất điều chuyển`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="text-[11px] font-mono">{transferSuggestions.length}</span>
          </button>

          <div className="w-px h-3.5 bg-slate-700/80" />

          {/* Mini Bubble 2: Trợ Lý AI */}
          <button
            onClick={() => setActiveBubble(prev => prev === 'AI' ? 'NONE' : 'AI')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeBubble === 'AI'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-blue-400 hover:bg-slate-800'
            }`}
            title="Mở Trợ lý AI Advisor"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px]">AI</span>
          </button>

        </div>

      </div>

    </div>
  );
};
