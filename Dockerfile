# Base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=backend.app:app \
    FLASK_ENV=production \
    PYTHONPATH="${PYTHONPATH}:/app"

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend

# Create necessary directories
RUN mkdir -p backend/static

# Expose the port the app runs on
EXPOSE 10000

# Command to run the application
WORKDIR /app/backend
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]
