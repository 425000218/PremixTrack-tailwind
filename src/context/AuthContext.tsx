import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { getRolePermissions } from '../data/mockData';
import { fetchWithAuth } from '../utils/apiClient';

interface AuthContextType {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  login: (user: AppUser) => void;
  logout: () => void;
  updateUser: (updated: AppUser) => void;
  refreshUserProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('premixtrack_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && !u.permissions) {
          u.permissions = getRolePermissions(u.role, u.assignedFactoryId);
        }
        return u;
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('premixtrack_user', JSON.stringify(user));
  };

  const logout = () => {
    fetchWithAuth('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem('premixtrack_user');
  };

  const updateUser = (updated: AppUser) => {
    setCurrentUser(updated);
    localStorage.setItem('premixtrack_user', JSON.stringify(updated));
  };

  const refreshUserProfile = () => {
    const saved = localStorage.getItem('premixtrack_user');
    let userToFind = currentUser;
    if (!userToFind && saved) {
      try {
        userToFind = JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    if (!userToFind?.id && !userToFind?.username) return;

    fetchWithAuth('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const dbUser = data.data.find(
            (u: any) =>
              (userToFind?.id && u.UserID === userToFind.id) ||
              (userToFind?.username && u.Username.toLowerCase() === userToFind.username.toLowerCase())
          );
          if (dbUser) {
            const roleMap: Record<string, { role: UserRole; roleNameVN: string; avatarBg: string }> = {
              admin: { role: 'System_Admin', roleNameVN: 'Quản Trị Viên Hệ Thống', avatarBg: 'bg-rose-600' },
              planner: { role: 'Supply_Chain_Manager', roleNameVN: 'Trưởng Phòng Chuỗi Cung Ứng (S&OP)', avatarBg: 'bg-blue-600' },
              factory_manager: { role: 'Factory_Planner', roleNameVN: 'Kỹ Sư Điều Phối Nhà Máy', avatarBg: 'bg-amber-600' },
              buyer: { role: 'Logistics_Officer', roleNameVN: 'Trưởng Bộ Phận Inbound & Mua Hàng', avatarBg: 'bg-emerald-600' },
              viewer: { role: 'Viewer', roleNameVN: 'Kiểm Toán Viên & Xem Báo Cáo', avatarBg: 'bg-slate-600' },
            };
            const mapped = roleMap[dbUser.Role?.toLowerCase()] || roleMap.viewer;
            let factoryAccessArray: string[] = ['ALL'];
            try {
              factoryAccessArray = typeof dbUser.FactoryAccess === 'string' ? JSON.parse(dbUser.FactoryAccess) : (dbUser.FactoryAccess || ['ALL']);
            } catch {
              factoryAccessArray = ['ALL'];
            }
            const assignedFactoryId = factoryAccessArray.includes('ALL') ? 'ALL' : factoryAccessArray[0];
            const assignedFactoryName = factoryAccessArray.includes('ALL') ? 'Toàn quốc (22 Cơ sở)' : `Nhà máy ${assignedFactoryId.replace('FAC-', '')}`;

            const refreshed: AppUser = {
              ...userToFind!,
              id: dbUser.UserID,
              username: dbUser.Username,
              fullName: dbUser.FullName,
              email: dbUser.Email,
              phone: dbUser.Phone || '',
              department: dbUser.Department || '',
              role: mapped.role,
              roleNameVN: mapped.roleNameVN,
              avatarBg: mapped.avatarBg,
              assignedFactoryId,
              assignedFactoryName,
              permissions: getRolePermissions(mapped.role, assignedFactoryId),
            };
            setCurrentUser(refreshed);
            localStorage.setItem('premixtrack_user', JSON.stringify(refreshed));
          }
        }
      })
      .catch((err) => console.warn('Could not sync user profile from DB:', err));
  };

  useEffect(() => {
    refreshUserProfile();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        updateUser,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
