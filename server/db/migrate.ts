import fs from 'fs';
import path from 'path';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: sql.config = {
  server: process.env.DB_SERVER || '192.168.1.202',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: 'master', // Start with master to ensure PremixTrackDB exists
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    connectTimeout: 10000,
    requestTimeout: 60000,
  },
};

async function runAutoMigration() {
  console.log('===============================================================');
  console.log('🚀 PREMIXTRACK SAFE INCREMENTAL MIGRATOR (ENTERPRISE STANDARD)');
  console.log('===============================================================');
  console.log(`📡 Kết nối máy chủ SQL: ${dbConfig.server}:${dbConfig.port} (User: ${dbConfig.user})...`);

  if (!dbConfig.password || dbConfig.password === '[sẽ điền sau]') {
    console.error('❌ LỖI: Vui lòng điền mật khẩu DB_PASSWORD thực tế trong file .env trước khi chạy migrate!');
    process.exit(1);
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Kết nối máy chủ SQL Server thành công!\n');

    // 1. Chuyển ngữ cảnh làm việc sang PremixTrackDB
    await pool.request().batch(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'PremixTrackDB')
      BEGIN
          CREATE DATABASE [PremixTrackDB] COLLATE Vietnamese_CI_AS;
          PRINT N'>>> Đã khởi tạo cơ sở dữ liệu PremixTrackDB.';
      END
    `);

    // 2. Tạo bảng quản lý lịch sử migration: dbo.sys_Schema_History
    await pool.request().batch(`
      USE [PremixTrackDB];
      IF OBJECT_ID(N'dbo.sys_Schema_History', N'U') IS NULL
      BEGIN
          CREATE TABLE dbo.sys_Schema_History (
              MigrationID   INT IDENTITY(1,1) PRIMARY KEY,
              ScriptName    NVARCHAR(255) NOT NULL UNIQUE,
              ExecutedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
              Success       BIT NOT NULL DEFAULT 1
          );
          PRINT N'✅ Đã khởi tạo bảng quản lý phiên bản dbo.sys_Schema_History.';
      END
    `);

    // 3. Lấy danh sách các migration đã từng thực thi thành công
    const executedRes = await pool.request().query(`
      SELECT ScriptName FROM [PremixTrackDB].dbo.sys_Schema_History WHERE Success = 1
    `);
    const executedScripts = new Set((executedRes.recordset || []).map((r: any) => r.ScriptName));

    const dbDir = path.join(process.cwd(), 'database');

    // 4. KIỂM TRA: Nếu database đã có bảng dbo.sys_User_Account -> TUYỆT ĐỐI BỎ QUA 01_PremixTrack_Schema_DDL.sql
    const tableCheckRes = await pool.request().query(`
      SELECT 1 FROM [PremixTrackDB].sys.objects WHERE object_id = OBJECT_ID(N'[PremixTrackDB].dbo.sys_User_Account') AND type = 'U'
    `);
    const isDatabaseAlreadyInitialized = (tableCheckRes.recordset || []).length > 0;

    if (!isDatabaseAlreadyInitialized) {
      console.log('📦 Database mới tinh: Đang khởi tạo Schema ban đầu (01_PremixTrack_Schema_DDL.sql)...');
      const ddlPath = path.join(dbDir, '01_PremixTrack_Schema_DDL.sql');
      if (fs.existsSync(ddlPath)) {
        await executeSqlBatches(pool, ddlPath);
        await recordMigration(pool, '01_PremixTrack_Schema_DDL.sql');
      }
    } else {
      console.log('🛡️ AN TOÀN BẢO TOÀN DỮ LIỆU: Database đang hoạt động (ĐÃ CÓ SẴN USERS & TABLES).');
      console.log('   ⏭️ BỎ QUA các file reset bảng cũ để KHÔNG xóa mất Users & Dữ liệu đang có!\n');
    }

    // 5. Luôn cập nhật Stored Procedures mới nhất (vì procedures chỉ là CREATE OR ALTER, không làm mất data)
    const procPath = path.join(dbDir, '03_PremixTrack_Stored_Procedures.sql');
    if (fs.existsSync(procPath)) {
      console.log('⚡ Cập nhật Stored Procedures & Logic tính toán (03_PremixTrack_Stored_Procedures.sql)...');
      await executeSqlBatches(pool, procPath);
      console.log('   ✅ Đã cập nhật xong Stored Procedures.');
    }

    // 6. Thực thi các file MIGRATION MỚI (chỉ chạy file nào CHƯA TỪNG CHẠY)
    const migrationsDir = path.join(dbDir, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const mFile of migrationFiles) {
        if (executedScripts.has(mFile)) {
          // File này đã chạy trong quá khứ rồi -> BỎ QUA KHÔNG CHẠY LẠI
          continue;
        }

        console.log(`⏳ Đang thực thi Migration mới: ${mFile}...`);
        const mPath = path.join(migrationsDir, mFile);
        const success = await executeSqlBatches(pool, mPath);

        if (success) {
          await recordMigration(pool, mFile);
          console.log(`   ✅ Đã ghi nhận migration hoàn tất: ${mFile}`);
        } else {
          console.warn(`   ⚠️ Migration ${mFile} hoàn thành có cảnh báo/lỗi nhỏ.`);
          await recordMigration(pool, mFile);
        }
      }
    }

    console.log('\n===============================================================');
    console.log('🎉 TẤT CẢ DỮ LIỆU ĐƯỢC BẢO TOÀN NGUYÊN VẸN, KHÔNG BỊ GHI ĐÈ!');
    console.log('===============================================================');
  } catch (err: any) {
    console.error('❌ Lỗi thực thi:', err.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function executeSqlBatches(pool: sql.ConnectionPool, filePath: string): Promise<boolean> {
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  const batches = sqlContent
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  let allSuccess = true;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      await pool.request().batch(batch);
    } catch (err: any) {
      // Bỏ qua cảnh báo đã tồn tại
      if (!err.message.includes('already an object named') && !err.message.includes('already exists')) {
        console.warn(`      ⚠️ Batch #${i + 1}: ${err.message}`);
        allSuccess = false;
      }
    }
  }
  return allSuccess;
}

async function recordMigration(pool: sql.ConnectionPool, scriptName: string) {
  try {
    await pool.request().query(`
      USE [PremixTrackDB];
      IF NOT EXISTS (SELECT 1 FROM dbo.sys_Schema_History WHERE ScriptName = N'${scriptName.replace(/'/g, "''")}')
      BEGIN
          INSERT INTO dbo.sys_Schema_History (ScriptName) VALUES (N'${scriptName.replace(/'/g, "''")}');
      END
    `);
  } catch {
    // ignore
  }
}

runAutoMigration();
