# VERITAS — Платформа верификации дипломов

Криптографически защищённая проверка подлинности документов об образовании. Работодатель сканирует QR-код и за 3 секунды получает математически доказуемый результат - без звонков в ВУЗ и регистрации.

Разработано для [Diasoft](https://diasoft.ru) · 2026

---

## Стек

| Слой | Технологии |
|---|---|
| Backend | Python 3.11+ / FastAPI / SQLAlchemy 2.0 / Alembic |
| База данных | PostgreSQL 15 |
| Кэш / сессии | Redis 7 |
| Frontend | Next.js 14 (App Router) / TypeScript / Tailwind CSS |
| Почта | SMTP через fastapi-mail |
| Криптография | HMAC-SHA256 (текущая реализация); архитектура через `CryptoProvider` готова к замене на ГОСТ Р 34.10-2012 без изменения бизнес-логики |

---

## Архитектура

Монорепозиторий. Backend и frontend независимы и разворачиваются отдельно.

```
veritas/
├── backend/          # FastAPI-приложение
│   ├── app/
│   │   ├── api/      # Роутеры и сервисы
│   │   ├── db/       # ORM-модели, подключение к БД и Redis
│   │   └── utils/    # JWT, куки, зависимости по ролям
│   └── alembic/      # Миграции базы данных
│
└── frontend/         # Next.js-приложение
    ├── app/          # App Router: страницы по ролям
    └── components/   # UI-компоненты
```

### Ключевые решения

**Верификация диплома** — при добавлении диплома вычисляется канонический хэш полей и создаётся HMAC-подпись приватным ключом ВУЗа. При проверке подпись верифицируется публичным ключом: любое изменение данных в БД делает подпись недействительной.

**Журнал проверок** — таблица `verification_logs` защищена PostgreSQL RULE, запрещающим UPDATE и DELETE. История верификаций нетронута и не может быть подделана.

**TTL-ссылки** — студент сам управляет доступом к своему диплому: создаёт временные ссылки с ограничением по времени и числу использований, отзывает их мгновенно через Redis.

**Открытый API для работодателей** — HR-системы и ATS могут проверять дипломы программно через Bearer-ключ. Каждый запрос фиксируется в журнале с указанием организации.

**Сессии** — JWT в `httpOnly`-куках, недоступных JavaScript. Refresh-токены хранятся в Redis с ротацией при каждом обновлении.

---

## Роли

| Роль | Как создаётся | Возможности |
|---|---|---|
| `student` | Самостоятельная регистрация | Привязать диплом, создавать TTL-ссылки для работодателей, скачивать QR |
| `university_staff` | Регистрация учебного заведения | Управление дипломами ВУЗа — после одобрения платформой |
| `super_admin` | Bootstrap через переменную окружения (один раз) | Одобрение ВУЗов, выдача API-ключей работодателям |

Оператор ВУЗа не может войти в систему до тех пор, пока администратор платформы не одобрит заявку учебного заведения.

Супер-администратор создаётся при первом запуске: задаётся `BOOTSTRAP_SUPER_ADMIN_EMAIL` в конфигурации, после чего регистрация с этим адресом автоматически присваивает роль `super_admin`. Механизм срабатывает только один раз — пока в системе нет ни одного администратора.

---

## Локальный запуск

### Требования

- Python 3.11+
- Node.js 18+
- PostgreSQL 15
- Redis 7

### 1. Клонировать репозиторий

```bash
git clone <repo-url>
cd veritas
```

### 2. Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Установить зависимости
pip install -r requirements.txt
# или через uv (рекомендуется):
# pip install uv && uv sync --no-dev

# Настроить окружение
cp example.env .env
# Отредактировать .env: заполнить DB_*, REDIS, MAIL_*, SECRET_KEY, FRONTEND_URL
```

Минимально необходимые переменные в `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=veritas

UPSTASH_REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_TOKEN=          # оставить пустым для локального Redis

SECRET_KEY=                   # минимум 32 символа, например: openssl rand -hex 32

MAIL_SERVER=smtp.yandex.ru    # или любой SMTP-сервер
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_smtp_password
MAIL_FROM=your@email.com
MAIL_FROM_NAME=VERITAS
MAIL_TLS=true
MAIL_SSL=false

FRONTEND_URL=http://localhost:3000
BASE_VERIFICATION_URL=http://localhost:8200/api/v1/verify
ALLOWED_ORIGINS=http://localhost:3000

BOOTSTRAP_SUPER_ADMIN_EMAIL=admin@yourdomain.com  # email первого администратора
```

```bash
# Применить миграции
PYTHONPATH=. alembic upgrade head

# Запустить сервер
PYTHONPATH=. uvicorn app.main:app --reload --port 8200
```

API доступен на `http://localhost:8200`, Swagger UI — `http://localhost:8200/docs`

### 3. Frontend

```bash
cd frontend
npm install
```

Создать файл `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8200
API_URL=http://localhost:8200
```

```bash
npm run dev
```

Приложение: `http://localhost:3000`

### 4. Создать первого администратора

1. Убедиться, что `BOOTSTRAP_SUPER_ADMIN_EMAIL` задан в `backend/.env`
2. Открыть `http://localhost:3000/register` и зарегистрироваться с этим email
3. Подтвердить email по ссылке из письма — аккаунт получит роль `super_admin`
4. Войти через `/login` и перейти в `/admin`

---

## Деплой на собственный сервер

### Требования к инфраструктуре

- Сервер с Docker или прямой установкой Python 3.11+ и Node.js 18+
- PostgreSQL 15 (отдельный инстанс или managed-сервис)
- Redis 7 (отдельный инстанс или managed-сервис)
- SMTP-сервер или почтовый провайдер с SMTP-доступом
- HTTPS — обязателен для продакшна (Let's Encrypt / nginx)

### Backend (production)

```bash
# Установка зависимостей без dev-пакетов
pip install --no-cache-dir <зависимости>

# Переменные окружения — задать через systemd, Docker env или .env
# Обновить относительно продакшн-значений:
FRONTEND_URL=https://your-domain.com
BASE_VERIFICATION_URL=https://api.your-domain.com/api/v1/verify
ALLOWED_ORIGINS=https://your-domain.com

# Применить миграции
PYTHONPATH=. alembic upgrade head

# Запустить через gunicorn / uvicorn workers
uvicorn app.main:app --host 0.0.0.0 --port 8200 --workers 4
```

Рекомендуется разместить за nginx с проксированием на `localhost:8200` и терминацией TLS.

### Frontend (production)

```bash
cd frontend
npm install
npm run build    # Собрать статику
npm run start    # Запустить production-сервер на порту 3000
```

Переменные окружения при сборке:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
API_URL=https://api.your-domain.com
```

`API_URL` используется для server-side запросов (SSR) — должен быть доступен с сервера, где запущен Next.js.

### Docker Compose (API + БД + Redis)

`backend/docker-compose.yml` поднимает весь стек: FastAPI, PostgreSQL 15 и Redis одной командой.

```bash
cd backend
cp example.env .env
# Отредактировать .env: MAIL_*, SECRET_KEY, BOOTSTRAP_SUPER_ADMIN_EMAIL
docker compose up -d --build
```

API будет доступен на порту `FASTAPI_PORT` (по умолчанию 8200). Миграции применяются автоматически при старте контейнера.

Frontend запускается отдельно (см. выше).

---

## Конфигурация

Полный шаблон — `backend/example.env`.

| Переменная | Описание |
|---|---|
| `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME` | Подключение к PostgreSQL |
| `UPSTASH_REDIS_URL / UPSTASH_REDIS_TOKEN` | Подключение к Redis |
| `SECRET_KEY` | Секрет для подписи JWT (мин. 32 символа) |
| `MAIL_SERVER / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD / MAIL_FROM` | SMTP |
| `MAIL_TLS / MAIL_SSL` | Тип соединения с SMTP (обычно TLS=true, SSL=false) |
| `FRONTEND_URL` | Публичный URL фронтенда (редиректы, ссылки в письмах) |
| `BASE_VERIFICATION_URL` | URL эндпоинта подтверждения email на бэкенде |
| `ALLOWED_ORIGINS` | CORS — разрешённые origins через запятую |
| `BOOTSTRAP_SUPER_ADMIN_EMAIL` | Email первого администратора (только для первого запуска) |

---

## API

Полная OpenAPI-спецификация: `/docs` (Swagger UI) и `/redoc`.

| Группа | Описание |
|---|---|
| **Auth** | Регистрация, вход, подтверждение email, обновление токена |
| **Public** | Верификация диплома по токену — без авторизации |
| **Employer API** | Верификация для HR-систем по Bearer API-ключу |
| **Student** | Управление привязанными дипломами и TTL-ссылками |
| **University** | Управление дипломами учебного заведения, импорт CSV |
| **Admin** | Одобрение ВУЗов, управление API-ключами работодателей |

---

## Безопасность

- Пароли хешируются алгоритмом Argon2
- JWT передаются исключительно через `httpOnly`-куки
- API-ключи работодателей хранятся как SHA-256-хэш; сам ключ отображается единожды при создании
- Токены подтверждения email одноразовые, TTL — 30 минут
- Журнал верификаций защищён на уровне СУБД от изменений
- Криптографический провайдер вынесен в абстракцию — замена с SHA-256/RSA на ГОСТ не требует изменения бизнес-логики
