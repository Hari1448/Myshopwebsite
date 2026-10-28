@echo off
cd /d "%~dp0"
echo Saving a backup before stopping...
call "%~dp0backup-data.bat" auto
docker compose down
echo.
echo SUNMADHI STORE stopped. Your data is saved.
timeout /t 5 >nul
