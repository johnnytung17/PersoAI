export interface QaSource {
  tag: string;
  id: string;
  doc: string;
  page: string;
  section: string;
  quote: string;
  before: string;
  after: string;
  score: number;
}

export interface RankedChunk {
  id: string;
  doc: string;
  page: string;
  section: string;
  score: number;
}

export interface QaResponse {
  answer: string;
  refusal: boolean;
  sources: QaSource[];
  rankingBefore: RankedChunk[];
  rankingAfter: RankedChunk[];
  /** tên cấu hình truy hồi ai-service đang chạy (config/prod.yaml), ví dụ "hybrid_rerank" */
  config: string;
  taskId: string | null;
  latencyMs: number;
  /** true khi dịch vụ AI không chạy và NestJS trả lời từ chối thay thế */
  fallback: boolean;
}
