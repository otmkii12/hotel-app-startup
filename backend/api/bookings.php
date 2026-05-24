<?php

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/response.php';

$conn = require __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGet($conn);
            break;
        case 'POST':
            handlePost($conn);
            break;
        case 'PUT':
            handlePut($conn);
            break;
        case 'DELETE':
            handleDelete($conn);
            break;
        default:
            jsonError('Method not allowed', 405);
    }
} catch (Exception $e) {
    jsonServerError($e->getMessage());
} finally {
    $conn->close();
}

function handleGet($conn) {
    if (isset($_GET['all'])) {
        $user = requireAdmin();
        $query = "SELECT b.*, u.name as user_name_ref, u.email as user_email_ref
                  FROM bookings b
                  LEFT JOIN users u ON b.user_id = u.id
                  ORDER BY b.created_at DESC";
        $result = $conn->query($query);
        $bookings = $result->fetch_all(MYSQLI_ASSOC);
        jsonSuccess($bookings);
    }

    if (isset($_GET['firebase_uid'])) {
        $firebase_uid = $_GET['firebase_uid'];
        $stmt = $conn->prepare("SELECT * FROM bookings WHERE firebase_uid = ? ORDER BY created_at DESC");
        $stmt->bind_param('s', $firebase_uid);
        $stmt->execute();
        $bookings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        jsonSuccess($bookings);
    }

    if (isset($_GET['booking_id'])) {
        $booking_id = (int)$_GET['booking_id'];
        $stmt = $conn->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->bind_param('i', $booking_id);
        $stmt->execute();
        $booking = $stmt->get_result()->fetch_assoc();
        if (!$booking) {
            jsonError('Booking not found', 404);
        }
        jsonSuccess($booking);
    }

    jsonError('Missing parameters. Use: booking_id, firebase_uid, or all', 400);
}

function handlePost($conn) {
    $firebaseUser = requireAuth();
    $data = getJsonInput();

    $required = ['user_name', 'user_email', 'user_phone', 'booking_code',
                 'room', 'room_price', 'checkin', 'checkout', 'nights',
                 'guests', 'rooms', 'payment_method', 'total'];
    validateRequired($data, $required);

    if (!filter_var($data['user_email'], FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email format');
    }

    if ($data['checkout'] <= $data['checkin']) {
        jsonError('Checkout date must be after checkin date');
    }

    $validRooms = [
        'Deluxe Room' => 800000,
        'Suite Room' => 1500000,
        'Family Room' => 1200000,
    ];

    if (!isset($validRooms[$data['room']]) || $validRooms[$data['room']] != $data['room_price']) {
        jsonError('Invalid room or price mismatch');
    }

    $firebaseUid = $firebaseUser['localId'] ?? $data['firebase_uid'] ?? '';

    $userId = findOrCreateUser($conn, $firebaseUid, $data['user_name'], $data['user_email'], $data['user_phone']);
    if (!$userId) {
        jsonServerError('Failed to resolve user account');
    }

    $stmt = $conn->prepare("INSERT INTO bookings (firebase_uid, user_id, user_name, user_email, user_phone,
                            booking_code, room, room_price, checkin, checkout, nights, guests, rooms,
                            payment_method, status, total)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Pembayaran', ?)");

    $stmt->bind_param('sisssssissiiisi',
        $firebaseUid,
        $userId,
        $data['user_name'],
        $data['user_email'],
        $data['user_phone'],
        $data['booking_code'],
        $data['room'],
        $data['room_price'],
        $data['checkin'],
        $data['checkout'],
        $data['nights'],
        $data['guests'],
        $data['rooms'],
        $data['payment_method'],
        $data['total']
    );

    $stmt->execute();
    jsonSuccess(['booking_id' => $conn->insert_id], 'Booking created successfully');
}

function handlePut($conn) {
    $firebaseUser = getFirebaseUser();
    $data = getJsonInput();

    if (!isset($data['booking_id'])) {
        jsonError('Missing booking_id');
    }

    $bookingId = (int)$data['booking_id'];

    $stmt = $conn->prepare("SELECT firebase_uid FROM bookings WHERE id = ?");
    $stmt->bind_param('i', $bookingId);
    $stmt->execute();
    $booking = $stmt->get_result()->fetch_assoc();

    if (!$booking) {
        jsonError('Booking not found', 404);
    }

    $isAdmin = false;
    if ($firebaseUser) {
        $adminEmails = explode(',', getenv('ADMIN_EMAILS') ?: 'rifkiagung874@gmail.com');
        $adminEmails = array_map('trim', $adminEmails);
        $userEmail = $firebaseUser['email'] ?? '';
        $emailVerified = $firebaseUser['emailVerified'] ?? $firebaseUser['email_verified'] ?? false;
        $isAdmin = $emailVerified && in_array($userEmail, $adminEmails);
    }

    $isOwner = $firebaseUser && ($firebaseUser['localId'] ?? '') === $booking['firebase_uid'];

    if (!$isAdmin && !$isOwner) {
        jsonError('Unauthorized to update this booking', 403);
    }

    $allowedFields = ['user_name', 'user_email', 'user_phone', 'payment_method', 'status'];
    if ($isAdmin) {
        $allowedFields[] = 'room';
        $allowedFields[] = 'room_price';
        $allowedFields[] = 'checkin';
        $allowedFields[] = 'checkout';
        $allowedFields[] = 'nights';
        $allowedFields[] = 'guests';
        $allowedFields[] = 'rooms';
        $allowedFields[] = 'total';
    }

    $updates = [];
    $types = '';
    $values = [];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $types .= 's';
            $values[] = $data[$field];
        }
    }

    if (empty($updates)) {
        jsonError('No valid fields to update');
    }

    $query = "UPDATE bookings SET " . implode(', ', $updates) . " WHERE id = ?";
    $types .= 'i';
    $values[] = $bookingId;

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    jsonSuccess(null, 'Booking updated successfully');
}

function handleDelete($conn) {
    requireAdmin();

    if (!isset($_GET['booking_id'])) {
        jsonError('Missing booking_id');
    }

    $bookingId = (int)$_GET['booking_id'];

    $stmt = $conn->prepare("SELECT id FROM bookings WHERE id = ?");
    $stmt->bind_param('i', $bookingId);
    $stmt->execute();

    if (!$stmt->get_result()->fetch_assoc()) {
        jsonError('Booking not found', 404);
    }

    $stmt = $conn->prepare("DELETE FROM bookings WHERE id = ?");
    $stmt->bind_param('i', $bookingId);
    $stmt->execute();

    jsonSuccess(null, 'Booking deleted successfully');
}

function findOrCreateUser($conn, $firebaseUid, $name, $email, $phone) {
    $stmt = $conn->prepare("SELECT id FROM users WHERE firebase_uid = ?");
    $stmt->bind_param('s', $firebaseUid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        return (int)$row['id'];
    }

    $stmt = $conn->prepare("INSERT INTO users (firebase_uid, email, phone, name) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $firebaseUid, $email, $phone, $name);
    $stmt->execute();

    return (int)$conn->insert_id;
}
