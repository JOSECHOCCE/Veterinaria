Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $repoRoot 'src\Frontend'
$backendProj = Join-Path $repoRoot 'src\Backend\Veterinaria.Web\Veterinaria.Web.csproj'

Write-Host 'Building frontend...' -ForegroundColor Cyan
Push-Location $frontendPath
npm run build
Pop-Location

Write-Host 'Starting backend (serves frontend from wwwroot)...' -ForegroundColor Cyan
dotnet run --project $backendProj
