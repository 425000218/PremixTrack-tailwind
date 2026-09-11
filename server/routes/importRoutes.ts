import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// Storage directory from ENV or default relative folder
const STORAGE_RAW_DIR = process.env.STORAGE_RAW_DIR || path.join(process.cwd(), 'storage_data');

/**
 * Ensure storage directory exists
 */
function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ============================================================================
// 1. SAVE RAW EXCEL FILE & AUDIT LOG (POST /api/import/save-raw)
// ============================================================================
router.post('/import/save-raw', async (req, res) => {
  try {
    const {
      fileName,
      fileBase64,
      importType,
      snapshotDate,
      totalRows,
      validRows,
      errorRows,
      uploadedBy,
      notes
    } = req.body;

    if (!fileName || !fileBase64 || !snapshotDate || !importType) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: fileName, fileBase64, importType, snapshotDate.'
      });
    }

    // 1. Chuẩn bị thư mục theo Snapshot Date: [STORAGE_RAW_DIR]/[YYYY-MM-DD]/
    const cleanDate = snapshotDate.split('T')[0];
    const targetDir = path.join(STORAGE_RAW_DIR, cleanDate);
    ensureDirectory(targetDir);

    // 2. Tạo tên file có timestamp để bảo đảm không bị ghi đè khi upload nhiều lần trong ngày
    const now = new Date();
    const timeStampStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    // Tách phần đuôi file (.xlsx, .xls)
    const ext = path.extname(fileName) || '.xlsx';
    const baseNameWithoutExt = path.basename(fileName, ext);
    const sanitizedBaseName = baseNameWithoutExt.replace(/[^a-zA-Z0-9_\-\.\s]/g, '_');
    const savedFileName = `${timeStampStr}_${importType}_${sanitizedBaseName}${ext}`;
    const fullSavedPath = path.join(targetDir, savedFileName);
    const relativeSavedPath = path.join(cleanDate, savedFileName).replace(/\\/g, '/');

    // 3. Giải mã Base64 và ghi file ra ổ đĩa
    const buffer = Buffer.from(fileBase64, 'base64');
    fs.writeFileSync(fullSavedPath, buffer);
    const fileSizeKb = Math.round((buffer.length / 1024) * 100) / 100;

    // 4. Ghi bản ghi kiểm toán trực tiếp vào MS SQL Server (sys_Import_History)
    const importId = `IMP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const insertSql = `
      INSERT INTO dbo.sys_Import_History (
        ImportID,
        FileName,
        SavedRelativePath,
        ImportType,
        SnapshotDate,
        TotalRows,
        ValidRows,
        ErrorRows,
        UploadedBy,
        UploadedAt,
        FileSizeKb,
        Notes
      ) VALUES (
        @importId,
        @fileName,
        @relativeSavedPath,
        @importType,
        @cleanDate,
        @totalRows,
        @validRows,
        @errorRows,
        @uploadedBy,
        SYSUTCDATETIME(),
        @fileSizeKb,
        @notes
      )
    `;

    const dbResult = await executeQuery(insertSql, {
      importId,
      fileName,
      relativeSavedPath,
      importType,
      cleanDate,
      totalRows: Number(totalRows || 0),
      validRows: Number(validRows || 0),
      errorRows: Number(errorRows || 0),
      uploadedBy: uploadedBy || 'admin',
      fileSizeKb,
      notes: notes || `Auto-saved from PremixTrack Import Hub`
    });

    return res.json({
      success: true,
      message: 'Đã lưu file raw và ghi log lịch sử thành công.',
      data: {
        importId,
        savedFileName,
        savedRelativePath: relativeSavedPath,
        fileSizeKb,
        dbLogged: dbResult.success
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi lưu file raw:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi lưu trữ file raw: ${error.message}`
    });
  }
});

// ============================================================================
// 2. GET IMPORT HISTORY LOGS (GET /api/import/history)
// ============================================================================
router.get('/import/history', async (req, res) => {
  try {
    const query = `
      SELECT TOP 100
        ImportID,
        FileName,
        SavedRelativePath,
        ImportType,
        CONVERT(varchar(10), SnapshotDate, 120) AS SnapshotDate,
        TotalRows,
        ValidRows,
        ErrorRows,
        UploadedBy,
        CONVERT(varchar(19), UploadedAt, 120) AS UploadedAt,
        FileSizeKb,
        Notes
      FROM dbo.sys_Import_History
      ORDER BY UploadedAt DESC
    `;
    const result = await executeQuery(query);

    return res.json({
      success: true,
      data: result.data || []
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
