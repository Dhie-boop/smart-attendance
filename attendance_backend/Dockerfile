# ---- build stage ----
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system build deps (needed for psycopg2)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- final stage ----
FROM python:3.11-slim

WORKDIR /app

# Runtime deps only
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy project source
COPY . .

# Make the start script executable
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
