# Script para iniciar contenedores ya creados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Desmochin Online - Iniciar" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Iniciando contenedores existentes..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "   Contenedores iniciados." -ForegroundColor Green
Write-Host ""

Write-Host "Estado de los contenedores:" -ForegroundColor Yellow
Write-Host ""
$containers = docker-compose ps
Write-Host $containers
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FRONTEND DISPONIBLE EN:" -ForegroundColor Green
Write-Host "  http://localhost:3001" -BackgroundColor Green -ForegroundColor Black
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Otros puertos:" -ForegroundColor Gray
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "  MongoDB:  localhost:5001" -ForegroundColor Gray
Write-Host "  Mongo Express:  http://localhost:8082" -ForegroundColor Gray
Write-Host ""
