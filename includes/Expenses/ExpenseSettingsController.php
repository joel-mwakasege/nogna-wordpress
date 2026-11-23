<?php
namespace Nogna\Billing\Expenses;

defined('ABSPATH') || exit;

use Nogna\Billing\Companies\CompanyRepository;

final class ExpenseSettingsController
{
    public function register_routes(): void
    {
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/expense-categories', [
            ['methods'=>'GET','callback'=>[$this,'categories'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'POST','callback'=>[$this,'create_category'],'permission_callback'=>[$this,'can_access']],
        ]);
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/expense-categories/(?P<category_id>\d+)', [
            ['methods'=>'PUT, PATCH','callback'=>[$this,'update_category'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'DELETE','callback'=>[$this,'delete_category'],'permission_callback'=>[$this,'can_access']],
        ]);
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/expense-accounts', [
            ['methods'=>'GET','callback'=>[$this,'accounts'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'POST','callback'=>[$this,'create_account'],'permission_callback'=>[$this,'can_access']],
        ]);
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/expense-accounts/(?P<account_id>\d+)', [
            ['methods'=>'PUT, PATCH','callback'=>[$this,'update_account'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'DELETE','callback'=>[$this,'delete_account'],'permission_callback'=>[$this,'can_access']],
        ]);
    }

    public function can_access(\WP_REST_Request $request): bool
    {
        return is_user_logged_in() && (new CompanyRepository())->user_has_access((int)$request['company_id'], (int)get_current_user_id());
    }

    private function table(string $name): string { global $wpdb; return $wpdb->prefix.'nogna_'.$name; }

    public function categories(\WP_REST_Request $r): \WP_REST_Response { global $wpdb; return new \WP_REST_Response(['data'=>$wpdb->get_results($wpdb->prepare("SELECT * FROM {$this->table('expense_categories')} WHERE company_id=%d AND deleted_at IS NULL AND is_active=1 ORDER BY name ASC",(int)$r['company_id']),ARRAY_A)]); }
    public function accounts(\WP_REST_Request $r): \WP_REST_Response { global $wpdb; return new \WP_REST_Response(['data'=>$wpdb->get_results($wpdb->prepare("SELECT * FROM {$this->table('expense_accounts')} WHERE company_id=%d AND deleted_at IS NULL ORDER BY name ASC",(int)$r['company_id']),ARRAY_A)]); }

    public function create_category(\WP_REST_Request $r): \WP_REST_Response { global $wpdb; $name=sanitize_text_field((string)$r->get_param('name')); if($name==='')return $this->error('Category name is required.',400); if(!$wpdb->insert($this->table('expense_categories'),['company_id'=>(int)$r['company_id'],'name'=>$name,'description'=>sanitize_textarea_field((string)$r->get_param('description')),'created_by'=>(int)get_current_user_id(),'created_at'=>current_time('mysql'),'updated_at'=>current_time('mysql')]))return $this->error('Category could not be saved.',500); return new \WP_REST_Response(['data'=>$wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table('expense_categories')} WHERE id=%d",(int)$wpdb->insert_id),ARRAY_A)],201); }
    public function create_account(\WP_REST_Request $r): \WP_REST_Response { global $wpdb; $name=sanitize_text_field((string)$r->get_param('name')); if($name==='')return $this->error('Account name is required.',400); $type=in_array($r->get_param('type'),['bank','cash','mobile_money','other'],true)?$r->get_param('type'):'bank'; if(!$wpdb->insert($this->table('expense_accounts'),['company_id'=>(int)$r['company_id'],'name'=>$name,'type'=>$type,'provider'=>sanitize_text_field((string)$r->get_param('provider')),'account_reference'=>sanitize_text_field((string)$r->get_param('account_reference')),'currency'=>strtoupper(sanitize_text_field((string)($r->get_param('currency')?:'TZS'))),'opening_balance'=>max(0,(float)$r->get_param('opening_balance')),'created_by'=>(int)get_current_user_id(),'created_at'=>current_time('mysql'),'updated_at'=>current_time('mysql')]))return $this->error('Account could not be saved.',500); return new \WP_REST_Response(['data'=>$wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table('expense_accounts')} WHERE id=%d",(int)$wpdb->insert_id),ARRAY_A)],201); }

    public function update_category(\WP_REST_Request $r): \WP_REST_Response { return $this->update_simple($r,'expense_categories',['name'=>sanitize_text_field((string)$r->get_param('name')),'description'=>sanitize_textarea_field((string)$r->get_param('description')),'is_active'=>$r->get_param('is_active')===null?1:(int)(bool)$r->get_param('is_active')]); }
    public function update_account(\WP_REST_Request $r): \WP_REST_Response { return $this->update_simple($r,'expense_accounts',['name'=>sanitize_text_field((string)$r->get_param('name')),'type'=>in_array($r->get_param('type'),['bank','cash','mobile_money','other'],true)?$r->get_param('type'):'bank','provider'=>sanitize_text_field((string)$r->get_param('provider')),'account_reference'=>sanitize_text_field((string)$r->get_param('account_reference')),'currency'=>strtoupper(sanitize_text_field((string)($r->get_param('currency')?:'TZS'))),'is_active'=>$r->get_param('is_active')===null?1:(int)(bool)$r->get_param('is_active')]); }
    public function delete_category(\WP_REST_Request $r): \WP_REST_Response { return $this->delete_simple($r,'expense_categories',(int)$r['category_id']); }
    public function delete_account(\WP_REST_Request $r): \WP_REST_Response { return $this->delete_simple($r,'expense_accounts',(int)$r['account_id']); }

    private function update_simple(\WP_REST_Request $r,string $name,array $data): \WP_REST_Response { global $wpdb; $id=(int)($r['category_id']?:$r['account_id']); if(!$wpdb->update($this->table($name),$data+['updated_at'=>current_time('mysql')],['id'=>$id,'company_id'=>(int)$r['company_id'],'deleted_at'=>null]))return $this->error('The setting could not be updated.',500); return new \WP_REST_Response(['data'=>['updated'=>true]]); }
    private function delete_simple(\WP_REST_Request $r,string $name,int $id): \WP_REST_Response { global $wpdb; $wpdb->update($this->table($name),['deleted_at'=>current_time('mysql'),'deleted_by'=>(int)get_current_user_id()],['id'=>$id,'company_id'=>(int)$r['company_id']]); return new \WP_REST_Response(['data'=>['deleted'=>true]]); }
    private function error(string $message,int $status): \WP_REST_Response { return new \WP_REST_Response(['message'=>$message],$status); }
}
