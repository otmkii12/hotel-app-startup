<?php

function verifyFirebaseToken($idToken) {
    $apiKey = getenv('FIREBASE_API_KEY') ?: 'AIzaSyD0GQxJ1DypcOfKs0Hvn4AQ0jFcMi8qq_U';

    $url = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=$apiKey";

    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode(['idToken' => $idToken]),
            'ignore_errors' => true,
        ],
    ];

    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        return null;
    }

    $httpCode = 0;
    if (isset($http_response_header)) {
        preg_match('#HTTP/\d+\.\d+ (\d+)#', $http_response_header[0], $matches);
        $httpCode = (int)($matches[1] ?? 0);
    }

    if ($httpCode !== 200) {
        return null;
    }

    $data = json_decode($response, true);
    return $data['users'][0] ?? null;
}
