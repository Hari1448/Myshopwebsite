@echo off
cd /d "%~dp0"
echo This deletes the old database volume and rebuilds it with the new credentials.
pause
docker compose down -v
docker compose up -d --build
