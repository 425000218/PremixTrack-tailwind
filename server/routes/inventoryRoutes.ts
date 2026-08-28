import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// Inventory: SOH (fact_Inventory_SOH)
router.get('/inventory/soh', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.fact_Inventory_SOH ORDER BY SnapshotDate DESC, WarehouseCode, MaterialCode');
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

// Inventory: Movements & WIP Issue (fact_Inventory_Movement)
router.get('/inventory/movements', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.fact_Inventory_Movement ORDER BY ReportDate DESC, FactoryCode, MaterialCode');
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

// Supply Chain: Cover Date & DOI Gap Analysis
router.get('/inventory/cover-analysis', async (req, res) => {
  const query = `
    SELECT 
      s.MaterialCode,
      m.Name_VN AS MaterialName,
      s.WarehouseCode,
      s.SOHQtyKg,
      s.AveragePrice,
      ISNULL(mov.WipIssueQtyKg, 0) AS WipIssueQtyKg,
      ROUND(ISNULL(mov.WipIssueQtyKg, 0) / 30.0, 2) AS DailyBurnRateKg,
      CASE 
        WHEN ISNULL(mov.WipIssueQtyKg, 0) > 0 
        THEN ROUND(s.SOHQtyKg / (mov.WipIssueQtyKg / 30.0), 1)
        ELSE 999.0
      END AS SOH_DOI_Days,
      DATEADD(day, 
        CASE 
          WHEN ISNULL(mov.WipIssueQtyKg, 0) > 0 
          THEN CAST(ROUND(s.SOHQtyKg / (mov.WipIssueQtyKg / 30.0), 0) AS INT)
          ELSE 365 
        END, 
        s.SnapshotDate
      ) AS StockoutDate,
      ISNULL(po.TotalPendingKg, 0) AS TotalPendingPOKg,
      CASE 
        WHEN ISNULL(mov.WipIssueQtyKg, 0) > 0 
        THEN ROUND(ISNULL(po.TotalPendingKg, 0) / (mov.WipIssueQtyKg / 30.0), 1)
        ELSE 0.0
      END AS PO_Cover_Days
    FROM dbo.fact_Inventory_SOH s
    LEFT JOIN dbo.dim_Material m ON s.MaterialCode = m.MaterialCode
    LEFT JOIN dbo.fact_Inventory_Movement mov ON s.MaterialCode = mov.MaterialCode AND s.WarehouseCode = mov.FactoryCode
    LEFT JOIN (
      SELECT MaterialCode, SUM(PendingQtyKg) AS TotalPendingKg
      FROM dbo.fact_PO_Detail
      WHERE PendingQtyKg > 0
      GROUP BY MaterialCode
    ) po ON s.MaterialCode = po.MaterialCode
    ORDER BY SOH_DOI_Days ASC
  `;
  const result = await executeQuery(query);
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

export default router;
