import React, { useState, useMemo } from 'react';
import {
  Factory,
  Check,
  X,
  Search,
  CheckCheck,
  Square,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Dim_Factory, Language } from '../types';

export interface DashboardFactorySlicerProps {
  factories: Dim_Factory[];
  selectedFactoryIds: string[];
  onChange: (ids: string[]) => void;
  language?: Language;
}

export const DashboardFactorySlicer: React.FC<DashboardFactorySlicerProps> = ({
  factories,
  selectedFactoryIds = ['ALL'],
  onChange,
  language = 'vi',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isAllSelected = selectedFactoryIds.includes('ALL');

  const activeCount = isAllSelected ? factories.length : selectedFactoryIds.length;

  // Regional breakdown
  const southFactories = useMemo(() => factories.filter((f) => f.RegionID?.toUpperCase() === 'SOUTH'), [factories]);
  const northFactories = useMemo(() => factories.filter((f) => f.RegionID?.toUpperCase() === 'NORTH'), [factories]);
  const centralFactories = useMemo(() => factories.filter((f) => f.RegionID?.toUpperCase() === 'CENTRAL'), [factories]);
  const livestockFactories = useMemo(() => factories.filter((f) => f.Division === 'Livestock'), [factories]);
  const aquaFactories = useMemo(() => factories.filter((f) => f.Division === 'Aqua'), [factories]);

  // Filter factories by search
  const filteredFactories = useMemo(() => {
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase().trim();
    return factories.filter(
      (f) =>
        f.InternalCode.toLowerCase().includes(q) ||
        f.FactoryName_VN.toLowerCase().includes(q) ||
        (f.RegionID && f.RegionID.toLowerCase().includes(q)) ||
        (f.Division && f.Division.toLowerCase().includes(q))
    );
  }, [factories, searchQuery]);

  // Toggle single factory
  const handleToggle = (factoryId: string) => {
    if (isAllSelected) {
      // If currently ALL, selecting one means isolating that factory
      onChange([factoryId]);
      return;
    }

    if (selectedFactoryIds.includes(factoryId)) {
      const remaining = selectedFactoryIds.filter((id) => id !== factoryId);
      onChange(remaining);
    } else {
      const updated = [...selectedFactoryIds, factoryId];
      onChange(updated);
    }
  };

  // Quick Action Handlers
  const handleCheckAll = () => onChange(['ALL']);
  const handleClearCheck = () => onChange([]);
  const handleInvert = () => {
    if (isAllSelected) {
      onChange([]);
      return;
    }
    const currentSet = new Set(selectedFactoryIds);
    const inverted = factories.filter((f) => !currentSet.has(f.FactoryID)).map((f) => f.FactoryID);
    onChange(inverted);
  };

  const handleSelectPreset = (preset: Dim_Factory[]) => {
    if (preset.length === 0) return;
    onChange(preset.map((f) => f.FactoryID));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3 transition-all">
      {/* ── Top Bar: Title, Count Badge, Quick Actions & Expand Toggle ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Factory className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                {language === 'vi' ? 'Bộ Lọc Nhà Máy (Inline Slicer)' : 'Factory Slicer'}
              </span>
              <span
                className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                  isAllSelected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {isAllSelected ? `Toàn quốc (${factories.length})` : `Đã chọn: ${activeCount}/${factories.length}`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Chọn một hoặc nhiều cơ sở để phân tích số liệu tồn kho &amp; nhu cầu
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Check All */}
          <button
            type="button"
            onClick={handleCheckAll}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isAllSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Chọn tất cả 22 nhà máy"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tất Cả</span>
          </button>

          {/* Clear Check */}
          <button
            type="button"
            onClick={handleClearCheck}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Bỏ chọn toàn bộ nhà máy"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bỏ Chọn</span>
          </button>

          {/* Invert Selection */}
          <button
            type="button"
            onClick={handleInvert}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Đảo lựa chọn"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Đảo Chọn</span>
          </button>

          {/* Expand / Collapse Grid Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer ml-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Thu Gọn</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Mở Rộng ({factories.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Preset Category Filter Chips ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
          Khu Vực / Ngành:
        </span>

        {southFactories.length > 0 && (
          <button
            type="button"
            onClick={() => handleSelectPreset(southFactories)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              !isAllSelected && southFactories.every((f) => selectedFactoryIds.includes(f.FactoryID)) && activeCount === southFactories.length
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Miền Nam ({southFactories.length})
          </button>
        )}

        {northFactories.length > 0 && (
          <button
            type="button"
            onClick={() => handleSelectPreset(northFactories)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              !isAllSelected && northFactories.every((f) => selectedFactoryIds.includes(f.FactoryID)) && activeCount === northFactories.length
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-indigo-50/80 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            Miền Bắc ({northFactories.length})
          </button>
        )}

        {centralFactories.length > 0 && (
          <button
            type="button"
            onClick={() => handleSelectPreset(centralFactories)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              !isAllSelected && centralFactories.every((f) => selectedFactoryIds.includes(f.FactoryID)) && activeCount === centralFactories.length
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Miền Trung ({centralFactories.length})
          </button>
        )}

        {livestockFactories.length > 0 && (
          <button
            type="button"
            onClick={() => handleSelectPreset(livestockFactories)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Gia Súc ({livestockFactories.length})
          </button>
        )}

        {aquaFactories.length > 0 && (
          <button
            type="button"
            onClick={() => handleSelectPreset(aquaFactories)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Thủy Sản ({aquaFactories.length})
          </button>
        )}

        {/* Quick Search inside Slicer */}
        {isExpanded && (
          <div className="relative ml-auto min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã / tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-6 py-0.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Factory Chip Pills: Compact Horizontal Scroll vs Expanded Grid ── */}
      {isExpanded ? (
        /* Full Multi-Column Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {filteredFactories.map((f) => {
            const isSelected = isAllSelected || selectedFactoryIds.includes(f.FactoryID) || selectedFactoryIds.includes(f.InternalCode);

            return (
              <button
                key={f.FactoryID}
                type="button"
                onClick={() => handleToggle(f.FactoryID)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border text-left ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'border border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="font-mono text-[11px] shrink-0 font-extrabold">{f.InternalCode}</span>
                  <span className="truncate text-[11px] font-normal">{f.FactoryName_VN.replace('Nhà máy ', '')}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Compact 1-Row Horizontal Scroll View */
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          {factories.map((f) => {
            const isSelected = isAllSelected || selectedFactoryIds.includes(f.FactoryID) || selectedFactoryIds.includes(f.InternalCode);

            return (
              <button
                key={f.FactoryID}
                type="button"
                onClick={() => handleToggle(f.FactoryID)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded flex items-center justify-center text-[9px] shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'border border-slate-300 bg-white text-transparent'
                  }`}
                >
                  <Check className="w-2 h-2 stroke-[3]" />
                </div>
                <span className="font-mono text-[11px] font-extrabold">{f.InternalCode}</span>
                <span className="text-[11px] font-normal hidden sm:inline">{f.FactoryName_VN.replace('Nhà máy ', '')}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardFactorySlicer;
