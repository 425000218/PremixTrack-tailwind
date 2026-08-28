import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  Factory,
  Building2,
  Tag,
  ArrowRightLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MasterDataManagementProps } from './types';
import { MaterialsTab } from './tabs/MaterialsTab';
import { SubstitutionsTab } from './tabs/SubstitutionsTab';
import { FactoriesTab } from './tabs/FactoriesTab';
import { SuppliersTab } from './tabs/SuppliersTab';
import { ImportMappingsTab } from './tabs/ImportMappingsTab';

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  initialSubTab = 'materials',
  factories,
  materials,
  suppliers,
  formulas = [],
  substitutions = [],
  learnedMappings,
  inventorySOH = [],
  forecastDetails = [],
  usageLogs = [],
  inboundSchedules = [],
  poHeaders = [],
  poDetails = [],
  onUpdateMaterials,
  onDeleteMaterial,
  onUpdateFactories,
  onDeleteFactory,
  onUpdateSuppliers,
  onDeleteSupplier,
  onUpdateSubstitutions,
  onSaveMapping,
  onDeleteMapping,
  language,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'materials' | 'factories' | 'suppliers' | 'substitutions' | 'mappings'
  >(initialSubTab);

  const [isHeaderSummaryExpanded, setIsHeaderSummaryExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* -- 1. Header Toolbar --------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Qu?n Tr? Master Data &amp; T? �i?n �nh X? Header Excel</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Qu?n l� danh m?c c?t l�i D365 FO (Nguy�n li?u, Nh� m�y, Nh� cung c?p, Ma tr?n thay th? da ngu?n &amp; H? th?ng �nh x? c?t Excel linh ho?t)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsHeaderSummaryExpanded(!isHeaderSummaryExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              title={isHeaderSummaryExpanded ? 'Thu g?n thanh th?ng k�' : 'M? r?ng thanh th?ng k�'}
            >
              {isHeaderSummaryExpanded ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Thu G?n Header</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>M? R?ng Header</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs flex-wrap border border-slate-200/60">
          {[
            { id: 'materials' as const, label: `Nguy�n Li?u tblItem (${materials.length})`, icon: Layers },
            { id: 'substitutions' as const, label: `Ma Tr?n Thay Th? (${substitutions.length})`, icon: ArrowRightLeft },
            { id: 'factories' as const, label: `Nh� M�y tblFactory (${factories.length})`, icon: Factory },
            { id: 'suppliers' as const, label: `Nh� Cung C?p tblNCC (${suppliers.length})`, icon: Building2 },
            { id: 'mappings' as const, label: `T? �i?n Header (${learnedMappings.length})`, icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeSubTab === tab.id
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

      {/* -- 2. Render Sub-Tab Component ----------------------------------------- */}
      {activeSubTab === 'materials' && (
        <MaterialsTab
          materials={materials}
          substitutions={substitutions}
          learnedMappings={learnedMappings}
          inventorySOH={inventorySOH}
          forecastDetails={forecastDetails}
          usageLogs={usageLogs}
          poDetails={poDetails}
          formulas={formulas}
          onUpdateMaterials={onUpdateMaterials}
          onDeleteMaterial={onDeleteMaterial}
          onUpdateSubstitutions={onUpdateSubstitutions}
          language={language}
        />
      )}

      {activeSubTab === 'substitutions' && (
        <SubstitutionsTab
          substitutions={substitutions}
          materials={materials}
          learnedMappings={learnedMappings}
          onUpdateSubstitutions={onUpdateSubstitutions}
          language={language}
        />
      )}

      {activeSubTab === 'factories' && (
        <FactoriesTab
          factories={factories}
          learnedMappings={learnedMappings}
          inventorySOH={inventorySOH}
          forecastDetails={forecastDetails}
          usageLogs={usageLogs}
          inboundSchedules={inboundSchedules}
          poHeaders={poHeaders}
          onUpdateFactories={onUpdateFactories}
          onDeleteFactory={onDeleteFactory}
          language={language}
        />
      )}

      {activeSubTab === 'suppliers' && (
        <SuppliersTab
          suppliers={suppliers}
          learnedMappings={learnedMappings}
          poHeaders={poHeaders}
          onUpdateSuppliers={onUpdateSuppliers}
          onDeleteSupplier={onDeleteSupplier}
          language={language}
        />
      )}

      {activeSubTab === 'mappings' && (
        <ImportMappingsTab
          learnedMappings={learnedMappings}
          onSaveMapping={onSaveMapping}
          onDeleteMapping={onDeleteMapping}
          language={language}
        />
      )}
    </div>
  );
};

export default MasterDataManagement;
