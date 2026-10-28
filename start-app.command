#!/bin/bash
cd "$(dirname "$0")"
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then run this again."
  read -p "Press Enter to close..."; exit 1
fi
docker compose up -d --build || { read -p "Failed. Press Enter to close..."; exit 1; }
echo "Waiting for the app..."
ok=0
for i in $(seq 1 60); do
  if curl -sf http://localhost:5055/api/health >/dev/null; then ok=1; break; fi
  sleep 2
done
if [ $ok -ne 1 ]; then
  echo "App did not become ready. Last logs:"
  docker compose logs --tail=40 app
fi
echo "SUNMADHI STORE: http://localhost:5055"
(open http://localhost:5055 2>/dev/null || xdg-open http://localhost:5055 2>/dev/null)
