<?php
/**
 * Single entry point for the AI Visibility Checker database API.
 *
 * Deploy this whole `cpanel-api` folder to your cPanel hosting and point
 * DATABASE_API_URL (in the Vercel app's env vars) at this file's public URL,
 * e.g. https://yourdomain.com/ai-checker-api/api.php
 *
 * Every request: POST, JSON body, ?action=<name>, header X-Api-Secret.
 * See README.md in this folder for the full deployment walkthrough.
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0'); // never leak internals to the client

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/ratelimit.php';
require_once __DIR__ . '/validate.php';
require_once __DIR__ . '/util.php';
require_once __DIR__ . '/actions/leads.php';
require_once __DIR__ . '/actions/businesses.php';
require_once __DIR__ . '/actions/audits.php';
require_once __DIR__ . '/actions/queries.php';
require_once __DIR__ . '/actions/results.php';
require_once __DIR__ . '/actions/admin.php';

set_exception_handler(function (Throwable $e) {
    if ($e instanceof ApiException) {
        ac_json_error($e->getMessage(), $e->status);
    }
    error_log('[ai-checker-api] Unhandled exception: ' . $e->getMessage());
    ac_json_error('Internal server error', 500);
});

ac_apply_cors();
ac_enforce_rate_limit();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    ac_json_error('Method not allowed', 405);
}

$secret = $_SERVER['HTTP_X_API_SECRET'] ?? '';
$expected = ac_config()['api_secret'] ?? '';
if ($secret === '' || $expected === '' || !hash_equals($expected, $secret)) {
    ac_json_error('Unauthorized', 401);
}

$action = isset($_GET['action']) ? (string)$_GET['action'] : '';

$raw = file_get_contents('php://input');
$body = [];
if ($raw !== false && $raw !== '') {
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        ac_json_error('Invalid JSON body', 400);
    }
    $body = $decoded;
}

$db = ac_db();

$actions = [
    'lead.create' => 'ac_action_lead_create',
    'business.create' => 'ac_action_business_create',
    'business.get' => 'ac_action_business_get',
    'audit.create' => 'ac_action_audit_create',
    'audit.get' => 'ac_action_audit_get',
    'audit.update' => 'ac_action_audit_update',
    'query.createMany' => 'ac_action_query_create_many',
    'query.list' => 'ac_action_query_list',
    'result.createMany' => 'ac_action_result_create_many',
    'result.update' => 'ac_action_result_update',
    'result.list' => 'ac_action_result_list',
    'result.listPending' => 'ac_action_result_list_pending',
    'admin.stats' => 'ac_action_admin_stats',
    'admin.leads' => 'ac_action_admin_leads',
];

if (!isset($actions[$action])) {
    ac_json_error('Unknown action', 404);
}

$result = $actions[$action]($db, $body);
ac_json_ok($result);
