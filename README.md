# One Stop – shopping cart

Three apps in one repo:

| Folder | What it is | Dev URL |
|---|---|---|
| `backend/` | Express + MongoDB API, Stripe payments | http://localhost:4000 |
| `frontend/` | Customer storefront (React + Vite) | http://localhost:5173/shopping-cart/ |
| `admin/` | Admin panel: products + orders (React + Vite) | http://localhost:5174 |

## Setup

```bash
# 1. backend
cd backend
cp .env.example .env      # then fill in every value
npm install
npm run server

# 2. storefront
cd ../frontend
cp .env.example .env      # optional, only needed if the API is not on localhost:4000
npm install
npm run dev

# 3. admin
cd ../admin
cp .env.example .env      # optional
npm install
npm run dev -- --port 5174
```

## backend/.env

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string (never commit it) |
| `JWT_SECRET` | long random string used to sign login tokens |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | the admin panel login |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` while testing) |
| `FRONTEND_URL` | where Stripe sends customers back to (must include `/shopping-cart`) |

## API

- `POST /api/user/register`, `POST /api/user/login`, `POST /api/user/admin-login`
- `GET /api/food/list` (public) · `POST /api/food/add`, `POST /api/food/remove` (admin)
- `POST /api/cart/add|remove|get|merge` (customer)
- `POST /api/order/place`, `POST /api/order/verify`, `GET /api/order/userorders` (customer)
- `GET /api/order/list`, `POST /api/order/status` (admin)
