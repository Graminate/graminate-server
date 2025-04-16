import pool from '@/config/database';

export async function cleanupExpiredSessions() {
  try {
    await pool.query('DELETE FROM session WHERE expire < NOW()');
    console.log('[Cron] Cleaned up expired sessions.');
  } catch (err) {
    console.error('[Cron] Error cleaning sessions:', err);
  }
}
