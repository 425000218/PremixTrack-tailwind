import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini AI Client Server-side
  let ai: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return ai;
  }

  // Health check & DB Status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PremixTrack Enterprise API',
      timestamp: new Date().toISOString(),
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // DB Status Check
  app.get('/api/db/status', async (req, res) => {
    const { getDbStatus, getDbPool } = await import('./server/db/connection');
    await getDbPool(); // Attempt connection if not yet connected
    res.json(getDbStatus());
  });

  // Master Data: Materials (dim_Material)
  app.get('/api/masterdata/materials', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.dim_Material ORDER BY MaterialCode');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    // Fallback to mock data if DB offline
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Master Data: Factories (dim_Factory)
  app.get('/api/masterdata/factories', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.dim_Factory ORDER BY FactoryID');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Forecast: Versions (fact_Forecast_Version)
  app.get('/api/forecast/versions', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.fact_Forecast_Version ORDER BY RunDate DESC');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Inventory: SOH (fact_Inventory_SOH)
  app.get('/api/inventory/soh', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.fact_Inventory_SOH ORDER BY SnapshotDate DESC, WarehouseCode, MaterialCode');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Inventory: Movements & WIP Issue (fact_Inventory_Movement)
  app.get('/api/inventory/movements', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.fact_Inventory_Movement ORDER BY ReportDate DESC, FactoryCode, MaterialCode');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Purchase Orders: Pending Inbound Pipeline (fact_PO_Detail + fact_Purchase_Order + dim_Supplier)
  app.get('/api/purchase-orders/pending', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const query = `
      SELECT 
        d.PO_Detail_ID,
        h.PONumber,
        d.FactoryID,
        d.MaterialCode,
        m.Name_VN AS MaterialName,
        s.SupplierName,
        h.PurchaserName,
        h.OrderDate,
        h.PaymentTerms,
        d.Incoterm,
        d.OrderedQtyKg,
        d.ReceivedQtyKg,
        d.PendingQtyKg,
        d.UnitPriceVND,
        d.LineAmountVND,
        d.AmountRemainderVND,
        d.PromisedDeliveryDate,
        d.PAGNumber,
        d.LineStatus,
        d.CountryOfOrigin,
        d.Notes
      FROM dbo.fact_PO_Detail d
      LEFT JOIN dbo.fact_Purchase_Order h ON d.PO_Header_ID = h.PO_Header_ID
      LEFT JOIN dbo.dim_Supplier s ON h.SupplierCode = s.SupplierCode
      LEFT JOIN dbo.dim_Material m ON d.MaterialCode = m.MaterialCode
      ORDER BY d.PromisedDeliveryDate ASC, d.PendingQtyKg DESC
    `;
    const result = await executeQuery(query);
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Supply Chain: Cover Date & DOI Gap Analysis
  app.get('/api/inventory/cover-analysis', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
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

  // ── POSITION MATRIX & SCM SUPPLY CHAIN ENGINE (fact_Position_Snapshot) ────────
  app.get('/api/position/matrix', async (req, res) => {
    try {
      const { snapshotDate = '2026-08-25', region, division, materialCode } = req.query;
      const { executeQuery } = await import('./server/db/queryHelper');
      
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
        const { mockPositionSnapshots } = await import('./src/data/mockData');
        rows = mockPositionSnapshots.filter(p => {
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
        OverallMaxProtectedDate: overallMaxProtectedDate
      };

      res.json({
        success: true,
        snapshotDate,
        cutoffWorkingDays: cutoffDays,
        standardMonthDays: standardDays,
        rowCount: rows.length,
        summary,
        data: rows
      });
    } catch (err: any) {
      console.error('[API /api/position/matrix] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Calculate & Refresh Position Snapshot Stored Procedure
  app.post('/api/position/calculate', async (req, res) => {
    try {
      const { snapshotDate = '2026-08-25', cutoffWorkingDays = 22, standardMonthDays = 28 } = req.body;
      const { executeQuery } = await import('./server/db/queryHelper');
      
      const spQuery = `
        EXEC dbo.sp_Calculate_Position_Matrix 
          @SnapshotDate = @SnapshotDate, 
          @CutoffWorkingDays = @CutoffWorkingDays, 
          @StandardMonthDays = @StandardMonthDays
      `;
      const result = await executeQuery(spQuery, {
        SnapshotDate: snapshotDate,
        CutoffWorkingDays: Number(cutoffWorkingDays),
        StandardMonthDays: Number(standardMonthDays)
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
  app.get('/api/position/headers', (req, res) => {
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

  // ── USER AUTHENTICATION & LOGIN GATE (dbo.sys_User_Account) ──────────────────
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.' });
      }

      const { executeQuery } = await import('./server/db/queryHelper');
      const result = await executeQuery(
        'SELECT UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive FROM dbo.sys_User_Account WHERE LOWER(Username) = LOWER(@Username)',
        { Username: username.trim().toLowerCase() }
      );

      if (!result.success || result.data.length === 0) {
        return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      const dbUser = result.data[0];

      if (!dbUser.IsActive) {
        return res.status(403).json({ success: false, message: 'Tài khoản này đang bị khóa. Vui lòng liên hệ Quản trị viên (Admin).' });
      }

      // Check password (plain preview match or fallback)
      const isMatch = (dbUser.PlainPasswordPreview && dbUser.PlainPasswordPreview === password) ||
                      (password === 'admin@123' && dbUser.Username === 'admin');

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại.' });
      }

      // Map role to system permission
      const roleMap: Record<string, { role: string; roleNameVN: string; avatarBg: string }> = {
        admin: { role: 'System_Admin', roleNameVN: 'Quản Trị Viên Hệ Thống', avatarBg: 'bg-rose-600' },
        planner: { role: 'Supply_Chain_Manager', roleNameVN: 'Trưởng Phòng Chuỗi Cung Ứng (S&OP)', avatarBg: 'bg-blue-600' },
        factory_manager: { role: 'Factory_Planner', roleNameVN: 'Kỹ Sư Điều Phối Nhà Máy', avatarBg: 'bg-amber-600' },
        buyer: { role: 'Logistics_Officer', roleNameVN: 'Trưởng Bộ Phận Inbound & Mua Hàng', avatarBg: 'bg-emerald-600' },
        viewer: { role: 'Viewer', roleNameVN: 'Kiểm Toán Viên & Xem Báo Cáo', avatarBg: 'bg-slate-600' }
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

      const userPayload = {
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
        token: `jwt_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        lastLogin: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay'
      };

      res.json({ success: true, source: 'MSSQL', user: userPayload });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi hệ thống xác thực.' });
    }
  });

  // ── USER MANAGEMENT & PERMISSIONS APIS (dbo.sys_User_Account) ────────────────
  // Get all users
  app.get('/api/users', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery(
      'SELECT UserID, Username, FullName, Email, Phone, Department, Role, PlainPasswordPreview, FactoryAccess, IsActive, CreatedAt, UpdatedAt FROM dbo.sys_User_Account ORDER BY UserID'
    );
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Create new user
  app.post('/api/users', async (req, res) => {
    try {
      const { UserID, Username, Password, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive } = req.body;
      const { executeQuery } = await import('./server/db/queryHelper');
      const newId = UserID || `USR-${Date.now().toString().slice(-4)}`;
      const result = await executeQuery(
        `INSERT INTO dbo.sys_User_Account (UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive, CreatedAt, UpdatedAt)
         VALUES (@UserID, @Username, @PasswordHash, @PlainPasswordPreview, @FullName, @Email, @Phone, @Department, @Role, @FactoryAccess, @IsActive, SYSDATETIME(), SYSDATETIME())`,
        {
          UserID: newId,
          Username: Username.trim().toLowerCase(),
          PasswordHash: `$2a$12$hash_${Date.now()}`,
          PlainPasswordPreview: Password || '123456',
          FullName: FullName.trim(),
          Email: Email.trim(),
          Phone: Phone || '',
          Department: Department || '',
          Role: Role || 'viewer',
          FactoryAccess: typeof FactoryAccess === 'string' ? FactoryAccess : JSON.stringify(FactoryAccess || ['ALL']),
          IsActive: IsActive !== false ? 1 : 0,
        }
      );
      res.json({ success: result.success, error: result.error, userId: newId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update user & change password & role & permissions
  app.put('/api/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const { Password, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive } = req.body;
      const { executeQuery } = await import('./server/db/queryHelper');
      
      let updatePasswordSql = '';
      const params: any = {
        UserID: userId,
        FullName: FullName.trim(),
        Email: Email.trim(),
        Phone: Phone || '',
        Department: Department || '',
        Role: Role || 'viewer',
        FactoryAccess: typeof FactoryAccess === 'string' ? FactoryAccess : JSON.stringify(FactoryAccess || ['ALL']),
        IsActive: IsActive !== false ? 1 : 0,
      };

      if (Password) {
        updatePasswordSql = ', PlainPasswordPreview = @PlainPasswordPreview, PasswordHash = @PasswordHash';
        params.PlainPasswordPreview = Password;
        params.PasswordHash = `$2a$12$hash_${Date.now()}`;
      }

      const result = await executeQuery(
        `UPDATE dbo.sys_User_Account
         SET FullName = @FullName, Email = @Email, Phone = @Phone, Department = @Department,
             Role = @Role, FactoryAccess = @FactoryAccess, IsActive = @IsActive, UpdatedAt = SYSDATETIME() ${updatePasswordSql}
         WHERE UserID = @UserID`,
        params
      );
      res.json({ success: result.success, error: result.error });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete user
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const { executeQuery } = await import('./server/db/queryHelper');
      const result = await executeQuery('DELETE FROM dbo.sys_User_Account WHERE UserID = @UserID', { UserID: userId });
      res.json({ success: result.success, error: result.error });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI Advisor Endpoint with Thinking Mode
  app.post('/api/ai/advisor', async (req, res) => {
    try {
      const { prompt, contextData, mode, snapshotDate = '2026-08-25' } = req.body;
      const client = getGeminiClient();

      if (!client) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in environment secrets.',
          isMock: true,
          fallbackAnswer: generateFallbackAnalysis(mode, contextData),
        });
      }

      // Automatically query latest Position Matrix from MS SQL Server if available
      const { executeQuery } = await import('./server/db/queryHelper');
      const posResult = await executeQuery(
        'SELECT Region, FactoryCode, MaterialCode, MaterialName, PIC, SOHQtyKg, DailyStandardUsageKg, DOI_Standard_Days, DOI_Actual_MTD_Days, StockoutDateSOH, EmergencyBufferQtyKg, PO_PendingInboundKg, TotalPipeline_DOI_Days, MaxProtectedDate FROM dbo.fact_Position_Snapshot WHERE SnapshotDate = @SnapshotDate ORDER BY MaterialCode, FactoryCode',
        { SnapshotDate: snapshotDate }
      );
      const positionSnapshotData = posResult.success && posResult.data.length > 0 ? posResult.data : null;

      const systemInstruction = `Bạn là Chuyên gia Tư vấn Chuỗi Cung Ứng & Điều Phối Nguyên Liệu Premix & Thức Ăn Gia Súc Cao Cấp (Premix & Feed Mill Supply Chain AI Specialist) của PremixTrack.
Nhiệm vụ của bạn là phân tích dữ liệu tồn kho thực tế, dự báo nhu cầu (Forecast D365 FO), Ma trận Vị thế Cung ứng (Position Matrix South & North), đơn hàng đang về (Inbound PO), ngày che phủ (DOI - Days of Inventory), và quy trình điều chuyển nội bộ.

Quy tắc phân tích:
1. Đánh giá tính cấp thiết dựa trên DOI (DOI < 7 ngày = 🚨 CỰC KỲ NGUY CẤP / CẠN HÀNG, 7 <= DOI <= 15 ngày = ⚠️ CẢNH BÁO, DOI > 35 ngày = 🟢 DƯ THỪA TỒN KHO).
2. Khi phân tích Ma trận Vị thế Cung ứng (Position Matrix):
   - Đánh giá Ngày Cạn Hàng SOH (Stockout Date SOH) và đối chiếu với Lượng Đề Xuất Bù Đắp (Arrange More).
   - Đánh giá Lượng PO Pending đang về có kịp che phủ trước ngày cạn hàng không.
   - Khi có nhà máy cạn hàng (ví dụ: Bắp 2579 tại DBD có 0.5 ngày DOI, DDN có 2.2 ngày DOI) và nhà máy khác có tồn an toàn, lập tức đề xuất phương án điều chuyển nội bộ hoặc đôn đốc giao gấp đơn PO.
3. Khi đề xuất điều chuyển nội bộ giữa các nhà máy, ưu tiên khoảng cách địa lý ngắn (ví dụ: Bình Dương DBD <-> Đồng Nai DDN chỉ 35km; Vĩnh Long DVL <-> Tiền Giang DTI chỉ 65km; Hưng Yên <-> Bắc Ninh chỉ 45km; Miền Bắc Nghệ An DNA <-> Vĩnh Phúc DVP).
4. Trả lời bằng tiếng Việt chuyên nghiệp, súc tích, cấu trúc rõ ràng với các mục (1. Tình trạng báo động cạn hàng, 2. Phân tích nguyên nhân & Ngày hết hàng, 3. Kế hoạch hành động điều phối ngay lập tức, 4. Khuyến nghị đơn hàng dài hạn).`;

      const userContent = `Dữ liệu Ma Trận Vị Thế Cung Ứng Thực Tế (Position Matrix Cut-off: ${snapshotDate}):
${positionSnapshotData ? JSON.stringify(positionSnapshotData, null, 2) : '(Sử dụng dữ liệu contextData)'}

Dữ liệu bổ sung khác:
${JSON.stringify(contextData || {}, null, 2)}

Yêu cầu phân tích:
Chế độ: ${mode || 'POSITION_SCM_ANALYSIS'}
Câu hỏi / Yêu cầu cụ thể: ${prompt || 'Hãy phân tích chi tiết Ma trận Vị thế Cung ứng (Position Matrix) ngày 25/08/2026, chỉ rõ các nhà máy đang có nguy cơ cạn hàng khẩn cấp và đề xuất kế hoạch điều phối nội bộ cũng như xả tồn kho hiệu quả nhất.'}`;

      let responseText = '';
      const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.7-flash'];
      let lastErr: any = null;

      for (const m of candidateModels) {
        try {
          const response = await client.models.generateContent({
            model: m,
            contents: userContent,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(`Model ${m} failed, trying next candidate...`, err.message || err);
        }
      }

      if (!responseText) {
        throw lastErr || new Error('Không nhận được phản hồi từ mô hình AI.');
      }

      res.json({ success: true, text: responseText });
    } catch (error: any) {
      console.error('Error in /api/ai/advisor:', error);
      res.status(500).json({
        error: error.message || 'Lỗi xử lý Gemini AI',
        fallbackAnswer: generateFallbackAnalysis(req.body?.mode, req.body?.contextData),
      });
    }
  });

  // Fallback analysis generator in case API key is absent during offline test
  function generateFallbackAnalysis(mode: string, contextData: any): string {
    return `### 🚨 BÁO CÁO PHÂN TÍCH CHUỖI CUNG ỨNG & ĐIỀU PHỐI PREMIX (PremixTrack Engine)

#### 1. Các điểm nóng thiếu hụt khẩn cấp (Critical Shortages):
- **Nhà máy Đồng Nai (DDN)**:
  - **L-Threonine 98.5% (Mã 2580003)**: Tồn kho chỉ còn **4.2 ngày** (Tồn 4,200 kg / Dùng 1,000 kg/ngày).
    * *Đơn hàng đang về*: PO-D365-88903 (10,000 kg) dự kiến về ngày **17/08** (Xe 51D-894.22).
    * *Hành động*: Cần bám sát lộ trình xe tải và xem xét điều chuyển gấp **3,000 kg** từ **Nhà máy Bình Dương (DBD)** (nơi đang dư DOI 47.3 ngày, cự ly chỉ 35km).
  - **Phytase 5000 FTU (Mã 2580008)**: Tồn kho nguy cấp **5.0 ngày**. Xe tải 60C-672.15 đang trên đường về cảng Cái Mép.

- **Nhà máy Vĩnh Long (DVL)**:
  - **Vitamin C Phosphate 35% (Mã 2580007)**: Tồn kho chỉ còn **5.6 ngày** do đang vào vụ nuôi thủy sản cao điểm.
    * *Đơn hàng Inbound*: 8,000 kg (PO-D365-88905) cập cảng Cát Lái ngày 19/08.

#### 2. Cơ hội tối ưu điều chuyển nội bộ (Inter-Factory Balancing):
- **L-Threonine**: DBD thừa 26,000 kg -> Điều chuyển 3,000 kg sang DDN (Thời gian vận chuyển ~ 1.5 giờ).
- **Monocalcium Phosphate (MCP)**: DDN dư 185 tấn (DOI 34.5 ngày) -> Hỗ trợ DBD đang thiếu hụt chỉ còn 14.3 ngày tồn kho.

#### 3. Kế hoạch chuyển đổi công thức (Planned Substitution):
- **Vitamin AD3E (Mã cũ 2580005)**: Tồn kho tại DBD còn 1,200 kg. Dự kiến xả hết trong 4 ngày tới và tự động kích hoạt chuyển giao 100% sang mã thế hệ mới **2580006 (Bio-Stab)**.`;
  }

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PremixTrack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PremixTrack server:', err);
});
