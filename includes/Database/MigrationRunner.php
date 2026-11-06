<?php
namespace Nogna\Billing\Database;

defined('ABSPATH') || exit;

final class MigrationRunner
{
    private const VERSION_OPTION = 'nogna_billing_schema_version';

    public function run(): void
    {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset = $wpdb->get_charset_collate();
        $table = $wpdb->prefix . 'nogna_migrations';

        $sql = "CREATE TABLE {$table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            component_slug varchar(100) NOT NULL,
            migration_version varchar(50) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'applied',
            error_message text NULL,
            applied_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY component_version (component_slug, migration_version)
        ) {$charset};";

        dbDelta($sql);

        $version = get_option(self::VERSION_OPTION, '0.0.0');
        if (version_compare($version, NOGNA_BILLING_VERSION, '>=')) {
            return;
        }

        update_option(self::VERSION_OPTION, NOGNA_BILLING_VERSION, false);
    }
}
