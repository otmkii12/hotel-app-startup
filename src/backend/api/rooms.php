<?php
/**
 * Rooms API Endpoint
 * Handles GET requests for hotel rooms
 *
 * GET /api/rooms.php - Get all rooms
 * GET /api/rooms.php?id=ID - Get single room
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Database connection
$conn = require '../config/db.php';

try {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $query = "SELECT * FROM rooms WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $room = $result->fetch_assoc();
            echo json_encode(['success' => true, 'data' => $room]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Room not found']);
        }
    } else {
        // Get all rooms
        $query = "SELECT * FROM rooms ORDER BY harga ASC";
        $result = $conn->query($query);

        if (!$result) {
            throw new Exception($conn->error);
        }

        $rooms = [];
        while ($row = $result->fetch_assoc()) {
            $rooms[] = $row;
        }

        echo json_encode(['success' => true, 'data' => $rooms]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();

