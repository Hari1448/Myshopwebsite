@echo off
title SUNMADHI STORE - Backup
cd /d "%~dp0"

REM ---- Settings -------------------------------------------------
REM Optional second copy (pen drive / Google Drive folder). Example: set "EXTRA_COPY=G:\My Drive\SUNMADHI-backups"
set "EXTRA_COPY="
REM How many daily backups to keep
set "KEEP=30"
REM ---------------------------------------------------------------

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker is not running - backup skipped.
  if not "%~1"=="auto" pause
  exit /b 1
)

if not exist backups mkdir backups

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "STAMP=%%i"
set "FILE=backups\sunmadhi-%STAMP%.sql"

echo Saving store data to %FILE% ...
docker compose exec -T db pg_dump -U postgres --clean --if-exists sunmadhi_store > "%FILE%"
if errorlevel 1 goto failed

for %%A in ("%FILE%") do set "SIZE=%%~zA"
if %SIZE% LSS 1000 goto failed

if defined EXTRA_COPY (
  if not exist "%EXTRA_COPY%" mkdir "%EXTRA_COPY%"
  copy /y "%FILE%" "%EXTRA_COPY%\" >nul
  echo Second copy saved to %EXTRA_COPY%
)

powershell -NoProfile -Command "Get-ChildItem 'backups\sunmadhi-*.sql' | Sort-Object LastWriteTime -Descending | Select-Object -Skip %KEEP% | Remove-Item"

echo.
echo Backup finished: %FILE%
if not "%~1"=="auto" pause
exit /b 0

:failed
del "%FILE%" >nul 2>&1
echo.
echo BACKUP FAILED. Make sure the store is running (start-app.bat) and try again.
if not "%~1"=="auto" pause
exit /b 1
