// Kênh sự kiện nhỏ giữa Góc học tập (trình xem slide) và Trợ lý học tập (chat nổi).
export type Viewing = { file: string; page: number };

const VIEWING = "persoai:viewing";
const GOTO = "persoai:goto-page";

/** Trình xem slide báo trang đang xem. */
export function reportViewing(viewing: Viewing | null) {
  window.dispatchEvent(new CustomEvent(VIEWING, { detail: viewing }));
}

/** Trợ lý yêu cầu trình xem mở tới trang nguồn. */
export function gotoPage(page: number) {
  window.dispatchEvent(new CustomEvent(GOTO, { detail: page }));
}

function listen<T>(name: string, fn: (v: T) => void) {
  const h = (e: Event) => fn((e as CustomEvent<T>).detail);
  window.addEventListener(name, h);
  return () => window.removeEventListener(name, h);
}

export const onViewing = (fn: (v: Viewing | null) => void) => listen(VIEWING, fn);
export const onGotoPage = (fn: (page: number) => void) => listen(GOTO, fn);
