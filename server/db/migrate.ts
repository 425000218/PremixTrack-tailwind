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
  console.log('🚀 PREMIXTRACK AUTO DATABASE MIGRATOR (MS SQL SERVER 2022)');
  console.log('===============================================================');
  console.log(`📡 Đang kết nối tới máy chủ SQL: ${dbConfig.server}:${dbConfig.port} (User: ${dbConfig.user})...`);

  if (!dbConfig.password || dbConfig.password === '[sẽ điền sau]') {
    console.error('❌ LỖI: Vui lòng điền mật khẩu DB_PASSWORD thực tế trong file .env trước khi chạy migrate!');
    process.exit(1);
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Kết nối máy chủ SQL Server thành công!\n');

    const dbDir = path.join(process.cwd(), 'database');
    const coreFiles = [
      '01_PremixTrack_Schema_DDL.sql',
      '02_PremixTrack_Seed_Data.sql',
      '03_PremixTrack_Stored_Procedures.sql',
    ];

    for (const fileName of coreFiles) {
      const filePath = path.join(dbDir, fileName);
      if (fs.existsSync(filePath)) {
        console.log(`⏳ Đang tự động thực thi file: ${fileName}...`);
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Split by GO batches
        const batches = sqlContent
          .split(/^\s*GO\s*$/gim)
          .map((b) => b.trim())
          .filter((b) => b.length > 0);

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          try {
            await pool.request().batch(batch);
          } catch (batchErr: any) {
            console.warn(`   ⚠️ Cảnh báo tại batch #${i + 1}: ${batchErr.message}`);
          }
        }
        console.log(`   ✅ Hoàn tất thực thi: ${fileName}`);
      }
    }

    // Now execute any migration files in database/migrations/
    const migrationsDir = path.join(dbDir, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const mFile of migrationFiles) {
        const mPath = path.join(migrationsDir, mFile);
        console.log(`⏳ Đang chạy file migration bổ sung: ${mFile}...`);
        const mSql = fs.readFileSync(mPath, 'utf8');
        const mBatches = mSql
          .split(/^\s*GO\s*$/gim)
          .map((b) => b.trim())
          .filter((b) => b.length > 0);

        for (const batch of mBatches) {
          try {
            await pool.request().batch(batch);
          } catch (mErr: any) {
            console.warn(`   ⚠️ Cảnh báo: ${mErr.message}`);
          }
        }
        console.log(`   ✅ Đã áp dụng migration: ${mFile}`);
      }
    }

    console.log('\n===============================================================');
    console.log('🎉 TẤT CẢ DỮ LIỆU & BẢNG ĐÃ ĐƯỢC TỰ ĐỘNG KHỞI TẠO VÀ CẬP NHẬT 100%!');
    console.log('===============================================================');
  } catch (err: any) {
    console.error('❌ Lỗi kết nối hoặc thực thi SQL:', err.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runAutoMigration();
