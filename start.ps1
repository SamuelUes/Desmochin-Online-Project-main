# Script para iniciar el proyecto Desmochin Online con Docker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Desmochin Online - Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Instalar dependencias
Write-Host "[1/4] Instalando dependencias..." -ForegroundColor Yellow
Write-Host "   Backend..." -ForegroundColor Gray
Set-Location backend
npm install
Set-Location ..
Write-Host "   Frontend..." -ForegroundColor Gray
Set-Location frontend
npm install
Set-Location ..
Write-Host "   Dependencias instaladas." -ForegroundColor Green
Write-Host ""

# Paso 2: Construir imágenes Docker
Write-Host "[2/4] Construyendo imágenes Docker..." -ForegroundColor Yellow
docker-compose build
Write-Host "   Imágenes construidas." -ForegroundColor Green
Write-Host ""

# Paso 3: Iniciar contenedores
Write-Host "[3/4] Iniciando contenedores..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "   Contenedores iniciados." -ForegroundColor Green
Write-Host ""

# Paso 4: Mostrar puertos
Write-Host "[4/4] Estado de los contenedores:" -ForegroundColor Yellow
Write-Host ""
$containers = docker-compose ps
Write-Host $containers
Write-Host ""

# Resaltar puerto del frontend
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
