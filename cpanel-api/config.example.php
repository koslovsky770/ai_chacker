<?php
/**
 * Copy this file to config.php (same folder) and fill in real values.
 * config.php must NEVER be committed to git and should not be publicly
 * readable - the provided .htaccess already blocks direct HTTP access to
 * any *.php file that isn't api.php, but keep it out of version control too.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'cpaneluser_aichecker',
        'user' => 'cpaneluser_dbuser',
        'pass' => 'CHANGE_ME',
        'charset' => 'utf8mb4',
    ],

    // Shared secret Vercel sends as the X-Api-Secret header on every
    // request. Must match DATABASE_API_SECRET in the Next.js app's
    // environment variables. Generate with e.g. `openssl rand -hex 32`.
    'api_secret' => 'CHANGE_ME_LONG_RANDOM_STRING',

    // Only this origin is allowed to call the API from a browser context.
    // Set to your production Vercel URL (and add more via an array if you
    // also need a preview/staging domain).
    'allowed_origins' => [
        'https://your-app.vercel.app',
        'http://localhost:3000',
    ],

    // Basic per-IP rate limiting (file-based, no extra DB table needed).
    'rate_limit' => [
        'max_requests' => 60,
        'window_seconds' => 60,
    ],
];
