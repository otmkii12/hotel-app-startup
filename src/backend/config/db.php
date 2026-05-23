<?php
/**
 * Database Configuration
 * Connects to MySQL using environment variables from Docker .env
 */

// Get environment variables
$mysql_host = getenv('MYSQL_HOST') ?: 'localhost';
$mysql_database = getenv('MYSQL_DATABASE') ?: 'hotel_app_db';
$mysql_user = getenv('MYSQL_USER') ?: 'hotel_user';
$mysql_password = getenv('MYSQL_PASSWORD') ?: 'hotelpass123';
$mysql_port = getenv('MYSQL_PORT') ?: 3306;

// Create MySQLi connection
$conn = new mysqli($mysql_host, $mysql_user, $mysql_password, $mysql_database, $mysql_port);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");

// Enable error reporting for development
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Return connection
return $conn;

