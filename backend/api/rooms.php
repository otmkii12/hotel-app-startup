<?php

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/response.php';

$conn = require __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

try {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $room = $stmt->get_result()->fetch_assoc();

        if (!$room) {
            jsonError('Room not found', 404);
        }
        jsonSuccess($room);
    }

    $result = $conn->query("SELECT * FROM rooms ORDER BY harga ASC");
    $rooms = $result->fetch_all(MYSQLI_ASSOC);
    jsonSuccess($rooms);
} catch (Exception $e) {
    jsonServerError($e->getMessage());
} finally {
    $conn->close();
}
