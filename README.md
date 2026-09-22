# 📦 Inventory App (Товарный учет)

Система для управления товарными остатками, складами и движениями.

## 🚀 Быстрый старт

1. Скопируйте переменные окружения:
   ```bash
   cp .env.example .env
   ```
2. Запустите базу данных и кэш:
   ```bash
   docker-compose up -d
   ```
3. Установите зависимости и запустите сервер/клиент:
   ```bash
   cd server && npm install && npm run dev
   cd ../client && npm install && npm run dev
   ```

## 📁 Структура
- `client/` - Фронтенд
- `server/` - Бэкенд
- `docs/` - Документация и API
- `scripts/` - SQL скрипты и миграции