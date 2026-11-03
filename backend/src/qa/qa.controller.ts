import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { QaService } from './qa.service';
import { QaResponse } from './qa.types';

@Controller('qa')
export class QaController {
  constructor(private readonly qa: QaService) {}

  @Post('ask')
  @HttpCode(200)
  // App chỉ chạy một cấu hình truy hồi (config/prod.yaml); A/B chạy riêng trong experiments/.
  ask(@Body() body: { question?: unknown; taskId?: unknown }): Promise<QaResponse> {
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question || question.length > 500) {
      throw new BadRequestException('Câu hỏi phải có từ 1 đến 500 ký tự.');
    }
    const taskId = typeof body?.taskId === 'string' ? body.taskId : null;
    return this.qa.ask(question, taskId);
  }
}
