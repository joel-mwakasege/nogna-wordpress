<?php
namespace Nogna\Billing\Database;

defined('ABSPATH') || exit;

final class MigrationRunner
{
    private const VERSION_OPTION = 'nogna_billing_schema_version';
    private const SCHEMA_VERSION = '0.5.0';

    public function run(): void
    {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset = $wpdb->get_charset_collate();
        $migrations = $wpdb->prefix . 'nogna_migrations';

        dbDelta("CREATE TABLE {$migrations} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            component_slug varchar(100) NOT NULL,
            migration_version varchar(50) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'applied',
            error_message text NULL,
            applied_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY component_version (component_slug, migration_version)
        ) {$charset};");

        $this->create_core_tables($charset);

        $version = get_option(self::VERSION_OPTION, '0.0.0');
        if (version_compare($version, self::SCHEMA_VERSION, '<')) {
            update_option(self::VERSION_OPTION, self::SCHEMA_VERSION, false);
        }
    }

    private function create_core_tables(string $charset): void
    {
        global $wpdb;

        $companies = $wpdb->prefix . 'nogna_companies';
        $members = $wpdb->prefix . 'nogna_company_users';
        $customers = $wpdb->prefix . 'nogna_customers';
        $extensions = $wpdb->prefix . 'nogna_extensions';
        $company_extensions = $wpdb->prefix . 'nogna_company_extensions';

        dbDelta("CREATE TABLE {$companies} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            slug varchar(190) NOT NULL,
            name varchar(190) NOT NULL,
            base_currency char(3) NOT NULL DEFAULT 'USD',
            timezone varchar(100) NOT NULL DEFAULT 'UTC',
            settings_json longtext NULL,
            created_by bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            deleted_at datetime NULL,
            deleted_by bigint(20) unsigned NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY slug (slug),
            KEY created_by (created_by),
            KEY deleted_at (deleted_at)
        ) {$charset};");

        dbDelta("CREATE TABLE {$members} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            company_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            role varchar(40) NOT NULL DEFAULT 'user',
            status varchar(30) NOT NULL DEFAULT 'active',
            joined_at datetime NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY company_user (company_id, user_id),
            KEY company_role (company_id, role),
            KEY user_status (user_id, status)
        ) {$charset};");

        dbDelta("CREATE TABLE {$customers} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            company_id bigint(20) unsigned NOT NULL,
            customer_number varchar(80) NULL,
            name varchar(190) NOT NULL,
            email varchar(190) NULL,
            phone varchar(80) NULL,
            tax_number varchar(120) NULL,
            address_json longtext NULL,
            notes text NULL,
            created_by bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            deleted_at datetime NULL,
            deleted_by bigint(20) unsigned NULL,
            PRIMARY KEY  (id),
            KEY company_name (company_id, name),
            KEY company_email (company_id, email),
            KEY company_deleted (company_id, deleted_at)
        ) {$charset};");

        $invoices = $wpdb->prefix . 'nogna_invoices';
        $invoice_items = $wpdb->prefix . 'nogna_invoice_items';
        $invoice_sections = $wpdb->prefix . 'nogna_invoice_sections';

        dbDelta("CREATE TABLE {$invoices} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            company_id bigint(20) unsigned NOT NULL,
            customer_id bigint(20) unsigned NOT NULL,
            invoice_number varchar(80) NOT NULL,
            status varchar(30) NOT NULL DEFAULT 'draft',
            issue_date date NOT NULL,
            due_date date NULL,
            currency char(3) NOT NULL,
            subtotal decimal(20,6) NOT NULL DEFAULT 0,
            discount_total decimal(20,6) NOT NULL DEFAULT 0,
            tax_total decimal(20,6) NOT NULL DEFAULT 0,
            total decimal(20,6) NOT NULL DEFAULT 0,
            amount_paid decimal(20,6) NOT NULL DEFAULT 0,
            notes text NULL,
            created_by bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            deleted_at datetime NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY company_invoice_number (company_id, invoice_number),
            KEY company_status (company_id, status),
            KEY customer_id (customer_id),
            KEY issue_date (issue_date)
        ) {$charset};");

        dbDelta("CREATE TABLE {$invoice_items} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            invoice_id bigint(20) unsigned NOT NULL,
            description varchar(255) NOT NULL,
            quantity decimal(20,6) NOT NULL DEFAULT 1,\n            units decimal(20,6) NOT NULL DEFAULT 1,\n            days decimal(20,6) NOT NULL DEFAULT 1,
            unit_price decimal(20,6) NOT NULL DEFAULT 0,
            discount_amount decimal(20,6) NOT NULL DEFAULT 0,
            tax_rate decimal(10,6) NOT NULL DEFAULT 0,
            tax_amount decimal(20,6) NOT NULL DEFAULT 0,\n            group_id varchar(80) NULL,\n            is_group_parent tinyint(1) NOT NULL DEFAULT 0,\n            remarks text NULL,
            line_total decimal(20,6) NOT NULL DEFAULT 0,
            sort_order int(11) NOT NULL DEFAULT 0,
            PRIMARY KEY  (id),
            KEY invoice_sort (invoice_id, sort_order)
        ) {$charset};");

        dbDelta("CREATE TABLE {$extensions} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            slug varchar(100) NOT NULL,
            version varchar(30) NOT NULL,
            status varchar(30) NOT NULL DEFAULT 'installed',
            installed_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY slug (slug)
        ) {$charset};");

        dbDelta("CREATE TABLE {$company_extensions} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            company_id bigint(20) unsigned NOT NULL,
            extension_slug varchar(100) NOT NULL,
            status varchar(30) NOT NULL DEFAULT 'disabled',
            settings_json longtext NULL,
            enabled_by bigint(20) unsigned NULL,
            enabled_at datetime NULL,
            disabled_at datetime NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY company_extension (company_id, extension_slug),
            KEY company_status (company_id, status)
        ) {$charset};");
    }
}
