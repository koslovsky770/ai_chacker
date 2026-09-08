<?php
declare(strict_types=1);

const AC_QUERY_TYPES = ['direct_service', 'geographic', 'problem_need', 'specialization', 'high_intent', 'comparative'];
const AC_LANGUAGES = ['he', 'en'];

function ac_map_query(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'audit_id' => (int)$row['audit_id'],
        'query_text' => $row['query_text'],
        'query_type' => $row['query_type'],
        'language' => $row['language'],
        'location' => $row['location'],
        'created_at' => ac_iso($row['created_at']),
    ];
}

function ac_action_query_create_many(PDO $db, array $body): array
{
    $auditId = ac_require_int($body, 'audit_id');
    $queries = ac_require_array($body, 'queries');
    if (count($queries) === 0 || count($queries) > 50) {
        throw new ApiException('Invalid queries count');
    }

    $check = $db->prepare('SELECT id FROM audits WHERE id = :id');
    $check->execute([':id' => $auditId]);
    if (!$check->fetch()) throw new ApiException('Audit not found', 404);

    $stmt = $db->prepare(
        'INSERT INTO audit_queries (audit_id, query_text, query_type, language, location)
         VALUES (:audit_id, :query_text, :query_type, :language, :location)'
    );

    $ids = [];
    $db->beginTransaction();
    try {
        foreach ($queries as $q) {
            if (!is_array($q)) throw new ApiException('Invalid query entry');
            $text = ac_require_string($q, 'query_text', 500);
            $type = ac_require_enum($q, 'query_type', AC_QUERY_TYPES);
            $lang = ac_require_enum($q, 'language', AC_LANGUAGES);
            $location = ac_optional_string($q, 'location', 255);

            $stmt->execute([
                ':audit_id' => $auditId,
                ':query_text' => $text,
                ':query_type' => $type,
                ':language' => $lang,
                ':location' => $location,
            ]);
            $ids[] = (int)$db->lastInsertId();
        }
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }

    return ac_fetch_queries_by_ids($db, $ids);
}

function ac_fetch_queries_by_ids(PDO $db, array $ids): array
{
    if (empty($ids)) return [];
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare("SELECT * FROM audit_queries WHERE id IN ($placeholders) ORDER BY id ASC");
    $stmt->execute($ids);
    return array_map('ac_map_query', $stmt->fetchAll());
}

function ac_action_query_list(PDO $db, array $body): array
{
    $auditId = ac_require_int($body, 'audit_id');
    $stmt = $db->prepare('SELECT * FROM audit_queries WHERE audit_id = :audit_id ORDER BY id ASC');
    $stmt->execute([':audit_id' => $auditId]);
    return array_map('ac_map_query', $stmt->fetchAll());
}
