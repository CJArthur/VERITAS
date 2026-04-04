# syntax=docker/dockerfile:1
FROM python:3.13-slim

# Устанавливаем uv
RUN pip install --no-cache-dir uv

# Системные зависимости
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl unzip && \
    rm -rf /var/lib/apt/lists/*

# ENV
ENV PATH="/root/.local/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Копируем зависимости (важно для кэша)
COPY ./pyproject.toml ./uv.lock ./

RUN uv sync --no-dev

# Копируем весь проект
COPY . .

# Копируем entrypoint отдельно (явно)
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

CMD ["/usr/local/bin/entrypoint.sh"]