<?php
namespace Nogna\Billing\Companies;

defined('ABSPATH') || exit;

final class CompanyRepository
{
    public function create(array $data): int
    {
        global $wpdb;

        $table = $wpdb->prefix . 'nogna_companies';
        $now = current_time('mysql', true);

        $inserted = $wpdb->insert($table, [
            'slug' => $data['slug'],
            'name' => $data['name'],
            'base_currency' => $data['base_currency'],
            'timezone' => $data['timezone'],
            'settings_json' => wp_json_encode([]),
            'created_by' => $data['created_by'],
            'created_at' => $now,
            'updated_at' => $now,
        ], ['%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s']);

        if (!$inserted) {
            if (str_contains((string) $wpdb->last_error, 'Duplicate')) {
                throw new \RuntimeException('duplicate_company_slug');
            }

            throw new \RuntimeException('company_insert_failed');
        }

        return (int) $wpdb->insert_id;
    }

    public function add_member(int $company_id, int $user_id, string $role): void
    {
        global $wpdb;

        $table = $wpdb->prefix . 'nogna_company_users';
        $now = current_time('mysql', true);

        $wpdb->insert($table, [
            'company_id' => $company_id,
            'user_id' => $user_id,
            'role' => $role,
            'status' => 'active',
            'joined_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ], ['%d', '%d', '%s', '%s', '%s', '%s', '%s']);
    }

    public function find_for_user(int $user_id): array
    {
        global $wpdb;

        $companies = $wpdb->prefix . 'nogna_companies';
        $members = $wpdb->prefix . 'nogna_company_users';

        $sql = $wpdb->prepare(
            "SELECT c.id, c.slug, c.name, c.base_currency, c.timezone, m.role
             FROM {$companies} c
             INNER JOIN {$members} m ON m.company_id = c.id
             WHERE m.user_id = %d
               AND m.status = 'active'
               AND c.deleted_at IS NULL
             ORDER BY c.name ASC",
            $user_id
        );

        return array_map(static function (array $row): array {
            $row['id'] = (int) $row['id'];
            return $row;
        }, $wpdb->get_results($sql, ARRAY_A) ?: []);
    }

    public function update(int $company_id, array $data): bool
    {
        global $wpdb;
        return false !== $wpdb->update(
            $wpdb->prefix . 'nogna_companies',
            ['name'=>$data['name'], 'slug'=>$data['slug'], 'base_currency'=>$data['base_currency'], 'timezone'=>$data['timezone'], 'updated_at'=>current_time('mysql', true)],
            ['id'=>$company_id],
            ['%s','%s','%s','%s','%s'],
            ['%d']
        );
    }

    public function user_has_access(int $company_id, int $user_id): bool
    {
        global $wpdb;

        $table = $wpdb->prefix . 'nogna_company_users';

        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$table}
             WHERE company_id = %d AND user_id = %d AND status = 'active'
             LIMIT 1",
            $company_id,
            $user_id
        ));
    }
}
