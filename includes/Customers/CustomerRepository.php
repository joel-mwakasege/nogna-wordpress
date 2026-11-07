<?php
namespace Nogna\Billing\Customers;

defined('ABSPATH') || exit;

final class CustomerRepository
{
    public function create(int $company_id, array $data): int
    {
        global $wpdb;

        $table = $wpdb->prefix . 'nogna_customers';
        $now = current_time('mysql', true);

        $inserted = $wpdb->insert($table, [
            'company_id' => $company_id,
            'customer_number' => $data['customer_number'] ?? null,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'tax_number' => $data['tax_number'] ?? null,
            'address_json' => wp_json_encode($data['address'] ?? []),
            'notes' => $data['notes'] ?? null,
            'created_by' => $data['created_by'],
            'created_at' => $now,
            'updated_at' => $now,
        ], ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s']);

        if (!$inserted) {
            throw new \RuntimeException('customer_insert_failed');
        }

        return (int) $wpdb->insert_id;
    }

    public function find_for_company(int $company_id, array $filters = []): array
    {
        global $wpdb;

        $table = $wpdb->prefix . 'nogna_customers';
        $where = ['company_id = %d', 'deleted_at IS NULL'];
        $values = [$company_id];

        if (!empty($filters['search'])) {
            $where[] = '(name LIKE %s OR email LIKE %s OR customer_number LIKE %s)';
            $term = '%' . $wpdb->esc_like($filters['search']) . '%';
            array_push($values, $term, $term, $term);
        }

        $sql = "SELECT id, company_id, customer_number, name, email, phone,
                       tax_number, address_json, notes, created_at, updated_at
                FROM {$table}
                WHERE " . implode(' AND ', $where) . "
                ORDER BY name ASC";

        $prepared = $wpdb->prepare($sql, ...$values);
        $rows = $wpdb->get_results($prepared, ARRAY_A) ?: [];

        return array_map([$this, 'hydrate'], $rows);
    }

    public function find(int $customer_id, int $company_id): ?array
    {
        global $wpdb;

        $table = $wpdb->prefix . 'nogna_customers';
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT id, company_id, customer_number, name, email, phone,
                    tax_number, address_json, notes, created_at, updated_at
             FROM {$table}
             WHERE id = %d AND company_id = %d AND deleted_at IS NULL
             LIMIT 1",
            $customer_id,
            $company_id
        ), ARRAY_A);

        return $row ? $this->hydrate($row) : null;
    }

    public function update(int $customer_id, int $company_id, array $data): bool
    {
        global $wpdb;

        $updates = [
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'tax_number' => $data['tax_number'] ?? null,
            'address_json' => wp_json_encode($data['address'] ?? []),
            'notes' => $data['notes'] ?? null,
            'updated_at' => current_time('mysql', true),
        ];

        return false !== $wpdb->update(
            $wpdb->prefix . 'nogna_customers',
            $updates,
            ['id' => $customer_id, 'company_id' => $company_id],
            ['%s', '%s', '%s', '%s', '%s', '%s', '%s'],
            ['%d', '%d']
        );
    }

    public function soft_delete(int $customer_id, int $company_id, int $deleted_by): bool
    {
        global $wpdb;

        return false !== $wpdb->update(
            $wpdb->prefix . 'nogna_customers',
            [
                'deleted_at' => current_time('mysql', true),
                'deleted_by' => $deleted_by,
                'updated_at' => current_time('mysql', true),
            ],
            ['id' => $customer_id, 'company_id' => $company_id],
            ['%s', '%d', '%s'],
            ['%d', '%d']
        );
    }

    private function hydrate(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['company_id'] = (int) $row['company_id'];
        $row['address'] = json_decode((string) ($row['address_json'] ?? '{}'), true) ?: [];
        unset($row['address_json']);

        return $row;
    }
}
