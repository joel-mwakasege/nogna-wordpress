<?php
namespace Nogna\Billing;

defined('ABSPATH') || exit;

use Nogna\Billing\Companies\CompanyController;
use Nogna\Billing\Database\MigrationRunner;

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
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    private function activate_plugin(): void
    {
        $this->register_roles();
        (new MigrationRunner())->run();
        update_option('nogna_billing_version', NOGNA_BILLING_VERSION, false);
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
    }

    private function register_roles(): void
    {
        add_role('nogna_owner', 'Nogna Owner', ['read' => true]);
        add_role('nogna_administrator', 'Nogna Administrator', ['read' => true]);
        add_role('nogna_user', 'Nogna User', ['read' => true]);
    }
}
