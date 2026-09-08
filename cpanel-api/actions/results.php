<?php
declare(strict_types=1);

const AC_PROVIDERS = ['openai', 'gemini', 'anthropic'];

function ac_map_result(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'audit_id' => (int)$row['audit_id'],
        'query_id' => (int)$row['query_id'],
        'provider' => $row['provider'],
        'model' => $row['model'],
        'mentioned' => $row['mentioned'] !== null ? (bool)(int)$row['mentioned'] : null,
        'recommended' => $row['recommended'] !== null ? (bool)(int)$row['recommended'] : null,
        'position' => $row['position'] !== null ? (int)$row['position'] : null,
        'business_name_detected' => $row['business_name_detected'],
        'raw_response' => $row['raw_response'],
        'sources' => ac_json_col($row['sources_json'] ?? null),
        'competitors' => ac_json_col($row['competitors_json'] ?? null),
        'error_message' => $row['error_message'],
        'checked_at' => ac_iso($row['checked_at']),
    ];
}

function ac_action_result_create_many(PDO $db, array $body): array
{
    $auditId = ac_require_int($body, 'audit_id');
    $rows = ac_require_array($body, 'rows');
    if (count($rows) === 0 || count($rows) > 200) {
        throw new ApiException('Invalid rows count');
    }

    $check = $db->prepare('SELECT id FROM audits WHERE id = :id');
    $check->execute([':id' => $auditId]);
    if (!$check->fetch()) throw new ApiException('Audit not found', 404);

    $stmt = $db->prepare(
        'INSERT INTO ai_results (audit_id, query_id, provider, model) VALUES (:audit_id, :query_id, :provider, :model)'
    );

    $ids = [];
    $db->beginTransaction();
    try {
        foreach ($rows as $r) {
            if (!is_array($r)) throw new ApiException('Invalid result entry');
            $queryId = ac_require_int($r, 'query_id');
            $provider = ac_require_enum($r, 'provider', AC_PROVIDERS);
            $model = ac_require_string($r, 'model', 100);

            $stmt->execute([
                ':audit_id' => $auditId,
                ':query_id' => $queryId,
                ':provider' => $provider,
                ':model' => $model,
            ]);
            $ids[] = (int)$db->lastInsertId();
        }
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }

    return ac_fetch_results_by_ids($db, $ids);
}

function ac_fetch_results_by_ids(PDO $db, array $ids): array
{
    if (empty($ids)) return [];
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare("SELECT * FROM ai_results WHERE id IN ($placeholders) ORDER BY id ASC");
    $stmt->execute($ids);
    return array_map('ac_map_result', $stmt->fetchAll());
}

function ac_validate_json_string(?string $value, string $field): ?string
{
    if ($value === null) return null;
    json_decode($value);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new ApiException("Invalid JSON for $field");
    }
    return $value;
}

function ac_action_result_update(PDO $db, array $body): array
{
    $id = ac_require_int($body, 'id');
    $fields = [];
    $params = [':id' => $id];

    if (array_key_exists('mentioned', $body)) {
        $fields[] = 'mentioned = :mentioned';
        $params[':mentioned'] = ac_require_bool($body, 'mentioned') ? 1 : 0;
    }
    if (array_key_exists('recommended', $body)) {
        $fields[] = 'recommended = :recommended';
        $params[':recommended'] = ac_require_bool($body, 'recommended') ? 1 : 0;
    }
    if (array_key_exists('position', $body)) {
        $fields[] = 'position = :position';
        $params[':position'] = ac_optional_int($body, 'position');
    }
    if (array_key_exists('business_name_detected', $body)) {
        $fields[] = 'business_name_detected = :bnd';
        $params[':bnd'] = ac_optional_string($body, 'business_name_detected', 255);
    }
    if (array_key_exists('raw_response', $body)) {
        $fields[] = 'raw_response = :raw_response';
        $params[':raw_response'] = ac_optional_string($body, 'raw_response', 100000);
    }
    if (array_key_exists('sources_json', $body)) {
        $fields[] = 'sources_json = :sources_json';
        $params[':sources_json'] = ac_validate_json_string(ac_optional_string($body, 'sources_json', 50000), 'sources_json');
    }
    if (array_key_exists('competitors_json', $body)) {
        $fields[] = 'competitors_json = :competitors_json';
        $params[':competitors_json'] = ac_validate_json_string(ac_optional_string($body, 'competitors_json', 50000), 'competitors_json');
    }
    if (array_key_exists('error_message', $body)) {
        $fields[] = 'error_message = :error_message';
        $params[':error_message'] = ac_optional_string($body, 'error_message', 500);
    }
    if (array_key_exists('checked_at', $body) && $body['checked_at']) {
        $fields[] = 'checked_at = :checked_at';
        $params[':checked_at'] = ac_now();
    }

    if (!empty($fields)) {
        $sql = 'UPDATE ai_results SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    $stmt = $db->prepare('SELECT * FROM ai_results WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) throw new ApiException('Result not found', 404);
    return ac_map_result($row);
}

function ac_action_result_list(PDO $db, array $body): array
{
    $auditId = ac_require_int($body, 'audit_id');
    $stmt = $db->prepare('SELECT * FROM ai_results WHERE audit_id = :audit_id ORDER BY id ASC');
    $stmt->execute([':audit_id' => $auditId]);
    return array_map('ac_map_result', $stmt->fetchAll());
}

function ac_action_result_list_pending(PDO $db, array $body): array
{
    $auditId = ac_require_int($body, 'audit_id');
    $limit = ac_optional_int($body, 'limit') ?? 5;
    $limit = max(1, min($limit, 20));

    $sql = 'SELECT r.*, q.query_text AS query_text, q.language AS language, q.location AS location
            FROM ai_results r
            JOIN audit_queries q ON q.id = r.query_id
            WHERE r.audit_id = :audit_id AND r.checked_at IS NULL AND r.error_message IS NULL
            ORDER BY r.id ASC
            LIMIT ' . (int)$limit;
    $stmt = $db->prepare($sql);
    $stmt->execute([':audit_id' => $auditId]);
    $rows = $stmt->fetchAll();

    return array_map(function ($row) {
        $mapped = ac_map_result($row);
        $mapped['query_text'] = $row['query_text'];
        $mapped['language'] = $row['language'];
        $mapped['location'] = $row['location'];
        return $mapped;
    }, $rows);
}
