@echo off
title SUNMADHI STORE - Schedule daily backup
cd /d "%~dp0"
REM Runs backup-data.bat every day at 9:30 PM (change /ST to another time like 22:00)
schtasks /Create /SC DAILY /ST 21:30 /TN "SUNMADHI Daily Backup" /TR "\"%~dp0backup-data.bat\" auto" /F
echo.
echo Done. A backup will run every day at 9:30 PM while the computer and Docker are on.
echo To remove it later:  schtasks /Delete /TN "SUNMADHI Daily Backup" /F
pause
