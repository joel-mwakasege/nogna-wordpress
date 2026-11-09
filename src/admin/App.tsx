import { useEffect, useState } from 'react';
import { Building2, ChevronDown, ChevronLeft, CircleUserRound, HelpCircle, Home, Settings, UsersRound } from 'lucide-react';

type Section = 'home' | 'company' | 'customers' | 'settings';
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    Promise.all([api('/companies'), api('/settings/appearance').catch(() => ({data: defaults}))]).then(([companiesResponse, appearanceResponse]) => {
      const list = companiesResponse.data || [];
      const settings = {...defaults, ...(appearanceResponse.data || {})};
      setCompanies(list); setSelected(list[0] || null); setAppearance(settings); applyAppearance(settings);
    }).finally(() => setLoading(false));
  }, []);

  const title = section === 'company' ? 'My Company' : section === 'customers' ? 'Customers' : section === 'settings' ? 'Settings' : 'Home';
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
        <button className={section === 'company' ? 'is-active' : ''} onClick={() => navigate('company')}><Building2 size={18}/><span className="nogna-nav-text">My Company</span></button>
        <div className="nogna-company-account">
          <button className="nogna-company-switcher" onClick={() => navigate('company')}><span className="nogna-company-avatar">{selected?.name?.charAt(0) || 'N'}</span><span className="nogna-nav-text"><small>Workspace</small><strong>{selected?.name || 'No workspace'}</strong></span><ChevronDown size={15}/></button>
          <div className="nogna-account-tools"><button onClick={() => navigate('settings')}><Settings size={16}/><span className="nogna-nav-text">Settings</span></button><span className="nogna-online"></span><CircleUserRound size={17}/></div>
        </div>
      </aside>
      <main className="nogna-app-main">
        {section === 'company' && <CompanyView companies={companies} selected={selected} setSelected={setSelected} loading={loading}/>}
        {section === 'customers' && <CustomerView company={selected}/>}
        {section === 'home' && <Placeholder title="Home" text="The overview will be rebuilt inside this shell as financial modules are implemented."/>}
        {section === 'settings' && <SettingsView value={appearance} onChange={(next) => {setAppearance(next); applyAppearance(next);}}/>}
      </main>
    </div>
  </div>;
}

function CompanyView({companies,selected,setSelected,loading}:{companies:Company[];selected:Company|null;setSelected:(c:Company)=>void;loading:boolean}) {
  return <div className="nogna-company-view"><aside className="nogna-company-list"><div className="nogna-list-title">MY COMPANIES</div>{loading&&<div className="nogna-list-empty">Loading companies…</div>}{!loading&&companies.map(c=><button key={c.id} className={'nogna-company-row '+(selected?.id===c.id?'is-selected':'')} onClick={()=>setSelected(c)}><span className="nogna-company-avatar">{c.name.charAt(0)}</span><span><strong>{c.name}</strong><small>{c.timezone}</small></span><span className="nogna-more">⋮</span></button>)}{!loading&&!companies.length&&<div className="nogna-list-empty">No companies yet.</div>}<button className="nogna-create-company">＋ Create company</button></aside><section className="nogna-company-detail"><div className="nogna-company-title"><div className="nogna-company-heading"><span className="nogna-company-avatar large">{selected?.name?.charAt(0)||'N'}</span><div><h1>{selected?.name||'My Company'}</h1><p>Active profile</p></div><ChevronDown size={17}/></div><span className="nogna-more">⋮</span></div><nav className="nogna-tabs"><button className="is-active">Company</button><button disabled>Address</button><button disabled>Contact</button><button disabled>History</button></nav><div className="nogna-company-fields"><Field label="Company name" value={selected?.name||''} required/><Field label="Workspace slug" value={selected?.slug||''}/><Field label="Base currency" value={selected?.base_currency||''}/><Field label="Timezone" value={selected?.timezone||''}/><Field label="Workspace owner" value={selected?.role==='owner'?'Owner':''}/></div></section></div>;
}
function Field({label,value,required}:{label:string;value:string;required?:boolean}) { return <label className="nogna-field"><span>{label}{required&&<em> *</em>}</span><input value={value} readOnly/></label>; }
function Placeholder({title,text}:{title:string;text:string}) { return <div className="nogna-placeholder"><h1>{title}</h1><p>{text}</p></div>; }

function CustomerView({company}:{company:Company|null}) {
  const [customers,setCustomers]=useState<any[]>([]);
  const [search,setSearch]=useState('');
  const [selectedCustomer,setSelectedCustomer]=useState<any|null>(null);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:'',email:'',phone:'',tax_number:'',notes:''});
  const [message,setMessage]=useState('');
  useEffect(()=>{if(!company)return;api('/companies/'+company.id+'/customers').then(r=>{setCustomers(r.data||[]);setSelectedCustomer((r.data||[])[0]||null)}).catch(e=>setMessage(e.message))},[company]);
  const visible=customers.filter(c=>(c.name+' '+(c.email||'')).toLowerCase().includes(search.toLowerCase()));
  const save=()=>{if(!company)return;api('/companies/'+company.id+'/customers',{method:'POST',body:JSON.stringify(form)}).then(r=>{setCustomers([r.data,...customers]);setSelectedCustomer(r.data);setShowForm(false);setForm({name:'',email:'',phone:'',tax_number:'',notes:''});setMessage('Customer created')}).catch(e=>setMessage(e.message))};
  if(!company)return <div className="nogna-placeholder"><h1>Customers</h1><p>Create a workspace before adding customers.</p></div>;
  return <div className="nogna-customer-view"><aside className="nogna-customer-list"><div className="nogna-list-title">CUSTOMERS <button className="nogna-list-add" onClick={()=>setShowForm(true)}>＋</button></div><input className="nogna-customer-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..."/><div className="nogna-customer-rows">{visible.map(c=><button key={c.id} className={'nogna-customer-row '+(selectedCustomer?.id===c.id?'is-selected':'')} onClick={()=>setSelectedCustomer(c)}><span className="nogna-company-avatar">{c.name.charAt(0)}</span><span><strong>{c.name}</strong><small>{c.email||'No email'}</small></span></button>)}{!visible.length&&<div className="nogna-list-empty">No customers yet.</div>}</div><button className="nogna-create-company" onClick={()=>setShowForm(true)}>＋ Create customer</button></aside><section className="nogna-customer-detail">{message&&<div className={'nogna-customer-notice '+(message==='Customer created'?'is-success':'is-error')} role="status">{message}</div>}{showForm?<div className="nogna-customer-form"><h1>Add customer</h1>{['name','email','phone','tax_number','notes'].map(key=><label className="nogna-field" key={key}><span>{key.replace('_',' ')}</span>{key==='notes'?<textarea rows={4} value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>:<input value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}<div className="nogna-form-actions"><button className="nogna-secondary-button" onClick={()=>setShowForm(false)}>Cancel</button><button className="nogna-save-button" onClick={save}>Save customer</button></div></div>:selectedCustomer?<><div className="nogna-company-title"><div className="nogna-company-heading"><span className="nogna-company-avatar large">{selectedCustomer.name.charAt(0)}</span><div><h1>{selectedCustomer.name}</h1><p>Customer · Active</p></div></div></div><nav className="nogna-tabs"><button className="is-active">Master data</button><button disabled>Address</button><button disabled>History</button></nav><div className="nogna-company-fields"><Field label="Customer name" value={selectedCustomer.name}/><Field label="Email" value={selectedCustomer.email||''}/><Field label="Phone" value={selectedCustomer.phone||''}/><Field label="Tax number" value={selectedCustomer.tax_number||''}/></div></>:<div className="nogna-empty-state"><p>Select a customer or create one.</p></div>}</section></div>;
}

function SettingsView({value,onChange}:{value:Appearance;onChange:(v:Appearance)=>void}) {
  const [draft,setDraft]=useState(value); const [status,setStatus]=useState('');
  useEffect(()=>setDraft(value),[value]);
  const update=(key:string,val:string)=>setDraft({...draft,[key]:val});
  const save=()=>api('/settings/appearance',{method:'POST',body:JSON.stringify({settings:draft})}).then(r=>{onChange(r.data);setStatus('Saved');setTimeout(()=>setStatus(''),1800)}).catch(e=>setStatus(e.message));
  const colors=[['canvas_color','App background'],['sidebar_color','Sidebar'],['panel_color','Panels'],['text_color','Text'],['muted_color','Muted text'],['accent_color','Accent'],['success_color','Success'],['border_color','Borders']];
  return <div className="nogna-settings-page"><div className="nogna-settings-heading"><div><h1>Settings</h1><p>Control Nogna’s appearance without editing code.</p></div><button className="nogna-save-button" onClick={save}>{status||'Save changes'}</button></div><section className="nogna-settings-card"><h2>Brand identity</h2><div className="nogna-settings-grid"><SettingInput label="Brand name" value={draft.brand_name} onChange={v=>update('brand_name',v)}/><SettingInput label="Subtitle" value={draft.brand_subtitle} onChange={v=>update('brand_subtitle',v)}/><label className="nogna-setting-input wide"><span>Logo</span><div className="nogna-logo-picker"><input value={draft.logo_url} onChange={e=>update('logo_url',e.target.value)} placeholder="Select a logo from the Media Library"/><button type="button" onClick={()=>{if(!window.wp?.media){setStatus('Media Library unavailable');return;}const frame=window.wp.media({title:'Select Nogna logo',button:{text:'Use logo'},multiple:false});frame.on('select',()=>{const item=frame.state().get('selection').first().toJSON();update('logo_url',item.url);});frame.open();}}>Choose logo</button></div></label></div><p className="nogna-settings-help">If no logo URL is provided, the brand name and subtitle are displayed as text.</p></section><section className="nogna-settings-card"><h2>Typography and icons</h2><div className="nogna-settings-grid"><label className="nogna-setting-input"><span>Font family</span><select value={draft.font_family} onChange={e=>update('font_family',e.target.value)}><option value="Inter, ui-sans-serif, system-ui, sans-serif">Inter / system sans</option><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option><option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">Mono</option></select></label><SettingInput label="Base font size" value={draft.base_font_size} onChange={v=>update('base_font_size',v)}/><SettingInput label="Heading size" value={draft.heading_font_size} onChange={v=>update('heading_font_size',v)}/><SettingInput label="Navigation size" value={draft.nav_font_size} onChange={v=>update('nav_font_size',v)}/><SettingInput label="Icon size" value={draft.icon_size} onChange={v=>update('icon_size',v)}/><SettingInput label="Icon stroke" value={draft.icon_stroke} onChange={v=>update('icon_stroke',v)}/><SettingInput label="Corner radius" value={draft.radius} onChange={v=>update('radius',v)}/></div></section><section className="nogna-settings-card"><h2>Colors</h2><div className="nogna-settings-grid">{colors.map(([key,label])=><label className="nogna-color-field" key={key}><span>{label}</span><input type="color" value={draft[key]} onChange={e=>update(key,e.target.value)}/><input value={draft[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div></section></div>;
}
function SettingInput({label,value,onChange,wide=false}:{label:string;value:string;onChange:(v:string)=>void;wide?:boolean}) { return <label className={'nogna-setting-input'+(wide?' wide':'')}><span>{label}</span><input value={value} onChange={e=>onChange(e.target.value)}/></label>; }
