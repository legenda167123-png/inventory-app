# Архитектура приложения

## Стек технологий
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Cache**: Redis (опционально)

## Сущности БД
1. `products` (Товары): id, name, sku, price, stock_quantity
2. `warehouses` (Склады): id, name, location
3. `movements` (Движения): id, product_id, warehouse_id, quantity, type (in/out), created_at