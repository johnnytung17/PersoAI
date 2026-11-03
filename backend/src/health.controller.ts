import { Controller, Get } from '@nestjs/common';
import { DbService } from './db/db.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DbService) {}

  @Get()
  health(): { status: string; service: string; database: string; time: string } {
    return {
      status: 'ok',
      service: 'persoai-backend',
      database: this.db.available ? 'postgresql: connected' : 'postgresql: unavailable',
      time: new Date().toISOString(),
    };
  }
}
