import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  CheckCircle2,
  XCircle,
  Building,
  Factory,
  Mail,
  Phone,
  Calendar,
  Lock,
  KeyRound,
  Edit3,
  Check,
  Sparkles,
  LogOut
} from 'lucide-react';
import { AppUser, Dim_Factory } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  onUpdateUser: (updated: AppUser) => void;
  onLogout: () => void;
  factories: Dim_Factory[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
  factories,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'permissions' | 'edit' | 'security'>('info');

  // Edit state
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [department, setDepartment] = useState(user.department);
  const [editSuccess, setEditSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Đồng bộ lại form khi user hoặc modal mở lên
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDepartment(user.department || '');
      setEditSuccess(false);
      setPasswordError(null);
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppUser = {
      ...user,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
    };
    
    // Sync to MS SQL Server
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FullName: updated.fullName,
          Email: updated.email,
          Phone: updated.phone,
          Department: updated.department,
          Role: user.role.toLowerCase(),
          FactoryAccess: JSON.stringify(user.assignedFactoryId === 'ALL' ? ['ALL'] : [user.assignedFactoryId]),
          IsActive: 1
        })
      });
    } catch (err) {
      console.warn('Could not sync profile to SQL Server:', err);
    }

    onUpdateUser(updated);
    setEditSuccess(true);
    setTimeout(() => setEditSuccess(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!newPassword || newPassword.length < 4) {
      setPasswordError('Mật khẩu mới phải có ít nhất 4 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    // Sync Password to MS SQL Server
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Password: newPassword,
          FullName: user.fullName,
          Email: user.email,
          Phone: user.phone,
          Department: user.department,
          Role: user.role.toLowerCase(),
          FactoryAccess: JSON.stringify(user.assignedFactoryId === 'ALL' ? ['ALL'] : [user.assignedFactoryId]),
          IsActive: 1
        })
      });
      const data = await res.json();
      if (!data.success) {
        setPasswordError(data.error || 'Không thể lưu mật khẩu vào SQL Server.');
        return;
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Lỗi kết nối máy chủ SQL.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  const permissionItems = [
    {
      title: 'Nạp & Ánh Xạ File Excel D365 FO (Import SOH, Forecast, PO)',
      desc: 'Quyền sử dụng Dynamic Header Mapping nạp dữ liệu từ D365 Finance & Operations vào hệ thống',
      granted: user.permissions.canImportExcel,
    },
    {
      title: 'Lập & Đề Xuất Lệnh Điều Chuyển Liên Nhà Máy (Create Transfer)',
      desc: 'Quyền tạo phiếu vận chuyển điều phối nguyên liệu giữa các nhà máy khi xảy ra thiếu hụt',
      granted: user.permissions.canCreateTransfer,
    },
    {
      title: 'Phê Duyệt Lệnh Điều Chuyển & Cân Bằng Tồn Kho (Approve Transfer)',
      desc: 'Quyền phê duyệt các lệnh điều phối vận tải cấp doanh nghiệp toàn quốc',
      granted: user.permissions.canApproveTransfer,
    },
    {
      title: 'Ghi Nhận Tiếp Nhận & Nhập Kho Hàng Inbound (Receive Shipment)',
      desc: 'Quyền xác nhận xe tải giao hàng tại trạm cân, tạo số lô Batch và cập nhật SOH',
      granted: user.permissions.canReceiveShipment,
    },
    {
      title: 'Quản Trị Danh Mục Gốc & Từ Điển Mapping (Master Data Config)',
      desc: 'Quyền cấu hình mã nguyên liệu, quy tắc chuyển đổi Stop_Usage và từ điển cột Excel',
      granted: user.permissions.canEditMasterData,
    },
    {
      title: 'Trợ Lý AI Advisor Chuỗi Cung Ứng (Gemini 3.7 Flash)',
      desc: 'Quyền tham vấn chuyên sâu và phân tích ma trận dữ liệu qua mô hình AI',
      granted: user.permissions.canUseAiAdvisor,
    },
    {
      title: 'Xuất Báo Cáo & File Ma Trận (Export Excel / Printable Slips)',
      desc: 'Quyền tải xuống báo cáo tổng hợp và in phiếu điều chuyển vận tải',
      granted: user.permissions.canExportReports,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner with User Profile Summary */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10">
            <div
              className={`w-12 h-12 rounded-2xl ${user.avatarBg} text-white flex items-center justify-center font-black text-lg border-2 border-white/20 shadow-md`}
            >
              {user.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">{user.fullName}</h2>
                <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded text-blue-200 font-semibold">
                  @{user.username}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span className="font-semibold text-amber-300">{user.roleNameVN}</span>
                <span>•</span>
                <span>{user.assignedFactoryName}</span>
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

        {/* Tab Selector */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">
          {[
            { id: 'info' as const, label: 'Thông Tin Tài Khoản', icon: User },
            { id: 'permissions' as const, label: 'Bảng Phân Quyền (RBAC)', icon: Shield },
            { id: 'edit' as const, label: 'Chỉnh Sửa Hồ Sơ', icon: Edit3 },
            { id: 'security' as const, label: 'Bảo Mật & Mật Khẩu', icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3.5 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Họ và Tên
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{user.fullName}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Tên Đăng Nhập
                  </span>
                  <div className="font-mono font-bold text-blue-600 text-sm">@{user.username}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Email Công Vụ
                  </span>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Số Điện Thoại Liên Hệ
                  </span>
                  <div className="font-mono text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Phòng Ban &amp; Đơn Vị
                  </span>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.department}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Phạm Vi Nhà Máy Quản Lý
                  </span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-blue-600" />
                    <span>{user.assignedFactoryName}</span>
                  </div>
                </div>
              </div>

              {/* Status footer banner */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold">Trạng thái tài khoản: Đang hoạt động (Active)</span>
                </div>
                <span className="text-[11px] text-blue-700 font-mono">Đăng nhập: {user.lastLogin || 'Hôm nay'}</span>
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">Vai trò hiện tại: {user.roleNameVN}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mã phân quyền: <strong className="font-mono text-blue-700">{user.role}</strong>
                  </p>
                </div>
                <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-xl">
                  {user.role === 'System_Admin' ? 'Toàn Quyền' : 'Theo Vai Trò'}
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
                {permissionItems.map((perm, idx) => (
                  <div
                    key={idx}
                    className={`p-3 flex items-start justify-between gap-3 transition-colors ${
                      perm.granted ? 'hover:bg-slate-50' : 'bg-slate-50/40 text-slate-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{perm.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{perm.desc}</p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {perm.granted ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cho phép</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 font-medium px-2.5 py-0.5 rounded-full text-[10px]">
                          <XCircle className="w-3 h-3" />
                          <span>Bị khóa</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {editSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Đã cập nhật thông tin hồ sơ cá nhân thành công!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và Tên:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Công Vụ:</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phòng Ban:</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Đổi mật khẩu thành công!</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới:</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới:</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cập Nhật Mật Khẩu</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
