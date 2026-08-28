import React from 'react';
import { Search, X } from 'lucide-react';

export interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = 'T�m ki?m...',
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
};
