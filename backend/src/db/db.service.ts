import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool, QueryResultRow, types } from 'pg';

// Trả DATE/TIME dạng chuỗi ("2026-11-05", "19:00:00") thay vì Date để tránh lệch múi giờ.
types.setTypeParser(1082, (v: string) => v);
types.setTypeParser(1083, (v: string) => v);

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('DbService');
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://persoai:persoai@localhost:5432/persoai',
    connectionTimeoutMillis: 3000,
  });
  private ready = false;

  get available(): boolean {
    return this.ready;
  }

  async onModuleInit(): Promise<void> {
    try {
      const dir = join(__dirname, '..', '..', 'db');
      await this.pool.query(readFileSync(join(dir, 'schema.sql'), 'utf8'));
      const { rows } = await this.pool.query<{ n: string }>('SELECT COUNT(*) AS n FROM app_user');
      if (Number(rows[0].n) === 0) {
        await this.pool.query(readFileSync(join(dir, 'seed.sql'), 'utf8'));
        this.logger.log('Đã tạo bảng và nạp dữ liệu mẫu.');
      }
      this.ready = true;
      this.logger.log('Đã kết nối PostgreSQL.');
    } catch (err) {
      // API vẫn chạy (hỏi đáp, kiểm tra kế hoạch); các API dữ liệu trả 503 cho tới khi có CSDL.
      this.logger.warn(`Chưa kết nối được PostgreSQL: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.ready) throw new ServiceUnavailableException('Chưa kết nối được PostgreSQL.');
    const { rows } = await this.pool.query<T>(sql, params);
    return rows;
  }

  async tx<T>(fn: (q: <R extends QueryResultRow>(sql: string, params?: unknown[]) => Promise<R[]>) => Promise<T>): Promise<T> {
    if (!this.ready) throw new ServiceUnavailableException('Chưa kết nối được PostgreSQL.');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(async (sql, params = []) => (await client.query(sql, params)).rows);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
