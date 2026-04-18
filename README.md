# POS Rượu — Hệ thống quản lý bán hàng rượu

## Yêu cầu

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **npm** >= 9

## Cài đặt nhanh

### 1. Cài PostgreSQL (nếu chưa có)

```bash
brew install postgresql@16
brew services start postgresql@16
```

### 2. Tạo database

```bash
createdb pos_ruou
# Hoặc nếu dùng user postgres:
# psql -U postgres -c "CREATE DATABASE pos_ruou;"
```

### 3. Cài dependencies

```bash
npm install
```

### 4. Chạy migration + seed data

```bash
cd packages/backend
npx prisma migrate dev --name init
node prisma/seed.js
```

### 5. Chạy ứng dụng

```bash
# Từ thư mục gốc
npm run dev
```

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

### 6. Đăng nhập

- **Tài khoản:** `admin`
- **Mật khẩu:** `admin123`

## Cấu trúc project

```
pos-ruou/
├── packages/
│   ├── backend/          # Express + Prisma API
│   │   ├── prisma/       # Schema + migrations + seed
│   │   └── src/
│   │       ├── routes/   # API endpoints
│   │       ├── middleware/# Auth middleware
│   │       └── lib/      # Prisma client
│   └── frontend/         # React + Vite + Tailwind
│       └── src/
│           ├── pages/    # UI pages
│           ├── components/# Shared components
│           ├── contexts/ # Auth context
│           └── lib/      # API client
└── package.json          # Monorepo root
```

## Phase 1 Features

- ✅ Đăng nhập JWT + phân quyền 6 roles
- ✅ Quản lý danh mục sản phẩm (CRUD)
- ✅ Quản lý sản phẩm (CRUD + tìm kiếm + lọc)
- ✅ Quản lý kho hàng (4 kho mặc định)
- ✅ Xem tồn kho (theo kho, cảnh báo hết hàng)
- ✅ Nhập hàng từ NCC (tạo phiếu + cập nhật tồn kho)
- ✅ Chuyển kho (tạo + xác nhận hoàn thành)
- ✅ Dashboard tổng quan
- ✅ Giao diện tiếng Việt, responsive
