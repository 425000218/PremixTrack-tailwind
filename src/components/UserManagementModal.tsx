import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Building,
  Mail,
  Phone,
  Factory,
  Search,
  RefreshCw,
  Lock,
  UserCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AppUser, Dim_Factory, UserRole } from '../types';
import { getRolePermissions } from '../data/mockData';

interface DbUser {
  UserID: string;
  Username: string;
  FullName: string;
  Email: string;
  Phone?: string;
  Department?: string;
  Role: string;
  PlainPasswordPreview?: string;
  FactoryAccess?: string;
  IsActive: boolean | number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  factories: Dim_Factory[];
  onUserListChanged?: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; mappedRole: UserRole }> = {
  admin: { label: 'Quản Trị Viên Hệ Thống', bg: 'bg-rose-50 border-rose-200 text-rose-700', text: 'bg-rose-600', mappedRole: 'System_Admin' },
  planner: { label: 'Trưởng Phòng Chuỗi Cung Ứng', bg: 'bg-blue-50 border-blue-200 text-blue-700', text: 'bg-blue-600', mappedRole: 'Supply_Chain_Manager' },
  factory_manager: { label: 'Kỹ Sư Điều Phối Nhà Máy', bg: 'bg-amber-50 border-amber-200 text-amber-700', text: 'bg-amber-600', mappedRole: 'Factory_Planner' },
  buyer: { label: 'Trưởng Bộ Phận Inbound & Mua Hàng', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'bg-emerald-600', mappedRole: 'Logistics_Officer' },
  viewer: { label: 'Người Xem & Kiểm Toán Báo Cáo', bg: 'bg-slate-50 border-slate-200 text-slate-700', text: 'bg-slate-600', mappedRole: 'Viewer' },
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  factories,
  onUserListChanged
}) => {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Modal Edit/Create State
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<DbUser> | null>(null);
  const [formPassword, setFormPassword] = useState('');
  const [selectedFactories, setSelectedFactories] = useState<string[]>(['ALL']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch Users from MS SQL Server
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenCreate = () => {
    setEditingUser({
      UserID: `USR-${Date.now().toString().slice(-4)}`,
      Username: '',
      FullName: '',
      Email: '',
      Phone: '',
      Department: '',
      Role: 'viewer',
      IsActive: 1
    });
    setFormPassword('');
    setSelectedFactories(['ALL']);
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (user: DbUser) => {
    setEditingUser(user);
    setFormPassword(user.PlainPasswordPreview || '');
    try {
      const parsed = typeof user.FactoryAccess === 'string' ? JSON.parse(user.FactoryAccess) : user.FactoryAccess;
      setSelectedFactories(Array.isArray(parsed) ? parsed : ['ALL']);
    } catch {
      setSelectedFactories(['ALL']);
    }
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.Username || !editingUser?.FullName || !editingUser?.Email) {
      setErrorMsg('Vui lòng điền đầy đủ Tên đăng nhập, Họ và tên, và Email.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      ...editingUser,
      Password: formPassword,
      FactoryAccess: JSON.stringify(selectedFactories),
      IsActive: editingUser.IsActive ? 1 : 0
    };

    try {
      const isNew = !users.some(u => u.UserID === editingUser.UserID);
      const url = isNew ? '/api/users' : `/api/users/${editingUser.UserID}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        setSuccessMsg(isNew ? 'Đã thêm người dùng mới thành công!' : 'Đã cập nhật thông tin và phân quyền thành công!');
        setIsEditing(false);
        await fetchUsers();
        if (onUserListChanged) onUserListChanged();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(result.error || 'Có lỗi xảy ra khi lưu thông tin người dùng.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ SQL.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (username === 'admin') {
      alert('Không thể xóa tài khoản Admin mặc định của hệ thống!');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" không?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg(`Đã xóa tài khoản ${username} khỏi SQL Server.`);
        await fetchUsers();
        if (onUserListChanged) onUserListChanged();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      alert('Lỗi khi xóa tài khoản');
    }
  };

  const filteredUsers = users.filter(u =>
    u.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Quản Trị Người Dùng & Phân Quyền SQL Server</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lưu trữ và đồng bộ bảo mật trực tiếp trên bảng <code className="text-rose-300">dbo.sys_User_Account</code> (MS SQL 2022)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Notifications */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="p-6 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, username, email, vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Làm mới danh sách từ SQL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Đồng bộ</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Người Dùng Mới</span>
            </button>
          </div>
        </div>

        {/* Main Users Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl">Họ & Tên / Tài Khoản</th>
                <th className="py-3 px-4">Vai Trò Phân Quyền</th>
                <th className="py-3 px-4">Mật Khẩu (Admin View)</th>
                <th className="py-3 px-4">Nhà Máy Phụ Trách</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.map((user) => {
                const roleInfo = ROLE_CONFIG[user.Role] || {
                  label: user.Role,
                  bg: 'bg-slate-50 border-slate-200 text-slate-700',
                  text: 'bg-slate-600',
                  mappedRole: 'Viewer'
                };
                const isPwVisible = showPasswords[user.UserID];

                let assignedFactories: string[] = [];
                try {
                  assignedFactories = typeof user.FactoryAccess === 'string' ? JSON.parse(user.FactoryAccess) : user.FactoryAccess;
                } catch {
                  assignedFactories = ['ALL'];
                }

                return (
                  <tr key={user.UserID} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${roleInfo.text} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                          {user.FullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.FullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">(@{user.Username})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{user.Email}</span>
                            {user.Phone && <span className="text-slate-300">•</span>}
                            {user.Phone && <span>{user.Phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleInfo.bg}`}>
                        {roleInfo.label}
                      </span>
                      {user.Department && (
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{user.Department}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-lg w-fit border border-slate-200">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {isPwVisible ? (user.PlainPasswordPreview || '******') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.UserID)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                          title={isPwVisible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                        >
                          {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-rose-500" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {assignedFactories?.includes('ALL') ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          Toàn quốc (22 Cơ sở)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {assignedFactories?.map(facId => (
                            <span key={facId} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 font-medium">
                              {facId.replace('FAC-', '')}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {user.IsActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Đã khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin & phân quyền"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.Username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.UserID, user.Username)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-6">
          <span>Tổng số tài khoản: <strong>{users.length}</strong> (Đồng bộ MSSQL)</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>

      {/* Sub-modal: Edit / Create User */}
      {isEditing && editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in zoom-in-95 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                {users.some(u => u.UserID === editingUser.UserID) ? 'Cập Nhật Người Dùng & Phân Quyền' : 'Tạo Tài Khoản Người Dùng Mới'}
              </h4>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tên Đăng Nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.Username || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, Username: e.target.value })}
                    disabled={users.some(u => u.UserID === editingUser.UserID)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-60 focus:bg-white focus:border-rose-500 focus:outline-none"
                    placeholder="ví dụ: nam.le"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mật Khẩu (Password) *</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-rose-500 focus:outline-none"
                    placeholder="Nhập mật khẩu..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.FullName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, FullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none"
                    placeholder="ví dụ: Lê Hoàng Nam"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Công Ty *</label>
                  <input
                    type="email"
                    required
                    value={editingUser.Email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, Email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none"
                    placeholder="nam.le@premixtrack.vn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={editingUser.Phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, Phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none"
                    placeholder="0903 112 233"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phòng Ban / Bộ Phận</label>
                  <input
                    type="text"
                    value={editingUser.Department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, Department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none"
                    placeholder="Phòng Kế Hoạch S&OP"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Vai Trò Phân Quyền Hệ Thống *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(ROLE_CONFIG).map(([roleKey, conf]) => (
                    <label
                      key={roleKey}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        editingUser.Role === roleKey
                          ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={roleKey}
                        checked={editingUser.Role === roleKey}
                        onChange={() => setEditingUser({ ...editingUser, Role: roleKey })}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="font-semibold text-xs">{conf.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono">code: {roleKey}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Factory Access Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Phân Quyền Truy Cập Cơ Sở Nhà Máy</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-36 overflow-y-auto">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFactories.includes('ALL')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedFactories(['ALL']);
                        else setSelectedFactories([]);
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Toàn Quốc (Tất cả 22 cơ sở nhà máy & kho)</span>
                  </label>

                  {!selectedFactories.includes('ALL') && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      {factories.map((fac) => (
                        <label key={fac.FactoryID} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFactories.includes(fac.FactoryID)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFactories([...selectedFactories.filter(f => f !== 'ALL'), fac.FactoryID]);
                              } else {
                                setSelectedFactories(selectedFactories.filter(f => f !== fac.FactoryID));
                              }
                            }}
                            className="rounded text-rose-600 focus:ring-rose-500"
                          />
                          <span className="truncate">{fac.InternalCode} - {fac.FactoryName_VN}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active status */}
              <div className="pt-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingUser.IsActive)}
                    onChange={(e) => setEditingUser({ ...editingUser, IsActive: e.target.checked ? 1 : 0 })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Tài khoản đang kích hoạt (Active)</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {loading ? 'Đang lưu SQL...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
