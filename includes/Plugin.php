<?php
namespace Nogna\Billing;

defined('ABSPATH') || exit;

use Nogna\Billing\Companies\CompanyController;
use Nogna\Billing\Customers\CustomerController;
use Nogna\Billing\Database\MigrationRunner;
use Nogna\Billing\Dashboard\DashboardController;
use Nogna\Billing\Settings\SettingsController;
use Nogna\Billing\Invoices\InvoiceController;

final class Plugin
{
    public static function boot(): void
    {
        (new self())->register_hooks();
    }

    public static function activate(): void
    {
        (new self())->activate_plugin();
    }

    public static function deactivate(): void
    {
        (new self())->deactivate_plugin();
    }

    private function register_hooks(): void
    {
        $this->ensure_invoice_schema();
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        (new DashboardController())->register();
    }

    private function activate_plugin(): void
    {
        $this->register_roles();
        (new MigrationRunner())->run();
        $this->create_dashboard_page();
        update_option('nogna_billing_version', NOGNA_BILLING_VERSION, false);
    }

    private function ensure_invoice_schema(): void
    {
        global $wpdb;
        $sections = $wpdb->prefix . 'nogna_invoice_sections';
        $items = $wpdb->prefix . 'nogna_invoice_items';
        $sections_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $sections)) === $sections;
        $items_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $items)) === $items;
        $section_id_exists = $items_exists && (bool) $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$items} LIKE %s", 'section_id'));
        $unit_cost_exists = $items_exists && (bool) $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$items} LIKE %s", 'unit_cost'));
        $group_id_exists = $items_exists && (bool) $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$items} LIKE %s", 'group_id'));
        $group_parent_exists = $items_exists && (bool) $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$items} LIKE %s", 'is_group_parent'));
        $remarks_exists = $items_exists && (bool) $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$items} LIKE %s", 'remarks'));
        $payments = $wpdb->prefix . 'nogna_invoice_payments';
        $payments_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $payments)) === $payments;
        if (!$sections_exists || !$section_id_exists || !$unit_cost_exists || !$group_id_exists || !$group_parent_exists || !$remarks_exists || !$payments_exists) {
            (new MigrationRunner())->run();
        }
    }

    private function deactivate_plugin(): void
    {
        // Scheduled jobs and integrations will be paused here in a later phase.
    }

    public function register_rest_routes(): void
    {
        register_rest_route('nogna/v1', '/health', [
            'methods' => 'GET',
            'callback' => static function (): \WP_REST_Response {
                return new \WP_REST_Response([
                    'data' => [
                        'plugin' => 'nogna-billing',
                        'version' => NOGNA_BILLING_VERSION,
                        'status' => 'ok',
                    ],
                ]);
            },
            'permission_callback' => '__return_true',
        ]);

        (new CompanyController())->register_routes();
        (new CustomerController())->register_routes();
        (new InvoiceController())->register_routes();
        (new SettingsController())->register_routes();
    }

    private function register_roles(): void
    {
        add_role('nogna_owner', 'Nogna Owner', ['read' => true]);
        add_role('nogna_administrator', 'Nogna Administrator', ['read' => true]);
        add_role('nogna_user', 'Nogna User', ['read' => true]);
    }

    private function create_dashboard_page(): void
    {
        $existing_id = (int) get_option('nogna_dashboard_page_id', 0);

        if ($existing_id && get_post_status($existing_id)) {
            return;
        }

        $page_id = wp_insert_post([
            'post_title' => 'Nogna Dashboard',
            'post_name' => 'nogna-dashboard',
            'post_content' => '[nogna_dashboard]',
            'post_status' => 'publish',
            'post_type' => 'page',
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            update_option('nogna_dashboard_page_id', $page_id, false);
        }
    }
}
