import { useEffect, useState } from 'react';
import { Building2, FileText, ChevronDown, ChevronLeft, CircleUserRound, HelpCircle, Home, Pencil, Settings, Trash2, UsersRound } from 'lucide-react';

type Section = 'home' | 'company' | 'customers' | 'invoices' | 'settings';
type Company = { id: number; name: string; slug: string; base_currency: string; timezone: string; role?: string };
type Appearance = Record<string, string>;
declare global { interface Window { NognaReact?: { restUrl: string; nonce: string }; wp?: any } }

const api = (path: string, options: RequestInit = {}) => fetch((window.NognaReact?.restUrl || '') + path, {
  credentials: 'include', ...options,
  headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.NognaReact?.nonce || '', ...(options.headers || {}) }
}).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
});

const defaults: Appearance = {
  font_family:'Inter', base_font_size:'14px', heading_font_size:'30px', nav_font_size:'14px',
  icon_size:'18px', icon_stroke:'1.8', canvas_color:'#181818', sidebar_color:'#1c1c1c',
  panel_color:'#222222', text_color:'#f1f1f1', muted_color:'#999999', accent_color:'#559cf0',
  success_color:'#35b97b', border_color:'#363636', radius:'10px', logo_url:'', brand_name:'NOGNA', brand_subtitle:'Billing', invoice_show_units:'1', invoice_units_label:'Units', invoice_show_days:'1', invoice_days_label:'Days', invoice_show_unit_amount:'1', invoice_unit_amount_label:'Unit amount'
};

function applyAppearance(s: Appearance) {
  const root = document.documentElement;
  const vars: Record<string,string> = {
    '--nogna-font-family': s.font_family, '--nogna-font-size-base': s.base_font_size,
    '--nogna-heading-size': s.heading_font_size, '--nogna-nav-font-size': s.nav_font_size,
    '--nogna-icon-size': s.icon_size, '--nogna-icon-stroke': s.icon_stroke,
    '--nogna-canvas': s.canvas_color, '--nogna-sidebar': s.sidebar_color, '--nogna-panel': s.panel_color,
    '--nogna-text': s.text_color, '--nogna-muted': s.muted_color, '--nogna-accent': s.accent_color,
    '--nogna-success': s.success_color, '--nogna-border': s.border_color, '--nogna-radius': s.radius
  };
  Object.entries(vars).forEach(([key,value]) => root.style.setProperty(key,value));
}

export default function App() {
  const [section, setSection] = useState<Section>('company');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [appearance, setAppearance] = useState<Appearance>(defaults);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false); const [showCompanyForm, setShowCompanyForm] = useState(false); const [companyForm, setCompanyForm] = useState({name:'',slug:'',base_currency:'TZS',timezone:'Africa/Dar_es_Salaam'});

  useEffect(() => {
    Promise.all([api('/companies'), api('/settings/appearance').catch(() => ({data: defaults}))]).then(([companiesResponse, appearanceResponse]) => {
      const list = companiesResponse.data || [];
      const settings = {...defaults, ...(appearanceResponse.data || {})};
      setCompanies(list); setSelected(list[0] || null); setAppearance(settings); applyAppearance(settings);
    }).finally(() => setLoading(false));
  }, []);

  const title = section === 'company' ? 'My Company' : section === 'customers' ? 'Customers' : section === 'invoices' ? 'Invoices' : section === 'settings' ? 'Settings' : 'Home';
  const navigate = (next: Section) => setSection(next);

  return <div className={'nogna-app' + (collapsed ? ' is-sidebar-collapsed' : '')}>
    <header className="nogna-app-header">
      <div className="nogna-header-title"><button className="nogna-sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar"><ChevronLeft size={18}/></button><span>{title}</span></div>
      <div className="nogna-header-actions"><HelpCircle size={17}/><CircleUserRound size={17}/></div>
    </header>
    <div className="nogna-app-body">
      <aside className="nogna-app-sidebar">
        <div className="nogna-logo">{appearance.logo_url && <img src={appearance.logo_url} alt={appearance.brand_name}/>}<div>{appearance.brand_name}<small>{appearance.brand_subtitle}</small></div></div>
        <button className={section === 'home' ? 'is-active' : ''} onClick={() => navigate('home')}><Home size={18}/><span className="nogna-nav-text">Home</span></button>
        <div className="nogna-sidebar-label">MASTER DATA</div>
        <button className={section === 'customers' ? 'is-active' : ''} onClick={() => navigate('customers')}><UsersRound size={18}/><span className="nogna-nav-text">Customers</span></button>
        <button className={section === 'invoices' ? 'is-active' : ''} onClick={() => navigate('invoices')}><FileText size={18}/><span className="nogna-nav-text">Invoices</span></button>
        <button className={section === 'company' ? 'is-active' : ''} onClick={() => navigate('company')}><Building2 size={18}/><span className="nogna-nav-text">My Company</span></button>
        <div className="nogna-company-account">
          <button className="nogna-company-switcher" onClick={() => navigate('company')}><span className="nogna-company-avatar">{selected?.name?.charAt(0) || 'N'}</span><span className="nogna-nav-text"><small>Workspace</small><strong>{selected?.name || 'No workspace'}</strong></span><ChevronDown size={15}/></button>
          <div className="nogna-account-tools"><button onClick={() => navigate('settings')}><Settings size={16}/><span className="nogna-nav-text">Settings</span></button><span className="nogna-online"></span><CircleUserRound size={17}/></div>
        </div>
      </aside>
      <main className="nogna-app-main">
        {section === 'company' && <CompanyView companies={companies} selected={selected} setSelected={setSelected} loading={loading} onCreate={()=>setShowCompanyForm(true)}/>}
        {section === 'customers' && <CustomerView company={selected}/>}
        {section === 'invoices' && <InvoiceView company={selected} appearance={appearance}/>}
        {section === 'home' && <Placeholder title="Home" text="Your financial dashboard will appear here once income, expenses, and payments are implemented."/>}
        {section === 'settings' && <SettingsView value={appearance} onChange={(next) => {setAppearance(next); applyAppearance(next);}}/>}{showCompanyForm && <CompanyCreateForm value={companyForm} onChange={setCompanyForm} onCancel={()=>setShowCompanyForm(false)} onCreated={(company)=>{setCompanies([...companies,company]);setSelected(company);setShowCompanyForm(false);setSection('company');}}/>}
      </main>
    </div>
  </div>;
}

function CompanyView({companies,selected,setSelected,loading,onCreate}:{companies:Company[];selected:Company|null;setSelected:(c:Company)=>void;loading:boolean;onCreate:()=>void}) {
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({name:'',slug:'',base_currency:'TZS',timezone:'Africa/Dar_es_Salaam'});
  const [message,setMessage]=useState('');
  const edit=()=>{if(!selected)return;setForm({name:selected.name,slug:selected.slug,base_currency:selected.base_currency,timezone:selected.timezone});setEditing(true);};
  const save=()=>{if(!selected)return;api('/companies/'+selected.id,{method:'PUT',body:JSON.stringify(form)}).then(r=>{setSelected(r.data);setEditing(false);setMessage('Company updated')}).catch(e=>setMessage(e.message))};
  return <div className="nogna-company-view"><aside className="nogna-company-list"><div className="nogna-list-title">MY COMPANIES</div>{loading&&<div className="nogna-list-empty">Loading companies…</div>}{!loading&&companies.map(c=><button key={c.id} className={'nogna-company-row '+(selected?.id===c.id?'is-selected':'')} onClick={()=>setSelected(c)}><span className="nogna-company-avatar">{c.name.charAt(0)}</span><span><strong>{c.name}</strong><small>{c.timezone}</small></span><span className="nogna-more">⋮</span></button>)}{!loading&&!companies.length&&<div className="nogna-list-empty">No companies yet.</div>}<button className="nogna-create-company" onClick={onCreate}>＋ Create company</button></aside><section className="nogna-company-detail">{message&&<div className={'nogna-customer-notice '+(/updated/i.test(message)?'is-success':'is-error')}>{message}</div>}{editing?<div className="nogna-company-fields nogna-company-edit-form">{[['name','Company name'],['slug','Workspace slug'],['base_currency','Base currency'],['timezone','Timezone']].map(([key,label])=><label className="nogna-field" key={key}><span>{label}</span><input value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<div className="nogna-form-actions"><button className="nogna-secondary-button" onClick={()=>setEditing(false)}>Cancel</button><button className="nogna-save-button" onClick={save}>Save changes</button></div></div>:<><div className="nogna-company-title"><div className="nogna-company-heading"><span className="nogna-company-avatar large">{selected?.name?.charAt(0)||'N'}</span><div><h1>{selected?.name||'My Company'}</h1><p>Active profile</p></div><ChevronDown size={17}/></div><div className="nogna-customer-actions"><button className="nogna-secondary-button" onClick={edit}>Edit</button></div></div><nav className="nogna-tabs"><button className="is-active">Company</button><button disabled>Address</button><button disabled>Contact</button><button disabled>History</button></nav><div className="nogna-company-fields"><Field label="Company name" value={selected?.name||''} required/><Field label="Workspace slug" value={selected?.slug||''}/><Field label="Base currency" value={selected?.base_currency||''}/><Field label="Timezone" value={selected?.timezone||''}/><Field label="Workspace owner" value={selected?.role==='owner'?'Owner':''}/></div></>}</section></div>;
}

function HomeView({company}:{company:Company|null}) {
  const [customers,setCustomers]=useState<any[]>([]);
  useEffect(()=>{if(company)api('/companies/'+company.id+'/customers').then(r=>setCustomers(r.data||[])).catch(()=>setCustomers([]));},[company]);
  if(!company)return <div className="nogna-placeholder"><h1>Home</h1><p>Create a workspace to begin.</p></div>;
  return <div className="nogna-home-view"><div className="nogna-home-heading"><div><p className="nogna-home-eyebrow">Your financial workspace</p><h1>Good to see you.</h1><p>{company.name} · {company.base_currency}</p></div><button className="nogna-save-button">＋ Add customer</button></div><div className="nogna-kpi-strip"><article className="nogna-kpi is-selected"><span>Customers</span><strong>{customers.length}</strong><small>Active records</small></article><article className="nogna-kpi"><span>Invoices</span><strong>—</strong><small>Coming next</small></article><article className="nogna-kpi"><span>Expenses</span><strong>—</strong><small>Coming next</small></article><article className="nogna-kpi"><span>Net result</span><strong>—</strong><small>Coming next</small></article></div><section className="nogna-chart-panel"><div className="nogna-panel-heading"><div><h3>Workspace activity</h3><p>Live customer records for {company.name}</p></div></div><div className="nogna-empty-chart"><span>{customers.length?'Customer activity is ready for financial modules.':'Add your first customer to begin.'}</span><small>Invoices, payments, expenses and reports will appear here as they are implemented.</small></div></section><section className="nogna-recent-panel"><h3>Recent customers</h3>{customers.slice(0,5).map(c=><div className="nogna-recent-row" key={c.id}><span className="nogna-company-avatar">{c.name.charAt(0)}</span><span><strong>{c.name}</strong><small>{c.email||'No email'}</small></span></div>)}{!customers.length&&<p className="nogna-settings-help">No customers have been added yet.</p>}</section></div>;
}

function Field({label,value,required}:{label:string;value:string;required?:boolean}) { return <label className="nogna-field"><span>{label}{required&&<em> *</em>}</span><input value={value} readOnly/></label>; }
function Placeholder({title,text}:{title:string;text:string}) { return <div className="nogna-placeholder"><h1>{title}</h1><p>{text}</p></div>; }

function CompanyCreateForm({value,onChange,onCancel,onCreated}:{value:any;onChange:(v:any)=>void;onCancel:()=>void;onCreated:(c:Company)=>void}) {
  const [error,setError]=useState('');
  const save=()=>api('/companies',{method:'POST',body:JSON.stringify(value)}).then(r=>onCreated(r.data)).catch(e=>setError(e.message));
  return <div className="nogna-overlay"><div className="nogna-dialog"><h1>Create company</h1><p>Set up the workspace for your business.</p>{['name','slug','base_currency','timezone'].map(key=><label className="nogna-field" key={key}><span>{key.replace('_',' ')}</span><input value={value[key]} onChange={e=>onChange({...value,[key]:e.target.value})}/></label>)}{error&&<div className="nogna-customer-notice is-error">{error}</div>}<div className="nogna-form-actions"><button className="nogna-secondary-button" onClick={onCancel}>Cancel</button><button className="nogna-save-button" onClick={save}>Create company</button></div></div></div>;
}

function CustomerView({company}:{company:Company|null}) {
  const [customers,setCustomers]=useState<any[]>([]);
  const [search,setSearch]=useState('');
  const [selectedCustomer,setSelectedCustomer]=useState<any|null>(null);
  const [showForm,setShowForm]=useState(false); const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({name:'',email:'',phone:'',tax_number:'',notes:''});
  const [message,setMessage]=useState('');
  useEffect(()=>{if(!company)return;api('/companies/'+company.id+'/customers').then(r=>{setCustomers(r.data||[]);setSelectedCustomer((r.data||[])[0]||null)}).catch(e=>setMessage(e.message))},[company]);
  const visible=customers.filter(c=>(c.name+' '+(c.email||'')).toLowerCase().includes(search.toLowerCase()));
  const save=()=>{if(!company)return;const path=editing&&selectedCustomer?'/companies/'+company.id+'/customers/'+selectedCustomer.id:'/companies/'+company.id+'/customers';const method=editing?'PUT':'POST';api(path,{method,body:JSON.stringify(form)}).then(r=>{const next=editing?customers.map(c=>c.id===r.data.id?r.data:c):[r.data,...customers];setCustomers(next);setSelectedCustomer(r.data);setShowForm(false);setEditing(false);setForm({name:'',email:'',phone:'',tax_number:'',notes:''});setMessage(editing?'Customer updated':'Customer created')}).catch(e=>setMessage(e.message))};
  const edit=()=>{if(!selectedCustomer)return;setForm({name:selectedCustomer.name||'',email:selectedCustomer.email||'',phone:selectedCustomer.phone||'',tax_number:selectedCustomer.tax_number||'',notes:selectedCustomer.notes||''});setEditing(true);setShowForm(true)};
  const remove=()=>{if(!company||!selectedCustomer||!window.confirm('Move this customer to trash?'))return;api('/companies/'+company.id+'/customers/'+selectedCustomer.id,{method:'DELETE'}).then(()=>{const next=customers.filter(c=>c.id!==selectedCustomer.id);setCustomers(next);setSelectedCustomer(next[0]||null);setMessage('Customer moved to trash')}).catch(e=>setMessage(e.message))};
  if(!company)return <div className="nogna-placeholder"><h1>Customers</h1><p>Create a workspace before adding customers.</p></div>;
  return <div className="nogna-customer-view"><aside className="nogna-customer-list"><div className="nogna-list-title">CUSTOMERS <button className="nogna-list-add" onClick={()=>setShowForm(true)}>＋</button></div><input className="nogna-customer-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..."/><div className="nogna-customer-rows">{visible.map(c=><button key={c.id} className={'nogna-customer-row '+(selectedCustomer?.id===c.id?'is-selected':'')} onClick={()=>setSelectedCustomer(c)}><span className="nogna-company-avatar">{c.name.charAt(0)}</span><span><strong>{c.name}</strong><small>{c.email||'No email'}</small></span></button>)}{!visible.length&&<div className="nogna-list-empty">No customers yet.</div>}</div><button className="nogna-create-company" onClick={()=>setShowForm(true)}>＋ Create customer</button></aside><section className="nogna-customer-detail">{message&&<div className={'nogna-customer-notice '+(/created|updated|trash/i.test(message)?'is-success':'is-error')} role="status">{message}</div>}{showForm?<div className="nogna-customer-form"><h1>{editing?'Edit customer':'Add customer'}</h1>{['name','email','phone','tax_number','notes'].map(key=><label className="nogna-field" key={key}><span>{key.replace('_',' ')}</span>{key==='notes'?<textarea rows={4} value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>:<input value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}<div className="nogna-form-actions"><button className="nogna-secondary-button" onClick={()=>{setShowForm(false);setEditing(false)}}>Cancel</button><button className="nogna-save-button" onClick={save}>{editing?'Save changes':'Save customer'}</button></div></div>:selectedCustomer?<><div className="nogna-company-title"><div className="nogna-company-heading"><span className="nogna-company-avatar large">{selectedCustomer.name.charAt(0)}</span><div><h1>{selectedCustomer.name}</h1><p>Customer · Active</p></div></div><div className="nogna-customer-actions"><button className="nogna-secondary-button" onClick={edit}>Edit</button><button className="nogna-danger-button" onClick={remove}>Delete</button></div></div><nav className="nogna-tabs"><button className="is-active">Master data</button><button disabled>Address</button><button disabled>History</button></nav><div className="nogna-company-fields"><Field label="Customer name" value={selectedCustomer.name}/><Field label="Email" value={selectedCustomer.email||''}/><Field label="Phone" value={selectedCustomer.phone||''}/><Field label="Tax number" value={selectedCustomer.tax_number||''}/></div></>:<div className="nogna-empty-state"><p>Select a customer or create one.</p></div>}</section></div>;
}

function SettingsView({value,onChange}:{value:Appearance;onChange:(v:Appearance)=>void}) {
  const [draft,setDraft]=useState(value); const [status,setStatus]=useState('');
  useEffect(()=>setDraft(value),[value]);
  const update=(key:string,val:string)=>setDraft({...draft,[key]:val});
  const save=()=>api('/settings/appearance',{method:'POST',body:JSON.stringify({settings:draft})}).then(r=>{onChange(r.data);setStatus('Saved');setTimeout(()=>setStatus(''),1800)}).catch(e=>setStatus(e.message));
  const colors=[['canvas_color','App background'],['sidebar_color','Sidebar'],['panel_color','Panels'],['text_color','Text'],['muted_color','Muted text'],['accent_color','Accent'],['success_color','Success'],['border_color','Borders']];
  return <div className="nogna-settings-page"><div className="nogna-settings-heading"><div><h1>Settings</h1><p>Control Nogna’s appearance without editing code.</p></div>{status&&<div className={'nogna-settings-notice '+(status==='Saved'?'is-success':'is-error')} role="status">{status}</div>}<button className="nogna-save-button" onClick={save}>Save changes</button></div><section className="nogna-settings-card"><h2>Brand identity</h2><div className="nogna-settings-grid"><SettingInput label="Brand name" value={draft.brand_name} onChange={v=>update('brand_name',v)}/><SettingInput label="Subtitle" value={draft.brand_subtitle} onChange={v=>update('brand_subtitle',v)}/><label className="nogna-setting-input wide"><span>Logo</span><div className="nogna-logo-picker"><input value={draft.logo_url} onChange={e=>update('logo_url',e.target.value)} placeholder="Select a logo from the Media Library"/><button type="button" onClick={()=>{if(!window.wp?.media){setStatus('Media Library unavailable');return;}const frame=window.wp.media({title:'Select Nogna logo',button:{text:'Use logo'},multiple:false});frame.on('select',()=>{const item=frame.state().get('selection').first().toJSON();update('logo_url',item.url);});frame.open();}}>Choose logo</button></div></label></div><p className="nogna-settings-help">If no logo URL is provided, the brand name and subtitle are displayed as text.</p></section><section className="nogna-settings-card"><h2>Typography and icons</h2><div className="nogna-settings-grid"><label className="nogna-setting-input"><span>Font family</span><select value={draft.font_family} onChange={e=>update('font_family',e.target.value)}><option value="Inter, ui-sans-serif, system-ui, sans-serif">Inter / system sans</option><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option><option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">Mono</option></select></label><SettingInput label="Base font size" value={draft.base_font_size} onChange={v=>update('base_font_size',v)}/><SettingInput label="Heading size" value={draft.heading_font_size} onChange={v=>update('heading_font_size',v)}/><SettingInput label="Navigation size" value={draft.nav_font_size} onChange={v=>update('nav_font_size',v)}/><SettingInput label="Icon size" value={draft.icon_size} onChange={v=>update('icon_size',v)}/><SettingInput label="Icon stroke" value={draft.icon_stroke} onChange={v=>update('icon_stroke',v)}/><SettingInput label="Corner radius" value={draft.radius} onChange={v=>update('radius',v)}/></div></section><section className="nogna-settings-card"><h2>Invoice line-item fields</h2><p className="nogna-settings-help">Choose which fields appear on invoice line items and control their labels.</p><div className="nogna-settings-grid"><label className="nogna-setting-input"><span>Units field</span><select value={draft.invoice_show_units} onChange={e=>update('invoice_show_units',e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></select></label><SettingInput label="Units label" value={draft.invoice_units_label} onChange={v=>update('invoice_units_label',v)}/><label className="nogna-setting-input"><span>Days field</span><select value={draft.invoice_show_days} onChange={e=>update('invoice_show_days',e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></select></label><SettingInput label="Days label" value={draft.invoice_days_label} onChange={v=>update('invoice_days_label',v)}/><label className="nogna-setting-input"><span>Unit amount field</span><select value={draft.invoice_show_unit_amount} onChange={e=>update('invoice_show_unit_amount',e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></select></label><SettingInput label="Unit amount label" value={draft.invoice_unit_amount_label} onChange={v=>update('invoice_unit_amount_label',v)}/></div></section><section className="nogna-settings-card"><h2>Colors</h2><div className="nogna-settings-grid">{colors.map(([key,label])=><label className="nogna-color-field" key={key}><span>{label}</span><input type="color" value={draft[key]} onChange={e=>update(key,e.target.value)}/><input value={draft[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div></section></div>;
}
function SettingInput({label,value,onChange,wide=false}:{label:string;value:string;onChange:(v:string)=>void;wide?:boolean}) { return <label className={'nogna-setting-input'+(wide?' wide':'')}><span>{label}</span><input value={value} onChange={e=>onChange(e.target.value)}/></label>; }

function InvoiceView({company,appearance}:{company:Company|null;appearance:Appearance}) {
  const [invoices,setInvoices]=useState<any[]>([]);
  const [customers,setCustomers]=useState<any[]>([]);
  const [editing,setEditing]=useState<any|null>(null);
  const [message,setMessage]=useState('');
  const [past,setPast]=useState<any[]>([]);
  const [future,setFuture]=useState<any[]>([]);
  const statusLabel=(status:any)=>String(status||'draft').replace('_',' ');
  const emptySection=()=>({name:'',units_multiplier:1,hide_header:false,items:[{description:'',units:1,days:1,unit_cost:0,group_id:'',is_group_parent:false}]});
  const [draft,setDraft]=useState<any>({document_type:'invoice',document_number:'',customer_id:'',currency:company?.base_currency||'USD',issue_date:new Date().toISOString().slice(0,10),discount_percent:0,tax_percent:0,administrative_notes:'',sections:[emptySection()]});
  const [payment,setPayment]=useState({amount:'',payment_date:new Date().toISOString().slice(0,10),payment_method:'Bank transfer',reference:'',notes:''});
  const [showPaymentForm,setShowPaymentForm]=useState(false);
  const [paymentId,setPaymentId]=useState<number|null>(null);
  const [paymentNotice,setPaymentNotice]=useState('');
  const [dragItem,setDragItem]=useState<{section:number;item:number}|null>(null);
  const commitDraft=(next:any)=>{setPast(prev=>[...prev,draft].slice(-50));setFuture([]);setDraft(next);};
  const undo=()=>{if(!past.length)return;const previous=past[past.length-1];setPast(past.slice(0,-1));setFuture([draft,...future]);setDraft(previous);};
  const redo=()=>{if(!future.length)return;const next=future[0];setFuture(future.slice(1));setPast([...past,draft].slice(-50));setDraft(next);};
  const load=()=>{if(!company)return;Promise.all([api('/companies/'+company.id+'/invoices'),api('/companies/'+company.id+'/customers')]).then(([a,b])=>{setInvoices(a.data||[]);setCustomers(b.data||[])}).catch(e=>setMessage(e.message));};
  useEffect(()=>{load();},[company]);
  const start=()=>{setMessage('');setPast([]);setFuture([]);setDraft({document_type:'invoice',document_number:'',customer_id:customers[0]?.id||'',currency:company?.base_currency||'USD',issue_date:new Date().toISOString().slice(0,10),discount_percent:0,tax_percent:0,administrative_notes:'',sections:[emptySection()]});setEditing({new:true});};
  const save=()=>{if(!company||!draft.customer_id){setMessage('Select a customer before saving.');return;}const path=editing?.new?'/companies/'+company.id+'/invoices':'/companies/'+company.id+'/invoices/'+editing.id;api(path,{method:editing?.new?'POST':'PUT',body:JSON.stringify(draft)}).then(r=>{setEditing(r.data);setPast([]);setFuture([]);setDraft(r.data);setMessage('Draft saved');load()}).catch(e=>setMessage(e.message));};
  const resetPaymentForm=()=>{setPaymentId(null);setPayment({amount:'',payment_date:new Date().toISOString().slice(0,10),payment_method:'Bank transfer',reference:'',notes:''});setPaymentNotice('');setShowPaymentForm(false);};
  const editPayment=(item:any)=>{setPaymentId(Number(item.id));setPayment({amount:String(item.amount||''),payment_date:item.payment_date||new Date().toISOString().slice(0,10),payment_method:item.payment_method||'Bank transfer',reference:item.reference||'',notes:item.notes||''});setShowPaymentForm(true);setPaymentNotice('');};
  const recordPayment=()=>{if(!editing||editing.new)return;const amount=Number(payment.amount);if(!amount||amount<=0){setPaymentNotice('Enter a payment amount.');return;}const path='/companies/'+company!.id+'/invoices/'+editing.id+'/payments'+(paymentId?'/'+paymentId:'');api(path,{method:paymentId?'PUT':'POST',body:JSON.stringify(payment)}).then(r=>{setEditing(r.data);setDraft(r.data);setPaymentNotice(paymentId?'Payment updated':'Payment recorded');load()}).catch(e=>setPaymentNotice(e.message));};
  const moveItem=(si:number,from:number,to:number)=>{if(from===to)return;const items=[...draft.sections[si].items];const [moved]=items.splice(from,1);items.splice(to,0,moved);commitDraft({...draft,sections:draft.sections.map((section:any,index:number)=>index===si?{...section,items}:section)});setDragItem(null);};
  const updateSection=(si:number,key:string,value:any)=>commitDraft({...draft,sections:draft.sections.map((s:any,i:number)=>i===si?{...s,[key]:value}:s)});
  const updateItem=(si:number,ii:number,key:string,value:any)=>commitDraft({...draft,sections:draft.sections.map((s:any,i:number)=>i!==si?s:{...s,items:s.items.map((x:any,j:number)=>j===ii?{...x,[key]:value}:x)})});
  const isOwner=(item:any)=>item.is_group_parent===true || Number(item.is_group_parent)===1;
  const sectionSubtotal=(s:any)=>{const groups:any={};let total=0;s.items.forEach((x:any)=>{if(x.group_id && isOwner(x)) groups[x.group_id]=x;});s.items.forEach((x:any)=>{if(x.group_id && groups[x.group_id]) return;total+=(Number(x.units)||0)*(Number(x.days)||0)*(Number(x.unit_cost)||0);});Object.values(groups).forEach((x:any)=>{total+=(Number(x.units)||0)*(Number(x.days)||0)*(Number(x.unit_cost)||0);});return total;};
  const showUnits=appearance.invoice_show_units !== '0';
  const showDays=appearance.invoice_show_days !== '0';
  const showAmount=appearance.invoice_show_unit_amount !== '0';
  const unitsLabel=appearance.invoice_units_label || 'Units';
  const daysLabel=appearance.invoice_days_label || 'Days';
  const amountLabel=appearance.invoice_unit_amount_label || 'Unit amount';
  const baseSubtotal=draft.sections.reduce((sum:number,s:any)=>sum+sectionSubtotal(s)*(Number(s.units_multiplier)||1),0);
  const discountTotal=baseSubtotal*(Number(draft.discount_percent)||0)/100;
  const taxableTotal=baseSubtotal-discountTotal;
  const taxTotal=taxableTotal*(Number(draft.tax_percent)||0)/100;
  const grandTotal=taxableTotal+taxTotal;
  const paidTotal=(draft.payments||[]).reduce((sum:number,p:any)=>sum+(Number(p.amount)||0),0);
  const balanceDue=Math.max(0,grandTotal-paidTotal);
  const money=(value:number)=>`${draft.currency||company?.base_currency||'USD'} ${value.toFixed(2)}`;

  if(!company)return <div className="nogna-placeholder"><h1>Invoices</h1><p>Create a workspace before creating invoices.</p></div>;

  if(editing)return <div className="nogna-invoice-editor">
    <div className="nogna-page-heading">
      <div><p className="nogna-home-eyebrow">INCOME / NEW DOCUMENT</p><h1>{draft.document_type==='quote'?'Quote':'Invoice'} {draft.document_number&&'· '+draft.document_number}</h1></div>
      <div className="nogna-invoice-toolbar"><button className="nogna-secondary-button" disabled={!past.length} onClick={undo}>Undo</button><button className="nogna-secondary-button" disabled={!future.length} onClick={redo}>Redo</button><button className="nogna-secondary-button" onClick={()=>{setEditing(null);setMessage('')}}>Back</button><button className="nogna-save-button" onClick={save}>Save draft</button></div>
    </div>
    {message&&<div className={"nogna-customer-notice "+(/saved/i.test(message) ? "is-success" : "is-error")}>{message}</div>}
    <div className="nogna-settings-card">
      <div className="nogna-panel-heading nogna-document-details-heading"><div><h2>Document details</h2><p className="nogna-settings-help">Choose who this document is for and set its basic billing information.</p></div><div className="nogna-document-status"><small>Payment status</small><strong>{draft.status==='paid'?'Paid':draft.status==='partially_paid'?'Partially paid':draft.status==='overdue'?'Overdue':'Unpaid'}</strong></div></div>
      <div className="nogna-settings-grid">
        <label className="nogna-field"><span>Document type</span><select value={draft.document_type} onChange={e=>commitDraft({...draft,document_type:e.target.value})}><option value="invoice">Invoice</option><option value="quote">Quote</option></select></label>
        <label className="nogna-field"><span>Customer</span><select value={draft.customer_id} onChange={e=>commitDraft({...draft,customer_id:Number(e.target.value)})}><option value="">Select customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="nogna-field"><span>Document number</span><input value={draft.document_number||''} onChange={e=>commitDraft({...draft,document_number:e.target.value})} placeholder="Leave blank for automatic number"/></label>
        <label className="nogna-field"><span>Currency</span><input value={draft.currency} onChange={e=>commitDraft({...draft,currency:e.target.value.toUpperCase()})}/></label>
        <label className="nogna-field"><span>Issue date</span><input type="date" value={draft.issue_date} onChange={e=>commitDraft({...draft,issue_date:e.target.value})}/></label>
        <label className="nogna-field"><span>Payment terms / notes</span><input value={draft.administrative_notes||''} onChange={e=>commitDraft({...draft,administrative_notes:e.target.value})}/></label>
        <label className="nogna-field"><span>Discount percentage</span><input type="number" min="0" max="100" step="1" inputMode="numeric" value={Math.max(0,Math.round(Number(draft.discount_percent)||0))} onChange={e=>commitDraft({...draft,discount_percent:Math.max(0,Math.min(100,parseInt(e.target.value,10)||0))})}/></label>
        <label className="nogna-field"><span>Tax percentage</span><input type="number" min="0" max="100" step="1" inputMode="numeric" value={Math.max(0,Math.round(Number(draft.tax_percent)||0))} onChange={e=>commitDraft({...draft,tax_percent:Math.max(0,Math.min(100,parseInt(e.target.value,10)||0))})}/></label>
      </div>
    </div>
    {draft.sections.map((s:any,si:number)=>{
      const subtotal=sectionSubtotal(s);
      const multiplied=subtotal*(Number(s.units_multiplier)||1);
      return <section className="nogna-settings-card nogna-invoice-section" key={si}>
        <div className="nogna-panel-heading">
          <div><h2>{s.name||`Section ${si+1}`}</h2><p className="nogna-settings-help">Enter the details for this section. Repeat it when the same items apply elsewhere.</p></div>
          <button className="nogna-secondary-button" onClick={()=>commitDraft({...draft,sections:draft.sections.filter((_:any,i:number)=>i!==si)})}>Remove section</button>
        </div>
        <div className="nogna-settings-grid">
          <label className="nogna-field"><span>Section name</span><input value={s.name} onChange={e=>updateSection(si,'name',e.target.value)} placeholder="Example: Design & Strategy"/></label>
          <label className="nogna-field"><span>Hide section header in document</span><select value={s.hide_header ? "1" : "0"} onChange={e=>updateSection(si,"hide_header",e.target.value==="1")}><option value="0">Show section header</option><option value="1">Hide section header</option></select></label><label className="nogna-field"><span>Repeat this section</span><input type="number" min="1" step="1" inputMode="numeric" value={Math.max(1, Math.round(Number(s.units_multiplier)||1))} onChange={e=>updateSection(si,'units_multiplier',Math.max(1, parseInt(e.target.value,10)||1))}/><small className="nogna-field-help">The section subtotal is multiplied by this number.</small></label>
        </div>
        <div className="nogna-group-help">To share one cost across several items, give them the same group name and mark one row as the cost owner. Units and days remain editable for every item.</div>
        <div className="nogna-invoice-table-labels"><span>Item / equipment detail</span><span className={showUnits ? "" : "is-hidden"}>{unitsLabel}</span><span className={showDays ? "" : "is-hidden"}>{daysLabel}</span><span className={showAmount ? "" : "is-hidden"}>{amountLabel}</span><span>Group</span><span>Line total</span><span></span></div>
        {s.items.map((x:any,ii:number)=>{
          const groupItems=x.group_id ? s.items.filter((item:any)=>item.group_id===x.group_id) : [];
          const owner=groupItems.find((item:any)=>isOwner(item));
          const grouped=Boolean(x.group_id && owner);
          const sharedUnits=grouped ? Math.max(0,Math.round(Number(owner.units)||0)) : Math.max(0,Math.round(Number(x.units)||0));
          const sharedDays=grouped ? Number(owner.days)||0 : Number(x.days)||0;
          const sharedAmount=grouped ? Number(owner.unit_cost)||0 : Number(x.unit_cost)||0;
          const line=grouped ? sharedUnits*sharedDays*sharedAmount : (Number(x.units)||0)*(Number(x.days)||0)*(Number(x.unit_cost)||0);
          const ownerIndex=grouped ? s.items.indexOf(owner) : -1;
          const controlsShared=grouped && ownerIndex===ii;
          return <div className={`nogna-invoice-line${grouped ? ' is-grouped' : ''}`} key={ii} draggable onDragStart={()=>setDragItem({section:si,item:ii})} onDragOver={e=>e.preventDefault()} onDrop={()=>dragItem&&dragItem.section===si&&moveItem(si,dragItem.item,ii)}>
            <label><span>Item / equipment</span><input value={x.description} placeholder="Example: Projector" onChange={e=>updateItem(si,ii,'description',e.target.value)}/></label>
            <label className={showUnits ? "" : "is-hidden"}><span>{unitsLabel}</span><input type="number" min="0" step="1" inputMode="numeric" value={Math.max(0,Math.round(Number(x.units)||0))} onChange={e=>updateItem(si,ii,'units',Math.max(0,parseInt(e.target.value,10)||0))}/></label>
            <label className={showDays ? "" : "is-hidden"}><span>{daysLabel}{grouped ? ' (shared)' : ''}</span><input type="number" min="0" step="1" inputMode="numeric" value={sharedDays} disabled={grouped && !controlsShared} title={grouped && !controlsShared ? 'Controlled by the cost owner' : undefined} onChange={e=>updateItem(si,ii,'days',Math.max(0,parseInt(e.target.value,10)||0))}/></label>
            <label className={showAmount ? "" : "is-hidden"}><span>{amountLabel}{grouped ? ' (shared)' : ''}</span><input type="number" min="0" step="0.01" value={sharedAmount} disabled={grouped && !controlsShared} title={grouped && !controlsShared ? 'Controlled by the cost owner' : undefined} onChange={e=>updateItem(si,ii,'unit_cost',Number(e.target.value))}/></label>
            <label><span>Group name</span><input value={x.group_id||''} placeholder="Optional" onChange={e=>updateItem(si,ii,'group_id',e.target.value)}/><small><input type="checkbox" checked={isOwner(x)} onChange={e=>updateItem(si,ii,'is_group_parent',e.target.checked)}/> Cost owner</small></label>
            <strong className="nogna-line-total">{money(line)}</strong>
            <button className="nogna-secondary-button" aria-label="Remove item" onClick={()=>updateSection(si,'items',s.items.filter((_:any,j:number)=>j!==ii))}>×</button>
          </div>;
        })}
        <button className="nogna-create-company" onClick={()=>updateSection(si,'items',[...s.items,{description:'',units:1,days:1,unit_cost:0,group_id:'',is_group_parent:false}])}>＋ Add item / equipment</button>
        <div className="nogna-section-total"><span>Section subtotal: <strong>{money(subtotal)}</strong></span><span>× {Number(s.units_multiplier)||1} identical section{Number(s.units_multiplier)===1?'':'s'} = <strong>{money(multiplied)}</strong></span></div>
      </section>;
    })}
    <button className="nogna-create-company" onClick={()=>commitDraft({...draft,sections:[...draft.sections,emptySection()]})}>＋ Add another section</button>
    <div className="nogna-invoice-totals"><div><span>Subtotal</span><strong>{money(baseSubtotal)}</strong></div><div><span>Discount</span><strong>- {money(discountTotal)}</strong></div><div><span>Tax</span><strong>{money(taxTotal)}</strong></div><div className="is-grand-total"><span>Grand total</span><strong>{money(grandTotal)}</strong></div></div>
    {editing&&!editing.new&&<section className="nogna-settings-card nogna-payment-card">
      <div className="nogna-panel-heading"><div><h2>Payments</h2><p className="nogna-settings-help">Record payments received for this invoice.</p></div><button className="nogna-save-button" onClick={()=>{setShowPaymentForm(true);setPaymentNotice('')}}>{showPaymentForm?'Add another payment':'Record payment'}</button></div>
      <div className="nogna-payment-summary"><div><span>Invoice total</span><strong>{money(grandTotal)}</strong></div><div><span>Paid</span><strong>{money(paidTotal)}</strong></div><div><span>Balance due</span><strong>{money(balanceDue)}</strong></div></div>
      {showPaymentForm&&<div className="nogna-payment-form-wrap"><div className="nogna-payment-form-header"><strong>{paymentId?'Update payment':'Record payment'}</strong><button className="nogna-icon-button" aria-label="Close payment form" onClick={resetPaymentForm}>×</button></div>{paymentNotice&&<div className={"nogna-customer-notice "+(/recorded|updated/i.test(paymentNotice)?'is-success':'is-error')}>{paymentNotice}</div>}<div className="nogna-payment-form">
        <label className="nogna-field"><span>Amount received</span><input id="nogna-payment-amount" type="number" min="0.01" step="0.01" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/></label>
        <label className="nogna-field"><span>Payment date</span><input type="date" value={payment.payment_date} onChange={e=>setPayment({...payment,payment_date:e.target.value})}/></label>
        <label className="nogna-field"><span>Payment method</span><select value={payment.payment_method} onChange={e=>setPayment({...payment,payment_method:e.target.value})}><option>Bank transfer</option><option>Cash</option><option>Mobile money</option><option>Card</option><option>Other</option></select></label>
        <label className="nogna-field"><span>Reference</span><input value={payment.reference} onChange={e=>setPayment({...payment,reference:e.target.value})} placeholder="Optional reference"/></label>
        <label className="nogna-field"><span>Notes</span><input value={payment.notes} onChange={e=>setPayment({...payment,notes:e.target.value})} placeholder="Optional note"/></label>
        <div className="nogna-form-actions"><button className="nogna-secondary-button" onClick={resetPaymentForm}>Cancel</button><button className="nogna-save-button" onClick={recordPayment}>{paymentId?'Update payment':'Save payment'}</button></div>
      </div></div>}
      {Array.isArray(draft.payments)&&draft.payments.length>0&&<div className="nogna-payment-history"><h3>Payment history</h3>{draft.payments.filter((p:any)=>!paymentId || Number(p.id)!==paymentId).map((p:any)=><div className="nogna-payment-row" key={p.id} onClick={()=>editPayment(p)}><span>{p.payment_date}<small>{p.payment_method}{p.reference?' · '+p.reference:''}</small></span><strong>{money(Number(p.amount)||0)}</strong><span className="nogna-payment-actions"><button aria-label="Edit payment" title="Edit payment" onClick={e=>{e.stopPropagation();editPayment(p)}}><Pencil size={16}/></button><button aria-label="Delete payment" title="Delete payment" onClick={e=>{e.stopPropagation();if(!window.confirm('Delete this payment?'))return;api('/companies/'+company!.id+'/invoices/'+editing!.id+'/payments/'+p.id,{method:'DELETE'}).then(r=>{setEditing(r.data);setDraft(r.data);setPaymentNotice('Payment deleted');setShowPaymentForm(false);load()}).catch(e=>setPaymentNotice(e.message))}}><Trash2 size={16}/></button></span></div>)}</div>}
    </section>}
    <div className="nogna-invoice-bottom-actions"><button className="nogna-secondary-button" onClick={()=>{setEditing(null);setMessage('')}}>Back</button><button className="nogna-save-button" onClick={save}>Save draft</button></div>
  </div>;

  return <div className="nogna-invoice-list"><div className="nogna-page-heading"><div><p className="nogna-home-eyebrow">INCOME</p><h1>Invoices</h1></div><button className="nogna-save-button" onClick={start}>＋ New invoice</button></div>{message&&<div className={"nogna-customer-notice "+(/saved|updated|created|trash/i.test(message) ? "is-success" : "is-error")}>{message}</div>}<div className="nogna-settings-card nogna-invoice-table">{invoices.length?<>{invoices.map(inv=><button className="nogna-invoice-row" key={inv.id} onClick={()=>{setPast([]);setFuture([]);setDraft({...inv,sections:inv.sections||[emptySection()]});setEditing(inv)}}><span><strong>{inv.invoice_number}</strong><small>{inv.customer_name||'No customer'}</small></span><span>{inv.currency} {Number(inv.total||0).toFixed(2)}</span><em>{statusLabel(inv.status)}</em></button>)}</>:<div className="nogna-empty-state"><p>No invoices yet. Create the first draft from this screen.</p></div>}</div></div>;
}
