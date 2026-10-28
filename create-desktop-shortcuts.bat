@echo off
title SUNMADHI STORE - Create desktop shortcuts
cd /d "%~dp0"

for /f "delims=" %%D in ('powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"') do set "DESK=%%D"

REM 1) Shortcut that opens the store in the browser
(
  echo [InternetShortcut]
  echo URL=http://localhost:5055
) > "%DESK%\SUNMADHI STORE.url"

REM 2) Shortcut that starts the store (use only if the site does not open)
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%DESK%\Start SUNMADHI STORE.lnk'); $s.TargetPath='%~dp0start-app.bat'; $s.WorkingDirectory='%~dp0'; $s.Save()"

echo.
echo Done. Two icons were added to your Desktop:
echo   SUNMADHI STORE        - opens the website
echo   Start SUNMADHI STORE  - starts everything if the website does not open
pause
