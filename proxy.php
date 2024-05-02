<?php
// Set the URL of the target API endpoint
$targetUrl = 'https://omegav.no/api/dooropen.php';

// Forward the incoming request to the target URL
$response = file_get_contents($targetUrl);

// Forward the response back to the client
echo $response;
?>
