@echo off
title SUNMADHI STORE - Restore
cd /d "%~dp0"

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker is not running. Start Docker Desktop and run start-app.bat first.
  pause
  exit /b 1
)

echo Available backups (newest first):
echo -----------------------------------
dir /b /o-d backups\*.sql
echo -----------------------------------
echo.
set /p CHOICE=Type the backup file name exactly (example: sunmadhi-2026-10-28_21-30.sql): 
if not exist "backups\%CHOICE%" (
  echo That file was not found in the backups folder.
  pause
  exit /b 1
)

echo.
echo WARNING: this REPLACES all current store data with the backup "%CHOICE%".
set /p OK=Type YES to continue: 
if /i not "%OK%"=="YES" (
  echo Cancelled.
  pause
  exit /b 0
)

echo Saving a safety copy of the current data first...
call "%~dp0backup-data.bat" auto

docker compose stop app
echo Restoring...
docker compose exec -T db psql -U postgres -d sunmadhi_store < "backups\%CHOICE%"
docker compose start app

echo.
echo Restore finished. Open http://localhost:5055 and check your data.
pause
