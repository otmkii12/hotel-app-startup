-- Hotel App Database Schema
-- Initialize on first Docker run

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(60) NOT NULL UNIQUE,
    harga INT NOT NULL,
    img LONGTEXT,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    firebase_uid VARCHAR(255) NOT NULL,
    user_name VARCHAR(80) NOT NULL,
    user_email VARCHAR(120) NOT NULL,
    user_phone VARCHAR(20) NOT NULL,
    room VARCHAR(60) NOT NULL,
    room_price INT NOT NULL,
    checkin DATE NOT NULL,
    checkout DATE NOT NULL,
    nights INT NOT NULL,
    guests INT NOT NULL,
    rooms INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Pembayaran',
    total INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_code (booking_code),
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_user_email (user_email),
    INDEX idx_status (status),
    INDEX idx_checkin (checkin),
    INDEX idx_checkout (checkout)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    payment_method VARCHAR(50),
    amount INT NOT NULL,
    payment_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample rooms
INSERT INTO rooms (nama, harga, deskripsi) VALUES
('Deluxe Room', 800000, 'Spacious room with queen bed and modern amenities'),
('Suite Room', 1500000, 'Luxury suite with separate living area'),
('Family Room', 1200000, 'Large room perfect for families with multiple beds');

