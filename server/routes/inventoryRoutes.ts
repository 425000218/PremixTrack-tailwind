import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// ============================================================================
// 1. INVENTORY: ALL DATA (GET /api/inventory/all)
// ============================================================================
router.get('/inventory/all', async (req, res) => {
  try {
    const [sohRes, usageRes, inboundRes, movRes] = await Promise.all([
      executeQuery('SELECT * FROM dbo.fact_Inventory_SOH ORDER BY SnapshotDate DESC, WarehouseCode, MaterialCode'),
      executeQuery('SELECT * FROM dbo.fact_Production_Usage ORDER BY UsageDate DESC, FactoryCode, MaterialCode'),
      executeQuery('SELECT * FROM dbo.fact_Inbound_Schedule ORDER BY ExpectedArrivalDate ASC'),
      executeQuery('SELECT * FROM dbo.fact_Inventory_Movement ORDER BY ReportDate DESC'),
    ]);

    return res.json({
      success: true,
      source: sohRes.success ? 'MSSQL' : 'FALLBACK_LOCAL',
      data: {
        inventorySOH: (sohRes.data || []).map((s: any) => ({
          InventoryID: s.InventoryID,
          FactoryID: s.FactoryID,
          WarehouseCode: s.WarehouseCode,
          MaterialID: s.MaterialID,
          MaterialCode: s.MaterialCode,
          MaterialName: s.MaterialName,
          SOHQtyKg: s.SOHQtyKg || 0,
          AveragePrice: s.AveragePrice || 0,
          SnapshotDate: s.SnapshotDate ? s.SnapshotDate.toISOString().split('T')[0] : '',
          SubInventory: s.SubInventory || '',
          OrgCode: s.OrgCode || '',
          Region: s.Region || 'SOUTH',
        })),
        usageLogs: (usageRes.data || []).map((u: any) => ({
          UsageID: u.UsageID,
          FactoryID: u.FactoryID,
          FactoryCode: u.FactoryCode,
          MaterialID: u.MaterialID,
          MaterialCode: u.MaterialCode,
          MaterialName: u.MaterialName,
          UsageDate: u.UsageDate ? u.UsageDate.toISOString().split('T')[0] : '',
          ActualUsageKg: u.ActualUsageKg || 0,
          BatchNumber: u.BatchNumber || '',
          FormulaCode: u.FormulaCode || '',
          Division: u.Division || 'Livestock',
        })),
        inboundSchedules: (inboundRes.data || []).map((i: any) => ({
          ScheduleID: i.ScheduleID,
          PO_Detail_ID: i.PO_Detail_ID,
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
        movements: movRes.data || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 2. INVENTORY: SOH (fact_Inventory_SOH)
// ============================================================================
router.get('/inventory/soh', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.fact_Inventory_SOH ORDER BY SnapshotDate DESC, WarehouseCode, MaterialCode');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

router.post('/inventory/soh/bulk', async (req, res) => {
  try {
    const { items, snapshotDate } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu tồn kho trống.' });
    }

    const sDate = snapshotDate || items[0]?.SnapshotDate || new Date().toISOString().split('T')[0];

    // Delete existing records for the same snapshot date
    await executeQuery('DELETE FROM dbo.fact_Inventory_SOH WHERE SnapshotDate = @sDate', { sDate });

    // Chunk insert (100 rows per chunk)
    const chunkSize = 100;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      let valuesSql = '';
      const params: Record<string, any> = {};

      chunk.forEach((item: any, idx: number) => {
        const idKey = `id_${idx}`;
        const facKey = `fac_${idx}`;
        const whKey = `wh_${idx}`;
        const matIdKey = `matid_${idx}`;
        const matCodeKey = `matcode_${idx}`;
        const qtyKey = `qty_${idx}`;
        const priceKey = `price_${idx}`;
        const snapKey = `snap_${idx}`;
        const subKey = `sub_${idx}`;
        const orgKey = `org_${idx}`;
        const regKey = `reg_${idx}`;

        params[idKey] = item.InventoryID || `SOH-${item.WarehouseCode || item.FactoryID}-${item.MaterialCode}-${sDate}`;
        params[facKey] = item.FactoryID || item.WarehouseCode || 'DBD';
        params[whKey] = item.WarehouseCode || item.FactoryID || 'DBD';
        params[matIdKey] = item.MaterialID || `MAT-${item.MaterialCode}`;
        params[matCodeKey] = item.MaterialCode;
        params[qtyKey] = item.SOHQtyKg || item.Quantity || 0;
        params[priceKey] = item.AveragePrice || 0;
        params[snapKey] = sDate;
        params[subKey] = item.SubInventory || '';
        params[orgKey] = item.OrgCode || '';
        params[regKey] = item.Region || 'SOUTH';

        valuesSql += (idx > 0 ? ',' : '') + `(@${idKey}, @${facKey}, @${whKey}, @${matIdKey}, @${matCodeKey}, @${qtyKey}, @${priceKey}, @${snapKey}, @${subKey}, @${orgKey}, @${regKey})`;
      });

      const insertSql = `
        INSERT INTO dbo.fact_Inventory_SOH (InventoryID, FactoryID, WarehouseCode, MaterialID, MaterialCode, SOHQtyKg, AveragePrice, SnapshotDate, SubInventory, OrgCode, Region)
        VALUES ${valuesSql};
      `;
      await executeQuery(insertSql, params);
    }

    return res.json({ success: true, message: `Đã nạp thành công ${items.length} bản ghi tồn kho SOH ngày ${sDate}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 3. INVENTORY: USAGE LOGS (fact_Production_Usage)
// ============================================================================
router.get('/inventory/usage', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.fact_Production_Usage ORDER BY UsageDate DESC, FactoryCode, MaterialCode');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

router.post('/inventory/usage/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu tiêu hao trống.' });
    }

    const chunkSize = 100;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      let valuesSql = '';
      const params: Record<string, any> = {};

      chunk.forEach((u: any, idx: number) => {
        const idKey = `id_${idx}`;
        const facKey = `fac_${idx}`;
        const facCodeKey = `fc_${idx}`;
        const matIdKey = `matid_${idx}`;
        const matCodeKey = `matcode_${idx}`;
        const dateKey = `date_${idx}`;
        const qtyKey = `qty_${idx}`;
        const batchKey = `batch_${idx}`;
        const formKey = `form_${idx}`;
        const divKey = `div_${idx}`;

        params[idKey] = u.UsageID || `USE-${u.FactoryCode}-${u.MaterialCode}-${u.UsageDate}-${idx}`;
        params[facKey] = u.FactoryID || u.FactoryCode || 'DBD';
        params[facCodeKey] = u.FactoryCode || 'DBD';
        params[matIdKey] = u.MaterialID || `MAT-${u.MaterialCode}`;
        params[matCodeKey] = u.MaterialCode;
        params[dateKey] = u.UsageDate;
        params[qtyKey] = u.ActualUsageKg || 0;
        params[batchKey] = u.BatchNumber || 'BATCH-01';
        params[formKey] = u.FormulaCode || '';
        params[divKey] = u.Division || 'Livestock';

        valuesSql += (idx > 0 ? ',' : '') + `(@${idKey}, @${facKey}, @${facCodeKey}, @${matIdKey}, @${matCodeKey}, @${dateKey}, @${qtyKey}, @${batchKey}, @${formKey}, @${divKey})`;
      });

      const insertSql = `
        INSERT INTO dbo.fact_Production_Usage (UsageID, FactoryID, FactoryCode, MaterialID, MaterialCode, UsageDate, ActualUsageKg, BatchNumber, FormulaCode, Division)
        VALUES ${valuesSql};
      `;
      await executeQuery(insertSql, params);
    }

    return res.json({ success: true, message: `Đã nạp thành công ${items.length} bản ghi tiêu hao sản xuất.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 4. INVENTORY: INBOUND SCHEDULES (fact_Inbound_Schedule)
// ============================================================================
router.get('/inventory/inbound', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.fact_Inbound_Schedule ORDER BY ExpectedArrivalDate ASC');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

export default router;
