import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Factory,
  Search,
  Check,
  X,
  SlidersHorizontal,
  RotateCcw,
  CheckCheck,
  Square,
  Building2,
  MapPin,
  Layers,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';
import { Dim_Factory, Language } from '../types';

export interface MultiFactorySelectProps {
  factories: Dim_Factory[];
  selectedFactoryIds: string[];
  onChange: (selectedIds: string[]) => void;
  language?: Language;
  className?: string;
}

export const MultiFactorySelect: React.FC<MultiFactorySelectProps> = ({
  factories,
  selectedFactoryIds = ['ALL'],
  onChange,
  language = 'vi',
  className = '',
}) => {
  // Drawer visibility state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Temporary selection state inside drawer (committed on "Apply")
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedFactoryIds);

  // Sync temp state when drawer opens or external prop changes
  useEffect(() => {
    setTempSelectedIds(selectedFactoryIds);
  }, [selectedFactoryIds, isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent background body scroll & signal modal-open when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // --------------------------------------------------------------------------
  // Helpers & Computed Values
  // --------------------------------------------------------------------------
  const isAllSelected = selectedFactoryIds.includes('ALL');

  const activeSelected = useMemo(() => {
    if (isAllSelected) return factories;
    return factories.filter(
      (f) => selectedFactoryIds.includes(f.FactoryID) || selectedFactoryIds.includes(f.InternalCode)
    );
  }, [factories, selectedFactoryIds, isAllSelected]);

  // Is temp all selected in drawer?
  const isTempAllSelected = tempSelectedIds.includes('ALL');
  const tempSelectedCount = isTempAllSelected ? factories.length : tempSelectedIds.length;

  // Regional breakdown
  const southFactories = useMemo(() => factories.filter((f) => f.RegionID?.toUpperCase() === 'SOUTH'), [factories]);
  const northFactories = useMemo(() => factories.filter((f) => f.RegionID?.toUpperCase() === 'NORTH'), [factories]);
  const centralFactories = useMemo(() => factories.filter((f) => f.RegionID?.toUpperCase() === 'CENTRAL'), [factories]);
  const livestockFactories = useMemo(() => factories.filter((f) => f.Division === 'Livestock'), [factories]);
  const aquaFactories = useMemo(() => factories.filter((f) => f.Division === 'Aqua'), [factories]);

  // Filtered factories in search
  const filteredFactories = useMemo(() => {
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase().trim();
    return factories.filter(
      (f) =>
        f.InternalCode.toLowerCase().includes(q) ||
        f.FactoryName_VN.toLowerCase().includes(q) ||
        (f.RegionID && f.RegionID.toLowerCase().includes(q)) ||
        (f.Division && f.Division.toLowerCase().includes(q)) ||
        (f.SiteCode && f.SiteCode.toLowerCase().includes(q))
    );
  }, [factories, searchQuery]);

  // Grouped by Region
  const groupedFactories = useMemo(() => {
    const groups: { region: string; title: string; badgeColor: string; items: Dim_Factory[] }[] = [];
    
    const south = filteredFactories.filter((f) => f.RegionID?.toUpperCase() === 'SOUTH');
    if (south.length > 0) {
      groups.push({ region: 'SOUTH', title: 'Cụm Nhà Máy Miền Nam', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200', items: south });
    }

    const north = filteredFactories.filter((f) => f.RegionID?.toUpperCase() === 'NORTH');
    if (north.length > 0) {
      groups.push({ region: 'NORTH', title: 'Cụm Nhà Máy Miền Bắc', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200', items: north });
    }

    const central = filteredFactories.filter((f) => f.RegionID?.toUpperCase() === 'CENTRAL');
    if (central.length > 0) {
      groups.push({ region: 'CENTRAL', title: 'Cụm Nhà Máy Miền Trung', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', items: central });
    }

    const other = filteredFactories.filter((f) => !['SOUTH', 'NORTH', 'CENTRAL'].includes(f.RegionID?.toUpperCase() || ''));
    if (other.length > 0) {
      groups.push({ region: 'OTHER', title: 'Cơ Sở Khác / Site D365', badgeColor: 'bg-slate-100 text-slate-800 border-slate-200', items: other });
    }

    return groups;
  }, [filteredFactories]);

  // --------------------------------------------------------------------------
  // Selection Actions (Check All, Clear Check, Invert, Group Check)
  // --------------------------------------------------------------------------
  const handleCheckAll = () => {
    setTempSelectedIds(['ALL']);
  };

  const handleClearCheck = () => {
    setTempSelectedIds([]);
  };

  const handleInvertCheck = () => {
    if (isTempAllSelected) {
      setTempSelectedIds([]);
      return;
    }
    const currentSet = new Set(tempSelectedIds);
    const inverted = factories
      .filter((f) => !currentSet.has(f.FactoryID))
      .map((f) => f.FactoryID);
    setTempSelectedIds(inverted.length === 0 ? ['ALL'] : inverted);
  };

  const handleToggleSingle = (factoryId: string) => {
    if (isTempAllSelected) {
      // If currently all, unchecking one means selecting all EXCEPT that one
      const allExceptOne = factories.filter((f) => f.FactoryID !== factoryId).map((f) => f.FactoryID);
      setTempSelectedIds(allExceptOne);
      return;
    }

    if (tempSelectedIds.includes(factoryId)) {
      const remaining = tempSelectedIds.filter((id) => id !== factoryId);
      setTempSelectedIds(remaining);
    } else {
      const updated = [...tempSelectedIds, factoryId];
      setTempSelectedIds(updated);
    }
  };

  const handleToggleGroup = (groupItems: Dim_Factory[]) => {
    const groupIds = groupItems.map((f) => f.FactoryID);
    const isGroupFullySelected = groupIds.every((id) => isTempAllSelected || tempSelectedIds.includes(id));

    if (isTempAllSelected) {
      // Unselect this group from all
      const remaining = factories.filter((f) => !groupIds.includes(f.FactoryID)).map((f) => f.FactoryID);
      setTempSelectedIds(remaining);
      return;
    }

    if (isGroupFullySelected) {
      // Unselect group
      const remaining = tempSelectedIds.filter((id) => !groupIds.includes(id));
      setTempSelectedIds(remaining);
    } else {
      // Select entire group
      const combined = Array.from(new Set([...tempSelectedIds, ...groupIds]));
      setTempSelectedIds(combined);
    }
  };

  const handleApply = () => {
    onChange(tempSelectedIds);
    setIsOpen(false);
  };

  const handleResetToAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(['ALL']);
    setTempSelectedIds(['ALL']);
  };

  // Header Trigger Button label
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
    <div className={`relative inline-block ${className}`}>
      {/* ── 1. Compact Header Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 select-none shadow-xs ${
          isAllSelected
            ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-100/90'
            : 'bg-blue-50/90 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-300 ring-1 ring-blue-500/20'
        }`}
        title="Mở ngăn kéo trượt bộ lọc nhà máy (Floating Filter Sheet)"
      >
        <Factory className={`w-3.5 h-3.5 shrink-0 ${isAllSelected ? 'text-slate-500' : 'text-blue-600'}`} />

        <div className="flex items-center gap-1.5 max-w-[160px] md:max-w-[200px] truncate">
          {!isAllSelected && (
            <span className="inline-flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0">
              {activeSelected.length}
            </span>
          )}
          <span className="truncate tracking-tight">{triggerLabel}</span>
        </div>

        {!isAllSelected && (
          <span
            onClick={handleResetToAll}
            className="p-0.5 rounded-md hover:bg-blue-200 text-blue-600 hover:text-blue-900 transition-colors"
            title="Khôi phục toàn quốc"
          >
            <X className="w-3 h-3" />
          </span>
        )}

        <div className="flex items-center gap-1 pl-1 border-l border-slate-200 text-slate-400 group-hover:text-blue-600">
          <SlidersHorizontal className="w-3 h-3" />
        </div>
      </button>

      {/* ── 2. Floating Filter Sheet (Slide-over Drawer from Right) via Portal ── */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden animate-fade-in">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
          />

          {/* Drawer Container Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
              {/* ── Drawer Header ── */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                      <span>{language === 'vi' ? 'Bộ Lọc Phạm Vi Nhà Máy' : 'Factory Scope Filter'}</span>
                      <span className="bg-blue-500/30 text-blue-300 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
                        {factories.length} Cơ sở
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isTempAllSelected ? (
                        <span className="text-emerald-400 font-semibold">Đang chọn toàn bộ {factories.length} nhà máy</span>
                      ) : (
                        <span className="text-blue-400 font-semibold">Đang chọn {tempSelectedCount} / {factories.length} nhà máy</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Đóng bảng lọc (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Action Toolbar: Check All, Clear Check & Invert ── */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: CHECK ALL */}
                  <button
                    type="button"
                    onClick={handleCheckAll}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isTempAllSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Chọn Tất Cả</span>
                  </button>

                  {/* Option 2: CLEAR CHECK */}
                  <button
                    type="button"
                    onClick={handleClearCheck}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      tempSelectedIds.length === 0
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Bỏ Chọn Hết</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã nhà máy (DBD), tên, miền, ngành..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
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

                {/* Quick Presets Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5 mr-1 flex items-center">
                    Lọc Nhanh:
                  </span>
                  {southFactories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempSelectedIds(southFactories.map((f) => f.FactoryID))}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Miền Nam ({southFactories.length})
                    </button>
                  )}
                  {northFactories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempSelectedIds(northFactories.map((f) => f.FactoryID))}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      Miền Bắc ({northFactories.length})
                    </button>
                  )}
                  {centralFactories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempSelectedIds(centralFactories.map((f) => f.FactoryID))}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Miền Trung ({centralFactories.length})
                    </button>
                  )}
                  {livestockFactories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempSelectedIds(livestockFactories.map((f) => f.FactoryID))}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Gia Súc ({livestockFactories.length})
                    </button>
                  )}
                  {aquaFactories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempSelectedIds(aquaFactories.map((f) => f.FactoryID))}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Thủy Sản ({aquaFactories.length})
                    </button>
                  )}
                </div>
              </div>

              {/* ── Scrollable Grouped Factory Items ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupedFactories.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Không tìm thấy nhà máy nào khớp với từ khóa "{searchQuery}"</p>
                  </div>
                ) : (
                  groupedFactories.map((group) => {
                    const groupIds = group.items.map((f) => f.FactoryID);
                    const isGroupFullyChecked = groupIds.every(
                      (id) => isTempAllSelected || tempSelectedIds.includes(id)
                    );
                    const isGroupPartiallyChecked =
                      !isGroupFullyChecked &&
                      groupIds.some((id) => !isTempAllSelected && tempSelectedIds.includes(id));

                    return (
                      <div key={group.region} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                        {/* Group Header */}
                        <div className="px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${group.badgeColor}`}>
                              {group.region}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{group.title}</span>
                            <span className="text-[11px] text-slate-500 font-semibold">({group.items.length})</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleGroup(group.items)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          >
                            {isGroupFullyChecked ? 'Bỏ chọn cụm' : 'Chọn cả cụm'}
                          </button>
                        </div>

                        {/* Group Items */}
                        <div className="p-2 space-y-1">
                          {group.items.map((f) => {
                            const isChecked = isTempAllSelected || tempSelectedIds.includes(f.FactoryID);

                            return (
                              <div
                                key={f.FactoryID}
                                onClick={() => handleToggleSingle(f.FactoryID)}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-blue-50/90 border border-blue-200 text-slate-900 font-semibold shadow-2xs'
                                    : 'bg-white hover:bg-slate-100/80 border border-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Custom Checkbox */}
                                  <div
                                    className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                      isChecked
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>

                                  {/* Code & Name */}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-200/90 text-slate-800">
                                        {f.InternalCode}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-900 truncate">
                                        {f.FactoryName_VN.replace('Nhà máy ', '')}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                      Site: <span className="font-mono">{f.SiteCode || f.InternalCode}</span> • Kho: {f.WarehouseCode}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  {f.Division && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        f.Division === 'Aqua'
                                          ? 'bg-cyan-100 text-cyan-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {f.Division}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Sticky Drawer Footer ── */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleResetToAll}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt Lại Toàn Quốc</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      Áp Dụng ({isTempAllSelected ? 'Toàn Bộ' : `${tempSelectedCount} Nhà Máy`})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MultiFactorySelect;
