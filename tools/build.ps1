# =====================================================================
# GoldenAge AI — Build APK (Android) and EXE (Windows)
# =====================================================================
# Run after `tools\install_flutter.ps1` and after the Supabase project
# has been provisioned (or against the mock-data fallback).
#
# Usage:
#   .\tools\build.ps1            # builds both APK and EXE
#   .\tools\build.ps1 android    # APK only
#   .\tools\build.ps1 windows    # EXE only
#   .\tools\build.ps1 web        # Web bundle (quick preview)
#
# Outputs:
#   build\app\outputs\flutter-apk\app-release.apk
#   build\windows\x64\runner\Release\goldenage_ai.exe
# =====================================================================
param(
  [ValidateSet("all","android","windows","web")]
  [string]$Target = "all"
)

$ErrorActionPreference = "Stop"
$Root   = Split-Path -Parent $PSScriptRoot
$AppName = "goldenage_ai"

# --- Load secrets from .env if present ---------------------------------
$EnvFile = Join-Path $Root ".env"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
      $name = $matches[1].Trim()
      $val  = $matches[2].Trim()
      Set-Item -Path "Env:$name" -Value $val
    }
  }
}

# --- Build --dart-define args from env ----------------------------------
$defines = @()
if ($env:SUPABASE_URL)          { $defines += "--dart-define=SUPABASE_URL=$env:SUPABASE_URL" }
if ($env:SUPABASE_ANON_KEY)     { $defines += "--dart-define=SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY" }
if ($env:AMAP_API_KEY)           { $defines += "--dart-define=AMAP_API_KEY=$env:AMAP_API_KEY" }
if ($env:OPENAI_API_KEY)         { $defines += "--dart-define=OPENAI_API_KEY=$env:OPENAI_API_KEY" }
if ($env:ANTHROPIC_API_KEY)      { $defines += "--dart-define=ANTHROPIC_API_KEY=$env:ANTHROPIC_API_KEY" }
if ($env:OPENAI_PROVIDER)        { $defines += "--dart-define=OPENAI_PROVIDER=$env:OPENAI_PROVIDER" }
$DefineArgs = $defines -join " "

# --- Ensure platform folders exist --------------------------------------
Push-Location $Root
try {
  if (-not (Test-Path "android")) {
    Write-Host "Scaffolding android/ + windows/ platforms..." -ForegroundColor Yellow
    flutter create --org com.goldenage --platforms=android,windows --project-name $AppName .
  }

  Write-Host "Running pub get + l10n..." -ForegroundColor Cyan
  flutter pub get
  flutter gen-l10n

  switch ($Target) {
    "android"  { Build-Android  }
    "windows"  { Build-Windows  }
    "web"      { Build-Web      }
    "all"      {
      Build-Android
      Build-Windows
    }
  }
}
finally { Pop-Location }

function Build-Android {
  Write-Host ""
  Write-Host "Building Android APK (release)..." -ForegroundColor Cyan
  flutter build apk --release $DefineArgs
  $apk = "build\app\outputs\flutter-apk\app-release.apk"
  if (Test-Path $apk) {
    Write-Host "✅ APK ready: $Root\$apk" -ForegroundColor Green
    $size = (Get-Item $apk).Length / 1MB
    Write-Host ("   size: {0:N2} MB" -f $size)
  } else {
    Write-Host "❌ APK not found at expected path" -ForegroundColor Red
  }
}

function Build-Windows {
  Write-Host ""
  Write-Host "Building Windows EXE (release)..." -ForegroundColor Cyan
  flutter build windows --release $DefineArgs
  $exe = "build\windows\x64\runner\Release\${AppName}.exe"
  if (Test-Path $exe) {
    Write-Host "✅ EXE ready: $Root\$exe" -ForegroundColor Green
  } else {
    # Fallback to the default runner.exe
    $exe = "build\windows\x64\runner\Release\goldenage_ai.exe"
    if (Test-Path $exe) {
      Write-Host "✅ EXE ready: $Root\$exe" -ForegroundColor Green
    } else {
      Write-Host "❌ EXE not found" -ForegroundColor Red
      Get-ChildItem build\windows -Recurse -Filter *.exe | ForEach-Object { Write-Host "   found: $($_.FullName)" }
    }
  }
}

function Build-Web {
  Write-Host ""
  Write-Host "Building web bundle..." -ForegroundColor Cyan
  flutter build web --release $DefineArgs
  Write-Host "✅ Web bundle: $Root\build\web\" -ForegroundColor Green
}
