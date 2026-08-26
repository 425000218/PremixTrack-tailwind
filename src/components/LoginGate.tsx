import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Database,
  CheckCircle2,
  Sparkles,
  Server,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { AppUser } from '../types';
import { mockUsers, getRolePermissions } from '../data/mockData';

interface LoginGateProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ isOnline: boolean; server?: string } | null>(null);

  // Check SQL DB Status on mount
  useEffect(() => {
    fetch('/api/db/status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(() => setDbStatus({ isOnline: false }));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success && data.user) {
        const fullUser: AppUser = {
          ...data.user,
          permissions: getRolePermissions(data.user.role, data.user.assignedFactoryId)
        };
        onLoginSuccess(fullUser);
      } else {
        setErrorMsg(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      // Fallback for offline testing
      const matched = mockUsers.find(
        u => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase())
      );
      if (matched) {
        onLoginSuccess(matched);
      } else {
        setErrorMsg('Không thể kết nối máy chủ xác thực.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (user: AppUser, defaultPw: string) => {
    setUsername(user.username);
    setPassword(defaultPw);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 overflow-y-auto">
      {/* Background Subtle Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Main Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          
          {/* Header Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-4 text-white">
              <Shield className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              PremixTrack
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase">
                D365 FO
              </span>
            </h1>
            
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Cổng Điều Phối & Dự Báo Nguyên Liệu Premix & TACN
            </p>

            {/* Server Status Badge */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>MS SQL Server 2022</span>
                <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tên Đăng Nhập / Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, scm_lead, planner_dbd..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 text-xs font-medium focus:border-blue-500 focus:bg-slate-950 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Mật Khẩu *
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 text-xs font-mono focus:border-blue-500 focus:bg-slate-950 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xác thực bảo mật...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Vào Hệ Thống</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tài khoản kiểm thử nhanh (Demo RBAC):</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoSelect(mockUsers[0], 'admin@123')}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-rose-400 flex items-center justify-between">
                  <span>admin</span>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded">Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect(mockUsers[1], 'scm@123')}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-blue-400 flex items-center justify-between">
                  <span>scm_lead</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded">Planner</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">scm@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect(mockUsers[2], 'planner_dbd', 'planner@123')}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between">
                  <span>planner_dbd</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">Factory</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">planner@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect(mockUsers[3], 'logistics@123')}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between">
                  <span>logistics_lead</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Buyer</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">logistics@123</div>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Hệ thống bảo mật nội bộ D365 FO & Chuỗi Cung Ứng. Mọi hành vi truy cập trái phép đều được ghi vết <code className="text-slate-400 font-mono">dbo.sys_Audit_Log</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
