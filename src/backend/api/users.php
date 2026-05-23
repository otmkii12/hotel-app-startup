<?php
/**
 * Users API Endpoint
 * Handles GET and POST requests for user management
 *
 * GET /api/users.php?firebase_uid=UID - Get user profile
 * POST /api/users.php - Create/sync user profile
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
 * Handle GET requests
 */
function handleGet($conn) {
    if (!isset($_GET['firebase_uid'])) {
        http_response_code(400);
        return ['success' => false, 'message' => 'Missing firebase_uid parameter'];
    }

    $firebase_uid = $conn->real_escape_string($_GET['firebase_uid']);
    $query = "SELECT id, firebase_uid, email, phone, name, created_at, updated_at FROM users WHERE firebase_uid = ?";
    $stmt = $conn->prepare($query);

    if (!$stmt) {
        http_response_code(500);
        return ['success' => false, 'message' => 'Database error: ' . $conn->error];
    }

    $stmt->bind_param("s", $firebase_uid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        return ['success' => true, 'data' => $user];
    } else {
        return ['success' => true, 'data' => null, 'message' => 'User not found'];
    }
}

/**
 * Handle POST requests - Create or update user profile
 */
function handlePost($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validate required fields
    if (!isset($data['firebase_uid']) || !isset($data['email'])) {
        http_response_code(400);
        return ['success' => false, 'message' => 'Missing required fields: firebase_uid, email'];
    }

    $firebase_uid = $conn->real_escape_string($data['firebase_uid']);
    $email = $conn->real_escape_string($data['email']);
    $phone = isset($data['phone']) ? $conn->real_escape_string($data['phone']) : null;
    $name = isset($data['name']) ? $conn->real_escape_string($data['name']) : null;

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        return ['success' => false, 'message' => 'Invalid email format'];
    }

    // Check if user exists
    $check_query = "SELECT id FROM users WHERE firebase_uid = ?";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bind_param("s", $firebase_uid);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        // Update existing user
        $update_query = "UPDATE users SET email = ?, phone = ?, name = ? WHERE firebase_uid = ?";
        $update_stmt = $conn->prepare($update_query);

        if (!$update_stmt) {
            http_response_code(500);
            return ['success' => false, 'message' => 'Database error: ' . $conn->error];
        }

        $update_stmt->bind_param("ssss", $email, $phone, $name, $firebase_uid);

        if ($update_stmt->execute()) {
            return ['success' => true, 'message' => 'User profile updated successfully'];
        } else {
            http_response_code(500);
            return ['success' => false, 'message' => 'Failed to update user: ' . $update_stmt->error];
        }
    } else {
        // Create new user
        $insert_query = "INSERT INTO users (firebase_uid, email, phone, name) VALUES (?, ?, ?, ?)";
        $insert_stmt = $conn->prepare($insert_query);

        if (!$insert_stmt) {
            http_response_code(500);
            return ['success' => false, 'message' => 'Database error: ' . $conn->error];
        }

        $insert_stmt->bind_param("ssss", $firebase_uid, $email, $phone, $name);

        if ($insert_stmt->execute()) {
            return ['success' => true, 'message' => 'User created successfully', 'user_id' => $conn->insert_id];
        } else {
            // Check if it's a duplicate email error
            if (strpos($insert_stmt->error, 'Duplicate entry') !== false) {
                http_response_code(409);
                return ['success' => false, 'message' => 'Email already registered'];
            }
            http_response_code(500);
            return ['success' => false, 'message' => 'Failed to create user: ' . $insert_stmt->error];
        }
    }
}

