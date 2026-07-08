# GoldenAge AI — Supabase Setup (Windows PowerShell)
# Mirrors bin/setup_supabase.sh. Run from the repo root.
#
#   powershell -ExecutionPolicy Bypass -File bin\setup_supabase.ps1
#
# Requires: SUPABASE_MANAGEMENT_TOKEN, SUPABASE_ORG_ID, SUPABASE_DB_PASSWORD
#           in .env (copy from .env.example).
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
  Write-Host "❌  .env not found. Run: copy .env.example .env" -ForegroundColor Red
  exit 1
}

Get-Content .env | ForEach-Object {
  if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
    Set-Item -Path "Env:$($matches[1])" -Value $matches[2]
  }
}

foreach ($k in "SUPABASE_MANAGEMENT_TOKEN","SUPABASE_ORG_ID","SUPABASE_DB_PASSWORD") {
  if (-not (Test-Path "Env:$k")) { throw "Missing $k in .env" }
}

$region = if ($env:SUPABASE_REGION) { $env:SUPABASE_REGION } else { "ap-southeast-1" }
$name   = "goldenage-ai"
$api    = "https://api.supabase.com/v1"
$hdr    = @{ Authorization = "Bearer $env:SUPABASE_MANAGEMENT_TOKEN"; "Content-Type" = "application/json" }

Write-Host "🚀  Creating Supabase project '$name' in region $region…" -ForegroundColor Cyan
$body = @{ name=$name; organization_id=$env:SUPABASE_ORG_ID; db_pass=$env:SUPABASE_DB_PASSWORD; region=$region; plan="free" } | ConvertTo-Json
$res  = Invoke-RestMethod -Method POST -Uri "$api/projects" -Headers $hdr -Body $body
$pid  = $res.id
if (-not $pid) { Write-Host "❌  Failed: $($res | ConvertTo-Json -Depth 5)"; exit 1 }
Write-Host "✅  Project created: $pid" -ForegroundColor Green

Write-Host "⏳  Waiting for ACTIVE_HEALTHY (this can take ~90s)…" -ForegroundColor Yellow
for ($i = 0; $i -lt 30; $i++) {
  $p = Invoke-RestMethod -Method GET -Uri "$api/projects/$pid" -Headers $hdr
  if ($p.status -eq "ACTIVE_HEALTHY") { Write-Host "✅  ACTIVE after $((($i+1)*5))s"; break }
  Start-Sleep -Seconds 5
  Write-Host "   …status=$($p.status)"
}

$keys = Invoke-RestMethod -Method GET -Uri "$api/projects/$pid/api-keys" -Headers $hdr
$anon = ($keys | Where-Object { $_.name -eq "anon" }).api_key
$svc  = ($keys | Where-Object { $_.name -eq "service_role" }).api_key
$url  = $p.endpoint

$envText = Get-Content .env
$envText = $envText -replace '^SUPABASE_URL=.*',               "SUPABASE_URL=$url"
$envText = $envText -replace '^SUPABASE_ANON_KEY=.*',          "SUPABASE_ANON_KEY=$anon"
$envText = $envText -replace '^SUPABASE_SERVICE_ROLE_KEY=.*',  "SUPABASE_SERVICE_ROLE_KEY=$svc"
Set-Content -Path .env -Value $envText
Write-Host "📝  .env updated." -ForegroundColor Green

Write-Host "🎉  Done. Project URL: $url" -ForegroundColor Green
Write-Host "Run: flutter run --dart-define=SUPABASE_URL=$url --dart-define=SUPABASE_ANON_KEY=$anon"
