<?php
/**
 * Hotel App Backend API
 * Version 1.0
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$api_endpoints = [
    'status' => 'Hotel App Backend API is running',
    'version' => '1.0',
    'timestamp' => date('Y-m-d H:i:s'),
    'endpoints' => [
        'users' => [
            'GET /api/users.php?firebase_uid=UID' => 'Get user profile by Firebase UID',
            'POST /api/users.php' => 'Create/update user profile'
        ],
        'bookings' => [
            'GET /api/bookings.php?booking_id=ID' => 'Get single booking by ID',
            'GET /api/bookings.php?firebase_uid=UID' => 'Get all bookings by user Firebase UID',
            'POST /api/bookings.php' => 'Create new booking',
            'PUT /api/bookings.php' => 'Update booking details'
        ],
        'rooms' => [
            'GET /api/rooms.php' => 'Get all available rooms',
            'GET /api/rooms.php?id=ID' => 'Get single room by ID'
        ]
    ],
    'documentation' => 'See README.md in project root for detailed API documentation',
    'database' => [
        'host' => getenv('MYSQL_HOST') ?: 'localhost',
        'database' => getenv('MYSQL_DATABASE') ?: 'hotel_app_db',
        'status' => 'Checking connection...'
    ]
];

// Try to verify database connection
try {
    $conn = require 'config/db.php';
    $result = $conn->query("SELECT 1");
    $api_endpoints['database']['status'] = 'Connected';
    $conn->close();
} catch (Exception $e) {
    $api_endpoints['database']['status'] = 'Connection failed: ' . $e->getMessage();
}

echo json_encode($api_endpoints, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

