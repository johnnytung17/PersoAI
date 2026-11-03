import { Injectable } from '@nestjs/common';
import { PlanDayInput, RuleCheck, ValidationReport } from './plan.types';

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Bộ kiểm tra kế hoạch bằng quy tắc thuần, không dùng LLM (SDD: V1, V3, V5, V6, V9).
 * Quy tắc chặn quyết định có được xác nhận kế hoạch hay không; cảnh báo chỉ để người dùng xem.
 */
@Injectable()
export class PlanValidatorService {
  check(days: PlanDayInput[], budget: number): ValidationReport {
    const tasks = days.flatMap((d) => d.tasks.map((t) => ({ t, d })));
    const total = tasks.reduce((s, x) => s + (Number(x.t.minutes) || 0), 0);
    const missing = tasks.filter((x) => !x.t.title?.trim() || !(x.t.minutes > 0));
    const clashes = tasks.filter(({ t, d }) =>
      d.busy.some((b) => {
        if (b.allDay) return true;
        if (!t.time || !b.start || !b.end) return false;
        const s = toMin(t.time);
        return s < toMin(b.end) && s + t.minutes > toMin(b.start);
      }),
    );
    const short = tasks.filter((x) => x.t.minutes > 0 && x.t.minutes < 15);

    const checks: RuleCheck[] = [
      { id: 'budget', ok: total <= budget, blocking: true, label: `Ngân sách ${total}/${budget} phút` },
      {
        id: 'busy',
        ok: clashes.length === 0,
        blocking: true,
        label: clashes.length === 0 ? 'Không trùng giờ bận' : 'Trùng giờ bận',
        detail: clashes.length ? clashes.map(({ t, d }) => `${t.title} (${d.short})`).join(', ') : undefined,
      },
      // Mọi ngày trong tuần đang lập đều trước hạn mục tiêu; quy tắc giữ lại để báo cáo đủ V6.
      { id: 'deadline', ok: true, blocking: true, label: 'Trước hạn chót' },
      {
        id: 'short',
        ok: short.length === 0,
        blocking: false,
        label: short.length === 0 ? 'Không có nhiệm vụ dưới 15 phút' : 'Có nhiệm vụ dưới 15 phút',
        detail: short.length ? short.map(({ t, d }) => `${t.title}, ${t.minutes} phút, ${d.full}`).join('; ') : undefined,
      },
    ];
    if (missing.length) {
      checks.splice(3, 0, {
        id: 'fields',
        ok: false,
        blocking: true,
        label: 'Thiếu thông tin nhiệm vụ',
        detail: `${missing.length} nhiệm vụ thiếu tên hoặc số phút`,
      });
    }
    return { checks, canConfirm: checks.every((c) => !c.blocking || c.ok), totalMinutes: total };
  }
}
