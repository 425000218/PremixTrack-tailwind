import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Layers,
  BarChart3,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ForecastManagementProps } from './types';
import { ForecastDetailMatrix } from './ForecastDetailMatrix';
import { ForecastCompareGrid } from './ForecastCompareGrid';
import { ForecastVersionTable } from './ForecastVersionTable';

export const ForecastManagement: React.FC<ForecastManagementProps> = ({
  forecastVersions,
  compareData,
  materials,
  factories,
  onUpdateVersions,
  onUpdateCompareData,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'analytics' | 'versions'>('matrix');
  const [isHeaderSummaryExpanded, setIsHeaderSummaryExpanded] = useState<boolean>(true);

  // Map PIC from materials (tblITEM)
  const materialPICMap = useMemo(() => {
    const map = new Map<string, string>();
    materials.forEach((m) => {
      if (m.MaterialCode) {
        map.set(m.MaterialCode, m.PIC || 'Fiona');
      }
    });
    return map;
  }, [materials]);

  const allAvailableRunDates = useMemo(() => {
    return [...forecastVersions]
      .sort((a, b) => new Date(b.RunDate).getTime() - new Date(a.RunDate).getTime())
      .map((v) => v.RunDate);
  }, [forecastVersions]);

  const compareTargetDate = allAvailableRunDates[0] || '';
  const compareBaseDate = allAvailableRunDates[1] || allAvailableRunDates[0] || '';

  const processedRows = useMemo(() => {
    return compareData.map((row) => {
      const targetVal = row.RunQuantities?.[compareTargetDate] || 0;
      const baseVal = row.RunQuantities?.[compareBaseDate] || 0;
      const diff = targetVal - baseVal;
      const pct = baseVal > 0 ? (diff / baseVal) * 100 : targetVal > 0 ? 100 : 0;
      return {
        ...row,
        LatestQty: targetVal,
        PreviousQty: baseVal,
        QtyDiff: diff,
        ComparePct: pct,
      };
    });
  }, [compareData, compareTargetDate, compareBaseDate]);

  return (
    <div className="space-y-3 animate-fade-in">
      {/* -- 1. HEADER & SUB-TABS BAR ----------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                K? Ho?ch &amp; Theo D�i D? B�o Forecast Nhu C?u Nguy�n Li?u (RD)
              </h2>
              {isHeaderSummaryExpanded && (
                <p className="text-[11px] text-slate-500 mt-0.5 animate-fade-in">
                  �?i so�t v� ph�n t�ch bi?n d?ng Raw Material Consumption t? R&amp;D theo ng�y upload, h? tr? Multi-Select Slicers (Ng�nh, PIC Mua H�ng, Nh� M�y), so s�nh 2 k? li?n k? sau c�ng.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHeaderSummaryExpanded(!isHeaderSummaryExpanded)}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isHeaderSummaryExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isHeaderSummaryExpanded ? 'Thu G?n' : 'M? R?ng'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs flex-wrap border border-slate-200/60">
          {[
            {
              id: 'matrix' as const,
              label: `Ma Tr?n So S�nh �a K? (${compareData.length} d�ng)`,
              icon: Layers,
            },
            {
              id: 'analytics' as const,
              label: 'Bi?u �? Xu Hu?ng & Ph�n T�ch Bi?n �?ng',
              icon: BarChart3,
            },
            {
              id: 'versions' as const,
              label: `Qu?n L� �?t Upload (${forecastVersions.length} d?t)`,
              icon: Calendar,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -- 2. SUBTABS CONTENT ------------------------------------------------ */}
      {activeTab === 'matrix' && (
        <ForecastDetailMatrix
          forecastVersions={forecastVersions}
          compareData={compareData}
          materials={materials}
          factories={factories}
          onUpdateCompareData={onUpdateCompareData}
          language={language}
        />
      )}

      {activeTab === 'analytics' && (
        <ForecastCompareGrid
          processedRows={processedRows}
          compareTargetDate={compareTargetDate}
          compareBaseDate={compareBaseDate}
          materialPICMap={materialPICMap}
          factories={factories}
        />
      )}

      {activeTab === 'versions' && (
        <ForecastVersionTable
          forecastVersions={forecastVersions}
          materials={materials}
          factories={factories}
          onUpdateVersions={onUpdateVersions}
          language={language}
        />
      )}
    </div>
  );
};

export default ForecastManagement;
