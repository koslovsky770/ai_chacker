<?php
declare(strict_types=1);

function ac_map_audit(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'business_id' => (int)$row['business_id'],
        'status' => $row['status'],
        'query_count' => (int)$row['query_count'],
        'providers_count' => (int)$row['providers_count'],
        'total_checks' => (int)$row['total_checks'],
        'recommended_count' => (int)$row['recommended_count'],
        'overall_visibility_score' => $row['overall_visibility_score'] !== null ? (float)$row['overall_visibility_score'] : null,
        'started_at' => ac_iso($row['started_at']),
        'completed_at' => ac_iso($row['completed_at']),
        'created_at' => ac_iso($row['created_at']),
    ];
}

const AC_AUDIT_STATUSES = ['pending', 'processing', 'completed', 'failed'];

function ac_action_audit_create(PDO $db, array $body): array
{
    $businessId = ac_require_int($body, 'business_id');
    $queryCount = ac_require_int($body, 'query_count');
    $providersCount = ac_require_int($body, 'providers_count');
    $totalChecks = ac_require_int($body, 'total_checks');
    $status = ac_require_enum($body, 'status', AC_AUDIT_STATUSES);

    $check = $db->prepare('SELECT id FROM businesses WHERE id = :id');
    $check->execute([':id' => $businessId]);
    if (!$check->fetch()) {
        throw new ApiException('Business not found', 404);
    }

    $stmt = $db->prepare(
        'INSERT INTO audits (business_id, status, query_count, providers_count, total_checks, started_at)
         VALUES (:business_id, :status, :query_count, :providers_count, :total_checks, :started_at)'
    );
    $stmt->execute([
        ':business_id' => $businessId,
        ':status' => $status,
        ':query_count' => $queryCount,
        ':providers_count' => $providersCount,
        ':total_checks' => $totalChecks,
        ':started_at' => ac_now(),
    ]);
    $id = (int)$db->lastInsertId();

    return ac_fetch_audit($db, $id);
}

function ac_fetch_audit(PDO $db, int $id): array
{
    $stmt = $db->prepare('SELECT * FROM audits WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) throw new ApiException('Audit not found', 404);
    return ac_map_audit($row);
}

function ac_action_audit_get(PDO $db, array $body): array
{
    $id = ac_require_int($body, 'id');
    return ac_fetch_audit($db, $id);
}

function ac_action_audit_update(PDO $db, array $body): array
{
    $id = ac_require_int($body, 'id');
    $fields = [];
    $params = [':id' => $id];

    if (isset($body['status'])) {
        $fields[] = 'status = :status';
        $params[':status'] = ac_require_enum($body, 'status', AC_AUDIT_STATUSES);
    }
    if (array_key_exists('recommended_count', $body)) {
        $fields[] = 'recommended_count = :recommended_count';
        $params[':recommended_count'] = ac_require_int($body, 'recommended_count');
    }
    if (array_key_exists('overall_visibility_score', $body)) {
        if (!is_numeric($body['overall_visibility_score'])) throw new ApiException('Invalid overall_visibility_score');
        $fields[] = 'overall_visibility_score = :score';
        $params[':score'] = (float)$body['overall_visibility_score'];
    }
    if (array_key_exists('completed_at', $body) && $body['completed_at']) {
        $fields[] = 'completed_at = :completed_at';
        $params[':completed_at'] = ac_now();
    }

    if (empty($fields)) {
        return ac_fetch_audit($db, $id);
    }

    $sql = 'UPDATE audits SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return ac_fetch_audit($db, $id);
}
