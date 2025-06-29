# =========================
# Multi-stage build
# =========================

# ----- Frontend build stage -----
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ----- Backend stage (dependencies) -----
FROM python:3.11-slim AS backend-build
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend

# Copy frontend static build into backend static folder
COPY --from=frontend-build /app/frontend/build ./backend/static

# ----- Final image -----
FROM python:3.11-slim
WORKDIR /app
COPY --from=backend-build /app /app

# Environment variables
ENV FLASK_APP=backend.app
ENV FLASK_ENV=production

# Expose port
EXPOSE 5000

# Start the application with Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "backend.app:create_app()"]
