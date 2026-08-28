import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';
import { mockPositionSnapshots } from '../../src/data/mockData';

const router = Router();

// -- POSITION MATRIX & SCM SUPPLY CHAIN ENGINE (fact_Position_Snapshot) --------
router.get('/position/matrix', async (req, res) => {
  try {
    const { snapshotDate = '2026-08-25', region, division, materialCode } = req.query;
    
    let query = `
      SELECT 
        PositionID,
        SnapshotDate,
        CutoffWorkingDays,
        StandardMonthDays,
        Region,
        RMGroup,
        Division,
        FactoryCode,
        MaterialCode,
        MaterialName,
        PIC,
        SOHQtyKg,
        MTD_Production_PrevMonth_Kg,
        MTD_Production_CurrMonth_Kg,
        MonthlyUsageForecastKg,
        PctUsedUsage,
        DailyStandardUsageKg,
        DOI_Standard_Days,
        DOI_Actual_MTD_Days,
        StockoutDateSOH,
        EmergencyBufferQtyKg,
        DOI_AfterBuffer_Days,
        PO_PendingInboundKg,
        TotalPipeline_DOI_Days,
        MaxProtectedDate
      FROM dbo.fact_Position_Snapshot
      WHERE SnapshotDate = @SnapshotDate
    `;
    const params: Record<string, any> = { SnapshotDate: snapshotDate };

    if (region && region !== 'ALL') {
      query += ` AND Region = @Region`;
      params.Region = region;
    }
    if (division && division !== 'ALL') {
      query += ` AND Division = @Division`;
      params.Division = division;
    }
    if (materialCode) {
      query += ` AND MaterialCode = @MaterialCode`;
      params.MaterialCode = materialCode;
    }

    query += ` ORDER BY MaterialCode, Region, FactoryCode`;

    const result = await executeQuery(query, params);
    let rows = result.success && result.data.length > 0 ? result.data : [];

    if (rows.length === 0) {
      rows = mockPositionSnapshots.filter((p) => {
        if (region && region !== 'ALL' && p.Region !== region) return false;
        if (division && division !== 'ALL' && p.Division !== division) return false;
        if (materialCode && p.MaterialCode !== materialCode) return false;
        return true;
      });
    }

    // Calculate SUBTOTAL Summary (matching Excel header formulas exactly)
    const totalSOH = rows.reduce((sum: number, r: any) => sum + (Number(r.SOHQtyKg) || 0), 0);
    const totalMTDPrev = rows.reduce((sum: number, r: any) => sum + (Number(r.MTD_Production_PrevMonth_Kg) || 0), 0);
    const totalMTDCurr = rows.reduce((sum: number, r: any) => sum + (Number(r.MTD_Production_CurrMonth_Kg) || 0), 0);
    const totalMonthlyUsage = rows.reduce((sum: number, r: any) => sum + (Number(r.MonthlyUsageForecastKg) || 0), 0);
    const totalBuffer = rows.reduce((sum: number, r: any) => sum + (Number(r.EmergencyBufferQtyKg) || 0), 0);
    const totalPOPending = rows.reduce((sum: number, r: any) => sum + (Number(r.PO_PendingInboundKg) || 0), 0);

    const standardDays = rows[0]?.StandardMonthDays || 28;
    const cutoffDays = rows[0]?.CutoffWorkingDays || 22;

    const totalDailyUsage = totalMonthlyUsage > 0 ? Math.round(totalMonthlyUsage / standardDays) : 0;
    const overallPctUsed = totalMonthlyUsage > 0 ? Number((totalMTDCurr / totalMonthlyUsage).toFixed(4)) : 0;
    const overallDOIStandard = totalDailyUsage > 0 ? Math.round(totalSOH / totalDailyUsage) : 999;
    const overallDOIMTD = totalMTDCurr > 0 && cutoffDays > 0 ? Math.round(totalSOH / (totalMTDCurr / cutoffDays)) : 999;

    const baseDate = new Date(String(snapshotDate));
    const overallStockoutDate = new Date(baseDate.getTime() + overallDOIStandard * 86400000).toISOString().split('T')[0];
    const overallDOIAfterBuffer = totalDailyUsage > 0 ? Math.round((totalSOH + totalBuffer) / totalDailyUsage) : overallDOIStandard;
    const overallTotalPipelineDOI = totalDailyUsage > 0 ? Math.round((totalSOH + totalPOPending) / totalDailyUsage) : overallDOIStandard;
    const overallMaxProtectedDate = new Date(baseDate.getTime() + overallTotalPipelineDOI * 86400000).toISOString().split('T')[0];

    const summary = {
      TotalSOHQtyKg: totalSOH,
      TotalMTDPrevMonthKg: totalMTDPrev,
      TotalMTDCurrMonthKg: totalMTDCurr,
      TotalMonthlyUsageForecastKg: totalMonthlyUsage,
      OverallPctUsedUsage: overallPctUsed,
      TotalDailyStandardUsageKg: totalDailyUsage,
      OverallDOIStandardDays: overallDOIStandard,
      OverallDOIActualMTDDays: overallDOIMTD,
      OverallCoverageTill1: overallStockoutDate,
      TotalEmergencyBufferKg: totalBuffer,
      OverallDOIAfterBufferDays: overallDOIAfterBuffer,
      TotalPOPendingKg: totalPOPending,
      OverallTotalPipelineDOIDays: overallTotalPipelineDOI,
      OverallMaxProtectedDate: overallMaxProtectedDate,
    };

    res.json({
      success: true,
      snapshotDate,
      cutoffWorkingDays: cutoffDays,
      standardMonthDays: standardDays,
      rowCount: rows.length,
      summary,
      data: rows,
    });
  } catch (err: any) {
    console.error('[API /api/position/matrix] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Calculate & Refresh Position Snapshot Stored Procedure
router.post('/position/calculate', async (req, res) => {
  try {
    const { snapshotDate = '2026-08-25', cutoffWorkingDays = 22, standardMonthDays = 28 } = req.body;
    
    const spQuery = `
      EXEC dbo.sp_Calculate_Position_Matrix 
        @SnapshotDate = @SnapshotDate, 
        @CutoffWorkingDays = @CutoffWorkingDays, 
        @StandardMonthDays = @StandardMonthDays
    `;
    const result = await executeQuery(spQuery, {
      SnapshotDate: snapshotDate,
      CutoffWorkingDays: Number(cutoffWorkingDays),
      StandardMonthDays: Number(standardMonthDays),
    });

    if (result.success) {
      return res.json({ success: true, message: `T�nh to�n ho�n t?t cho ng�y ${snapshotDate}` });
    }
    res.status(400).json({ success: false, message: result.error });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Column Header Dictionary (Enterprise Mode vs Legacy Mode)
router.get('/position/headers', (req, res) => {
  const { mode = 'Enterprise' } = req.query;
  const isEnterprise = mode === 'Enterprise';

  const headers = [
    { key: 'Region', label: isEnterprise ? 'Khu V?c' : 'REGION', width: 90, type: 'badge' },
    { key: 'RMGroup', label: isEnterprise ? 'Nh�m NL' : 'RM Group', width: 90, type: 'text' },
    { key: 'Division', label: isEnterprise ? 'Ng�nh' : 'Division', width: 100, type: 'text' },
    { key: 'FactoryCode', label: isEnterprise ? 'Nh� M�y' : 'FACTORY', width: 90, type: 'badge' },
    { key: 'MaterialCode', label: isEnterprise ? 'M� SKU' : 'Item number', width: 100, type: 'text' },
    { key: 'MaterialName', label: isEnterprise ? 'T�n Nguy�n Li?u' : 'Product name', width: 220, type: 'text' },
    { key: 'PIC', label: isEnterprise ? 'Ph? Tr�ch' : 'PIC', width: 100, type: 'text' },
    { key: 'SOHQtyKg', label: isEnterprise ? 'T?n Kho SOH (kg)' : 'SOH', width: 120, type: 'number' },
    { key: 'MTD_Production_PrevMonth_Kg', label: isEnterprise ? 'Luy K? T7 (kg)' : 'MTD Production July(26)', width: 130, type: 'number' },
    { key: 'MTD_Production_CurrMonth_Kg', label: isEnterprise ? 'Luy K? T8 (kg)' : 'MTD Production Aug(26)', width: 130, type: 'number' },
    { key: 'MonthlyUsageForecastKg', label: isEnterprise ? 'K? Ho?ch Th�ng (kg)' : 'Usage/month', width: 140, type: 'number' },
    { key: 'PctUsedUsage', label: isEnterprise ? '% Ti?n �? D�ng' : '% Used Usage', width: 110, type: 'percent' },
    { key: 'DailyStandardUsageKg', label: isEnterprise ? '�?nh M?c / Ng�y' : 'Usage/Day', width: 120, type: 'number' },
    { key: 'DOI_Standard_Days', label: isEnterprise ? 'Ng�y T?n SOH (Plan)' : 'Covered day Usage', width: 120, type: 'number_alert' },
    { key: 'DOI_Actual_MTD_Days', label: isEnterprise ? 'Ng�y T?n SOH (MTD)' : 'Covered day MTD', width: 120, type: 'number' },
    { key: 'StockoutDateSOH', label: isEnterprise ? 'Ng�y H?t H�ng SOH' : 'Coverage till (1)', width: 120, type: 'date_alert' },
    { key: 'EmergencyBufferQtyKg', label: isEnterprise ? 'Lu?ng B� �?p (Arrange)' : 'Arrange More', width: 130, type: 'number_highlight' },
    { key: 'DOI_AfterBuffer_Days', label: isEnterprise ? 'Ng�y T?n Sau B�' : 'Covered day (2)', width: 120, type: 'number' },
    { key: 'PO_PendingInboundKg', label: isEnterprise ? 'PO �ang V? (kg)' : 'PO PENDING', width: 130, type: 'number_blue' },
    { key: 'TotalPipeline_DOI_Days', label: isEnterprise ? 'T?ng Ng�y Che Ph?' : 'Covered day (3)', width: 130, type: 'number_strong' },
    { key: 'MaxProtectedDate', label: isEnterprise ? 'Ng�y B?o V? T?i �a' : 'Coverage till (2)', width: 130, type: 'date_strong' },
  ];

  res.json({ success: true, mode, headers });
});

export default router;
