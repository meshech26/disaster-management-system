# 🚨 Disaster Management System

An end-to-end, mission-critical real-time Disaster Management & Emergency Response System built with **React Native + Expo** for the cross-platform frontend (iOS, Android & Web) and **Node.js, Express & MongoDB** with **Socket.IO** for real-time dispatch and geolocation tracking.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native + Expo (SDK 51+)
- **Routing:** Expo Router (File-based navigation)
- **Web Support:** React Native Web
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **HTTP Client:** Axios
- **Maps:** OpenStreetMap (Leaflet dark theme integration for Web & Native)
- **Real-Time Communication:** Socket.IO Client
- **Notifications:** Expo Notifications / Push Service
- **Type Safety & Validation:** TypeScript + Zod

### Backend
- **Runtime:** Node.js & Express.js
- **Database:** MongoDB Atlas / Local MongoDB via Mongoose
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs password hashing
- **Real-Time Updates:** Socket.IO (Emergency rooms, responder GPS streaming, crisis broadcasts)
- **File & Image Uploads:** Cloudinary + Multer memory storage
- **Validation:** Zod schemas
- **Geospatial & Mapping:** 2dsphere MongoDB index, Haversine proximity calculations, OpenStreetMap Nominatim reverse geocoding

---

## 📂 Project Architecture

```text
disaster-management-system/
│
├── frontend/
│   ├── app/                      # Expo Router File-Based Navigation
│   │   ├── _layout.tsx           # Global Providers (Auth, Socket, Safe Area)
│   │   ├── index.tsx             # Welcome / Onboarding Screen
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx       # Authentication Stack
│   │   │   ├── login.tsx         # Login with 1-Click Demo Accounts
│   │   │   └── register.tsx      # Citizen Registration & Emergency Contacts
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # Bottom Tab Navigator
│   │   │   ├── index.tsx         # Dashboard with SOS Beacon & Live Feed
│   │   │   ├── map.tsx           # Interactive OpenStreetMap with Filters
│   │   │   ├── report.tsx        # Incident Reporting with Photo Picker & Needs
│   │   │   ├── alerts.tsx        # Emergency Broadcasts & Shelters Directory
│   │   │   └── profile.tsx       # User Profile, Role Switcher & Emergency Contacts
│   │   └── incident/
│   │       └── [id].tsx          # Incident Details & Responder Operations Panel
│   ├── components/               # Modular UI Components
│   │   ├── SosBeaconButton.tsx   # Prominent SOS Emergency Distress Beacon
│   │   ├── DisasterMap.tsx       # Leaflet OpenStreetMap Component (Dark Theme)
│   │   ├── IncidentCard.tsx      # Incident Feed Card
│   │   ├── AlertBanner.tsx       # Critical Emergency Advisory Banner
│   │   ├── ShelterCard.tsx       # Shelter Card with Capacity Progress Bar
│   │   └── Header.tsx            # Top Bar with Live Socket Status & Role
│   ├── services/                 # API & WebSocket Clients
│   │   ├── api.ts                # Axios Instance with JWT Interceptors
│   │   ├── authService.ts        # Auth & Location Sync
│   │   ├── incidentService.ts    # Incidents CRUD & Status Updates
│   │   ├── sosService.ts         # Emergency SOS Signal Transmission
│   │   ├── shelterService.ts     # Relief Shelters & Broadcasts
│   │   └── socketService.ts      # Socket.IO Real-Time Dispatch Client
│   ├── context/                  # React Contexts
│   │   ├── AuthContext.tsx       # Auth State & User Session
│   │   └── SocketContext.tsx     # WebSocket Events & Live State
│   ├── hooks/
│   │   ├── useLocation.ts        # Geolocation Coordinates Hook
│   │   └── useSos.ts             # SOS Trigger & Cancellation Hook
│   ├── store/
│   │   └── index.ts              # Disaster Global State Definitions
│   ├── utils/
│   │   ├── formatters.ts         # Distance, Date, and Severity formatters
│   │   ├── location.ts           # Geo Bounding Box Calculations
│   │   └── storage.ts            # Cross-platform LocalStorage / Memory
│   ├── constants/
│   │   ├── colors.ts             # Emergency Alert Theme Palette
│   │   └── disasterTypes.ts      # Disaster Types & Preparedness Tips
│   ├── types/
│   │   └── index.ts              # Complete TypeScript Interfaces
│   ├── assets/                   # App Icons & Images
│   ├── config/
│   │   └── env.ts                # Frontend Environment Config
│   ├── package.json
│   ├── app.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/
│   ├── models/                   # Mongoose Schemas (Geo-Spatial Indexed)
│   │   ├── User.js               # Citizen, Responder, Admin Roles
│   │   ├── Incident.js           # Disaster Reports with 2dsphere location
│   │   ├── SosAlert.js           # Active SOS Beacons & Assigned Units
│   │   ├── Shelter.js            # Relief Camps, Capacity, Supplies
│   │   ├── Resource.js           # Medical, Food, Boats Inventory
│   │   └── AlertBroadcast.js     # Regional Evacuation & Crisis Warnings
│   ├── controllers/              # Request Handlers
│   │   ├── authController.js
│   │   ├── incidentController.js
│   │   ├── sosController.js
│   │   ├── shelterController.js
│   │   ├── broadcastController.js
│   │   └── resourceController.js
│   ├── routes/                   # Express API Endpoints
│   │   ├── authRoutes.js
│   │   ├── incidentRoutes.js
│   │   ├── sosRoutes.js
│   │   ├── shelterRoutes.js
│   │   ├── broadcastRoutes.js
│   │   └── resourceRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer Token Authentication
│   │   ├── roleMiddleware.js     # Role Authorization (citizen, responder, admin)
│   │   ├── uploadMiddleware.js   # Multer Memory Storage for Media
│   │   └── errorMiddleware.js    # Global Error & 404 Handlers
│   ├── services/
│   │   ├── cloudinaryService.js  # Photo/Video Upload with Fallback
│   │   ├── notificationService.js# Expo Push Notifications
│   │   └── geocodingService.js   # OSM Nominatim Reverse Geocoding
│   ├── validators/               # Zod Schema Validators
│   │   ├── authValidator.js
│   │   ├── incidentValidator.js
│   │   └── sosValidator.js
│   ├── config/
│   │   ├── db.js                 # MongoDB Atlas Connection
│   │   ├── cloudinary.js         # Cloudinary SDK Configuration
│   │   └── env.js                # Environment Variables Loader
│   ├── utils/
│   │   ├── apiResponse.js        # Standardized JSON Response
│   │   └── distance.js           # Haversine Distance Function
│   ├── socket/
│   │   └── socketHandler.js      # Socket.IO Real-Time Channels & Rooms
│   ├── seeders/
│   │   └── seedData.js           # Demo Database Seeder Script
│   ├── server.js                 # HTTP + WebSocket Server Entry Point
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher (v22 installed)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/disaster_management`) or free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies (already prepared)
npm install

# Configure environment variables
# Copy .env.example to .env and adjust if needed:
cp .env.example .env

# (Optional) Seed database with demo incidents, shelters, and users
npm run seed

# Start development server
npm run dev
# or
npm start
```
The server will start on `http://localhost:5000` with WebSocket support enabled.
Health check: `http://localhost:5000/api/health`

---

### 3. Frontend Setup (React Native + Expo)

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo development server
npm start
```

Press:
- **`w`** in the terminal to launch in **Web Browser** (`http://localhost:8081`).
- **`a`** to launch in an **Android Emulator** or scan the QR code with **Expo Go**.
- **`i`** to launch in an **iOS Simulator**.

---

## 🔑 Demo Login Credentials

The database seeder (`npm run seed` in backend) creates three pre-configured accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin / HQ Commander** | `admin@disaster.org` | `password123` | Publish emergency broadcasts, view all SOS beacons, assign responders, manage shelters |
| **Field Responder** | `responder@disaster.org` | `password123` | Accept SOS missions, verify incident reports, stream live location, update mission status |
| **Citizen** | `citizen@disaster.org` | `password123` | Activate instant SOS beacon, report incidents with photos, view safe shelters & live map |

> **Tip:** You can also click the **"⚡ One-Tap Demo Accounts"** buttons right on the Login screen or use the **Role Switcher** in the Profile tab.

---

## 📡 Real-Time Socket.IO Channels

| Socket Event | Direction | Description |
| :--- | :--- | :--- |
| `join_role_room` | Client ➔ Server | Registers user into `role_responders` or `role_admins` |
| `join_sos_room` | Client ➔ Server | Joins a dedicated channel `sos_<id>` for an active rescue mission |
| `emergency_sos_beacon` | Server ➔ Responders | Dispatched instantly when a citizen triggers an SOS distress call |
| `sos_status_changed` | Server ➔ Clients | Dispatched when a responder accepts or resolves an SOS mission |
| `stream_victim_location` | Victim ➔ Responders | Real-time continuous GPS tracking of the victim |
| `stream_responder_location` | Responder ➔ Victim | Real-time GPS tracking of the incoming rescue team |
| `emergency_alert_broadcast` | Server ➔ All Users | Emergency evacuation alerts and siren advisories |
| `map_marker_added` | Server ➔ All Users | Real-time pin placement on the OpenStreetMap interface |

---

## 🌐 Key REST API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create citizen account
- `POST /api/auth/login` - Authenticate & obtain JWT
- `GET /api/auth/me` - Current user profile
- `PUT /api/auth/location` - Update user GPS coordinates
- `POST /api/auth/emergency-contacts` - Add next-of-kin contacts

### Incidents (`/api/incidents`)
- `GET /api/incidents` - List all disaster reports (filter by `status`, `disasterType`, `severity`, `lat`, `lng`)
- `POST /api/incidents` - File new incident report with multipart photos (Cloudinary)
- `GET /api/incidents/:id` - Detailed view of specific incident
- `PATCH /api/incidents/:id/status` - Update status (`verified`, `in_progress`, `resolved`)
- `POST /api/incidents/:id/assign` - Dispatch responders

### Emergency SOS (`/api/sos`)
- `POST /api/sos` - Trigger emergency SOS beacon
- `GET /api/sos` - List active SOS beacons (Responders & Admins)
- `GET /api/sos/me` - Retrieve current citizen's active SOS
- `PATCH /api/sos/:id/status` - Accept or cancel SOS mission

### Shelters & Safe Zones (`/api/shelters`)
- `GET /api/shelters` - List all shelters with proximity calculations
- `POST /api/shelters` - Register new shelter (Admin/Responder)
- `PATCH /api/shelters/:id/occupancy` - Update live occupancy count

### Emergency Broadcasts (`/api/broadcasts`)
- `GET /api/broadcasts` - Active official disaster warnings
- `POST /api/broadcasts` - Issue regional emergency warning (Admin/Responder)
