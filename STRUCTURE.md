# Project Structure

```
hotel-app-startup/
│
├── public/                         # FRONTEND - Served by Apache & Firebase Hosting
│   ├── index.html                  # Landing page with hotel showcase
│   ├── akomodasi.html              # Accommodation/room selection
│   ├── rooms.html                  # Room catalog listing
│   ├── detail.html                 # Room detail page
│   ├── gallery.html                # Photo gallery
│   ├── admin-login.html            # Admin authentication page
│   ├── admin.html                  # Admin dashboard (manage bookings)
│   ├── dashboard.html              # Booking form
│   ├── 404.html                    # Not found page
│   ├── css/
│   │   └── style.css               # Tailwind CSS + custom styles
│   └── js/
│       ├── firebase.js             # Firebase SDK initialization
│       ├── auth.js                 # Auth state management + admin check
│       ├── api.js                  # PHP API client (fetch wrapper)
│       ├── app.js                  # Booking form logic
│       ├── admin.js                # Admin dashboard logic
│       ├── home.js                 # Home page + availability check
│       ├── rooms.js                # Room navigation helpers
│       └── detail.js               # Room detail helpers
│
├── backend/                        # BACKEND - PHP API Layer
│   ├── config/
│   │   ├── db.php                  # MySQL database connection
│   │   └── firebase.php           # Firebase ID token verification
│   ├── middleware/
│   │   ├── cors.php                # CORS headers (included by all endpoints)
│   │   ├── auth.php                # Firebase auth middleware (requireAuth, requireAdmin)
│   │   └── response.php           # JSON response helpers (jsonSuccess, jsonError)
│   └── api/
│       ├── index.php               # API status & endpoint documentation
│       ├── bookings.php            # Bookings CRUD (GET, POST, PUT, DELETE)
│       ├── rooms.php               # Room catalog (GET)
│       ├── users.php               # User management (GET, POST)
│       └── availability.php        # Room availability check (GET)
│
├── database/                       # DATABASE SCHEMAS
│   └── init.sql                    # MySQL schema + seed data
│                                   # Tables: users, rooms, bookings, payments
│
├── docker/                         # DOCKER CONFIGURATION
│   ├── Dockerfile                  # PHP 8.1 Apache image with mod_rewrite
│   └── apache.conf                 # Apache virtual host configuration
│
├── scripts/                        # UTILITY SCRIPTS
│   ├── start.sh                    # Start Docker services
│   └── stop.sh                     # Stop Docker services
│
├── firebase.json                   # Firebase Hosting configuration
├── .firebaserc                     # Firebase project reference
├── firestore.rules                 # Firestore security rules (legacy)
├── firestore.indexes.json          # Firestore index definitions
│
├── docker-compose.yml              # Docker services (MySQL, PHPMyAdmin, PHP)
├── .env                            # Environment variables (local - gitignored)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── README.md                       # Main documentation
└── STRUCTURE.md                    # This file
```

## Database Schema (MySQL)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles linked to Firebase | firebase_uid, email, phone, name |
| `rooms` | Room inventory with pricing | nama, harga, img, deskripsi |
| `bookings` | Reservations | booking_code, user_id, room, dates, status |
| `payments` | Payment records | booking_id, amount, status |

## Data Flow

```
User Auth ──► Firebase Auth SDK ──► Firebase (verify)
       │
       └──► api.js ──► PHP API ──► MySQL
                              │
                              └──► Middleware: auth.php (verify token via Firebase REST API)
```

- **Firebase Auth**: Handles login/registration on the client side
- **Firebase Token**: Sent as `Authorization: Bearer <token>` to PHP API
- **PHP Middleware**: `auth.php` verifies the token via Firebase REST API
- **MySQL**: All CRUD operations go here (source of truth)
- **Firestore**: Optional; available for real-time features if needed
