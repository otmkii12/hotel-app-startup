<?php
/**
 * Bookings API Endpoint
 * Handles GET, POST, PUT requests for hotel bookings
 *
 * GET /api/bookings.php?booking_id=ID - Get single booking
 * GET /api/bookings.php?user_id=ID - Get user's bookings
 * POST /api/bookings.php - Create new booking
 * PUT /api/bookings.php - Update booking status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
$conn = require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$response = ['success' => false, 'message' => ''];

try {
    switch ($method) {
        case 'GET':
            $response = handleGet($conn);
            break;
        case 'POST':
            $response = handlePost($conn);
            break;
        case 'PUT':
            $response = handlePut($conn);
            break;
        default:
            http_response_code(405);
            $response = ['success' => false, 'message' => 'Method not allowed'];
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
}

echo json_encode($response);
$conn->close();

/**
 * Find or create a user record by firebase_uid to satisfy foreign key constraint
 */
function findOrCreateUser($conn, $firebase_uid, $user_name, $user_email, $user_phone) {
    $stmt = $conn->prepare("SELECT id FROM users WHERE firebase_uid = ?");
    $stmt->bind_param("s", $firebase_uid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        return (int) $row['id'];
    }

    $stmt = $conn->prepare("INSERT INTO users (firebase_uid, email, phone, name) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $firebase_uid, $user_email, $user_phone, $user_name);

    if ($stmt->execute()) {
        return (int) $conn->insert_id;
    }

    return null;
}

/**
 * Handle GET requests
 */
function handleGet($conn) {
    if (isset($_GET['booking_id'])) {
        $booking_id = intval($_GET['booking_id']);
        $query = "SELECT * FROM bookings WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $booking = $result->fetch_assoc();
            return ['success' => true, 'data' => $booking];
        } else {
            http_response_code(404);
            return ['success' => false, 'message' => 'Booking not found'];
        }
    } elseif (isset($_GET['firebase_uid'])) {
        $firebase_uid = $conn->real_escape_string($_GET['firebase_uid']);
        $query = "SELECT * FROM bookings WHERE firebase_uid = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $firebase_uid);
        $stmt->execute();
        $result = $stmt->get_result();

        $bookings = [];
        while ($row = $result->fetch_assoc()) {
            $bookings[] = $row;
        }

        return ['success' => true, 'data' => $bookings];
    } else {
        http_response_code(400);
        return ['success' => false, 'message' => 'Missing required parameters'];
    }
}

/**
 * Handle POST requests - Create new booking
 */
function handlePost($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validate required fields
    $required = ['firebase_uid', 'user_name', 'user_email', 'user_phone', 'booking_code',
                 'room', 'room_price', 'checkin', 'checkout', 'nights', 'guests', 'rooms',
                 'payment_method', 'total'];

    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            return ['success' => false, 'message' => "Missing required field: $field"];
        }
    }

    // Validate data
    if (!filter_var($data['user_email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        return ['success' => false, 'message' => 'Invalid email format'];
    }

    // Valid rooms and prices
    $valid_rooms = [
        'Deluxe Room' => 800000,
        'Suite Room' => 1500000,
        'Family Room' => 1200000
    ];

    if (!isset($valid_rooms[$data['room']]) || $valid_rooms[$data['room']] != $data['room_price']) {
        http_response_code(400);
        return ['success' => false, 'message' => 'Invalid room or room price'];
    }

    // Validate dates
    if ($data['checkout'] <= $data['checkin']) {
        http_response_code(400);
        return ['success' => false, 'message' => 'Checkout date must be after checkin date'];
    }

    // Resolve or create user_id from firebase_uid
    $user_id = findOrCreateUser($conn, $data['firebase_uid'], $data['user_name'], $data['user_email'], $data['user_phone']);

    if (!$user_id) {
        http_response_code(500);
        return ['success' => false, 'message' => 'Failed to resolve user account'];
    }

    // Insert booking
    $query = "INSERT INTO bookings (firebase_uid, user_id, user_name, user_email, user_phone, booking_code, 
                                   room, room_price, checkin, checkout, nights, guests, rooms, 
                                   payment_method, status, total) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Pembayaran', ?)";

    $stmt = $conn->prepare($query);

    if (!$stmt) {
        http_response_code(500);
        return ['success' => false, 'message' => 'Database error: ' . $conn->error];
    }

    $stmt->bind_param("sisssssissiiisi",
        $data['firebase_uid'],
        $user_id,
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

    if ($stmt->execute()) {
        return ['success' => true, 'message' => 'Booking created successfully', 'booking_id' => $conn->insert_id];
    } else {
        http_response_code(500);
        return ['success' => false, 'message' => 'Failed to create booking: ' . $stmt->error];
    }
}

/**
 * Handle PUT requests - Update booking
 */
function handlePut($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['booking_id'])) {
        http_response_code(400);
        return ['success' => false, 'message' => 'Missing booking_id'];
    }

    $booking_id = intval($data['booking_id']);

    // Check if booking exists
    $check_query = "SELECT id FROM bookings WHERE id = ?";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bind_param("i", $booking_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows === 0) {
        http_response_code(404);
        return ['success' => false, 'message' => 'Booking not found'];
    }

    // Build update query dynamically
    $updates = [];
    $types = '';
    $values = [];

    $allowed_fields = ['user_name', 'user_email', 'user_phone', 'payment_method', 'status'];

    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $types .= 's';
            $values[] = $data[$field];
        }
    }

    if (empty($updates)) {
        http_response_code(400);
        return ['success' => false, 'message' => 'No valid fields to update'];
    }

    $query = "UPDATE bookings SET " . implode(", ", $updates) . " WHERE id = ?";
    $types .= 'i';
    $values[] = $booking_id;

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        http_response_code(500);
        return ['success' => false, 'message' => 'Database error: ' . $conn->error];
    }

    $stmt->bind_param($types, ...$values);

    if ($stmt->execute()) {
        return ['success' => true, 'message' => 'Booking updated successfully'];
    } else {
        http_response_code(500);
        return ['success' => false, 'message' => 'Failed to update booking: ' . $stmt->error];
    }
}

