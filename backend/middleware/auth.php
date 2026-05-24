<?php

require_once __DIR__ . '/../config/firebase.php';

function getFirebaseUser() {
    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (strpos($key, 'HTTP_') === 0) {
            $headerName = str_replace('_', '-', substr($key, 5));
            $headers[$headerName] = $value;
        }
    }

    $authHeader = $headers['AUTHORIZATION'] ?? $headers['Authorization'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/', $authHeader, $matches)) {
        return null;
    }

    return verifyFirebaseToken($matches[1]);
}

function requireAuth() {
    $user = getFirebaseUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }
    return $user;
}

function requireAdmin() {
    $user = requireAuth();
    $adminEmails = explode(',', getenv('ADMIN_EMAILS') ?: 'rifkiagung874@gmail.com');
    $adminEmails = array_map('trim', $adminEmails);

    $userEmail = $user['email'] ?? '';
    $emailVerified = $user['emailVerified'] ?? $user['email_verified'] ?? false;

    if (!$emailVerified || !in_array($userEmail, $adminEmails)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
    return $user;
}
