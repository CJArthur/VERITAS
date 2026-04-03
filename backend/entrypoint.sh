#!/bin/sh

uv run alembic upgrade head

echo "Starting FastAPI application..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000