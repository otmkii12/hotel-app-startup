<?php

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/response.php';

$conn = require __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

try {
    $room = $_GET['room'] ?? null;
    $checkin = $_GET['checkin'] ?? null;
    $checkout = $_GET['checkout'] ?? null;

    if (!$room || !$checkin || !$checkout) {
        jsonError('Missing required parameters: room, checkin, checkout');
    }

    if ($checkout <= $checkin) {
        jsonError('Checkout date must be after checkin date');
    }

    $stmt = $conn->prepare("SELECT checkin, checkout, status FROM bookings
                            WHERE room = ?
                              AND status != 'Dibatalkan'
                              AND checkin < ?
                              AND checkout > ?");
    $stmt->bind_param('sss', $room, $checkout, $checkin);
    $stmt->execute();
    $conflicting = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $available = count($conflicting) === 0;

    jsonSuccess([
        'available' => $available,
        'conflicting_bookings' => $conflicting,
    ], $available ? 'Room is available' : 'Room is not available for the selected dates');
} catch (Exception $e) {
    jsonServerError($e->getMessage());
} finally {
    $conn->close();
}
