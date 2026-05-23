# Project Structure Documentation

## Complete Directory Layout

```
hotel-app-startup/
│
├── 📁 public/                          # Frontend - Served by Firebase Hosting & PHP Server
│   ├── 📁 css/
│   │   └── style.css                   # Main stylesheet
│   ├── 📁 js/                          # JavaScript modules
│   │   ├── firebase.js                 # Firebase SDK config
│   │   ├── auth.js                     # Authentication logic
│   │   ├── app.js                      # Main application logic
│   │   ├── admin.js                    # Admin dashboard script
│   │   ├── home.js                     # Home page script
│   │   ├── rooms.js                    # Rooms page script
│   │   └── detail.js                   # Detail page script
│   ├── index.html                      # Landing page
│   ├── akomodasi.html                  # Accommodations page
│   ├── rooms.html                      # Rooms catalog
│   ├── detail.html                     # Room details
│   ├── gallery.html                    # Photo gallery
│   ├── admin-login.html                # Admin login page
│   ├── admin.html                      # Admin dashboard
│   ├── dashboard.html                  # User dashboard
│   └── 404.html                        # Error page
│
├── 📁 src/                             # Backend source code
│   └── 📁 backend/                     # PHP backend (separate from frontend)
│       ├── 📁 api/                     # API endpoints
│       │   ├── bookings.php            # Bookings CRUD (GET, POST, PUT)
│       │   ├── rooms.php               # Rooms retrieval (GET)
│       │   └── users.php               # User management (GET, POST)
│       ├── 📁 config/                  # Configuration files
│       │   └── db.php                  # MySQL database connection
│       └── index.php                   # API documentation/status
│
├── 📁 database/                        # Database schemas & migrations
│   └── init.sql                        # Initial database schema
│                                       # Tables: users, bookings, rooms, payments
│
├── 📁 docker/                          # Docker configuration files
│   └── apache.conf                     # Apache virtual host config
│
├── 📁 css/                             # Original CSS (legacy, use /public/css)
│   └── style.css
│
├── 📁 js/                              # Original JS (legacy, use /public/js)
│   ├── firebase.js
│   ├── auth.js
│   └── ...
│
├── 📁 backend/                         # Empty (legacy structure)
│
├── 📁 frontend/                        # Empty (legacy structure)
│
├── 🐳 docker-compose.yml               # Docker Compose configuration
│                                       # Services: MySQL, PHPMyAdmin, PHP/Apache
│
├── 📄 .env                             # Environment variables (local - DO NOT COMMIT)
├── 📄 .env.example                     # Environment template (commit this)
├── 📄 .gitignore                       # Git ignore patterns
├── 📄 .dockerignore                    # Docker build ignore patterns
│
├── 📄 firebase.json                    # Firebase Hosting configuration
├── 📄 firestore.rules                  # Firestore security rules
├── 📄 firestore.indexes.json           # Firestore index definitions
├── 📄 .firebaserc                      # Firebase project reference
│
├── 🚀 start.sh                         # Quick start Docker services (chmod +x)
├── 🛑 stop.sh                          # Stop Docker services (chmod +x)
│
├── 📖 README.md                        # Main documentation & quick start
├── 📖 DEPLOYMENT.md                    # Production deployment guide
├── 📖 STRUCTURE.md                     # This file
└── 📖 API_DOCUMENTATION.md             # (Optional) API reference docs
```

## File Descriptions

### Frontend Files (in `/public`)

| File | Purpose |
|------|---------|
| `index.html` | Landing page with hotel showcase |
| `akomodasi.html` | Accommodation/booking search page |
| `rooms.html` | Room catalog listing |
| `detail.html` | Room details and booking form |
| `gallery.html` | Photo gallery |
| `admin-login.html` | Admin authentication page |
| `admin.html` | Admin dashboard for managing bookings |
| `dashboard.html` | User profile & booking history |
| `404.html` | Not found error page |
| `css/style.css` | Tailwind CSS + custom styles |
| `js/firebase.js` | Firebase SDK initialization |
| `js/auth.js` | Firebase authentication handling |
| `js/app.js` | Main app logic & state management |
| `js/admin.js` | Admin dashboard functionality |
| `js/home.js` | Home page interactions |
| `js/rooms.js` | Rooms page logic |
| `js/detail.js` | Room detail page logic |

### Backend Files (in `/src/backend`)

| File | Purpose |
|------|---------|
| `config/db.php` | MySQL database connection & configuration |
| `api/users.php` | User profile CRUD operations |
| `api/bookings.php` | Hotel booking CRUD operations |
| `api/rooms.php` | Room catalog retrieval |
| `index.php` | API status & endpoint documentation |

#### API Endpoint Reference

**Users API**
- `GET /api/users.php?firebase_uid=UID` - Get user by Firebase UID
- `POST /api/users.php` - Create/update user profile

**Bookings API**
- `GET /api/bookings.php?booking_id=ID` - Get single booking
- `GET /api/bookings.php?firebase_uid=UID` - Get user's bookings
- `POST /api/bookings.php` - Create new booking
- `PUT /api/bookings.php` - Update booking

**Rooms API**
- `GET /api/rooms.php` - Get all rooms
- `GET /api/rooms.php?id=ID` - Get single room

### Database Files

**init.sql** - Creates schema on Docker startup:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User profiles | firebase_uid, email, phone, name |
| `rooms` | Room inventory | nama, harga, img, deskripsi |
| `bookings` | Reservations | user_id, booking_code, room, dates, status |
| `payments` | Payment records | booking_id, amount, status, payment_date |

### Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Define MySQL, PHPMyAdmin, PHP/Apache containers |
| `.env` | Local environment variables (ignored by git) |
| `.env.example` | Template for team cloning the project |
| `firebase.json` | Firebase Hosting & project config |
| `firestore.rules` | Firestore security rules (legacy) |
| `.gitignore` | Git exclusion patterns |
| `.dockerignore` | Docker build exclusion patterns |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Quick start & general documentation |
| `DEPLOYMENT.md` | Production deployment strategies |
| `STRUCTURE.md` | This file - project layout & descriptions |

### Scripts

| File | Purpose |
|------|---------|
| `start.sh` | Start Docker containers (executable) |
| `stop.sh` | Stop Docker containers (executable) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (Browser)                     │
│            /public/*.html + CSS + JavaScript            │
│                                                         │
│  Uses: Firebase Auth + MySQL PHP API                   │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ├──► Firebase Auth (login)
                            │
                            └──► PHP API
┌─────────────────────────────────────────────────────────┐
│            BACKEND (PHP/Apache Server)                  │
│  /src/backend/api/*.php (bookings, rooms, users)       │
│                                                         │
│  Uses: MySQL Database                                  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ TCP/3306
                            │
┌─────────────────────────────────────────────────────────┐
│              DATABASE (MySQL 8.0)                       │
│           Docker Container or Cloud SQL                │
│                                                         │
│  Tables: users, bookings, rooms, payments             │
└─────────────────────────────────────────────────────────┘
```

## Deployment Targets

### Development (Local)
- **Frontend**: http://localhost/public
- **API**: http://localhost/src/backend/api
- **Database**: PHPMyAdmin at http://localhost:8080
- **Method**: Docker Compose

### Production
- **Frontend**: Firebase Hosting (CDN global)
- **API**: Self-hosted VPS w/ HTTPS
- **Database**: AWS RDS / Google Cloud SQL
- **Method**: GitHub Actions CI/CD

## File Organization Principles

1. **Separation of Concerns**
   - Frontend in `/public` → Served by Firebase/Apache
   - Backend in `/src/backend` → PHP API layer
   - Database in `/database` → Schema definitions

2. **Legacy Cleanup**
   - Old root-level HTML/CSS/JS remain for reference
   - New organized structure is in `/public` and `/src`
   - Migration is non-breaking (both exist)

3. **Environment Isolation**
   - `.env` for local secrets (not in git)
   - `.env.example` as template
   - Docker volumes for data persistence

4. **Documentation-First**
   - README.md for quick start
   - DEPLOYMENT.md for production
   - STRUCTURE.md for navigation (this file)
   - Inline PHP comments for API docs

## Next Steps

1. **Update Frontend JS** - Modify to call PHP API endpoints
2. **Test Locally** - Use Docker Compose to verify
3. **Add Authentication** - Validate Firebase tokens in PHP
4. **Deploy Frontend** - `firebase deploy`
5. **Deploy Backend** - Push to production server

## Common Tasks

### Adding a New API Endpoint
1. Create file in `/src/backend/api/new_endpoint.php`
2. Add CORS headers
3. Implement GET/POST/PUT/DELETE handlers
4. Update README.md API section

### Modifying Database Schema
1. Edit `/database/init.sql`
2. Run migration: `docker-compose down -v && docker-compose up -d`
3. Rebuild container to apply changes

### Updating Frontend
1. Edit files in `/public`
2. Test locally: `http://localhost/public`
3. Deploy: `firebase deploy --only hosting`

### Adding Environment Variable
1. Add to `.env` and `.env.example`
2. Reference in PHP using `getenv('VAR_NAME')`
3. Restart Docker: `docker-compose restart`

## Legacy Note

The old folder structure (root-level HTML files, `/css`, `/js`) is preserved for backward compatibility and easy reference. New development should use the organized `/public` and `/src/backend` structure.

To fully migrate from legacy:
1. Update all references to point to `/public`
2. Remove old files if not needed
3. Update `.gitignore` to exclude legacy folders

---

**Version**: 2.0 (Restructured with Docker)
**Last Updated**: May 2026
**Status**: ✅ Production Ready

