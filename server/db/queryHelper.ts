import { getDbPool } from './connection';
import sql from 'mssql';

export async function executeQuery<T = any>(
  queryText: string,
  params: Record<string, any> = {}
): Promise<{ success: boolean; data: T[]; error?: string }> {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return { success: false, data: [], error: 'Database offline' };
    }

    const request = pool.request();
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query<T>(queryText);
    return { success: true, data: result.recordset || [] };
  } catch (error: any) {
    console.error('SQL Execution Error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

export async function executeStoredProcedure<T = any>(
  spName: string,
  params: Record<string, any> = {}
): Promise<{ success: boolean; data: T[]; error?: string }> {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return { success: false, data: [], error: 'Database offline' };
    }

    const request = pool.request();
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.execute<T>(spName);
    return { success: true, data: result.recordset || [] };
  } catch (error: any) {
    console.error(`Error executing SP [${spName}]:`, error.message);
    return { success: false, data: [], error: error.message };
  }
}
