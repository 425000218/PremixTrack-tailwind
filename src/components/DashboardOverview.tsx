import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Truck,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  CalculatedMaterialMetric,
  Dim_Factory,
  Dim_Material,
  Fact_Inbound_Schedule,
  Language,
} from '../types';
import { DashboardFactorySlicer } from './DashboardFactorySlicer';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter metrics based on selected factory (already done by parent) and category
  const filteredMetrics = useMemo(() => {
    let list = metrics;
    if (selectedCategory !== 'ALL') {
      list = list.filter(m => m.Category === selectedCategory);
    }
    return list;
  }, [metrics, selectedCategory]);

  // Aggregate KPI Data
  const { totalSOH, totalPO, criticalCount, totalDailyUsage } = useMemo(() => {
    let soh = 0;
    let po = 0;
    let crit = 0;
    let daily = 0;
    filteredMetrics.forEach(m => {
      soh += m.SOHQty;
      po += m.OpenPOQty;
      daily += m.DailyUsage;
      if (m.DOI_Total < 7) {
        crit++;
      }
    });
    return {
      totalSOH: soh / 1000, // tons
      totalPO: po / 1000,   // tons
      criticalCount: crit,
      totalDailyUsage: daily / 1000
    };
  }, [filteredMetrics]);

  const avgDOI = totalDailyUsage > 0 ? (totalSOH + totalPO) / totalDailyUsage : 0;

  // Data for Supply-Demand Chart (Top 15 by SOH)
  const chartData = useMemo(() => {
    return filteredMetrics
      .map(m => ({
        name: m.MaterialCode,
        factory: m.FactoryCode,
        fullName: language === 'vi' ? m.MaterialName_VN : m.MaterialName_EN,
        soh: m.SOHQty / 1000,
        po: m.OpenPOQty / 1000,
        usage: m.DailyUsage / 1000 * 30, // monthly usage approx
        doi: m.DOI_Total
      }))
      .sort((a, b) => b.soh - a.soh)
      .slice(0, 15);
  }, [filteredMetrics, language]);

  // Data for DOI Extremes Ranking
  const doiData = useMemo(() => {
    return filteredMetrics
      .map(m => ({
        name: m.MaterialCode + ' (' + m.FactoryCode.replace('FAC-', '') + ')',
        fullName: language === 'vi' ? m.MaterialName_VN : m.MaterialName_EN,
        doi: m.DOI_Total > 100 ? 100 : m.DOI_Total // cap at 100 for visual
      }))
      .sort((a, b) => a.doi - b.doi)
      .slice(0, 10);
  }, [filteredMetrics, language]);

  const getDoiColor = (doi: number) => {
    if (doi < 7) return '#f43f5e';
    if (doi < 15) return '#f59e0b';
    if (doi <= 35) return '#10b981';
    return '#6366f1';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-xl shadow-xl text-white text-xs z-50">
          <p className="font-bold text-sm mb-1">{label}</p>
          <p className="text-slate-300 mb-2 truncate max-w-xs">{payload[0].payload.fullName}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 py-0.5">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}:
              </span>
              <span className="font-mono">
                {Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 1 })} Tấn
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HEADER & SLICER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'vi' ? 'Bảng Điều Khiển S&OP' : 'S&OP Dashboard'}
          </h1>
          <p className="text-sm text-slate-500">
            {language === 'vi' ? 'Tổng quan Vị thế cung ứng & Rủi ro vật tư' : 'Supply Position & Risk Overview'}
          </p>
        </div>
        <div className="shrink-0">
          <DashboardFactorySlicer
            factories={factories}
            selectedFactoryId={selectedFactoryId}
            selectedFactoryIds={selectedFactoryIds || [selectedFactoryId]}
            onChange={(ids) => {
              if (onSelectFactoryIds) onSelectFactoryIds(ids);
              if (onSelectFactory) onSelectFactory(ids.length === 1 ? ids[0] : (ids.includes('ALL') ? 'ALL' : ids[0]));
            }}
            language={language}
          />
        </div>
      </div>

      {/* KHỐI 1: 4 THẺ KPI CARD (Bento Grid 4 Cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SOH */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">Physical SOH</span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-500 text-xs font-semibold mb-1">Tổng tồn kho khả dụng</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{totalSOH.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span className="text-sm font-bold text-slate-500">Tấn</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{filteredMetrics.length} SKU đang quản lý</p>
          </div>
        </div>

        {/* Card 2: Critical Hotspots */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">DOI &lt; 7 ngày</span>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-rose-600 text-xs font-semibold mb-1">Điểm nóng Nguy cấp</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-700">{criticalCount}</span>
              <span className="text-sm font-bold text-rose-600">Điểm nóng</span>
            </div>
            <p className="text-[10px] text-rose-500 mt-2 font-medium">Cần điều chuyển hoặc mua gấp</p>
          </div>
        </div>

        {/* Card 3: Inbound PO */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">Inbound</span>
          </div>
          <div className="mt-4">
            <h3 className="text-emerald-700 text-xs font-semibold mb-1">Tổng Đơn hàng đang về</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{totalPO.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span className="text-sm font-bold text-slate-500">Tấn</span>
            </div>
            <p className="text-[10px] text-emerald-600 mt-2 font-medium">{inboundSchedules.length} Lô PO dự kiến</p>
          </div>
        </div>

        {/* Card 4: Inventory Valuation / Average DOI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">Avg DOI</span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-500 text-xs font-semibold mb-1">Sức khỏe Tồn kho</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{avgDOI.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              <span className="text-sm font-bold text-slate-500">Ngày</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Mức DOI trung bình toàn hệ thống</p>
          </div>
        </div>
      </div>

      {/* KHỐI 2 & 3: GRID 12 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KHỐI 2: KHỐI CHÍNH BÊN TRÁI (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cán cân Vị thế Cung - Cầu</h2>
              <p className="text-xs text-slate-500">Position Supply-Demand Balance (Top SKU)</p>
            </div>
            
            {/* Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                <option value="ALL">Tất cả nhóm nguyên liệu</option>
                {Object.keys(CATEGORY_NAMES).map(key => (
                  <option key={key} value={key}>{CATEGORY_NAMES[key][language]}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `${val}T`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px', fontWeight: 600 }} />
                
                <Bar dataKey="soh" name="Tồn kho khả dụng" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={32} />
                <Bar dataKey="po" name="PO Đang về" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  name="Nhu cầu (30 ngày)" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KHỐI 3: KHỐI PHỤ BÊN PHẢI (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Xếp hạng Điểm nóng Tồn kho</h2>
            <p className="text-xs text-slate-500">DOI Extremes Ranking</p>
          </div>

          <div className="flex-1 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doiData} layout="vertical" margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-2.5 rounded-lg shadow-xl text-white text-xs z-50">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-slate-300 mb-1">{data.fullName}</p>
                          <p className="font-mono text-[11px]">DOI: <span style={{ color: getDoiColor(data.doi) }} className="font-bold text-sm">{data.doi.toFixed(1)} ngày</span></p>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <ReferenceLine x={7} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '7d', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                <Bar dataKey="doi" radius={[0, 4, 4, 0]} barSize={16}>
                  {doiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDoiColor(entry.doi)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Action Pills */}
          <div className="mt-4 space-y-2">
            {doiData.slice(0, 2).map((item, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between ${item.doi < 7 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 overflow-hidden">
                  {item.doi < 7 ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" /> : <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />}
                  <span className="text-[11px] font-medium text-slate-700 truncate">
                    {item.name}: {item.doi < 7 ? 'Cạn hàng' : 'Cần xử lý'}
                  </span>
                </div>
                <button 
                  onClick={() => onNavigateTab(item.doi < 7 ? 'transfers' : 'matrix')}
                  className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${item.doi < 7 ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
                >
                  {item.doi < 7 ? 'Cứu Hàng' : 'Chi tiết'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
