#!/bin/sh
set -e
echo "Database target: $(echo "$DATABASE_URL" | sed 's#//[^@]*@#//***@#')"
echo "Creating database tables..."
node src/db/init.js
echo "Creating/updating admin account..."
node src/db/createAdmin.js
echo "Starting SUNMADHI STORE on port ${PORT:-5000}..."
exec node src/server.js
