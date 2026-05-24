<?php

require_once __DIR__ . '/../middleware/cors.php';

$info = [
    'name' => 'Hotel App API',
    'version' => '2.0',
    'status' => 'running',
    'timestamp' => date('c'),
    'database' => 'MySQL 8.0',
    'authentication' => 'Firebase Auth',
    'endpoints' => [
        'GET /api/rooms.php' => 'List all rooms',
        'GET /api/rooms.php?id=ID' => 'Get room by ID',
        'GET /api/availability.php?room=NAME&checkin=DATE&checkout=DATE' => 'Check room availability',
        'GET /api/bookings.php?booking_id=ID' => 'Get booking by ID',
        'GET /api/bookings.php?firebase_uid=UID' => 'Get user bookings',
        'GET /api/bookings.php?all=true' => '[Admin] Get all bookings',
        'POST /api/bookings.php' => 'Create booking',
        'PUT /api/bookings.php' => 'Update booking',
        'DELETE /api/bookings.php?booking_id=ID' => '[Admin] Delete booking',
        'GET /api/users.php?firebase_uid=UID' => 'Get user profile',
        'POST /api/users.php' => 'Create/update user profile',
    ],
];

try {
    $conn = require __DIR__ . '/../config/db.php';
    $conn->query('SELECT 1');
    $info['database_status'] = 'connected';
    $conn->close();
} catch (Exception $e) {
    $info['database_status'] = 'disconnected';
}

echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
