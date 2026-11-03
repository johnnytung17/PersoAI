// Chạy các dịch vụ PersoAI trong một terminal, không cần cài thêm gói.
//   node scripts/dev.mjs            -> db + ai + be + fe
//   node scripts/dev.mjs fe be      -> chỉ chọn một số dịch vụ (db, ai, be, fe)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const win = process.platform === 'win32';
const venvPython = join(root, 'ai-service', '.venv', win ? 'Scripts/python.exe' : 'bin/python');
const python = existsSync(venvPython) ? venvPython : 'python';

const env = {
  ...process.env,
  PORT: '4000',
  PY_URL: 'http://localhost:5000',
  DATABASE_URL: 'postgresql://persoai:persoai@localhost:5432/persoai',
  NEXT_PUBLIC_API_URL: 'http://localhost:4000',
};

const services = {
  ai: { cwd: 'ai-service', cmd: python, args: ['-m', 'uvicorn', 'main:app', '--port', '5000'], color: 35 },
  be: { cwd: 'backend', cmd: 'npm', args: ['run', 'start:dev'], color: 33 },
  fe: { cwd: 'frontend', cmd: 'npm', args: ['run', 'dev'], color: 36 },
};

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : ['db', 'ai', 'be', 'fe'];

if (names.includes('db')) {
  console.log('[db] docker compose up -d');
  const r = spawnSync('docker', ['compose', 'up', '-d'], { cwd: root, stdio: 'inherit', shell: win });
  if (r.status !== 0) console.warn('[db] Không bật được Docker — backend sẽ trả 503 cho API dữ liệu.');
}

const children = [];
for (const name of names.filter((n) => services[n])) {
  const s = services[name];
  const child = spawn(s.cmd, s.args, { cwd: join(root, s.cwd), env, shell: win && s.cmd === 'npm' });
  const tag = `\x1b[${s.color}m[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (d) =>
      String(d).split(/\r?\n/).filter(Boolean).forEach((line) => out.write(tag + line + '\n')),
    );
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stdout);
  child.on('exit', (code) => console.log(`${tag}đã dừng (mã ${code})`));
  children.push(child);
}

const stop = () => {
  for (const c of children) {
    if (win) spawnSync('taskkill', ['/pid', String(c.pid), '/T', '/F'], { stdio: 'ignore' });
    else c.kill('SIGTERM');
  }
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

console.log('\nFrontend http://localhost:3000 | Backend http://localhost:4000/api/health | AI http://localhost:5000/health\nNhấn Ctrl+C để dừng tất cả.\n');
