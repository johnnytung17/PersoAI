import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PlanValidatorService } from './plan-validator.service';
import { PlanDayInput, ValidationReport } from './plan.types';

@Controller('plan')
export class PlanController {
  constructor(private readonly validator: PlanValidatorService) {}

  @Post('validate')
  @HttpCode(200)
  validate(@Body() body: { days?: unknown; budget?: unknown }): ValidationReport {
    if (!Array.isArray(body?.days) || typeof body?.budget !== 'number') {
      throw new BadRequestException('Cần danh sách ngày (days) và ngân sách phút (budget).');
    }
    return this.validator.check(body.days as PlanDayInput[], body.budget);
  }
}
