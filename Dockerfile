# ---------- Stage 1: build the React (Vite) frontend ----------
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin API: the frontend calls /api on whatever host serves it
RUN npm run build

# ---------- Stage 2: backend + built frontend in ONE container ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000 \
    DB_SSL=false \
    DATABASE_URL=postgresql://postgres:postgres@db:5432/sunmadhi_store
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
COPY --from=frontend-build /frontend/dist ./public
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
EXPOSE 5000
CMD ["./docker-entrypoint.sh"]
