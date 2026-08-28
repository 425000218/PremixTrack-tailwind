import React, { useRef, useState, useEffect } from 'react';
import {
  ForecastRunVersion,
  ForecastCompareRow,
  Fact_Forecast_Detail,
  Dim_Material,
  Dim_Factory,
  Language,
  FactoryDivision,
} from '../../types';
import {
  ArrowUpToLine,
  ArrowDownToLine,
  Edit2,
  Calendar,
  Save,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface ForecastManagementProps {
  forecastVersions: ForecastRunVersion[];
  compareData: ForecastCompareRow[];
  materials: Dim_Material[];
  factories: Dim_Factory[];
  onUpdateVersions: (versions: ForecastRunVersion[]) => void;
  onUpdateCompareData: (data: ForecastCompareRow[]) => void;
  language: Language;
}

export const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium text-slate-900';

export const stickyThCls =
  'py-3 px-3.5 font-bold text-slate-600 bg-slate-100/90 text-xs select-none border-r border-slate-200/60 last:border-r-0';

export function Sparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
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
          r="2.5"
          fill="#94a3b8"
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

export function FloatingHomeEndButtons({
  containerRef,
  rowCount,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rowCount: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkScroll = () => {
      setShow(el.scrollHeight > el.clientHeight + 80);
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [containerRef, rowCount]);

  if (!show || rowCount < 10) return null;

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    <div className="fixed bottom-6 right-8 z-40 flex flex-col gap-2 animate-fade-in shadow-2xl">
      <button
        onClick={scrollToTop}
        className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white backdrop-blur-md border border-white/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        title="L�n d?u b?ng (Home)"
      >
        <ArrowUpToLine className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
        <span className="absolute right-full mr-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md">
          L�n d?u b?ng (Home)
        </span>
      </button>

      <button
        onClick={scrollToBottom}
        className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white backdrop-blur-md border border-white/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        title="Xu?ng cu?i b?ng (End)"
      >
        <ArrowDownToLine className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
        <span className="absolute right-full mr-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md">
          Xu?ng cu?i b?ng (End)
        </span>
      </button>
    </div>
  );
}

export function LineItemModal({
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
      alert('Vui l�ng ch?n M� nguy�n li?u v� Nh� m�y.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>{isNew ? 'Th�m D�ng Nguy�n Li?u M?i (Manual Add)' : `Ch?nh S?a D�ng: ${form.MaterialCode} (${form.FactoryName})`}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              C?p nh?t s? li?u Forecast chi ti?t theo t?ng ng�y d?t ch?y c?a R&amp;D.
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
                Nguy�n Li?u (Material) (*)
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
                Nh� M�y / Recipe Site (*)
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
                T�n Hi?n Th? (DESC)
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
                Ng�nh (Division)
              </label>
              <select
                className={inputCls}
                value={form.Division}
                onChange={(e) => setForm((prev) => ({ ...prev, Division: e.target.value as FactoryDivision }))}
              >
                <option value="Livestock">Gia s�c (Livestock)</option>
                <option value="Aqua">Th?y s?n (Aqua)</option>
                <option value="Premix">Premix</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Nh?p Kh?i Lu?ng Forecast Theo T?ng Ng�y (kg)</span>
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
              H?y
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isNew ? 'Th�m D�ng M?i' : 'Luu Thay �?i'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
