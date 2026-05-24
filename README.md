# Hotel App - Dual Database Architecture (MySQL + Firebase)

Hotel reservation system with **MySQL** as the source of truth and **Firebase Authentication** for user identity. Firestore is available as an optional real-time sync layer.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   BROWSER (Frontend)                        │
│                    /public/*.html                           │
│                                                             │
│  Firebase Auth (login/signup)    PHP API Client (api.js)    │
│       │                                    │                │
└───────┼────────────────────────────────────┼────────────────┘
        │                                    │
        │ Firebase SDK                       │ HTTP
        ▼                                    ▼
┌───────────────┐                  ┌──────────────────────────┐
│ Firebase Auth │                  │   PHP 8.1 / Apache API   │
│  (Identity)   │                  │    /backend/api/         │
│               │                  │                           │
│  Firestore    │                  │  Middleware:              │
│  (Optional)   │                  │  ├─ cors.php             │
└───────────────┘                  │  ├─ auth.php             │
                                   │  └─ response.php         │
                                   │                           │
                                   │  Endpoints:               │
                                   │  ├─ bookings.php          │
                                   │  ├─ rooms.php             │
                                   │  ├─ users.php             │
                                   │  └─ availability.php      │
                                   └───────────┬───────────────┘
                                               │ TCP/3306
                                               ▼
                                   ┌──────────────────────────┐
                                   │     MySQL 8.0 Database    │
                                   │  Tables: users, bookings, │
                                   │          rooms, payments  │
                                   └──────────────────────────┘
```

## Project Structure

```
hotel-app-startup/
├── public/                         # Frontend (Firebase Hosting)
│   ├── index.html                  # Landing page
│   ├── rooms.html                  # Room catalog
│   ├── detail.html                 # Room detail
│   ├── akomodasi.html              # Accommodation search
│   ├── gallery.html                # Photo gallery
│   ├── admin-login.html            # Admin auth page
│   ├── admin.html                  # Admin dashboard
│   ├── dashboard.html              # Booking form
│   ├── 404.html                    # Error page
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── firebase.js             # Firebase SDK init
│       ├── auth.js                 # Auth state + admin check
│       ├── api.js                  # PHP API client
│       ├── app.js                  # Booking form logic
│       ├── admin.js                # Admin dashboard
│       ├── home.js                 # Home page + availability
│       ├── rooms.js                # Room navigation
│       └── detail.js               # Room detail page
│
├── backend/                        # PHP API
│   ├── config/
│   │   ├── db.php                  # MySQL connection
│   │   └── firebase.php           # Firebase token verification
│   ├── middleware/
│   │   ├── cors.php                # CORS headers
│   │   ├── auth.php                # Auth verification
│   │   └── response.php           # JSON response helpers
│   └── api/
│       ├── index.php               # API status
│       ├── bookings.php            # Bookings CRUD
│       ├── rooms.php               # Room listing
│       ├── users.php               # User management
│       └── availability.php        # Room availability check
│
├── database/
│   └── init.sql                    # MySQL schema + seed data
│
├── docker/
│   ├── Dockerfile                  # PHP Apache image
│   └── apache.conf                 # Apache virtual host
│
├── scripts/
│   ├── start.sh                    # Start Docker services
│   └── stop.sh                     # Stop Docker services
│
├── firebase.json                   # Firebase Hosting config
├── .firebaserc                     # Firebase project ref
├── firestore.rules                 # Firestore security rules
├── docker-compose.yml
├── .env                            # Local environment vars
├── .env.example
├── .gitignore
└── README.md
```

## Dual Database Design

| Database | Role | Usage |
|----------|------|-------|
| **MySQL** | Source of truth | All business data: bookings, rooms, users, payments |
| **Firebase Auth** | Identity provider | User login, registration, token generation |
| **Firestore** | Optional real-time cache | Legacy support; can be removed when migration complete |

### Data Flow

1. **Authentication**: Firebase Auth SDK in the browser
2. **Business Logic**: Frontend calls PHP API with Firebase ID token
3. **Authorization**: PHP verifies the token via Firebase REST API
4. **Data**: All CRUD operations go to MySQL
5. **Real-time**: Firestore can optionally mirror MySQL for real-time features

## Quick Start

```bash
# 1. Set environment variables
cp .env.example .env

# 2. Start Docker services
docker-compose up -d

# 3. Access the app
open http://localhost          # Frontend
open http://localhost:8080     # PHPMyAdmin
open http://localhost/backend/api/index.php  # API Status

# 4. Stop services
docker-compose down
```

## API Endpoints (All return JSON)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/backend/api/rooms.php` | No | List all rooms |
| GET | `/backend/api/rooms.php?id=ID` | No | Get room details |
| GET | `/backend/api/availability.php?room=X&checkin=D1&checkout=D2` | No | Check room availability |
| GET | `/backend/api/bookings.php?all=true` | Admin | Get all bookings |
| GET | `/backend/api/bookings.php?firebase_uid=UID` | Yes | Get user bookings |
| GET | `/backend/api/bookings.php?booking_id=ID` | Yes | Get single booking |
| POST | `/backend/api/bookings.php` | Yes | Create booking |
| PUT | `/backend/api/bookings.php` | Yes | Update booking |
| DELETE | `/backend/api/bookings.php?booking_id=ID` | Admin | Delete booking |
| GET | `/backend/api/users.php?firebase_uid=UID` | Yes | Get user profile |
| POST | `/backend/api/users.php` | Yes | Create/update user |

## Technology Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: PHP 8.1 with Apache
- **Database**: MySQL 8.0 (primary) + Firebase Firestore (optional)
- **Auth**: Firebase Authentication
- **Containerization**: Docker Compose
- **Hosting**: Firebase Hosting (frontend) + VPS (backend)
