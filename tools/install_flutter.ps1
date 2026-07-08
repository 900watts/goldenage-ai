#!/usr/bin/env bash
# =====================================================================
# GoldenAge AI — Flutter SDK installer (Windows PowerShell + WSL)
# =====================================================================
# Downloads the official Flutter stable SDK, adds it to PATH, runs
# `flutter doctor` and `flutter precache`. Use this once, then run
# `bin\build.ps1` to produce the .apk (Android) and .exe (Windows).
#
# Usage (PowerShell as Administrator):
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\tools\install_flutter.ps1
# =====================================================================
$ErrorActionPreference = "Stop"

$Version    = "3.24.5"
$InstallDir = "C:\src\flutter"
$ZipUrl     = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_${Version}-stable.zip"
$ZipFile    = "$env:TEMP\flutter.zip"

Write-Host "Downloading Flutter $Version from $ZipUrl..." -ForegroundColor Cyan
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile -UseBasicParsing

Write-Host "Extracting to $InstallDir..." -ForegroundColor Cyan
if (Test-Path $InstallDir) { Remove-Item $InstallDir -Recurse -Force }
Expand-Archive -Path $ZipFile -DestinationPath "C:\src"

Write-Host "Adding to user PATH..." -ForegroundColor Cyan
$UserPath  = [Environment]::GetEnvironmentVariable("Path","User")
$FlutterBin = "$InstallDir\bin"
if ($UserPath -notlike "*$FlutterBin*") {
  [Environment]::SetEnvironmentVariable("Path","$UserPath;$FlutterBin","User")
  $env:Path = "$env:Path;$FlutterBin"
}

Write-Host "Running flutter doctor + precache..." -ForegroundColor Cyan
& "$InstallDir\bin\flutter.bat" --disable-analytics
& "$InstallDir\bin\flutter.bat" precache --android --windows --no-ios --no-macos --no-linux --no-fuchsia --no-web

Write-Host ""
Write-Host "Done. Open a NEW terminal and run:" -ForegroundColor Green
Write-Host "  cd C:\Users\red_w\WorkBuddy\2026-07-08-17-35-06"
Write-Host "  flutter --version"
Write-Host "  .\tools\build.ps1 android    # builds APK"
Write-Host "  .\tools\build.ps1 windows    # builds Windows .exe"
