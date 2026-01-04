# Qalam - Clean Build Script
# Run this to create a distributable installer

Write-Host "🧹 Cleaning build caches..." -ForegroundColor Cyan

# Stop any running Electron processes
Get-Process | Where-Object { $_.ProcessName -eq 'electron' } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean electron-builder cache
$cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache"
if (Test-Path $cacheDir) {
    Remove-Item -Recurse -Force $cacheDir -ErrorAction SilentlyContinue
    Write-Host "Cleared electron-builder cache" -ForegroundColor Green
}

# Clean electron cache
$electronCache = "$env:LOCALAPPDATA\electron"
if (Test-Path $electronCache) {
    Remove-Item -Recurse -Force $electronCache -ErrorAction SilentlyContinue
    Write-Host "Cleared electron cache" -ForegroundColor Green
}

# Clean dist folders
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    Write-Host "Cleared dist folder" -ForegroundColor Green
}

if (Test-Path "dist-electron") {
    Remove-Item -Recurse -Force "dist-electron" -ErrorAction SilentlyContinue
    Write-Host "Cleared dist-electron folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "Building Qalam..." -ForegroundColor Cyan
Write-Host ""

# Build the app
npm run build

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Output location: $PWD\dist\win-unpacked" -ForegroundColor Yellow
} else {
    Write-Host "Build failed. Check errors above." -ForegroundColor Red
}
