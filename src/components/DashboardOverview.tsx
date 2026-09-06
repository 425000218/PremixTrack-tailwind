import React, { useState, useEffect, useMemo } from 'react';
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
  SlidersHorizontal,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CalculatedMaterialMetric,
  Dim_Factory,
  Dim_Material,
  Fact_Inbound_Schedule,
  Language,
} from '../types';
import { DashboardFactorySlicer } from './DashboardFactorySlicer';

const CATEGORY_NAMES: Record<string, { vi: string; en: string; color: string }> = {
  Carriers_Minerals: { vi: 'Chất Mang & Khoáng', en: 'Carriers & Minerals', color: '#3b82f6' },
  Amino_Acids: { vi: 'Axit Amin (Amino)', en: 'Amino Acids', color: '#10b981' },
  Vitamins: { vi: 'Vitamin & Vi Lượng', en: 'Vitamins & Micro', color: '#f59e0b' },
  Enzymes: { vi: 'Enzyme & Men Vi Sinh', en: 'Enzymes & Probiotics', color: '#8b5cf6' },
  Trace_Minerals: { vi: 'Khoáng Vi Lượng', en: 'Trace Minerals', color: '#ec4899' },
  Toxin_Binders: { vi: 'Hút Độc Tố', en: 'Toxin Binders', color: '#06b6d4' },
  Acidifiers: { vi: 'Axit Hóa', en: 'Acidifiers', color: '#14b8a6' },
  Medicinals: { vi: 'Dược Liệu & Bổ Trợ', en: 'Medicinals', color: '#f97316' },
  Grain: { vi: 'Ngũ Cốc', en: 'Grains', color: '#eab308' },
  Protein: { vi: 'Đạm & Bột Thịt', en: 'Proteins', color: '#6366f1' },
  Other: { vi: 'Khác', en: 'Other', color: '#64748b' }
};

interface DashboardOverviewProps {
  metrics: CalculatedMaterialMetric[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  inboundSchedules: Fact_Inbound_Schedule[];
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

  // Toggle Visual Analytics Charts Section & Active tab
  const [showVisualCharts, setShowVisualCharts] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'OVERVIEW' | 'CATEGORY' | 'FACTORY_RISK' | 'CRITICAL_SKUS'>('OVERVIEW');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Floating Bubbles State: 'NONE' | 'TRANSFERS' | 'AI'
  const [activeBubble, setActiveBubble] = useState<'NONE' | 'TRANSFERS' | 'AI'>('NONE');
  
  // Track if any modal/drawer popup is open to auto-hide floating bubbles
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkModalState = () => {
      const isAnyOpen =
        document.body.classList.contains('modal-open') ||
        document.body.style.overflow === 'hidden';
      setIsModalOpen(isAnyOpen);
    };

    checkModalState();
    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

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

  // Visual Chart 1: SOH Category Breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<string, { totalSOH: number; count: number; criticalCount: number }>();
    let totalAllSOH = 0;

    scopedMetrics.forEach((m) => {
      const cat = m.Category || 'Other';
      const current = map.get(cat) || { totalSOH: 0, count: 0, criticalCount: 0 };
      const sohKg = m.SOHQty || 0;
      current.totalSOH += sohKg;
      current.count += 1;
      if (m.Severity === 'CRITICAL') {
        current.criticalCount += 1;
      }
      totalAllSOH += sohKg;
      map.set(cat, current);
    });

    const items = Array.from(map.entries()).map(([catKey, data]) => {
      const meta = CATEGORY_NAMES[catKey] || CATEGORY_NAMES.Other;
      const tons = Math.round(data.totalSOH / 1000);
      const percentage = totalAllSOH > 0 ? (data.totalSOH / totalAllSOH) * 100 : 0;
      return {
        key: catKey,
        label: language === 'vi' ? meta.vi : meta.en,
        tons,
        count: data.count,
        criticalCount: data.criticalCount,
        percentage,
        color: meta.color,
      };
    });

    items.sort((a, b) => b.tons - a.tons);
    return { items, totalAllTons: Math.round(totalAllSOH / 1000) };
  }, [scopedMetrics, language]);

  // Visual Chart 2: Factory Health & Risk Breakdown
  const factoryRiskStats = useMemo(() => {
    const map = new Map<string, {
      factoryId: string;
      factoryCode: string;
      factoryName: string;
      critical: number;
      warning: number;
      balanced: number;
      overstock: number;
      totalSKUs: number;
      totalSOHKg: number;
    }>();

    scopedMetrics.forEach((m) => {
      const fId = m.FactoryID || m.FactoryCode || 'UNKNOWN';
      const cur = map.get(fId) || {
        factoryId: fId,
        factoryCode: m.FactoryCode || fId,
        factoryName: m.FactoryName || fId,
        critical: 0,
        warning: 0,
        balanced: 0,
        overstock: 0,
        totalSKUs: 0,
        totalSOHKg: 0,
      };

      cur.totalSKUs += 1;
      cur.totalSOHKg += (m.SOHQty || 0);

      if (m.Severity === 'CRITICAL') cur.critical += 1;
      else if (m.Severity === 'WARNING') cur.warning += 1;
      else if (m.Severity === 'BALANCED') cur.balanced += 1;
      else cur.overstock += 1;

      map.set(fId, cur);
    });

    return Array.from(map.values())
      .sort((a, b) => {
        if (b.critical !== a.critical) return b.critical - a.critical;
        if (b.warning !== a.warning) return b.warning - a.warning;
        return b.totalSOHKg - a.totalSOHKg;
      })
      .slice(0, 12);
  }, [scopedMetrics]);

  // Visual Chart 3: Earliest Stockout SKUs
  const criticalSKUs = useMemo(() => {
    return [...scopedMetrics]
      .filter((m) => m.DailyUsage > 0)
      .sort((a, b) => (a.DOI_Total || 0) - (b.DOI_Total || 0))
      .slice(0, 8);
  }, [scopedMetrics]);

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

        {/* HUD Card 4: S&OP Position & Safety Coverage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {language === 'vi' ? 'Vị Thế Cung Ứng' : 'S&OP Coverage'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight font-mono tabular-nums text-slate-900">
                  {stats.balancedCount}
                </span>
                <span className="text-xs font-semibold text-slate-500">Mã Đạt Chuẩn</span>
              </div>
            </div>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Activity className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              An toàn: <strong className="text-emerald-700 font-bold">{scopedMetrics.length > 0 ? Math.round((stats.balancedCount / scopedMetrics.length) * 100) : 100}%</strong>
            </span>
            <button
              onClick={() => onNavigateTab('position-matrix')}
              className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Ma trận vị thế <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ── 2. VISUAL ANALYTICS & CHARTS SECTION (COLLAPSIBLE / ẨN HIỆN LINH HOẠT) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowVisualCharts((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer group"
          >
            <BarChart3 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>
              {language === 'vi' 
                ? (showVisualCharts ? 'Thu Gọn Biểu Đồ Trực Quan' : 'Mở Rộng Biểu Đồ Trực Quan (Analytics)')
                : (showVisualCharts ? 'Collapse Visual Charts' : 'Expand Visual Charts (Analytics)')
              }
            </span>
            {showVisualCharts ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            )}
          </button>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
            {showVisualCharts 
              ? (language === 'vi' ? 'Hiển thị phân bổ SOH, Sức khỏe Nhà máy & SKUs rủi ro' : 'Showing SOH distribution, Factory health & Risk SKUs')
              : (language === 'vi' ? 'Đã ẩn để tối ưu không gian bảng số liệu' : 'Hidden to maximize table workspace')
            }
          </span>
        </div>

        {showVisualCharts && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300">
            {/* Header Bar */}
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>{language === 'vi' ? 'Biểu Đồ Trực Quan & Phân Tích Chuỗi Cung Ứng' : 'Visual Analytics & Supply Chain Insights'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Interactive
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'vi' ? 'Tổng hợp phân bổ danh mục, mức độ an toàn theo nhà máy và thời gian cạn kho' : 'Aggregated category distribution, factory safety health, and stockout timeline'}
                  </p>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setActiveChartTab('OVERVIEW')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeChartTab === 'OVERVIEW'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {language === 'vi' ? 'Tổng Hợp' : 'All Insights'}
                </button>
                <button
                  onClick={() => setActiveChartTab('CATEGORY')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeChartTab === 'CATEGORY'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {language === 'vi' ? 'Phân Bổ Nhóm NL' : 'Categories'}
                </button>
                <button
                  onClick={() => setActiveChartTab('FACTORY_RISK')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeChartTab === 'FACTORY_RISK'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {language === 'vi' ? 'Sức Khỏe Nhà Máy' : 'Factory Health'}
                </button>
                <button
                  onClick={() => setActiveChartTab('CRITICAL_SKUS')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeChartTab === 'CRITICAL_SKUS'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {language === 'vi' ? 'SKUs Cận Ngưỡng' : 'Worst Off-DOI'}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5">
              {/* VIEW 1: CATEGORY & CRITICAL SKUS */}
              {(activeChartTab === 'OVERVIEW' || activeChartTab === 'CATEGORY') && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
                  
                  {/* Left Box: SOH Category Volume Breakdown */}
                  <div className="lg:col-span-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          {language === 'vi' ? 'Tỷ Trọng Tồn Kho SOH Theo Nhóm' : 'SOH Share by Category'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {categoryStats.totalAllTons.toLocaleString()} Tấn (100%)
                      </span>
                    </div>

                    {/* Visual Multi-Segment Bar */}
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex gap-0.5 p-0.5 shadow-inner">
                      {categoryStats.items.map((cat) => (
                        <div
                          key={cat.key}
                          style={{
                            width: `${Math.max(cat.percentage, 1)}%`,
                            backgroundColor: cat.color,
                          }}
                          onMouseEnter={() => setHoveredCategory(cat.key)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          title={`${cat.label}: ${cat.tons.toLocaleString()} Tấn (${cat.percentage.toFixed(1)}%)`}
                          className="h-full rounded-xs transition-transform hover:scale-y-125 cursor-pointer first:rounded-l-full last:rounded-r-full"
                        />
                      ))}
                    </div>

                    {/* Category Detail List */}
                    <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {categoryStats.items.map((cat) => (
                        <div
                          key={cat.key}
                          onMouseEnter={() => setHoveredCategory(cat.key)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-default ${
                            hoveredCategory === cat.key ? 'bg-blue-50/80 border border-blue-200/60' : 'hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-semibold text-slate-800 truncate">{cat.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({cat.count} SKUs)</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {cat.criticalCount > 0 && (
                              <span
                                onClick={() => setFilterSeverity('CRITICAL')}
                                className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer hover:bg-rose-200 transition-colors"
                                title="Lọc SKUs thiếu hụt khẩn cấp trong bảng"
                              >
                                {cat.criticalCount} Thiếu
                              </span>
                            )}
                            <div className="text-right">
                              <span className="font-bold text-slate-900 font-mono">{cat.tons.toLocaleString()} Tấn</span>
                              <span className="text-[10px] text-slate-500 font-mono ml-1.5">({cat.percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Box: Top Critical Stockout Horizon */}
                  <div className="lg:col-span-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          {language === 'vi' ? 'Top Nguyên Liệu Nguy Cơ Cạn Kho Sớm Nhất' : 'Earliest Stockout Timeline (Lowest DOI)'}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {criticalSKUs.length} Cần Cung Ứng
                      </span>
                    </div>

                    {/* Progress bars for worst DOI */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {criticalSKUs.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          {language === 'vi' ? 'Tất cả nguyên liệu đều nằm trong ngưỡng an toàn cao.' : 'All materials are within safe operational limits.'}
                        </div>
                      ) : (
                        criticalSKUs.map((m) => {
                          const doi = m.DOI_Total || 0;
                          const isSuperCritical = doi < 7;
                          const barWidth = Math.min(100, Math.max(5, (doi / 28) * 100));

                          return (
                            <div key={`${m.FactoryID}-${m.MaterialID}`} className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-bold text-slate-800 text-[11px]">{m.MaterialCode}</span>
                                  <span className="font-medium text-slate-700 truncate max-w-[180px]" title={m.MaterialName_VN}>
                                    {m.MaterialName_VN}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {m.FactoryCode}
                                  </span>
                                  <span className={`font-mono font-bold text-xs ${isSuperCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                                    {doi.toFixed(1)} ngày
                                  </span>
                                </div>
                              </div>

                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex items-center">
                                <div
                                  style={{ width: `${barWidth}%` }}
                                  className={`h-full rounded-full transition-all ${
                                    isSuperCritical ? 'bg-rose-500' : 'bg-amber-500'
                                  }`}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                                <span>SOH: {Math.round(m.SOHQty / 1000)}T + PO: {Math.round(m.OpenPOQty / 1000)}T</span>
                                <span className="text-slate-400">Dự kiến cạn: <strong className="text-slate-700">{m.StockoutDate || 'N/A'}</strong></span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* VIEW 2: FACTORY RISK MATRIX */}
              {(activeChartTab === 'OVERVIEW' || activeChartTab === 'FACTORY_RISK') && (
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        {language === 'vi' ? 'Bản Đồ An Toàn Tồn Kho Theo Từng Nhà Máy (Factory DOI Health)' : 'Factory Safety Health Status'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> &lt; 7 ngày (Khẩn cấp)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 7-14 ngày (Cảnh báo)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> &gt; 14 ngày (An toàn)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {factoryRiskStats.map((f) => {
                      const total = f.totalSKUs || 1;
                      const criticalPct = (f.critical / total) * 100;
                      const warningPct = (f.warning / total) * 100;
                      const balancedPct = (f.balanced / total) * 100;
                      const overstockPct = (f.overstock / total) * 100;

                      return (
                        <div
                          key={f.factoryId}
                          onClick={() => {
                            if (onSelectFactory) onSelectFactory(f.factoryId);
                          }}
                          className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {f.factoryCode}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate max-w-[110px]" title={f.factoryName}>
                                {f.factoryName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {Math.round(f.totalSOHKg / 1000)} Tấn
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                            {f.critical > 0 && (
                              <div style={{ width: `${criticalPct}%` }} className="bg-rose-500 h-full" title={`Khẩn cấp: ${f.critical} SKUs`} />
                            )}
                            {f.warning > 0 && (
                              <div style={{ width: `${warningPct}%` }} className="bg-amber-400 h-full" title={`Cảnh báo: ${f.warning} SKUs`} />
                            )}
                            {f.balanced > 0 && (
                              <div style={{ width: `${balancedPct}%` }} className="bg-emerald-500 h-full" title={`An toàn: ${f.balanced} SKUs`} />
                            )}
                            {f.overstock > 0 && (
                              <div style={{ width: `${overstockPct}%` }} className="bg-blue-400 h-full" title={`Dư thừa: ${f.overstock} SKUs`} />
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
                            <span className={f.critical > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                              {f.critical > 0 ? `${f.critical} thiếu hụt` : '0 nguy cơ'}
                            </span>
                            <span className="text-slate-500 font-medium">
                              {f.totalSKUs} SKUs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ── 3. FULL-WIDTH OPERATIONAL DATA MATRIX (100% WIDTH) ── */}
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

      {/* ── 3. FLOATING AI BUBBLE (BÊN PHẢI MÀN HÌNH - TỰ ĐỘNG ẨN KHI CÓ MODAL/POPUP/DRAWER) ── */}
      {!isModalOpen && (
        <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end gap-2.5 pointer-events-none transition-all duration-200">
          
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
                Trợ lý AI sẵn sàng phân tích nhanh các điểm nghẽn chuỗi cung ứng, dự báo nhu cầu nguyên liệu và đề xuất phương án điều phối tối ưu chi phí.
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

          {/* Ultra-Compact Floating Action Bubble (Bottom Right) */}
          <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-xl p-1 rounded-full border border-slate-800 shadow-xl">
            {/* Mini Bubble: Trợ Lý AI */}
            <button
              onClick={() => setActiveBubble(prev => prev === 'AI' ? 'NONE' : 'AI')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeBubble === 'AI'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-400 hover:bg-slate-800'
              }`}
              title="Mở Trợ lý AI Advisor"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">Trợ Lý AI</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
