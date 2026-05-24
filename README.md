# Hotel App - Reorganized with Docker & MySQL Backend

This is a reorganized version of the Hotel Reservation System with a proper project structure that separates concerns between frontend and backend, and includes Docker support for easy local development.

## Project Structure

```
hotel-app-startup/
├── public/                    # Frontend - served by Firebase/Apache
│   ├── index.html
│   ├── admin.html
│   ├── rooms.html
│   ├── akomodasi.html
│   ├── detail.html
│   ├── gallery.html
│   ├── dashboard.html
│   ├── admin-login.html
│   ├── 404.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── firebase.js       # Firebase config
│       ├── auth.js           # Authentication logic
│       ├── app.js            # Main app logic
│       ├── admin.js
│       ├── home.js
│       ├── rooms.js
│       ├── detail.js
│       └── ...
│
├── src/
│   └── backend/              # PHP backend API
│       ├── config/
│       │   └── db.php        # MySQL database connection
│       └── api/
│           ├── bookings.php  # Bookings CRUD endpoints
│           ├── rooms.php     # Rooms GET endpoints
│           └── ...
│
├── database/
│   └── init.sql              # MySQL schema initialization
│
├── docker/
│   ├── apache.conf           # Apache configuration
│   └── ...
│
├── docker-compose.yml        # Docker services configuration
├── .env                      # Environment variables (local)
├── .env.example              # Environment template for team
├── .gitignore               # Git ignore rules
├── firestore.rules          # Firebase Firestore security rules
├── firebase.json            # Firebase configuration
└── README.md                # This file
```

## Prerequisites

- **Docker** and **Docker Compose** installed on your system
- **Modern web browser** with JavaScript enabled

## Quick Start

### 1. Clone or Navigate to Project
```bash
cd /path/to/hotel-app-startup
```

### 2. Set Environment Variables
Copy the example environment file and modify as needed:
```bash
cp .env.example .env
```

Edit `.env` to customize:
```env
MYSQL_ROOT_PASSWORD=rootpassword123
MYSQL_DATABASE=hotel_app_db
MYSQL_USER=hotel_user
MYSQL_PASSWORD=hotelpass123
MYSQL_PORT=3306
PHPMYADMIN_PORT=8080
PHP_PORT=80
```

### 3. Start Docker Services
```bash
docker-compose up -d
```

This will:
- Start MySQL 8.0 container with sample data
- Start PHPMyAdmin on http://localhost:8080
- Start Apache with PHP on http://localhost:80

### 4. Access the Application

#### Frontend (Static Files)
- **Home Page**: `http://localhost/index.html`
- Navigate to Firebase-hosted domain for production

#### PHPMyAdmin (Database Management)
- **URL**: `http://localhost:8080`
- **Username**: `hotel_user`
- **Password**: `hotelpass123` (or your custom value from .env)
- **Root Password**: `rootpassword123` (or your custom root password)

#### PHP API Endpoints
Base URL: `http://localhost/src/backend/api/`

**Bookings Endpoints:**
- `GET /bookings.php?booking_id=1` - Get single booking
- `GET /bookings.php?firebase_uid=USER_UID` - Get user's bookings
- `POST /bookings.php` - Create new booking (requires JSON body)
- `PUT /bookings.php` - Update booking status (requires JSON body)

**Rooms Endpoints:**
- `GET /rooms.php` - Get all rooms
- `GET /rooms.php?id=1` - Get single room

### 5. Example API Usage (JavaScript/Frontend)

#### Fetch All Rooms
```javascript
fetch('http://localhost/src/backend/api/rooms.php')
  .then(res => res.json())
  .then(data => console.log(data.data));
```

#### Create a Booking
```javascript
const bookingData = {
  firebase_uid: 'user_123',
  user_name: 'John Doe',
  user_email: 'john@example.com',
  user_phone: '+6281234567890',
  booking_code: 'HTL-123456-ABC12',
  room: 'Deluxe Room',
  room_price: 800000,
  checkin: '2026-06-01',
  checkout: '2026-06-03',
  nights: 2,
  guests: 2,
  rooms: 1,
  payment_method: 'Transfer Bank',
  total: 1600000
};

fetch('http://localhost/src/backend/api/bookings.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
})
.then(res => res.json())
.then(data => console.log(data));
```

#### Fetch User's Bookings
```javascript
const firebaseUid = 'user_123'; // From Firebase auth
fetch(`http://localhost/src/backend/api/bookings.php?firebase_uid=${firebaseUid}`)
  .then(res => res.json())
  .then(data => console.log(data.data));
```

#### Update Booking Status
```javascript
const updateData = {
  booking_id: 1,
  status: 'Dikonfirmasi'
};

fetch('http://localhost/src/backend/api/bookings.php', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
})
.then(res => res.json())
.then(data => console.log(data));
```

## Database Schema

### Tables
- **users** - Stores user profile linked to Firebase UID
- **rooms** - Stores room types and prices (Deluxe, Suite, Family)
- **bookings** - Stores all reservations with validation
- **payments** - Stores payment transaction records

All tables use `utf8mb4` character set for full emoji/international character support.

## Docker Commands

### View Logs
```bash
docker-compose logs -f mysql
docker-compose logs -f phpmyadmin
docker-compose logs -f php
```

### Stop Services
```bash
docker-compose down
```

### Stop Services and Remove Data
```bash
docker-compose down -v
```

### Rebuild Services
```bash
docker-compose up -d --build
```

### Remove Everything
```bash
docker-compose down -v
rm -rf docker/mysql-data
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `rootpassword123` |
| `MYSQL_DATABASE` | Database name | `hotel_app_db` |
| `MYSQL_USER` | MySQL user | `hotel_user` |
| `MYSQL_PASSWORD` | MySQL user password | `hotelpass123` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `PHPMYADMIN_PORT` | PHPMyAdmin web port | `8080` |
| `PHP_PORT` | PHP/Apache port | `80` |

## Frontend Integration

The frontend JavaScript files need to be updated to call the PHP API instead of/in addition to Firebase. Example:

```javascript
// Instead of Firebase only:
// db.collection('bookings').add(data);

// Use PHP API:
const response = await fetch('http://localhost/src/backend/api/bookings.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
const result = await response.json();
```

## Database Backup

To backup your database:
```bash
# Backup from running container
docker exec hotel-app-mysql mysqldump -u hotel_user -photelpass123 hotel_app_db > backup.sql

# Restore
cat backup.sql | docker exec -i hotel-app-mysql mysql -u hotel_user -photelpass123 hotel_app_db
```

## Troubleshooting

### Can't connect to MySQL
1. Ensure containers are running: `docker-compose ps`
2. Wait for MySQL to be ready (check logs): `docker-compose logs mysql`
3. Verify environment variables in `.env`

### PHPMyAdmin shows "Cannot connect to server"
1. Check MySQL container is healthy: `docker-compose logs mysql`
2. Verify credentials in `.env`
3. Ensure `MYSQL_USER` and `MYSQL_PASSWORD` are consistent

### PHP can't connect to MySQL
1. Container names must match in docker-compose.yml
2. Port mappings - internal container communication uses port 3306
3. Check PHP error logs: `docker-compose logs php`

### Port Already in Use
Change ports in `.env`:
```env
MYSQL_PORT=3307
PHPMYADMIN_PORT=8081
PHP_PORT=8000
```

Then modify docker-compose.yml port mappings accordingly.

## Firebase Integration

This project maintains:
- **Firebase Authentication** - User login/registration (in frontend)
- **Firebase Hosting** - Deploy the `/public` folder
- **MySQL Database** - Backend data storage (new)
- **PHP API** - Bridge between frontend and MySQL

Update frontend JavaScript to use both Firebase Auth and PHP API for data persistence.

## Security Notes

⚠️ **Development Only**
- `.env` contains plain-text credentials for Docker
- Default passwords should be changed for production
- Database should be behind authentication/firewall in production
- Enable HTTPS for production
- Implement proper JWT authentication between frontend and API

## Future Enhancements

- [ ] Add PHP-based user registration/profile management
- [ ] Implement JWT authentication for API security
- [ ] Add payment gateway integration (Midtrans, Stripe)
- [ ] Email notifications for bookings
- [ ] Admin dashboard API endpoints
- [ ] Analytics and reporting
- [ ] Image upload service

## Support

For issues or questions, check:
1. Docker Compose logs: `docker-compose logs`
2. PHPMyAdmin console: `http://localhost:8080`
3. Browser console for frontend errors
4. PHP error logs in container

## License

Same as original project

