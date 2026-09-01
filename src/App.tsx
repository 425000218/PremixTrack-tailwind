import React, { useState, useMemo, useEffect, useRef } from 'react';
import { fetchWithAuth } from './utils/apiClient';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExcelImportModal } from './components/ExcelImportModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserManagementModal } from './components/UserManagementModal';
import { LoginGate } from './components/LoginGate';
import { DashboardOverview } from './components/DashboardOverview';
import { InventoryMatrix } from './components/InventoryMatrix';
import { FormulaCalculator } from './components/FormulaCalculator';
import { InterFactoryTransfers } from './components/InterFactoryTransfers';
import { InboundLogistics } from './components/InboundLogistics';
import { MasterDataManagement } from './components/MasterDataManagement';
import { ForecastManagement } from './components/ForecastManagement';
import { PositionMatrixView } from './components/PositionMatrixView';
import { AiSupplyChainAdvisor } from './components/AiSupplyChainAdvisor';

import {
  mockFactories,
  mockMaterials,
  mockSuppliers,
  mockForecastDetails,
  initialForecastVersions,
  initialForecastCompareData,
  mockInventorySOH,
  mockPOHeaders,
  mockPODetails,
  mockInboundSchedules,
  mockUsageLogs,
  mockFormulas,
  mockInitialMappings,
  getRolePermissions,
} from './data/mockData';

import {
  loadAllBootstrapData,
  saveMaterialToDb,
  deleteMaterialFromDb,
  saveFactoryToDb,
  deleteFactoryFromDb,
  saveSupplierToDb,
  deleteSupplierFromDb,
  saveSubstitutionToDb,
  deleteSubstitutionFromDb,
  saveMappingToDb,
  deleteMappingFromDb,
  syncForecastToDb,
  syncInventorySOHToDb,
  syncUsageToDb,
  syncPurchaseOrdersToDb,
} from './services/dataService';

import {
  calculateAllMetrics,
  generateTransferSuggestions,
} from './utils/calculationEngine';

import {
  Dim_Factory,
  Dim_Material,
  Dim_Supplier,
  Dim_Material_Substitution,
  ForecastRunVersion,
  ForecastCompareRow,
  Fact_Forecast_Detail,
  Fact_Inventory_SOH,
  Fact_PurchaseOrder,
  Fact_PO_Detail,
  Fact_Inbound_Schedule,
  Fact_Production_Usage,
  Formula_BOM,
  Sys_Import_Mapping,
  AppUser,
  UserRole,
  Language,
} from './types';

export function App() {
  // Master Data State
  const [factories, setFactories] = useState<Dim_Factory[]>(mockFactories);
  const [materials, setMaterials] = useState<Dim_Material[]>(mockMaterials);
  const [suppliers, setSuppliers] = useState<Dim_Supplier[]>(mockSuppliers);
  const [formulas, setFormulas] = useState<Formula_BOM[]>(mockFormulas);
  const [substitutions, setSubstitutions] = useState<Dim_Material_Substitution[]>([]);
  const [learnedMappings, setLearnedMappings] = useState<Sys_Import_Mapping[]>(mockInitialMappings);

  // Operational Fact Data & Forecast Run Versions State
  const [forecastVersions, setForecastVersions] = useState<ForecastRunVersion[]>(initialForecastVersions);
  const [forecastCompareData, setForecastCompareData] = useState<ForecastCompareRow[]>(initialForecastCompareData);
  const [forecastDetails, setForecastDetails] = useState<Fact_Forecast_Detail[]>(mockForecastDetails);
  const [inventorySOH, setInventorySOH] = useState<Fact_Inventory_SOH[]>(mockInventorySOH);
  const [poHeaders, setPOHeaders] = useState<Fact_PurchaseOrder[]>(mockPOHeaders);
  const [poDetails, setPODetails] = useState<Fact_PO_Detail[]>(mockPODetails);
  const [inboundSchedules, setInboundSchedules] = useState<Fact_Inbound_Schedule[]>(mockInboundSchedules);
  const [usageLogs, setUsageLogs] = useState<Fact_Production_Usage[]>(mockUsageLogs);

  // Data Loading & Connection Status State
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [dbSource, setDbSource] = useState<'MSSQL' | 'FALLBACK_LOCAL'>('FALLBACK_LOCAL');

  // User Authentication & RBAC State (Requires Login Gate)
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
    return null; // By default require login gate for security!
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);

  // UI State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('ALL');
  const [selectedFactoryIds, setSelectedFactoryIds] = useState<string[]>(['ALL']);
  const [language, setLanguage] = useState<Language>('vi');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('premixtrack_sidebar_collapsed') === 'true';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('premixtrack_sidebar_collapsed', String(next));
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // 1. Initial Load: Load all data from MS SQL Server Database
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function initializeDatabaseData() {
      try {
        const bootstrap = await loadAllBootstrapData();
        if (!isMounted) return;

        setDbSource(bootstrap.source);
        setIsDataLoaded(true);

        if (bootstrap.factories.length > 0) setFactories(bootstrap.factories);
        if (bootstrap.materials.length > 0) setMaterials(bootstrap.materials);
        if (bootstrap.suppliers.length > 0) setSuppliers(bootstrap.suppliers);
        if (bootstrap.substitutions.length > 0) setSubstitutions(bootstrap.substitutions);
        if (bootstrap.formulas.length > 0) setFormulas(bootstrap.formulas);
        if (bootstrap.mappings.length > 0) setLearnedMappings(bootstrap.mappings);

        if (bootstrap.forecastVersions.length > 0) setForecastVersions(bootstrap.forecastVersions);
        if (bootstrap.forecastDetails.length > 0) setForecastDetails(bootstrap.forecastDetails);
        if (bootstrap.inventorySOH.length > 0) setInventorySOH(bootstrap.inventorySOH);
        if (bootstrap.usageLogs.length > 0) setUsageLogs(bootstrap.usageLogs);
        if (bootstrap.inboundSchedules.length > 0) setInboundSchedules(bootstrap.inboundSchedules);
        if (bootstrap.poHeaders.length > 0) setPOHeaders(bootstrap.poHeaders);
        if (bootstrap.poDetails.length > 0) setPODetails(bootstrap.poDetails);

        if (bootstrap.isOnline) {
          showToast('✅ Đã kết nối MS SQL Server (PremixTrackDB - Live Data)');
        }
      } catch (err) {
        console.warn('Init DB error:', err);
      }
    }

    initializeDatabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live Refresh current user profile from MS SQL Server (dbo.sys_User_Account)
  const refreshUserProfileFromDb = () => {
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
    refreshUserProfileFromDb();
  }, []);

  // Auth Handler Functions
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('premixtrack_user', JSON.stringify(user));
    if (user.assignedFactoryId && user.assignedFactoryId !== 'ALL') {
      setSelectedFactoryId(user.assignedFactoryId);
      setSelectedFactoryIds([user.assignedFactoryId]);
    } else {
      setSelectedFactoryId('ALL');
      setSelectedFactoryIds(['ALL']);
    }
    showToast(`Xin chào ${user.fullName} (${user.roleNameVN})!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('premixtrack_user');
    showToast('Đã đăng xuất khỏi hệ thống.');
  };

  const handleUpdateUser = (updated: AppUser) => {
    setCurrentUser(updated);
    localStorage.setItem('premixtrack_user', JSON.stringify(updated));
    showToast('Đã cập nhật thông tin hồ sơ cá nhân!');
  };

  const handleQuickSwitchUser = (user: AppUser) => {
    handleLoginSuccess(user);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Real-time Calculation Engine computation
  const calculatedMetrics = useMemo(() => {
    return calculateAllMetrics(
      factories,
      materials,
      inventorySOH,
      forecastDetails,
      poDetails,
      usageLogs,
      substitutions
    );
  }, [factories, materials, inventorySOH, forecastDetails, poDetails, usageLogs, substitutions]);

  // Inter-Factory Transfer Suggestions computation
  const transferSuggestions = useMemo(() => {
    return generateTransferSuggestions(calculatedMetrics, factories, materials);
  }, [calculatedMetrics, factories, materials]);

  // Critical Alerts Count
  const criticalAlertsCount = useMemo(() => {
    return calculatedMetrics.filter((m) => m.Severity === 'CRITICAL').length;
  }, [calculatedMetrics]);

  // --------------------------------------------------------------------------
  // Commit Excel Data Handlers & Asynchronous SQL Server Sync
  // --------------------------------------------------------------------------
  const handleCommitImport = async (
    type: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound',
    validData: any[],
    snapshotDate?: string
  ) => {
    const effectiveDate = snapshotDate || new Date().toISOString().split('T')[0];

    if (type === 'Forecast') {
      const newItems: Fact_Forecast_Detail[] = validData.map((d, i) => ({
        ID: `FCST-IMP-${Date.now()}-${i}`,
        VersionID: `FCST-${effectiveDate.replace(/-/g, '')}`,
        FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0]?.FactoryID || 'FAC-DBD',
        MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0]?.MaterialID || 'MAT-2579',
        ForecastQty: Number(d.ForecastQty || 0),
        RunDate: effectiveDate,
        SiteCode: d.SiteCode || 'DBD',
        FactoryCode: d.FactoryCode || 'DBD',
        PlantName: d.PlantName || '043 Binh Duong',
        MaterialCode: d.MaterialCode || '2579',
        MaterialName: d.MaterialName || 'CORN NGMO',
        Division: d.Division || 'Livestock',
        ForecastQtyKg: Number(d.ForecastQty || 0),
      }));

      const newVersion: ForecastRunVersion = {
        VersionID: `FCST-${effectiveDate.replace(/-/g, '')}`,
        VersionName: `Đợt Forecast ${effectiveDate}`,
        RunDate: effectiveDate,
        SKUCount: new Set(newItems.map((n) => n.MaterialCode)).size,
        TotalForecastQty: newItems.reduce((sum, n) => sum + (n.ForecastQty || 0), 0),
        PlantCount: 22,
        UploadedAt: new Date().toISOString(),
        UploadedBy: currentUser?.fullName || 'User',
        SourceFileName: 'Manual_Import.xlsx',
      };

      setForecastDetails((prev) => [...newItems, ...prev]);
      setForecastVersions((prev) => [newVersion, ...prev.filter((v) => v.VersionID !== newVersion.VersionID)]);
      showToast(`Đã import thành công ${newItems.length} dòng Dự Báo Nhu Cầu (Forecast Cut-off: ${effectiveDate})!`);

      // Persist to SQL Server in background
      syncForecastToDb([newVersion], newItems).then((ok) => {
        if (ok) console.log('✅ Forecast synced to SQL Server.');
      });

    } else if (type === 'SOH') {
      const newItems: Fact_Inventory_SOH[] = validData.map((d, i) => ({
        SOH_ID: `SOH-IMP-${Date.now()}-${i}`,
        InventoryID: `SOH-IMP-${Date.now()}-${i}`,
        FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0]?.FactoryID || 'FAC-DBD',
        MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0]?.MaterialID || 'MAT-2579',
        MaterialCode: d.MaterialCode || '2579',
        MaterialName: d.MaterialName || 'CORN NGMO',
        Quantity: Number(d.Quantity || d.SOHQtyKg || 0),
        SOHQtyKg: Number(d.Quantity || d.SOHQtyKg || 0),
        WarehouseLocation: d.WarehouseLocation || d.SubInventory || 'Kho RAW D365',
        WarehouseCode: d.WarehouseCode || d.FactoryCode || 'DBD',
        BatchNumber: d.BatchNumber || `LOT-IMP-${Date.now().toString().substr(7)}`,
        ExpiryDate: d.ExpiryDate || '2027-12-31',
        UpdateDate: effectiveDate,
        SnapshotDate: effectiveDate,
        AveragePrice: Number(d.AveragePrice || 0),
        Region: d.Region || 'SOUTH',
      }));

      setInventorySOH((prev) => [...newItems, ...prev]);
      showToast(`Đã import thành công ${newItems.length} dòng Tồn Kho SOH (Khớp Ngày Chốt ${effectiveDate})!`);

      // Persist to SQL Server in background
      syncInventorySOHToDb(newItems, effectiveDate).then((ok) => {
        if (ok) console.log('✅ Inventory SOH synced to SQL Server.');
      });

    } else if (type === 'Usage') {
      const newItems: Fact_Production_Usage[] = validData.map((d, i) => ({
        UsageID: `USG-IMP-${Date.now()}-${i}`,
        FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0]?.FactoryID || 'FAC-DBD',
        FactoryCode: d.FactoryCode || 'DBD',
        MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0]?.MaterialID || 'MAT-2579',
        MaterialCode: d.MaterialCode || '2579',
        MaterialName: d.MaterialName || 'CORN NGMO',
        ActualQty: Number(d.ActualQty || d.ActualUsageKg || 0),
        ActualUsageKg: Number(d.ActualQty || d.ActualUsageKg || 0),
        LogDate: d.LogDate || d.UsageDate || effectiveDate,
        UsageDate: d.LogDate || d.UsageDate || effectiveDate,
        RecipeCode: d.RecipeCode || d.FormulaCode || 'AUTO_IMPORT',
        Division: d.Division || 'Livestock',
      }));

      setUsageLogs((prev) => [...newItems, ...prev]);
      showToast(`Đã import thành công ${newItems.length} dòng Tiêu Hao Thực Tế (Usage Cut-off: ${effectiveDate})!`);

      // Persist to SQL Server in background
      syncUsageToDb(newItems).then((ok) => {
        if (ok) console.log('✅ Usage logs synced to SQL Server.');
      });

    } else if (type === 'PO_Inbound') {
      const newPODetails: Fact_PO_Detail[] = validData.map((d, i) => {
        const orderQty = Number(d.OrderQty || d.OrderedQtyKg || d.Quantity || 0);
        const receivedQty = Number(d.ReceivedQty || d.ReceivedQtyKg || 0);
        const remainQty = Number(d.PendingQty || d.PendingQtyKg || d.DeliverRemainder || d.RemainQty || (orderQty - receivedQty));
        const poNumber = d.PONumber || d.POID || d.PurchaseOrder || `PO-D365-${Date.now().toString().substr(6, 4)}`;

        return {
          PODetailID: `POD-IMP-${Date.now()}-${i}`,
          PO_Detail_ID: `POD-IMP-${Date.now()}-${i}`,
          POID: poNumber,
          PONumber: poNumber,
          FactoryID: d.ResolvedFactoryID || d.FactoryID || factories[0]?.FactoryID || 'FAC-DBD',
          FactoryCode: d.FactoryCode || 'DBD',
          MaterialID: d.ResolvedMaterialID || d.MaterialID || materials[0]?.MaterialID || 'MAT-2579',
          MaterialCode: d.MaterialCode || '2579',
          MaterialName: d.MaterialName || 'CORN NGMO',
          OrderQty: orderQty > 0 ? orderQty : remainQty,
          OrderedQtyKg: orderQty > 0 ? orderQty : remainQty,
          ReceivedQty: receivedQty,
          ReceivedQtyKg: receivedQty,
          RemainQty: remainQty > 0 ? remainQty : orderQty,
          PendingQtyKg: remainQty > 0 ? remainQty : orderQty,
          UnitPriceUSD: Number(d.UnitPriceUSD || (d.UnitPriceVND ? d.UnitPriceVND / 25000 : 2.5)),
          PromisedDeliveryDate: d.PromisedDeliveryDate || d.DeliveryDate || effectiveDate,
          SupplierName: d.SupplierName || 'Nhà Cung Cấp D365',
        };
      });

      setPODetails((prev) => [...newPODetails, ...prev]);
      showToast(`Đã import thành công ${newPODetails.length} dòng đơn hàng mua (PO Pending Inbound) cho Ngày Chốt ${effectiveDate}!`);

      // Persist to SQL Server in background
      syncPurchaseOrdersToDb([], newPODetails).then((ok) => {
        if (ok) console.log('✅ Purchase orders synced to SQL Server.');
      });
    }
  };

  const handleSaveNewMappings = (newMappings: Sys_Import_Mapping[]) => {
    setLearnedMappings((prev) => [...newMappings, ...prev]);
    showToast(`Đã lưu ${newMappings.length} quy tắc ánh xạ mới vào từ điển hệ thống!`);
    newMappings.forEach((m) => saveMappingToDb(m));
  };

  const handleReceiveShipment = (scheduleId: string, receivedQty: number) => {
    if (currentUser && !currentUser.permissions.canReceiveShipment) {
      alert(`Tài khoản "${currentUser.roleNameVN}" không có quyền tiếp nhận và nhập kho hàng Inbound.`);
      return;
    }

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
        MaterialCode: targetPODetail.MaterialCode || '2579',
        BatchNumber: `LOT-REC-${Date.now().toString().substr(7)}`,
        Quantity: receivedQty,
        UpdateDate: new Date().toISOString().split('T')[0],
        SnapshotDate: new Date().toISOString().split('T')[0],
        ExpiryDate: '2028-06-30',
        WarehouseLocation: 'Kho Nhập Vừa Nhận',
      };
      setInventorySOH((prev) => [newSOH, ...prev]);
      syncInventorySOHToDb([newSOH]);
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

  // --------------------------------------------------------------------------
  // Master Data Update & Delete Handlers with SQL Server Sync
  // --------------------------------------------------------------------------
  const handleUpdateMaterials = (updated: Dim_Material[]) => {
    setMaterials(updated);
    // Find newly added or updated items and sync
    updated.forEach((m) => saveMaterialToDb(m));
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (currentUser && !(currentUser.permissions?.canEditMasterData ?? false)) {
      alert(`Tài khoản "${currentUser.roleNameVN}" không có quyền xóa nguyên liệu khỏi Master Data.`);
      return;
    }
    setMaterials((prev) => prev.filter((m) => m.MaterialID !== materialId && m.MaterialCode !== materialId));
    deleteMaterialFromDb(materialId);
    showToast('Đã xóa nguyên liệu khỏi danh mục Master Data.');
  };

  const handleUpdateFactories = (updated: Dim_Factory[]) => {
    setFactories(updated);
    updated.forEach((f) => saveFactoryToDb(f));
  };

  const handleDeleteFactory = (factoryId: string) => {
    if (currentUser && !(currentUser.permissions?.canEditMasterData ?? false)) {
      alert(`Tài khoản "${currentUser.roleNameVN}" không có quyền xóa nhà máy khỏi Master Data.`);
      return;
    }
    setFactories((prev) => prev.filter((f) => f.FactoryID !== factoryId && f.InternalCode !== factoryId));
    deleteFactoryFromDb(factoryId);
    showToast('Đã xóa nhà máy khỏi danh mục.');
  };

  const handleUpdateSuppliers = (updated: Dim_Supplier[]) => {
    setSuppliers(updated);
    updated.forEach((s) => saveSupplierToDb(s));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (currentUser && !(currentUser.permissions?.canEditMasterData ?? false)) {
      alert(`Tài khoản "${currentUser.roleNameVN}" không có quyền xóa nhà cung cấp khỏi Master Data.`);
      return;
    }
    setSuppliers((prev) => prev.filter((s) => s.SupplierID !== supplierId && s.SupplierCode !== supplierId));
    deleteSupplierFromDb(supplierId);
    showToast('Đã xóa nhà cung cấp khỏi danh mục Master Data.');
  };

  const handleUpdateSubstitutions = (updated: Dim_Material_Substitution[]) => {
    setSubstitutions(updated);
    updated.forEach((s) => saveSubstitutionToDb(s));
  };

  const handleSaveMapping = (mapping: Sys_Import_Mapping) => {
    if (currentUser && !(currentUser.permissions?.canEditMasterData ?? false)) {
      alert(`Tài khoản "${currentUser.roleNameVN}" không có quyền chỉnh sửa cấu hình Master Data & Mapping.`);
      return;
    }
    setLearnedMappings((prev) => {
      const exists = prev.some((m) => m.MappingID === mapping.MappingID);
      if (exists) {
        return prev.map((m) => (m.MappingID === mapping.MappingID ? mapping : m));
      }
      return [mapping, ...prev];
    });
    saveMappingToDb(mapping);
    showToast('Đã lưu quy tắc ánh xạ vào từ điển hệ thống!');
  };

  const handleDeleteMapping = (mappingId: string) => {
    if (currentUser && !(currentUser.permissions?.canEditMasterData ?? false)) {
      alert(`Tài khoản "${currentUser.roleNameVN}" không có quyền chỉnh sửa cấu hình Master Data & Mapping.`);
      return;
    }
    setLearnedMappings((prev) => prev.filter((m) => m.MappingID !== mappingId));
    deleteMappingFromDb(mappingId);
    showToast('Đã xóa quy tắc ánh xạ khỏi từ điển.');
  };

  const handleSelectFactoryIds = (ids: string[]) => {
    setSelectedFactoryIds(ids);
    if (ids.length === 1) {
      setSelectedFactoryId(ids[0]);
    } else if (ids.includes('ALL') || ids.length === 0) {
      setSelectedFactoryId('ALL');
    } else {
      setSelectedFactoryId(ids[0]);
    }
  };

  // Fullscreen Login Gate if not authenticated
  if (!currentUser) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

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
        factoriesCount={factories.length}
        onResetData={handleResetData}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isDesktopSidebarCollapsed}
        onToggleCollapse={toggleDesktopSidebar}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          factories={factories}
          selectedFactoryId={selectedFactoryId}
          setSelectedFactoryId={setSelectedFactoryId}
          selectedFactoryIds={selectedFactoryIds}
          setSelectedFactoryIds={handleSelectFactoryIds}
          criticalAlertsCount={criticalAlertsCount}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          language={language}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          onToggleDesktopSidebar={toggleDesktopSidebar}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onLogout={handleLogout}
          onQuickSwitchUser={handleQuickSwitchUser}
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
                selectedFactoryIds={selectedFactoryIds}
                onSelectFactory={(id) => {
                  handleSelectFactoryIds(id === 'ALL' ? ['ALL'] : [id]);
                }}
                onSelectFactoryIds={handleSelectFactoryIds}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                language={language}
              />
            )}

            {currentTab === 'forecast' && (
              <ForecastManagement
                forecastVersions={forecastVersions}
                compareData={forecastCompareData}
                materials={materials}
                factories={factories}
                onUpdateVersions={(updated) => setForecastVersions(updated)}
                onUpdateCompareData={(updated) => setForecastCompareData(updated)}
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

            {currentTab === 'position-matrix' && (
              <PositionMatrixView
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
                initialSubTab="materials"
                canEditMasterData={currentUser?.permissions?.canEditMasterData ?? false}
                currentUserRoleName={currentUser?.roleNameVN}
                factories={factories}
                materials={materials}
                suppliers={suppliers}
                formulas={formulas}
                substitutions={substitutions}
                learnedMappings={learnedMappings}
                inventorySOH={inventorySOH}
                forecastDetails={forecastDetails}
                usageLogs={usageLogs}
                inboundSchedules={inboundSchedules}
                poHeaders={poHeaders}
                poDetails={poDetails}
                onUpdateMaterials={handleUpdateMaterials}
                onDeleteMaterial={handleDeleteMaterial}
                onUpdateFactories={handleUpdateFactories}
                onDeleteFactory={handleDeleteFactory}
                onUpdateSuppliers={handleUpdateSuppliers}
                onDeleteSupplier={handleDeleteSupplier}
                onUpdateSubstitutions={handleUpdateSubstitutions}
                onSaveMapping={handleSaveMapping}
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

      {/* User Authentication Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        factories={factories}
        initialMode={authModalMode}
      />

      {/* User Profile & Permissions Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          factories={factories}
        />
      )}

      {/* Admin User & Permissions Management Modal (MS SQL Server direct) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
        factories={factories}
        onUserListChanged={() => {
          showToast('Đã đồng bộ cơ sở dữ liệu tài khoản người dùng!');
        }}
      />
    </div>
  );
}

export default App;
