<?php
/**
 * Plugin Name: Nogna Billing
 * Plugin URI: https://github.com/joel-mwakasege/nogna-wordpress
 * Description: Native WordPress billing and financial management application for multi-company workspaces.
 * Version: 1.0.0
 * Author: Joel Mwakasege
 * Author URI: https://github.com/joel-mwakasege
 * Text Domain: nogna-billing
 * Requires at least: 6.4
 * Requires PHP: 8.1
 */

defined('ABSPATH') || exit;

define('NOGNA_BILLING_VERSION', '1.0.0');
define('NOGNA_BILLING_FILE', __FILE__);
define('NOGNA_BILLING_DIR', plugin_dir_path(__FILE__));
define('NOGNA_BILLING_URL', plugin_dir_url(__FILE__));

require_once NOGNA_BILLING_DIR . 'includes/Autoloader.php';

\Nogna\Billing\Autoloader::register();

register_activation_hook(__FILE__, ['\Nogna\Billing\Plugin', 'activate']);
register_deactivation_hook(__FILE__, ['\Nogna\Billing\Plugin', 'deactivate']);

add_action('plugins_loaded', static function (): void {
    \Nogna\Billing\Plugin::boot();
});
