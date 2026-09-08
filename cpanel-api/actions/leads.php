<?php
declare(strict_types=1);

function ac_map_lead(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'full_name' => $row['full_name'],
        'email' => $row['email'],
        'marketing_consent' => (bool)$row['marketing_consent'],
        'created_at' => ac_iso($row['created_at']),
    ];
}

function ac_action_lead_create(PDO $db, array $body): array
{
    $fullName = ac_require_string($body, 'full_name', 255);
    $email = ac_require_email($body, 'email');
    $consent = ac_require_bool($body, 'marketing_consent');

    $stmt = $db->prepare(
        'INSERT INTO leads (full_name, email, marketing_consent) VALUES (:full_name, :email, :consent)'
    );
    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':consent' => $consent ? 1 : 0,
    ]);
    $id = (int)$db->lastInsertId();

    $stmt = $db->prepare('SELECT * FROM leads WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return ac_map_lead($row);
}
