@echo off
title SUNMADHI STORE - Starting
cd /d "%~dp0"

echo Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
  echo.
  echo Docker is not running. Please start Docker Desktop, wait until it says "running", then double-click this file again.
  echo.
  pause
  exit /b 1
)

echo Starting SUNMADHI STORE (first time can take a few minutes)...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo Something went wrong while starting. Check the messages above.
  pause
  exit /b 1
)

echo Waiting for the app to be ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 60;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://localhost:5055/api/health; if($r.StatusCode -eq 200){$ok=$true;break} } catch {}; Start-Sleep -Seconds 2 }; if($ok){exit 0}else{exit 1}"
if errorlevel 1 (
  echo.
  echo The app did not become ready. Last log lines:
  echo ------------------------------------------
  docker compose logs --tail=40 app
  echo ------------------------------------------
  echo Opening the page anyway...
) else (
  echo.
  echo SUNMADHI STORE is running at http://localhost:5055
)
start "" "http://localhost:5055"
echo.
echo You can close this window. Use stop-app.bat to stop the store.
pause
