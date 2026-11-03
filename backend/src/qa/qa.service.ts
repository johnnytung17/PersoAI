import { Injectable, Logger } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { QaResponse } from './qa.types';

// Bản demo chưa có đăng nhập thật: dùng một người dùng và một môn cố định.
const DEMO_OWNER = 'u-tung';
const DEMO_COURSE = 'csdl';

@Injectable()
export class QaService {
  private readonly logger = new Logger('QaService');
  constructor(private readonly data: DataService) {}

  private readonly pyUrl = (process.env.PY_URL || 'http://localhost:5000').replace(/\/$/, '');

  async ask(question: string, taskId: string | null): Promise<QaResponse> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${this.pyUrl}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, owner: DEMO_OWNER, course: DEMO_COURSE, task_id: taskId }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`ai-service HTTP ${res.status}`);
      const data = (await res.json()) as Omit<QaResponse, 'fallback'>;
      this.logger.log(`task=${taskId ?? '-'} config=${data.config} sources=${data.sources.length} ${data.latencyMs}ms`);
      // Lưu lượt hỏi đáp kèm nhiệm vụ, nguồn trích dẫn, cấu hình và độ trễ (RAG-07).
      await this.data
        .saveInteraction(taskId, question, data.answer, data.sources.map((s) => s.id), { config: data.config, topN: 20, topK: 5 }, data.latencyMs)
        .catch((e: Error) => this.logger.warn(`Không lưu được lượt hỏi đáp: ${e.message}`));
      return { ...data, fallback: false };
    } catch (err) {
      this.logger.warn(`Không gọi được ai-service (${(err as Error).message}) → trả lời từ chối.`);
      return {
        answer: 'Dịch vụ AI đang tạm dừng nên chưa thể tìm trong tài liệu. Bạn thử lại sau ít phút.',
        refusal: true,
        sources: [],
        rankingBefore: [],
        rankingAfter: [],
        config: 'unavailable',
        taskId,
        latencyMs: 0,
        fallback: true,
      };
    }
  }
}
