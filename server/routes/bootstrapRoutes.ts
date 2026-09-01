import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// ============================================================================
// BOOTSTRAP API: LOAD ALL OPERATIONAL DATA IN A SINGLE BATCH (GET /api/bootstrap/all)
// ============================================================================
router.get('/bootstrap/all', async (req, res) => {
  try {
    const [
      matsRes, facsRes, suppRes, subsRes, formsRes, formItemsRes, mapsRes,
      versRes, detsRes,
      sohRes, usageRes, inboundRes,
      poHeadersRes, poDetailsRes,
      posRes,
    ] = await Promise.all([
      executeQuery('SELECT * FROM dbo.dim_Material ORDER BY MaterialCode'),
      executeQuery('SELECT * FROM dbo.dim_Factory ORDER BY FactoryID'),
      executeQuery('SELECT * FROM dbo.dim_Supplier ORDER BY SupplierCode'),
      executeQuery('SELECT * FROM dbo.dim_Material_Substitution ORDER BY OriginalMaterialCode'),
      executeQuery('SELECT * FROM dbo.dim_Formula_BOM ORDER BY FormulaCode'),
      executeQuery('SELECT * FROM dbo.dim_Formula_Item ORDER BY FormulaID, ItemCode'),
      executeQuery('SELECT * FROM dbo.sys_Import_Mapping ORDER BY MappingType, HeaderKey'),

      executeQuery('SELECT * FROM dbo.fact_Forecast_Version ORDER BY RunDate DESC'),
      executeQuery('SELECT * FROM dbo.fact_Forecast_Detail ORDER BY RunDate DESC, SiteCode, MaterialCode'),

      executeQuery('SELECT * FROM dbo.fact_Inventory_SOH ORDER BY SnapshotDate DESC, WarehouseCode, MaterialCode'),
      executeQuery('SELECT * FROM dbo.fact_Production_Usage ORDER BY UsageDate DESC, FactoryCode, MaterialCode'),
      executeQuery('SELECT * FROM dbo.fact_Inbound_Schedule ORDER BY ExpectedArrivalDate ASC'),

      executeQuery('SELECT * FROM dbo.fact_Purchase_Order ORDER BY OrderDate DESC'),
      executeQuery('SELECT * FROM dbo.fact_PO_Detail ORDER BY PromisedDeliveryDate ASC'),

      executeQuery('SELECT * FROM dbo.fact_Position_Snapshot ORDER BY TotalPipeline_DOI_Days ASC'),
    ]);

    const isConnected = matsRes.success;

    // Structure the formulas with items
    const formulas = (formsRes.data || []).map((f: any) => ({
      ...f,
      Items: (formItemsRes.data || []).filter((item: any) => item.FormulaID === f.FormulaID),
    }));

    return res.json({
      success: true,
      source: isConnected ? 'MSSQL' : 'FALLBACK_LOCAL',
      data: {
        materials: matsRes.data || [],
        factories: facsRes.data || [],
        suppliers: suppRes.data || [],
        substitutions: subsRes.data || [],
        formulas,
        mappings: mapsRes.data || [],

        forecastVersions: (versRes.data || []).map((v: any) => ({
          VersionID: v.VersionID,
          VersionName: v.VersionName,
          RunDate: v.RunDate ? v.RunDate.toISOString().split('T')[0] : '',
          TotalForecastQty: v.TotalForecastQty || 0,
          SKUCount: v.SKUCount || 0,
          PlantCount: v.PlantCount || 0,
          UploadedAt: v.UploadedAt ? v.UploadedAt.toISOString() : new Date().toISOString(),
          UploadedBy: v.UploadedBy || 'System',
          SourceFileName: v.SourceFileName || '',
          Notes: v.Notes || '',
        })),
        forecastDetails: (detsRes.data || []).map((d: any) => ({
          ID: d.DetailID ? `FCST-${d.DetailID}` : `FCST-${d.VersionID}-${d.MaterialCode}`,
          VersionID: d.VersionID,
          RunDate: d.RunDate ? d.RunDate.toISOString().split('T')[0] : '',
          SiteCode: d.SiteCode,
          FactoryID: d.FactoryID || d.SiteCode || 'DBD',
          FactoryCode: d.FactoryCode || d.SiteCode,
          PlantName: d.PlantName,
          MaterialID: d.MaterialID || `MAT-${d.MaterialCode}`,
          MaterialCode: d.MaterialCode,
          MaterialName: d.MaterialName,
          Division: d.Division || 'Livestock',
          ForecastQty: d.ForecastQtyKg || d.ForecastQty || 0,
        })),

        inventorySOH: (sohRes.data || []).map((s: any) => ({
          SOH_ID: s.InventoryID || `SOH-${s.WarehouseCode}-${s.MaterialCode}`,
          FactoryID: s.FactoryID || s.WarehouseCode || 'DBD',
          WarehouseCode: s.WarehouseCode,
          MaterialID: s.MaterialID || `MAT-${s.MaterialCode}`,
          MaterialCode: s.MaterialCode,
          MaterialName: s.MaterialName,
          Quantity: s.SOHQtyKg || s.Quantity || 0,
          AveragePrice: s.AveragePrice || 0,
          SnapshotDate: s.SnapshotDate ? s.SnapshotDate.toISOString().split('T')[0] : '',
          UpdateDate: s.SnapshotDate ? s.SnapshotDate.toISOString().split('T')[0] : '',
          SubInventory: s.SubInventory || '',
          WarehouseLocation: s.WarehouseLocation || s.SubInventory || 'Kho D365',
          OrgCode: s.OrgCode || '',
          Region: s.Region || 'SOUTH',
        })),
        usageLogs: (usageRes.data || []).map((u: any) => ({
          UsageID: u.UsageID,
          FactoryID: u.FactoryID || u.FactoryCode || 'DBD',
          FactoryCode: u.FactoryCode,
          MaterialID: u.MaterialID || `MAT-${u.MaterialCode}`,
          MaterialCode: u.MaterialCode,
          MaterialName: u.MaterialName,
          LogDate: u.UsageDate ? u.UsageDate.toISOString().split('T')[0] : '',
          ActualQty: u.ActualUsageKg || 0,
          BatchNumber: u.BatchNumber || '',
          RecipeCode: u.FormulaCode || 'AUTO_IMPORT',
          Division: u.Division || 'Livestock',
        })),
        inboundSchedules: (inboundRes.data || []).map((i: any) => ({
          ScheduleID: i.ScheduleID,
          PODetailID: i.PO_Detail_ID || i.PODetailID,
          PONumber: i.PONumber,
          FactoryID: i.FactoryID,
          FactoryCode: i.FactoryCode,
          MaterialCode: i.MaterialCode,
          MaterialName: i.MaterialName,
          SupplierName: i.SupplierName,
          ScheduledQtyKg: i.ScheduledQtyKg || 0,
          ExpectedArrivalDate: i.ExpectedArrivalDate ? i.ExpectedArrivalDate.toISOString().split('T')[0] : '',
          ActualArrivalDate: i.ActualArrivalDate ? i.ActualArrivalDate.toISOString().split('T')[0] : '',
          Status: i.Status || 'Scheduled',
          ContainerNumber: i.ContainerNumber || '',
          TruckPlate: i.TruckPlate || '',
          PortOfDischarge: i.PortOfDischarge || '',
          DriverName: i.DriverName || '',
          DriverPhone: i.DriverPhone || '',
          Notes: i.Notes || '',
        })),

        poHeaders: (poHeadersRes.data || []).map((h: any) => ({
          PO_Header_ID: h.PO_Header_ID,
          PONumber: h.PONumber,
          SupplierID: h.SupplierID,
          SupplierCode: h.SupplierCode,
          SupplierName: h.SupplierName,
          OrderDate: h.OrderDate ? h.OrderDate.toISOString().split('T')[0] : '',
          TotalAmountUSD: h.TotalAmountUSD || 0,
          TotalAmountVND: h.TotalAmountVND || 0,
          PaymentTerms: h.PaymentTerms || 'Net 30',
          Incoterm: h.Incoterm || 'DDP',
          PurchaserName: h.PurchaserName || 'Purchaser',
          ContractNumber: h.ContractNumber || '',
          Status: h.Status || 'Open',
        })),
        poDetails: (poDetailsRes.data || []).map((d: any) => ({
          PODetailID: d.PO_Detail_ID || `POD-${d.PONumber}-${d.MaterialCode}`,
          POID: d.PONumber || d.PO_Header_ID,
          PONumber: d.PONumber,
          FactoryID: d.FactoryID || d.FactoryCode || 'DBD',
          FactoryCode: d.FactoryCode || d.FactoryID,
          MaterialID: d.MaterialID || `MAT-${d.MaterialCode}`,
          MaterialCode: d.MaterialCode,
          MaterialName: d.MaterialName,
          OrderQty: d.OrderedQtyKg || d.OrderQty || 0,
          ReceivedQty: d.ReceivedQtyKg || d.ReceivedQty || 0,
          RemainQty: d.PendingQtyKg || d.RemainQty || 0,
          UnitPriceUSD: d.UnitPriceUSD || 0,
          UnitPriceVND: d.UnitPriceVND || 0,
          LineAmountVND: d.LineAmountVND || 0,
          AmountRemainderVND: d.AmountRemainderVND || 0,
          DeliveryDate: d.DeliveryDate ? d.DeliveryDate.toISOString().split('T')[0] : '',
          PromisedDeliveryDate: d.PromisedDeliveryDate ? d.PromisedDeliveryDate.toISOString().split('T')[0] : '',
          LineStatus: d.LineStatus || 'Open',
          TaxGroup: d.TaxGroup || 'NonVAT',
          Incoterm: d.Incoterm || 'DDP',
          CountryOfOrigin: d.CountryOfOrigin || 'Vietnam',
          Notes: d.Notes || '',
          PAGNumber: d.PAGNumber || '',
          SupplierName: d.SupplierName || '',
        })),

        positions: (posRes.data || []).map((r: any) => ({
          ...r,
          SnapshotDate: r.SnapshotDate ? r.SnapshotDate.toISOString().split('T')[0] : '',
          StockoutDateSOH: r.StockoutDateSOH ? r.StockoutDateSOH.toISOString().split('T')[0] : '',
          MaxProtectedDate: r.MaxProtectedDate ? r.MaxProtectedDate.toISOString().split('T')[0] : '',
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
