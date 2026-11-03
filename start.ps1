# PersoAI ban-2 — mở 3 dịch vụ, mỗi dịch vụ một cửa sổ PowerShell riêng.
# Chạy: powershell -ExecutionPolicy Bypass -File .\start.ps1
# (Cần chạy "npm install" trong frontend/backend và "pip install -r requirements.txt" trong ai-service trước.)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 0) PostgreSQL qua Docker (bỏ qua nếu đã tự cài PostgreSQL)
if (Get-Command docker -ErrorAction SilentlyContinue) { docker compose -f (Join-Path $root 'docker-compose.yml') up -d }

# 1) Python ai-service — cổng 5000
$py = Join-Path $root 'ai-service'
$venvPython = Join-Path $py '.venv\Scripts\python.exe'
$pyCmd = if (Test-Path $venvPython) { "& '$venvPython'" } else { 'python' }
Start-Process powershell -WorkingDirectory $py -ArgumentList @(
  '-NoExit', '-Command',
  "`$host.UI.RawUI.WindowTitle = 'ai-service :5000'; $pyCmd -m uvicorn main:app --port 5000"
)

# 2) NestJS backend — cổng 4000
$be = Join-Path $root 'backend'
Start-Process powershell -WorkingDirectory $be -ArgumentList @(
  '-NoExit', '-Command',
  "`$host.UI.RawUI.WindowTitle = 'backend :4000'; `$env:PORT='4000'; `$env:PY_URL='http://localhost:5000'; `$env:DATABASE_URL='postgresql://persoai:persoai@localhost:5432/persoai'; npm run start:dev"
)

# 3) Next.js frontend — cổng 3000
$fe = Join-Path $root 'frontend'
Start-Process powershell -WorkingDirectory $fe -ArgumentList @(
  '-NoExit', '-Command',
  "`$host.UI.RawUI.WindowTitle = 'frontend :3000'; `$env:NEXT_PUBLIC_API_URL='http://localhost:4000'; npm run dev"
)

Write-Host 'Đã mở 3 cửa sổ:'
Write-Host '  Frontend : http://localhost:3000'
Write-Host '  Backend  : http://localhost:4000/api/health'
Write-Host '  AI (Py)  : http://localhost:5000/health'
Write-Host '  Postgres : localhost:5432 (persoai/persoai)'
