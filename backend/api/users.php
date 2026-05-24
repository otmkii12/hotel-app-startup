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
        default:
            jsonError('Method not allowed', 405);
    }
} catch (Exception $e) {
    jsonServerError($e->getMessage());
} finally {
    $conn->close();
}

function handleGet($conn) {
    requireAuth();

    if (!isset($_GET['firebase_uid'])) {
        jsonError('Missing firebase_uid parameter');
    }

    $firebaseUid = $_GET['firebase_uid'];
    $stmt = $conn->prepare("SELECT id, firebase_uid, email, phone, name, created_at, updated_at FROM users WHERE firebase_uid = ?");
    $stmt->bind_param('s', $firebaseUid);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user) {
        jsonSuccess($user);
    }

    jsonSuccess(null, 'User not found');
}

function handlePost($conn) {
    $firebaseUser = requireAuth();
    $data = getJsonInput();

    validateRequired($data, ['email']);

    $firebaseUid = $firebaseUser['localId'] ?? $data['firebase_uid'] ?? '';
    $email = $data['email'];
    $phone = $data['phone'] ?? null;
    $name = $data['name'] ?? null;

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email format');
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE firebase_uid = ?");
    $stmt->bind_param('s', $firebaseUid);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();

    if ($existing) {
        $stmt = $conn->prepare("UPDATE users SET email = ?, phone = ?, name = ? WHERE firebase_uid = ?");
        $stmt->bind_param('ssss', $email, $phone, $name, $firebaseUid);
        $stmt->execute();
        jsonSuccess(null, 'User profile updated');
    }

    $stmt = $conn->prepare("INSERT INTO users (firebase_uid, email, phone, name) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $firebaseUid, $email, $phone, $name);
    $stmt->execute();
    jsonSuccess(['user_id' => $conn->insert_id], 'User created successfully');
}
