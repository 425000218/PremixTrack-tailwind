import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Factory,
  ChevronDown,
  Search,
  Check,
  X,
  Layers,
  MapPin,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Dim_Factory, Language } from '../types';

export interface MultiFactorySelectProps {
  factories: Dim_Factory[];
  selectedFactoryIds: string[];
  onChange: (selectedIds: string[]) => void;
  language?: Language;
  className?: string;
  placeholder?: string;
}

export const MultiFactorySelect: React.FC<MultiFactorySelectProps> = ({
  factories,
  selectedFactoryIds = ['ALL'],
  onChange,
  language = 'vi',
  className = '',
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Is ALL selected?
  const isAllSelected = selectedFactoryIds.includes('ALL') || selectedFactoryIds.length === 0;

  // Active selected factories objects
  const activeSelected = useMemo(() => {
    if (isAllSelected) return factories;
    return factories.filter((f) => selectedFactoryIds.includes(f.FactoryID) || selectedFactoryIds.includes(f.InternalCode));
  }, [factories, selectedFactoryIds, isAllSelected]);

  // Regions & Divisions breakdown for quick presets
  const southFactories = useMemo(() => factories.filter((f) => f.RegionID === 'SOUTH' || f.RegionID === 'South'), [factories]);
  const northFactories = useMemo(() => factories.filter((f) => f.RegionID === 'NORTH' || f.RegionID === 'North'), [factories]);
  const centralFactories = useMemo(() => factories.filter((f) => f.RegionID === 'CENTRAL' || f.RegionID === 'Central'), [factories]);
  const livestockFactories = useMemo(() => factories.filter((f) => f.Division === 'Livestock'), [factories]);
  const aquaFactories = useMemo(() => factories.filter((f) => f.Division === 'Aqua'), [factories]);

  // Filtered list by search
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
  const handleToggleFactory = (factoryId: string) => {
    if (isAllSelected) {
      // If currently ALL, selecting one means we now select only that one
      onChange([factoryId]);
      return;
    }

    const isCurrentSelected = selectedFactoryIds.includes(factoryId);
    let updated: string[];

    if (isCurrentSelected) {
      updated = selectedFactoryIds.filter((id) => id !== factoryId);
      // If no factories left, revert to ALL
      if (updated.length === 0) {
        updated = ['ALL'];
      }
    } else {
      updated = [...selectedFactoryIds, factoryId];
      // If user selected all individual factories, simplify to ['ALL']
      if (updated.length >= factories.length) {
        updated = ['ALL'];
      }
    }

    onChange(updated);
  };

  // Quick Preset Handlers
  const handleSelectAll = () => {
    onChange(['ALL']);
  };

  const handleSelectPreset = (presetFactories: Dim_Factory[]) => {
    if (presetFactories.length === 0) return;
    const ids = presetFactories.map((f) => f.FactoryID);
    onChange(ids);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(['ALL']);
  };

  // Compute trigger button label
  const triggerLabel = useMemo(() => {
    if (isAllSelected) {
      return language === 'vi' ? `Toàn quốc (${factories.length} Nhà máy)` : `All ${factories.length} Factories`;
    }
    if (activeSelected.length === 1) {
      const f = activeSelected[0];
      return `${f.InternalCode} - ${f.FactoryName_VN.replace('Nhà máy ', '')}`;
    }
    if (activeSelected.length <= 2) {
      return activeSelected.map((f) => f.InternalCode).join(', ');
    }
    return `${activeSelected.slice(0, 2).map((f) => f.InternalCode).join(', ')} (+${activeSelected.length - 2})`;
  }, [isAllSelected, activeSelected, factories.length, language]);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* ── Compact Trigger Pill Button ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 select-none shadow-xs ${
          isAllSelected
            ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-100/80'
            : 'bg-blue-50/90 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-300'
        } ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500 bg-white' : ''}`}
        title="Lọc dữ liệu theo một hoặc nhiều nhà máy"
      >
        <Factory className={`w-3.5 h-3.5 shrink-0 ${isAllSelected ? 'text-slate-500' : 'text-blue-600'}`} />

        <div className="flex items-center gap-1.5 max-w-[170px] md:max-w-[210px] truncate">
          {!isAllSelected && (
            <span className="inline-flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0">
              {activeSelected.length}
            </span>
          )}
          <span className="truncate tracking-tight">{triggerLabel}</span>
        </div>

        {/* Clear filter button if subset selected */}
        {!isAllSelected && (
          <button
            onClick={handleClearSelection}
            className="p-0.5 rounded-md hover:bg-blue-200/80 text-blue-600 hover:text-blue-900 transition-colors ml-0.5"
            title="Khôi phục xem toàn quốc"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </div>

      {/* ── Rich Popover Dropdown Menu ── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in flex flex-col max-h-[480px]">
          {/* Popover Header & Search */}
          <div className="p-3 bg-slate-50/90 border-b border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Factory className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {language === 'vi' ? 'Chọn Phạm Vi Nhà Máy' : 'Select Factory Scope'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {isAllSelected ? (
                  <span className="text-emerald-600 font-semibold">Tất cả {factories.length} cơ sở</span>
                ) : (
                  <span className="text-blue-600 font-semibold">Đã chọn {activeSelected.length}/{factories.length}</span>
                )}
              </span>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm mã nhà máy, tên, miền...' : 'Search factory name, code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Preset Filter Chips */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isAllSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {language === 'vi' ? `Tất cả (${factories.length})` : `All (${factories.length})`}
              </button>

              {southFactories.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset(southFactories)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    !isAllSelected && southFactories.every((f) => selectedFactoryIds.includes(f.FactoryID)) && activeSelected.length === southFactories.length
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Miền Nam ({southFactories.length})
                </button>
              )}

              {northFactories.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset(northFactories)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    !isAllSelected && northFactories.every((f) => selectedFactoryIds.includes(f.FactoryID)) && activeSelected.length === northFactories.length
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Miền Bắc ({northFactories.length})
                </button>
              )}

              {centralFactories.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset(centralFactories)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    !isAllSelected && centralFactories.every((f) => selectedFactoryIds.includes(f.FactoryID)) && activeSelected.length === centralFactories.length
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Miền Trung ({centralFactories.length})
                </button>
              )}

              {livestockFactories.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset(livestockFactories)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Gia Súc ({livestockFactories.length})
                </button>
              )}

              {aquaFactories.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset(aquaFactories)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Thủy Sản ({aquaFactories.length})
                </button>
              )}
            </div>
          </div>

          {/* Factories Checkbox Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
            {filteredFactories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Không tìm thấy nhà máy nào khớp với từ khóa "{searchQuery}"
              </div>
            ) : (
              filteredFactories.map((f) => {
                const isSelected = isAllSelected || selectedFactoryIds.includes(f.FactoryID) || selectedFactoryIds.includes(f.InternalCode);

                return (
                  <div
                    key={f.FactoryID}
                    onClick={() => handleToggleFactory(f.FactoryID)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-100/70 text-slate-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox box */}
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Factory Code & Name */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 shrink-0">
                          {f.InternalCode}
                        </span>
                        <span className="truncate text-xs">
                          {f.FactoryName_VN.replace('Nhà máy ', '')}
                        </span>
                      </div>
                    </div>

                    {/* Meta info tags */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          f.RegionID === 'SOUTH' || f.RegionID === 'South'
                            ? 'bg-amber-100 text-amber-700'
                            : f.RegionID === 'NORTH' || f.RegionID === 'North'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {f.RegionID || 'VN'}
                      </span>
                      {f.Division && (
                        <span className="text-[9px] font-medium px-1 py-0.2 rounded-md bg-slate-100 text-slate-500 hidden sm:inline-block">
                          {f.Division}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Apply / Reset Actions */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xem Toàn Quốc</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {language === 'vi'
                  ? `Áp Dụng (${isAllSelected ? 'Toàn bộ' : activeSelected.length})`
                  : `Apply (${isAllSelected ? 'All' : activeSelected.length})`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiFactorySelect;
