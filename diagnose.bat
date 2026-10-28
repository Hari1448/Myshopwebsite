@echo off
cd /d "%~dp0"
echo ===== Containers =====
docker compose ps -a
echo.
echo ===== App logs =====
docker compose logs --tail=80 app
echo.
echo ===== Database logs =====
docker compose logs --tail=20 db
echo.
echo ===== Health check from your PC =====
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 http://localhost:5055/api/health).Content } catch { 'FAILED: ' + $_.Exception.Message }"
echo.
echo ===== Who is using port 5055 =====
netstat -ano | findstr ":5055"
echo (If anything else shows port 5000, an old copy of the store may still be running - ignore it, the store now uses 5055.)
echo.
pause
