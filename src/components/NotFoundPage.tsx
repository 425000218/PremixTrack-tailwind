import React from 'react';
import { AlertCircle, Home, ArrowLeft, ShieldAlert } from 'lucide-react';

interface NotFoundPageProps {
  attemptedPath?: string;
  onGoHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  attemptedPath,
  onGoHome,
}) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        {/* Icon & 404 Badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded-full shadow-xs">
            404
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Không Tìm Thấy Trang (404)
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đường dẫn yêu cầu không tồn tại trên hệ thống điều phối PremixTrack hoặc bạn không có quyền truy cập trực tiếp.
          </p>
          {attemptedPath && (
            <div className="pt-2">
              <span className="inline-block font-mono text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200 max-w-full truncate">
                {attemptedPath}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng Điều Khiển</span>
          </button>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại</span>
          </button>
        </div>

        {/* Safety Note */}
        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400">
          PremixTrack Security Shield &bull; Phiên bản hệ thống 2.5.0
        </div>
      </div>
    </div>
  );
};
