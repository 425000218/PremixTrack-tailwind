import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Filter,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  Calendar,
  Layers,
  TrendingDown,
  Truck,
  Sparkles,
  ArrowRightLeft,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  Clock,
  Building2,
  Box
} from 'lucide-react';
import { Fact_Position_Snapshot, PositionHeaderMode, Language } from '../types';
import { mockPositionSnapshots } from '../data/mockData';

interface PositionMatrixViewProps {
  language?: Language;
  onNavigateTab?: (tab: string) => void;
}

export const PositionMatrixView: React.FC<PositionMatrixViewProps> = ({
  language = 'vi',
  onNavigateTab,
}) => {
  const [positions, setPositions] = useState<Fact_Position_Snapshot[]>(mockPositionSnapshots);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Header Mode State (Enterprise vs D365 Legacy)
  const [headerMode, setHeaderMode] = useState<PositionHeaderMode>('Enterprise');

  // Filters State
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [divisionFilter, setDivisionFilter] = useState<string>('ALL');
  const [factoryFilter, setFactoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Calculation Parameter Settings
  const [snapshotDate, setSnapshotDate] = useState<string>('2026-08-25');
  const [cutoffWorkingDays, setCutoffWorkingDays] = useState<number>(22);
  const [standardMonthDays, setStandardMonthDays] = useState<number>(28);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Selected Item for Detail Modal
  const [selectedItem, setSelectedItem] = useState<Fact_Position_Snapshot | null>(null);

  // Fetch Position Matrix from API
  const fetchPositionData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        snapshotDate,
        region: regionFilter,
        division: divisionFilter,
      });
      const res = await fetch(`/api/position/matrix?${queryParams.toString()}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setPositions(result.data);
        setSummary(result.summary);
      } else {
        // Fallback to local mock data
        setPositions(mockPositionSnapshots);
      }
    } catch (err) {
      console.warn('Cannot fetch from /api/position/matrix, using fallback data:', err);
      setPositions(mockPositionSnapshots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositionData();
  }, [snapshotDate, regionFilter, divisionFilter]);

  // Trigger Stored Procedure Recalculation
  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/position/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotDate,
          cutoffWorkingDays,
          standardMonthDays
        })
      });
      const result = await res.json();
      if (result.success) {
        await fetchPositionData();
        setIsSettingsOpen(false);
      }
    } catch (err) {
      console.error('Error recalculating position:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return positions.filter((row) => {
      if (factoryFilter !== 'ALL' && row.FactoryCode !== factoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSku = row.MaterialCode.toLowerCase().includes(q);
        const matchName = row.MaterialName.toLowerCase().includes(q);
        const matchPic = row.PIC.toLowerCase().includes(q);
        const matchFac = row.FactoryCode.toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchPic && !matchFac) return false;
      }
      return true;
    });
  }, [positions, factoryFilter, searchQuery]);

  // Unique Factories for Filter
  const availableFactories = useMemo(() => {
    const list = Array.from(new Set(positions.map((p) => p.FactoryCode)));
    return list.sort();
  }, [positions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = [
      'Region', 'RM Group', 'Division', 'Factory', 'Item Number', 'Product Name', 'PIC',
      'SOH (kg)', 'MTD Prev (kg)', 'MTD Curr (kg)', 'Monthly Forecast (kg)', '% Used',
      'Usage/Day (kg)', 'DOI Standard (Days)', 'DOI MTD (Days)', 'Stockout Date',
      'Arrange More (kg)', 'DOI After Buffer (Days)', 'PO Pending (kg)',
      'Total Pipeline DOI (Days)', 'Max Protected Date'
    ];
    const rows = filteredRows.map((r) => [
      r.Region, r.RMGroup, r.Division, r.FactoryCode, r.MaterialCode, `"${r.MaterialName}"`, r.PIC,
      r.SOHQtyKg, r.MTD_Production_PrevMonth_Kg, r.MTD_Production_CurrMonth_Kg, r.MonthlyUsageForecastKg,
      (r.PctUsedUsage * 100).toFixed(2) + '%', r.DailyStandardUsageKg, r.DOI_Standard_Days,
      r.DOI_Actual_MTD_Days, r.StockoutDateSOH ? r.StockoutDateSOH.split('T')[0] : '',
      r.EmergencyBufferQtyKg, r.DOI_AfterBuffer_Days, r.PO_PendingInboundKg,
      r.TotalPipeline_DOI_Days, r.MaxProtectedDate ? r.MaxProtectedDate.split('T')[0] : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Position_Matrix_Report_${snapshotDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isEnterprise = headerMode === 'Enterprise';

  return (
    <div className="space-y-6">
      {/* Header Title & Mode Toggle Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-100">
                Ma Trận Vị Thế Cung Ứng (Supply Chain Position Matrix)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                D365 FO Live
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Phân tích độ che phủ tồn kho, tốc độ tiêu thụ, ngày cạn hàng & thuật toán tự động đề xuất bù đắp (Arrange More) cho 2 miền Nam - Bắc.
            </p>
          </div>

          {/* Header Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Header Mode Toggle Button */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setHeaderMode('Enterprise')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isEnterprise
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Tiêu Chuẩn Doanh Nghiệp
              </button>
              <button
                type="button"
                onClick={() => setHeaderMode('Legacy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  !isEnterprise
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Nguyên Bản D365 Legacy
              </button>
            </div>

            {/* Recalculate Parameter Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Tùy chỉnh Ngày Mốc & Số ngày làm việc"
            >
              <Sliders className="w-4 h-4 text-blue-400" />
              Tham Số Mốc
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards (Summary of Entire Network) */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isEnterprise ? 'Tổng Tồn SOH' : 'Total SOH'}</span>
              <Box className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-slate-100">
              {summary.TotalSOHQtyKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Mốc Cut-off: {snapshotDate}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isEnterprise ? 'Tiêu Hao / Ngày' : 'Usage / Day'}</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-slate-100">
              {summary.TotalDailyStandardUsageKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">kg/d</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-1">
              Tiến độ: {(summary.OverallPctUsedUsage * 100).toFixed(1)}% tháng
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isEnterprise ? 'Ngày Tồn SOH' : 'Covered Day Usage'}</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-cyan-400">
              {summary.OverallDOIStandardDays} <span className="text-xs font-normal text-slate-300">ngày</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Hết hàng: {summary.OverallCoverageTill1}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isEnterprise ? 'Lượng Cần Bù (Buffer)' : 'Arrange More'}</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-400">
              {summary.TotalEmergencyBufferKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Sau bù: +{summary.OverallDOIAfterBufferDays} ngày
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isEnterprise ? 'Đơn Mua Đang Về' : 'PO PENDING'}</span>
              <Truck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400">
              {summary.TotalPOPendingKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              D365 FO Inbound Pipeline
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 bg-gradient-to-br from-slate-900 to-purple-950/30 border-purple-900/30">
            <div className="flex items-center justify-between text-purple-300 text-xs mb-1">
              <span>{isEnterprise ? 'Bảo Vệ Toàn Diện' : 'Max Coverage'}</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-purple-300">
              {summary.OverallTotalPipelineDOIDays} <span className="text-xs font-normal text-slate-300">ngày</span>
            </div>
            <div className="text-[11px] text-purple-400 mt-1 font-semibold">
              An toàn đến: {summary.OverallMaxProtectedDate}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Region Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Vùng:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Toàn Quốc (South & North)</option>
              <option value="SOUTH">Miền Nam (SOUTH)</option>
              <option value="NORTH">Miền Bắc (NORTH)</option>
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Ngành:</span>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả ngành</option>
              <option value="Livestock">Gia súc (Livestock)</option>
              <option value="AQUA">Thủy sản (AQUA)</option>
            </select>
          </div>

          {/* Factory Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Nhà máy:</span>
            <select
              value={factoryFilter}
              onChange={(e) => setFactoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả nhà máy</option>
              {availableFactories.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Box & Refresh */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã SKU, Tên, PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchPositionData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Position Matrix Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[700px]">
          <table className="w-full text-left text-xs border-collapse">
            {/* Header Columns */}
            <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 sticky top-0 z-20">
              <tr>
                <th className="py-3 px-3 min-w-[70px]">{isEnterprise ? 'Khu Vực' : 'REGION'}</th>
                <th className="py-3 px-3 min-w-[70px]">{isEnterprise ? 'Nhóm NL' : 'RM Group'}</th>
                <th className="py-3 px-3 min-w-[80px]">{isEnterprise ? 'Ngành' : 'Division'}</th>
                <th className="py-3 px-3 min-w-[70px]">{isEnterprise ? 'Nhà Máy' : 'FACTORY'}</th>
                <th className="py-3 px-3 min-w-[80px]">{isEnterprise ? 'Mã SKU' : 'Item number'}</th>
                <th className="py-3 px-3 min-w-[200px]">{isEnterprise ? 'Tên Nguyên Liệu' : 'Product name'}</th>
                <th className="py-3 px-3 min-w-[70px]">{isEnterprise ? 'Phụ Trách' : 'PIC'}</th>
                <th className="py-3 px-3 min-w-[100px] text-right">{isEnterprise ? 'Tồn Kho SOH (kg)' : 'SOH'}</th>
                <th className="py-3 px-3 min-w-[100px] text-right">{isEnterprise ? 'Lũy Kế T7 (kg)' : 'MTD July(26)'}</th>
                <th className="py-3 px-3 min-w-[100px] text-right">{isEnterprise ? 'Lũy Kế T8 (kg)' : 'MTD Aug(26)'}</th>
                <th className="py-3 px-3 min-w-[110px] text-right">{isEnterprise ? 'Kế Hoạch Tháng' : 'Usage/month'}</th>
                <th className="py-3 px-3 min-w-[90px] text-right">{isEnterprise ? '% Tiến Độ Dùng' : '% Used Usage'}</th>
                <th className="py-3 px-3 min-w-[100px] text-right">{isEnterprise ? 'Định Mức / Ngày' : 'Usage/Day'}</th>
                <th className="py-3 px-3 min-w-[100px] text-center">{isEnterprise ? 'Ngày Tồn SOH (Plan)' : 'Covered day Usage'}</th>
                <th className="py-3 px-3 min-w-[100px] text-center">{isEnterprise ? 'Ngày Tồn SOH (MTD)' : 'Covered day MTD'}</th>
                <th className="py-3 px-3 min-w-[110px] text-center">{isEnterprise ? '🚨 Ngày Cạn SOH' : 'Coverage till (1)'}</th>
                <th className="py-3 px-3 min-w-[110px] text-right">{isEnterprise ? '⚡ Lượng Bù Đắp' : 'Arrange More'}</th>
                <th className="py-3 px-3 min-w-[90px] text-center">{isEnterprise ? 'Ngày Tồn Sau Bù' : 'Covered day (2)'}</th>
                <th className="py-3 px-3 min-w-[110px] text-right">{isEnterprise ? '🚢 PO Đang Về (kg)' : 'PO PENDING'}</th>
                <th className="py-3 px-3 min-w-[100px] text-center">{isEnterprise ? '🛡️ Tổng Ngày Che Phủ' : 'Covered day (3)'}</th>
                <th className="py-3 px-3 min-w-[110px] text-center">{isEnterprise ? '📅 Ngày Bảo Vệ Tối Đa' : 'Coverage till (2)'}</th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>

              {/* Fixed SUBTOTAL Aggregation Row (Top of Table) */}
              {summary && (
                <tr className="bg-emerald-950/40 text-emerald-300 font-bold border-b border-emerald-800/50">
                  <td colSpan={7} className="py-2.5 px-3 text-left tracking-wider uppercase text-[11px] text-emerald-400">
                    ∑ TOTAL SUBTOTAL (TỔNG CỘNG HỆ THỐNG)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-100">{summary.TotalSOHQtyKg.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-right">{summary.TotalMTDPrevMonthKg.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-right">{summary.TotalMTDCurrMonthKg.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-right">{summary.TotalMonthlyUsageForecastKg.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-right text-amber-300">{(summary.OverallPctUsedUsage * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-200">{summary.TotalDailyStandardUsageKg.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-center text-cyan-300">{summary.OverallDOIStandardDays}</td>
                  <td className="py-2.5 px-3 text-center text-cyan-300">{summary.OverallDOIActualMTDDays}</td>
                  <td className="py-2.5 px-3 text-center text-slate-200">{summary.OverallCoverageTill1}</td>
                  <td className="py-2.5 px-3 text-right text-amber-400">{summary.TotalEmergencyBufferKg.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-center">{summary.OverallDOIAfterBufferDays}</td>
                  <td className="py-2.5 px-3 text-right text-blue-300">{summary.TotalPOPendingKg.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-center text-purple-300 text-sm font-black">{summary.OverallTotalPipelineDOIDays}</td>
                  <td className="py-2.5 px-3 text-center text-purple-300 font-semibold">{summary.OverallMaxProtectedDate}</td>
                  <td className="py-2.5 px-3 text-center">-</td>
                </tr>
              )}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={22} className="py-12 text-center text-slate-500">
                    Không tìm thấy nguyên liệu nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isCritical = row.DOI_Standard_Days < 7;
                  const isWarning = row.DOI_Standard_Days >= 7 && row.DOI_Standard_Days <= 15;
                  const hasArrange = row.EmergencyBufferQtyKg > 0;
                  const hasPO = row.PO_PendingInboundKg > 0;

                  return (
                    <tr
                      key={row.PositionID}
                      onClick={() => setSelectedItem(row)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isCritical ? 'bg-red-950/15' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.Region === 'SOUTH'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {row.Region}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{row.RMGroup}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.Division}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{row.FactoryCode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{row.MaterialCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-100">{row.MaterialName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.PIC}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200">
                        {row.SOHQtyKg.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {row.MTD_Production_PrevMonth_Kg.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {row.MTD_Production_CurrMonth_Kg.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {row.MonthlyUsageForecastKg.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={
                            row.PctUsedUsage > 1.0
                              ? 'text-red-400 font-bold'
                              : row.PctUsedUsage > 0.8
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }
                        >
                          {(row.PctUsedUsage * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {row.DailyStandardUsageKg.toLocaleString('vi-VN')}
                      </td>

                      {/* DOI Standard (Plan) */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            isCritical
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {row.DOI_Standard_Days >= 999 ? '-' : row.DOI_Standard_Days}
                        </span>
                      </td>

                      {/* DOI MTD (Actual) */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                        {row.DOI_Actual_MTD_Days >= 999 ? '-' : row.DOI_Actual_MTD_Days}
                      </td>

                      {/* Stockout Date SOH */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={isCritical ? 'text-red-400 font-bold' : 'text-slate-400'}>
                          {row.StockoutDateSOH ? row.StockoutDateSOH.split('T')[0] : '-'}
                        </span>
                      </td>

                      {/* Arrange More */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {hasArrange ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                            +{row.EmergencyBufferQtyKg.toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>

                      {/* Covered Day (2) */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {row.DOI_AfterBuffer_Days >= 999 ? '-' : row.DOI_AfterBuffer_Days}
                      </td>

                      {/* PO PENDING */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {hasPO ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
                            {row.PO_PendingInboundKg.toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>

                      {/* Total Pipeline DOI (3) */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {row.TotalPipeline_DOI_Days >= 999 ? '-' : row.TotalPipeline_DOI_Days}
                        </span>
                      </td>

                      {/* Max Protected Date */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-purple-300">
                        {row.MaxProtectedDate ? row.MaxProtectedDate.split('T')[0] : '-'}
                      </td>

                      {/* Action Button */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parameter Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-base">
                <Sliders className="w-5 h-5 text-blue-400" />
                Cấu Hình Tham Số Tính Toán Mốc
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Ngày Mốc Báo Cáo (Cut-off Snapshot Date):</label>
                <input
                  type="date"
                  value={snapshotDate}
                  onChange={(e) => setSnapshotDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Số Ngày Làm Việc Thực Tế Đến Cut-off (MTD Days):</label>
                <input
                  type="number"
                  value={cutoffWorkingDays}
                  onChange={(e) => setCutoffWorkingDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Dùng để chia lượng dùng MTD tính tốc độ chạy thực tế (mặc định: 22 ngày).</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Chu Kỳ Ngày Chuẩn Của Tháng (Standard Month Days):</label>
                <input
                  type="number"
                  value={standardMonthDays}
                  onChange={(e) => setStandardMonthDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Dùng để chia Forecast tháng ra định mức ngày (mặc định doanh nghiệp: 28 ngày).</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRecalculate}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tính Toán Lại Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Detail Drawer / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {selectedItem.FactoryCode}
                  </span>
                  <h3 className="text-lg font-bold text-slate-100">
                    {selectedItem.MaterialName} ({selectedItem.MaterialCode})
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Khu vực: {selectedItem.Region} | Ngành: {selectedItem.Division} | Phụ trách: {selectedItem.PIC}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Metric Comparison Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500">Tồn Kho Hiện Tại (SOH)</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {selectedItem.SOHQtyKg.toLocaleString('vi-VN')} kg
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500">Tiêu Hao Kế Hoạch / Ngày</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {selectedItem.DailyStandardUsageKg.toLocaleString('vi-VN')} kg/d
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500">Ngày Tồn SOH (Plan)</span>
                <div className={`text-base font-bold mt-1 ${selectedItem.DOI_Standard_Days < 7 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedItem.DOI_Standard_Days} ngày
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500">Lượng Đề Xuất Bù Đắp (Arrange)</span>
                <div className="text-base font-bold text-amber-400 mt-1">
                  +{selectedItem.EmergencyBufferQtyKg.toLocaleString('vi-VN')} kg
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500">Đơn Mua Đang Về (PO Pending)</span>
                <div className="text-base font-bold text-blue-400 mt-1">
                  {selectedItem.PO_PendingInboundKg.toLocaleString('vi-VN')} kg
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500">Tổng Ngày Che Phủ Tối Đa</span>
                <div className="text-base font-bold text-purple-300 mt-1">
                  {selectedItem.TotalPipeline_DOI_Days} ngày (tới {selectedItem.MaxProtectedDate.split('T')[0]})
                </div>
              </div>
            </div>

            {/* AI Advisor Recommendation Note */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-200">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Cố Vấn Điều Phối Thông Minh (Smart Supply Advisor)
              </div>
              <p className="text-slate-300">
                {selectedItem.DOI_Standard_Days < 7
                  ? `Nhà máy ${selectedItem.FactoryCode} đang ở mức báo động cạn hàng (${selectedItem.DOI_Standard_Days} ngày). Đề xuất ưu tiên nhận ${selectedItem.EmergencyBufferQtyKg.toLocaleString('vi-VN')} kg từ kho lân cận hoặc giải phóng gấp PO Pending.`
                  : `Tồn kho tại ${selectedItem.FactoryCode} ở mức an toàn (${selectedItem.DOI_Standard_Days} ngày). Có thể xem xét hỗ trợ điều chuyển cho các nhà máy đang thiếu hụt.`}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
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
