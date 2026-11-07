(function () {
  'use strict';

  const state = { companyId: null, customers: [], editingId: null, onboardingStep: 'welcome' };
  const config = window.NognaDashboard || {};
  const $ = (selector) => document.querySelector(selector);
  const cacheKey = (name, id) => 'nogna:' + name + ':' + (id || 'all');
  const readCache = (name, id) => { try { return JSON.parse(localStorage.getItem(cacheKey(name, id)) || 'null'); } catch (error) { return null; } };
  const writeCache = (name, id, value) => { try { localStorage.setItem(cacheKey(name, id), JSON.stringify(value)); } catch (error) {} };

  const api = (path, options = {}) => fetch(config.restUrl + path, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce, ...(options.headers || {}) }
  }).then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Request failed.');
    return body;
  });

  function showOnboarding(step) {
    state.onboardingStep = step;
    document.querySelectorAll('[data-onboarding-step]').forEach((item) => item.classList.toggle('is-active', item.dataset.onboardingStep === step));
    const order = ['welcome', 'identity', 'contact'];
    const index = order.indexOf(step);
    document.querySelectorAll('.nogna-progress i').forEach((dot, position) => dot.classList.toggle('is-active', position <= index));
    $('#nogna-dashboard').classList.add('onboarding-active');
  }

  function hideOnboarding() {
    $('#nogna-dashboard').classList.remove('onboarding-active');
    $('#nogna-onboarding').classList.add('is-complete');
  }

  function notice(message, type) {
    const element = $('#nogna-notice');
    element.textContent = message;
    element.className = 'nogna-notice is-visible ' + type;
    window.setTimeout(() => element.classList.remove('is-visible'), 4000);
  }

  function showSection(name) {
    document.querySelectorAll('.nogna-section').forEach((section) => section.classList.remove('is-visible'));
    $('#nogna-section-' + name).classList.add('is-visible');
    document.querySelectorAll('.nogna-sidebar button').forEach((button) => button.classList.toggle('is-active', button.dataset.section === name));
    if (name === 'customers') loadCustomers();
  }

  function renderCustomers() {
    const rows = $('#nogna-customer-rows');
    const term = ($('#nogna-customer-search').value || '').toLowerCase();
    const customers = state.customers.filter((customer) => [customer.name, customer.email, customer.phone].join(' ').toLowerCase().includes(term));
    $('#nogna-customer-result-count').textContent = customers.length + ' customer' + (customers.length === 1 ? '' : 's');
    $('#nogna-customer-count').textContent = state.customers.length;
    if (!customers.length) {
      rows.innerHTML = '<tr><td colspan="5" class="nogna-table-empty">No customers found.</td></tr>';
      return;
    }
    rows.innerHTML = customers.map((customer) => '<tr>' +
      '<td><span class="nogna-customer-name">' + escapeHtml(customer.name) + '</span></td>' +
      '<td>' + escapeHtml(customer.email || '—') + '</td>' +
      '<td>' + escapeHtml(customer.phone || '—') + '</td>' +
      '<td>' + escapeHtml((customer.created_at || '').slice(0, 10) || '—') + '</td>' +
      '<td><div class="nogna-row-actions"><button data-edit="' + customer.id + '">Edit</button><button data-delete="' + customer.id + '">Delete</button></div></td>' +
      '</tr>').join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
  }

  async function loadCustomers() {
    if (!state.companyId) return;
    const cached = readCache('customers', state.companyId);
    if (cached) { state.customers = cached; renderCustomers(); }
    try {
      const response = await api('/companies/' + state.companyId + '/customers');
      state.customers = response.data || [];
      writeCache('customers', state.companyId, state.customers);
      renderCustomers();
    } catch (error) { if (!cached) notice(error.message, 'error'); }
  }

  function applyCompanies(companies) {
    if (!companies.length) { showOnboarding('welcome'); return; }
    hideOnboarding();
    const select = $('#nogna-company-select');
    select.innerHTML = companies.map((company) => '<option value="' + company.id + '">' + escapeHtml(company.name) + '</option>').join('');
    if (!companies.length) {
      select.innerHTML = '<option value="">No workspace</option>';
      notice('Create a company workspace before adding customers.', 'error');
      return;
    }
    state.companyId = companies[0].id;
    select.value = state.companyId;
    loadCustomers();
  }

  async function loadCompanies() {
    const cached = readCache('companies');
    if (cached) applyCompanies(cached);
    try {
      const response = await api('/companies');
      const companies = response.data || [];
      writeCache('companies', null, companies);
      applyCompanies(companies);
    } catch (error) { if (!cached) notice(error.message, 'error'); }
  }

  function openCompany() {
    const form = $('#nogna-company-form');
    form.reset();
    form.elements.base_currency.value = 'TZS';
    form.elements.timezone.value = 'Africa/Dar_es_Salaam';
    $('#nogna-company-modal').classList.add('is-open');
    $('#nogna-company-modal').setAttribute('aria-hidden', 'false');
    form.elements.name.focus();
  }

  function closeCompany() {
    $('#nogna-company-modal').classList.remove('is-open');
    $('#nogna-company-modal').setAttribute('aria-hidden', 'true');
  }

  function openCustomer(customer) {
    if (!state.companyId) {
      notice('Create a workspace before adding a customer.', 'error');
      openCompany();
      return;
    }
    state.editingId = customer ? customer.id : null;
    const form = $('#nogna-customer-form');
    form.reset();
    form.elements.id.value = customer ? customer.id : '';
    form.elements.name.value = customer ? customer.name : '';
    form.elements.email.value = customer ? customer.email || '' : '';
    form.elements.phone.value = customer ? customer.phone || '' : '';
    form.elements.tax_number.value = customer ? customer.tax_number || '' : '';
    form.elements.city.value = customer && customer.address ? customer.address.city || '' : '';
    form.elements.notes.value = customer ? customer.notes || '' : '';
    $('#nogna-customer-modal-title').textContent = customer ? 'Edit customer' : 'Add customer';
    $('#nogna-customer-modal').classList.add('is-open');
    $('#nogna-customer-modal').setAttribute('aria-hidden', 'false');
    form.elements.name.focus();
  }

  function closeCustomer() {
    $('#nogna-customer-modal').classList.remove('is-open');
    $('#nogna-customer-modal').setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('click', async (event) => {
    const sectionButton = event.target.closest('[data-section]');
    if (sectionButton && !sectionButton.disabled) showSection(sectionButton.dataset.section);
    if (event.target.closest('[data-start-onboarding]')) showOnboarding('identity');
    if (event.target.closest('[data-onboarding-back]')) showOnboarding(state.onboardingStep === 'contact' ? 'identity' : 'welcome');
    if (event.target.closest('[data-onboarding-next]')) {
      if (state.onboardingStep === 'welcome') showOnboarding('identity');
      else if (state.onboardingStep === 'identity') {
        if (!$('#nogna-onboarding-name').value.trim()) return notice('Enter your company name.', 'error');
        showOnboarding('contact');
      } else {
        const name = $('#nogna-onboarding-name').value.trim();
        const email = $('#nogna-contact-email').value.trim();
        api('/companies', { method: 'POST', body: JSON.stringify({ name, email, base_currency: 'TZS', timezone: 'Africa/Dar_es_Salaam' }) }).then(() => { localStorage.removeItem(cacheKey('companies')); notice('Workspace created.', 'success'); loadCompanies(); }).catch((error) => notice(error.message, 'error'));
      }
    }
    if (event.target.closest('[data-skip-onboarding]')) showOnboarding('identity');
    if (event.target.closest('[data-open-company]')) openCompany();
    if (event.target.closest('[data-close-company]')) closeCompany();
    if (event.target.closest('[data-open-customer]')) openCustomer();
    if (event.target.closest('[data-close-customer]')) closeCustomer();
    const editButton = event.target.closest('[data-edit]');
    if (editButton) openCustomer(state.customers.find((customer) => String(customer.id) === editButton.dataset.edit));
    const deleteButton = event.target.closest('[data-delete]');
    if (deleteButton && window.confirm('Delete this customer?')) {
      try { await api('/companies/' + state.companyId + '/customers/' + deleteButton.dataset.delete, { method: 'DELETE' }); notice('Customer deleted.', 'success'); await loadCustomers(); }
      catch (error) { notice(error.message, 'error'); }
    }
  });

  $('#nogna-company-select').addEventListener('change', async (event) => { state.companyId = event.target.value; await loadCustomers(); });
  $('#nogna-customer-search').addEventListener('input', renderCustomers);
  $('#nogna-company-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.name.value.trim();
    const payload = {
      name: name,
      slug: form.elements.slug.value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      base_currency: form.elements.base_currency.value.toUpperCase(),
      timezone: form.elements.timezone.value.trim()
    };
    try {
      await api('/companies', { method: 'POST', body: JSON.stringify(payload) });
      closeCompany();
      localStorage.removeItem(cacheKey('companies'));
      notice('Workspace created.', 'success');
      await loadCompanies();
    } catch (error) { notice(error.message, 'error'); }
  });

  $('#nogna-customer-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.companyId) return notice('Select a workspace first.', 'error');
    const form = event.target;
    const payload = { name: form.elements.name.value, email: form.elements.email.value, phone: form.elements.phone.value, tax_number: form.elements.tax_number.value, notes: form.elements.notes.value, address: { city: form.elements.city.value } };
    const id = form.elements.id.value;
    try {
      await api('/companies/' + state.companyId + '/customers' + (id ? '/' + id : ''), { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      closeCustomer(); notice(id ? 'Customer updated.' : 'Customer added.', 'success'); await loadCustomers();
    } catch (error) { notice(error.message, 'error'); }
  });

  loadCompanies();
}());
