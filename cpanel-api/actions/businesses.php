<?php
declare(strict_types=1);

function ac_map_business(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'lead_id' => (int)$row['lead_id'],
        'business_name' => $row['business_name'],
        'website_url' => $row['website_url'],
        'domain' => $row['domain'],
        'category' => $row['category'],
        'city' => $row['city'],
        'service_area' => $row['service_area'],
        'services' => ac_json_col($row['services_json'] ?? null),
        'created_at' => ac_iso($row['created_at']),
        'updated_at' => ac_iso($row['updated_at']),
    ];
}

function ac_action_business_create(PDO $db, array $body): array
{
    $leadId = ac_require_int($body, 'lead_id');
    $name = ac_require_string($body, 'business_name', 255);
    $websiteUrl = ac_optional_string($body, 'website_url', 500);
    $domain = ac_optional_string($body, 'domain', 255);
    $category = ac_require_string($body, 'category', 255);
    $city = ac_optional_string($body, 'city', 255);
    $serviceArea = ac_optional_string($body, 'service_area', 255);
    $services = ac_require_array($body, 'services');
    $services = array_slice(array_values(array_filter(array_map('strval', $services))), 0, 5);

    // verify the lead exists (also implicitly validates the FK before insert)
    $check = $db->prepare('SELECT id FROM leads WHERE id = :id');
    $check->execute([':id' => $leadId]);
    if (!$check->fetch()) {
        throw new ApiException('Lead not found', 404);
    }

    $stmt = $db->prepare(
        'INSERT INTO businesses (lead_id, business_name, website_url, domain, category, city, service_area, services_json)
         VALUES (:lead_id, :business_name, :website_url, :domain, :category, :city, :service_area, :services_json)'
    );
    $stmt->execute([
        ':lead_id' => $leadId,
        ':business_name' => $name,
        ':website_url' => $websiteUrl,
        ':domain' => $domain,
        ':category' => $category,
        ':city' => $city,
        ':service_area' => $serviceArea,
        ':services_json' => ac_encode_json($services),
    ]);
    $id = (int)$db->lastInsertId();

    return ac_fetch_business($db, $id);
}

function ac_fetch_business(PDO $db, int $id): array
{
    $stmt = $db->prepare('SELECT * FROM businesses WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) throw new ApiException('Business not found', 404);
    return ac_map_business($row);
}

function ac_action_business_get(PDO $db, array $body): array
{
    $id = ac_require_int($body, 'id');
    return ac_fetch_business($db, $id);
}
