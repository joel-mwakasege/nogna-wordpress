<?php
namespace Nogna\Billing\Settings;

defined('ABSPATH') || exit;

final class SettingsController
{
    private const OPTION = 'nogna_appearance_settings';

    public function register_routes(): void
    {
        register_rest_route('nogna/v1', '/settings/appearance', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get'],
                'permission_callback' => [$this, 'can_manage'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'save'],
                'permission_callback' => [$this, 'can_manage'],
                'args' => ['settings' => ['required' => true]],
            ],
        ]);
    }

    public function get(): \WP_REST_Response
    {
        return new \WP_REST_Response(['data' => $this->settings()]);
    }

    public function save(\WP_REST_Request $request): \WP_REST_Response
    {
        $incoming = $request->get_param('settings');
        if (!is_array($incoming)) {
            return new \WP_REST_Response(['message' => 'Settings must be an object.'], 400);
        }

        $defaults = $this->defaults();
        $saved = [];
        foreach ($defaults as $key => $default) {
            $value = $incoming[$key] ?? $default;
            $saved[$key] = is_string($value) ? sanitize_text_field($value) : $default;
        }

        update_option(self::OPTION, $saved, false);
        return new \WP_REST_Response(['data' => $saved]);
    }

    public function can_manage(): bool
    {
        return is_user_logged_in() && current_user_can('manage_options');
    }

    private function settings(): array
    {
        return wp_parse_args((array) get_option(self::OPTION, []), $this->defaults());
    }

    private function defaults(): array
    {
        return [
            'font_family' => 'Inter',
            'base_font_size' => '14px',
            'heading_font_size' => '30px',
            'nav_font_size' => '14px',
            'icon_size' => '18px',
            'icon_stroke' => '1.8',
            'canvas_color' => '#181818',
            'sidebar_color' => '#1c1c1c',
            'panel_color' => '#222222',
            'text_color' => '#f1f1f1',
            'muted_color' => '#999999',
            'accent_color' => '#559cf0',
            'success_color' => '#35b97b',
            'border_color' => '#363636',
            'radius' => '10px',
            'logo_url' => '',
            'brand_name' => 'NOGNA',
            'brand_subtitle' => 'Billing',
        ];
    }
}
