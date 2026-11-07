<?php
namespace Nogna\Billing\Customers;

defined('ABSPATH') || exit;

use Nogna\Billing\Companies\CompanyRepository;

final class CustomerController
{
    public function register_routes(): void
    {
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/customers', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'index'],
                'permission_callback' => [$this, 'can_access_company'],
                'args' => [
                    'search' => [
                        'required' => false,
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'store'],
                'permission_callback' => [$this, 'can_access_company'],
            ],
        ]);

        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/customers/(?P<customer_id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'show'],
                'permission_callback' => [$this, 'can_access_company'],
            ],
            [
                'methods' => 'PUT, PATCH',
                'callback' => [$this, 'update'],
                'permission_callback' => [$this, 'can_access_company'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'destroy'],
                'permission_callback' => [$this, 'can_access_company'],
            ],
        ]);
    }

    public function index(\WP_REST_Request $request): \WP_REST_Response
    {
        $customers = (new CustomerRepository())->find_for_company(
            (int) $request['company_id'],
            ['search' => $request->get_param('search')]
        );

        return new \WP_REST_Response(['data' => $customers]);
    }

    public function store(\WP_REST_Request $request): \WP_REST_Response
    {
        $name = trim((string) $request->get_param('name'));

        if ($name === '') {
            return $this->error('nogna_validation_failed', 'Customer name is required.', 400);
        }

        $email = sanitize_email((string) $request->get_param('email'));
        if ($request->get_param('email') && !is_email($email)) {
            return $this->error('nogna_validation_failed', 'Customer email is invalid.', 400);
        }

        $company_id = (int) $request['company_id'];
        $user_id = (int) get_current_user_id();

        try {
            $id = (new CustomerRepository())->create($company_id, [
                'customer_number' => sanitize_text_field((string) $request->get_param('customer_number')),
                'name' => $name,
                'email' => $email ?: null,
                'phone' => sanitize_text_field((string) $request->get_param('phone')),
                'tax_number' => sanitize_text_field((string) $request->get_param('tax_number')),
                'address' => $this->address($request),
                'notes' => sanitize_textarea_field((string) $request->get_param('notes')),
                'created_by' => $user_id,
            ]);
        } catch (\RuntimeException $exception) {
            return $this->error('nogna_internal_error', 'The customer could not be created.', 500);
        }

        return new \WP_REST_Response([
            'data' => (new CustomerRepository())->find($id, $company_id),
        ], 201);
    }

    public function show(\WP_REST_Request $request): \WP_REST_Response
    {
        $customer = (new CustomerRepository())->find(
            (int) $request['customer_id'],
            (int) $request['company_id']
        );

        if (!$customer) {
            return $this->error('nogna_record_not_found', 'Customer not found.', 404);
        }

        return new \WP_REST_Response(['data' => $customer]);
    }

    public function update(\WP_REST_Request $request): \WP_REST_Response
    {
        $name = trim((string) $request->get_param('name'));

        if ($name === '') {
            return $this->error('nogna_validation_failed', 'Customer name is required.', 400);
        }

        $company_id = (int) $request['company_id'];
        $customer_id = (int) $request['customer_id'];
        $email = sanitize_email((string) $request->get_param('email'));

        if ($request->get_param('email') && !is_email($email)) {
            return $this->error('nogna_validation_failed', 'Customer email is invalid.', 400);
        }

        $updated = (new CustomerRepository())->update($customer_id, $company_id, [
            'name' => $name,
            'email' => $email ?: null,
            'phone' => sanitize_text_field((string) $request->get_param('phone')),
            'tax_number' => sanitize_text_field((string) $request->get_param('tax_number')),
            'address' => $this->address($request),
            'notes' => sanitize_textarea_field((string) $request->get_param('notes')),
        ]);

        if (!$updated) {
            return $this->error('nogna_record_not_found', 'Customer not found.', 404);
        }

        return new \WP_REST_Response([
            'data' => (new CustomerRepository())->find($customer_id, $company_id),
        ]);
    }

    public function destroy(\WP_REST_Request $request): \WP_REST_Response
    {
        $company_id = (int) $request['company_id'];
        $customer_id = (int) $request['customer_id'];
        $deleted = (new CustomerRepository())->soft_delete(
            $customer_id,
            $company_id,
            (int) get_current_user_id()
        );

        if (!$deleted) {
            return $this->error('nogna_record_not_found', 'Customer not found.', 404);
        }

        return new \WP_REST_Response(['data' => ['deleted' => true]]);
    }

    public function can_access_company(\WP_REST_Request $request): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        return (new CompanyRepository())->user_has_access(
            (int) $request['company_id'],
            (int) get_current_user_id()
        );
    }

    private function address(\WP_REST_Request $request): array
    {
        $address = $request->get_param('address');

        if (!is_array($address)) {
            return [];
        }

        return [
            'line_1' => sanitize_text_field((string) ($address['line_1'] ?? '')),
            'line_2' => sanitize_text_field((string) ($address['line_2'] ?? '')),
            'city' => sanitize_text_field((string) ($address['city'] ?? '')),
            'region' => sanitize_text_field((string) ($address['region'] ?? '')),
            'postal_code' => sanitize_text_field((string) ($address['postal_code'] ?? '')),
            'country_code' => sanitize_text_field((string) ($address['country_code'] ?? '')),
        ];
    }

    private function error(string $code, string $message, int $status): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'code' => $code,
            'message' => $message,
        ], $status);
    }
}
