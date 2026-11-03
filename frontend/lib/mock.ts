// Toàn bộ dữ liệu mẫu (mock) cho PersoAI — không có backend.

export const user = {
  name: "Tùng",
  className: "IT250",
  initials: "T",
};

export const course = {
  code: "CSDL",
  name: "Cơ sở dữ liệu",
  label: "CSDL — Cơ sở dữ liệu",
  goal: "Thi giữa kỳ CSDL",
  deadline: "20/11",
};

export type Priority = "Cao" | "Trung bình" | "Thấp";
export type Goal = { id: string; output: string; deadline: string; priority: Priority; status: string };

export const goals: Goal[] = [
  { id: "g-1", output: "Thi giữa kỳ CSDL", deadline: "20/11/2026", priority: "Cao", status: "Đang theo đuổi" },
  { id: "g-2", output: "Hoàn thành bài tập lớn CSDL", deadline: "05/12/2026", priority: "Trung bình", status: "Đang theo đuổi" },
];

export const todayLabel = "Thứ Năm, 05/11/2026";
export const todayIso = "2026-11-05";
export const weekProgress = "Tuần 2 · 3/5 nhiệm vụ xong";

export type NavItem = { href: string; label: string; short: string };

// Thanh ngang trên cùng (kiểu Coursera): các trang làm việc chính.
export const navItems: NavItem[] = [
  { href: "/", label: "Hôm nay", short: "Hôm nay" },
  { href: "/ke-hoach", label: "Kế hoạch tuần", short: "Kế hoạch" },
  { href: "/lo-trinh", label: "Lộ trình", short: "Lộ trình" },
  { href: "/mon-hoc", label: "Môn học & tài liệu", short: "Môn học" },
  { href: "/bao-cao", label: "Báo cáo tuần", short: "Báo cáo" },
];

// Menu avatar: hồ sơ, khảo sát lại, quyền riêng tư.
export const accountItems: NavItem[] = [
  { href: "/ho-so", label: "Hồ sơ học tập", short: "Hồ sơ" },
  { href: "/khao-sat", label: "Khảo sát lại", short: "Khảo sát" },
  { href: "/quyen-rieng-tu", label: "Quyền riêng tư", short: "Riêng tư" },
];

export const pageTitles: Record<string, string> = {
  "/": "Hôm nay",
  "/ke-hoach": "Kế hoạch tuần",
  "/lo-trinh": "Lộ trình",
  "/mon-hoc": "Môn học & tài liệu",
  "/bao-cao": "Báo cáo tuần",
  "/ho-so": "Hồ sơ học tập",
  "/khao-sat": "Khảo sát",
  "/quyen-rieng-tu": "Quyền riêng tư",
};

/* ---------------- Màn 1 — Hôm nay ---------------- */

export const todayTaskId = "task-12";

export const todayTask = {
  title: "JOIN và GROUP BY qua ví dụ",
  minutes: 45,
  status: "Đang làm",
  output: "5 truy vấn",
  criteria: "Chạy đúng cả 5 câu",
  material: "Slide_CSDL_Chuong4.pdf",
};

export type OtherTask = { title: string; minutes: number; status: "Đã xong" | "Quá hạn"; due?: string };

// Quá hạn được tính tự động theo ngày (Asia/Ho_Chi_Minh), không nhập tay.
export const otherTasksToday: OtherTask[] = [
  { title: "Khóa chính", minutes: 30, status: "Đã xong", due: "T2 02/11" },
  { title: "Lọc WHERE", minutes: 30, status: "Quá hạn", due: "T3 03/11" },
];

export const logStatuses = ["Xong", "Đang làm", "Bỏ qua"] as const;
export type LogStatus = (typeof logStatuses)[number];

export type ChatSegment = { text: string } | { cite: string };
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  segments: ChatSegment[];
  refusal?: boolean;
  meta?: string;
};

export const initialChat: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    segments: [{ text: "Khi nào dùng HAVING thay WHERE?" }],
  },
  {
    id: "m2",
    role: "assistant",
    segments: [
      { text: "HAVING lọc các nhóm sau GROUP BY " },
      { cite: "S1" },
      { text: "; WHERE lọc từng dòng trước khi gom nhóm " },
      { cite: "S2" },
      { text: "." },
    ],
  },
];

export const refusalText =
  "Không đủ bằng chứng trong tài liệu để trả lời câu này. Bạn thử hỏi cụ thể hơn về nội dung Chương 4.";

export const chatContextLabel = "Đang hỏi trong nhiệm vụ: JOIN và GROUP BY qua ví dụ";
export const chatPlaceholder = "Hỏi về nhiệm vụ này…";

export type Source = {
  id: string;
  file: string;
  page?: string;
  section: string;
  quote: string;
  isCode?: boolean;
  before: string;
  after: string;
};

export const sources: Source[] = [
  {
    id: "S1",
    file: "Slide ch.4",
    page: "tr.12",
    section: "GROUP BY và HAVING",
    quote: "Mệnh đề HAVING dùng để lọc kết quả đã gom nhóm; điều kiện có thể chứa hàm gộp như COUNT, SUM.",
    before:
      "Sau khi các dòng được gom thành nhóm bằng GROUP BY, mỗi nhóm được xem như một dòng kết quả duy nhất. ",
    after:
      " Ví dụ: SELECT MaKH, COUNT(*) FROM DonHang GROUP BY MaKH HAVING COUNT(*) > 3; chỉ giữ các khách hàng có trên 3 đơn hàng.",
  },
  {
    id: "S2",
    file: "Giáo trình",
    section: "mục 5.3",
    quote: "Thứ tự xử lý: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.",
    before:
      "Câu truy vấn SQL được viết theo thứ tự SELECT … FROM … nhưng hệ quản trị xử lý theo một thứ tự logic khác. ",
    after:
      " Vì WHERE được xử lý trước GROUP BY nên WHERE lọc từng dòng và không thể tham chiếu tới giá trị của hàm gộp.",
  },
];

/* ---------------- Màn 2 — Kế hoạch tuần ---------------- */

export const plan = {
  title: "Kế hoạch tuần 02/11 – 08/11",
  version: 3,
  goal: "Thi giữa kỳ CSDL, hạn 20/11",
  budget: 180,
  deadline: "20/11",
};

export type PlanVersion = { version: number; status: "Bản nháp" | "Đang áp dụng" | "Đã thay thế" | "Đã bỏ"; date: string; note: string };

export const planVersions: PlanVersion[] = [
  { version: 3, status: "Bản nháp", date: "05/11", note: "Từ gợi ý \"Chia nhỏ nhiệm vụ JOIN\" (báo cáo 26/10 – 01/11)" },
  { version: 2, status: "Đang áp dụng", date: "02/11", note: "Xác nhận sau khi sửa giờ Thứ Ba" },
  { version: 1, status: "Đã thay thế", date: "01/11", note: "Bản đầu tiên do AI soạn, hồ sơ phiên bản 2" },
];

export type PlanTask = {
  id: string;
  title: string;
  minutes: number;
  time?: string;
  output: string;
  criteria: string;
  material: string;
};

export type BusySlot = { label: string; allDay?: boolean; start?: string; end?: string };

export type PlanDay = {
  key: string;
  short: string;
  date: string;
  full: string;
  iso?: string;
  busy: BusySlot[];
  tasks: PlanTask[];
  rest?: boolean;
};

export const planDays: PlanDay[] = [
  {
    key: "t2", short: "T2", date: "02/11", full: "Thứ Hai", busy: [],
    tasks: [{ id: "p1", title: "Khóa chính", minutes: 30, time: "19:00", output: "Ghi chú các loại khoá kèm 3 ví dụ", criteria: "Phân biệt được khoá chính, khoá ứng viên, khoá ngoại", material: "Slide_CSDL_Chuong3.pdf" }],
  },
  {
    key: "t3", short: "T3", date: "03/11", full: "Thứ Ba", busy: [],
    tasks: [{ id: "p2", title: "Lọc WHERE", minutes: 30, time: "19:00", output: "5 truy vấn có điều kiện WHERE", criteria: "Chạy đúng cả 5 câu", material: "Slide_CSDL_Chuong4.pdf" }],
  },
  {
    key: "t4", short: "T4", date: "04/11", full: "Thứ Tư",
    busy: [{ label: "Bận: đi làm, không xếp", allDay: true }],
    tasks: [],
  },
  {
    key: "t5", short: "T5", date: "05/11", full: "Thứ Năm", busy: [{ label: "Làm thêm 18:00–22:00", start: "18:00", end: "22:00" }],
    tasks: [{ id: "p3", title: "JOIN ví dụ", minutes: 45, time: "14:00", output: "5 truy vấn", criteria: "Chạy đúng cả 5 câu", material: "Slide_CSDL_Chuong4.pdf" }],
  },
  {
    key: "t6", short: "T6", date: "06/11", full: "Thứ Sáu", busy: [],
    tasks: [{ id: "p4", title: "GROUP BY", minutes: 30, time: "19:00", output: "4 truy vấn gom nhóm có HAVING", criteria: "Giải thích được thứ tự xử lý của từng câu", material: "Giáo trình CSDL, mục 5.3" }],
  },
  {
    key: "t7", short: "T7", date: "07/11", full: "Thứ Bảy", busy: [],
    tasks: [
      { id: "p5", title: "Bài tập JOIN", minutes: 25, time: "09:00", output: "Lời giải 3 bài tập LEFT JOIN", criteria: "Kết quả khớp đáp án mẫu", material: "BaiTap_SQL_Tuan5.docx" },
      { id: "p6", title: "Ôn HAVING", minutes: 10, time: "09:30", output: "Tóm tắt 3 dòng về HAVING", criteria: "Nêu được khác biệt với WHERE", material: "Slide_CSDL_Chuong4.pdf" },
    ],
  },
  { key: "cn", short: "CN", date: "08/11", full: "Chủ Nhật", busy: [], tasks: [], rest: true },
];

export const clarifyingQuestions = [
  { id: "q1", question: "Tuần này bạn muốn ưu tiên chủ đề nào?", options: ["JOIN và GROUP BY", "Chuẩn hoá", "Ôn đều các chương"] },
  { id: "q2", question: "Bạn có muốn giữ Chủ nhật là ngày nghỉ không?", options: ["Có, nghỉ Chủ nhật", "Không, có thể học"] },
  { id: "q3", question: "Khối lượng tuần này nên thế nào?", options: ["Vừa sức (≤ 180 phút)", "Nhiều hơn, thêm chủ đề nâng cao"] },
];

/* ---------------- Màn 3 — Báo cáo tuần ---------------- */

export type Metric = {
  label: string;
  value: string;
  total?: string;
  ratio?: number;
  tone: "indigo" | "cyan" | "rose" | "amber";
};

export type Suggestion = {
  id: string;
  title: string;
  reason: string;
  evidence: string[];
  diff: { from: string; to: string };
  status?: string;
};

export type WeeklyReport = {
  key: string;
  label: string;
  title: string;
  logCount: number;
  metrics: Metric[];
  summary: string | null;
  suggestions: Suggestion[];
};

export const reportNote = "Số liệu từ nhật ký, không suy đoán năng lực";

export const reports: WeeklyReport[] = [
  {
    key: "w1",
    label: "26/10 – 01/11",
    title: "Báo cáo tuần 26/10 – 01/11 · Cơ sở dữ liệu",
    logCount: 9,
    metrics: [
      { label: "Nhiệm vụ hoàn thành", value: "4", total: "/6", ratio: 4 / 6, tone: "indigo" },
      { label: "Phút đã ghi / dự kiến", value: "180", total: "/240", ratio: 180 / 240, tone: "cyan" },
      { label: "Nhiệm vụ quá hạn", value: "1", tone: "rose" },
      { label: "Không có nhật ký", value: "2 ngày", tone: "amber" },
    ],
    summary:
      "Bạn hoàn thành 4/6 nhiệm vụ; nhiệm vụ JOIN thứ Năm quá hạn. Thứ Sáu và thứ Bảy không có nhật ký nên chưa đủ dữ liệu để nhận xét hai ngày này.",
    suggestions: [
      {
        id: "s1",
        title: "Chia nhỏ nhiệm vụ JOIN",
        reason: "Nhiệm vụ 45 phút quá hạn; nhật ký ghi 20 phút và ghi chú “chưa hiểu LEFT JOIN”.",
        evidence: ["task #12", "log #31"],
        diff: { from: "T5: JOIN 45 phút", to: "T5: LEFT JOIN 25 phút + T7: bài tập 20 phút" },
      },
      {
        id: "s2",
        title: "Dời GROUP BY khỏi tối Thứ Sáu",
        reason: "Hai tối Thứ Sáu gần nhất đều không có nhật ký cho nhiệm vụ đã xếp.",
        evidence: ["task #14", "task #9"],
        diff: { from: "T6 19:00: GROUP BY 30 phút", to: "CN 09:00: GROUP BY 30 phút" },
      },
    ],
  },
  {
    key: "w2",
    label: "02/11 – 08/11",
    title: "Báo cáo tuần 02/11 – 08/11 · Cơ sở dữ liệu",
    logCount: 0,
    metrics: [
      { label: "Nhiệm vụ hoàn thành", value: "—", tone: "indigo" },
      { label: "Phút đã ghi / dự kiến", value: "—", tone: "cyan" },
      { label: "Nhiệm vụ quá hạn", value: "—", tone: "rose" },
      { label: "Không có nhật ký", value: "—", tone: "amber" },
    ],
    summary: null,
    suggestions: [],
  },
];

/* ---------------- Môn học & tài liệu ---------------- */

export type DocKind = "Tài liệu môn" | "Bài làm của tôi" | "Tham khảo";
export const docKinds: DocKind[] = ["Tài liệu môn", "Tham khảo", "Bài làm của tôi"];

export type Doc = {
  id?: string;
  name: string;
  kind: DocKind;
  pages?: string;
  status: "Đã lập chỉ mục" | "Đang xử lý" | "Lỗi";
  error?: string;
};

export const scannedError = "Không tìm thấy chữ (PDF quét). PersoAI chưa hỗ trợ OCR.";

export const documents: Doc[] = [
  { name: "Slide_CSDL_Chuong4.pdf", kind: "Tài liệu môn", pages: "38 trang", status: "Đã lập chỉ mục" },
  { name: "GiaoTrinh_CSDL.pdf", kind: "Tài liệu môn", pages: "212 trang", status: "Đã lập chỉ mục" },
  { name: "BaiTap_SQL_Tuan5.docx", kind: "Bài làm của tôi", status: "Đã lập chỉ mục" },
  { name: "DeThi_2025_scan.pdf", kind: "Tham khảo", status: "Lỗi", error: scannedError },
];

export const uploadHint = "PDF có chữ, DOCX, TXT · tối đa 20 MB";

/* ---------------- Hồ sơ ---------------- */

export type Provenance = "Đã xác nhận" | "Trích xuất" | "Tự nhập";

export type ProfileField = {
  key: string;
  label: string;
  value: string | null;
  source?: Provenance;
  question?: string;
};

export const profileMaxChars = 2000;
export const profileVersion = { current: 2, confirmedAt: "01/11/2026" };

export const profileSampleText =
  "Mình là sinh viên năm 3 ngành CNTT, đi làm thêm từ 18h đến 22h các ngày thứ Năm, cả ngày thứ Tư cũng đi làm. Mỗi tuần mình chỉ dành được khoảng 3 tiếng để học môn Cơ sở dữ liệu. SQL cơ bản thì biết nhưng hay nhầm JOIN với GROUP BY. Mục tiêu là thi giữa kỳ CSDL đạt trên 8 điểm.";

// Kết quả trích xuất mẫu: trường không rõ để trống và được hỏi lại, không đoán.
export const extractedFields: ProfileField[] = [
  { key: "budget", label: "Thời gian học mỗi tuần", value: "180 phút", source: "Trích xuất" },
  { key: "busy", label: "Giờ bận", value: "T4 cả ngày; T5 18:00–22:00", source: "Trích xuất" },
  { key: "goal", label: "Mục tiêu", value: "Thi giữa kỳ CSDL đạt trên 8 điểm", source: "Trích xuất" },
  { key: "skill", label: "Kỹ năng SQL", value: "Cơ bản, hay nhầm JOIN với GROUP BY", source: "Trích xuất" },
  { key: "best", label: "Thời điểm học hiệu quả nhất", value: null, question: "Bạn thường học hiệu quả nhất vào buổi nào (sáng, chiều hay tối)?" },
];

export const profileFields: ProfileField[] = [
  { key: "budget", label: "Thời gian học mỗi tuần", value: "180 phút", source: "Đã xác nhận" },
  { key: "busy", label: "Giờ bận", value: "T4 cả ngày; T5 18:00–22:00", source: "Đã xác nhận" },
  { key: "goal", label: "Mục tiêu", value: "Thi giữa kỳ CSDL đạt trên 8 điểm", source: "Tự nhập" },
  { key: "skill", label: "Kỹ năng SQL", value: "Cơ bản, hay nhầm JOIN với GROUP BY", source: "Đã xác nhận" },
  { key: "best", label: "Thời điểm học hiệu quả nhất", value: null, question: "Bạn thường học hiệu quả nhất vào buổi nào (sáng, chiều hay tối)?" },
];

/* ---------------- Quyền riêng tư ---------------- */

export const privacySent = [
  "Câu hỏi bạn gõ trong khung hỏi đáp và tên nhiệm vụ đang làm.",
  "Một vài đoạn trích ngắn từ tài liệu của bạn (khoảng 3–5 đoạn) liên quan trực tiếp đến câu hỏi.",
  "Số liệu tổng hợp từ nhật ký học khi tạo nhận xét tuần (không kèm ghi chú cá nhân).",
];

export const privacyNotSent = [
  "Toàn bộ file tài liệu gốc — chỉ đoạn trích liên quan được gửi.",
  "Họ tên đầy đủ, email, mật khẩu.",
  "Lịch bận chi tiết — kế hoạch được kiểm tra bằng quy tắc ngay trên máy chủ PersoAI.",
];

/* ---------------- v0.3 — Buổi học (SES, HND) ---------------- */

export type SessionStepKey = "retest" | "study" | "practice" | "log" | "quiz";

export const sessionSteps: { key: SessionStepKey; label: string; hint: string }[] = [
  { key: "retest", label: "Làm lại câu sai", hint: "Trước nội dung mới" },
  { key: "study", label: "Góc học tập", hint: "Slide và ý chính" },
  { key: "practice", label: "Thực hành SQL", hint: "Chạy thật, chấm tự động" },
  { key: "log", label: "Ghi nhật ký", hint: "Trạng thái, số phút" },
  { key: "quiz", label: "Bài luyện cuối buổi", hint: "3 câu · nhiệm vụ < 60 phút" },
];

export type QuizItem = {
  id: string;
  topic: string;
  stem: string;
  options: string[];
  key: number;
  hint: string;
  whyCorrect: string;
  whyWrong: string[]; // theo thứ tự các phương án sai
  source: string;
  generated: boolean;
};

// Câu sai từ buổi trước cùng môn (SES-07): phải làm lại hoặc bỏ qua kèm lý do.
export const retestItems: (QuizItem & { wrongCount: number })[] = [
  {
    id: "r1",
    topic: "Lọc WHERE",
    stem: "Điều kiện nào lấy sinh viên KHÔNG thuộc lớp IT01 hoặc IT02?",
    options: ["lop <> 'IT01' OR lop <> 'IT02'", "lop NOT IN ('IT01','IT02')", "lop != ('IT01','IT02')", "NOT lop = 'IT01' OR 'IT02'"],
    key: 1,
    hint: "Nghĩ xem OR của hai điều kiện “khác” có loại được dòng nào không.",
    whyCorrect: "NOT IN loại mọi dòng có giá trị nằm trong danh sách.",
    whyWrong: [
      "OR hai điều kiện “khác” luôn đúng, nên không loại dòng nào.",
      "!= không so sánh với một danh sách.",
      "'IT02' đứng một mình không phải là điều kiện.",
    ],
    source: "Slide ch.4 tr.6",
    generated: false,
    wrongCount: 1,
  },
  {
    id: "r2",
    topic: "Khóa chính",
    stem: "Khóa chính có thể chứa giá trị NULL không?",
    options: ["Có, nếu chỉ một dòng", "Không", "Có, nếu khai báo UNIQUE", "Tùy hệ quản trị"],
    key: 1,
    hint: "Khóa chính phải xác định duy nhất mọi dòng.",
    whyCorrect: "Khóa chính luôn NOT NULL và duy nhất.",
    whyWrong: ["Một dòng NULL vẫn không xác định được.", "UNIQUE cho phép NULL nhưng khóa chính thì không.", "Chuẩn SQL quy định thống nhất."],
    source: "Giáo trình mục 3.2",
    generated: false,
    wrongCount: 2,
  },
];

export const quizItems: QuizItem[] = [
  {
    id: "q1",
    topic: "JOIN",
    stem: "Muốn liệt kê mọi sinh viên, kể cả sinh viên chưa có điểm, dùng phép nối nào?",
    options: ["INNER JOIN", "LEFT JOIN từ bảng SinhVien", "RIGHT JOIN từ bảng SinhVien", "CROSS JOIN"],
    key: 1,
    hint: "Bảng nào cần giữ đủ mọi dòng?",
    whyCorrect: "LEFT JOIN giữ mọi dòng của bảng bên trái (SinhVien), cột điểm là NULL khi không khớp.",
    whyWrong: [
      "INNER JOIN bỏ các sinh viên không có dòng điểm khớp.",
      "RIGHT JOIN giữ đủ bảng bên phải, tức bảng Diem.",
      "CROSS JOIN ghép mọi cặp, không theo khóa.",
    ],
    source: "Slide ch.4 tr.9",
    generated: true,
  },
  {
    id: "q2",
    topic: "GROUP BY",
    stem: "Mệnh đề nào lọc nhóm theo COUNT(*) > 3?",
    options: ["WHERE", "HAVING", "ORDER BY", "ON"],
    key: 1,
    hint: "Điều kiện chứa hàm gộp được xét sau khi gom nhóm.",
    whyCorrect: "HAVING lọc nhóm sau GROUP BY nên dùng được hàm gộp.",
    whyWrong: ["WHERE chạy trước khi gom nhóm, không dùng được COUNT.", "ORDER BY chỉ sắp xếp.", "ON là điều kiện nối bảng."],
    source: "Slide ch.4 tr.12",
    generated: true,
  },
  {
    id: "q3",
    topic: "JOIN",
    stem: "Câu nào đúng về điều kiện trong ON của LEFT JOIN?",
    options: [
      "Đặt điều kiện lọc bảng phải vào WHERE hay vào ON đều cho cùng kết quả",
      "Điều kiện ở ON quyết định dòng nào khớp, không loại dòng của bảng trái",
      "ON chỉ chấp nhận phép so sánh bằng",
      "LEFT JOIN không cần ON",
    ],
    key: 1,
    hint: "Thử hình dung dòng của bảng trái khi không khớp.",
    whyCorrect: "ON chỉ quyết định cặp khớp; dòng bảng trái không khớp vẫn được giữ với NULL.",
    whyWrong: [
      "Lọc ở WHERE sẽ loại các dòng NULL, kết quả khác ON.",
      "ON nhận mọi biểu thức logic.",
      "LEFT JOIN cần điều kiện nối (trừ NATURAL/USING).",
    ],
    source: "Giáo trình mục 5.2",
    generated: true,
  },
];

export type SqlTable = { name: string; columns: string[] };

export const sandboxSchema: SqlTable[] = [
  { name: "SinhVien", columns: ["MaSV PK", "HoTen", "Lop", "NamSinh"] },
  { name: "MonHoc", columns: ["MaMH PK", "TenMH", "SoTC"] },
  { name: "Diem", columns: ["MaSV FK", "MaMH FK", "Diem"] },
];

export type Exercise = {
  id: string;
  title: string;
  topic: string;
  prompt: string;
  starter: string;
  conceptHint: string;
  aiHint: string;
  solution: string;
  status: "Đạt" | "Chưa đạt" | "Chưa làm";
  attempts: number;
  generated?: boolean;
};

export const exercises: Exercise[] = [
  { id: "e1", title: "Bài 1", topic: "JOIN", prompt: "Liệt kê họ tên sinh viên và tên môn đã có điểm.", starter: "", conceptHint: "", aiHint: "", solution: "", status: "Đạt", attempts: 1 },
  { id: "e2", title: "Bài 2", topic: "JOIN", prompt: "Liệt kê điểm môn CSDL của lớp IT01.", starter: "", conceptHint: "", aiHint: "", solution: "", status: "Đạt", attempts: 2 },
  { id: "e3", title: "Bài 3", topic: "JOIN", prompt: "Đếm số môn mỗi sinh viên đã có điểm.", starter: "", conceptHint: "", aiHint: "", solution: "", status: "Đạt", attempts: 1 },
  {
    id: "e4",
    title: "Bài 4",
    topic: "JOIN",
    prompt: "Liệt kê MaSV, HoTen và Diem môn CSDL của TẤT CẢ sinh viên lớp IT01; sinh viên chưa có điểm vẫn phải xuất hiện (Diem để trống).",
    starter: "SELECT sv.MaSV, sv.HoTen, d.Diem\nFROM SinhVien sv\nJOIN Diem d ON d.MaSV = sv.MaSV AND d.MaMH = 'CSDL'\nWHERE sv.Lop = 'IT01';",
    conceptHint: "INNER JOIN bỏ các dòng không khớp. Cần giữ cả sinh viên chưa có điểm?",
    aiHint: "Câu của bạn dùng JOIN (INNER) nên 3 sinh viên chưa có dòng trong Diem bị loại. Hãy đổi kiểu nối để giữ mọi dòng của SinhVien [S1].",
    solution: "SELECT sv.MaSV, sv.HoTen, d.Diem\nFROM SinhVien sv\nLEFT JOIN Diem d ON d.MaSV = sv.MaSV AND d.MaMH = 'CSDL'\nWHERE sv.Lop = 'IT01';",
    status: "Chưa đạt",
    attempts: 1,
  },
  { id: "e5", title: "Bài 5", topic: "JOIN", prompt: "Liệt kê môn chưa có sinh viên nào có điểm.", starter: "", conceptHint: "", aiHint: "", solution: "", status: "Chưa làm", attempts: 0, generated: true },
];

// Kết quả mẫu khi chạy bài 4: INNER JOIN thiếu 3 dòng; LEFT JOIN đủ 8 dòng.
const innerRows = [
  ["SV01", "Nguyễn An", "8.5"],
  ["SV02", "Trần Bình", "7.0"],
  ["SV04", "Lê Chi", "9.0"],
  ["SV05", "Phạm Dũng", "6.5"],
  ["SV07", "Võ Giang", "8.0"],
];
export const runInner = { columns: ["MaSV", "HoTen", "Diem"], rows: innerRows };
export const runLeft = {
  columns: ["MaSV", "HoTen", "Diem"],
  rows: [
    innerRows[0],
    innerRows[1],
    ["SV03", "Đỗ Hà", "NULL"],
    innerRows[2],
    innerRows[3],
    ["SV06", "Bùi Khánh", "NULL"],
    innerRows[4],
    ["SV08", "Hồ Lan", "NULL"],
  ],
};

/* ---------------- Góc học tập: slide của nhiệm vụ ---------------- */

export type Slide = {
  title: string;
  bullets?: { text: string; cite?: string }[];
  code?: string[];
  highlight?: number[]; // dòng code được tô sáng
};

// Bản mẫu thay cho PDF thật; khi có tài liệu đã lập chỉ mục sẽ hiển thị trang PDF gốc.
export const slideDeck = {
  file: "Slide_CSDL_Chuong4.pdf",
  total: 24,
  startPage: 7,
  pages: {
    1: { title: "Chương 4 · Truy vấn SQL nâng cao" },
    5: {
      title: "Lọc dòng với WHERE",
      bullets: [{ text: "WHERE xét từng dòng của bảng sau FROM" }, { text: "Dùng AND, OR, NOT, IN, BETWEEN, LIKE" }],
      code: ["SELECT ho_ten, khoa", "FROM sinh_vien", "WHERE khoa IN ('CNTT', 'KT');"],
    },
    6: {
      title: "Hàm gộp",
      bullets: [{ text: "COUNT, SUM, AVG, MIN, MAX tính trên một nhóm dòng" }, { text: "Không có GROUP BY: cả bảng là một nhóm" }],
      code: ["SELECT COUNT(*) AS so_sv", "FROM sinh_vien;"],
    },
    7: {
      title: "GROUP BY và HAVING",
      bullets: [
        { text: "WHERE lọc từng dòng, thực hiện trước khi nhóm", cite: "S1" },
        { text: "HAVING lọc từng nhóm, thực hiện sau GROUP BY", cite: "S2" },
      ],
      code: ["SELECT khoa, COUNT(*) AS so_sv", "FROM sinh_vien", "WHERE nam_sinh > 2002", "GROUP BY khoa", "HAVING COUNT(*) > 5;"],
      highlight: [4],
    },
    8: {
      title: "Thứ tự xử lý một câu truy vấn",
      bullets: [{ text: "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY", cite: "S2" }, { text: "Vì vậy WHERE không dùng được hàm gộp" }],
    },
    9: {
      title: "INNER JOIN và LEFT JOIN",
      bullets: [{ text: "INNER JOIN chỉ giữ cặp dòng khớp điều kiện" }, { text: "LEFT JOIN giữ mọi dòng bảng trái; không khớp thì cột phải là NULL" }],
      code: ["SELECT sv.ho_ten, d.diem", "FROM sinh_vien sv", "LEFT JOIN diem d ON d.ma_sv = sv.ma_sv;"],
      highlight: [2],
    },
  } as Record<number, Slide>,
};

export const keyPoints = [
  "WHERE lọc dòng, HAVING lọc nhóm.",
  "JOIN ghép bảng theo khóa; chọn đúng loại JOIN.",
  "Hàm gộp (COUNT, SUM) đi cùng GROUP BY.",
];

/* ---------------- v0.3 — Chat nổi (CHAT, RAG-08) ---------------- */

export type StructuredAnswer = {
  direct: string;
  points: { text: string; cite: string[] }[];
  example?: string;
  insufficient?: boolean;
  followups: string[];
};

// Trả lời theo mẫu giao diện Johnny duyệt 26/10: các ý ngắn có **nhấn mạnh** và `code`, mỗi ý một [S].
export const sampleAnswer: StructuredAnswer = {
  direct: "",
  points: [
    { text: "WHERE lọc **từng dòng** trước khi nhóm.", cite: ["S1"] },
    { text: "HAVING lọc **từng nhóm** sau GROUP BY, thường với COUNT, SUM...", cite: ["S2"] },
    { text: "Ví dụ: `HAVING COUNT(*) > 5` giữ khoa có trên 5 sinh viên.", cite: ["S2"] },
  ],
  followups: ["Phân biệt INNER và LEFT JOIN?", "Tuần này tôi còn gì?"],
};

export type ChatSource = { id: string; file: string; page: number; pageLabel: string; quote: string };

export const chatSources: ChatSource[] = [
  { id: "S1", file: "Slide_CSDL_Chuong4.pdf", page: 7, pageLabel: "trang 7", quote: "WHERE lọc từng dòng, thực hiện trước khi nhóm." },
  { id: "S2", file: "Slide_CSDL_Chuong4.pdf", page: 7, pageLabel: "trang 7–8", quote: "HAVING lọc từng nhóm, thực hiện sau GROUP BY." },
];

export const expandedAnswer =
  "WHERE được áp dụng lên từng dòng ngay sau FROM, nên lúc đó chưa có nhóm nào và chưa tính được COUNT hay SUM [S2]. Sau GROUP BY, mỗi nhóm thành một dòng kết quả; HAVING xét điều kiện trên các dòng nhóm này, nên dùng được hàm gộp [S1]. Khi cần cả hai: dùng WHERE để bỏ dòng không liên quan trước, rồi HAVING để lọc nhóm.";

/* ---------------- v0.3 — Lộ trình (DIR, RMP) ---------------- */

export type Direction = {
  id: string;
  name: string;
  focus: string;
  prereq: string;
  load: string;
  perWeek: number; // phút/tuần
  feasible: boolean;
  why: string;
  risk: string;
};

export const directions: Direction[] = [
  {
    id: "d1",
    name: "Ôn theo đề thi",
    focus: "Dạng câu hỏi giữa kỳ: SELECT, JOIN, GROUP BY",
    prereq: "Đã biết SELECT cơ bản",
    load: "180 phút × 4 tuần",
    perWeek: 180,
    feasible: true,
    why: "Phù hợp vì quỹ giờ 180 phút/tuần và hạn 20/11; điểm yếu “hay nhầm JOIN với GROUP BY” được ưu tiên.",
    risk: "Ít thời gian cho chuẩn hóa nếu đề có phần này.",
  },
  {
    id: "d2",
    name: "Học lại từ mô hình quan hệ",
    focus: "Khóa, ràng buộc, rồi mới tới truy vấn",
    prereq: "Không cần",
    load: "240 phút × 4 tuần",
    perWeek: 240,
    feasible: false,
    why: "Chắc nền tảng nhưng vượt quỹ giờ 180 phút/tuần.",
    risk: "Không kịp ôn dạng đề trước 20/11.",
  },
  {
    id: "d3",
    name: "Chỉ tập trung JOIN và GROUP BY",
    focus: "Hai chủ đề hay nhầm nhất",
    prereq: "Đã biết SELECT, WHERE",
    load: "120 phút × 4 tuần",
    perWeek: 120,
    feasible: true,
    why: "Nhẹ nhất, chừa 60 phút/tuần dự phòng; đúng điểm yếu đã khai.",
    risk: "Bỏ qua phần lý thuyết khóa có trong đề năm trước [S3].",
  },
];

export type Milestone = {
  week: number;
  range: string;
  topic: string;
  minutes: number;
  output: string;
  check: string;
  state: "done" | "current" | "next" | "behind";
};

export const milestones: Milestone[] = [
  { week: 1, range: "26/10 – 01/11", topic: "Khóa và WHERE", minutes: 180, output: "10 truy vấn lọc", check: "Bài luyện ≥ 2/3", state: "done" },
  { week: 2, range: "02/11 – 08/11", topic: "JOIN", minutes: 180, output: "5 bài SQL JOIN đạt", check: "Thực hành ≥ 4/5", state: "current" },
  { week: 3, range: "09/11 – 15/11", topic: "GROUP BY, HAVING", minutes: 160, output: "4 bài gom nhóm đạt", check: "Thực hành ≥ 3/4", state: "next" },
  { week: 4, range: "16/11 – 20/11", topic: "Ôn đề 2025", minutes: 150, output: "1 đề thi thử", check: "Tự chấm theo đáp án", state: "next" },
];

// Lộ trình của người mới (Lan): bắt đầu tuần 02/11, 3 tuần tới hạn 20/11; tuần 1 khớp kế hoạch tuần 02/11 – 08/11.
export const lanMilestones: Milestone[] = [
  { week: 1, range: "02/11 – 08/11", topic: "Khóa, WHERE và JOIN", minutes: 180, output: "5 bài SQL JOIN đạt", check: "Thực hành ≥ 4/5", state: "current" },
  { week: 2, range: "09/11 – 15/11", topic: "GROUP BY, HAVING", minutes: 160, output: "4 bài gom nhóm đạt", check: "Thực hành ≥ 3/4", state: "next" },
  { week: 3, range: "16/11 – 20/11", topic: "Ôn đề 2025", minutes: 150, output: "1 đề thi thử", check: "Tự chấm theo đáp án", state: "next" },
];

export const roadmapRules:{ id: string; label: string; ok: boolean; warn?: boolean; detail: string }[] = [
  { id: "R1", label: "Lược đồ", ok: true, detail: "Mỗi cột mốc có chủ đề, phút, đầu ra, cách kiểm tra" },
  { id: "R2", label: "Chân trời", ok: true, detail: "4 tuần, mỗi tuần một cột mốc" },
  { id: "R3", label: "Quỹ giờ chung", ok: true, detail: "Tối đa 180/180 phút mỗi tuần" },
  { id: "R4", label: "Tiên quyết", ok: true, detail: "JOIN đứng sau khóa" },
  { id: "R5", label: "Hạn chót", ok: true, detail: "Cột mốc cuối 20/11" },
  { id: "R6", label: "Dự phòng", ok: false, warn: true, detail: "Tuần 1–2 dùng 100% quỹ giờ (nên chừa ≥ 10%)" },
];

// Cùng bộ quy tắc, mô tả theo lộ trình 3 tuần của Lan.
export const lanRoadmapRules = roadmapRules.map((r) =>
  r.id === "R2"
    ? { ...r, detail: "3 tuần, mỗi tuần một cột mốc" }
    : r.id === "R4"
      ? { ...r, detail: "JOIN đứng sau khóa (cùng tuần 1, khóa học trước)" }
      : r.id === "R6"
        ? { ...r, detail: "Tuần 1 dùng 100% quỹ giờ (nên chừa ≥ 10%)" }
        : r,
);

/* ---------------- v0.3 — Khảo sát (ONB, Phụ lục B) ---------------- */

export const surveyHints = [
  "Thói quen học: lúc nào, bao lâu, học thế nào",
  "Công việc và giờ bận cố định",
  "Phần tự tin và phần hay nhầm",
  "Mục tiêu học kỳ, môn quan trọng nhất",
];

export const profile12: ProfileField[] = [
  { key: "study_year_major", label: "Năm học, ngành", value: "Năm 3, CNTT", source: "Trích xuất" },
  { key: "busy_slots", label: "Giờ bận cố định", value: "T4 cả ngày; T5 18:00–22:00", source: "Trích xuất" },
  { key: "preferred_times", label: "Khung giờ học ưa thích", value: null, question: "Bạn thường học hiệu quả nhất vào buổi nào (sáng, chiều hay tối)?" },
  { key: "weekly_budget_min", label: "Số phút tự học mỗi tuần", value: "180", source: "Trích xuất" },
  { key: "session_length_min", label: "Độ dài buổi học ưa thích (phút)", value: null, question: "Một buổi học của bạn thường kéo dài bao lâu?" },
  { key: "rest_days", label: "Ngày nghỉ học", value: "Chủ nhật", source: "Trích xuất" },
  { key: "work_hours_week", label: "Giờ làm thêm mỗi tuần", value: "12", source: "Trích xuất" },
  { key: "strengths", label: "Điểm mạnh", value: "SELECT, WHERE", source: "Trích xuất" },
  { key: "weaknesses", label: "Chỗ hay nhầm", value: "JOIN với GROUP BY", source: "Trích xuất" },
  { key: "learning_style", label: "Cách học", value: "Qua ví dụ", source: "Trích xuất" },
  { key: "semester_goal", label: "Mục tiêu học kỳ", value: "Giữa kỳ CSDL ≥ 8 điểm", source: "Trích xuất" },
  { key: "explain_language", label: "Ngôn ngữ giải thích", value: "Tiếng Việt kèm thuật ngữ tiếng Anh", source: "Tự nhập" },
];
