import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

export interface EmptyDataPlaceholderProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const EmptyDataPlaceholder: React.FC<EmptyDataPlaceholderProps> = ({
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc dữ liệu chưa được nạp.',
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 ${className}`}
    >
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs text-slate-400 mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h4 className="font-bold text-xs text-slate-800">{title}</h4>
      <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
