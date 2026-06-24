<?php
header('Content-Type: application/json');

$payload = [
    'status' => 'ok',
    'project' => 'Food Hygiene Alert System',
    'features' => [
        'watchlist' => true,
        'email_alerts' => 'ready_for_provider',
        'sms_alerts' => 'twilio_placeholder',
        'exports' => ['csv', 'pdf'],
        'fhrs_api' => 'prepared'
    ],
    'message' => 'Backend endpoint ready for Food Hygiene Alert System integrations.'
];

echo json_encode($payload, JSON_PRETTY_PRINT);
