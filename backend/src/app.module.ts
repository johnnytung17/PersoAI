import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { QaController } from './qa/qa.controller';
import { QaService } from './qa/qa.service';
import { PlanController } from './plan/plan.controller';
import { PlanValidatorService } from './plan/plan-validator.service';
import { DbService } from './db/db.service';
import { DataController } from './data/data.controller';
import { DataService } from './data/data.service';

@Module({
  controllers: [HealthController, QaController, PlanController, DataController],
  providers: [DbService, QaService, PlanValidatorService, DataService],
})
export class AppModule {}
