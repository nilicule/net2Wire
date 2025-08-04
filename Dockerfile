# Use Python 3.13 as the base image (matching pyproject.toml requirement)
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml and uv.lock first for better caching
COPY pyproject.toml uv.lock* ./

# Install uv and dependencies
RUN pip install --no-cache-dir uv && \
    uv sync --frozen

# Copy .env file if it exists (optional)
COPY .env* ./

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5003

# Command to run the application using uv
CMD ["uv", "run", "python", "app.py"]