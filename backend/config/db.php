<?php

$mysql_host = getenv('MYSQL_HOST') ?: 'localhost';
$mysql_database = getenv('MYSQL_DATABASE') ?: 'hotel_app_db';
$mysql_user = getenv('MYSQL_USER') ?: 'hotel_user';
$mysql_password = getenv('MYSQL_PASSWORD') ?: 'hotelpass123';
$mysql_port = (int)(getenv('MYSQL_PORT') ?: 3306);

$conn = new mysqli($mysql_host, $mysql_user, $mysql_password, $mysql_database, $mysql_port);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

$conn->set_charset('utf8mb4');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

return $conn;
