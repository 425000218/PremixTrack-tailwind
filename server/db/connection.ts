import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: sql.config = {
  server: process.env.DB_SERVER || '192.168.1.202',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'PremixTrackDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    connectTimeout: 5000,
    requestTimeout: 15000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;
let isConnected = false;
let lastError: string | null = null;

export async function getDbPool(): Promise<sql.ConnectionPool | null> {
  if (pool && isConnected) {
    return pool;
  }

  // If password is not yet configured or contains placeholder
  if (!dbConfig.password || dbConfig.password === '[sẽ điền sau]') {
    lastError = 'DB_PASSWORD chưa được điền trong file .env';
    isConnected = false;
    return null;
  }

  try {
    pool = await sql.connect(dbConfig);
    isConnected = true;
    lastError = null;
    console.log(`✅ Kết nối thành công MS SQL Server (${dbConfig.server}:${dbConfig.port}/${dbConfig.database})`);
    return pool;
  } catch (error: any) {
    isConnected = false;
    lastError = error.message;
    console.warn(`⚠️ Chưa thể kết nối MS SQL Server (${dbConfig.server}): ${error.message}. Chuyển sang chế độ Fallback Cache.`);
    return null;
  }
}

export function isDbOnline(): boolean {
  return isConnected;
}

export function getDbStatus() {
  return {
    isOnline: isConnected,
    server: dbConfig.server,
    database: dbConfig.database,
    user: dbConfig.user,
    lastError,
  };
}

export default sql;
