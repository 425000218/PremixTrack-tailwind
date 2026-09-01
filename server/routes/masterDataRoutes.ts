import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// ============================================================================
// 1. MASTER DATA: BULK FETCH (GET /api/masterdata/all)
// ============================================================================
router.get('/masterdata/all', async (req, res) => {
  try {
    const [matsRes, facsRes, suppRes, subsRes, formsRes, formItemsRes, mapsRes] = await Promise.all([
      executeQuery('SELECT * FROM dbo.dim_Material ORDER BY MaterialCode'),
      executeQuery('SELECT * FROM dbo.dim_Factory ORDER BY FactoryID'),
      executeQuery('SELECT * FROM dbo.dim_Supplier ORDER BY SupplierCode'),
      executeQuery('SELECT * FROM dbo.dim_Material_Substitution ORDER BY OriginalMaterialCode'),
      executeQuery('SELECT * FROM dbo.dim_Formula_BOM ORDER BY FormulaCode'),
      executeQuery('SELECT * FROM dbo.dim_Formula_Item ORDER BY FormulaID, ItemCode'),
      executeQuery('SELECT * FROM dbo.sys_Import_Mapping ORDER BY MappingType, HeaderKey'),
    ]);

    // Group formula items into formulas
    const formulas = (formsRes.data || []).map((f: any) => ({
      ...f,
      Items: (formItemsRes.data || []).filter((item: any) => item.FormulaID === f.FormulaID),
    }));

    return res.json({
      success: true,
      source: matsRes.success ? 'MSSQL' : 'FALLBACK_LOCAL',
      data: {
        materials: matsRes.data || [],
        factories: facsRes.data || [],
        suppliers: suppRes.data || [],
        substitutions: subsRes.data || [],
        formulas,
        mappings: mapsRes.data || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 2. MASTER DATA: MATERIALS (dim_Material)
// ============================================================================
router.get('/masterdata/materials', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.dim_Material ORDER BY MaterialCode');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

router.post('/masterdata/materials', async (req, res) => {
  try {
    const m = req.body;
    if (!m.MaterialCode || !m.Name_VN) {
      return res.status(400).json({ success: false, message: 'Mã nguyên liệu và Tên là bắt buộc.' });
    }

    const query = `
      MERGE INTO dbo.dim_Material AS Target
      USING (VALUES (@MaterialID, @MaterialCode, @Name_VN, @Name_EN, @Category, @Unit, @UnitPriceUSD, @PIC, @SafetyStockDays, @MinOrderQty, @StandardPackingKg, @IsActive))
      AS Source (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, PIC, SafetyStockDays, MinOrderQty, StandardPackingKg, IsActive)
      ON Target.MaterialCode = Source.MaterialCode
      WHEN MATCHED THEN
        UPDATE SET 
          Name_VN = Source.Name_VN,
          Name_EN = Source.Name_EN,
          Category = Source.Category,
          Unit = Source.Unit,
          UnitPriceUSD = Source.UnitPriceUSD,
          PIC = Source.PIC,
          SafetyStockDays = Source.SafetyStockDays,
          MinOrderQty = Source.MinOrderQty,
          StandardPackingKg = Source.StandardPackingKg,
          IsActive = Source.IsActive
      WHEN NOT MATCHED THEN
        INSERT (MaterialID, MaterialCode, Name_VN, Name_EN, Category, Unit, UnitPriceUSD, PIC, SafetyStockDays, MinOrderQty, StandardPackingKg, IsActive)
        VALUES (Source.MaterialID, Source.MaterialCode, Source.Name_VN, Source.Name_EN, Source.Category, Source.Unit, Source.UnitPriceUSD, Source.PIC, Source.SafetyStockDays, Source.MinOrderQty, Source.StandardPackingKg, Source.IsActive);
    `;

    const materialId = m.MaterialID || `MAT-${m.MaterialCode}`;
    const result = await executeQuery(query, {
      MaterialID: materialId,
      MaterialCode: m.MaterialCode,
      Name_VN: m.Name_VN,
      Name_EN: m.Name_EN || m.Name_VN,
      Category: m.Category || 'Chưa phân loại',
      Unit: m.Unit || 'kg',
      UnitPriceUSD: m.UnitPriceUSD || 0,
      PIC: m.PIC || 'Fiona',
      SafetyStockDays: m.SafetyStockDays || 15,
      MinOrderQty: m.MinOrderQty || 0,
      StandardPackingKg: m.StandardPackingKg || 25,
      IsActive: m.IsActive !== undefined ? (m.IsActive ? 1 : 0) : 1,
    });

    return res.json({ success: result.success, message: result.success ? 'Lưu nguyên liệu thành công.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/masterdata/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'DELETE FROM dbo.dim_Material WHERE MaterialID = @id OR MaterialCode = @id',
      { id }
    );
    return res.json({ success: result.success, message: result.success ? 'Đã xóa nguyên liệu.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 3. MASTER DATA: FACTORIES (dim_Factory)
// ============================================================================
router.get('/masterdata/factories', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.dim_Factory ORDER BY FactoryID');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

router.post('/masterdata/factories', async (req, res) => {
  try {
    const f = req.body;
    if (!f.InternalCode || !f.FactoryName_VN) {
      return res.status(400).json({ success: false, message: 'Mã nội bộ và Tên nhà máy là bắt buộc.' });
    }

    const query = `
      MERGE INTO dbo.dim_Factory AS Target
      USING (VALUES (@FactoryID, @InternalCode, @FactoryName_VN, @FactoryName_EN, @Division, @RegionID, @Address, @CapacityTonsPerMonth, @ActiveStatus))
      AS Source (FactoryID, InternalCode, FactoryName_VN, FactoryName_EN, Division, RegionID, Address, CapacityTonsPerMonth, ActiveStatus)
      ON Target.InternalCode = Source.InternalCode
      WHEN MATCHED THEN
        UPDATE SET 
          FactoryName_VN = Source.FactoryName_VN,
          FactoryName_EN = Source.FactoryName_EN,
          Division = Source.Division,
          RegionID = Source.RegionID,
          Address = Source.Address,
          CapacityTonsPerMonth = Source.CapacityTonsPerMonth,
          ActiveStatus = Source.ActiveStatus
      WHEN NOT MATCHED THEN
        INSERT (FactoryID, InternalCode, FactoryName_VN, FactoryName_EN, Division, RegionID, Address, CapacityTonsPerMonth, ActiveStatus)
        VALUES (Source.FactoryID, Source.InternalCode, Source.FactoryName_VN, Source.FactoryName_EN, Source.Division, Source.RegionID, Source.Address, Source.CapacityTonsPerMonth, Source.ActiveStatus);
    `;

    const factoryId = f.FactoryID || `FAC-${f.InternalCode}`;
    const result = await executeQuery(query, {
      FactoryID: factoryId,
      InternalCode: f.InternalCode,
      FactoryName_VN: f.FactoryName_VN,
      FactoryName_EN: f.FactoryName_EN || f.FactoryName_VN,
      Division: f.Division || 'Livestock',
      RegionID: f.RegionID || 'SOUTH',
      Address: f.Address || '',
      CapacityTonsPerMonth: f.CapacityTonsPerMonth || 0,
      ActiveStatus: f.ActiveStatus || 'Active',
    });

    return res.json({ success: result.success, message: result.success ? 'Lưu nhà máy thành công.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/masterdata/factories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'DELETE FROM dbo.dim_Factory WHERE FactoryID = @id OR InternalCode = @id',
      { id }
    );
    return res.json({ success: result.success, message: result.success ? 'Đã xóa nhà máy.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 4. MASTER DATA: SUPPLIERS (dim_Supplier)
// ============================================================================
router.get('/masterdata/suppliers', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.dim_Supplier ORDER BY SupplierCode');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

router.post('/masterdata/suppliers', async (req, res) => {
  try {
    const s = req.body;
    if (!s.SupplierCode || !s.ShortName) {
      return res.status(400).json({ success: false, message: 'Mã NCC và Tên ngắn là bắt buộc.' });
    }

    const query = `
      MERGE INTO dbo.dim_Supplier AS Target
      USING (VALUES (@SupplierID, @SupplierCode, @ShortName, @FullName, @SupplierType, @Country, @PaymentTermsDefault, @LeadTimeDaysAvg, @PIC_Purchaser, @ActiveStatus))
      AS Source (SupplierID, SupplierCode, ShortName, FullName, SupplierType, Country, PaymentTermsDefault, LeadTimeDaysAvg, PIC_Purchaser, ActiveStatus)
      ON Target.SupplierCode = Source.SupplierCode
      WHEN MATCHED THEN
        UPDATE SET 
          ShortName = Source.ShortName,
          FullName = Source.FullName,
          SupplierType = Source.SupplierType,
          Country = Source.Country,
          PaymentTermsDefault = Source.PaymentTermsDefault,
          LeadTimeDaysAvg = Source.LeadTimeDaysAvg,
          PIC_Purchaser = Source.PIC_Purchaser,
          ActiveStatus = Source.ActiveStatus
      WHEN NOT MATCHED THEN
        INSERT (SupplierID, SupplierCode, ShortName, FullName, SupplierType, Country, PaymentTermsDefault, LeadTimeDaysAvg, PIC_Purchaser, ActiveStatus)
        VALUES (Source.SupplierID, Source.SupplierCode, Source.ShortName, Source.FullName, Source.SupplierType, Source.Country, Source.PaymentTermsDefault, Source.LeadTimeDaysAvg, Source.PIC_Purchaser, Source.ActiveStatus);
    `;

    const supplierId = s.SupplierID || `SUP-${s.SupplierCode}`;
    const result = await executeQuery(query, {
      SupplierID: supplierId,
      SupplierCode: s.SupplierCode,
      ShortName: s.ShortName,
      FullName: s.FullName || s.ShortName,
      SupplierType: s.SupplierType || 'Local',
      Country: s.Country || 'Vietnam',
      PaymentTermsDefault: s.PaymentTermsDefault || 'Net 30',
      LeadTimeDaysAvg: s.LeadTimeDaysAvg || 7,
      PIC_Purchaser: s.PIC_Purchaser || 'Purchaser',
      ActiveStatus: s.ActiveStatus || 'Active',
    });

    return res.json({ success: result.success, message: result.success ? 'Lưu nhà cung cấp thành công.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/masterdata/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'DELETE FROM dbo.dim_Supplier WHERE SupplierID = @id OR SupplierCode = @id',
      { id }
    );
    return res.json({ success: result.success, message: result.success ? 'Đã xóa nhà cung cấp.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 5. MASTER DATA: SUBSTITUTIONS (dim_Material_Substitution)
// ============================================================================
router.get('/masterdata/substitutions', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.dim_Material_Substitution ORDER BY OriginalMaterialCode');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

router.post('/masterdata/substitutions', async (req, res) => {
  try {
    const s = req.body;
    if (!s.OriginalMaterialCode || !s.SubstituteMaterialCode) {
      return res.status(400).json({ success: false, message: 'Mã gốc và Mã thay thế là bắt buộc.' });
    }

    const query = `
      MERGE INTO dbo.dim_Material_Substitution AS Target
      USING (VALUES (@SubstitutionID, @OriginalMaterialCode, @OriginalMaterialName, @SubstituteMaterialCode, @SubstituteMaterialName, @ConversionRatio, @PriorityOrder, @Notes, @IsActive))
      AS Source (SubstitutionID, OriginalMaterialCode, OriginalMaterialName, SubstituteMaterialCode, SubstituteMaterialName, ConversionRatio, PriorityOrder, Notes, IsActive)
      ON Target.OriginalMaterialCode = Source.OriginalMaterialCode AND Target.SubstituteMaterialCode = Source.SubstituteMaterialCode
      WHEN MATCHED THEN
        UPDATE SET 
          OriginalMaterialName = Source.OriginalMaterialName,
          SubstituteMaterialName = Source.SubstituteMaterialName,
          ConversionRatio = Source.ConversionRatio,
          PriorityOrder = Source.PriorityOrder,
          Notes = Source.Notes,
          IsActive = Source.IsActive
      WHEN NOT MATCHED THEN
        INSERT (SubstitutionID, OriginalMaterialCode, OriginalMaterialName, SubstituteMaterialCode, SubstituteMaterialName, ConversionRatio, PriorityOrder, Notes, IsActive)
        VALUES (Source.SubstitutionID, Source.OriginalMaterialCode, Source.OriginalMaterialName, Source.SubstituteMaterialCode, Source.SubstituteMaterialName, Source.ConversionRatio, Source.PriorityOrder, Source.Notes, Source.IsActive);
    `;

    const subId = s.SubstitutionID || `SUB-${s.OriginalMaterialCode}-${s.SubstituteMaterialCode}`;
    const result = await executeQuery(query, {
      SubstitutionID: subId,
      OriginalMaterialCode: s.OriginalMaterialCode,
      OriginalMaterialName: s.OriginalMaterialName || s.OriginalMaterialCode,
      SubstituteMaterialCode: s.SubstituteMaterialCode,
      SubstituteMaterialName: s.SubstituteMaterialName || s.SubstituteMaterialCode,
      ConversionRatio: s.ConversionRatio || 1.0,
      PriorityOrder: s.PriorityOrder || 1,
      Notes: s.Notes || '',
      IsActive: s.IsActive !== undefined ? (s.IsActive ? 1 : 0) : 1,
    });

    return res.json({ success: result.success, message: result.success ? 'Lưu quy tắc thay thế thành công.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/masterdata/substitutions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'DELETE FROM dbo.dim_Material_Substitution WHERE SubstitutionID = @id',
      { id }
    );
    return res.json({ success: result.success, message: result.success ? 'Đã xóa quy tắc thay thế.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 6. MASTER DATA: IMPORT MAPPINGS (sys_Import_Mapping)
// ============================================================================
router.get('/masterdata/mappings', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.sys_Import_Mapping ORDER BY MappingType, HeaderKey');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

router.post('/masterdata/mappings', async (req, res) => {
  try {
    const m = req.body;
    if (!m.MappingType || !m.HeaderKey || !m.MappedToColumn) {
      return res.status(400).json({ success: false, message: 'MappingType, HeaderKey và MappedToColumn là bắt buộc.' });
    }

    const query = `
      MERGE INTO dbo.sys_Import_Mapping AS Target
      USING (VALUES (@MappingID, @MappingType, @HeaderKey, @MappedToColumn, @ConfidenceScore, @LearnedFromUser))
      AS Source (MappingID, MappingType, HeaderKey, MappedToColumn, ConfidenceScore, LearnedFromUser)
      ON Target.MappingType = Source.MappingType AND Target.HeaderKey = Source.HeaderKey
      WHEN MATCHED THEN
        UPDATE SET 
          MappedToColumn = Source.MappedToColumn,
          ConfidenceScore = Source.ConfidenceScore,
          LearnedFromUser = Source.LearnedFromUser,
          UpdatedAt = SYSDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (MappingID, MappingType, HeaderKey, MappedToColumn, ConfidenceScore, LearnedFromUser, CreatedAt, UpdatedAt)
        VALUES (Source.MappingID, Source.MappingType, Source.HeaderKey, Source.MappedToColumn, Source.ConfidenceScore, Source.LearnedFromUser, SYSDATETIME(), SYSDATETIME());
    `;

    const mappingId = m.MappingID || `MAP-${m.MappingType}-${m.HeaderKey}`;
    const result = await executeQuery(query, {
      MappingID: mappingId,
      MappingType: m.MappingType,
      HeaderKey: m.HeaderKey,
      MappedToColumn: m.MappedToColumn,
      ConfidenceScore: m.ConfidenceScore || 1.0,
      LearnedFromUser: m.LearnedFromUser || 'System',
    });

    return res.json({ success: result.success, message: result.success ? 'Lưu ánh xạ header thành công.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/masterdata/mappings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'DELETE FROM dbo.sys_Import_Mapping WHERE MappingID = @id',
      { id }
    );
    return res.json({ success: result.success, message: result.success ? 'Đã xóa quy tắc ánh xạ.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
