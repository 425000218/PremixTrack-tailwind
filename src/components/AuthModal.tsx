import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Shield,
  CheckCircle2,
  Lock,
  User,
  Mail,
  Phone,
  Building,
  Factory,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppUser, UserRole, Dim_Factory } from '../types';
import { mockUsers, getRolePermissions } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  factories: Dim_Factory[];
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  factories,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('Phòng Kế Hoạch Chuỗi Cung Ứng');
  const [regRole, setRegRole] = useState<UserRole>('Factory_Planner');
  const [regFactoryId, setRegFactoryId] = useState<string>('FAC-DBD');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle standard login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanInput = loginUsername.trim().toLowerCase();
    if (!cleanInput) {
      setLoginError('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }

    // Match with mock users
    const matched = mockUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanInput ||
        u.email.toLowerCase() === cleanInput
    );

    if (matched) {
      onLoginSuccess(matched);
      onClose();
    } else {
      // Fallback create custom user on-the-fly if not found
      const customUser: AppUser = {
        id: `USR-${Date.now().toString().substr(6, 6)}`,
        username: cleanInput,
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@premixtrack.vn`,
        fullName: loginUsername.trim(),
        role: 'Supply_Chain_Manager',
        roleNameVN: 'Trưởng Phòng Chuỗi Cung Ứng (S&OP)',
        department: 'Phòng Điều Phối Vận Hành',
        phone: '0901 234 567',
        avatarBg: 'bg-blue-600',
        assignedFactoryId: 'ALL',
        assignedFactoryName: 'Toàn quốc (8 Nhà máy)',
        permissions: getRolePermissions('Supply_Chain_Manager', 'ALL'),
        lastLogin: 'Vừa xong',
      };
      onLoginSuccess(customUser);
      onClose();
    }
  };

  // Handle quick 1-click demo login
  const handleQuickLogin = (demoUser: AppUser) => {
    onLoginSuccess(demoUser);
    onClose();
  };

  // Handle registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim()) {
      setRegError('Vui lòng điền đầy đủ họ tên, tên đăng nhập và email.');
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const selectedFac = factories.find((f) => f.FactoryID === regFactoryId);
    const assignedFacName =
      regFactoryId === 'ALL'
        ? 'Toàn quốc (8 Nhà máy)'
        : selectedFac
        ? `${selectedFac.FactoryName_VN} (${selectedFac.InternalCode})`
        : 'Toàn quốc';

    const roleNameMap: Record<UserRole, string> = {
      System_Admin: 'Quản Trị Viên Hệ Thống',
      Supply_Chain_Manager: 'Trưởng Phòng Chuỗi Cung Ứng (S&OP)',
      Factory_Planner: 'Điều Phối Viên Nhà Máy',
      Logistics_Officer: 'Thủ Kho & Tiếp Nhận Inbound',
      Viewer: 'Kiểm Toán & Xem Báo Cáo',
    };

    const avatarColorMap: Record<UserRole, string> = {
      System_Admin: 'bg-rose-600',
      Supply_Chain_Manager: 'bg-blue-600',
      Factory_Planner: 'bg-amber-600',
      Logistics_Officer: 'bg-emerald-600',
      Viewer: 'bg-slate-600',
    };

    const newUser: AppUser = {
      id: `USR-${Date.now().toString().substr(6, 6)}`,
      username: regUsername.trim().toLowerCase(),
      email: regEmail.trim().toLowerCase(),
      fullName: regFullName.trim(),
      role: regRole,
      roleNameVN: roleNameMap[regRole],
      department: regDepartment.trim(),
      phone: regPhone.trim() || '0909 000 111',
      avatarBg: avatarColorMap[regRole],
      assignedFactoryId: regFactoryId,
      assignedFactoryName: assignedFacName,
      permissions: getRolePermissions(regRole, regFactoryId),
      lastLogin: 'Vừa đăng ký',
    };

    onLoginSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-black shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {mode === 'login' ? 'Đăng Nhập PremixTrack' : 'Đăng Ký Tài Khoản Mới'}
              </h2>
              <p className="text-xs text-slate-300">
                Hệ thống điều phối tồn kho &amp; nguyên liệu premix D365 FO
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Switch */}
        <div className="px-6 pt-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>

          <button
            onClick={() => {
              setMode('register');
              setRegError(null);
            }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              mode === 'register'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng Ký Tài Khoản</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-800 text-xs">
          {/* ================= MODE: LOGIN ================= */}
          {mode === 'login' && (
            <div className="space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đăng nhập hoặc Email công vụ:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="admin, nam.le, ha.tran..."
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Mật khẩu:</label>
                    <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                      Quên mật khẩu?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-xs mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Vào Hệ Thống</span>
                </button>
              </form>

              {/* 1-Click Demo Accounts Section */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Đăng Nhập 1-Click Thử Nghiệm Phân Quyền (Demo Roles):</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg ${user.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                        >
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                            <span>{user.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">(@{user.username})</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {user.roleNameVN} • {user.assignedFactoryName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Chọn</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE: REGISTER ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  <span>{regError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên (*):</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập (*):</label>
                  <input
                    type="text"
                    required
                    placeholder="user_d365"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email công vụ (*):</label>
                  <input
                    type="email"
                    required
                    placeholder="user@premixtrack.vn"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò &amp; Phân quyền (*):</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-semibold"
                  >
                    <option value="System_Admin">Quản Trị Viên Hệ Thống (Admin)</option>
                    <option value="Supply_Chain_Manager">Trưởng Phòng Chuỗi Cung Ứng (S&amp;OP)</option>
                    <option value="Factory_Planner">Điều Phối Viên Nhà Máy (Planner)</option>
                    <option value="Logistics_Officer">Thủ Kho &amp; Inbound Logistics</option>
                    <option value="Viewer">Kiểm Toán &amp; Chỉ Xem (Viewer)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhà máy phụ trách (*):</label>
                  <select
                    value={regFactoryId}
                    onChange={(e) => setRegFactoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-semibold"
                  >
                    <option value="ALL">Toàn quốc (8 Nhà máy)</option>
                    {factories.map((f) => (
                      <option key={f.FactoryID} value={f.FactoryID}>
                        {f.InternalCode} - {f.FactoryName_VN.replace('Nhà máy ', '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu:</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Xác nhận mật khẩu:</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-xs mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Hoàn Tất Đăng Ký &amp; Đăng Nhập Ngay</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
