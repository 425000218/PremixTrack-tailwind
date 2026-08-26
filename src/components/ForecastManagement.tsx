import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Filter,
  Search,
  Upload,
  Download,
  Trash2,
  Edit2,
  Plus,
  ArrowUpToLine,
  ArrowDownToLine,
  FileSpreadsheet,
  FileDown,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  BarChart3,
  LineChart,
  RefreshCw,
  X,
  Save,
  Clock,
  Sparkles,
  Check,
  Sliders,
  AlertTriangle,
  Flame,
  ArrowRight,
  UserCheck,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ForecastRunVersion,
  ForecastCompareRow,
  Fact_Forecast_Detail,
  Dim_Material,
  Dim_Factory,
  Language,
  FactoryDivision,
} from '../types';

interface ForecastManagementProps {
  forecastVersions: ForecastRunVersion[];
  compareData: ForecastCompareRow[];
  materials: Dim_Material[];
  factories: Dim_Factory[];
  onUpdateVersions: (versions: ForecastRunVersion[]) => void;
  onUpdateCompareData: (data: ForecastCompareRow[]) => void;
  language: Language;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE COMPONENT: Vẽ biểu đồ mini xu hướng (Sparkline SVG)
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
  if (!data || data.length < 2) {
    return <span className="text-slate-300 font-mono text-[10px]">-</span>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 100;
  const height = 26;
  const padding = 3;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const strokeColor = isUp ? '#059669' : '#dc2626';
  const polylineStr = points.join(' ');
  const lastPoint = points[points.length - 1].split(',');
  const firstPoint = points[0].split(',');

  return (
    <div className="flex items-center justify-center py-0.5">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
        />
        <circle
          cx={Number(firstPoint[0])}
          cy={Number(firstPoint[1])}
          r="2"
          className="fill-slate-400"
        />
        <circle
          cx={Number(lastPoint[0])}
          cy={Number(lastPoint[1])}
          r="3"
          fill={strokeColor}
        />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BALLOON HOME / END BUTTONS (For data >= 20 lines)
// ─────────────────────────────────────────────────────────────────────────────
function FloatingHomeEndButtons({
  containerRef,
  rowCount,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rowCount: number;
}) {
  if (rowCount < 20) return null;

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="absolute right-4 bottom-4 z-30 flex flex-col items-center gap-2 animate-fade-in pointer-events-auto">
      <button
        onClick={scrollToTop}
        className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-900/85 hover:bg-blue-600 text-white shadow-xl backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        title="Về đầu trang (Home / Top)"
      >
        <ArrowUpToLine className="w-4 h-4" />
        <span className="absolute right-full mr-2.5 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Về đầu bảng (Home)
        </span>
      </button>

      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900/75 text-blue-200 backdrop-blur-md border border-white/10 shadow-sm">
        {rowCount} dòng
      </span>

      <button
        onClick={scrollToBottom}
        className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-900/85 hover:bg-blue-600 text-white shadow-xl backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        title="Xuống cuối trang (End / Bottom)"
      >
        <ArrowDownToLine className="w-4 h-4" />
        <span className="absolute right-full mr-2.5 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Xuống cuối bảng (End)
        </span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CHỈNH SỬA / THÊM MỚI DÒNG ITEM FORECAST
// ─────────────────────────────────────────────────────────────────────────────
function LineItemModal({
  item,
  availableDates,
  allMaterials,
  allFactories,
  onSave,
  onClose,
}: {
  item: ForecastCompareRow | null;
  availableDates: string[];
  allMaterials: Dim_Material[];
  allFactories: Dim_Factory[];
  onSave: (row: ForecastCompareRow) => void;
  onClose: () => void;
}) {
  const isNew = item === null;
  const blankRow: ForecastCompareRow = {
    MaterialCode: allMaterials[0]?.MaterialCode || '',
    MaterialName: allMaterials[0]?.Name_VN || '',
    Division: 'Livestock',
    SiteCode: allFactories[0]?.InternalCode || 'DBD',
    FactoryCode: allFactories[0]?.InternalCode || 'DBD',
    FactoryName: allFactories[0]?.FactoryName_VN || '043 Binh Duong VN',
    RunQuantities: availableDates.reduce((acc, d) => ({ ...acc, [d]: 0 }), {}),
    SparklineData: [0, 0],
    LatestQty: 0,
    PreviousQty: 0,
    ComparePct: 0,
    QtyDiff: 0,
  };

  const [form, setForm] = useState<ForecastCompareRow>(() => {
    if (item) return { ...item, RunQuantities: { ...item.RunQuantities } };
    return blankRow;
  });

  const handleMaterialChange = (code: string) => {
    const mat = allMaterials.find((m) => m.MaterialCode === code);
    setForm((prev) => ({
      ...prev,
      MaterialCode: code,
      MaterialName: mat?.Name_VN || code,
    }));
  };

  const handleFactoryChange = (facCode: string) => {
    const fac = allFactories.find((f) => f.InternalCode === facCode);
    setForm((prev) => ({
      ...prev,
      SiteCode: facCode,
      FactoryCode: facCode,
      FactoryName: fac?.FactoryName_VN || facCode,
      Division: fac?.Division || 'Livestock',
    }));
  };

  const handleQtyChange = (date: string, val: number) => {
    setForm((prev) => ({
      ...prev,
      RunQuantities: {
        ...prev.RunQuantities,
        [date]: Math.max(0, val),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.MaterialCode || !form.SiteCode) {
      alert('Vui lòng chọn Mã nguyên liệu và Nhà máy.');
      return;
    }

    const sortedDates = Object.keys(form.RunQuantities).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    const spark = sortedDates.map((d) => form.RunQuantities[d] || 0).reverse();
    const latest = sortedDates[0] ? form.RunQuantities[sortedDates[0]] || 0 : 0;
    const prev = sortedDates[1] ? form.RunQuantities[sortedDates[1]] || 0 : 0;
    const diff = latest - prev;
    const pct = prev > 0 ? (diff / prev) * 100 : latest > 0 ? 100 : 0;

    onSave({
      ...form,
      SparklineData: spark,
      LatestQty: latest,
      PreviousQty: prev,
      ComparePct: pct,
      QtyDiff: diff,
    });
    onClose();
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium text-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>{isNew ? 'Thêm Dòng Nguyên Liệu Mới (Manual Add)' : `Chỉnh Sửa Dòng: ${form.MaterialCode} (${form.FactoryName})`}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cập nhật số liệu Forecast chi tiết theo từng ngày đợt chạy của R&amp;D.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Nguyên Liệu (Material) (*)
              </label>
              <select
                className={inputCls}
                value={form.MaterialCode}
                onChange={(e) => handleMaterialChange(e.target.value)}
                required
              >
                {allMaterials.map((m) => (
                  <option key={m.MaterialID} value={m.MaterialCode}>
                    {m.MaterialCode} - {m.Name_VN}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Nhà Máy / Recipe Site (*)
              </label>
              <select
                className={inputCls}
                value={form.SiteCode}
                onChange={(e) => handleFactoryChange(e.target.value)}
                required
              >
                {allFactories.map((f) => (
                  <option key={f.FactoryID} value={f.InternalCode}>
                    {f.InternalCode} - {f.FactoryName_VN} ({f.Division})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tên Hiển Thị (DESC)
              </label>
              <input
                className={inputCls}
                value={form.MaterialName}
                onChange={(e) => setForm((prev) => ({ ...prev, MaterialName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Ngành (Division)
              </label>
              <select
                className={inputCls}
                value={form.Division}
                onChange={(e) => setForm((prev) => ({ ...prev, Division: e.target.value as FactoryDivision }))}
              >
                <option value="Livestock">Gia súc (Livestock)</option>
                <option value="Aqua">Thủy sản (Aqua)</option>
                <option value="Premix">Premix</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Nhập Khối Lượng Forecast Theo Từng Ngày (kg)</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableDates.map((date) => (
                <div key={date} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-mono text-[10px] font-bold text-slate-500 block mb-1">
                    {date}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                    value={form.RunQuantities[date] ?? 0}
                    onChange={(e) => handleQtyChange(date, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
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
              <span>{isNew ? 'Thêm Dòng Mới' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: FORECAST MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export const ForecastManagement: React.FC<ForecastManagementProps> = ({
  forecastVersions,
  compareData,
  materials,
  factories,
  onUpdateVersions,
  onUpdateCompareData,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'analytics' | 'versions'>('matrix');
  const [isHeaderSummaryExpanded, setIsHeaderSummaryExpanded] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Map PIC from materials (tblITEM)
  const materialPICMap = useMemo(() => {
    const map = new Map<string, string>();
    materials.forEach((m) => {
      if (m.MaterialCode) {
        map.set(m.MaterialCode, m.PIC || 'Fiona');
      }
    });
    return map;
  }, [materials]);

  // Distinct PIC list from materials
  const distinctPICs = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.PIC) set.add(m.PIC);
    });
    return Array.from(set).sort();
  }, [materials]);

  // Distinct Sites / Plants list from factories and compareData
  const distinctSites = useMemo(() => {
    const set = new Map<string, string>();
    factories.forEach((f) => {
      set.set(f.InternalCode, `${f.InternalCode} - ${f.FactoryName_VN}`);
    });
    compareData.forEach((c) => {
      if (c.SiteCode && !set.has(c.SiteCode)) {
        set.set(c.SiteCode, `${c.SiteCode} - ${c.FactoryName}`);
      }
    });
    return Array.from(set.entries()).map(([code, label]) => ({ code, label }));
  }, [factories, compareData]);

  // ── 1. DYNAMIC MULTI-DATE SELECTOR (Tối đa 6 ngày) ────────────────────────
  const allAvailableRunDates = useMemo(() => {
    return [...forecastVersions]
      .sort((a, b) => new Date(b.RunDate).getTime() - new Date(a.RunDate).getTime())
      .map((v) => v.RunDate);
  }, [forecastVersions]);

  // Default: 6 latest dates
  const [selectedRunDates, setSelectedRunDates] = useState<string[]>(() => {
    return allAvailableRunDates.slice(0, 6);
  });

  useEffect(() => {
    if (selectedRunDates.length === 0 && allAvailableRunDates.length > 0) {
      setSelectedRunDates(allAvailableRunDates.slice(0, 6));
    }
  }, [allAvailableRunDates]);

  const toggleDateSelection = (date: string) => {
    if (selectedRunDates.includes(date)) {
      if (selectedRunDates.length === 1) {
        alert('Phải giữ lại ít nhất 1 ngày để hiển thị dữ liệu.');
        return;
      }
      setSelectedRunDates(selectedRunDates.filter((d) => d !== date));
    } else {
      if (selectedRunDates.length >= 6) {
        alert('Bạn chỉ có thể chọn tối đa 6 ngày để đảm bảo độ rộng hiển thị bảng tối ưu nhất.');
        return;
      }
      const nextDates = [...selectedRunDates, date].sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );
      setSelectedRunDates(nextDates);
    }
  };

  // ── 2. MẶC ĐỊNH SO SÁNH 2 KỲ LIỀN KỀ SAU CÙNG (Default 2 Latest Runs) ─────
  const [compareTargetDate, setCompareTargetDate] = useState<string>(() => {
    return allAvailableRunDates[0] || '';
  });
  const [compareBaseDate, setCompareBaseDate] = useState<string>(() => {
    return allAvailableRunDates[1] || allAvailableRunDates[0] || '';
  });

  // Keep target and base within selectedRunDates
  useEffect(() => {
    if (selectedRunDates.length >= 1) {
      if (!selectedRunDates.includes(compareTargetDate)) {
        setCompareTargetDate(selectedRunDates[0]);
      }
      if (selectedRunDates.length >= 2) {
        if (!selectedRunDates.includes(compareBaseDate)) {
          setCompareBaseDate(selectedRunDates[1]);
        }
      } else {
        setCompareBaseDate(selectedRunDates[0]);
      }
    }
  }, [selectedRunDates]);

  // ── 3. EXCEL-STYLE MULTI-SELECT SLICERS STATE ─────────────────────────────
  // Multi-Select Slicer 1: Division
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);

  const toggleDivisionSlicer = (div: string) => {
    if (selectedDivisions.includes(div)) {
      setSelectedDivisions(selectedDivisions.filter((d) => d !== div));
    } else {
      setSelectedDivisions([...selectedDivisions, div]);
    }
  };

  // Multi-Select Slicer 2: PIC Mua Hàng
  const [selectedPICs, setSelectedPICs] = useState<string[]>([]);

  const togglePICSlicer = (pic: string) => {
    if (selectedPICs.includes(pic)) {
      setSelectedPICs(selectedPICs.filter((p) => p !== pic));
    } else {
      setSelectedPICs([...selectedPICs, pic]);
    }
  };

  // Multi-Select Slicer 3: Site / Nhà Máy
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  const toggleSiteSlicer = (siteCode: string) => {
    if (selectedSites.includes(siteCode)) {
      setSelectedSites(selectedSites.filter((s) => s !== siteCode));
    } else {
      setSelectedSites([...selectedSites, siteCode]);
    }
  };

  // Reset all slicers
  const handleResetSlicers = () => {
    setSelectedDivisions([]);
    setSelectedPICs([]);
    setSelectedSites([]);
    setSearchTerm('');
    setFilterIncreaseActive(false);
    setFilterDecreaseActive(false);
    setFilterCut100Active(false);
  };

  // ── 4. DYNAMIC CUSTOM % INCREASE / DECREASE FILTERS (Default: Tăng >= 20%, Giảm <= -30%)
  const [filterIncreaseActive, setFilterIncreaseActive] = useState<boolean>(true);
  const [filterIncreaseThreshold, setFilterIncreaseThreshold] = useState<number>(20);

  const [filterIncrease100Active, setFilterIncrease100Active] = useState<boolean>(false);

  const [filterDecreaseActive, setFilterDecreaseActive] = useState<boolean>(true);
  const [filterDecreaseThreshold, setFilterDecreaseThreshold] = useState<number>(30);

  const [filterCut100Active, setFilterCut100Active] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'OR' | 'AND'>('OR');

  // ── 5. HEATMAP TOGGLE & COLLAPSIBLE SLICER ROWS STATE ─────────────────────
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState<boolean>(true);
  const [isRowDivisionPicExpanded, setIsRowDivisionPicExpanded] = useState<boolean>(true);
  const [isRowSiteExpanded, setIsRowSiteExpanded] = useState<boolean>(true);

  // ── 6. LINE ITEM EDIT / ADD MODAL STATE ────────────────────────────────────
  const [editingLineItem, setEditingLineItem] = useState<{
    open: boolean;
    item: ForecastCompareRow | null;
  }>({ open: false, item: null });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Compute Processed Compare Rows ─────────────────────────────────────────
  const processedRows = useMemo(() => {
    const targetD = compareTargetDate || selectedRunDates[0] || '';
    const baseD = compareBaseDate || selectedRunDates[1] || targetD;

    return compareData.map((row) => {
      const targetQty = row.RunQuantities[targetD] ?? 0;
      const baseQty = row.RunQuantities[baseD] ?? 0;
      const diff = targetQty - baseQty;
      let pct = 0;

      if (baseQty > 0) {
        pct = (diff / baseQty) * 100;
      } else if (targetQty > 0 && baseQty === 0) {
        pct = 100;
      } else if (targetQty === 0 && baseQty > 0) {
        pct = -100;
      }

      const sparklineValues = [...selectedRunDates]
        .reverse()
        .map((d) => row.RunQuantities[d] ?? 0);

      const pic = materialPICMap.get(row.MaterialCode) || 'Fiona';

      return {
        ...row,
        PIC: pic,
        LatestQty: targetQty,
        PreviousQty: baseQty,
        ComparePct: pct,
        QtyDiff: diff,
        SparklineData: sparklineValues,
      };
    });
  }, [compareData, selectedRunDates, compareTargetDate, compareBaseDate, materialPICMap]);

  // Apply Slicers, search and dynamic % threshold filters
  const filteredCompareRows = useMemo(() => {
    return processedRows.filter((row) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        row.MaterialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.MaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.FactoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.SiteCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Slicer 1: Division Multi-Select
      const matchesDivision =
        selectedDivisions.length === 0 || selectedDivisions.includes(row.Division);

      // Slicer 2: PIC Multi-Select
      const rowPIC = materialPICMap.get(row.MaterialCode) || 'Fiona';
      const matchesPIC =
        selectedPICs.length === 0 || selectedPICs.includes(rowPIC);

      // Slicer 3: Site Multi-Select
      const matchesSite =
        selectedSites.length === 0 ||
        selectedSites.includes(row.SiteCode) ||
        selectedSites.includes(row.FactoryCode);

      // Dynamic % Threshold Filters
      const pct = row.ComparePct;
      let matchesInc = true;
      let matchesInc100 = true;
      let matchesDec = true;
      let matchesCut = true;

      const hasActiveVarianceFilter =
        filterIncreaseActive ||
        filterIncrease100Active ||
        filterDecreaseActive ||
        filterCut100Active;

      if (hasActiveVarianceFilter) {
        matchesInc = filterIncreaseActive && pct >= filterIncreaseThreshold;
        matchesInc100 = filterIncrease100Active && pct >= 99.9;
        matchesDec = filterDecreaseActive && pct <= -Math.abs(filterDecreaseThreshold);
        matchesCut = filterCut100Active && pct <= -99.9;

        if (filterMode === 'OR') {
          const pass =
            (filterIncreaseActive && matchesInc) ||
            (filterIncrease100Active && matchesInc100) ||
            (filterDecreaseActive && matchesDec) ||
            (filterCut100Active && matchesCut);
          if (!pass) return false;
        } else {
          if (filterIncreaseActive && !matchesInc) return false;
          if (filterIncrease100Active && !matchesInc100) return false;
          if (filterDecreaseActive && !matchesDec) return false;
          if (filterCut100Active && !matchesCut) return false;
        }
      }

      return matchesSearch && matchesDivision && matchesPIC && matchesSite;
    });
  }, [
    processedRows,
    searchTerm,
    selectedDivisions,
    selectedPICs,
    selectedSites,
    materialPICMap,
    filterIncreaseActive,
    filterIncreaseThreshold,
    filterIncrease100Active,
    filterDecreaseActive,
    filterDecreaseThreshold,
    filterCut100Active,
    filterMode,
  ]);

  // ── Actions: Save Edit Row / Delete Row ────────────────────────────────────
  const handleSaveLineItem = (savedRow: ForecastCompareRow) => {
    const key = `${savedRow.MaterialCode}_${savedRow.FactoryName}`;
    const exists = compareData.some((r) => `${r.MaterialCode}_${r.FactoryName}` === key);

    let next: ForecastCompareRow[];
    if (exists) {
      next = compareData.map((r) =>
        `${r.MaterialCode}_${r.FactoryName}` === key ? savedRow : r
      );
    } else {
      next = [savedRow, ...compareData];
    }
    onUpdateCompareData(next);
  };

  const handleDeleteLineItem = (materialCode: string, factoryName: string) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa dòng nguyên liệu [${materialCode} - ${factoryName}] khỏi báo cáo?`
      )
    ) {
      const next = compareData.filter(
        (r) => !(r.MaterialCode === materialCode && r.FactoryName === factoryName)
      );
      onUpdateCompareData(next);
    }
  };

  // ── Export Full Multi-Run Matrix ──────────────────────────────────────────
  const handleExportCompareExcel = () => {
    const exportData = filteredCompareRows.map((r) => {
      const pic = materialPICMap.get(r.MaterialCode) || 'Fiona';
      const rowObj: Record<string, any> = {
        'CODE': r.MaterialCode,
        'DESC': r.MaterialName,
        'PIC': pic,
        'Division': r.Division,
        'SITE': r.SiteCode,
        'Factory': r.FactoryName,
      };

      selectedRunDates.forEach((d) => {
        const val = r.RunQuantities[d];
        rowObj[d] = val !== undefined && val !== null ? val : '-';
      });

      rowObj[`So Sánh (${compareTargetDate} vs ${compareBaseDate})`] = `${
        r.ComparePct >= 0 ? '+' : ''
      }${r.ComparePct.toFixed(1)}%`;
      rowObj['Qty Diff (kg)'] = r.QtyDiff;

      return rowObj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Forecast_Comparison');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `RD_Forecast_MultiRun_Comparison_${dateStr}.xlsx`);
  };

  // ── Export Disruption Report ──────────────────────────────────────────────
  const handleExportDisruptionReport = () => {
    const disruptionItems = processedRows.filter(
      (r) => r.ComparePct <= -99.9 || r.ComparePct >= 50
    );

    if (disruptionItems.length === 0) {
      alert('Không có mặt hàng nào bị cắt giảm -100% hoặc tăng đột biến > 50% trong kỳ so sánh này.');
      return;
    }

    const exportData = disruptionItems.map((r) => {
      const pic = materialPICMap.get(r.MaterialCode) || 'Fiona';
      return {
        'Phân Loại Biến Động': r.ComparePct <= -99.9 ? '⛔ CẮT GIẢM 100%' : '🚀 TĂNG ĐỘT BIẾN > 50%',
        'CODE': r.MaterialCode,
        'DESC': r.MaterialName,
        'PIC': pic,
        'Division': r.Division,
        'SITE': r.SiteCode,
        'Factory': r.FactoryName,
        [`Kỳ Sau (${compareTargetDate})`]: r.LatestQty,
        [`Kỳ Trước (${compareBaseDate})`]: r.PreviousQty,
        'Biến Động (%)': `${r.ComparePct >= 0 ? '+' : ''}${r.ComparePct.toFixed(1)}%`,
        'Chênh Lệch Qty (kg)': r.QtyDiff,
        'Khuyến Nghị Chuỗi Cung Ứng':
          r.ComparePct <= -99.9
            ? 'Tạm dừng đặt hàng PO mới, rà soát xả tồn kho SOH'
            : 'Gom hàng mua khẩn cấp, kiểm tra hạn mức tồn an toàn',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Disruption_Alert');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Bao_Cao_Bien_Dong_Khan_Forecast_${dateStr}.xlsx`);
  };

  // ── Upload Forecast Handler ───────────────────────────────────────────────
  const [newRunDate, setNewRunDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newVersionName, setNewVersionName] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target!.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rawJson.length < 3) {
          alert('File Excel không đúng cấu trúc.');
          return;
        }

        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
          const rowStr = rawJson[i].map(String).join(' ').toLowerCase();
          if (rowStr.includes('material code') || rowStr.includes('recipe site') || rowStr.includes('code')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = rawJson[headerRowIndex].map((h) => String(h || '').trim());
        const codeIdx = headers.findIndex((h) => h.toLowerCase().includes('material code') || h.toLowerCase() === 'code');
        const descIdx = headers.findIndex((h) => h.toLowerCase().includes('material description') || h.toLowerCase() === 'desc');

        if (codeIdx === -1) {
          alert('Không tìm thấy cột "Material code" hoặc "CODE" trong file Excel.');
          return;
        }

        const plantCols: { colIndex: number; headerName: string }[] = [];
        headers.forEach((h, colIdx) => {
          if (
            colIdx !== codeIdx &&
            colIdx !== descIdx &&
            !h.toLowerCase().includes('grand total') &&
            h.length > 0
          ) {
            plantCols.push({ colIndex: colIdx, headerName: h });
          }
        });

        let totalUploadedKg = 0;
        const newRowsExtracted: { code: string; desc: string; plant: string; qty: number }[] = [];

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          const matCode = String(row[codeIdx] || '').trim();
          const matDesc = descIdx !== -1 ? String(row[descIdx] || '').trim() : matCode;

          if (!matCode || matCode.toLowerCase().includes('grand total')) continue;

          plantCols.forEach((pc) => {
            const val = Number(row[pc.colIndex]) || 0;
            if (val > 0) {
              totalUploadedKg += val;
              newRowsExtracted.push({
                code: matCode,
                desc: matDesc,
                plant: pc.headerName,
                qty: val,
              });
            }
          });
        }

        const runDateToSave = newRunDate || new Date().toISOString().split('T')[0];
        const versionName =
          newVersionName || file.name || `RD_FC_${runDateToSave.replace(/-/g, '')}.xlsx`;

        const newVersionObj: ForecastRunVersion = {
          VersionID: `FC-${runDateToSave}-${Date.now().toString(36)}`,
          RunDate: runDateToSave,
          VersionName: versionName,
          TotalForecastQty: Math.round(totalUploadedKg),
          SKUCount: new Set(newRowsExtracted.map((x) => x.code)).size || 38,
          PlantCount: plantCols.length || 22,
          UploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          UploadedBy: 'Current User',
          SourceFileName: file.name,
          Notes: newNotes || 'Đợt nạp dữ liệu bổ sung từ R&D',
        };

        const updatedVersions = [
          newVersionObj,
          ...forecastVersions.filter((v) => v.RunDate !== runDateToSave),
        ];
        onUpdateVersions(updatedVersions);

        if (!selectedRunDates.includes(runDateToSave)) {
          setSelectedRunDates([runDateToSave, ...selectedRunDates.slice(0, 5)]);
        }

        const currentMap = new Map<string, ForecastCompareRow>();
        compareData.forEach((r) => currentMap.set(`${r.MaterialCode}_${r.FactoryName}`, r));

        newRowsExtracted.forEach((item) => {
          const key = `${item.code}_${item.plant}`;
          const existing = currentMap.get(key);

          if (existing) {
            const nextQuantities = { ...existing.RunQuantities, [runDateToSave]: item.qty };
            currentMap.set(key, { ...existing, RunQuantities: nextQuantities });
          } else {
            currentMap.set(key, {
              MaterialCode: item.code,
              MaterialName: item.desc,
              Division: item.desc.toLowerCase().includes('aqua') ? 'Aqua' : 'Livestock',
              SiteCode: item.plant.slice(0, 4).trim(),
              FactoryCode: item.plant.slice(0, 4).trim(),
              FactoryName: item.plant,
              RunQuantities: { [runDateToSave]: item.qty },
              SparklineData: [0, item.qty],
              LatestQty: item.qty,
              PreviousQty: 0,
              ComparePct: 100,
              QtyDiff: item.qty,
            });
          }
        });

        onUpdateCompareData(Array.from(currentMap.values()));
        setUploadStatusMsg(
          `Đã nạp thành công đợt Forecast ngày ${runDateToSave} (${newRowsExtracted.length} dòng, tổng ${totalUploadedKg.toLocaleString()} kg)!`
        );
        setIsUploadModalOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch {
        alert('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const stickyThCls =
    'sticky top-0 z-20 bg-slate-50 border-b border-slate-200 py-2.5 px-3 text-slate-600 uppercase text-[10px] font-bold tracking-wider';

  return (
    <div className="space-y-3">
      {/* ── 1. HEADER & SUB-TABS BAR ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kế Hoạch &amp; Theo Dõi Dự Báo Forecast Nhu Cầu Nguyên Liệu (RD)
              </h2>
              {isHeaderSummaryExpanded && (
                <p className="text-[11px] text-slate-500 mt-0.5 animate-fade-in">
                  Đối soát và phân tích biến động Raw Material Consumption từ R&amp;D theo ngày upload, hỗ trợ Multi-Select Slicers (Ngành, PIC Mua Hàng, Nhà Máy), so sánh 2 kỳ liền kề sau cùng.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingLineItem({ open: true, item: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer"
              title="Thêm một dòng nguyên liệu x nhà máy thủ công vào bảng"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Dòng Thủ Công</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Đợt Mới</span>
            </button>

            <button
              onClick={() => setIsHeaderSummaryExpanded(!isHeaderSummaryExpanded)}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isHeaderSummaryExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isHeaderSummaryExpanded ? 'Thu Gọn' : 'Mở Rộng'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs flex-wrap border border-slate-200/60">
          {[
            {
              id: 'matrix' as const,
              label: `Ma Trận So Sánh Đa Kỳ (${filteredCompareRows.length} dòng)`,
              icon: Layers,
            },
            {
              id: 'analytics' as const,
              label: 'Biểu Đồ Xu Hướng & Phân Tích Biến Động',
              icon: BarChart3,
            },
            {
              id: 'versions' as const,
              label: `Quản Lý Đợt Upload (${forecastVersions.length} đợt)`,
              icon: Calendar,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {uploadStatusMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{uploadStatusMsg}</span>
          </div>
          <button onClick={() => setUploadStatusMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 2. SUBTAB 1: MULTI-RUN MATRIX WITH EXCEL SLICERS ───────────────── */}
      {activeTab === 'matrix' && (
        <div className="space-y-3">
          {/* EXCEL SLICERS TOOLBAR & DATE SELECTOR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
            {/* ROW 1: Multi-Date Selection Pills (Max 6) & Flexible Compare Target/Base Picker */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
              {/* Multi-Date Selector */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Chọn Ngày Upload (Tối đa 6 cột):</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {allAvailableRunDates.map((date) => {
                    const isSelected = selectedRunDates.includes(date);
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleDateSelection(date)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 shadow-2xs font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span>{date}</span>
                        {isSelected && <Check className="w-3 h-3 text-sky-600 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                <span className="text-[11px] font-bold font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                  {selectedRunDates.length}/6 ngày
                </span>
              </div>

              {/* Flexible Base vs Target Compare Picker (Mặc định 2 kỳ gần nhất) */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kỳ So Sánh:</span>
                </span>

                <select
                  value={compareTargetDate}
                  onChange={(e) => setCompareTargetDate(e.target.value)}
                  className="bg-white font-mono font-bold text-blue-700 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  title="Kỳ sau cùng (Mới nhất)"
                >
                  {selectedRunDates.map((d) => (
                    <option key={d} value={d}>
                      Kỳ Mới: {d}
                    </option>
                  ))}
                </select>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                <select
                  value={compareBaseDate}
                  onChange={(e) => setCompareBaseDate(e.target.value)}
                  className="bg-white font-mono font-bold text-purple-700 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  title="Kỳ liền kề trước đó (Gốc)"
                >
                  {selectedRunDates.map((d) => (
                    <option key={d} value={d}>
                      Kỳ Gốc: {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ROW 2: DIVISION & PIC MUA HÀNG SLICERS (COLLAPSIBLE) */}
            <div className="border-b border-slate-100 pb-2">
              <div className="flex items-center justify-between py-1 px-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bộ Lọc Ngành Sản Xuất &amp; PIC Mua Hàng</span>
                  </span>
                  {!isRowDivisionPicExpanded && (
                    <div className="flex items-center gap-1.5 animate-fade-in">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedDivisions.length === 0 ? 'Tất cả Ngành' : `${selectedDivisions.length} Ngành đã chọn`}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {selectedPICs.length === 0 ? 'Tất cả PIC' : `${selectedPICs.length} PIC đã chọn`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsRowDivisionPicExpanded(!isRowDivisionPicExpanded)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title={isRowDivisionPicExpanded ? 'Thu gọn hàng' : 'Mở rộng hàng'}
                >
                  {isRowDivisionPicExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-300 ease-in-out overflow-hidden ${
                  isRowDivisionPicExpanded ? 'max-h-[500px] opacity-100 mt-1.5' : 'max-h-0 opacity-0'
                }`}
              >
                {/* Slicer: Division (Ngành Sản Xuất) */}
                <div className="bg-slate-50/70 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ngành Sản Xuất (Division)</span>
                    </span>
                    {selectedDivisions.length > 0 && (
                      <button
                        onClick={() => setSelectedDivisions([])}
                        className="text-[10px] text-blue-600 hover:underline font-semibold"
                      >
                        Bỏ chọn ({selectedDivisions.length})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedDivisions([])}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        selectedDivisions.length === 0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Tất cả Ngành
                    </button>

                    {['Livestock', 'Aqua', 'Premix'].map((div) => {
                      const isSelected = selectedDivisions.includes(div);
                      return (
                        <button
                          key={div}
                          type="button"
                          onClick={() => toggleDivisionSlicer(div)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            isSelected
                              ? div === 'Aqua'
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                                : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{div === 'Livestock' ? 'Gia súc (Livestock)' : div === 'Aqua' ? 'Thủy sản (Aqua)' : div}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slicer: PIC Mua Hàng (Chuyên Viên Thu Mua Map Từ tblITEM) */}
                <div className="bg-slate-50/70 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>PIC Mua Hàng (Chuyên Viên)</span>
                    </span>
                    {selectedPICs.length > 0 && (
                      <button
                        onClick={() => setSelectedPICs([])}
                        className="text-[10px] text-purple-600 hover:underline font-semibold"
                      >
                        Bỏ chọn ({selectedPICs.length})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedPICs([])}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        selectedPICs.length === 0
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Tất cả PIC
                    </button>

                    {distinctPICs.map((pic) => {
                      const isSelected = selectedPICs.includes(pic);
                      return (
                        <button
                          key={pic}
                          type="button"
                          onClick={() => togglePICSlicer(pic)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{pic}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3: SITE / RECIPE SITES / NHÀ MÁY SLICER (COLLAPSIBLE) */}
            <div className="border-b border-slate-100 pb-2">
              <div className="flex items-center justify-between py-1 px-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bộ Lọc Nhà Máy / Recipe Sites ({distinctSites.length} cơ sở)</span>
                  </span>
                  {!isRowSiteExpanded && (
                    <div className="flex items-center gap-1.5 animate-fade-in">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedSites.length === 0
                          ? 'Tất cả 17 Nhà Máy'
                          : `${selectedSites.length} Nhà Máy: [${selectedSites.join(', ')}]`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsRowSiteExpanded(!isRowSiteExpanded)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title={isRowSiteExpanded ? 'Thu gọn hàng' : 'Mở rộng hàng'}
                >
                  {isRowSiteExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              </div>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isRowSiteExpanded ? 'max-h-[500px] opacity-100 mt-1.5' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-slate-50/70 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span>Chọn Nhà Máy / Recipe Sites</span>
                    </span>
                    {selectedSites.length > 0 && (
                      <button
                        onClick={() => setSelectedSites([])}
                        className="text-[10px] text-blue-600 hover:underline font-semibold"
                      >
                        Bỏ chọn tất cả Site ({selectedSites.length})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedSites([])}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        selectedSites.length === 0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Tất cả Nhà Máy
                    </button>

                    {distinctSites.map((site) => {
                      const isSelected = selectedSites.includes(site.code);
                      return (
                        <button
                          key={site.code}
                          type="button"
                          onClick={() => toggleSiteSlicer(site.code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={site.label}
                        >
                          <span>{site.code}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: DYNAMIC % FILTERS, SEARCH, HEATMAP & ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm CODE, DESC, Nhà máy, PIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors w-48"
                  />
                </div>

                {/* Filter Tăng % */}
                <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  filterIncreaseActive ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={filterIncreaseActive}
                    onChange={(e) => setFilterIncreaseActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tăng ≥</span>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={filterIncreaseThreshold}
                    onChange={(e) => setFilterIncreaseThreshold(Number(e.target.value))}
                    className="w-11 bg-white border border-slate-200 rounded px-1 text-center font-mono font-bold text-emerald-700 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>%</span>
                </label>

                {/* Filter Tăng +100% (Mặt hàng mới / Tăng vọt) */}
                <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  filterIncrease100Active ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={filterIncrease100Active}
                    onChange={(e) => setFilterIncrease100Active(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>🚀 Tăng (+100%)</span>
                </label>

                {/* Filter Giảm % */}
                <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  filterDecreaseActive ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={filterDecreaseActive}
                    onChange={(e) => setFilterDecreaseActive(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Giảm sâu ≤ -</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filterDecreaseThreshold}
                    onChange={(e) => setFilterDecreaseThreshold(Number(e.target.value))}
                    className="w-11 bg-white border border-slate-200 rounded px-1 text-center font-mono font-bold text-rose-700 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>%</span>
                </label>

                {/* Filter Cắt Giảm 100% */}
                <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  filterCut100Active ? 'bg-red-100 text-red-900 border-red-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={filterCut100Active}
                    onChange={(e) => setFilterCut100Active(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>⛔ Cắt Giảm (-100%)</span>
                </label>

                {/* Reset all filters */}
                {(selectedDivisions.length > 0 || selectedPICs.length > 0 || selectedSites.length > 0 || searchTerm || filterIncreaseActive || filterIncrease100Active || filterDecreaseActive || filterCut100Active) && (
                  <button
                    type="button"
                    onClick={handleResetSlicers}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer font-medium"
                    title="Xóa tất cả bộ lọc Slicer &amp; % biến động"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại bộ lọc</span>
                  </button>
                )}
              </div>

              {/* Heatmap & Export Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHeatmapEnabled(!isHeatmapEnabled)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isHeatmapEnabled
                      ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                  title="Bật/Tắt chế độ cảnh báo nhiệt màu gradient cho các ô số liệu biến động"
                >
                  <Flame className={`w-3.5 h-3.5 ${isHeatmapEnabled ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>Nhiệt Màu</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDisruptionReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/80 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Xuất riêng danh sách các mặt hàng bị cắt -100% hoặc tăng > 50%"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Xuất Biến Động Khẩn</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCompareExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Tải toàn bộ bảng ma trận ra file Excel"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Xuất Excel ({filteredCompareRows.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN DATA TABLE WITH STICKY HEADER, PIC BADGE, EDIT/DELETE & BALLOONS */}
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[560px]">
            <div
              ref={tableScrollRef}
              className="overflow-x-auto min-h-[500px] max-h-[calc(100vh-220px)] overflow-y-auto relative scroll-smooth flex-1"
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th className={stickyThCls}>CODE</th>
                    <th className={stickyThCls}>DESC (Tên Nguyên Liệu)</th>
                    <th className={`${stickyThCls} text-center`}>PIC</th>
                    <th className={`${stickyThCls} text-center`}>Division</th>
                    <th className={`${stickyThCls} text-center`}>SITE</th>
                    <th className={stickyThCls}>Factory (Nhà Máy)</th>

                    {/* Columns for Selected Run Dates */}
                    {selectedRunDates.map((d) => {
                      const isTarget = d === compareTargetDate;
                      const isBase = d === compareBaseDate;

                      return (
                        <th
                          key={d}
                          className={`${stickyThCls} text-right font-mono ${
                            isTarget
                              ? 'text-blue-700 bg-blue-50/70 border-b-2 border-b-blue-600'
                              : isBase
                              ? 'text-purple-700 bg-purple-50/50'
                              : ''
                          }`}
                        >
                          {d}
                          {isTarget && (
                            <div className="text-[8px] font-bold text-blue-600 font-sans">
                              [Kỳ Sau Cùng]
                            </div>
                          )}
                          {isBase && !isTarget && (
                            <div className="text-[8px] font-bold text-purple-600 font-sans">
                              [Kỳ Gốc Liền Kề]
                            </div>
                          )}
                        </th>
                      );
                    })}

                    <th className={`${stickyThCls} text-center min-w-[110px]`}>
                      <div className="flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>SparkLine</span>
                      </div>
                    </th>
                    <th className={`${stickyThCls} text-center`}>
                      Compare ({compareTargetDate.slice(5)} vs {compareBaseDate.slice(5)})
                    </th>
                    <th className={`${stickyThCls} text-right`}>Qty Diff (kg)</th>
                    <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredCompareRows.map((row, rIdx) => {
                    const isSevereCut = row.ComparePct <= -99.9;
                    const isHighSurge = row.ComparePct >= 50;
                    const isUp = row.ComparePct >= 0;
                    const pic = materialPICMap.get(row.MaterialCode) || 'Fiona';

                    return (
                      <tr
                        key={`${row.MaterialCode}_${row.FactoryName}_${rIdx}`}
                        className={`transition-colors ${
                          isHeatmapEnabled && isSevereCut
                            ? 'bg-rose-50/60 hover:bg-rose-50'
                            : isHeatmapEnabled && isHighSurge
                            ? 'bg-emerald-50/50 hover:bg-emerald-50/80'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                            {row.MaterialCode}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{row.MaterialName}</div>
                        </td>

                        {/* PIC Badge */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                            {pic}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              row.Division === 'Aqua'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {row.Division}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {row.SiteCode}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 font-semibold text-[11px]">
                          {row.FactoryName}
                        </td>

                        {/* Selected Run Date Columns with Heatmap Styling */}
                        {selectedRunDates.map((d) => {
                          const val = row.RunQuantities[d];
                          const hasVal = val !== undefined && val !== null;
                          const isZero = val === 0;
                          const isTarget = d === compareTargetDate;

                          let cellBg = '';
                          if (isHeatmapEnabled) {
                            if (isZero) cellBg = 'bg-rose-100/40 text-rose-700 font-bold';
                            else if (isTarget && isHighSurge) cellBg = 'bg-emerald-100/40 font-bold text-emerald-900';
                            else if (isTarget) cellBg = 'bg-blue-50/40 font-bold text-blue-900';
                          }

                          return (
                            <td
                              key={d}
                              className={`py-2.5 px-3 text-right font-mono text-[11px] ${cellBg}`}
                            >
                              {!hasVal || (isZero && isSevereCut && d === compareTargetDate) ? (
                                <span className="text-slate-300">-</span>
                              ) : isZero ? (
                                <span className="text-rose-600 font-bold">0</span>
                              ) : (
                                Number(val).toLocaleString(undefined, {
                                  minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
                                  maximumFractionDigits: 2,
                                })
                              )}
                            </td>
                          );
                        })}

                        {/* Sparkline Chart */}
                        <td className="py-1.5 px-2 text-center">
                          <Sparkline data={row.SparklineData} isUp={isUp} />
                        </td>

                        {/* Compare % Badge */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isUp ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold font-mono text-[11px]">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                +{row.ComparePct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold font-mono text-[11px]">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                {row.ComparePct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Qty Diff Column */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[11px]">
                          <span className={row.QtyDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {row.QtyDiff >= 0 ? '+' : ''}
                            {Number(row.QtyDiff).toLocaleString(undefined, {
                              minimumFractionDigits: Number.isInteger(row.QtyDiff) ? 0 : 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        {/* EDIT / DELETE ACTIONS */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingLineItem({ open: true, item: row })}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Sửa số liệu dòng này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLineItem(row.MaterialCode, row.FactoryName)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Xóa dòng này khỏi báo cáo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCompareRows.length === 0 && (
                    <tr>
                      <td colSpan={selectedRunDates.length + 9} className="py-12 text-center text-slate-400 font-medium text-xs">
                        Không tìm thấy nguyên liệu nào phù hợp với các bộ lọc Slicer và điều kiện tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Balloon Home / End Buttons (Active when rows >= 20) */}
            <FloatingHomeEndButtons
              containerRef={tableScrollRef}
              rowCount={filteredCompareRows.length}
            />
          </div>
        </div>
      )}

      {/* ── 3. SUBTAB 2: ANALYTICS & VARIANCE CHARTS ─────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Tăng Mạnh */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Top Nguyên Liệu Tăng Nhu Cầu Mạnh Nhất (%)</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {compareTargetDate} vs {compareBaseDate}
                </span>
              </div>

              <div className="space-y-2.5">
                {[...processedRows]
                  .sort((a, b) => b.ComparePct - a.ComparePct)
                  .slice(0, 6)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {item.MaterialCode} - {item.MaterialName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {item.FactoryName} ({item.Division}) • PIC: {materialPICMap.get(item.MaterialCode) || 'Fiona'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-emerald-700 text-xs">
                          +{item.ComparePct.toFixed(1)}%
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          +{item.QtyDiff.toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Giảm Sâu */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span>Top Nguyên Liệu Giảm / Cắt Giảm Nhu Cầu Sâu Nhất (%)</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {compareTargetDate} vs {compareBaseDate}
                </span>
              </div>

              <div className="space-y-2.5">
                {[...processedRows]
                  .sort((a, b) => a.ComparePct - b.ComparePct)
                  .slice(0, 6)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {item.MaterialCode} - {item.MaterialName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {item.FactoryName} ({item.Division}) • PIC: {materialPICMap.get(item.MaterialCode) || 'Fiona'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-rose-700 text-xs">
                          {item.ComparePct.toFixed(1)}%
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.QtyDiff.toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. SUBTAB 3: FORECAST VERSIONS LIST & CRUD ───────────────────────── */}
      {activeTab === 'versions' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Danh Sách Các Đợt Upload Forecast Từ RD ({forecastVersions.length} Đợt)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quản lý lịch sử nạp dữ liệu, chỉnh sửa thông tin hoặc xóa an toàn các đợt upload.
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nạp Đợt Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={stickyThCls}>Ngày Chạy (Run Date)</th>
                  <th className={stickyThCls}>Tên Đợt / File Gốc</th>
                  <th className={`${stickyThCls} text-right`}>Tổng Nhu Cầu (kg)</th>
                  <th className={`${stickyThCls} text-center`}>Số SKUs</th>
                  <th className={`${stickyThCls} text-center`}>Số Nhà Máy</th>
                  <th className={stickyThCls}>Người Upload</th>
                  <th className={stickyThCls}>Thời Điểm Nạp</th>
                  <th className={stickyThCls}>Ghi Chú</th>
                  <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {forecastVersions.map((ver) => (
                  <tr key={ver.VersionID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {ver.RunDate}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ver.VersionName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ver.SourceFileName}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                      {ver.TotalForecastQty.toLocaleString()} kg
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {ver.SKUCount}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {ver.PlantCount}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {ver.UploadedBy}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {ver.UploadedAt}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {ver.Notes || '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Xác nhận xóa đợt Forecast ngày [${ver.RunDate}]?`)) {
                            onUpdateVersions(forecastVersions.filter((v) => v.VersionID !== ver.VersionID));
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Xóa đợt upload này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. LINE ITEM EDIT / ADD MODAL ──────────────────────────────────── */}
      {editingLineItem.open && (
        <LineItemModal
          item={editingLineItem.item}
          availableDates={allAvailableRunDates}
          allMaterials={materials}
          allFactories={factories}
          onSave={handleSaveLineItem}
          onClose={() => setEditingLineItem({ open: false, item: null })}
        />
      )}

      {/* ── 6. MODAL UPLOAD ĐỢT FORECAST MỚI ───────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Upload Đợt Dữ Liệu Forecast Mới (RD Matrix)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động nhận diện định dạng ma trận tiêu hao nguyên liệu (22 nhà máy) hoặc bảng phẳng.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Ngày Chạy / Ngày Cập Nhật (DateUpdate) (*)
                </label>
                <input
                  type="date"
                  value={newRunDate}
                  onChange={(e) => setNewRunDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Tên Đợt / Phiên Bản
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: RD_FC_Matrix_20260826_V1.xlsx"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Ghi Chú Đợt Chạy
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Điều chỉnh công thức thức ăn heo nái khu vực Miền Nam..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/40 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-blue-600 mx-auto" />
                <div className="text-xs font-bold text-slate-800">
                  Chọn file Excel dữ liệu Forecast
                </div>
                <p className="text-[10px] text-slate-500">
                  Hỗ trợ các file .xlsx, .xls xuất từ RD hoặc D365 FO (định dạng Ma trận 22 Recipe site).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Chọn File &amp; Bắt Đầu Nạp
                </button>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
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
