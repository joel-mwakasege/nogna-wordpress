<?php
namespace Nogna\Billing\Invoices;

defined('ABSPATH') || exit;

use Nogna\Billing\Companies\CompanyRepository;
use Nogna\Billing\Customers\CustomerRepository;

final class InvoiceController
{
    public function register_routes(): void
    {
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/invoices', [
            ['methods'=>'GET','callback'=>[$this,'index'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'POST','callback'=>[$this,'store'],'permission_callback'=>[$this,'can_access']],
        ]);
        register_rest_route('nogna/v1', '/companies/(?P<company_id>\d+)/invoices/(?P<invoice_id>\d+)', [
            ['methods'=>'GET','callback'=>[$this,'show'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'PUT, PATCH','callback'=>[$this,'update'],'permission_callback'=>[$this,'can_access']],
            ['methods'=>'DELETE','callback'=>[$this,'destroy'],'permission_callback'=>[$this,'can_access']],
        ]);
    }

    public function can_access(\WP_REST_Request $request): bool
    {
        return is_user_logged_in() && (new CompanyRepository())->user_has_access((int)$request['company_id'], (int)get_current_user_id());
    }

    public function index(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $company=(int)$request['company_id']; $table=$wpdb->prefix.'nogna_invoices';
        $rows=$wpdb->get_results($wpdb->prepare("SELECT i.*, c.name customer_name, c.email customer_email FROM {$table} i LEFT JOIN {$wpdb->prefix}nogna_customers c ON c.id=i.customer_id WHERE i.company_id=%d AND i.deleted_at IS NULL ORDER BY i.created_at DESC",$company), ARRAY_A);
        return new \WP_REST_Response(['data'=>$rows]);
    }

    public function store(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $company=(int)$request['company_id']; $customer=(int)$request->get_param('customer_id');
        if (!$customer || !(new CustomerRepository())->find($customer,$company)) return $this->error('Customer is required.',400);
        $type=in_array($request->get_param('document_type'),['invoice','quote'],true)?$request->get_param('document_type'):'invoice';
        $currency=strtoupper(sanitize_text_field((string)($request->get_param('currency') ?: 'USD')));
        $date=sanitize_text_field((string)($request->get_param('issue_date') ?: current_time('Y-m-d')));
        $number=trim((string)$request->get_param('document_number'));
        if ($number==='') $number='INV-'.wp_date('Ymd-His');
        $now=current_time('mysql');
        $ok=$wpdb->insert($wpdb->prefix.'nogna_invoices',[
            'company_id'=>$company,'customer_id'=>$customer,'invoice_number'=>sanitize_text_field($number),'document_number'=>sanitize_text_field($number),
            'document_type'=>$type,'status'=>'draft','issue_date'=>$date,'currency'=>$currency,'administrative_notes'=>sanitize_textarea_field((string)$request->get_param('administrative_notes')),
            'created_by'=>(int)get_current_user_id(),'created_at'=>$now,'updated_at'=>$now
        ]);
        if (!$ok) return $this->error('The document could not be created.',500);
        $id=(int)$wpdb->insert_id;
        $this->save_document($id,$request);
        return new \WP_REST_Response(['data'=>$this->load($company,$id)],201);
    }

    public function show(\WP_REST_Request $request): \WP_REST_Response
    {
        $data=$this->load((int)$request['company_id'],(int)$request['invoice_id']);
        return $data ? new \WP_REST_Response(['data'=>$data]) : $this->error('Document not found.',404);
    }

    public function update(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb; $company=(int)$request['company_id']; $id=(int)$request['invoice_id'];
        if (!$this->load($company,$id)) return $this->error('Document not found.',404);
        $allowed=['customer_id','document_type','issue_date','due_date','currency','administrative_notes','discount_percent','tax_percent','status'];
        $data=[]; foreach($allowed as $key){ if($request->get_param($key)!==null) $data[$key]=$key==='customer_id'?(int)$request->get_param($key):sanitize_text_field((string)$request->get_param($key)); }
        $data['updated_at']=current_time('mysql');
        if ($data) $wpdb->update($wpdb->prefix.'nogna_invoices',$data,['id'=>$id,'company_id'=>$company]);
        $this->save_document($id,$request); $this->recalculate($id);
        return new \WP_REST_Response(['data'=>$this->load($company,$id)]);
    }

    public function destroy(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb; $wpdb->update($wpdb->prefix.'nogna_invoices',['deleted_at'=>current_time('mysql'),'updated_at'=>current_time('mysql')],['id'=>(int)$request['invoice_id'],'company_id'=>(int)$request['company_id']]);
        return new \WP_REST_Response(['data'=>['deleted'=>true]]);
    }

    private function save_document(int $invoice_id, \WP_REST_Request $request): void
    {
        global $wpdb; $sections=$request->get_param('sections');
        if (!is_array($sections)) return;
        $st=$wpdb->prefix.'nogna_invoice_sections'; $it=$wpdb->prefix.'nogna_invoice_items';
        $wpdb->delete($st,['invoice_id'=>$invoice_id]); $wpdb->delete($it,['invoice_id'=>$invoice_id]);
        foreach($sections as $si=>$section){
            $wpdb->insert($st,['invoice_id'=>$invoice_id,'name'=>sanitize_text_field((string)($section['name']??'')),'units_multiplier'=>(float)($section['units_multiplier']??1),'hide_header'=>empty($section['hide_header'])?0:1,'sort_order'=>$si]);
            $section_id=(int)$wpdb->insert_id;
            foreach((array)($section['items']??[]) as $ii=>$item){
                $wpdb->insert($it,['invoice_id'=>$invoice_id,'section_id'=>$section_id,'description'=>sanitize_text_field((string)($item['description']??'')),'units'=>(float)($item['units']??1),'days'=>(float)($item['days']??1),'unit_cost'=>(float)($item['unit_cost']??0),'group_id'=>sanitize_text_field((string)($item['group_id']??'')),'is_group_parent'=>empty($item['is_group_parent'])?0:1,'remarks'=>sanitize_textarea_field((string)($item['remarks']??'')),'sort_order'=>$ii]);
            }
        }
        $this->recalculate($invoice_id);
    }

    private function recalculate(int $id): void
    {
        global $wpdb; $st=$wpdb->prefix.'nogna_invoice_sections'; $it=$wpdb->prefix.'nogna_invoice_items'; $inv=$wpdb->prefix.'nogna_invoices';
        $sections=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$st} WHERE invoice_id=%d ORDER BY sort_order,id",$id),ARRAY_A); $subtotal=0;
        foreach($sections as $s){$items=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$it} WHERE section_id=%d ORDER BY sort_order,id",(int)$s['id']),ARRAY_A);$groups=[];$sum=0;foreach($items as $x){if($x['group_id']){if(!isset($groups[$x['group_id']]) || !empty($x['is_group_parent'])){$groups[$x['group_id']]=$x;}}else{$sum+=(float)$x['units']*(float)$x['days']*(float)$x['unit_cost'];}}foreach($groups as $x){$sum+=(float)$x['days']*(float)$x['unit_cost'];}$subtotal += $sum*(float)($s['units_multiplier']?:1);}
        $row=$wpdb->get_row($wpdb->prepare("SELECT discount_percent,tax_percent FROM {$inv} WHERE id=%d",$id),ARRAY_A);$discount=$subtotal*(float)($row['discount_percent']??0)/100;$tax=($subtotal-$discount)*(float)($row['tax_percent']??0)/100;$wpdb->update($inv,['subtotal'=>$subtotal,'discount_total'=>$discount,'tax_total'=>$tax,'total'=>$subtotal-$discount+$tax,'updated_at'=>current_time('mysql')],['id'=>$id]);
    }

    private function load(int $company,int $id): ?array
    {
        global $wpdb; $i=$wpdb->get_row($wpdb->prepare("SELECT i.*, c.name customer_name,c.email customer_email FROM {$wpdb->prefix}nogna_invoices i LEFT JOIN {$wpdb->prefix}nogna_customers c ON c.id=i.customer_id WHERE i.id=%d AND i.company_id=%d AND i.deleted_at IS NULL",$id,$company),ARRAY_A); if(!$i)return null;
        $sections=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$wpdb->prefix}nogna_invoice_sections WHERE invoice_id=%d ORDER BY sort_order,id",$id),ARRAY_A); foreach($sections as &$s)$s['items']=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$wpdb->prefix}nogna_invoice_items WHERE section_id=%d ORDER BY sort_order,id",(int)$s['id']),ARRAY_A);
        $i['sections']=$sections; return $i;
    }

    private function error(string $message,int $status): \WP_REST_Response { return new \WP_REST_Response(['code'=>'nogna_invoice_error','message'=>$message],$status); }
}
