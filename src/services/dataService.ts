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
  Sys_Import_Mapping,
  Fact_Position_Snapshot,
} from '../types';

export interface BootstrapData {
  isOnline: boolean;
  source: 'MSSQL' | 'FALLBACK_LOCAL';
  factories: Dim_Factory[];
  materials: Dim_Material[];
  suppliers: Dim_Supplier[];
  substitutions: Dim_Material_Substitution[];
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
 * Bulk-load all operational and master data directly from MS SQL Server (100% Real Data)
 */
export async function loadAllBootstrapData(): Promise<BootstrapData> {
  try {
    const res = await fetchWithAuth('/api/bootstrap/all');
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();

    if (json.success && json.data) {
      const d = json.data;

      return {
        isOnline: json.source === 'MSSQL',
        source: json.source,
        factories: Array.isArray(d.factories) ? d.factories : [],
        materials: Array.isArray(d.materials) ? d.materials : [],
        suppliers: Array.isArray(d.suppliers) ? d.suppliers : [],
        substitutions: Array.isArray(d.substitutions) ? d.substitutions : [],
        mappings: Array.isArray(d.mappings) ? d.mappings : [],
        forecastVersions: Array.isArray(d.forecastVersions) ? d.forecastVersions : [],
        forecastDetails: Array.isArray(d.forecastDetails) ? d.forecastDetails : [],
        inventorySOH: Array.isArray(d.inventorySOH) ? d.inventorySOH : [],
        usageLogs: Array.isArray(d.usageLogs) ? d.usageLogs : [],
        inboundSchedules: Array.isArray(d.inboundSchedules) ? d.inboundSchedules : [],
        poHeaders: Array.isArray(d.poHeaders) ? d.poHeaders : [],
        poDetails: Array.isArray(d.poDetails) ? d.poDetails : [],
        positions: Array.isArray(d.positions) ? d.positions : [],
      };
    }
  } catch (err) {
    console.warn('⚠️ Không thể tải dữ liệu từ SQL Server:', err);
  }

  // Database offline - no mock data fallback
  return {
    isOnline: false,
    source: 'MSSQL',
    factories: [],
    materials: [],
    suppliers: [],
    substitutions: [],
    mappings: [],
    forecastVersions: [],
    forecastDetails: [],
    inventorySOH: [],
    usageLogs: [],
    inboundSchedules: [],
    poHeaders: [],
    poDetails: [],
    positions: [],
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
