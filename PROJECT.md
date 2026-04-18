# POS Rượu — Web App Quản Lý Bán Hàng Rượu Nội Bộ

## Overview
Hệ thống POS web app cho công ty kinh doanh rượu (~20 người dùng), 2 chi nhánh (HN + HCM), 4 kho hàng.

## Tech Stack
- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT (JSON Web Tokens)

## Phase 1 — Setup + Sản phẩm + Kho + Nhập hàng

### 1. Project Setup
- Monorepo with `packages/frontend` and `packages/backend`
- PostgreSQL database with Prisma migrations
- JWT authentication with role-based access control
- API: RESTful JSON API

### 2. Database Schema (19 tables)

#### Core Tables
- **categories** (id, name, description, sort_order, is_active)
- **products** (id, sku[unique], name, category_id[FK], volume_ml, barcode, cost_price, retail_price, wholesale_price, unit[default:'chai'], image_url, description, is_active, created_at, updated_at)
- **customers** (id, name, phone, email, address, customer_type[retail/wholesale], customer_group, assigned_sale_id[FK→users], debt_limit, notes, is_active, created_at)
- **suppliers** (id, name, contact_name, phone, email, address, notes, is_active, created_at)

#### Inventory Tables
- **warehouses** (id, name, type[retail/wholesale], branch[HN/HCM], address, manager_name, is_active)
- **inventory** (id, product_id[FK], warehouse_id[FK], quantity, min_quantity, updated_at) — unique(product_id, warehouse_id)
- **stock_transfers** (id, transfer_code[unique], from_warehouse_id[FK], to_warehouse_id[FK], status[pending/completed], notes, created_by[FK→users], created_at)
- **stock_transfer_items** (id, transfer_id[FK], product_id[FK], quantity)

#### Sales Tables
- **orders** (id, order_code[unique], customer_id[FK], warehouse_id[FK], order_type[retail/wholesale], status[pending/approved/exported/shipping/completed/cancelled], total_amount, discount_amount, final_amount, paid_amount, debt_amount, expected_delivery_at, sale_note, cashier_note, created_by[FK→users], approved_by[FK→users], approved_at, created_at, updated_at)
- **order_items** (id, order_id[FK], product_id[FK], quantity, unit_price, cost_price, line_total)
- **deliveries** (id, order_id[FK], shipper_id[FK→users], status[assigned/picked_up/delivered/failed], expected_at, delivery_address, delivery_fee, collected_amount, is_collected, delivered_at, notes, created_at)
- **purchase_orders** (id, po_code[unique], supplier_id[FK], warehouse_id[FK], total_amount, paid_amount, debt_amount, status[draft/completed], notes, created_by[FK→users], created_at)
- **purchase_order_items** (id, purchase_order_id[FK], product_id[FK], quantity, unit_cost, line_total)

#### Finance Tables
- **payments** (id, payment_code[unique], type[receipt/payment], source_type[order/purchase_order/other], source_id, customer_id[FK], supplier_id[FK], amount, payment_method[cash/transfer], notes, created_by[FK→users], received_by[FK→users], created_at)
- **sales_targets** (id, user_id[FK], warehouse_id[FK], target_type[daily/monthly/quarterly], target_amount, period_date, notes, created_by[FK→users], created_at)
- **complaints** (id, order_id[FK], customer_id[FK], type[delivery/quality/service/other], description, status[open/in_progress/resolved/closed], resolution, assigned_to[FK→users], created_by[FK→users], created_at, resolved_at)

#### System Tables
- **users** (id, username[unique], password_hash, full_name, title, phone, email, role_id[FK], branch[HN/HCM/all], is_active, last_login, created_at)
- **roles** (id, name[admin/sale/cashier/warehouse/shipper/accountant], display_name, permissions[JSONB], description)
- **activity_logs** (id, user_id[FK], action, entity_type, entity_id, details[JSONB], ip_address, created_at)

### 3. Role-Based Access Control (6 roles)
- **admin** — full access
- **sale** — create orders, view own customers' debt, cannot edit prices, cannot see cost_price
- **cashier** — approve orders, create invoices, manage payments, can edit prices
- **warehouse** — receive export slips, confirm stock export
- **shipper** — view assigned deliveries, confirm delivery + cash collection
- **accountant** — create purchase orders, manage suppliers, financial reports

### 4. Seed Data (4 warehouses)
- Kho lẻ Hà Nội (retail, HN)
- Kho lẻ HCM (retail, HCM)
- Kho buôn Hà Nội (wholesale, HN)
- Kho buôn HCM (wholesale, HCM)

### 5. Phase 1 Features to Build
- [x] Project setup (monorepo, Prisma, Express, React+Vite)
- [ ] Auth: login, JWT, middleware, role check
- [ ] Products CRUD: list, create, edit, delete, search, filter by category
- [ ] Categories CRUD
- [ ] Warehouses management
- [ ] Inventory view: stock per product per warehouse
- [ ] Purchase orders: create, list, detail (import stock from supplier)
- [ ] Stock transfers: create, list (transfer between warehouses)
- [ ] Dashboard: basic stats

### 6. API Endpoints (Phase 1)
```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/warehouses
POST   /api/warehouses
PUT    /api/warehouses/:id

GET    /api/inventory
GET    /api/inventory/low-stock

GET    /api/purchase-orders
POST   /api/purchase-orders
GET    /api/purchase-orders/:id

GET    /api/stock-transfers
POST   /api/stock-transfers
PUT    /api/stock-transfers/:id/complete
```

### 7. UI Pages (Phase 1)
- Login page
- Dashboard (basic version)
- Products list + create/edit modal
- Categories management
- Warehouses overview
- Inventory view (stock across all warehouses)
- Purchase orders (import from supplier)
- Stock transfers (between warehouses)
- Sidebar navigation matching wireframe design

## Design Reference
- Wireframe: /Users/tom/Desktop/POS-Ruou-Wireframe.html
- Database: /Users/tom/Desktop/POS-Ruou-Database-Design.html
- Style: Clean, modern, similar to KiotViet. Dark sidebar, white content area.
- Responsive: mobile-first, sidebar collapses to hamburger menu on mobile.
