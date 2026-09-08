<?php
declare(strict_types=1);

function ac_action_admin_stats(PDO $db, array $body): array
{
    $totalLeads = (int)$db->query('SELECT COUNT(*) AS c FROM leads')->fetch()['c'];
    $totalAudits = (int)$db->query('SELECT COUNT(*) AS c FROM audits')->fetch()['c'];
    $completedAudits = (int)$db->query("SELECT COUNT(*) AS c FROM audits WHERE status = 'completed'")->fetch()['c'];
    $totalChecks = (int)$db->query('SELECT COUNT(*) AS c FROM ai_results WHERE checked_at IS NOT NULL')->fetch()['c'];

    return [
        'total_leads' => $totalLeads,
        'total_audits' => $totalAudits,
        'completed_audits' => $completedAudits,
        'total_checks' => $totalChecks,
    ];
}

function ac_action_admin_leads(PDO $db, array $body): array
{
    $limit = ac_optional_int($body, 'limit') ?? 50;
    $limit = max(1, min($limit, 500));
    $offset = ac_optional_int($body, 'offset') ?? 0;
    $offset = max(0, $offset);

    $where = [];
    $params = [];
    if (!empty($body['from']) && is_string($body['from'])) {
        $where[] = 'l.created_at >= :from';
        $params[':from'] = $body['from'] . ' 00:00:00';
    }
    if (!empty($body['to']) && is_string($body['to'])) {
        $where[] = 'l.created_at <= :to';
        $params[':to'] = $body['to'] . ' 23:59:59';
    }
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $countStmt = $db->prepare("SELECT COUNT(*) AS c FROM leads l $whereSql");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['c'];

    $sql = "SELECT l.*,
                   b.id AS b_id, b.business_name AS b_business_name, b.website_url AS b_website_url,
                   b.domain AS b_domain, b.category AS b_category, b.city AS b_city,
                   b.service_area AS b_service_area, b.services_json AS b_services_json,
                   b.created_at AS b_created_at, b.updated_at AS b_updated_at,
                   a.id AS a_id, a.status AS a_status, a.query_count AS a_query_count,
                   a.providers_count AS a_providers_count, a.total_checks AS a_total_checks,
                   a.recommended_count AS a_recommended_count,
                   a.overall_visibility_score AS a_overall_visibility_score,
                   a.started_at AS a_started_at, a.completed_at AS a_completed_at, a.created_at AS a_created_at
            FROM leads l
            LEFT JOIN businesses b ON b.lead_id = l.id
            LEFT JOIN audits a ON a.business_id = b.id AND a.id = (
                SELECT MAX(a2.id) FROM audits a2 WHERE a2.business_id = b.id
            )
            $whereSql
            ORDER BY l.created_at DESC
            LIMIT $limit OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $items = array_map(function ($row) {
        $lead = ac_map_lead($row);
        $business = null;
        if ($row['b_id'] !== null) {
            $business = ac_map_business([
                'id' => $row['b_id'],
                'lead_id' => $row['id'],
                'business_name' => $row['b_business_name'],
                'website_url' => $row['b_website_url'],
                'domain' => $row['b_domain'],
                'category' => $row['b_category'],
                'city' => $row['b_city'],
                'service_area' => $row['b_service_area'],
                'services_json' => $row['b_services_json'],
                'created_at' => $row['b_created_at'],
                'updated_at' => $row['b_updated_at'],
            ]);
        }
        $audit = null;
        if ($row['a_id'] !== null) {
            $audit = ac_map_audit([
                'id' => $row['a_id'],
                'business_id' => $row['b_id'],
                'status' => $row['a_status'],
                'query_count' => $row['a_query_count'],
                'providers_count' => $row['a_providers_count'],
                'total_checks' => $row['a_total_checks'],
                'recommended_count' => $row['a_recommended_count'],
                'overall_visibility_score' => $row['a_overall_visibility_score'],
                'started_at' => $row['a_started_at'],
                'completed_at' => $row['a_completed_at'],
                'created_at' => $row['a_created_at'],
            ]);
        }
        return ['lead' => $lead, 'business' => $business, 'audit' => $audit];
    }, $rows);

    return ['items' => $items, 'total' => $total];
}
