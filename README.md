# QR App — User & Admin Management Dashboard

A premium dark-mode web application for managing users and administrators with QR code generation, Excel import/export, and persistent cloud database storage.

---

## Features

### Core Management
- **User CRUD** — Add, view, edit, and delete user records with inline forms and modals
- **Admin Panel** — Full admin management with role-based access (9 predefined roles)
- **Search & Pagination** — Real-time search filter across all records with paginated DataTable

### QR Code Generation
- **Instant QR Codes** — Generate QR codes for any user or admin (Name, Role, Phone)
- **Print Ready** — Direct print dialog with label-printer-friendly styling
- **Auto QR on Create** — QR dialog pops automatically after creating a new admin

### Bulk Import
- **Excel/CSV Import** — Drag-and-drop file upload with automatic column detection
- **Column Mapping** — Interactive mapping dropdowns to match spreadsheet columns
- **Preview Before Import** — 3-row preview before batch insertion
- **Template Download** — Download a pre-formatted `.xlsx` template

### Authentication
- **Admin Login/Register** — Glassmorphic modal with Sign In and Register tabs
- **Session Persistence** — Login state saved to `localStorage`
- **Role-Based UI** — Admin Panel tab visible only after authentication

### Marketing Pages
- **Home** — Hero section with live User Dashboard
- **Features** — Highlight cards showcasing app capabilities
- **Solutions** — Step-by-step workflow documentation (12-color cycling design)
- **Developer** — Tech stack & skills profile
- **About** — Project information with color-varied highlight cards
- **Contact** — Functional contact form powered by EmailJS

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with Hooks |
| **Vite 7** | Build tool & dev server (HMR) |
| **PrimeReact 10** | UI components (DataTable, Dialog, Toast, Button, InputText) |
| **PrimeIcons 7** | Icon library |
| **Tailwind CSS 3.4** | Utility-first CSS |
| **Bootstrap 5** | Grid & layout utilities |
| **Axios** | HTTP client for REST API calls |
| **React Router DOM 7** | Client-side routing (hash-anchored sections) |
| **XLSX (SheetJS)** | Excel/CSV file parsing & generation |
| **EmailJS** | Contact form email delivery (browser SDK, no backend) |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express 5** | Web server & REST API framework |
| **Mongoose 9** | MongoDB ODM (schemas, validation, queries) |
| **MongoDB 7** | Database driver |
| **MongoDB Atlas** | Cloud database (persistent, 24/7) |

### Design
- **Dark Glassmorphic Theme** — Deep slate backgrounds, translucent glass cards, animated gradients
- **Chillax Font** — Modern geometric sans-serif from Fontshare
- **Responsive** — Adapts from mobile to high-resolution desktop

---

## Architecture

```
Browser (localhost:5175)
      │
      │ axios calls to http://localhost:5001
      ▼
┌──────────────────────────┐     mongoose      ┌──────────────────────┐
│  Express API Server      │ ─────────────────→ │  MongoDB Atlas       │
│  (port 5001)             │ ←──────────────── │  (qr-app.okafjbt…)   │
│  server/index.js         │    JSON documents  │  QRAPP database      │
│                          │                    │                      │
│  Routes:                 │                    │  Collections:        │
│  GET/POST   /users       │                    │  • users             │
│  PUT/DELETE /users/:id   │                    │  • admins            │
│  GET/POST   /admins      │                    │                      │
│  PUT/DELETE /admins/:id  │                    │                      │
└──────────────────────────┘                    └──────────────────────┘
```

---

## Directory Structure

```
qr-app/
├── server/                    # Express backend
│   ├── index.js               # Server entry, MongoDB connection, route mounting
│   ├── seed.js                # One-time seed script (db.json → MongoDB)
│   ├── models/
│   │   ├── User.js            # Mongoose schema (name, phone, city)
│   │   └── Admin.js           # Mongoose schema (name, username, password, role, phone, city)
│   └── routes/
│       ├── users.js           # CRUD endpoints for /users
│       └── admins.js          # CRUD endpoints for /admins (?username= filter)
├── src/                       # React frontend
│   ├── App.jsx                # Main app, auth state, routes, login modal
│   ├── App.css                # Nav, hero, modal, footer styles
│   ├── index.css              # Global CSS (PrimeReact, Tailwind, fonts, animations)
│   ├── main.jsx               # React entry (BrowserRouter)
│   ├── db.json                # Seed data source (users + admins)
│   ├── Admins/
│   │   ├── Admins.jsx         # Admin dashboard: create form + DataTable + auto-QR
│   │   ├── Admins.css
│   │   ├── ViewAdmin/         # Admin profile view dialog
│   │   ├── EditAdmin/         # Admin edit dialog (all fields + role dropdown)
│   │   ├── DeleteAdmin/       # Delete confirmation
│   │   └── GenerateQR/        # Admin QR code dialog
│   ├── Users/
│   │   ├── Users.jsx          # User dashboard: DataTable, search, pagination
│   │   ├── Users.css
│   │   ├── AddUser/           # Add user modal + inline form + QR print
│   │   ├── ViewUser/          # User profile view dialog
│   │   ├── EditUser/          # User edit dialog
│   │   ├── DeleteUser/        # Delete confirmation
│   │   ├── GenerateQR/        # User QR code dialog
│   │   └── ImportExcel/       # Excel/CSV import (drag-drop, mapping, preview)
│   └── pages/                 # Marketing content pages
│       ├── Features.jsx       # Feature highlight cards
│       ├── Solutions.jsx      # Step-by-step workflow
│       ├── Developer.jsx      # Tech stack profile
│       ├── About.jsx          # Project highlights
│       ├── Contact.jsx        # EmailJS contact form
│       └── Pages.css          # Shared page styles
├── public/                    # Static assets
├── index.html                 # Vite HTML entry
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind theme config
├── postcss.config.js          # PostCSS plugins
├── package.json               # Dependencies & scripts
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (tested with v25.8.1)
- **npm** v9+
- **MongoDB connection** (this project uses MongoDB Atlas — no local install needed)

### Installation

```bash
# Clone the repository
git clone https://github.com/AISHWARYJHAVERI/QR-App.git
cd QR-App

# Install dependencies
npm install
```

### Database Setup

The project connects to a MongoDB Atlas cluster. The connection string is configured in `server/index.js`. To seed the database with sample data:

```bash
node server/seed.js
```

This inserts 19 sample users and 4 admin accounts (including `admin` / `password123`).

---

## Running the Application

You need **two terminal windows**:

### Terminal 1 — Start the Backend

```bash
npm run server
```

**Output:**
```
Connected to MongoDB (QRAPP)
Server running at http://localhost:5001
```

### Terminal 2 — Start the Frontend

```bash
npm run dev
```

**Output:**
```
VITE v7.3.1  ready in ... ms
➜  Local:   http://localhost:5175/
```

### Open in Browser

Navigate to **http://localhost:5175**

---

## Default Admin Credentials

| Username | Password | Name | Role |
|---|---|---|---|
| `admin` | `password123` | Aishwary Jhaveri | Admin |
| `manager` | `manager123` | Test Manager | AdminManager |
| `newadmin` | `newpassword` | New Administrator | Admin |
| `test` | `test` | test | Admin |

---

## API Endpoints

All endpoints are served at `http://localhost:5001`.

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Fetch all users |
| `POST` | `/users` | Create a user `{ name, phone, city }` |
| `PUT` | `/users/:id` | Update a user |
| `DELETE` | `/users/:id` | Delete a user |

### Admins

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admins` | Fetch all admins (`?username=xxx` for login) |
| `POST` | `/admins` | Create an admin `{ name, username, password, role, phone, city }` |
| `PUT` | `/admins/:id` | Update an admin |
| `DELETE` | `/admins/:id` | Delete an admin |

### Response Format

All responses return JSON with Mongoose documents. Each document includes:
- `_id` — MongoDB ObjectId
- `id` — Virtual field (same as `_id`, string) for frontend compatibility
- `createdAt` / `updatedAt` — Auto-managed timestamps

---

## Admin Roles

Available roles (selectable in registration and admin edit forms):

| Role |
|---|
| President |
| Vice President |
| Secretary |
| Joint Secretary |
| Treasurer |
| Joint Treasurer |
| Committee Member |
| Project Convener |
| Project Co-convener |

---

## npm Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite --port 5175` | Start frontend dev server |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview production build |
| `server` | `node server/index.js` | Start Express backend on port 5001 |
| `server:dev` | `nodemon server/index.js` | Start backend with auto-restart on changes |
| `lint` | `eslint .` | Run ESLint |

---

## Dependencies

### Production
- `@emailjs/browser` ^4.4.1 — Contact form email delivery
- `axios` ^1.13.5 — HTTP client
- `bootstrap` ^5.3.8 — CSS grid & utilities
- `cors` ^2.8.6 — Cross-origin resource sharing
- `express` ^5.2.1 — Web framework
- `mongodb` ^7.4.0 — MongoDB native driver
- `mongoose` ^9.7.3 — MongoDB ODM
- `primeicons` ^7.0.0 — Icon set
- `primereact` ^10.9.7 — UI component library
- `react` ^19.2.0 — UI framework
- `react-dom` ^19.2.0 — React DOM renderer
- `react-router-dom` ^7.17.0 — Client-side routing
- `xlsx` ^0.18.5 — Excel/CSV parsing & generation

### Dev
- `vite` ^7.3.1 — Build tool & dev server
- `tailwindcss` ^3.4.4 — Utility CSS framework
- `postcss` ^8.5.15 — CSS processor
- `eslint` ^10.0.1 — Linter
- `@vitejs/plugin-react` ^5.1.1 — Vite React plugin
- `autoprefixer` ^10.5.0 — CSS vendor prefixes

---

## Configuration

### Vite
- Dev server port: **5175**
- Host: `true` (network-accessible)

### Express
- API port: **5001**
- CORS enabled for all origins
- JSON body parsing enabled

### MongoDB
- Atlas cluster: `qr-app.okafjbt.mongodb.net`
- Database: `QRAPP`
- Connection configured in `server/index.js`

### EmailJS
- Service ID: `service_mu32qtl`
- Template ID: `template_616bs8f`
- Public key: Configured in `src/pages/Contact.jsx`

### QR Code
- API: `https://api.qrserver.com/v1/create-qr-code/`
- Size: 250×250px
- Embedded in dialog modals with print support

---
