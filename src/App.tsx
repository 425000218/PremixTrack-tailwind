import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DashboardOverview } from './components/DashboardOverview';
import { InventoryMatrix } from './components/InventoryMatrix';
import { FormulaCalculator } from './components/FormulaCalculator';
import { InterFactoryTransfers } from './components/InterFactoryTransfers';
import { InboundLogistics } from './components/InboundLogistics';
import { MasterDataManagement } from './components/MasterDataManagement';
import { AiSupplyChainAdvisor } from './components/AiSupplyChainAdvisor';

import {
  mockFactories,
  mockMaterials,
  mockSuppliers,
  mockForecastDetails,
  mockInventorySOH,
  mockPOHeaders,
  mockPODetails,
  mockInboundSchedules,
  mockUsageLogs,
  mockFormulas,
  mockInitialMappings,
} from './data/mockData';

import {
  calculateAllMetrics,
  generateTransferSuggestions,
} from './utils/calculationEngine';

import {
  Dim_Factory,
  Dim_Material,
  Dim_Supplier,
  Fact_Forecast_Detail,
  Fact_Inventory_SOH,
  Fact_PurchaseOrder,
  Fact_PO_Detail,
  Fact_Inbound_Schedule,
  Fact_Production_Usage,
  Formula_BOM,
  Sys_Import_Mapping,
  Language,
} from './types';

export function App() {
  // Master Data State
  const [factories, setFactories] = useState<Dim_Factory[]>(mockFactories);
  const [materials, setMaterials] = useState<Dim_Material[]>(mockMaterials);
  const [suppliers, setSuppliers] = useState<Dim_Supplier[]>(mockSuppliers);
  const [formulas, setFormulas] = useState<Formula_BOM[]>(mockFormulas);
  const [learnedMappings, setLearnedMappings] = useState<Sys_Import_Mapping[]>(mockInitialMappings);

  // Operational Fact Data State
  const [forecastDetails, setForecastDetails] = useState<Fact_Forecast_Detail[]>(mockForecastDetails);
  const [inventorySOH, setInventorySOH] = useState<Fact_Inventory_SOH[]>(mockInventorySOH);
  const [poHeaders, setPOHeaders] = useState<Fact_PurchaseOrder[]>(mockPOHeaders);
  const [poDetails, setPODetails] = useState<Fact_PO_Detail[]>(mockPODetails);
  const [inboundSchedules, setInboundSchedules] = useState<Fact_Inbound_Schedule[]>(mockInboundSchedules);
  const [usageLogs, setUsageLogs] = useState<Fact_Production_Usage[]>(mockUsageLogs);

  // UI State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('ALL');
  const [language, setLanguage] = useState<Language>('vi');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Calculation Engine computation
  const calculatedMetrics = useMemo(() => {
    return calculateAllMetrics(
      factories,
      materials,
      inventorySOH,
      forecastDetails,
      poDetails,
      usageLogs
    );
  }, [factories, materials, inventorySOH, forecastDetails, poDetails, usageLogs]);

  // Inter-Factory Transfer Suggestions computation
  const transferSuggestions = useMemo(() => {
    return generateTransferSuggestions(calculatedMetrics, factories, materials);
  }, [calculatedMetrics, factories, materials]);

  // Critical Alerts Count
  const criticalAlertsCount = useMemo(() => {
    return calculatedMetrics.filter((m) => m.Severity === 'CRITICAL').length;
  }, [calculatedMetrics]);

  // Commit Excel Data Handlers
  const handleCommitImport = (
    type: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound',
    validData: any[]
  ) => {
    if (type === 'Forecast') {
      const newItems: Fact_Forecast_Detail[] = validData.map((d, i) => ({
        ID: `FCST-IMP-${Date.now()}-${i}`,
        VersionID: 'FCST-LATEST',
        FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0].FactoryID,
        MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0].MaterialID,
        ForecastQty: Number(d.ForecastQty || 0),
      }));
      setForecastDetails((prev) => [...newItems, ...prev]);
      showToast(`Đã import thành công ${newItems.length} dòng Dự Báo Nhu Cầu (Forecast)!`);
    } else if (type === 'SOH') {
      const newItems: Fact_Inventory_SOH[] = validData.map((d, i) => ({
        SOH_ID: `SOH-IMP-${Date.now()}-${i}`,
        FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0].FactoryID,
        MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0].MaterialID,
        Quantity: Number(d.Quantity || 0),
        WarehouseLocation: d.WarehouseLocation || 'Kho Tổng D365',
        BatchNumber: d.BatchNumber || `LOT-IMP-${Date.now().toString().substr(7)}`,
        ExpiryDate: d.ExpiryDate || '2027-12-31',
        UpdateDate: new Date().toISOString().split('T')[0],
      }));
      setInventorySOH((prev) => [...newItems, ...prev]);
      showToast(`Đã import thành công ${newItems.length} dòng Tồn Kho Thực Tế (SOH)!`);
    } else if (type === 'Usage') {
      const newItems: Fact_Production_Usage[] = validData.map((d, i) => ({
        UsageID: `USG-IMP-${Date.now()}-${i}`,
        FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0].FactoryID,
        MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0].MaterialID,
        ActualQty: Number(d.ActualQty || 0),
        LogDate: d.LogDate || d.UsageDate || new Date().toISOString().split('T')[0],
        RecipeCode: d.RecipeCode || 'AUTO_IMPORT',
      }));
      setUsageLogs((prev) => [...newItems, ...prev]);
      showToast(`Đã import thành công ${newItems.length} dòng Tiêu Hao Thực Tế (Usage)!`);
    } else if (type === 'PO_Inbound') {
      const newPODetails: Fact_PO_Detail[] = validData.map((d, i) => ({
        PODetailID: `POD-IMP-${Date.now()}-${i}`,
        POID: d.POID || `PO-D365-${Date.now().toString().substr(6, 4)}`,
        FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0].FactoryID,
        MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0].MaterialID,
        OrderQty: Number(d.OrderQty || 10000),
        ReceivedQty: 0,
        RemainQty: Number(d.OrderQty || 10000),
        UnitPriceUSD: Number(d.UnitPriceUSD || 2.5),
      }));
      setPODetails((prev) => [...newPODetails, ...prev]);
      showToast(`Đã import thành công ${newPODetails.length} đơn hàng mua (PO Inbound)!`);
    }
  };

  const handleSaveNewMappings = (newMappings: Sys_Import_Mapping[]) => {
    setLearnedMappings((prev) => [...newMappings, ...prev]);
    showToast(`Đã lưu ${newMappings.length} quy tắc ánh xạ mới vào từ điển hệ thống!`);
  };

  const handleReceiveShipment = (scheduleId: string, receivedQty: number) => {
    const targetSchedule = inboundSchedules.find((s) => s.ScheduleID === scheduleId);
    if (!targetSchedule) return;

    // Update schedule status
    setInboundSchedules((prev) =>
      prev.map((s) => (s.ScheduleID === scheduleId ? { ...s, Status: 'Unloaded' } : s))
    );

    // Find PO detail and update remain quantity
    const targetPODetail = poDetails.find((p) => p.PODetailID === targetSchedule.PODetailID);
    if (targetPODetail) {
      setPODetails((prev) =>
        prev.map((p) => {
          if (p.PODetailID === targetPODetail.PODetailID) {
            const nextReceived = p.ReceivedQty + receivedQty;
            return {
              ...p,
              ReceivedQty: nextReceived,
              RemainQty: Math.max(0, p.OrderQty - nextReceived),
            };
          }
          return p;
        })
      );

      // Add to SOH
      const newSOH: Fact_Inventory_SOH = {
        SOH_ID: `SOH-REC-${Date.now()}`,
        FactoryID: targetPODetail.FactoryID,
        MaterialID: targetPODetail.MaterialID,
        BatchNumber: `LOT-REC-${Date.now().toString().substr(7)}`,
        Quantity: receivedQty,
        UpdateDate: new Date().toISOString().split('T')[0],
        ExpiryDate: '2028-06-30',
        WarehouseLocation: 'Kho Nhập Vừa Nhận',
      };
      setInventorySOH((prev) => [newSOH, ...prev]);
    }

    showToast(`Đã nhập kho thành công ${receivedQty.toLocaleString()} kg vào tồn kho SOH!`);
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu?')) {
      setFactories(mockFactories);
      setMaterials(mockMaterials);
      setSuppliers(mockSuppliers);
      setFormulas(mockFormulas);
      setForecastDetails(mockForecastDetails);
      setInventorySOH(mockInventorySOH);
      setPOHeaders(mockPOHeaders);
      setPODetails(mockPODetails);
      setInboundSchedules(mockInboundSchedules);
      setUsageLogs(mockUsageLogs);
      setLearnedMappings(mockInitialMappings);
      showToast('Đã khôi phục dữ liệu mẫu gốc hoàn tất!');
    }
  };

  const handleDeleteMapping = (mappingId: string) => {
    setLearnedMappings((prev) => prev.filter((m) => m.MappingID !== mappingId));
    showToast('Đã xóa quy tắc ánh xạ!');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={setLanguage}
        criticalAlertsCount={criticalAlertsCount}
        transferSuggestionsCount={transferSuggestions.length}
        onResetData={handleResetData}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          factories={factories}
          selectedFactoryId={selectedFactoryId}
          setSelectedFactoryId={setSelectedFactoryId}
          criticalAlertsCount={criticalAlertsCount}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          language={language}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {currentTab === 'dashboard' && (
              <DashboardOverview
                metrics={calculatedMetrics}
                factories={factories}
                materials={materials}
                inboundSchedules={inboundSchedules}
                transferSuggestions={transferSuggestions}
                selectedFactoryId={selectedFactoryId}
                onSelectFactory={(id) => setSelectedFactoryId(id)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                language={language}
              />
            )}

            {currentTab === 'matrix' && (
              <InventoryMatrix
                metrics={calculatedMetrics}
                factories={factories}
                materials={materials}
                inventorySOH={inventorySOH}
                poDetails={poDetails}
                language={language}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'transfers' && (
              <InterFactoryTransfers
                suggestions={transferSuggestions}
                factories={factories}
                materials={materials}
                language={language}
              />
            )}

            {currentTab === 'formula' && (
              <FormulaCalculator
                formulas={formulas}
                factories={factories}
                materials={materials}
                inventorySOH={inventorySOH}
                poDetails={poDetails}
                language={language}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'logistics' && (
              <InboundLogistics
                inboundSchedules={inboundSchedules}
                poHeaders={poHeaders}
                poDetails={poDetails}
                factories={factories}
                materials={materials}
                suppliers={suppliers}
                onReceiveShipment={handleReceiveShipment}
                language={language}
              />
            )}

            {currentTab === 'masterdata' && (
              <MasterDataManagement
                factories={factories}
                materials={materials}
                suppliers={suppliers}
                learnedMappings={learnedMappings}
                onUpdateMaterials={(updated) => setMaterials(updated)}
                onDeleteMapping={handleDeleteMapping}
                language={language}
              />
            )}

            {currentTab === 'ai-advisor' && (
              <AiSupplyChainAdvisor
                metrics={calculatedMetrics}
                factories={factories}
                materials={materials}
                language={language}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-xs font-semibold border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Excel Dynamic Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        factories={factories}
        materials={materials}
        learnedMappings={learnedMappings}
        onSaveNewMappings={handleSaveNewMappings}
        onCommitImport={handleCommitImport}
        language={language}
      />
    </div>
  );
}

export default App;
