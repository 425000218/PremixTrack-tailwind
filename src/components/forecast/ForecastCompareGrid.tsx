import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Building,
} from 'lucide-react';
import {
  ForecastCompareRow,
  Dim_Factory,
} from '../../types';

export interface ForecastCompareGridProps {
  processedRows: ForecastCompareRow[];
  compareTargetDate: string;
  compareBaseDate: string;
  materialPICMap: Map<string, string>;
  factories: Dim_Factory[];
}

export const ForecastCompareGrid: React.FC<ForecastCompareGridProps> = ({
  processedRows,
  compareTargetDate,
  compareBaseDate,
  materialPICMap,
  factories,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Tăng Mạnh */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Top Nguyên Liệu Tăng Nhu Cầu Mạnh Nhất (%)</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {compareTargetDate} vs {compareBaseDate}
                </span>
              </div>

              <div className="space-y-2.5">
                {[...processedRows]
                  .sort((a, b) => b.ComparePct - a.ComparePct)
                  .slice(0, 6)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {item.MaterialCode} - {item.MaterialName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {item.FactoryName} ({item.Division}) • PIC: {materialPICMap.get(item.MaterialCode) || 'Fiona'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-emerald-700 text-xs">
                          +{item.ComparePct.toFixed(1)}%
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          +{item.QtyDiff.toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Giảm Sâu */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span>Top Nguyên Liệu Giảm / Cắt Giảm Nhu Cầu Sâu Nhất (%)</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {compareTargetDate} vs {compareBaseDate}
                </span>
              </div>

              <div className="space-y-2.5">
                {[...processedRows]
                  .sort((a, b) => a.ComparePct - b.ComparePct)
                  .slice(0, 6)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {item.MaterialCode} - {item.MaterialName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {item.FactoryName} ({item.Division}) • PIC: {materialPICMap.get(item.MaterialCode) || 'Fiona'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-rose-700 text-xs">
                          {item.ComparePct.toFixed(1)}%
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.QtyDiff.toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
    );
  };
