import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// -----------------------------------------------------------------------------
// S&OP INVENTORY & SUPPLY POSITION MATRIX (D365 FO Live & Cached)
// -----------------------------------------------------------------------------

router.get('/position/matrix', async (req, res) => {
  try {
    const { snapshotDate = '2026-08-28', factoryId, division, category, search } = req.query;

    let whereClause = 'WHERE SnapshotDate = @SnapshotDate';
    const params: Record<string, any> = { SnapshotDate: snapshotDate };

    if (factoryId && factoryId !== 'ALL') {
      whereClause += ' AND FactoryCode = @FactoryCode';
      params.FactoryCode = factoryId;
    }

    if (division && division !== 'ALL') {
      whereClause += ' AND Division = @Division';
      params.Division = division;
    }

    if (category && category !== 'ALL') {
      whereClause += ' AND RMGroup = @RMGroup';
      params.RMGroup = category;
    }

    if (search) {
      whereClause += ' AND (MaterialCode LIKE @Search OR MaterialName LIKE @Search)';
      params.Search = `%${search}%`;
    }

    const query = `
      SELECT 
        RecordID, SnapshotDate, Region, RMGroup, Division, FactoryCode,
        MaterialCode, MaterialName, PIC,
        SOHQtyKg, MTD_Production_PrevMonth_Kg, MTD_Production_CurrMonth_Kg,
        MonthlyUsageForecastKg, PctUsedUsage, DailyStandardUsageKg,
        DOI_Standard_Days, DOI_Actual_MTD_Days, StockoutDateSOH,
        EmergencyBufferQtyKg, DOI_AfterBuffer_Days,
        PO_PendingInboundKg, TotalPipeline_DOI_Days, MaxProtectedDate,
        SeverityLevel, ActionSuggested, UpdatedAt
      FROM dbo.vw_Supply_Position_Matrix
      ${whereClause}
      ORDER BY TotalPipeline_DOI_Days ASC, SOHQtyKg ASC
    `;

    const result = await executeQuery(query, params);

    if (result.success && result.data.length > 0) {
      return res.json({
        success: true,
        source: 'MSSQL',
        totalRows: result.data.length,
        snapshotDate,
        data: result.data
      });
    }

    return res.json({
      success: true,
      source: 'MSSQL_EMPTY',
      totalRows: 0,
      snapshotDate,
      data: []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dynamic Calculation Trigger for Live Position Matrix
router.post('/position/calculate', async (req, res) => {
  try {
    const { snapshotDate = '2026-08-28' } = req.body;

    const result = await executeQuery('EXEC dbo.sp_Calculate_Supply_Position_Daily @SnapshotDate = @SnapshotDate', {
      SnapshotDate: snapshotDate
    });

    if (result.success) {
      return res.json({ success: true, message: `Tính toán hoàn tất cho ngày ${snapshotDate}` });
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
    { key: 'Region', label: isEnterprise ? 'Khu Vực' : 'REGION', width: 90, type: 'badge' },
    { key: 'RMGroup', label: isEnterprise ? 'Nhóm NL' : 'RM Group', width: 90, type: 'text' },
    { key: 'Division', label: isEnterprise ? 'Ngành' : 'Division', width: 100, type: 'text' },
    { key: 'FactoryCode', label: isEnterprise ? 'Nhà Máy' : 'FACTORY', width: 90, type: 'badge' },
    { key: 'MaterialCode', label: isEnterprise ? 'Mã SKU' : 'Item number', width: 100, type: 'text' },
    { key: 'MaterialName', label: isEnterprise ? 'Tên Nguyên Liệu' : 'Product name', width: 220, type: 'text' },
    { key: 'PIC', label: isEnterprise ? 'Phụ Trách' : 'PIC', width: 100, type: 'text' },
    { key: 'SOHQtyKg', label: isEnterprise ? 'Tồn Kho SOH (kg)' : 'SOH', width: 120, type: 'number' },
    { key: 'MTD_Production_PrevMonth_Kg', label: isEnterprise ? 'Lũy Kế T7 (kg)' : 'MTD Production July(26)', width: 130, type: 'number' },
    { key: 'MTD_Production_CurrMonth_Kg', label: isEnterprise ? 'Lũy Kế T8 (kg)' : 'MTD Production Aug(26)', width: 130, type: 'number' },
    { key: 'MonthlyUsageForecastKg', label: isEnterprise ? 'Kế Hoạch Tháng (kg)' : 'Usage/month', width: 140, type: 'number' },
    { key: 'PctUsedUsage', label: isEnterprise ? '% Tiến Độ Dùng' : '% Used Usage', width: 110, type: 'percent' },
    { key: 'DailyStandardUsageKg', label: isEnterprise ? 'Định Mức / Ngày' : 'Usage/Day', width: 120, type: 'number' },
    { key: 'DOI_Standard_Days', label: isEnterprise ? 'Ngày Tồn SOH (Plan)' : 'Covered day Usage', width: 120, type: 'number_alert' },
    { key: 'DOI_Actual_MTD_Days', label: isEnterprise ? 'Ngày Tồn SOH (MTD)' : 'Covered day MTD', width: 120, type: 'number' },
    { key: 'StockoutDateSOH', label: isEnterprise ? 'Ngày Hết Hàng SOH' : 'Coverage till (1)', width: 120, type: 'date_alert' },
    { key: 'EmergencyBufferQtyKg', label: isEnterprise ? 'Lượng Bù Đắp (Arrange)' : 'Arrange More', width: 130, type: 'number_highlight' },
    { key: 'DOI_AfterBuffer_Days', label: isEnterprise ? 'Ngày Tồn Sau Bù' : 'Covered day (2)', width: 120, type: 'number' },
    { key: 'PO_PendingInboundKg', label: isEnterprise ? 'PO Đang Về (kg)' : 'PO PENDING', width: 130, type: 'number_blue' },
    { key: 'TotalPipeline_DOI_Days', label: isEnterprise ? 'Tổng Ngày Che Phủ' : 'Covered day (3)', width: 130, type: 'number_strong' },
    { key: 'MaxProtectedDate', label: isEnterprise ? 'Ngày Bảo Vệ Tối Đa' : 'Coverage till (2)', width: 130, type: 'date_strong' },
  ];

  res.json({ success: true, mode, headers });
});

export default router;
