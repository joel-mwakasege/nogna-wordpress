<?php
namespace Nogna\Billing\Expenses;

defined('ABSPATH') || exit;

use Nogna\Billing\Companies\CompanyRepository;

final class ExpenseController
{
    public function register_routes(): void
    {
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/expenses', [
            ['methods'=>'GET','callback'=>[$this,'index'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'POST','callback'=>[$this,'store'],'permission_callback'=>[$this,'can_access']],
        ]);
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/expenses/(?P<expense_id>\d+)', [
            ['methods'=>'GET','callback'=>[$this,'show'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'PUT, PATCH','callback'=>[$this,'update'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'DELETE','callback'=>[$this,'destroy'],'permission_callback'=>[$this,'can_access']],
        ]);
    }

    public function can_access(\WP_REST_Request $request): bool
    {
        return is_user_logged_in() && (new CompanyRepository())->user_has_access((int)$request['company_id'], (int)get_current_user_id());
    }

    private function table(): string { global $wpdb; return $wpdb->prefix.'nogna_expenses'; }

    public function index(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$this->table()} WHERE company_id=%d AND deleted_at IS NULL ORDER BY expense_date DESC, id DESC",(int)$request['company_id']),ARRAY_A);
        return new \WP_REST_Response(['data'=>$rows]);
    }

    public function show(\WP_REST_Request $request): \WP_REST_Response
    {
        $row=$this->find((int)$request['company_id'],(int)$request['expense_id']);
        return $row?new \WP_REST_Response(['data'=>$row]):$this->error('Expense not found.',404);
    }

    public function store(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $data=$this->data($request);
        if($data['description']==='')return $this->error('Description is required.',400);
        if($data['amount']<=0)return $this->error('Amount must be greater than zero.',400);
        $now=current_time('mysql'); $data['company_id']=(int)$request['company_id']; $data['created_by']=(int)get_current_user_id(); $data['created_at']=$now; $data['updated_at']=$now;
        if(!$wpdb->insert($this->table(),$data))return $this->error('Expense could not be saved: '.($wpdb->last_error?:'database error.'),500);
        return new \WP_REST_Response(['data'=>$this->find((int)$request['company_id'],(int)$wpdb->insert_id)],201);
    }

    public function update(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb; $company=(int)$request['company_id']; $id=(int)$request['expense_id'];
        if(!$this->find($company,$id))return $this->error('Expense not found.',404);
        $data=$this->data($request); $data['updated_at']=current_time('mysql');
        if($data['description']==='')return $this->error('Description is required.',400);
        if($data['amount']<=0)return $this->error('Amount must be greater than zero.',400);
        if(!$wpdb->update($this->table(),$data,['id'=>$id,'company_id'=>$company]))return $this->error('Expense could not be updated: '.($wpdb->last_error?:'database error.'),500);
        return new \WP_REST_Response(['data'=>$this->find($company,$id)]);
    }

    public function destroy(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb; $company=(int)$request['company_id']; $id=(int)$request['expense_id'];
        if(!$this->find($company,$id))return $this->error('Expense not found.',404);
        $wpdb->update($this->table(),['deleted_at'=>current_time('mysql'),'deleted_by'=>(int)get_current_user_id()],['id'=>$id,'company_id'=>$company]);
        return new \WP_REST_Response(['data'=>['deleted'=>true]]);
    }

    private function data(\WP_REST_Request $request): array
    {
        $status=(string)$request->get_param('payment_status');
        return [
            'expense_date'=>sanitize_text_field((string)($request->get_param('expense_date')?:current_time('Y-m-d'))),
            'description'=>sanitize_text_field((string)$request->get_param('description')),
            'category'=>sanitize_text_field((string)$request->get_param('category')),
            'payee'=>sanitize_text_field((string)$request->get_param('payee')),
            'amount'=>max(0,(float)$request->get_param('amount')),
            'currency'=>strtoupper(sanitize_text_field((string)($request->get_param('currency')?:'USD'))),
            'payment_status'=>in_array($status,['unpaid','partially_paid','paid'],true)?$status:'unpaid',
            'notes'=>sanitize_textarea_field((string)$request->get_param('notes')),
            'receipt_url'=>esc_url_raw((string)$request->get_param('receipt_url')),
        ];
    }

    private function find(int $company,int $id): ?array
    {
        global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table()} WHERE id=%d AND company_id=%d AND deleted_at IS NULL",$id,$company),ARRAY_A);
        return $row?:null;
    }

    private function error(string $message,int $status): \WP_REST_Response { return new \WP_REST_Response(['message'=>$message],$status); }
}
