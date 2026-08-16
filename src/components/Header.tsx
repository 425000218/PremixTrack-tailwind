import React from 'react';
import {
  Factory,
  UploadCloud,
  AlertTriangle,
  Menu,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Dim_Factory, Language } from '../types';

interface HeaderProps {
  factories: Dim_Factory[];
  selectedFactoryId: string;
  setSelectedFactoryId: (id: string) => void;
  criticalAlertsCount: number;
  onOpenImportModal: () => void;
  onNavigateTab: (tab: string) => void;
  language: Language;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  factories,
  selectedFactoryId,
  setSelectedFactoryId,
  criticalAlertsCount,
  onOpenImportModal,
  onNavigateTab,
  language,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-30 shadow-xs">
      {/* Left side: Mobile Menu + Title + Status */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
            {language === 'vi' ? 'Trung Tâm Điều Phối Cung Ứng' : 'Supply Coordination Hub'}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
            SYSTEM ACTIVE
          </span>
        </div>
      </div>

      {/* Right side: Global Status + Factory Select + Import CTA */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Global Factory Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 transition-colors">
          <Factory className="w-4 h-4 text-blue-600 shrink-0" />
          <select
            value={selectedFactoryId}
            onChange={(e) => setSelectedFactoryId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL">
              {language === 'vi' ? '🏢 Toàn quốc (8 Nhà máy)' : '🏢 All 8 Factories'}
            </option>
            {factories.map((f) => (
              <option key={f.FactoryID} value={f.FactoryID}>
                {f.InternalCode} - {f.FactoryName_VN.replace('Nhà máy ', '')}
              </option>
            ))}
          </select>
        </div>

        {/* Critical Alerts Badge */}
        {criticalAlertsCount > 0 && (
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="hidden sm:flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Xem chi tiết các điểm thiếu hụt nguy cấp"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>{criticalAlertsCount} Thiếu Hụt</span>
          </button>
        )}

        {/* Import Excel CTA */}
        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">
            {language === 'vi' ? 'Nạp Excel D365' : 'Import Excel'}
          </span>
          <span className="sm:hidden">Import</span>
        </button>

        {/* User / Profile Avatar */}
        <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm border border-slate-200 shrink-0">
          SC
        </div>
      </div>
    </header>
  );
};
