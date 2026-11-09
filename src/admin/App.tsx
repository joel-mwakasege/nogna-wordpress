import { useEffect, useState } from 'react';
import { Building2, FileText, ChevronDown, ChevronLeft, CircleUserRound, HelpCircle, Home, Settings, UsersRound } from 'lucide-react';

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
  success_color:'#35b97b', border_color:'#363636', radius:'10px', logo_url:'', brand_name:'NOGNA', brand_subtitle:'Billing'
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
        {section === 'invoices' && <InvoiceView company={selected}/>}
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
  return <div className="nogna-settings-page"><div className="nogna-settings-heading"><div><h1>Settings</h1><p>Control Nogna’s appearance without editing code.</p></div>{status&&<div className={'nogna-settings-notice '+(status==='Saved'?'is-success':'is-error')} role="status">{status}</div>}<button className="nogna-save-button" onClick={save}>Save changes</button></div><section className="nogna-settings-card"><h2>Brand identity</h2><div className="nogna-settings-grid"><SettingInput label="Brand name" value={draft.brand_name} onChange={v=>update('brand_name',v)}/><SettingInput label="Subtitle" value={draft.brand_subtitle} onChange={v=>update('brand_subtitle',v)}/><label className="nogna-setting-input wide"><span>Logo</span><div className="nogna-logo-picker"><input value={draft.logo_url} onChange={e=>update('logo_url',e.target.value)} placeholder="Select a logo from the Media Library"/><button type="button" onClick={()=>{if(!window.wp?.media){setStatus('Media Library unavailable');return;}const frame=window.wp.media({title:'Select Nogna logo',button:{text:'Use logo'},multiple:false});frame.on('select',()=>{const item=frame.state().get('selection').first().toJSON();update('logo_url',item.url);});frame.open();}}>Choose logo</button></div></label></div><p className="nogna-settings-help">If no logo URL is provided, the brand name and subtitle are displayed as text.</p></section><section className="nogna-settings-card"><h2>Typography and icons</h2><div className="nogna-settings-grid"><label className="nogna-setting-input"><span>Font family</span><select value={draft.font_family} onChange={e=>update('font_family',e.target.value)}><option value="Inter, ui-sans-serif, system-ui, sans-serif">Inter / system sans</option><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option><option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">Mono</option></select></label><SettingInput label="Base font size" value={draft.base_font_size} onChange={v=>update('base_font_size',v)}/><SettingInput label="Heading size" value={draft.heading_font_size} onChange={v=>update('heading_font_size',v)}/><SettingInput label="Navigation size" value={draft.nav_font_size} onChange={v=>update('nav_font_size',v)}/><SettingInput label="Icon size" value={draft.icon_size} onChange={v=>update('icon_size',v)}/><SettingInput label="Icon stroke" value={draft.icon_stroke} onChange={v=>update('icon_stroke',v)}/><SettingInput label="Corner radius" value={draft.radius} onChange={v=>update('radius',v)}/></div></section><section className="nogna-settings-card"><h2>Colors</h2><div className="nogna-settings-grid">{colors.map(([key,label])=><label className="nogna-color-field" key={key}><span>{label}</span><input type="color" value={draft[key]} onChange={e=>update(key,e.target.value)}/><input value={draft[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div></section></div>;
}
function SettingInput({label,value,onChange,wide=false}:{label:string;value:string;onChange:(v:string)=>void;wide?:boolean}) { return <label className={'nogna-setting-input'+(wide?' wide':'')}><span>{label}</span><input value={value} onChange={e=>onChange(e.target.value)}/></label>; }

function InvoiceView({company}:{company:Company|null}) {
  const [invoices,setInvoices]=useState<any[]>([]);
  const [customers,setCustomers]=useState<any[]>([]);
  const [editing,setEditing]=useState<any|null>(null);
  const [message,setMessage]=useState('');
  const emptySection=()=>({name:'',units_multiplier:1,hide_header:false,items:[{description:'',units:1,days:1,unit_cost:0}]});
  const [draft,setDraft]=useState<any>({document_type:'invoice',document_number:'',customer_id:'',currency:company?.base_currency||'USD',issue_date:new Date().toISOString().slice(0,10),discount_percent:0,tax_percent:0,administrative_notes:'',sections:[emptySection()]});
  const load=()=>{if(!company)return;Promise.all([api('/companies/'+company.id+'/invoices'),api('/companies/'+company.id+'/customers')]).then(([a,b])=>{setInvoices(a.data||[]);setCustomers(b.data||[])}).catch(e=>setMessage(e.message));};
  useEffect(()=>{load();},[company]);
  const start=()=>{setMessage('');setDraft({document_type:'invoice',document_number:'',customer_id:customers[0]?.id||'',currency:company?.base_currency||'USD',issue_date:new Date().toISOString().slice(0,10),discount_percent:0,tax_percent:0,administrative_notes:'',sections:[emptySection()]});setEditing({new:true});};
  const save=()=>{if(!company||!draft.customer_id){setMessage('Select a customer before saving.');return;}const path=editing?.new?'/companies/'+company.id+'/invoices':'/companies/'+company.id+'/invoices/'+editing.id;api(path,{method:editing?.new?'POST':'PUT',body:JSON.stringify(draft)}).then(r=>{setEditing(r.data);setDraft(r.data);setMessage('Draft saved');load()}).catch(e=>setMessage(e.message));};
  const updateSection=(si:number,key:string,value:any)=>setDraft({...draft,sections:draft.sections.map((s:any,i:number)=>i===si?{...s,[key]:value}:s)});
  const updateItem=(si:number,ii:number,key:string,value:any)=>setDraft({...draft,sections:draft.sections.map((s:any,i:number)=>i!==si?s:{...s,items:s.items.map((x:any,j:number)=>j===ii?{...x,[key]:value}:x)})});
  const sectionSubtotal=(s:any)=>s.items.reduce((sum:number,x:any)=>sum+(Number(x.units)||0)*(Number(x.days)||0)*(Number(x.unit_cost)||0),0);
  const money=(value:number)=>`${draft.currency||company?.base_currency||'USD'} ${value.toFixed(2)}`;

  if(!company)return <div className="nogna-placeholder"><h1>Invoices</h1><p>Create a workspace before creating invoices.</p></div>;

  if(editing)return <div className="nogna-invoice-editor">
    <div className="nogna-page-heading">
      <div><p className="nogna-home-eyebrow">INCOME / NEW DOCUMENT</p><h1>{draft.document_type==='quote'?'Quote':'Invoice'} {draft.document_number&&'· '+draft.document_number}</h1></div>
      <div className="nogna-form-actions"><button className="nogna-secondary-button" onClick={()=>setEditing(null)}>Back</button><button className="nogna-save-button" onClick={save}>Save draft</button></div>
    </div>
    {message&&<div className="nogna-customer-notice is-success">{message}</div>}
    <div className="nogna-settings-card">
      <h2>Document details</h2>
      <p className="nogna-settings-help">Choose who this document is for and set its basic billing information.</p>
      <div className="nogna-settings-grid">
        <label className="nogna-field"><span>Document type</span><select value={draft.document_type} onChange={e=>setDraft({...draft,document_type:e.target.value})}><option value="invoice">Invoice</option><option value="quote">Quote</option></select></label>
        <label className="nogna-field"><span>Customer</span><select value={draft.customer_id} onChange={e=>setDraft({...draft,customer_id:Number(e.target.value)})}><option value="">Select customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="nogna-field"><span>Document number</span><input value={draft.document_number||''} onChange={e=>setDraft({...draft,document_number:e.target.value})} placeholder="Leave blank for automatic number"/></label>
        <label className="nogna-field"><span>Currency</span><input value={draft.currency} onChange={e=>setDraft({...draft,currency:e.target.value.toUpperCase()})}/></label>
        <label className="nogna-field"><span>Issue date</span><input type="date" value={draft.issue_date} onChange={e=>setDraft({...draft,issue_date:e.target.value})}/></label>
        <label className="nogna-field"><span>Payment terms / notes</span><input value={draft.administrative_notes||''} onChange={e=>setDraft({...draft,administrative_notes:e.target.value})}/></label>
        <label className="nogna-field"><span>Discount percentage</span><input type="number" min="0" step="0.01" value={draft.discount_percent||0} onChange={e=>setDraft({...draft,discount_percent:Number(e.target.value)})}/></label>
        <label className="nogna-field"><span>Tax percentage</span><input type="number" min="0" step="0.01" value={draft.tax_percent||0} onChange={e=>setDraft({...draft,tax_percent:Number(e.target.value)})}/></label>
      </div>
    </div>
    {draft.sections.map((s:any,si:number)=>{
      const subtotal=sectionSubtotal(s);
      const multiplied=subtotal*(Number(s.units_multiplier)||1);
      return <section className="nogna-settings-card nogna-invoice-section" key={si}>
        <div className="nogna-panel-heading">
          <div><h2>{s.name||`Room / section ${si+1}`}</h2><p className="nogna-settings-help">Enter the details once for this room or repeated area.</p></div>
          <button className="nogna-secondary-button" onClick={()=>setDraft({...draft,sections:draft.sections.filter((_:any,i:number)=>i!==si)})}>Remove section</button>
        </div>
        <div className="nogna-settings-grid">
          <label className="nogna-field"><span>Room / section name</span><input value={s.name} onChange={e=>updateSection(si,'name',e.target.value)} placeholder="Example: Room 1"/></label>
          <label className="nogna-field"><span>How many identical rooms?</span><input type="number" min="1" step="1" value={s.units_multiplier} onChange={e=>updateSection(si,'units_multiplier',Number(e.target.value))}/><small className="nogna-field-help">The room subtotal is multiplied by this number.</small></label>
        </div>
        <div className="nogna-invoice-table-labels"><span>Item / equipment detail</span><span>Units</span><span>Days</span><span>Unit amount</span><span>Line total</span><span></span></div>
        {s.items.map((x:any,ii:number)=>{
          const line=(Number(x.units)||0)*(Number(x.days)||0)*(Number(x.unit_cost)||0);
          return <div className="nogna-invoice-line" key={ii}>
            <label><span>Item / equipment</span><input value={x.description} placeholder="Example: Projector" onChange={e=>updateItem(si,ii,'description',e.target.value)}/></label>
            <label><span>Units</span><input type="number" min="0" step="0.01" value={x.units} onChange={e=>updateItem(si,ii,'units',Number(e.target.value))}/></label>
            <label><span>Days</span><input type="number" min="0" step="0.01" value={x.days} onChange={e=>updateItem(si,ii,'days',Number(e.target.value))}/></label>
            <label><span>Unit amount</span><input type="number" min="0" step="0.01" value={x.unit_cost} onChange={e=>updateItem(si,ii,'unit_cost',Number(e.target.value))}/></label>
            <strong className="nogna-line-total">{money(line)}</strong>
            <button className="nogna-secondary-button" aria-label="Remove item" onClick={()=>updateSection(si,'items',s.items.filter((_:any,j:number)=>j!==ii))}>×</button>
          </div>;
        })}
        <button className="nogna-create-company" onClick={()=>updateSection(si,'items',[...s.items,{description:'',units:1,days:1,unit_cost:0}])}>＋ Add item / equipment</button>
        <div className="nogna-section-total"><span>Room subtotal: <strong>{money(subtotal)}</strong></span><span>× {Number(s.units_multiplier)||1} identical room{Number(s.units_multiplier)===1?'':'s'} = <strong>{money(multiplied)}</strong></span></div>
      </section>;
    })}
    <button className="nogna-create-company" onClick={()=>setDraft({...draft,sections:[...draft.sections,emptySection()]})}>＋ Add another room / section</button>
  </div>;

  return <div className="nogna-invoice-list"><div className="nogna-page-heading"><div><p className="nogna-home-eyebrow">INCOME</p><h1>Invoices</h1></div><button className="nogna-save-button" onClick={start}>＋ New invoice</button></div>{message&&<div className="nogna-customer-notice is-error">{message}</div>}<div className="nogna-settings-card nogna-invoice-table">{invoices.length?<>{invoices.map(inv=><button className="nogna-invoice-row" key={inv.id} onClick={()=>{setDraft({...inv,sections:inv.sections||[emptySection()]});setEditing(inv)}}><span><strong>{inv.invoice_number}</strong><small>{inv.customer_name||'No customer'}</small></span><span>{inv.currency} {Number(inv.total||0).toFixed(2)}</span><em>{inv.status}</em></button>)}</>:<div className="nogna-empty-state"><p>No invoices yet. Create the first draft from this screen.</p></div>}</div></div>;
}
