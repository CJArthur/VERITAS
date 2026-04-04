# syntax=docker/dockerfile:1
FROM python:3.13-slim

# 1. Устанавливаем uv – один бинарник на Rust
RUN pip install --no-cache-dir uv

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl unzip && \
    rm -rf /var/lib/apt/lists/*

# Add uv in path
ENV PATH="/root/.local/bin:${PATH}"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock /app/

RUN uv sync --no-dev

COPY . /app
COPY backend/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000
CMD ["entrypoint.sh"]