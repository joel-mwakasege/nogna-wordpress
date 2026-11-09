import { useEffect, useState } from 'react';
import { Building2, ChevronDown, ChevronLeft, CircleUserRound, HelpCircle, Home, Settings, UsersRound } from 'lucide-react';

type Company = { id: number; name: string; slug: string; base_currency: string; timezone: string; role?: string };
declare global { interface Window { NognaReact?: { restUrl: string; nonce: string } } }

const api = (path: string, options: RequestInit = {}) => fetch((window.NognaReact?.restUrl || '') + path, {
  credentials: 'include',
  ...options,
  headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.NognaReact?.nonce || '', ...(options.headers || {}) }
}).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
});

export default function App() {
  const [section, setSection] = useState<'home' | 'company' | 'customers'>('company');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api('/companies').then((response) => {
      const list = response.data || [];
      setCompanies(list);
      setSelected(list[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  const title = section === 'company' ? 'My Company' : section === 'customers' ? 'Customers' : 'Home';

  return (
    <div className={'nogna-app' + (collapsed ? ' is-sidebar-collapsed' : '')}>
      <header className="nogna-app-header">
        <div className="nogna-header-title">
          <button className="nogna-sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <ChevronLeft size={18} />
          </button>
          <Building2 size={17} />
          <span>{title}</span>
        </div>
        <div className="nogna-header-actions"><HelpCircle size={17} /><CircleUserRound size={17} /></div>
      </header>
      <div className="nogna-app-body">
        <aside className="nogna-app-sidebar">
          <div className="nogna-logo"><span>↗</span><div>NOGNA<small>Billing</small></div></div>
          <button className={section === 'home' ? 'is-active' : ''} onClick={() => setSection('home')}><Home size={18} /><span className="nogna-nav-text">Home</span></button>
          <div className="nogna-sidebar-label">MASTER DATA</div>
          <button className={section === 'customers' ? 'is-active' : ''} onClick={() => setSection('customers')}><UsersRound size={18} /><span className="nogna-nav-text">Customers</span></button>
          <button className={section === 'company' ? 'is-active' : ''} onClick={() => setSection('company')}><Building2 size={18} /><span className="nogna-nav-text">My Company</span></button>
          <div className="nogna-company-account">
            <button className="nogna-company-switcher" onClick={() => setSection('company')}>
              <span className="nogna-company-avatar">{selected?.name?.charAt(0) || 'N'}</span>
              <span className="nogna-nav-text"><small>Workspace</small><strong>{selected?.name || 'No workspace'}</strong></span><ChevronDown size={15} />
            </button>
            <div className="nogna-account-tools"><button><Settings size={16} /><span className="nogna-nav-text">Settings</span></button><span className="nogna-online"></span><CircleUserRound size={17} /></div>
          </div>
        </aside>
        <main className="nogna-app-main">
          {section === 'company' && <CompanyView companies={companies} selected={selected} setSelected={setSelected} loading={loading} />}
          {section === 'customers' && <Placeholder title="Customers" text="Customer management will use this same application shell." />}
          {section === 'home' && <Placeholder title="Home" text="The overview will be rebuilt inside this shell as financial modules are implemented." />}
        </main>
      </div>
    </div>
  );
}

function CompanyView({ companies, selected, setSelected, loading }: { companies: Company[]; selected: Company | null; setSelected: (company: Company) => void; loading: boolean }) {
  return <div className="nogna-company-view">
    <aside className="nogna-company-list">
      <div className="nogna-list-title">MY COMPANIES</div>
      {loading && <div className="nogna-list-empty">Loading companies…</div>}
      {!loading && companies.map((company) => <button key={company.id} className={'nogna-company-row ' + (selected?.id === company.id ? 'is-selected' : '')} onClick={() => setSelected(company)}>
        <span className="nogna-company-avatar">{company.name.charAt(0)}</span><span><strong>{company.name}</strong><small>{company.timezone}</small></span><span className="nogna-more">⋮</span>
      </button>)}
      {!loading && !companies.length && <div className="nogna-list-empty">No companies yet.</div>}
      <button className="nogna-create-company" type="button">＋ Create company</button>
    </aside>
    <section className="nogna-company-detail">
      <div className="nogna-company-title"><div className="nogna-company-heading"><span className="nogna-company-avatar large">{selected?.name?.charAt(0) || 'N'}</span><div><h1>{selected?.name || 'My Company'}</h1><p>Active profile</p></div><ChevronDown size={17}/></div><span className="nogna-more">⋮</span></div>
      <nav className="nogna-tabs"><button className="is-active">Company</button><button disabled>Address</button><button disabled>Contact</button><button disabled>History</button></nav>
      <div className="nogna-company-fields">
        <Field label="Company name" value={selected?.name || ''} required /><Field label="Workspace slug" value={selected?.slug || ''} />
        <Field label="Base currency" value={selected?.base_currency || ''} /><Field label="Timezone" value={selected?.timezone || ''} />
        <Field label="Workspace owner" value={selected?.role === 'owner' ? 'Owner' : ''} />
      </div>
    </section>
  </div>;
}

function Field({ label, value, required }: { label: string; value: string; required?: boolean }) {
  return <label className="nogna-field"><span>{label}{required && <em> *</em>}</span><input value={value} readOnly /></label>;
}
function Placeholder({ title, text }: { title: string; text: string }) {
  return <div className="nogna-placeholder"><h1>{title}</h1><p>{text}</p></div>;
}
