# Customer Engagement & Social Sharing Microsite

A two-folder project (Node + Express backend, React + Vite frontend) implementing
the engagement flow: store registration → branded frame generation → social proof
submission, plus an admin panel for data, screenshots and CSV exports.

## Stack
- Backend: Node.js, Express, Sequelize, MySQL
- Frontend: React, Vite, React Router
- Storage: uploaded images/screenshots on local disk (`backend/uploads`)
- Auth: JWT for admin; OTP (mock mode) + non-OTP for customer submissions

## Folder structure
```
project/
├── backend/        Express API + MySQL
└── frontend/       React + Vite app (customer flow + /admin)
```

## Features mapped to the brief
- Step 1 — registration form unlocks the complimentary gift (`/register`)
- Step 2 — image upload (gallery/camera) → auto branded frame → download/share (`/frame`)
- Step 3 — social proof: name, mobile, screenshot upload (`/submit`)
- Two submission options: OTP-based and non-OTP
- Admin panel: dashboard stats, customer data, screenshots/frames, CSV export (`/admin`)
- Single parent platform, two sections/tabs (frame + proof) under one React app

---

## Updating an existing install (after schema changes)

If you already ran an older version, your MySQL tables won't auto-update
(`sequelize.sync()` only creates missing tables, it doesn't alter existing ones).
Pick one:

**Option A — fresh tables (easiest while testing, deletes existing data):**
```sql
DROP DATABASE engagement;
CREATE DATABASE engagement CHARACTER SET utf8mb4;
```
Then restart the backend — tables and the admin user are recreated.

**Option B — keep data, run the migration:**
```bash
mysql -u root -p engagement < database/migration.sql
```

---

## Local setup

### 1. Database
Create the MySQL database:
```sql
CREATE DATABASE engagement CHARACTER SET utf8mb4;
```

### 2. Backend
```bash
cd backend
cp .env.example .env      # edit DB credentials, JWT_SECRET, admin login
npm install
npm run dev               # http://localhost:5000
```
Tables are created automatically on first run, and the admin user is seeded
from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 3. Frontend
```bash
cd frontend
cp .env.example .env      # leave VITE_API_BASE empty for local (uses proxy)
npm install
npm run dev               # http://localhost:5173
```

---

## VPS deployment

1. Install Node.js (18+), MySQL, and Nginx on the VPS.
2. Create the database and a MySQL user.
3. Clone/upload this project.

**Backend**
```bash
cd backend
cp .env.example .env
# set DB_*, JWT_SECRET, ADMIN_*, OTP_MODE, and
# PUBLIC_BASE_URL=https://yourdomain.com
npm install --production
npm install -g pm2
pm2 start server.js --name engagement-api
pm2 save
```

**Frontend**
```bash
cd frontend
# set VITE_API_BASE=https://yourdomain.com  (your API origin)
npm install
npm run build              # outputs to frontend/dist
```

**Nginx** (serve the built frontend, proxy /api and /uploads to Node):
```nginx
server {
  listen 80;
  server_name yourdomain.com;

  root /path/to/project/frontend/dist;
  index index.html;

  location / {
    try_files $uri /index.html;     # SPA routing
  }

  location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:5000;
  }
}
```
Then add HTTPS with Certbot, and increase `client_max_body_size 12M;` so image
uploads aren't rejected.

---

## Switching from mock OTP to real SMS
Open `backend/services/otpService.js`, set `OTP_MODE` to anything other than
`mock` in `.env`, and fill in the SMS gateway call in the marked block. Also
remove the `devCode` field from the response.

## Admin
- Visit `/admin`, log in with the seeded credentials.
- Dashboard shows counts, both data tables, image thumbnails, and CSV export.

## API endpoints (summary)
| Method | Path | Purpose |
|---|---|---|
| POST | /api/register | Step 1 registration |
| POST | /api/frame/upload | Step 2 raw image (optional) |
| POST | /api/otp/request | Request OTP |
| POST | /api/otp/verify | Verify OTP |
| POST | /api/submit | Step 3 proof submission |
| POST | /api/admin/login | Admin login |
| GET | /api/admin/summary | Dashboard counts |
| GET | /api/admin/customers | List registrations |
| GET | /api/admin/submissions | List submissions |
| GET | /api/admin/export/customers | CSV |
| GET | /api/admin/export/submissions | CSV |
