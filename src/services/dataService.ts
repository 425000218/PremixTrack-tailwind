import { fetchWithAuth } from '../utils/apiClient';
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
  Fact_Position_Snapshot,
} from '../types';

import {
  mockFactories,
  mockMaterials,
  mockSuppliers,
  mockForecastDetails,
  initialForecastVersions,
  mockInventorySOH,
  mockPOHeaders,
  mockPODetails,
  mockInboundSchedules,
  mockUsageLogs,
  mockFormulas,
  mockInitialMappings,
  mockPositionSnapshots,
} from '../data/mockData';

export interface BootstrapData {
  isOnline: boolean;
  source: 'MSSQL' | 'FALLBACK_LOCAL';
  factories: Dim_Factory[];
  materials: Dim_Material[];
  suppliers: Dim_Supplier[];
  substitutions: Dim_Material_Substitution[];
  formulas: Formula_BOM[];
  mappings: Sys_Import_Mapping[];
  forecastVersions: ForecastRunVersion[];
  forecastDetails: Fact_Forecast_Detail[];
  inventorySOH: Fact_Inventory_SOH[];
  usageLogs: Fact_Production_Usage[];
  inboundSchedules: Fact_Inbound_Schedule[];
  poHeaders: Fact_PurchaseOrder[];
  poDetails: Fact_PO_Detail[];
  positions: Fact_Position_Snapshot[];
}

/**
 * Bulk-load all operational and master data from SQL Server with graceful fallback
 */
export async function loadAllBootstrapData(): Promise<BootstrapData> {
  try {
    const res = await fetchWithAuth('/api/bootstrap/all');
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();

    if (json.success && json.data) {
      const d = json.data;
      const hasRealMaterials = Array.isArray(d.materials) && d.materials.length > 0;

      return {
        isOnline: json.source === 'MSSQL' && hasRealMaterials,
        source: json.source,
        factories: hasRealMaterials ? d.factories : mockFactories,
        materials: hasRealMaterials ? d.materials : mockMaterials,
        suppliers: hasRealMaterials && d.suppliers.length > 0 ? d.suppliers : mockSuppliers,
        substitutions: hasRealMaterials && d.substitutions.length > 0 ? d.substitutions : [],
        formulas: hasRealMaterials && d.formulas.length > 0 ? d.formulas : mockFormulas,
        mappings: hasRealMaterials && d.mappings.length > 0 ? d.mappings : mockInitialMappings,
        forecastVersions: Array.isArray(d.forecastVersions) && d.forecastVersions.length > 0 ? d.forecastVersions : initialForecastVersions,
        forecastDetails: Array.isArray(d.forecastDetails) && d.forecastDetails.length > 0 ? d.forecastDetails : mockForecastDetails,
        inventorySOH: Array.isArray(d.inventorySOH) && d.inventorySOH.length > 0 ? d.inventorySOH : mockInventorySOH,
        usageLogs: Array.isArray(d.usageLogs) && d.usageLogs.length > 0 ? d.usageLogs : mockUsageLogs,
        inboundSchedules: Array.isArray(d.inboundSchedules) && d.inboundSchedules.length > 0 ? d.inboundSchedules : mockInboundSchedules,
        poHeaders: Array.isArray(d.poHeaders) && d.poHeaders.length > 0 ? d.poHeaders : mockPOHeaders,
        poDetails: Array.isArray(d.poDetails) && d.poDetails.length > 0 ? d.poDetails : mockPODetails,
        positions: Array.isArray(d.positions) && d.positions.length > 0 ? d.positions : mockPositionSnapshots,
      };
    }
  } catch (err) {
    console.warn('⚠️ Không thể tải dữ liệu từ SQL Server, chuyển sang chế độ dự phòng:', err);
  }

  // Graceful fallback
  return {
    isOnline: false,
    source: 'FALLBACK_LOCAL',
    factories: mockFactories,
    materials: mockMaterials,
    suppliers: mockSuppliers,
    substitutions: [],
    formulas: mockFormulas,
    mappings: mockInitialMappings,
    forecastVersions: initialForecastVersions,
    forecastDetails: mockForecastDetails,
    inventorySOH: mockInventorySOH,
    usageLogs: mockUsageLogs,
    inboundSchedules: mockInboundSchedules,
    poHeaders: mockPOHeaders,
    poDetails: mockPODetails,
    positions: mockPositionSnapshots,
  };
}

// ----------------------------------------------------------------------------
// Master Data Mutations
// ----------------------------------------------------------------------------
export async function saveMaterialToDb(mat: Dim_Material): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/masterdata/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mat),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function deleteMaterialFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`/api/masterdata/materials/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function saveFactoryToDb(fac: Dim_Factory): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/masterdata/factories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fac),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function deleteFactoryFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`/api/masterdata/factories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function saveSupplierToDb(sup: Dim_Supplier): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/masterdata/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sup),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function deleteSupplierFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`/api/masterdata/suppliers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function saveSubstitutionToDb(sub: Dim_Material_Substitution): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/masterdata/substitutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function deleteSubstitutionFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`/api/masterdata/substitutions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function saveMappingToDb(mapping: Sys_Import_Mapping): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/masterdata/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function deleteMappingFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`/api/masterdata/mappings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Operational Data Mutations (Forecast, SOH, PO, Usage)
// ----------------------------------------------------------------------------
export async function syncForecastToDb(versions: ForecastRunVersion[], details: Fact_Forecast_Detail[]): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/forecast/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versions, details }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function deleteForecastVersionFromDb(versionId: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`/api/forecast/versions/${versionId}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function syncInventorySOHToDb(items: Fact_Inventory_SOH[], snapshotDate?: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/inventory/soh/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, snapshotDate }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function syncUsageToDb(items: Fact_Production_Usage[]): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/inventory/usage/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function syncPurchaseOrdersToDb(headers: Fact_PurchaseOrder[], details: Fact_PO_Detail[]): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/purchase-orders/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, details }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function triggerPositionCalculation(
  snapshotDate: string,
  cutoffWorkingDays: number = 22,
  standardMonthDays: number = 28
): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/position/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotDate, cutoffWorkingDays, standardMonthDays }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}
