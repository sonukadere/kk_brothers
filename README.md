# KK Brothers - Staff Duty & Payment Management System

> A modern, mobile-first SaaS management system built for **KK Brothers** to handle workforce staffing, hotel and catering logistics, duty shifts, and strictly separated financial ledgers for worker wage disbursals and client receivables.

---

## 🌟 Key Features

### 1. Simple Mobile-First Experience (Field Workers)
- **WhatsApp-Style Simplicity**: Clean, touch-optimized user panel designed for smartphones.
- **Mobile Bottom Navigation Bar**: Fixed bottom navigation on mobile screens with an elevated center `+ Add Duty` button.
- **Today's Duty Status Indicator**: Live status displaying assigned hotel/caterer, shift timing, and venue section.
- **Instant Working Hours Calculation**: Automatic calculation of shift duration and transparent detection of **Overnight Shifts (🌙)** crossing midnight.
- **Confirmation Review Modal**: Workers review shift details before submission.
- **My Duties Logbook**: Card view on mobile, table view on desktop with approval status pills.
- **3-Card Wage Ledger**: Total Earnings, Amount Received, and Remaining Amount with clear color indicators (Green = Paid, Orange = Partial, Red = Pending).
- **Strict Read-Only Security**: Field workers cannot alter wages, billing rates, or payment status.

### 2. Admin Operations & Control Center
- **6 Core Business KPIs**: Total Staff, Total Hotels, Total Catering, Today's Duties, Staff Payments Pending, and Client Payments Pending.
- **Quick Action Buttons**: 1-click access to Add Staff, Add Hotel, Add Catering, Add Duty, Pay Staff, and Receive Client Payment.
- **Strict Separation of Ledgers**:
  - **Staff Payments**: Internal worker wage liabilities and disbursals (Cash, UPI, Bank Transfer).
  - **Client Payments**: Inbound hotel and catering receivables and invoice settlements.
- **Live Actionable Audit Lists**: Real-time lists of workers awaiting wage payouts and clients with outstanding balances.
- **Shift Overlap Prevention**: Rejects duplicate or overlapping duties for the same worker on the same date.
- **Safe Deactivation Policy**: Staff and clients with historical duty or financial records are deactivated safely rather than permanently deleted.

### 3. Executive Reports & Export Suite
- **8 Official Business Reports**:
  1. Staff-wise Duty Report
  2. Hotel-wise Duty Report
  3. Catering-wise Duty Report
  4. Date-wise Duty Report
  5. Staff Wage Payment Report
  6. Client Collections Report
  7. Two-Sided Pending Payment Balance Sheet
  8. Monthly Executive P&L Statement (Gross Revenue, Direct Labor Costs, Profit Margins)
- **Excel Export (`.xlsx`)**: High-speed spreadsheet generation via `xlsx`.
- **PDF Export (`.pdf`)**: Branded landscape statements with headers, KPI metric cards, tabular layout, and page footers via `jspdf` and `jspdf-autotable`.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React, Axios, React Router Dom, React Hot Toast, xlsx, jsPDF.
- **Backend**: Node.js, Express.js, Mongoose ODM.
- **Authentication**: JWT (JSON Web Tokens), Bcryptjs password hashing, dual identifier login (Email or 10-digit mobile number).
- **Database**: MongoDB (`mongodb://127.0.0.1:27017/kk_brothers_management`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Server running locally on port 27017

### 1. Clone the Repository
```bash
git clone https://github.com/sonukadere/kk_brothers.git
cd kk_brothers
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies
npm --prefix frontend install
```

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` directory (or copy from `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/kk_brothers_management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```

### 4. Seed Database (Optional)
To populate sample hotels, catering companies, staff workers, and duties:
```bash
npm run seed
```

### 5. Run the Application
You can run both backend and frontend concurrently:
```bash
npm start
```
Or run them in separate terminals:
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run server

# Terminal 2: Frontend Client (http://localhost:5173)
npm run client
```

---

## 🔐 Default Demo Accounts

| Role | Login Identifier (Email or Phone) | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@kkbrothers.com` / `9876543210` | `Admin@123` |
| **Staff Worker**| `staff@kkbrothers.com` / `9765432109` | `Staff@123` |

---

## 📁 Project Directory Structure

```text
d:/KK Brothers/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB database connection
│   │   ├── controllers/     # Auth, Staff, Client, Duty, Payment, Overview, Report controllers
│   │   ├── middleware/      # JWT auth guard, role-based authorization, error handlers
│   │   ├── models/          # User, Staff, Client, Duty, StaffPayment, ClientPayment, ClientBill
│   │   ├── routes/          # Express API route declarations
│   │   └── utils/           # Database seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API integration modules
│   │   ├── components/      # Common UI (Modals, Tables, Cards, Badges) and Layout (Navbar, BottomNav)
│   │   ├── context/         # AuthContext provider
│   │   ├── pages/
│   │   │   ├── admin/       # Admin Dashboard, Staff, Clients, Duties, Payments, Reports
│   │   │   ├── auth/        # Login, Unauthorized, Forbidden
│   │   │   └── user/        # User Dashboard, AddDuty, MyDuties, MyPayments, MyProfile
│   │   ├── routes/          # ProtectedRoute, AppRoutes
│   │   └── utils/           # Excel & PDF export utilities, i18n dictionary
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── package.json
└── README.md
```

---

## 📜 License
Copyright &copy; 2026 KK Brothers Management. All rights reserved.
