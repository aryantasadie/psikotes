$zipPath = Join-Path $PSScriptRoot "client-portal-feature-bundle.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$tempDir = Join-Path $PSScriptRoot "scratch\client_bundle"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$files = @(
  "src/app/client/layout.tsx",
  "src/app/client/page.tsx",
  "src/app/api/client/reports/route.ts",
  "src/app/api/client/schedule/route.ts",
  "src/app/api/client/token-logs/route.ts",
  "src/app/superadmin/clients/page.tsx",
  "src/app/api/superadmin/clients/route.ts",
  "prisma/schema.prisma"
)

foreach ($f in $files) {
  $srcPath = Join-Path $PSScriptRoot $f
  if (Test-Path $srcPath) {
    $target = Join-Path $tempDir $f
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    Copy-Item $srcPath $target -Force
  }
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force
Write-Host "ZIP file created successfully:"
Get-Item $zipPath | Select-Object Name, Length, LastWriteTime
