import React from 'react';
import {
  TrendingUp,
  Layers,
  ArrowLeftRight,
  Package,
  Truck,
  Database,
  Sparkles,
  RefreshCw,
  Globe,
  Radio,
  X
} from 'lucide-react';
import { Language } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  criticalAlertsCount: number;
  transferSuggestionsCount: number;
  onResetData: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  criticalAlertsCount,
  transferSuggestionsCount,
  onResetData,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label_VN: 'Tổng Quan Báo Cáo',
      label_EN: 'Dashboard Overview',
      icon: TrendingUp,
      badge: criticalAlertsCount > 0 ? criticalAlertsCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'matrix',
      label_VN: 'Tồn Kho & Chỉ Số DOI',
      label_EN: 'Stock & DOI Matrix',
      icon: Layers,
    },
    {
      id: 'transfers',
      label_VN: 'Điều Chuyển Nội Bộ',
      label_EN: 'Inter-Factory Transfer',
      icon: ArrowLeftRight,
      badge: transferSuggestionsCount > 0 ? transferSuggestionsCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'formula',
      label_VN: 'Công Thức & Mô Phỏng MRP',
      label_EN: 'Premix Formula & MRP',
      icon: Package,
    },
    {
      id: 'logistics',
      label_VN: 'Inbound PO & Logistics',
      label_EN: 'Inbound Logistics',
      icon: Truck,
    },
    {
      id: 'masterdata',
      label_VN: 'Master Data & Mappings',
      label_EN: 'Master Data & Mappings',
      icon: Database,
    },
    {
      id: 'ai-advisor',
      label_VN: 'AI Advisor Chuỗi Cung Ứng',
      label_EN: 'AI Supply Advisor',
      icon: Sparkles,
      highlight: true,
    },
  ];

  const handleSelectTab = (id: string) => {
    setCurrentTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">PremixTrack</h1>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider">D365 FO COORD</span>
            </div>
          </div>

          {/* Close for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu List */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1 mb-1">
            {language === 'vi' ? 'Hệ Thống Phân Hệ' : 'Core Modules'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer font-medium text-sm transition-colors text-left group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{language === 'vi' ? item.label_VN : item.label_EN}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold leading-none ${
                      item.badgeColor || 'bg-blue-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Sync Info & Quick Settings */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Last Sync: D365 FO</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
              Today, 09:42 AM
            </p>
            <p className="text-[10px] text-slate-500 mt-1">8 Nhà máy trực tuyến</p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-400">
            <button
              onClick={onResetData}
              title="Khôi phục dữ liệu mẫu gốc"
              className="flex items-center gap-1.5 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Dữ Liệu</span>
            </button>

            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md border border-slate-700 transition-colors font-medium cursor-pointer"
            >
              <Globe className="w-3 h-3 text-blue-400" />
              <span>{language.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
