# PharmaSync - Enterprise Pharmacy & Distributor Ecosystem

PharmaSync is a next-generation B2B Enterprise Resource Planning (ERP) platform designed for the modern healthcare supply chain. It bridges the gap between retail pharmacies and wholesale distributors with a centralized, real-time platform featuring a **High-Performance Smart POS**, **Automated Inventory Intelligence**, a **Digital Khata (Ledger) System**, and **Distributor Order Orchestration**.

---

## 💎 Key Features & Capabilities

### 🛒 1. Smart POS & Billing Engine
*   **Dual-Index Search**: Queries both the **Local Pharmacy Inventory** and the **Global Supplier Catalog** simultaneously, enabling seamless order placement when items are out of stock.
*   **Rapid Barcode & OCR Input**: Integrated barcode scanning support (`react-qr-barcode-scanner` and ZXing) and OCR engine (`tesseract.js`) for lightning-fast bill generation.
*   **Auto-Inventory Sync**: Every checkout automatically triggers stock reduction and syncs with the `/api/inventory/billing-reduce-stock` endpoint.
*   **Multi-Payment Checkout**: Supports Cash, UPI, and **Digital Khata (Credit)** checkout.
*   **Auto-Ledger Redirection**: Selecting "Khata" instantly posts the transaction to the customer's ledger notebook.

### 📓 2. Digital Khata Book (Ledger)
*   **Notebook UI**: An authentic, skeuomorphic "handwritten notebook ledger" interface tailored for pharmacy credits.
*   **Household Linking**: Link multiple household members (e.g., Father, Mother, Child) to a single primary family credit account.
*   **Risk Analytics Engine**: Automated user tagging into **Low**, **Medium**, and **High Risk** categories based on outstanding balances and repayment velocity.
*   **Payment Reminders**: Partial payment logging, printable digital receipts, and automated email payment alerts.

### 📦 3. Inventory Intelligence
*   **Batch & Expiry Controls**: Expiry protection tracking for batches, warning logs, and quick filters for expired/near-expiry stock.
*   **Reorder Points**: Automated low-stock thresholds triggering real-time alerts.
*   **Distributor Mapping**: Clear tracking of product origins mapping back to authorized distributors.

### 🏭 4. Distributor Portal & Automation
*   **Pharmacy Portfolio**: Distributors monitor connected pharmacies, tracking their purchase volumes, transaction histories, and overall payment "health scores".
*   **Secure Delivery Closure**: Seamless fulfillment process requiring **Photo Proof** (uploaded to Cloudinary) and **Digital Signatures** (rendered using Canvas integration).
*   **Order Orchestration Queue**: Smart queues with status tracking for wholesale delivery logistics.

### 🛡️ 5. Admin Panel & Approvals
*   **Registration Approvals**: All registering pharmacies and distributors enter a `pending` state requiring Admin verification.
*   **Auto-Credentials Dispatch**: Admin approval auto-generates a secure password and emails it to the user via Nodemailer.
*   **Analytics Overview**: Centralized KPIs monitoring order volumes, revenues, active stores, and pending user queues.

---

## 🛠 Advanced Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts | Sleek UI, reactive dashboards, responsive graphics |
| **State & Router** | React Router DOM v7 | High-performance routing & auth protection |
| **Barcode / OCR** | react-qr-barcode-scanner, ZXing, Tesseract.js | Real-time scanner decoding & text extraction |
| **Backend** | Node.js, Express.js | Robust REST API server & middleware |
| **Database** | MongoDB (Mongoose ODM) | NoSQL flexible schema with relational references |
| **Real-time Sync** | Socket.io | Live bidirectional stats communication |
| **Storage** | Cloudinary (via Multer Storage) | Secure upload of license proofs & digital signatures |
| **Communication** | Nodemailer (SMTP) | Automated password delivery & payment alerts |

---

## 📂 Project Architecture

```text
PharmaSync/
├── backend/                       # Express API Server
│   ├── config/                    # DB connection configs
│   ├── controllers/               # Business logic controllers (POS, Khata, Inventory...)
│   ├── middleware/                # JWT validation & file-upload routes
│   ├── models/                    # Mongoose database schemas (User, Customer, Order...)
│   ├── routes/                    # API route entry points
│   ├── scripts/                   # Database seeding & notification sync scripts
│   ├── utils/                     # Email notifications & Cloudinary storage helpers
│   └── index.js                   # Application server entry point
│
└── frontend/                      # React UI Client
     ├── public/                   # Static resources
     ├── src/
     │   ├── components/           # Layout, Topbar, Sidebar, Shared UI
     │   ├── context/              # Authentication & state providers
     │   ├── hooks/                # Custom React hooks
     │   ├── pages/
     │   │   ├── admin/            # Admin dashboard & approvals
     │   │   ├── auth/             # Login & register flow
     │   │   ├── distributor/      # Inventory automation, collaborations, delivery tracking
     │   │   └── pharmacy/         # Smart POS, Khata ledger, analytics, notifications
     │   ├── utils/                # Constants, formatters & Axios client config
     │   ├── App.tsx               # Main application routing
     │   └── main.tsx              # React mounting root
```

---

## 🚀 Deployment & Setup

### 1. Environment Setup
Create a `.env` file inside the `backend/` directory:

```env
# Server Config
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/pharmacy_db

# Security
JWT_SECRET=your_super_secure_jwt_token_secret

# Default Administrator Credentials (Auto-Synced to DB on Login)
ADMIN_EMAIL=admin@pharmasync.com
ADMIN_PASSWORD=Admin@123

# Cloudinary Integration (Storage for Signatures & License Proofs)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Nodemailer SMTP Configuration (For OTPs & Registration Emails)
EMAIL_USER=your_smtp_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 2. Launch Sequence

```bash
# Terminal 1: Spin up Express backend
cd backend
npm install
node index.js

# Terminal 2: Run React frontend development server
cd frontend
npm install
npm run dev
```

---

## 🧪 Database Seeding Guide

To quickly populate the local database with rich mock data for testing, run the seed scripts in the following sequence:

> [!IMPORTANT]
> Ensure MongoDB is running locally and your `.env` contains the correct `MONGODB_URI` before executing the seed scripts.

```bash
# Navigate to the backend directory
cd backend

# Step 1: Seed core users, pharmacies, orders, and payments
node scripts/seedCollaborations.js

# Step 2: Seed distributor inventory catalog
node scripts/seedProducts.js

# Step 3: Set up profiles mapping pharmacies to distributors
node seedProfile.js

# Step 4: Generate a 10-day historical timeline of POS sales transactions
node scripts/seedTransactions.js

# Step 5: Seed test notification logs
node scripts/seedNotifications.js

# Step 6: Synchronize real-time low-stock/overdue notifications
node scripts/syncNotifications.js
```

---

## 📡 API Endpoints

The backend exposes the following structured route systems:

| Category | Route Prefix | Purpose |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | User registration, login, OTP handling, and password resets |
| **Products** | `/api/products` | Distributor product catalog CRUD operations |
| **Inventory** | `/api/inventory` | Real-time stock, low-stock, and billing-reduce logic |
| **Orders** | `/api/orders` | Distributor-pharmacy B2B order flow & delivery closure |
| **Connections**| `/api/connections` | Manage partnerships between pharmacies and distributors |
| **POS Tx** | `/api/transactions` | POS checkout logs and historical sale records |
| **Khata** | `/api/khata` | Skeuomorphic handwritten credit log, family logs, & analytics |
| **Customers** | `/api/customers` | Ledger account management & credit score metrics |
| **Profile** | `/api/profile` | Contact, license details, and configuration settings |
| **Admin** | `/api/admin` | Dashboard KPIs, registration approval/rejection queue |
| **Notifs** | `/api/notifications` | Real-time UI notification listings and alert updates |

---
*Precision-engineered for the future of pharmacy commerce.*  
*Built by Antigravity 💊*

