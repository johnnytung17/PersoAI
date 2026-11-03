// PersoAI · Luồng người mới — plugin chạy tại máy (Figma desktop → Plugins → Development → Import plugin from manifest).
// Xoá sạch 3 trang cũ rồi dựng lại: bộ biến + text style (Coursera), component, các màn chính sửa được của Lan (người mới)
// và ảnh chụp app xếp theo luồng đăng ký → khảo sát → thiết lập → buổi học đầu tiên.

figma.showUI(__html__, { width: 360, height: 520 });

const PAGE = { desktop: "0:1", mobile: "1:57", components: "1:58" };
const PAGE_NAME = { desktop: "Desktop", mobile: "Mobile", components: "Thành phần & Token" };
const SEC = {
  comp: "Component (Coursera)",
  desk: "Luồng người mới · Màn chính (sửa được)",
  mob: "Luồng người mới · Màn chính (sửa được)",
  deskShots: "Luồng người mới · Ảnh chụp app — Desktop",
  mobShots: "Luồng người mới · Ảnh chụp app — Mobile",
};

// Luồng người mới (Lan) theo thứ tự dùng thật; id = tiền tố tên file trong anh-chup/. Ảnh của Tùng không đưa vào.
const FLOW = [
  ["tung-02", "main", "Đăng ký"],
  ["tung-03", "main", "Khảo sát · Bước 1 · Kể về việc học"],
  ["tung-04", "main", "Khảo sát · Bước 2 · Kiểm tra hồ sơ"],
  ["tung-05", "main", "Khảo sát · Bước 3 · Câu hỏi bổ sung"],
  ["lan-14", "main", "Hôm nay · Bắt đầu 1/4"],
  ["lan-15", "main", "Môn học · Trống"],
  ["lan-17", "main", "Môn học · Đã thêm tài liệu"],
  ["lan-18", "main", "Lộ trình · Chọn hướng"],
  ["lan-21", "main", "Lộ trình · Đã lưu"],
  ["lan-22", "main", "Hôm nay · Bắt đầu 3/4"],
  ["lan-23", "main", "Kế hoạch · Bản nháp v1"],
  ["lan-24", "main", "Kế hoạch · Đã xác nhận"],
  ["lan-25", "main", "Buổi đầu · Góc học tập"],
  ["lan-26", "main", "Trợ lý · Trả lời về trang"],
  ["lan-31", "main", "Báo cáo · Chưa đủ dữ liệu"],
  ["lan-02", "empty", "Trạng thái trống · Hôm nay 0/4"],
  ["lan-04", "empty", "Trạng thái trống · Hồ sơ"],
  ["lan-09", "empty", "Trạng thái trống · Chat chưa có môn"],
];

const say = (text) => figma.ui.postMessage({ type: "log", text });

/* ------------------------------------------------------------------ token */

const COLORS = {
  "color/brand/600": "#0056D2", "color/brand/700": "#00419E", "color/brand/100": "#E3EEFF", "color/brand/50": "#F0F6FF",
  "color/ink/900": "#0D0F12", "color/ink/700": "#333A47", "color/ink/500": "#48546E", "color/ink/400": "#636D85",
  "color/line": "#DAE1ED", "color/line-strong": "#C1CBDB", "color/surface": "#FFFFFF", "color/muted": "#F5F7FA", "color/slate-100": "#E9EEF7",
  "color/success/50": "#ECFDF5", "color/success/600": "#059669", "color/success/700": "#047857",
  "color/warning/50": "#FFFBEB", "color/warning/100": "#FEF3C7", "color/warning/500": "#F59E0B", "color/warning/800": "#92400E",
  "color/danger/50": "#FFF1F2", "color/danger/600": "#E11D48", "color/danger/700": "#BE123C",
};
const NUMBERS = {
  "radius/sm": [4, ["CORNER_RADIUS"]], "radius/md": [8, ["CORNER_RADIUS"]], "radius/lg": [12, ["CORNER_RADIUS"]], "radius/full": [999, ["CORNER_RADIUS"]],
  "space/1": [4, ["GAP"]], "space/2": [8, ["GAP"]], "space/3": [12, ["GAP"]], "space/4": [16, ["GAP"]], "space/5": [20, ["GAP"]], "space/6": [24, ["GAP"]], "space/8": [32, ["GAP"]],
};
// Màu chữ dùng TEXT_FILL; màu nền/viền dùng FRAME_FILL/SHAPE_FILL/STROKE_COLOR.
const TEXT_COLORS = new Set(["color/ink/900", "color/ink/700", "color/ink/500", "color/ink/400", "color/brand/600", "color/brand/700", "color/success/700", "color/warning/800", "color/danger/700", "color/surface"]);

const V = {}; // tên biến → Variable

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

async function ensureVariables() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  let col = cols.find((c) => c.name === "PersoAI v0.3");
  if (!col) col = figma.variables.createVariableCollection("PersoAI v0.3");
  const mode = col.modes[0].modeId;
  col.renameMode(mode, "Light");
  const existing = await figma.variables.getLocalVariablesAsync();
  const get = (name, type) => existing.find((v) => v.name === name && v.variableCollectionId === col.id) || figma.variables.createVariable(name, col, type);
  for (const [name, h] of Object.entries(COLORS)) {
    const v = get(name, "COLOR");
    v.scopes = TEXT_COLORS.has(name) ? ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"] : ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"];
    v.setValueForMode(mode, Object.assign(hex(h), { a: 1 }));
    V[name] = v;
  }
  for (const [name, [val, scopes]] of Object.entries(NUMBERS)) {
    const v = get(name, "FLOAT");
    v.scopes = scopes;
    v.setValueForMode(mode, val);
    V[name] = v;
  }
  return Object.keys(V).length;
}

function paint(name, opacity) {
  const p = figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V[name]);
  if (opacity !== undefined) p.opacity = opacity;
  return p;
}

function radius(node, name) {
  for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) node.setBoundVariable(k, V[name]);
}

/* ------------------------------------------------------------------ chữ */

const F = {}; // vai trò → FontName
const TS = {}; // tên style → TextStyle

async function pickFonts() {
  const all = await figma.listAvailableFontsAsync();
  const has = (family, style) => all.some((f) => f.fontName.family === family && f.fontName.style === style);
  const find = (families, styles) => {
    for (const family of families) for (const style of styles) if (has(family, style)) return { family, style };
    return null;
  };
  // App khai báo "Source Sans 3" → "Be Vietnam Pro"; máy chưa có Source Sans 3 nên giao diện thật đang hiện Be Vietnam Pro.
  const fams = ["Be Vietnam Pro", "Source Sans 3", "Inter"];
  F.regular = find(fams, ["Regular"]);
  F.semibold = find(fams, ["SemiBold", "Semi Bold"]);
  F.bold = find(fams, ["Bold"]);
  F.mono = find(["JetBrains Mono", "Roboto Mono", "Source Code Pro", "Consolas", "Courier New"], ["Regular"]) || F.regular;
  const fonts = [F.regular, F.semibold, F.bold, F.mono, { family: "Inter", style: "Regular" }];
  await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
  return F.regular.family;
}

const TEXT_STYLES = [
  ["v0.3/Logo", "bold", 22, 28],
  ["v0.3/Page title", "semibold", 28, 36],
  ["v0.3/H2", "semibold", 20, 28],
  ["v0.3/H3", "semibold", 16, 24],
  ["v0.3/Body", "regular", 15, 24],
  ["v0.3/Body S", "regular", 14, 20],
  ["v0.3/Label", "semibold", 14, 20],
  ["v0.3/Caption", "regular", 12, 16],
  ["v0.3/Caption strong", "semibold", 12, 16],
  ["v0.3/Eyebrow", "semibold", 12, 16, 6, true],
  ["v0.3/Code", "mono", 13, 20],
  ["v0.3/Slide title", "bold", 26, 32],
  ["v0.3/Slide body", "regular", 16, 24],
];

async function ensureTextStyles() {
  const existing = await figma.getLocalTextStylesAsync();
  for (const [name, role, size, lh, ls, upper] of TEXT_STYLES) {
    const s = existing.find((x) => x.name === name) || figma.createTextStyle();
    s.name = name;
    s.fontName = F[role];
    s.fontSize = size;
    s.lineHeight = { unit: "PIXELS", value: lh };
    s.letterSpacing = { unit: "PERCENT", value: ls || 0 };
    s.textCase = upper ? "UPPER" : "ORIGINAL";
    TS[name.replace("v0.3/", "")] = s;
  }
  const effects = await figma.getLocalEffectStylesAsync();
  const lift = effects.find((x) => x.name === "v0.3/Shadow lift") || figma.createEffectStyle();
  lift.name = "v0.3/Shadow lift";
  lift.effects = [{ type: "DROP_SHADOW", color: { r: 13 / 255, g: 15 / 255, b: 18 / 255, a: 0.12 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: "NORMAL" }];
  TS.lift = lift;
}

async function txt(chars, style, color, o = {}) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = chars;
  t.fills = [paint(color || "color/ink/900")];
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.width) {
    t.resize(o.width, t.height);
    t.textAutoResize = "HEIGHT";
  }
  if (o.name) t.name = o.name;
  return t;
}

function bold(t, part, font) {
  const i = t.characters.indexOf(part);
  if (i >= 0) t.setRangeFontName(i, i + part.length, font || F.semibold);
}

/* ------------------------------------------------------------------ layout */

function box(dir, o = {}) {
  const f = figma.createFrame();
  f.name = o.name || (dir === "HORIZONTAL" ? "Row" : "Stack");
  f.layoutMode = dir;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = o.gap || 0;
  const [t, r, b, l] = o.pad || [0, 0, 0, 0];
  f.paddingTop = t; f.paddingRight = r; f.paddingBottom = b; f.paddingLeft = l;
  f.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.stroke) { f.strokes = [paint(o.stroke)]; f.strokeWeight = 1; f.strokeAlign = "INSIDE"; }
  if (o.dashed) f.dashPattern = [4, 4];
  if (o.radius) radius(f, o.radius);
  if (o.align) f.primaryAxisAlignItems = o.align;
  if (o.cross) f.counterAxisAlignItems = o.cross;
  if (o.wrap) f.layoutWrap = "WRAP";
  f.clipsContent = !!o.clip;
  if (o.w) { f.resize(o.w, Math.max(f.height, 1)); f.layoutSizingHorizontal = "FIXED"; }
  if (o.h) { f.resize(f.width, o.h); f.layoutSizingVertical = "FIXED"; }
  return f;
}

// Gắn con rồi mới đặt FILL/HUG (FILL chỉ hợp lệ khi đã nằm trong khung auto-layout).
function add(parent, child, h, v) {
  parent.appendChild(child);
  if (h) child.layoutSizingHorizontal = h;
  if (v) child.layoutSizingVertical = v;
  return child;
}

function line(color, dashed) {
  const r = figma.createRectangle();
  r.name = "Divider";
  r.resize(100, 1);
  r.fills = [paint(color || "color/line")];
  if (dashed) { r.fills = []; r.strokes = [paint("color/line-strong")]; r.strokeWeight = 1; r.dashPattern = [4, 4]; r.resize(100, 0.01); }
  return r;
}

function dot(size, color) {
  const e = figma.createEllipse();
  e.resize(size, size);
  e.fills = [paint(color)];
  return e;
}

/* ------------------------------------------------------------------ icon (lucide) */

const ICONS = {
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  send: '<path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
};

function icon(name, size, color) {
  const node = figma.createNodeFromSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`,
  );
  node.name = "icon/" + name;
  node.fills = [];
  return node;
}

/* ------------------------------------------------------------------ trang & section */

async function openPage(key) {
  const page = await figma.getNodeByIdAsync(PAGE[key]);
  if (!page) throw new Error("Không thấy trang " + PAGE[key] + " — file Figma đã đổi cấu trúc?");
  await figma.setCurrentPageAsync(page);
  page.name = PAGE_NAME[key];
  return page;
}

// Xoá sạch nội dung trang (bản cũ, bản lưu trữ, section cũ). Trả về số node top-level đã xoá.
function wipe(page) {
  const n = page.children.length;
  for (const c of [...page.children]) c.remove();
  return n;
}

// Bỏ biến và style của giao diện cũ (collection "PersoAI", style không thuộc "v0.3/").
async function dropOldStyles() {
  let n = 0;
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  for (const c of cols) if (c.name === "PersoAI") { try { c.remove(); n++; } catch (e) {} }
  for (const list of [await figma.getLocalTextStylesAsync(), await figma.getLocalEffectStylesAsync(), await figma.getLocalPaintStylesAsync()]) {
    for (const st of list) if (!st.name.startsWith("v0.3/")) { try { st.remove(); n++; } catch (e) {} }
  }
  return n;
}

// Lấy (hoặc tạo) section theo tên; xoá nội dung cũ để dựng lại.
function section(page, name, below) {
  let s = page.children.find((n) => n.type === "SECTION" && n.name === name);
  if (!s) {
    s = figma.createSection();
    s.name = name;
    const ref = page.children.filter((n) => n !== s);
    const maxY = ref.reduce((m, n) => Math.max(m, n.y + n.height), 0);
    const minX = ref.reduce((m, n) => Math.min(m, n.x), Infinity);
    s.x = isFinite(minX) ? minX : 0;
    s.y = below !== undefined ? below : maxY + 400;
    s.resizeWithoutConstraints(1000, 1000);
  }
  for (const c of [...s.children]) c.remove();
  return s;
}

// Xếp con của section theo hàng ngang rồi nới section cho vừa.
function layoutSection(s, gap) {
  let x = 120, maxH = 0;
  for (const c of s.children) { c.x = x; c.y = 160; x += c.width + gap; maxH = Math.max(maxH, c.height); }
  s.resizeWithoutConstraints(Math.max(x + 120 - gap, 800), maxH + 280);
}

/* ------------------------------------------------------------------ component */

const C = {}; // component theo tên variant
const P = {}; // khoá thuộc tính TEXT theo component

async function variants(parent, setName, specs, props, build) {
  const comps = [];
  for (const spec of specs) {
    const c = figma.createComponent();
    c.name = spec.name;
    await build(c, spec);
    parent.appendChild(c);
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, parent);
  set.name = setName;
  set.layoutMode = "HORIZONTAL";
  set.primaryAxisSizingMode = "AUTO";
  set.counterAxisSizingMode = "AUTO";
  set.layoutWrap = "WRAP";
  set.itemSpacing = 24;
  set.counterAxisSpacing = 24;
  set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = 24;
  set.fills = [paint("color/surface")];
  set.strokes = [paint("color/line-strong")];
  set.dashPattern = [6, 4];
  // Thuộc tính: chuỗi → TEXT (gắn vào text cùng tên); true/false → BOOLEAN (bật/tắt node cùng tên). Chỉ gắn node của chính variant, không đụng instance lồng bên trong.
  P[setName] = {};
  for (const [prop, def] of Object.entries(props || {})) {
    const isBool = typeof def === "boolean";
    const key = set.addComponentProperty(prop, isBool ? "BOOLEAN" : "TEXT", def);
    P[setName][prop] = key;
    for (const c of set.children) {
      const hits = c.findAll((n) => n.name === prop && (isBool || n.type === "TEXT") && !insideInstance(n, c));
      for (const n of hits) n.componentPropertyReferences = isBool ? { visible: key } : { characters: key };
    }
  }
  for (const c of set.children) C[setName + "|" + c.name] = c;
  return set;
}

function insideInstance(n, root) {
  for (let p = n.parent; p && p !== root; p = p.parent) if (p.type === "INSTANCE") return true;
  return false;
}

function inst(setName, variant, values) {
  const comp = C[setName + "|" + variant];
  if (!comp) throw new Error("Thiếu component " + setName + " / " + variant);
  const i = comp.createInstance();
  if (values) {
    const map = {};
    for (const [k, v] of Object.entries(values)) map[P[setName][k]] = v;
    i.setProperties(map);
  }
  return i;
}

async function single(parent, name, build, props) {
  const c = figma.createComponent();
  c.name = name;
  await build(c);
  parent.appendChild(c);
  P[name] = {};
  for (const [prop, def] of Object.entries(props || {})) {
    const key = c.addComponentProperty(prop, "TEXT", def);
    P[name][prop] = key;
    for (const t of c.findAll((n) => n.type === "TEXT" && n.name === prop && !insideInstance(n, c))) t.componentPropertyReferences = { characters: key };
  }
  C[name + "|"] = c;
  return c;
}

function asRow(c, o = {}) {
  c.layoutMode = o.dir || "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.itemSpacing = o.gap || 0;
  const [t, r, b, l] = o.pad || [0, 0, 0, 0];
  c.paddingTop = t; c.paddingRight = r; c.paddingBottom = b; c.paddingLeft = l;
  c.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.stroke) { c.strokes = [paint(o.stroke)]; c.strokeWeight = o.strokeWeight || 1; c.strokeAlign = "INSIDE"; }
  if (o.radius) radius(c, o.radius);
  c.counterAxisAlignItems = o.cross || "CENTER";
  if (o.align) c.primaryAxisAlignItems = o.align;
  if (o.w) { c.resize(o.w, Math.max(c.height, 1)); c.layoutSizingHorizontal = "FIXED"; }
  if (o.h) { c.resize(c.width, o.h); c.layoutSizingVertical = "FIXED"; }
  c.clipsContent = !!o.clip;
}

async function buildComponents(sec) {
  // Button
  const btnStyles = {
    "Kiểu=Chính": { fill: "color/brand/600", text: "color/surface" },
    "Kiểu=Phụ": { fill: "color/surface", stroke: "color/brand/600", text: "color/brand/600" },
    "Kiểu=Ghost": { text: "color/brand/600" },
  };
  await variants(sec, "Button", Object.keys(btnStyles).map((name) => ({ name })), { Label: "Nút", Icon: false }, async (c, s) => {
    const st = btnStyles[s.name];
    asRow(c, { gap: 8, pad: [10, 16, 10, 16], fill: st.fill, stroke: st.stroke, radius: "radius/md" });
    c.appendChild(await txt("Nút", "Label", st.text, { name: "Label" }));
    const ic = icon("right", 16, st.text === "color/surface" ? "#FFFFFF" : "#0056D2");
    ic.name = "Icon";
    ic.visible = false;
    c.appendChild(ic);
  });

  // Pill
  const tones = {
    "Tông=Trung tính": ["color/slate-100", "color/ink/500"], "Tông=Thành công": ["color/success/50", "color/success/700"],
    "Tông=Cảnh báo": ["color/warning/50", "color/warning/800"], "Tông=Nguy hiểm": ["color/danger/50", "color/danger/700"],
    "Tông=Thương hiệu": ["color/brand/50", "color/brand/700"],
  };
  await variants(sec, "Pill", Object.keys(tones).map((name) => ({ name })), { Label: "Nhãn" }, async (c, s) => {
    asRow(c, { pad: [2, 10, 2, 10], fill: tones[s.name][0], radius: "radius/full" });
    c.appendChild(await txt("Nhãn", "Caption strong", tones[s.name][1], { name: "Label" }));
  });

  // Cite chip
  await variants(sec, "Cite chip", [{ name: "Trạng thái=Mặc định" }, { name: "Trạng thái=Đang chọn" }], { Label: "S1" }, async (c, s) => {
    const on = s.name.endsWith("Đang chọn");
    asRow(c, { pad: [1, 6, 1, 6], fill: on ? "color/brand/600" : "color/brand/50", radius: "radius/sm" });
    c.appendChild(await txt("S1", "Caption strong", on ? "color/surface" : "color/brand/700", { name: "Label" }));
  });

  // Step item (mục lục buổi học, desktop)
  const stepStates = {
    "Trạng thái=Đang mở": ["circle", "#0056D2", true], "Trạng thái=Chưa làm": ["circle", "#636D85"],
    "Trạng thái=Đã xong": ["check", "#059669"], "Trạng thái=Khoá": ["lock", "#636D85"],
  };
  await variants(sec, "Step item", Object.keys(stepStates).map((name) => ({ name })), { Title: "1. Góc học tập", Hint: "Slide và ý chính" }, async (c, s) => {
    const [ic, col, active] = stepStates[s.name];
    asRow(c, { gap: 12, pad: [10, 12, 10, 16], fill: active ? "color/brand/50" : null, radius: "radius/md", cross: "MIN", w: 280 });
    if (active) {
      const bar = figma.createRectangle(); bar.name = "Active bar"; bar.resize(4, 40); bar.fills = [paint("color/brand/600")];
      c.appendChild(bar); bar.layoutPositioning = "ABSOLUTE"; bar.x = 0; bar.y = 4;
    }
    c.appendChild(icon(ic, 20, col));
    const col2 = box("VERTICAL", { name: "Text" });
    add(c, col2, "FILL");
    add(col2, await txt("1. Góc học tập", "Label", active ? "color/brand/700" : "color/ink/900", { name: "Title" }), "FILL");
    add(col2, await txt("Slide và ý chính", "Caption", "color/ink/500", { name: "Hint" }), "FILL");
  });

  // Step chip (thanh bước ngang, mobile)
  await variants(sec, "Step chip", [{ name: "Trạng thái=Đang mở" }, { name: "Trạng thái=Mặc định" }], { Label: "1. Góc học tập" }, async (c, s) => {
    const on = s.name.endsWith("Đang mở");
    asRow(c, { pad: [10, 14, 10, 14], fill: on ? "color/brand/600" : "color/surface", stroke: on ? "color/brand/600" : "color/line-strong", radius: "radius/full" });
    c.appendChild(await txt("1. Góc học tập", "Label", on ? "color/surface" : "color/ink/700", { name: "Label" }));
  });

  // Setup row (danh sách "Bắt đầu" của người mới)
  const setupSpecs = [];
  for (const d of ["Desktop", "Mobile"]) for (const st of ["Đã xong", "Tiếp theo", "Chưa làm"]) setupSpecs.push({ name: `Thiết bị=${d}, Trạng thái=${st}`, d, st });
  await variants(sec, "Setup row", setupSpecs, { Title: "1. Khảo sát hồ sơ học tập", Hint: "Kể về thói quen, giờ bận, điểm mạnh/yếu; xác nhận 12 trường" }, async (c, s) => {
    const next = s.st === "Tiếp theo";
    asRow(c, { gap: 16, pad: [16, 24, 16, 24], fill: next ? "color/brand/50" : null, cross: "MIN", w: s.d === "Desktop" ? 768 : 343 });
    c.appendChild(s.st === "Đã xong" ? icon("check", 24, "#059669") : icon("circle", 24, next ? "#0056D2" : "#636D85"));
    const col = box("VERTICAL", { name: "Text", gap: 2 });
    add(c, col, "FILL");
    add(col, await txt("1. Khảo sát hồ sơ học tập", "Label", s.st === "Đã xong" ? "color/ink/500" : "color/ink/900", { name: "Title" }), "FILL");
    add(col, await txt("Kể về thói quen…", "Body S", "color/ink/500", { name: "Hint" }), "FILL");
    if (s.d === "Desktop") {
      if (s.st === "Đã xong") c.appendChild(await txt("Đã xong", "Label", "color/success/700"));
      else if (next) c.appendChild(inst("Button", "Kiểu=Chính", { Label: "Tiếp tục", Icon: true }));
      else c.appendChild(await txt("Xem", "Label", "color/brand/600"));
    } else if (next) {
      col.itemSpacing = 6;
      col.appendChild(inst("Button", "Kiểu=Chính", { Label: "Tiếp tục", Icon: true }));
    }
  });

  // Header
  await variants(sec, "Header", [{ name: "Thiết bị=Desktop" }, { name: "Thiết bị=Mobile" }], { Initials: "L" }, async (c, s) => {
    const desk = s.name.endsWith("Desktop");
    asRow(c, { dir: "VERTICAL", fill: "color/surface", w: desk ? 1440 : 375, cross: "MIN" });
    const top = box("HORIZONTAL", { name: "Top", gap: 24, pad: [0, desk ? 112 : 16, 0, desk ? 112 : 16], cross: "CENTER", h: 64 });
    add(c, top, "FILL");
    if (!desk) top.appendChild(icon("menu", 20, "#333A47"));
    const logo = await txt("persoAI", "Logo", "color/ink/900", { name: "Logo" });
    logo.setRangeFills(0, 5, [paint("color/brand/600")]);
    top.appendChild(logo);
    if (desk) {
      const nav = box("HORIZONTAL", { name: "Nav", gap: 8, cross: "CENTER", h: 64 });
      add(top, nav);
      for (const [label, on] of [["Hôm nay", true], ["Kế hoạch tuần"], ["Lộ trình"], ["Môn học & tài liệu"], ["Báo cáo tuần"]]) {
        const item = box("VERTICAL", { name: "Nav item", pad: [0, 12, 0, 12], align: "CENTER", h: 64 });
        add(nav, item);
        item.appendChild(await txt(label, "Label", on ? "color/brand/600" : "color/ink/700"));
        if (on) {
          const u = figma.createRectangle(); u.name = "Underline"; u.resize(60, 3); u.fills = [paint("color/brand/600")];
          item.appendChild(u); u.layoutPositioning = "ABSOLUTE"; u.x = 12; u.y = 61;
          u.resize(item.width - 24, 3);
        }
      }
    }
    const spacer = box("HORIZONTAL", { name: "Spacer" });
    add(top, spacer, "FILL");
    const av = box("HORIZONTAL", { name: "Avatar", gap: 6, cross: "CENTER" });
    add(top, av);
    const circle = box("HORIZONTAL", { name: "Circle", fill: "color/brand/600", radius: "radius/full", align: "CENTER", cross: "CENTER", w: 32, h: 32 });
    add(av, circle);
    circle.appendChild(await txt("L", "Label", "color/surface", { name: "Initials" }));
    av.appendChild(icon("down", 16, "#48546E"));
    add(c, line(), "FILL");
    if (desk) {
      const bar = box("HORIZONTAL", { name: "Course bar", gap: 12, pad: [10, 112, 10, 112], cross: "CENTER" });
      add(c, bar, "FILL");
      const sel = box("HORIZONTAL", { name: "Course select", gap: 8, pad: [6, 10, 6, 10], stroke: "color/line-strong", radius: "radius/md", cross: "CENTER" });
      add(bar, sel);
      sel.appendChild(icon("book", 16, "#0056D2"));
      sel.appendChild(await txt("CSDL — Cơ sở dữ liệu", "Label", "color/ink/900"));
      sel.appendChild(icon("down", 16, "#48546E"));
      bar.appendChild(await txt("Thứ Năm, 05/11/2026", "Body S", "color/ink/500"));
      bar.appendChild(inst("Pill", "Tông=Trung tính", { Label: "Dữ liệu mẫu" }));
      add(c, line(), "FILL");
    }
  });

  // FAB "Hỏi Trợ lý"
  await variants(sec, "FAB", [{ name: "Thiết bị=Desktop" }, { name: "Thiết bị=Mobile" }], null, async (c, s) => {
    const desk = s.name.endsWith("Desktop");
    asRow(c, { gap: 8, pad: desk ? [0, 20, 0, 20] : [0, 0, 0, 0], fill: "color/brand/600", radius: "radius/full", align: "CENTER", h: 56 });
    if (!desk) { c.resize(56, 56); c.layoutSizingHorizontal = "FIXED"; }
    c.appendChild(icon("sparkles", 20, "#FFFFFF"));
    if (desk) c.appendChild(await txt("Hỏi Trợ lý", "Label", "color/surface"));
    await c.setEffectStyleIdAsync(TS.lift.id);
  });

  // Task banner
  await single(sec, "Task banner", async (c) => {
    asRow(c, { dir: "VERTICAL", gap: 16, pad: [24, 24, 24, 24], stroke: "color/line", radius: "radius/md", cross: "MIN", w: 1216 });
    const head = box("HORIZONTAL", { name: "Head", gap: 16, cross: "MIN" });
    add(c, head, "FILL");
    const col = box("VERTICAL", { name: "Text", gap: 4 });
    add(head, col, "FILL");
    add(col, await txt("Nhiệm vụ hôm nay · Cơ sở dữ liệu", "Eyebrow", "color/ink/500"), "FILL");
    add(col, await txt("JOIN và GROUP BY qua ví dụ", "H2", "color/ink/900", { name: "Title" }), "FILL");
    const meta = box("HORIZONTAL", { name: "Meta", gap: 20, wrap: true, cross: "CENTER" });
    add(col, meta, "FILL");
    meta.counterAxisSpacing = 8;
    for (const [ic, label, color] of [["clock", "45 phút"], ["target", "5 truy vấn"], ["flag", "Chạy đúng cả 5 câu"], ["file", "Slide_CSDL_Chuong4.pdf", "color/brand/600"]]) {
      const m = box("HORIZONTAL", { name: "Meta item", gap: 6, cross: "CENTER" });
      add(meta, m);
      m.appendChild(icon(ic, 16, "#48546E"));
      m.appendChild(await txt(label, color ? "Label" : "Body S", color || "color/ink/700"));
    }
    head.appendChild(inst("Pill", "Tông=Cảnh báo", { Label: "Đang làm" }));
    const prog = box("HORIZONTAL", { name: "Progress label" });
    add(c, prog, "FILL");
    add(prog, await txt("Tiến độ buổi học", "Caption strong", "color/ink/500"), "FILL");
    prog.appendChild(await txt("0/4 bước", "Caption strong", "color/ink/500", { name: "Progress" }));
    const track = box("HORIZONTAL", { name: "Track", fill: "color/slate-100", radius: "radius/full", h: 8 });
    add(c, track, "FILL");
  }, { Progress: "0/4 bước" });

  // Slide viewer (Góc học tập)
  await variants(sec, "Slide viewer", [{ name: "Thiết bị=Desktop" }, { name: "Thiết bị=Mobile" }], { Page: "7" }, async (c, s) => {
    const desk = s.name.endsWith("Desktop");
    asRow(c, { dir: "VERTICAL", stroke: "color/line", radius: "radius/md", cross: "MIN", w: desk ? 600 : 343, clip: true });
    const bar = box("HORIZONTAL", { name: "Toolbar", gap: 12, pad: [12, 16, 12, 16], fill: "color/surface", cross: "CENTER", wrap: !desk });
    add(c, bar, "FILL");
    if (!desk) bar.counterAxisSpacing = 10;
    const file = await txt("Slide_CSDL_Chuong4.pdf", "Label", "color/brand/600");
    add(bar, file, desk ? "FILL" : "FILL");
    const pager = box("HORIZONTAL", { name: "Pager", gap: 6, cross: "CENTER" });
    add(bar, pager);
    const sq = async (child) => { const b = box("HORIZONTAL", { name: "Pager button", stroke: "color/line-strong", radius: "radius/sm", align: "CENTER", cross: "CENTER", w: 28, h: 28 }); add(pager, b); b.appendChild(child); return b; };
    await sq(icon("left", 16, "#333A47"));
    pager.appendChild(await txt("Trang", "Body S", "color/ink/500"));
    const input = box("HORIZONTAL", { name: "Page input", stroke: "color/line-strong", radius: "radius/sm", align: "CENTER", cross: "CENTER", w: 36, h: 28 });
    add(pager, input);
    input.appendChild(await txt("7", "Body S", "color/ink/900", { name: "Page" }));
    pager.appendChild(await txt("/ 24", "Body S", "color/ink/500"));
    await sq(icon("right", 16, "#333A47"));
    add(c, line(), "FILL");
    const stage = box("VERTICAL", { name: "Stage", pad: desk ? [24, 24, 24, 24] : [12, 12, 12, 12], fill: "color/line", fillOpacity: 0.7 });
    add(c, stage, "FILL");
    const slide = box("VERTICAL", { name: "Slide · trang 7", gap: 14, pad: desk ? [28, 28, 32, 28] : [16, 16, 28, 16], fill: "color/surface", radius: "radius/sm" });
    await slide.setEffectStyleIdAsync(TS.lift.id);
    add(stage, slide, "FILL");
    add(slide, await txt("GROUP BY và HAVING", desk ? "Slide title" : "H2", "color/brand/700"), "FILL");
    for (const [label, cite] of [["WHERE lọc từng dòng, thực hiện trước khi nhóm", "S1"], ["HAVING lọc từng nhóm, thực hiện sau GROUP BY", "S2"]]) {
      const row = box("HORIZONTAL", { name: "Bullet", gap: 8, cross: "CENTER", wrap: true });
      add(slide, row, "FILL");
      row.counterAxisSpacing = 4;
      row.appendChild(dot(5, "color/ink/900"));
      const hl = box("HORIZONTAL", { name: "Highlight", pad: [0, 2, 0, 2], fill: "color/warning/100" });
      add(row, hl);
      hl.appendChild(await txt(label, desk ? "Slide body" : "Body S", "color/ink/900"));
      const chip = inst("Cite chip", "Trạng thái=Đang chọn", { Label: cite });
      row.appendChild(chip);
    }
    const code = box("VERTICAL", { name: "Code", pad: [10, 12, 10, 12], fill: "color/muted", radius: "radius/sm" });
    add(slide, code, "FILL");
    const lines = ["SELECT khoa, COUNT(*) AS so_sv", "FROM sinh_vien", "WHERE nam_sinh > 2002", "GROUP BY khoa", "HAVING COUNT(*) > 5;"];
    for (let k = 0; k < lines.length; k++) {
      const l = box("HORIZONTAL", { name: "Line", fill: k === 4 ? "color/warning/100" : null });
      add(code, l, "FILL");
      l.appendChild(await txt(lines[k], "Code", "color/ink/900"));
    }
    const num = await txt("7", "Caption", "color/ink/400", { align: "RIGHT" });
    add(slide, num, "FILL");
  }, null);

  // Key points
  await single(sec, "Key points", async (c) => {
    asRow(c, { dir: "VERTICAL", gap: 10, pad: [20, 20, 20, 20], stroke: "color/line", radius: "radius/md", cross: "MIN", w: 290 });
    add(c, await txt("Ý chính cần nắm", "H3", "color/ink/900"), "FILL");
    for (const k of ["WHERE lọc dòng, HAVING lọc nhóm.", "JOIN ghép bảng theo khóa; chọn đúng loại JOIN.", "Hàm gộp (COUNT, SUM) đi cùng GROUP BY."]) {
      const row = box("HORIZONTAL", { name: "Point", gap: 8, cross: "MIN" });
      add(c, row, "FILL");
      const d = box("HORIZONTAL", { name: "Dot wrap", pad: [8, 0, 0, 0] });
      add(row, d);
      d.appendChild(dot(4, "color/ink/700"));
      add(row, await txt(k, "Body S", "color/ink/700"), "FILL");
    }
  });

  // Assistant panel (Trợ lý học tập)
  await variants(sec, "Assistant panel", [{ name: "Thiết bị=Desktop" }, { name: "Thiết bị=Mobile" }], null, async (c, s) => {
    const desk = s.name.endsWith("Desktop");
    asRow(c, { dir: "VERTICAL", fill: "color/surface", stroke: "color/line", cross: "MIN", w: desk ? 380 : 375, h: desk ? 640 : 700, clip: true });
    if (desk) radius(c, "radius/lg");
    else { c.topLeftRadius = 16; c.topRightRadius = 16; }
    await c.setEffectStyleIdAsync(TS.lift.id);
    const head = box("HORIZONTAL", { name: "Header", gap: 12, pad: [12, 16, 12, 16], cross: "CENTER" });
    add(c, head, "FILL");
    const av = box("HORIZONTAL", { name: "Avatar", fill: "color/brand/600", radius: "radius/full", align: "CENTER", cross: "CENTER", w: 36, h: 36 });
    add(head, av);
    av.appendChild(icon("sparkles", 16, "#FFFFFF"));
    const ht = box("VERTICAL", { name: "Title" });
    add(head, ht, "FILL");
    add(ht, await txt("Trợ lý học tập", "H3", "color/ink/900"), "FILL");
    add(ht, await txt("● Nhiệm vụ: JOIN và GROUP BY · tuần 1", "Caption", "color/ink/500"), "FILL");
    head.appendChild(icon("x", 20, "#48546E"));
    add(c, line(), "FILL");
    const body = box("VERTICAL", { name: "Conversation", gap: 12, pad: [12, 16, 12, 16], clip: true });
    add(c, body, "FILL", "FILL");
    const view = box("HORIZONTAL", { name: "Viewing", gap: 6, pad: [8, 12, 8, 12], fill: "color/muted", stroke: "color/line", radius: "radius/md", cross: "CENTER" });
    add(body, view, "FILL");
    view.appendChild(icon("file", 14, "#48546E"));
    const vt = await txt("Đang xem: Slide_CSDL_Chuong4.pdf · trang 7", "Caption", "color/ink/500");
    bold(vt, "Slide_CSDL_Chuong4.pdf · trang 7");
    add(view, vt, "FILL");
    const q = box("HORIZONTAL", { name: "User row", align: "MAX" });
    add(body, q, "FILL");
    const bubble = box("HORIZONTAL", { name: "User bubble", pad: [8, 14, 8, 14], fill: "color/brand/600", radius: "radius/md" });
    add(q, bubble);
    bubble.appendChild(await txt("Khi nào dùng HAVING thay WHERE?", "Body S", "color/surface"));
    const ans = box("VERTICAL", { name: "Answer", gap: 8, pad: [14, 14, 14, 14], fill: "color/muted", stroke: "color/line", radius: "radius/md" });
    add(body, ans, "FILL");
    const points = [
      ["WHERE lọc từng dòng trước khi nhóm.", "từng dòng", "S1"],
      ["HAVING lọc từng nhóm sau GROUP BY, thường với COUNT, SUM...", "từng nhóm", "S2"],
      ["Ví dụ: HAVING COUNT(*) > 5 giữ khoa có trên 5 sinh viên.", "HAVING COUNT(*) > 5", "S2"],
    ];
    for (const [p, strong, cite] of points) {
      const row = box("HORIZONTAL", { name: "Point", gap: 8, cross: "MIN" });
      add(ans, row, "FILL");
      const d = box("HORIZONTAL", { name: "Dot wrap", pad: [9, 0, 0, 0] });
      add(row, d);
      d.appendChild(dot(4, "color/ink/700"));
      const t = await txt(p, "Body S", "color/ink/700");
      bold(t, strong, strong.startsWith("HAVING") ? F.mono : F.semibold);
      add(row, t, "FILL");
      row.appendChild(inst("Cite chip", cite === "S1" ? "Trạng thái=Đang chọn" : "Trạng thái=Mặc định", { Label: cite }));
    }
    add(ans, line(null, true), "FILL");
    add(ans, await txt("Nguồn trong tài liệu", "Caption", "color/ink/500"), "FILL");
    for (const [cite, page, on] of [["S1", "trang 7", true], ["S2", "trang 7–8", false]]) {
      const r = box("HORIZONTAL", { name: "Source", gap: 8, pad: [6, 8, 6, 8], fill: on ? "color/brand/50" : null, radius: "radius/sm", cross: "CENTER" });
      add(ans, r, "FILL");
      r.appendChild(inst("Cite chip", on ? "Trạng thái=Đang chọn" : "Trạng thái=Mặc định", { Label: cite }));
      r.appendChild(await txt("Slide_CSDL_Chuong4.pdf", "Caption strong", "color/brand/600"));
      r.appendChild(await txt("· " + page, "Caption", "color/ink/500"));
    }
    const links = box("HORIZONTAL", { name: "Actions", gap: 12, wrap: true, cross: "CENTER" });
    add(ans, links, "FILL");
    links.counterAxisSpacing = 4;
    for (const l of ["Giải thích kỹ hơn", "Cho ví dụ", "Tìm thêm trên web"]) links.appendChild(await txt(l, "Caption strong", "color/brand/600"));
    links.appendChild(await txt("Hữu ích?  1  2  3", "Caption", "color/ink/400"));
    for (const f of ["Phân biệt INNER và LEFT JOIN?", "Tuần này tôi còn gì?"]) {
      const chip = box("HORIZONTAL", { name: "Follow-up", pad: [4, 12, 4, 12], stroke: "color/brand/600", radius: "radius/full" });
      add(body, chip);
      chip.appendChild(await txt(f, "Caption strong", "color/brand/600"));
    }
    add(c, line(), "FILL");
    const foot = box("VERTICAL", { name: "Composer", gap: 6, pad: [12, 16, 12, 16] });
    add(c, foot, "FILL");
    const input = box("HORIZONTAL", { name: "Input", gap: 8, pad: [6, 6, 6, 12], stroke: "color/brand/600", radius: "radius/md", cross: "CENTER" });
    add(foot, input, "FILL");
    input.strokeWeight = 2;
    add(input, await txt("Hỏi về nhiệm vụ này…", "Body S", "color/ink/400"), "FILL");
    const send = box("HORIZONTAL", { name: "Send", fill: "color/brand/600", fillOpacity: 0.5, radius: "radius/sm", align: "CENTER", cross: "CENTER", w: 40, h: 32 });
    add(input, send);
    send.appendChild(icon("send", 16, "#FFFFFF"));
    add(foot, await txt("Trả lời ngắn, có nguồn. Thiếu bằng chứng thì Trợ lý nói rõ.", "Caption", "color/ink/500"), "FILL");
  });

  sec.children.forEach((n) => { if ("description" in n && (n.type === "COMPONENT" || n.type === "COMPONENT_SET")) n.description = "PersoAI v0.3 · dựng từ frontend/components (Coursera style)"; });
  // Xếp component thành lưới 2 cột.
  let x = 120, y = 160, colH = 0, k = 0;
  for (const n of sec.children) {
    n.x = x; n.y = y; colH = Math.max(colH, n.height);
    k++;
    if (k % 3 === 0) { x = 120; y += colH + 120; colH = 0; } else x += Math.max(n.width, 480) + 120;
  }
  const w = sec.children.reduce((m, n) => Math.max(m, n.x + n.width), 0) + 120;
  const h = sec.children.reduce((m, n) => Math.max(m, n.y + n.height), 0) + 120;
  sec.resizeWithoutConstraints(w, h);
  return sec.children.length;
}

/* ------------------------------------------------------------------ màn hình */

function screen(name, w) {
  const f = box("VERTICAL", { name, fill: "color/surface", w });
  f.clipsContent = true;
  return f;
}

async function stepsSidebar() {
  const side = box("VERTICAL", { name: "Sidebar", gap: 24, w: 280 });
  const nav = box("VERTICAL", { name: "Buổi học", gap: 2 });
  add(side, nav, "FILL");
  const label = box("HORIZONTAL", { name: "Label", pad: [0, 8, 8, 8] });
  add(nav, label, "FILL");
  label.appendChild(await txt("Buổi học", "Eyebrow", "color/ink/500"));
  const steps = [
    ["Trạng thái=Đang mở", "1. Góc học tập", "Slide và ý chính"],
    ["Trạng thái=Chưa làm", "2. Thực hành SQL", "Đạt 0/5 bài"],
    ["Trạng thái=Chưa làm", "3. Ghi nhật ký", "Trạng thái, số phút"],
    ["Trạng thái=Chưa làm", "4. Bài luyện cuối buổi", "3 câu · nhiệm vụ < 60 phút"],
  ];
  for (const [v, t, h] of steps) add(nav, inst("Step item", v, { Title: t, Hint: h }), "FILL");
  add(side, line(), "FILL");
  const other = box("VERTICAL", { name: "Nhiệm vụ khác", gap: 6 });
  add(side, other, "FILL");
  add(other, await txt("Nhiệm vụ khác trong tuần", "Label", "color/ink/900"), "FILL");
  add(other, await txt("Chưa có nhiệm vụ nào khác đã xong hoặc quá hạn.", "Body S", "color/ink/500"), "FILL");
  add(other, await txt("Quá hạn tính tự động theo giờ Việt Nam.", "Caption", "color/ink/400"), "FILL");
  return side;
}

async function todayDesktop(name) {
  const s = screen(name, 1440);
  add(s, inst("Header", "Thiết bị=Desktop", { Initials: "L" }), "FILL");
  const content = box("VERTICAL", { name: "Content", gap: 24, pad: [24, 112, 120, 112] });
  add(s, content, "FILL");
  const title = box("VERTICAL", { name: "Page title", gap: 4 });
  add(content, title, "FILL");
  add(title, await txt("Hôm nay", "Page title"), "FILL");
  add(title, await txt("Thứ Năm, 05/11/2026 · Cơ sở dữ liệu · Tuần 1 · 0/5 nhiệm vụ xong", "Body", "color/ink/500"), "FILL");
  add(content, inst("Task banner", ""), "FILL");
  const row = box("HORIZONTAL", { name: "Session", gap: 24, cross: "MIN" });
  add(content, row, "FILL");
  add(row, await stepsSidebar());
  const main = box("VERTICAL", { name: "Step · Góc học tập", gap: 16 });
  add(row, main, "FILL");
  const head = box("HORIZONTAL", { name: "Step header", cross: "CENTER" });
  add(main, head, "FILL");
  const ht = box("VERTICAL", { name: "Title" });
  add(head, ht, "FILL");
  add(ht, await txt("Bước 1/4", "Body S", "color/ink/500"), "FILL");
  add(ht, await txt("Góc học tập", "H2"), "FILL");
  head.appendChild(inst("Button", "Kiểu=Ghost", { Label: "Bước tiếp", Icon: true }));
  add(main, line(), "FILL");
  const study = box("HORIZONTAL", { name: "Study", gap: 20, cross: "MIN" });
  add(main, study, "FILL");
  add(study, inst("Slide viewer", "Thiết bị=Desktop"), "FILL");
  add(study, inst("Key points", ""));
  const cta = box("HORIZONTAL", { name: "CTA", gap: 16, cross: "CENTER" });
  add(main, cta, "FILL");
  cta.appendChild(inst("Button", "Kiểu=Chính", { Label: "Đã đọc xong, sang Thực hành", Icon: true }));
  cta.appendChild(await txt("Hỏi đáp không bắt buộc", "Body S", "color/ink/500"));
  return s;
}

function floatBottomRight(screenNode, node, inset) {
  screenNode.appendChild(node);
  node.layoutPositioning = "ABSOLUTE";
  node.x = screenNode.width - node.width - inset;
  node.y = screenNode.height - node.height - inset;
  node.constraints = { horizontal: "MAX", vertical: "MAX" };
}

async function startDesktop(done) {
  const s = screen(`Desktop / Bắt đầu — Lan ${done}/4`, 1440);
  add(s, inst("Header", "Thiết bị=Desktop", { Initials: "L" }), "FILL");
  const content = box("VERTICAL", { name: "Content", gap: 24, pad: [24, 112, 160, 112] });
  add(s, content, "FILL");
  const title = box("VERTICAL", { name: "Page title", gap: 4 });
  add(content, title, "FILL");
  add(title, await txt(`Chào Lan, còn ${4 - done} bước để bắt đầu học`, "Page title"), "FILL");
  add(title, await txt("Thứ Năm, 05/11/2026 · Thiết lập một lần cho mỗi mục tiêu, sau đó PersoAI giao nhiệm vụ mỗi ngày.", "Body", "color/ink/500"), "FILL");
  content.appendChild(await setupCard("Desktop", 768, done));
  content.appendChild(await txt("Mọi bản nháp do AI soạn (hồ sơ, lộ trình, kế hoạch) chỉ được lưu khi bạn xác nhận.", "Body S", "color/ink/500"));
  return s;
}

async function setupCard(device, w, done) {
  const card = box("VERTICAL", { name: "Bắt đầu", stroke: "color/line", radius: "radius/md", w, clip: true });
  const head = box("VERTICAL", { name: "Head", gap: 12, pad: [16, device === "Desktop" ? 24 : 20, 16, device === "Desktop" ? 24 : 20] });
  add(card, head, "FILL");
  const r = box("HORIZONTAL", { name: "Title row", cross: "CENTER" });
  add(head, r, "FILL");
  add(r, await txt("Bắt đầu", "H2"), "FILL");
  r.appendChild(await txt(`${done}/4 bước`, "Label", "color/ink/500"));
  const track = box("HORIZONTAL", { name: "Track", fill: "color/slate-100", radius: "radius/full", h: 8 });
  add(head, track, "FILL");
  if (done > 0) add(track, box("HORIZONTAL", { name: "Fill", fill: "color/brand/600", radius: "radius/full", w: Math.round(((w - 48) * done) / 4), h: 8 }));
  const rows = [
    ["Đã xong", "1. Khảo sát hồ sơ học tập", "Kể về thói quen, giờ bận, điểm mạnh/yếu; xác nhận 12 trường"],
    ["Tiếp theo", "2. Thêm môn học và tài liệu", "Mục tiêu, hạn chót và ít nhất một tài liệu đã lập chỉ mục"],
    ["Chưa làm", "3. Chọn hướng học và xác nhận lộ trình", "Chọn 1 trong 2–3 hướng, lộ trình qua kiểm tra R1–R6"],
    ["Chưa làm", "4. Xác nhận kế hoạch tuần", "Nhiệm vụ theo ngày cho tuần kế tiếp, qua kiểm tra V1–V10"],
  ];
  rows.forEach(([, t, h], i) => {
    const st = i < done ? "Đã xong" : i === done ? "Tiếp theo" : "Chưa làm";
    add(card, line(), "FILL");
    add(card, inst("Setup row", `Thiết bị=${device}, Trạng thái=${st}`, { Title: t, Hint: h }), "FILL");
  });
  return card;
}

async function todayMobile(name) {
  const s = screen(name, 375);
  add(s, inst("Header", "Thiết bị=Mobile", { Initials: "L" }), "FILL");
  const content = box("VERTICAL", { name: "Content", gap: 20, pad: [20, 16, 120, 16] });
  add(s, content, "FILL");
  const title = box("VERTICAL", { name: "Page title", gap: 4 });
  add(content, title, "FILL");
  add(title, await txt("Hôm nay", "Page title"), "FILL");
  add(title, await txt("Thứ Năm, 05/11/2026 · Cơ sở dữ liệu · Tuần 1 · 0/5 nhiệm vụ xong", "Body", "color/ink/500"), "FILL");
  const banner = inst("Task banner", "");
  add(content, banner, "FILL");
  const strip = box("HORIZONTAL", { name: "Step strip (vuốt ngang)", gap: 8, clip: true });
  add(content, strip, "FILL");
  strip.primaryAxisSizingMode = "FIXED";
  for (const [v, l] of [["Trạng thái=Đang mở", "1. Góc học tập"], ["Trạng thái=Mặc định", "2. Thực hành SQL"], ["Trạng thái=Mặc định", "3. Ghi nhật ký"], ["Trạng thái=Mặc định", "4. Bài luyện cuối buổi"]]) strip.appendChild(inst("Step chip", v, { Label: l }));
  const head = box("HORIZONTAL", { name: "Step header", cross: "CENTER" });
  add(content, head, "FILL");
  const ht = box("VERTICAL", { name: "Title" });
  add(head, ht, "FILL");
  add(ht, await txt("Bước 1/4", "Body S", "color/ink/500"), "FILL");
  add(ht, await txt("Góc học tập", "H2"), "FILL");
  head.appendChild(inst("Button", "Kiểu=Ghost", { Label: "Bước tiếp", Icon: true }));
  add(content, line(), "FILL");
  add(content, inst("Slide viewer", "Thiết bị=Mobile"), "FILL");
  const kp = inst("Key points", "");
  add(content, kp, "FILL");
  content.appendChild(inst("Button", "Kiểu=Chính", { Label: "Đã đọc xong, sang Thực hành", Icon: true }));
  content.appendChild(await txt("Hỏi đáp không bắt buộc", "Body S", "color/ink/500"));
  add(content, line(), "FILL");
  const other = box("VERTICAL", { name: "Nhiệm vụ khác", gap: 6 });
  add(content, other, "FILL");
  add(other, await txt("Nhiệm vụ khác trong tuần", "Label"), "FILL");
  add(other, await txt("Chưa có nhiệm vụ nào khác đã xong hoặc quá hạn.", "Body S", "color/ink/500"), "FILL");
  return s;
}

async function startMobile(done) {
  const s = screen(`Mobile / Bắt đầu — Lan ${done}/4`, 375);
  add(s, inst("Header", "Thiết bị=Mobile", { Initials: "L" }), "FILL");
  const content = box("VERTICAL", { name: "Content", gap: 20, pad: [20, 16, 120, 16] });
  add(s, content, "FILL");
  add(content, await txt(`Chào Lan, còn ${4 - done} bước để bắt đầu học`, "Page title"), "FILL");
  add(content, await txt("Thứ Năm, 05/11/2026 · Thiết lập một lần cho mỗi mục tiêu, sau đó PersoAI giao nhiệm vụ mỗi ngày.", "Body", "color/ink/500"), "FILL");
  const card = await setupCard("Mobile", 343, done);
  add(content, card, "FILL");
  add(content, await txt("Mọi bản nháp do AI soạn chỉ được lưu khi bạn xác nhận.", "Body S", "color/ink/500"), "FILL");
  return s;
}

async function buildScreens(deskSec, mobSec, deskPage, mobPage) {
  await figma.setCurrentPageAsync(deskPage);
  const d1 = await todayDesktop("Desktop / Hôm nay — Góc học tập (Lan, tuần 1)");
  deskSec.appendChild(d1);
  floatBottomRight(d1, inst("FAB", "Thiết bị=Desktop"), 24);
  const d2 = await todayDesktop("Desktop / Hôm nay — Trợ lý đang mở");
  deskSec.appendChild(d2);
  d2.layoutSizingVertical = "FIXED";
  d2.resize(1440, 1100);
  floatBottomRight(d2, inst("Assistant panel", "Thiết bị=Desktop"), 24);
  const d3 = await startDesktop(1);
  deskSec.appendChild(d3);
  floatBottomRight(d3, inst("FAB", "Thiết bị=Desktop"), 24);
  const d0 = await startDesktop(0);
  deskSec.appendChild(d0);
  floatBottomRight(d0, inst("FAB", "Thiết bị=Desktop"), 24);
  const d4 = await startDesktop(3);
  deskSec.appendChild(d4);
  floatBottomRight(d4, inst("FAB", "Thiết bị=Desktop"), 24);
  // Thứ tự theo luồng: 0/4 → 1/4 → 3/4 → buổi đầu → Trợ lý.
  for (const n of [d0, d3, d4, d1, d2]) deskSec.appendChild(n);
  layoutSection(deskSec, 120);

  await figma.setCurrentPageAsync(mobPage);
  const m1 = await todayMobile("Mobile / Hôm nay — Góc học tập (Lan, tuần 1)");
  mobSec.appendChild(m1);
  floatBottomRight(m1, inst("FAB", "Thiết bị=Mobile"), 24);
  const m2 = await todayMobile("Mobile / Hôm nay — Trợ lý đang mở");
  mobSec.appendChild(m2);
  m2.layoutSizingVertical = "FIXED";
  m2.resize(375, 812);
  const sheet = inst("Assistant panel", "Thiết bị=Mobile");
  m2.appendChild(sheet);
  sheet.layoutPositioning = "ABSOLUTE";
  sheet.x = 0; sheet.y = 812 - sheet.height;
  sheet.constraints = { horizontal: "STRETCH", vertical: "MAX" };
  const m3 = await startMobile(1);
  mobSec.appendChild(m3);
  floatBottomRight(m3, inst("FAB", "Thiết bị=Mobile"), 24);
  const m0 = await startMobile(0);
  mobSec.appendChild(m0);
  floatBottomRight(m0, inst("FAB", "Thiết bị=Mobile"), 24);
  const m4 = await startMobile(3);
  mobSec.appendChild(m4);
  floatBottomRight(m4, inst("FAB", "Thiết bị=Mobile"), 24);
  for (const n of [m0, m3, m4, m1, m2]) mobSec.appendChild(n);
  layoutSection(mobSec, 120);
  return [d0, d3, d4, d1, d2, m0, m3, m4, m1, m2].map((n) => n.name);
}

/* ------------------------------------------------------------------ ảnh tham chiếu */

async function placeImages(device, files) {
  const page = await openPage(device);
  const sec = section(page, device === "desktop" ? SEC.deskShots : SEC.mobShots);
  const width = device === "desktop" ? 1280 : 375;
  const perRow = device === "desktop" ? 5 : 8;
  const gap = 120;
  // Chỉ lấy ảnh nằm trong luồng người mới, xếp đúng thứ tự FLOW; nhóm "trạng thái trống" xuống hàng riêng.
  const picked = [];
  for (const [id, group, label] of FLOW) {
    const f = files.find((x) => x.name.startsWith(id + "-"));
    if (f) picked.push({ f, group, label });
  }
  let x = gap, y = 160, rowH = 0, col = 0, prev = "main", n = 0;
  for (const { f, group, label } of picked) {
    if (group !== prev) { x = gap; y += rowH + gap; rowH = 0; col = 0; prev = group; }
    const img = figma.createImage(f.bytes);
    const h = Math.round((f.h / f.w) * width);
    const frame = figma.createFrame();
    frame.name = f.name.replace(/\.png$/i, "");
    frame.resize(width, h);
    frame.fills = [{ type: "IMAGE", imageHash: img.hash, scaleMode: "FILL" }];
    n++;
    const cap = await txt(group === "main" ? `${n}. ${label}` : label, "Label", "color/ink/500");
    sec.appendChild(cap);
    sec.appendChild(frame);
    cap.x = x; cap.y = y; frame.x = x; frame.y = y + 32;
    rowH = Math.max(rowH, h + 32);
    col++;
    if (col % perRow === 0) { x = gap; y += rowH + gap; rowH = 0; } else x += width + gap;
  }
  const w = sec.children.reduce((m, c) => Math.max(m, c.x + c.width), 0) + gap;
  const hh = sec.children.reduce((m, c) => Math.max(m, c.y + c.height), 0) + gap;
  sec.resizeWithoutConstraints(Math.max(w, 800), Math.max(hh, 600));
  return picked.length;
}

/* ------------------------------------------------------------------ chạy */

async function build() {
  const fam = await pickFonts();
  say(`Font: ${fam} (${F.semibold.style}); code: ${F.mono.family}`);

  // Xoá sạch: nội dung 3 trang + biến/style của giao diện cũ.
  const removed = [];
  for (const key of ["desktop", "mobile", "components"]) removed.push(`${PAGE_NAME[key]} ${wipe(await openPage(key))}`);
  say(`Đã xoá node cũ: ${removed.join(", ")}`);
  say(`Đã bỏ biến/style cũ: ${await dropOldStyles()}`);

  const nVars = await ensureVariables();
  await ensureTextStyles();
  say(`Biến: ${nVars}; text style: ${TEXT_STYLES.length}; effect: 1`);

  const compPage = await openPage("components");
  const compSec = section(compPage, SEC.comp);
  const nComp = await buildComponents(compSec);
  say(`Component: ${nComp}`);

  const deskPage = await openPage("desktop");
  const deskSec = section(deskPage, SEC.desk);
  section(deskPage, SEC.deskShots);
  const mobPage = await openPage("mobile");
  const mobSec = section(mobPage, SEC.mob);
  section(mobPage, SEC.mobShots);

  const names = await buildScreens(deskSec, mobSec, deskPage, mobPage);
  // Section màn chính vừa nở ra: đẩy section ảnh chụp xuống dưới cho khỏi đè.
  for (const [page, main, shots] of [[deskPage, deskSec, SEC.deskShots], [mobPage, mobSec, SEC.mobShots]]) {
    const s = page.children.find((n) => n.type === "SECTION" && n.name === shots);
    if (s) { s.x = main.x; s.y = main.y + main.height + 400; }
  }
  say("Màn dựng lại: " + names.join(" | "));
  await figma.setCurrentPageAsync(deskPage);
  figma.viewport.scrollAndZoomIntoView([deskSec]);
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "build") {
      await build();
      figma.ui.postMessage({ type: "done", text: "Xong. Kiểm tra trang Desktop, Mobile và Thành phần & Token; sau đó chèn ảnh chụp." });
    } else if (msg.type === "images") {
      if (!TS.Label) { await pickFonts(); await ensureVariables(); await ensureTextStyles(); }
      const n = await placeImages(msg.device, msg.files);
      figma.ui.postMessage({ type: "done", text: `Đã chèn ${n} ảnh ${msg.device}.` });
    }
  } catch (e) {
    figma.ui.postMessage({ type: "done", text: "Lỗi: " + (e && e.message ? e.message : String(e)) });
  }
};
