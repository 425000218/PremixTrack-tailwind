import React, { useState, useRef, useEffect } from 'react';
import {
  Factory,
  UploadCloud,
  AlertTriangle,
  Menu,
  CheckCircle2,
  ChevronDown,
  User,
  Shield,
  LogOut,
  Sparkles,
  LogIn,
  UserPlus,
  Lock,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Dim_Factory, Language, AppUser } from '../types';
import { mockUsers } from '../data/mockData';

interface HeaderProps {
  factories: Dim_Factory[];
  selectedFactoryId: string;
  setSelectedFactoryId: (id: string) => void;
  criticalAlertsCount: number;
  onOpenImportModal: () => void;
  onNavigateTab: (tab: string) => void;
  language: Language;
  onToggleMobileSidebar: () => void;
  isDesktopSidebarCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
  currentUser: AppUser | null;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onOpenProfileModal: () => void;
  onOpenUserManagement?: () => void;
  onLogout: () => void;
  onQuickSwitchUser: (user: AppUser) => void;
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
  isDesktopSidebarCollapsed,
  onToggleDesktopSidebar,
  currentUser,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenUserManagement,
  onLogout,
  onQuickSwitchUser,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitchRoleOpen, setIsSwitchRoleOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsSwitchRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canImport = currentUser?.permissions?.canImportExcel ?? false;

  const handleImportClick = () => {
    if (!currentUser) {
      onOpenAuthModal('login');
      return;
    }
    if (!canImport) {
      alert(`Tài khoản "${currentUser.roleNameVN}" không có quyền nạp dữ liệu Excel. Vui lòng liên hệ Quản trị viên (Admin) hoặc Trưởng phòng Chuỗi Cung Ứng (SCM).`);
      return;
    }
    onOpenImportModal();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 z-30 shadow-xs relative">
      {/* Left side: Sidebar Toggle (Mobile & Desktop) + Title + Status */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
          title="Mở menu (Mobile)"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse / Expand Button in Header */}
        {onToggleDesktopSidebar && (
          <button
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title={isDesktopSidebarCollapsed ? 'Mở rộng Sidebar (Expand)' : 'Thu gọn Sidebar (Collapse)'}
          >
            {isDesktopSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-blue-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}

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

      {/* Right side: Global Factory Select + Import CTA + User Profile / Login */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Global Factory Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 transition-colors">
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
            className="hidden md:flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Xem chi tiết các điểm thiếu hụt nguy cấp"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>{criticalAlertsCount} Thiếu Hụt</span>
          </button>
        )}

        {/* Import Excel CTA */}
        <button
          onClick={handleImportClick}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
            canImport
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
          }`}
          title={canImport ? 'Nạp file Excel D365 FO' : 'Tài khoản không có quyền nạp Excel'}
        >
          {canImport ? <UploadCloud className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden sm:inline">
            {language === 'vi' ? 'Nạp Excel D365' : 'Import Excel'}
          </span>
          <span className="sm:hidden">Import</span>
        </button>

        {/* ================= USER AUTH / PROFILE AREA (Top-Right) ================= */}
        {currentUser ? (
          <div className="relative" ref={dropdownRef}>
            {/* Logged in User Pill Button */}
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsSwitchRoleOpen(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl hover:bg-slate-100 border border-slate-200 bg-white transition-all cursor-pointer shadow-xs group"
            >
              <div
                className={`w-8 h-8 rounded-xl ${currentUser.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-xs ring-2 ring-white`}
              >
                {currentUser.fullName.charAt(0)}
              </div>

              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate max-w-[130px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold leading-tight">
                  {currentUser.role === 'System_Admin'
                    ? 'Admin'
                    : currentUser.role === 'Supply_Chain_Manager'
                    ? 'SCM Manager'
                    : currentUser.role === 'Factory_Planner'
                    ? 'Planner'
                    : currentUser.role === 'Logistics_Officer'
                    ? 'Logistics'
                    : 'Viewer'}
                </div>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-xs">
                {/* Header Summary */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
                    >
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">{currentUser.fullName}</div>
                      <div className="text-[11px] text-slate-500 truncate font-mono">{currentUser.email}</div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {currentUser.roleNameVN}
                    </span>
                    <span className="text-slate-500 font-medium truncate max-w-[120px]">
                      {currentUser.assignedFactoryName}
                    </span>
                  </div>
                </div>

                {/* Actions List */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProfileModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-semibold cursor-pointer text-left"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Hồ Sơ & Phân Quyền</span>
                  </button>

                  {(currentUser.role === 'System_Admin' || currentUser.username === 'admin') && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenUserManagement?.();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 transition-colors font-bold cursor-pointer text-left"
                    >
                      <Shield className="w-4 h-4 text-rose-600" />
                      <span>Quản Trị Users & Mật Khẩu (Admin)</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsSwitchRoleOpen(!isSwitchRoleOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-semibold cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Đổi Tài Khoản Demo (RBAC)</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSwitchRoleOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Role Switcher Submenu */}
                  {isSwitchRoleOpen && (
                    <div className="p-1.5 bg-slate-50 rounded-xl space-y-1 my-1 border border-slate-100">
                      {mockUsers.map((u) => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onQuickSwitchUser(u);
                              setIsDropdownOpen(false);
                              setIsSwitchRoleOpen(false);
                            }}
                            className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-[11px] ${
                              isCurrent ? 'bg-blue-100/70 text-blue-900 font-bold' : 'hover:bg-white text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${u.avatarBg}`}></span>
                              <span>{u.fullName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">({u.role})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer / Logout */}
                <div className="pt-1 border-t border-slate-100 px-1.5">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Logged out: Login & Register CTA Buttons */
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Đăng Nhập</span>
            </button>

            <button
              onClick={() => onOpenAuthModal('register')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng Ký</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
