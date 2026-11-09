<?php
namespace Nogna\Billing\Companies;

defined('ABSPATH') || exit;

final class CompanyController
{
    public function register_routes(): void
    {
        register_rest_route('nogna/v1', '/companies', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'index'],
                'permission_callback' => [$this, 'is_authenticated'],
            ],
            [
                'methods' => 'PUT, PATCH',
                'callback' => [$this, 'update'],
                'permission_callback' => [$this, 'can_manage'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'store'],
                'permission_callback' => [$this, 'is_authenticated'],
                'args' => [
                    'name' => [
                        'required' => true,
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'slug' => [
                        'required' => false,
                        'sanitize_callback' => static fn($value): string => sanitize_title((string) $value),
                    ],
                    'base_currency' => [
                        'required' => false,
                        'default' => 'USD',
                        'sanitize_callback' => static fn($value): string => strtoupper(sanitize_text_field((string) $value)),
                    ],
                    'timezone' => [
                        'required' => false,
                        'default' => 'UTC',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
        ]);
    }

    public function update(\WP_REST_Request $request): \WP_REST_Response
    {
        $company_id = (int) $request['id'];
        $name = trim((string) $request->get_param('name'));
        $slug = sanitize_title((string) ($request->get_param('slug') ?: $name));
        $currency = strtoupper(trim((string) ($request->get_param('base_currency') ?: 'USD')));
        $timezone = trim((string) ($request->get_param('timezone') ?: 'UTC'));

        if ($name === '' || !preg_match('/^[A-Z]{3}$/', $currency)) {
            return new \WP_REST_Response(['code' => 'nogna_validation_failed', 'message' => 'Company name and currency are required.'], 400);
        }

        try {
            new \DateTimeZone($timezone);
        } catch (\Exception $exception) {
            return new \WP_REST_Response(['code' => 'nogna_validation_failed', 'message' => 'Timezone is invalid.'], 400);
        }

        $updated = (new CompanyRepository())->update($company_id, [
            'name' => sanitize_text_field($name),
            'slug' => $slug,
            'base_currency' => $currency,
            'timezone' => sanitize_text_field($timezone),
        ]);

        if (!$updated) {
            return new \WP_REST_Response(['code' => 'nogna_record_not_found', 'message' => 'Company not found.'], 404);
        }

        return new \WP_REST_Response(['data' => ['id'=>$company_id,'name'=>$name,'slug'=>$slug,'base_currency'=>$currency,'timezone'=>$timezone]]);
    }

    public function can_manage(\WP_REST_Request $request): bool
    {
        return is_user_logged_in() && (new CompanyRepository())->user_has_access((int) $request['id'], (int) get_current_user_id());
    }

    public function index(\WP_REST_Request $request): \WP_REST_Response
    {
        $companies = (new CompanyRepository())->find_for_user((int) get_current_user_id());

        return new \WP_REST_Response(['data' => $companies]);
    }

    public function store(\WP_REST_Request $request): \WP_REST_Response
    {
        $user_id = (int) get_current_user_id();
        $name = trim((string) $request->get_param('name'));
        $slug = trim((string) ($request->get_param('slug') ?: sanitize_title($name)));
        $currency = trim((string) ($request->get_param('base_currency') ?: 'USD'));
        $timezone = trim((string) ($request->get_param('timezone') ?: 'UTC'));

        if ($name === '' || $slug === '') {
            return new \WP_REST_Response([
                'code' => 'nogna_validation_failed',
                'message' => 'Company name is required.',
            ], 400);
        }

        if (!preg_match('/^[A-Z]{3}$/', $currency)) {
            return new \WP_REST_Response([
                'code' => 'nogna_validation_failed',
                'message' => 'Base currency must be a three-letter currency code.',
            ], 400);
        }

        try {
            new \DateTimeZone($timezone);
        } catch (\Exception $exception) {
            return new \WP_REST_Response([
                'code' => 'nogna_validation_failed',
                'message' => 'Timezone is invalid.',
            ], 400);
        }

        $repository = new CompanyRepository();

        try {
            $company_id = $repository->create([
                'name' => $name,
                'slug' => $slug,
                'base_currency' => $currency,
                'timezone' => $timezone,
                'created_by' => $user_id,
            ]);
            $repository->add_member($company_id, $user_id, 'owner');
        } catch (\RuntimeException $exception) {
            $code = $exception->getMessage() === 'duplicate_company_slug'
                ? 'nogna_duplicate_company_slug'
                : 'nogna_internal_error';

            return new \WP_REST_Response([
                'code' => $code,
                'message' => $code === 'nogna_duplicate_company_slug'
                    ? 'That company slug is already in use.'
                    : 'The company could not be created.',
            ], $code === 'nogna_duplicate_company_slug' ? 409 : 500);
        }

        return new \WP_REST_Response([
            'data' => [
                'id' => $company_id,
                'slug' => $slug,
                'name' => $name,
                'base_currency' => $currency,
                'timezone' => $timezone,
                'role' => 'owner',
            ],
        ], 201);
    }

    public function is_authenticated(): bool
    {
        return is_user_logged_in();
    }
}
